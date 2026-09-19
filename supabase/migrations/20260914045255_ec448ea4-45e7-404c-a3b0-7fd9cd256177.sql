REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

DROP POLICY "brands_public_read" ON public.gift_card_brands;
CREATE POLICY "brands_anon_read" ON public.gift_card_brands FOR SELECT TO anon USING (is_visible);
CREATE POLICY "brands_auth_read" ON public.gift_card_brands FOR SELECT TO authenticated USING (is_visible OR public.is_admin());

DROP POLICY "variants_public_read" ON public.gift_card_variants;
CREATE POLICY "variants_anon_read" ON public.gift_card_variants FOR SELECT TO anon USING (is_active);
CREATE POLICY "variants_auth_read" ON public.gift_card_variants FOR SELECT TO authenticated USING (is_active OR public.is_admin());

DROP POLICY "banners_public_read" ON public.campaign_banners;
CREATE POLICY "banners_anon_read" ON public.campaign_banners FOR SELECT TO anon USING (is_active);
CREATE POLICY "banners_auth_read" ON public.campaign_banners FOR SELECT TO authenticated USING (is_active OR public.is_admin());