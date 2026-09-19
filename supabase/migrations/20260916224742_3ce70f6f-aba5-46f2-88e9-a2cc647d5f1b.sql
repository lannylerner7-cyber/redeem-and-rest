
-- ============ BANKS ============
CREATE TABLE public.banks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  is_digital boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banks TO anon, authenticated;
GRANT ALL ON public.banks TO service_role;
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banks readable by anon" ON public.banks FOR SELECT TO anon USING (is_active);
CREATE POLICY "banks readable by users" ON public.banks FOR SELECT TO authenticated USING (is_active OR public.is_admin());
CREATE POLICY "banks managed by admin" ON public.banks FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.banks (name, code, is_digital, sort_order) VALUES
('Access Bank','044',false,10),('Citibank Nigeria','023',false,20),('Ecobank Nigeria','050',false,30),
('Fidelity Bank','070',false,40),('First Bank of Nigeria','011',false,50),('First City Monument Bank (FCMB)','214',false,60),
('Globus Bank','00103',false,70),('Guaranty Trust Bank (GTBank)','058',false,80),('Heritage Bank','030',false,90),
('Jaiz Bank','301',false,100),('Keystone Bank','082',false,110),('Lotus Bank','303',false,120),
('Optimus Bank','107',false,130),('Parallex Bank','104',false,140),('Polaris Bank','076',false,150),
('Premium Trust Bank','105',false,160),('Providus Bank','101',false,170),('Stanbic IBTC Bank','221',false,180),
('Standard Chartered Bank','068',false,190),('Sterling Bank','232',false,200),('SunTrust Bank','100',false,210),
('Titan Trust Bank','102',false,220),('Union Bank of Nigeria','032',false,230),('United Bank for Africa (UBA)','033',false,240),
('Unity Bank','215',false,250),('Wema Bank','035',false,260),('Zenith Bank','057',false,270),
('Opay','999992',true,300),('PalmPay','999991',true,310),('Moniepoint MFB','50515',true,320),
('Kuda Microfinance Bank','50211',true,330),('VFD Microfinance Bank','566',true,340),('Rubies MFB','125',true,350),
('Sparkle Microfinance Bank','51310',true,360),('FairMoney Microfinance Bank','51318',true,370),
('Carbon (One Finance)','565',true,380),('Mintyn Digital Bank','50304',true,390),('Paga','100002',true,400),
('Eyowo','50126',true,410),('9 Payment Service Bank','120001',true,420),('MoMo Payment Service Bank','120003',true,430),
('SmartCash Payment Service Bank','120004',true,440),('PocketApp (Piggyvest)','00716',true,450),
('Raven Bank','50746',true,460),('Safe Haven MFB','51113',true,470);

-- ============ TRADE EXTRAS ============
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS user_note text;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS flagged_duplicate boolean NOT NULL DEFAULT false;
ALTER TABLE public.bank_accounts ADD COLUMN IF NOT EXISTS bank_id uuid REFERENCES public.banks(id);

-- ============ MONEY: credit helper ============
CREATE OR REPLACE FUNCTION public.apply_wallet_change(
  p_user_id uuid, p_type wallet_txn_type, p_amount numeric,
  p_reference_type text, p_reference_id uuid, p_note text
) RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_wallet public.wallets%ROWTYPE; v_new numeric;
BEGIN
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id) VALUES (p_user_id) RETURNING * INTO v_wallet;
  END IF;
  IF p_type IN ('credit','release') THEN v_new := v_wallet.balance_naira + abs(p_amount);
  ELSE v_new := v_wallet.balance_naira - abs(p_amount);
  END IF;
  IF v_new < 0 THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  UPDATE public.wallets SET balance_naira = v_new WHERE id = v_wallet.id;
  INSERT INTO public.wallet_transactions (wallet_id, user_id, type, amount, balance_after, reference_type, reference_id, note)
  VALUES (v_wallet.id, p_user_id, p_type, abs(p_amount), v_new, p_reference_type, p_reference_id, p_note);
  RETURN v_new;
