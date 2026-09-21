ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS locked_naira numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

UPDATE public.profiles
   SET referral_code = upper(substr(replace(id::text,'-',''), 1, 8))
 WHERE referral_code IS NULL;

CREATE OR REPLACE FUNCTION public.lock_bonus(p_user_id uuid, p_amount numeric, p_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  PERFORM public.apply_wallet_change(p_user_id, 'credit', p_amount, 'bonus', NULL, p_note);
  UPDATE public.wallets SET locked_naira = locked_naira + abs(p_amount) WHERE user_id = p_user_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (p_user_id, 'Bonus added', p_note || ' — it unlocks after your first redeemed card.', 'wallet', '/app');
END; $$;
REVOKE ALL ON FUNCTION public.lock_bonus(uuid, numeric, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.unlock_bonus(p_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_locked numeric;
BEGIN
  SELECT locked_naira INTO v_locked FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF COALESCE(v_locked,0) <= 0 THEN RETURN; END IF;
  UPDATE public.wallets SET locked_naira = 0 WHERE user_id = p_user_id;
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (p_user_id, 'Bonus unlocked', 'Your bonus is now available to withdraw.', 'wallet', '/app');
END; $$;
REVOKE ALL ON FUNCTION public.unlock_bonus(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ref text; v_referrer uuid;
BEGIN
  v_ref := upper(trim(COALESCE(NEW.raw_user_meta_data->>'referral_code','')));
  IF v_ref <> '' THEN
    SELECT id INTO v_referrer FROM public.profiles WHERE referral_code = v_ref;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, phone, referral_code, referred_by)
  VALUES (NEW.id, COALESCE(NEW.email,''), COALESCE(NEW.raw_user_meta_data->>'full_name',''),
          NEW.raw_user_meta_data->>'phone',
          upper(substr(replace(NEW.id::text,'-',''), 1, 8)), v_referrer)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;

  PERFORM public.lock_bonus(NEW.id, 5000, 'Welcome bonus');

  IF v_referrer IS NOT NULL THEN
    PERFORM public.lock_bonus(NEW.id, 2000, 'Referral bonus');
    PERFORM public.lock_bonus(v_referrer, 2000, 'Referral bonus');
  END IF;

  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.admin_review_trade(p_trade_id uuid, p_status trade_status, p_paid numeric DEFAULT NULL::numeric, p_note text DEFAULT NULL::text)
RETURNS trades LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_trade public.trades%ROWTYPE; v_pay numeric := 0;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT * INTO v_trade FROM public.trades WHERE id = p_trade_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Trade not found'; END IF;
  IF v_trade.status <> 'pending' THEN RAISE EXCEPTION 'This trade was already reviewed'; END IF;

  IF p_status = 'successful' THEN v_pay := v_trade.expected_payout;
  ELSIF p_status = 'partially_paid' THEN
    v_pay := COALESCE(p_paid, 0);
    IF v_pay <= 0 OR v_pay > v_trade.expected_payout THEN RAISE EXCEPTION 'Invalid partial amount'; END IF;
  END IF;

  UPDATE public.trades SET status = p_status, paid_amount = v_pay, admin_note = p_note,
    reviewed_by = auth.uid(), reviewed_at = now()
  WHERE id = p_trade_id RETURNING * INTO v_trade;

  IF v_pay > 0 THEN
    PERFORM public.apply_wallet_change(v_trade.user_id, 'credit', v_pay, 'trade', v_trade.id,
      v_trade.brand_name || ' ' || v_trade.region_code || ' card redeemed');
    PERFORM public.unlock_bonus(v_trade.user_id);
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (v_trade.user_id,
    CASE WHEN v_pay > 0 THEN 'Gift card redeemed' ELSE 'Gift card declined' END,
    CASE WHEN v_pay > 0 THEN 'Your gift card has been redeemed successfully. Check your balance now.'
         ELSE COALESCE(p_note, 'Your card could not be redeemed.') END,
    CASE WHEN v_pay > 0 THEN 'trade_success' ELSE 'trade_failed' END,
    '/app/history/' || v_trade.id);

  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after)
  VALUES (auth.uid(), 'trade.review', 'trade', v_trade.id,
    jsonb_build_object('status', p_status, 'paid', v_pay, 'note', p_note));

  RETURN v_trade;
END; $$;

CREATE OR REPLACE FUNCTION public.create_withdrawal(p_bank_account_id uuid, p_amount numeric, p_pin text)
RETURNS withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_uid uuid := auth.uid(); v_bank public.bank_accounts%ROWTYPE; v_fee numeric := 300;
        v_row public.withdrawals%ROWTYPE; v_p public.profiles%ROWTYPE; v_w public.wallets%ROWTYPE;
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

  SELECT * INTO v_w FROM public.wallets WHERE user_id = v_uid;
  IF p_amount > COALESCE(v_w.balance_naira,0) - COALESCE(v_w.locked_naira,0) THEN
    RAISE EXCEPTION 'Your bonus stays locked until your first card is redeemed';
  END IF;

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