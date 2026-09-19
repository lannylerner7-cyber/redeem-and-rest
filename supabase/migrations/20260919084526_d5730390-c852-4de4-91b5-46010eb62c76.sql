-- 1. Member PIN + freeze fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS withdrawal_pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_locked_until timestamptz,
  ADD COLUMN IF NOT EXISTS frozen_at timestamptz,
  ADD COLUMN IF NOT EXISTS frozen_reason text;

-- 2. Contact / feedback messages
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone can send a message" ON public.contact_messages;
CREATE POLICY "anyone can send a message" ON public.contact_messages
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(btrim(name)) BETWEEN 1 AND 120
    AND length(btrim(email)) BETWEEN 3 AND 200
    AND length(btrim(message)) BETWEEN 5 AND 2000
  );

DROP POLICY IF EXISTS "admins read messages" ON public.contact_messages;
CREATE POLICY "admins read messages" ON public.contact_messages
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins update messages" ON public.contact_messages;
CREATE POLICY "admins update messages" ON public.contact_messages
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. App settings (single row)
CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  alert_emails text[] NOT NULL DEFAULT '{}',
  from_name text NOT NULL DEFAULT 'ScousGiftCardExchange',
  reply_to text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins read settings" ON public.app_settings;
CREATE POLICY "admins read settings" ON public.app_settings
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "admins write settings" ON public.app_settings;
CREATE POLICY "admins write settings" ON public.app_settings
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS trg_app_settings_updated ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. PIN helpers
CREATE OR REPLACE FUNCTION public.pin_hash(p_user_id uuid, p_pin text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public, extensions AS $$
  SELECT encode(extensions.digest(p_user_id::text || ':' || p_pin, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.set_withdrawal_pin(p_pin text, p_current_pin text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_row public.profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  IF p_pin !~ '^\d{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits'; END IF;
  SELECT * INTO v_row FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_row.withdrawal_pin_hash IS NOT NULL THEN
    IF p_current_pin IS NULL OR public.pin_hash(v_uid, p_current_pin) <> v_row.withdrawal_pin_hash THEN
      RAISE EXCEPTION 'Current PIN is not correct';
    END IF;
  END IF;
  UPDATE public.profiles
     SET withdrawal_pin_hash = public.pin_hash(v_uid, p_pin),
         pin_attempts = 0, pin_locked_until = NULL
   WHERE id = v_uid;
  RETURN true;
END; $$;

-- Reset path used after an emailed code is verified server-side
CREATE OR REPLACE FUNCTION public.force_set_withdrawal_pin(p_user_id uuid, p_pin text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_pin !~ '^\d{4}$' THEN RAISE EXCEPTION 'PIN must be 4 digits'; END IF;
  UPDATE public.profiles
     SET withdrawal_pin_hash = public.pin_hash(p_user_id, p_pin),
         pin_attempts = 0, pin_locked_until = NULL
   WHERE id = p_user_id;
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.force_set_withdrawal_pin(uuid, text) FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.withdrawal_pin_status()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'has_pin', (withdrawal_pin_hash IS NOT NULL),
    'locked_until', pin_locked_until,
    'frozen', (frozen_at IS NOT NULL),
    'frozen_reason', frozen_reason
  ) FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Withdrawal now requires the PIN
DROP FUNCTION IF EXISTS public.create_withdrawal(uuid, numeric);

CREATE OR REPLACE FUNCTION public.create_withdrawal(p_bank_account_id uuid, p_amount numeric, p_pin text)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_bank public.bank_accounts%ROWTYPE; v_fee numeric := 300;
        v_row public.withdrawals%ROWTYPE; v_p public.profiles%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;

  SELECT * INTO v_p FROM public.profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF v_p.frozen_at IS NOT NULL THEN
    RAISE EXCEPTION 'Your account is frozen. Contact support.';
  END IF;
  IF v_p.withdrawal_pin_hash IS NULL THEN
    RAISE EXCEPTION 'Set your withdrawal PIN first';
  END IF;
  IF v_p.pin_locked_until IS NOT NULL AND v_p.pin_locked_until > now() THEN
    RAISE EXCEPTION 'Too many wrong PIN tries. Try again later.';
  END IF;
  IF public.pin_hash(v_uid, COALESCE(p_pin, '')) <> v_p.withdrawal_pin_hash THEN
    UPDATE public.profiles
       SET pin_attempts = v_p.pin_attempts + 1,
           pin_locked_until = CASE WHEN v_p.pin_attempts + 1 >= 5 THEN now() + interval '30 minutes' ELSE pin_locked_until END
     WHERE id = v_uid;
    RAISE EXCEPTION 'Wrong withdrawal PIN';
  END IF;
  UPDATE public.profiles SET pin_attempts = 0, pin_locked_until = NULL WHERE id = v_uid;

  IF p_amount < 1000 THEN RAISE EXCEPTION 'Minimum withdrawal is 1,000 naira'; END IF;
  SELECT * INTO v_bank FROM public.bank_accounts WHERE id = p_bank_account_id AND user_id = v_uid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Bank account not found'; END IF;

  INSERT INTO public.withdrawals (user_id, bank_account_id, bank_snapshot, amount, fee, net_amount, status)
  VALUES (v_uid, v_bank.id,
    jsonb_build_object('bank_name', v_bank.bank_name, 'account_number', v_bank.account_number, 'account_name', v_bank.account_name),
    p_amount, v_fee, p_amount - v_fee, 'requested')
  RETURNING * INTO v_row;

  PERFORM public.apply_wallet_change(v_uid, 'debit', p_amount, 'withdrawal', v_row.id,
    'Withdrawal to ' || v_bank.bank_name);
  RETURN v_row;
END; $$;

-- 6. Trade cap + frozen guard
CREATE OR REPLACE FUNCTION public.create_trade(p_variant_id uuid, p_face_value numeric, p_ecode text DEFAULT NULL::text, p_ecode_pin text DEFAULT NULL::text, p_note text DEFAULT NULL::text)
RETURNS public.trades LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_v public.gift_card_variants%ROWTYPE;
        v_b public.gift_card_brands%ROWTYPE; v_r public.gift_card_regions%ROWTYPE;
        v_row public.trades%ROWTYPE; v_dup boolean := false; v_frozen timestamptz;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT frozen_at INTO v_frozen FROM public.profiles WHERE id = v_uid;
  IF v_frozen IS NOT NULL THEN RAISE EXCEPTION 'Your account is frozen. Contact support.'; END IF;
  IF p_face_value > 5000 THEN
    RAISE EXCEPTION 'Cards above 5,000 must be arranged with support';
  END IF;
  SELECT * INTO v_v FROM public.gift_card_variants WHERE id = p_variant_id AND is_active;
  IF NOT FOUND THEN RAISE EXCEPTION 'This card is not available right now'; END IF;
  IF p_face_value < v_v.min_value OR p_face_value > v_v.max_value THEN
    RAISE EXCEPTION 'Enter an amount between % and %', v_v.min_value, v_v.max_value;
  END IF;
  SELECT * INTO v_b FROM public.gift_card_brands WHERE id = v_v.brand_id;
  SELECT * INTO v_r FROM public.gift_card_regions WHERE id = v_v.region_id;
  IF NOT v_b.is_visible THEN RAISE EXCEPTION 'This card is not available right now'; END IF;

  IF p_ecode IS NOT NULL AND length(trim(p_ecode)) > 0 THEN
    SELECT EXISTS (SELECT 1 FROM public.trades WHERE ecode = trim(p_ecode)) INTO v_dup;
  END IF;

  INSERT INTO public.trades (
    user_id, brand_id, region_id, variant_id, brand_name, region_code, card_type,
    face_value, currency, rate_at_submit, expected_payout, status, ecode, ecode_pin,
    user_note, flagged_duplicate
  ) VALUES (
    v_uid, v_b.id, v_r.id, v_v.id, v_b.name, v_r.code, v_v.card_type,
    p_face_value, v_r.currency, v_v.rate_naira, round(p_face_value * v_v.rate_naira, 2), 'pending',
    NULLIF(trim(COALESCE(p_ecode,'')),''), NULLIF(trim(COALESCE(p_ecode_pin,'')),''),
    NULLIF(trim(COALESCE(p_note,'')),''), v_dup
  ) RETURNING * INTO v_row;

  RETURN v_row;
END; $$;

-- 7. Freeze / unfreeze
CREATE OR REPLACE FUNCTION public.admin_set_frozen(p_user_id uuid, p_frozen boolean, p_reason text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  UPDATE public.profiles
     SET frozen_at = CASE WHEN p_frozen THEN now() ELSE NULL END,
         frozen_reason = CASE WHEN p_frozen THEN p_reason ELSE NULL END
   WHERE id = p_user_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (p_user_id,
    CASE WHEN p_frozen THEN 'Account frozen' ELSE 'Account unfrozen' END,
    COALESCE(p_reason, CASE WHEN p_frozen THEN 'Contact support for details.' ELSE 'You can trade and withdraw again.' END),
    'account', '/app');
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after)
  VALUES (auth.uid(), CASE WHEN p_frozen THEN 'user.freeze' ELSE 'user.unfreeze' END, 'user', p_user_id,
    jsonb_build_object('reason', p_reason));
  RETURN true;
END; $$;

-- 8. Stats include unread messages
CREATE OR REPLACE FUNCTION public.admin_platform_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v jsonb;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT jsonb_build_object(
    'member_balance', COALESCE((SELECT sum(balance_naira) FROM public.wallets),0),
    'held', COALESCE((SELECT sum(held_naira) FROM public.wallets),0),
    'redeemed_value', COALESCE((SELECT sum(paid_amount) FROM public.trades WHERE status IN ('successful','partially_paid')),0),
    'paid_out', COALESCE((SELECT sum(net_amount) FROM public.withdrawals WHERE status = 'paid'),0),
    'fees', COALESCE((SELECT sum(fee) FROM public.withdrawals WHERE status = 'paid'),0),
    'pending_trades', (SELECT count(*) FROM public.trades WHERE status = 'pending'),
    'pending_withdrawals', (SELECT count(*) FROM public.withdrawals WHERE status IN ('requested','approved')),
    'unread_messages', (SELECT count(*) FROM public.contact_messages WHERE read_at IS NULL),
    'members', (SELECT count(*) FROM public.profiles WHERE deleted_at IS NULL),
    'trades_today', (SELECT count(*) FROM public.trades WHERE created_at >= date_trunc('day', now())),
    'trades_week', (SELECT count(*) FROM public.trades WHERE created_at >= now() - interval '7 days')
  ) INTO v;
  RETURN v;
END; $$;

REVOKE ALL ON FUNCTION public.pin_hash(uuid, text) FROM public, anon;
