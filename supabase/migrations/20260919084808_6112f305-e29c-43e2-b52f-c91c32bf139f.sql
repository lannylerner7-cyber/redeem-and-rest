ALTER TYPE public.otp_purpose ADD VALUE IF NOT EXISTS 'pin';

REVOKE ALL ON FUNCTION public.set_withdrawal_pin(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.withdrawal_pin_status() FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal(uuid, numeric, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_set_frozen(uuid, boolean, text) FROM anon;
REVOKE ALL ON FUNCTION public.pin_hash(uuid, text) FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION public.set_withdrawal_pin(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdrawal_pin_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal(uuid, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_frozen(uuid, boolean, text) TO authenticated;
