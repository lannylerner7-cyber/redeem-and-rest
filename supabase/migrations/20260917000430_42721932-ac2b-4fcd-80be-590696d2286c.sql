
CREATE OR REPLACE FUNCTION public.create_trade(
  p_variant_id uuid, p_face_value numeric, p_ecode text DEFAULT NULL,
  p_ecode_pin text DEFAULT NULL, p_note text DEFAULT NULL
) RETURNS public.trades
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_v public.gift_card_variants%ROWTYPE;
        v_b public.gift_card_brands%ROWTYPE; v_r public.gift_card_regions%ROWTYPE;
        v_row public.trades%ROWTYPE; v_dup boolean := false;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
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
REVOKE EXECUTE ON FUNCTION public.create_trade(uuid, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_trade(uuid, numeric, text, text, text) TO authenticated;

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
    'members', (SELECT count(*) FROM public.profiles WHERE deleted_at IS NULL),
    'trades_today', (SELECT count(*) FROM public.trades WHERE created_at >= date_trunc('day', now())),
    'trades_week', (SELECT count(*) FROM public.trades WHERE created_at >= now() - interval '7 days')
  ) INTO v;
  RETURN v;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_platform_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_stats() TO authenticated;