END; $$;
REVOKE EXECUTE ON FUNCTION public.apply_wallet_change(uuid, wallet_txn_type, numeric, text, uuid, text) FROM PUBLIC, anon, authenticated;

-- ============ ADMIN: review a trade ============
CREATE OR REPLACE FUNCTION public.admin_review_trade(
  p_trade_id uuid, p_status trade_status, p_paid numeric DEFAULT NULL, p_note text DEFAULT NULL
) RETURNS public.trades
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
REVOKE EXECUTE ON FUNCTION public.admin_review_trade(uuid, trade_status, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_review_trade(uuid, trade_status, numeric, text) TO authenticated;

-- ============ ADMIN: manual wallet adjust ============
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(p_user_id uuid, p_amount numeric, p_note text)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_new numeric;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  IF p_amount = 0 THEN RAISE EXCEPTION 'Amount required'; END IF;
  v_new := public.apply_wallet_change(p_user_id,
    CASE WHEN p_amount > 0 THEN 'credit'::wallet_txn_type ELSE 'debit'::wallet_txn_type END,
    abs(p_amount), 'manual', NULL, p_note);
  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (p_user_id, CASE WHEN p_amount > 0 THEN 'Wallet credited' ELSE 'Wallet debited' END,
    COALESCE(p_note,''), 'wallet', '/app');
  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after)
  VALUES (auth.uid(), 'wallet.adjust', 'user', p_user_id, jsonb_build_object('amount', p_amount, 'note', p_note));
  RETURN v_new;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_wallet(uuid, numeric, text) TO authenticated;

-- ============ MEMBER: request withdrawal (instant debit) ============
CREATE OR REPLACE FUNCTION public.create_withdrawal(p_bank_account_id uuid, p_amount numeric)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_bank public.bank_accounts%ROWTYPE; v_fee numeric := 300;
        v_row public.withdrawals%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
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
REVOKE EXECUTE ON FUNCTION public.create_withdrawal(uuid, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(uuid, numeric) TO authenticated;

-- ============ ADMIN: withdrawal decision ============
CREATE OR REPLACE FUNCTION public.admin_withdrawal_decision(p_id uuid, p_status withdrawal_status, p_note text DEFAULT NULL)
RETURNS public.withdrawals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_row public.withdrawals%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Not authorised'; END IF;
  SELECT * INTO v_row FROM public.withdrawals WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_row.status IN ('paid','cancelled') THEN RAISE EXCEPTION 'Already closed'; END IF;

  UPDATE public.withdrawals SET status = p_status, admin_note = p_note,
    processed_by = auth.uid(), processed_at = now() WHERE id = p_id RETURNING * INTO v_row;

  IF p_status = 'cancelled' THEN
    PERFORM public.apply_wallet_change(v_row.user_id, 'credit', v_row.amount, 'withdrawal', v_row.id,
      'Withdrawal declined - refund');
  END IF;

  INSERT INTO public.notifications (user_id, title, body, type, link)
  VALUES (v_row.user_id,
    CASE p_status WHEN 'paid' THEN 'Withdrawal paid' WHEN 'cancelled' THEN 'Withdrawal declined' ELSE 'Withdrawal approved' END,
    COALESCE(p_note, ''), 'withdrawal', '/app/withdraw');

  INSERT INTO public.admin_audit_log (actor_id, action, target_type, target_id, after)
  VALUES (auth.uid(), 'withdrawal.' || p_status, 'withdrawal', v_row.id, jsonb_build_object('note', p_note));
  RETURN v_row;
END; $$;
REVOKE EXECUTE ON FUNCTION public.admin_withdrawal_decision(uuid, withdrawal_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_withdrawal_decision(uuid, withdrawal_status, text) TO authenticated;

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;
