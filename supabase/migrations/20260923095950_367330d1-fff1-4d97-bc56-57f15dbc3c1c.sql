-- 1. New brands
with incoming(name, slug, logo_url, sort_order) as (
  values
  ('Wayfair','wayfair','https://pics.paypal.com/00/c/gifts/us/wfair.png',210),
  ('Ulta Beauty','ulta','https://www.paypalobjects.com/digitalassets/c/gifts/us/ulta-card-art.png',220),
  ('Twitch','twitch','https://pics.paypal.com/00/c/gifts/us/twitchcardartwinnie.png',230),
  ('Subway','subway','https://pics.paypal.com/00/c/gifts/us/subcard.jpg',240),
  ('KFC','kfc','https://pics.paypal.com/00/c/gifts/us/kfccard.jpg',250),
  ('Southwest Airlines','southwest','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/s/o/southwest.jpg',260),
  ('Sam''s Club','sams-club','https://pics.paypal.com/00/c/gifts/us/samsclub.png',270),
  ('Roblox','roblox','https://pics.paypal.com/00/c/gifts/us/roblox26.png',280),
  ('REI','rei','https://pics.paypal.com/00/c/gifts/us/rei.jpeg',290),
  ('Papa Murphy''s','papa-murphys','https://pics.paypal.com/00/c/gifts/us/papamurphys.jpeg',300),
  ('Paramount+','paramount-plus','https://pics.paypal.com/00/c/gifts/us/paramount_plus.png',310),
  ('Panda Express','panda-express','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/p/a/pandaexpress_giftcard_xxlweb.png',320),
  ('Old Navy','old-navy','https://pics.paypal.com/00/c/gifts/us/oldnavy618.png',330),
  ('Nintendo eShop','nintendo','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/n/i/nintendo_eshop.png',340),
  ('Microsoft 365 Personal','microsoft-365-personal','https://pics.paypal.com/00/c/gifts/us/microsoft365personal3.png',350),
  ('Microsoft 365 Business','microsoft-365-business','https://pics.paypal.com/00/c/gifts/us/microsoft365businessstandard.png',360),
  ('Meta Quest','meta-quest','https://pics.paypal.com/00/c/gifts/us/metaquest.png',370),
  ('Lyft','lyft','https://pics.paypal.com/00/c/gifts/us/lyft.png',380),
  ('Kohl''s','kohls','https://pics.paypal.com/00/c/gifts/us/kohls23.png',390),
  ('JCPenney','jcpenney','https://pics.paypal.com/00/c/gifts/us/jcpenney1.jpg',400),
  ('Instacart','instacart','https://pics.paypal.com/00/c/gifts/us/icartcardart.jpg',410),
  ('IKEA','ikea','https://pics.paypal.com/00/c/gifts/us/ikeacardart.png',420),
  ('Hulu','hulu','https://pics.paypal.com/00/c/gifts/us/hulu.jpg',430),
  ('Hotels.com','hotels-com','https://pics.paypal.com/00/c/gifts/us/hotels.png',440),
  ('The Home Depot','home-depot','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/h/o/homedepot_1_1_1_2.jpg',450),
  ('H&M','h-and-m','https://www.paypalobjects.com/digitalassets/c/gifts/us/hm_gcard.png',460),
  ('Google Workspace','google-workspace','https://content.blackhawknetwork.com/gcmimages/product/xxlarge/98YMB6WG4998QJPXV1JFT30288_0108202518:14:27.PNG',470),
  ('GAP','gap','https://pics.paypal.com/00/c/gifts/us/gap618.png',480),
  ('GameStop','gamestop','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/g/a/gamestop.jpg',490),
  ('Etsy','etsy','https://pics.paypal.com/00/c/gifts/us/etsy.png',500),
  ('Domino''s','dominos','https://pics.paypal.com/00/c/gifts/us/dominocardart.png',510),
  ('Disney','disney','https://pics.paypal.com/00/c/gifts/us/disneygc.png',520),
  ('Delta Air Lines','delta','https://pics.paypal.com/00/c/gifts/us/deltawhite1.png',530),
  ('CVS Pharmacy','cvs','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/c/v/cvs_pharmacy.png',540),
  ('Chewy','chewy','https://pics.paypal.com/00/c/gifts/us/chewy23.png',550),
  ('Belk','belk','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/b/e/belk_1.jpg',560),
  ('Bass Pro Shops','bass-pro','https://pics.paypal.com/00/c/gifts/us/basspro2026.png',570),
  ('babyGap','babygap','https://pics.paypal.com/00/c/gifts/us/babygap26.png',580),
  ('Applebee''s','applebees','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/a/p/applebee_s_8.png',590),
  ('Amtrak','amtrak','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/category/amtrak_xxlweb.png',600),
  ('Airbnb','airbnb','https://pics.paypal.com/00/c/gifts/us/image002.jpg',610),
  ('Adidas','adidas','https://pics.paypal.com/00/c/gifts/us/adidas2025.png',620),
  ('1-800-Flowers','1800flowers','https://pics.paypal.com/00/c/gifts/us/1800flowers.png',630),
  ('Uber & Uber Eats','uber-eats','https://pics.paypal.com/00/c/gifts/us/newubereats.png',640),
  ('DoorDash','doordash','https://pics.paypal.com/00/c/gifts/us/doordash.png',650),
  ('Lowe''s','lowes','https://www.paypalobjects.com/digitalassets/c/gifts/media/catalog/product/l/o/lowes.png',660)
)
insert into public.gift_card_brands (name, slug, logo_url, sort_order, is_visible)
select i.name, i.slug, i.logo_url, i.sort_order, true
from incoming i
where not exists (select 1 from public.gift_card_brands b where b.slug = i.slug);

-- keep artwork fresh for any slug that already existed
with incoming(slug, logo_url) as (
  values ('roblox','https://pics.paypal.com/00/c/gifts/us/roblox26.png')
)
update public.gift_card_brands b set logo_url = i.logo_url, updated_at = now()
from incoming i where b.slug = i.slug and b.logo_url is null;

-- 2. US physical + e-code rows for every brand that has none
insert into public.gift_card_variants (brand_id, region_id, card_type, min_value, max_value, rate_naira, is_active)
select b.id, r.id, t.card_type::public.card_type, 10, 5000, t.rate, true
from public.gift_card_brands b
cross join (select id from public.gift_card_regions where code = 'US') r
cross join (values ('physical', 1100::numeric), ('ecode', 1150::numeric)) as t(card_type, rate)
where not exists (
  select 1 from public.gift_card_variants v
  where v.brand_id = b.id and v.region_id = r.id and v.card_type = t.card_type::public.card_type
);

-- 3. Widen the accepted card value range everywhere
update public.gift_card_variants
set min_value = 10, max_value = 5000, updated_at = now()
where max_value < 5000 or min_value > 10;

-- 4. Live updates for market changes
alter table public.gift_card_brands replica identity full;
alter table public.gift_card_variants replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.gift_card_brands;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.gift_card_variants;
  exception when duplicate_object then null;
  end;
end $$;