-- F0-13  Frödata.
--
-- Regeln som styr innehållet: varje tabell som skyddas av RLS måste ha rader,
-- och minst två ägare måste finnas. Utan rader passerar både "syns" och
-- "syns inte", och åtkomstproven sover.
--
-- Fasta UUID:n så att proven kan peka på en rad utan att först leta upp den.
-- Prefixet säger vad raden är: a1 = användare, b1 = bibliotek, c1 = projekt.

-- ---------- två konton ----------

-- GoTrue laser flera token-kolumner som text och kan inte hantera null i dem.
-- Utan tomstrangarna nedan svarar inloggningen "Database error querying schema".
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
)
values
  ('00000000-0000-0000-0000-000000000000',
   'a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
   'joakim@exempel.test', crypt('provlosenord', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000',
   'a1000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
   'annan@exempel.test', crypt('provlosenord', gen_salt('bf')),
   now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}',
   '', '', '', '', '', '', '', '');

-- Utan identitet hittar GoTrue ingen inloggningsmetod for kontot.
insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id, u.id::text, 'email',
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  now(), now(), now()
from auth.users u
where u.id in (
  'a1000000-0000-4000-8000-000000000001',
  'a1000000-0000-4000-8000-000000000002'
);

insert into profiler (id, namn) values
  ('a1000000-0000-4000-8000-000000000001', 'Joakim'),
  ('a1000000-0000-4000-8000-000000000002', 'Annan byggare');

insert into inbjudningskod (kod, skapad_av) values
  ('ELSCHEMA-2026', 'a1000000-0000-4000-8000-000000000001');

-- ---------- bibliotek: systemets rader (agare is null) ----------

-- En liten provstyrenhet. Den riktiga MaxxECU Race matas in i F1-03.
insert into enhetsmall (id, agare, fabrikat, modell, typ, max_strom_a, can_terminerad, anteckning)
values
  ('b1000000-0000-4000-8000-000000000001', null, 'Prov', 'Styrenhet 8', 'styrenhet',
   null, true, 'Frödata. Ersätts av riktiga pinouter i fas 1.'),
  ('b1000000-0000-4000-8000-000000000002', null, 'Prov', 'PDM 4', 'pdm',
   40.00, false, 'Frödata. Enhetstaket 40 A är lägre än kanalernas summa med flit.');

insert into kontaktdonsmall (id, enhetsmall_id, beteckning, poler) values
  ('b1000000-0000-4000-8000-000000000011', 'b1000000-0000-4000-8000-000000000001', 'Connector 1', 8),
  ('b1000000-0000-4000-8000-000000000012', 'b1000000-0000-4000-8000-000000000002', 'Connector 1', 6);

insert into stiftmall (id, kontaktdonsmall_id, position, storlek, max_strom_a) values
  ('b1000000-0000-4000-8000-000000000021', 'b1000000-0000-4000-8000-000000000011', 'A1', 'liten', 15.00),
  ('b1000000-0000-4000-8000-000000000022', 'b1000000-0000-4000-8000-000000000011', 'A2', 'liten', 15.00),
  ('b1000000-0000-4000-8000-000000000023', 'b1000000-0000-4000-8000-000000000011', 'A3', 'liten', 15.00),
  ('b1000000-0000-4000-8000-000000000024', 'b1000000-0000-4000-8000-000000000011', 'A4', 'stor',  25.00),
  ('b1000000-0000-4000-8000-000000000025', 'b1000000-0000-4000-8000-000000000012', 'B1', 'stor',  25.00),
  ('b1000000-0000-4000-8000-000000000026', 'b1000000-0000-4000-8000-000000000012', 'B2', 'stor',  25.00),
  ('b1000000-0000-4000-8000-000000000027', 'b1000000-0000-4000-8000-000000000012', 'B3', 'stor',  25.00);

insert into portmall (id, enhetsmall_id, beteckning, riktning, max_strom_a, anteckning) values
  ('b1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000001', 'INJ 1', 'ut', 5.00, null),
  ('b1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000001', 'AIN 1', 'in', null, null),
  -- Delad port: samma stift bär två roller. C5, som i TACH / GP OUT 8.
  ('b1000000-0000-4000-8000-000000000033', 'b1000000-0000-4000-8000-000000000001', 'GP OUT 1 / DIN 3', 'ut', 1.50,
   'Delad roll. Vald roll avgör vad som får kopplas.'),
  ('b1000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000001', 'SENSOR GND', 'jord', null, null),
  -- PDM-kanal på flera stift. B-011: OUT 1 sitter på 1, 10 och 18 i verkligheten.
  ('b1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000002', 'OUT 1', 'ut', 25.00,
   'Kanalen sitter på tre stift.');

insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000031', id, true
  from signaltyp where nyckel = 'injektorutgang';
insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000042', 'b1000000-0000-4000-8000-000000000032', id, true
  from signaltyp where nyckel = 'analog_in';
insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000043', 'b1000000-0000-4000-8000-000000000033', id, true
  from signaltyp where nyckel = 'lagsidesdrivare';
insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000044', 'b1000000-0000-4000-8000-000000000033', id, false
  from signaltyp where nyckel = 'digital_in';
insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000045', 'b1000000-0000-4000-8000-000000000034', id, true
  from signaltyp where nyckel = 'sensorjord';
insert into portroll (id, portmall_id, signaltyp_id, ar_standard)
select 'b1000000-0000-4000-8000-000000000046', 'b1000000-0000-4000-8000-000000000035', id, true
  from signaltyp where nyckel = 'hogsidesdrivare';

insert into portstift (portmall_id, stiftmall_id) values
  ('b1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000021'),
  ('b1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000022'),
  ('b1000000-0000-4000-8000-000000000033', 'b1000000-0000-4000-8000-000000000023'),
  ('b1000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000024'),
  -- tre stift, en kanal
  ('b1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000025'),
  ('b1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000026'),
  ('b1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000027');

-- Egna namn, inte bibliotekets. Frödata ska inte kollidera med
-- startbiblioteket (F1-09) och proven ska inte falla för att någon byter namn
-- på en riktig komponentmall.
insert into komponentmall (id, agare, namn, kategori) values
  ('b1000000-0000-4000-8000-000000000051', null, 'Provinjektor', 'bransle'),
  ('b1000000-0000-4000-8000-000000000052', null, 'Provgivare temp', 'givare');

-- En egen komponentmall som bara Joakim ser. Utan den kan provet inte visa
-- att systembiblioteket och det egna biblioteket skiljs åt.
insert into komponentmall (id, agare, namn, kategori) values
  ('b1000000-0000-4000-8000-000000000053', 'a1000000-0000-4000-8000-000000000001',
   'Egen vingställdon', 'stalldon');

insert into komponentanslutningsmall (id, komponentmall_id, beteckning, funktion, signaltyp_id)
select 'b1000000-0000-4000-8000-000000000061', 'b1000000-0000-4000-8000-000000000051', '1', 'matning', id
  from signaltyp where nyckel = 'matning_12v';
insert into komponentanslutningsmall (id, komponentmall_id, beteckning, funktion, signaltyp_id)
select 'b1000000-0000-4000-8000-000000000062', 'b1000000-0000-4000-8000-000000000051', '2', 'styrning', id
  from signaltyp where nyckel = 'injektorutgang';
insert into komponentanslutningsmall (id, komponentmall_id, beteckning, funktion, signaltyp_id)
select 'b1000000-0000-4000-8000-000000000063', 'b1000000-0000-4000-8000-000000000052', 'signal', 'signal', id
  from signaltyp where nyckel = 'analog_in';
insert into komponentanslutningsmall (id, komponentmall_id, beteckning, funktion, signaltyp_id)
select 'b1000000-0000-4000-8000-000000000064', 'b1000000-0000-4000-8000-000000000052', 'retur', 'jord', id
  from signaltyp where nyckel = 'sensorjord';
insert into komponentanslutningsmall (id, komponentmall_id, beteckning, funktion, signaltyp_id)
values ('b1000000-0000-4000-8000-000000000065', 'b1000000-0000-4000-8000-000000000053', '1', 'matning', null);

insert into artikel (id, komponentmall_id, agare, fabrikat, artikelnummer, strom_a, spanning_min_v, spanning_max_v)
values
  ('b1000000-0000-4000-8000-000000000071', 'b1000000-0000-4000-8000-000000000051', null,
   'Bosch', '0280158123', 1.20, 10.00, 16.00),
  ('b1000000-0000-4000-8000-000000000072', 'b1000000-0000-4000-8000-000000000052', null,
   'Bosch', '0280130039', 0.01, 0.00, 5.00);

-- ---------- projekt A: Joakims ----------

insert into projekt (id, agare, namn, fordon) values
  ('c1000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'Evo 8 racebil', 'Mitsubishi Lancer Evolution VIII');

insert into zon (id, projekt_id, namn, ordning) values
  ('c1000000-0000-4000-8000-000000000011', 'c1000000-0000-4000-8000-000000000001', 'Motor', 1),
  ('c1000000-0000-4000-8000-000000000012', 'c1000000-0000-4000-8000-000000000001', 'Kupé', 2),
  ('c1000000-0000-4000-8000-000000000013', 'c1000000-0000-4000-8000-000000000001', 'Bakparti', 3);

insert into enhet (id, projekt_id, enhetsmall_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000021', 'c1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000001', 'ECU', 'c1000000-0000-4000-8000-000000000012'),
  ('c1000000-0000-4000-8000-000000000022', 'c1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000002', 'PDM', 'c1000000-0000-4000-8000-000000000012');

insert into port (id, enhet_id, portmall_id, vald_roll_id) values
  ('c1000000-0000-4000-8000-000000000031', 'c1000000-0000-4000-8000-000000000021',
   'b1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000041'),
  ('c1000000-0000-4000-8000-000000000032', 'c1000000-0000-4000-8000-000000000021',
   'b1000000-0000-4000-8000-000000000032', 'b1000000-0000-4000-8000-000000000042'),
  ('c1000000-0000-4000-8000-000000000033', 'c1000000-0000-4000-8000-000000000021',
   'b1000000-0000-4000-8000-000000000034', 'b1000000-0000-4000-8000-000000000045'),
  ('c1000000-0000-4000-8000-000000000034', 'c1000000-0000-4000-8000-000000000022',
   'b1000000-0000-4000-8000-000000000035', 'b1000000-0000-4000-8000-000000000046');

insert into komponent (id, projekt_id, komponentmall_id, artikel_id, beteckning, nummer, zon_id) values
  ('c1000000-0000-4000-8000-000000000041', 'c1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000051', 'b1000000-0000-4000-8000-000000000071',
   'Injektor 1', 1, 'c1000000-0000-4000-8000-000000000011'),
  -- Instans utan vald artikel. B-008: den ska vara giltig, och kontrollen i F4-05
  -- ska redovisa den som ej kontrollerad i stället för godkänd.
  ('c1000000-0000-4000-8000-000000000042', 'c1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000051', null,
   'Injektor 2', 2, 'c1000000-0000-4000-8000-000000000011'),
  ('c1000000-0000-4000-8000-000000000043', 'c1000000-0000-4000-8000-000000000001',
   'b1000000-0000-4000-8000-000000000052', 'b1000000-0000-4000-8000-000000000072',
   'Kylvätsketemp', 1, 'c1000000-0000-4000-8000-000000000011');

insert into komponentanslutning (id, komponent_id, anslutningsmall_id) values
  ('c1000000-0000-4000-8000-000000000051', 'c1000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000061'),
  ('c1000000-0000-4000-8000-000000000052', 'c1000000-0000-4000-8000-000000000041', 'b1000000-0000-4000-8000-000000000062'),
  ('c1000000-0000-4000-8000-000000000053', 'c1000000-0000-4000-8000-000000000043', 'b1000000-0000-4000-8000-000000000063'),
  ('c1000000-0000-4000-8000-000000000054', 'c1000000-0000-4000-8000-000000000043', 'b1000000-0000-4000-8000-000000000064');

-- Alla fyra jordklasser, och två av dem med olika ägande enhet. B-010:
-- ECU:ns sensorjord och PDM:ns är båda "sensor" men är skilda punkter.
insert into jordpunkt (id, projekt_id, klass, enhet_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000061', 'c1000000-0000-4000-8000-000000000001',
   'sensor', 'c1000000-0000-4000-8000-000000000021', 'ECU sensorjord', 'c1000000-0000-4000-8000-000000000012'),
  ('c1000000-0000-4000-8000-000000000062', 'c1000000-0000-4000-8000-000000000001',
   'sensor', 'c1000000-0000-4000-8000-000000000022', 'PDM sensorjord', 'c1000000-0000-4000-8000-000000000012'),
  ('c1000000-0000-4000-8000-000000000063', 'c1000000-0000-4000-8000-000000000001',
   'vr', 'c1000000-0000-4000-8000-000000000021', 'ECU VR-jord', 'c1000000-0000-4000-8000-000000000012'),
  ('c1000000-0000-4000-8000-000000000064', 'c1000000-0000-4000-8000-000000000001',
   'skarm', 'c1000000-0000-4000-8000-000000000021', 'ECU skärmjord', 'c1000000-0000-4000-8000-000000000012'),
  ('c1000000-0000-4000-8000-000000000065', 'c1000000-0000-4000-8000-000000000001',
   'chassi', null, 'Chassijord motor', 'c1000000-0000-4000-8000-000000000011');

insert into skarvpunkt (id, projekt_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000071', 'c1000000-0000-4000-8000-000000000001',
   'Skarv matning injektorer', 'c1000000-0000-4000-8000-000000000011');

insert into nod (id, projekt_id, port_id, komponentanslutning_id, jordpunkt_id, skarvpunkt_id) values
  ('c1000000-0000-4000-8000-000000000081', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000031', null, null, null),
  ('c1000000-0000-4000-8000-000000000082', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000032', null, null, null),
  ('c1000000-0000-4000-8000-000000000083', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000033', null, null, null),
  ('c1000000-0000-4000-8000-000000000084', 'c1000000-0000-4000-8000-000000000001', 'c1000000-0000-4000-8000-000000000034', null, null, null),
  ('c1000000-0000-4000-8000-000000000085', 'c1000000-0000-4000-8000-000000000001', null, 'c1000000-0000-4000-8000-000000000051', null, null),
  ('c1000000-0000-4000-8000-000000000086', 'c1000000-0000-4000-8000-000000000001', null, 'c1000000-0000-4000-8000-000000000052', null, null),
  ('c1000000-0000-4000-8000-000000000087', 'c1000000-0000-4000-8000-000000000001', null, 'c1000000-0000-4000-8000-000000000053', null, null),
  ('c1000000-0000-4000-8000-000000000088', 'c1000000-0000-4000-8000-000000000001', null, 'c1000000-0000-4000-8000-000000000054', null, null),
  ('c1000000-0000-4000-8000-000000000089', 'c1000000-0000-4000-8000-000000000001', null, null, 'c1000000-0000-4000-8000-000000000061', null),
  ('c1000000-0000-4000-8000-00000000008a', 'c1000000-0000-4000-8000-000000000001', null, null, 'c1000000-0000-4000-8000-000000000062', null),
  ('c1000000-0000-4000-8000-00000000008b', 'c1000000-0000-4000-8000-000000000001', null, null, 'c1000000-0000-4000-8000-000000000065', null),
  ('c1000000-0000-4000-8000-00000000008c', 'c1000000-0000-4000-8000-000000000001', null, null, null, 'c1000000-0000-4000-8000-000000000071');

insert into kabel (id, projekt_id, nod_a, nod_b, area_mm2, typ, farg, langd_mm, skarmad, markning) values
  -- injektorns styrning till ECU:ns injektorutgång
  ('c1000000-0000-4000-8000-000000000091', 'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000086', 'c1000000-0000-4000-8000-000000000081',
   0.75, 'thin_wall', 'grå', 1200, false, 'INJ1'),
  -- injektorns matning till skarvpunkten
  ('c1000000-0000-4000-8000-000000000092', 'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000085', 'c1000000-0000-4000-8000-00000000008c',
   0.75, 'thin_wall', 'röd', 300, false, '12V INJ'),
  -- skarvpunkten till PDM-kanalen
  ('c1000000-0000-4000-8000-000000000093', 'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-00000000008c', 'c1000000-0000-4000-8000-000000000084',
   2.50, 'thin_wall', 'röd', 2100, false, 'PDM OUT1'),
  -- givarens signal till ECU:ns analoga ingång
  ('c1000000-0000-4000-8000-000000000094', 'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000087', 'c1000000-0000-4000-8000-000000000082',
   0.50, 'thin_wall', 'svart', 900, true, 'CLT'),
  -- givarens retur till ECU:ns sensorjord
  ('c1000000-0000-4000-8000-000000000095', 'c1000000-0000-4000-8000-000000000001',
   'c1000000-0000-4000-8000-000000000088', 'c1000000-0000-4000-8000-000000000089',
   0.50, 'thin_wall', 'brun', 900, true, 'SGND');

insert into blad (id, projekt_id, namn, ordning, format, skala) values
  ('c1000000-0000-4000-8000-0000000000a1', 'c1000000-0000-4000-8000-000000000001', 'Motorrum', 1, 'A3', 1.000),
  ('c1000000-0000-4000-8000-0000000000a2', 'c1000000-0000-4000-8000-000000000001', 'Kraftfördelning', 2, 'A3', 1.000);

insert into bladfilter_zon (blad_id, zon_id) values
  ('c1000000-0000-4000-8000-0000000000a1', 'c1000000-0000-4000-8000-000000000011');

insert into bladfilter_enhet (blad_id, enhet_id) values
  ('c1000000-0000-4000-8000-0000000000a2', 'c1000000-0000-4000-8000-000000000022');

-- ---------- projekt B: någon annans ----------
-- Finns bara för att åtkomstproven ska ha något att inte se.

insert into projekt (id, agare, namn, fordon) values
  ('c1000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000002',
   'Volvo 240 rallybil', 'Volvo 240');

insert into zon (id, projekt_id, namn, ordning) values
  ('c1000000-0000-4000-8000-000000000014', 'c1000000-0000-4000-8000-000000000002', 'Motor', 1);

insert into enhet (id, projekt_id, enhetsmall_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000023', 'c1000000-0000-4000-8000-000000000002',
   'b1000000-0000-4000-8000-000000000001', 'ECU', 'c1000000-0000-4000-8000-000000000014');

insert into port (id, enhet_id, portmall_id, vald_roll_id) values
  ('c1000000-0000-4000-8000-000000000035', 'c1000000-0000-4000-8000-000000000023',
   'b1000000-0000-4000-8000-000000000031', 'b1000000-0000-4000-8000-000000000041');

insert into jordpunkt (id, projekt_id, klass, enhet_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000066', 'c1000000-0000-4000-8000-000000000002',
   'chassi', null, 'Chassijord', 'c1000000-0000-4000-8000-000000000014');

insert into skarvpunkt (id, projekt_id, beteckning, zon_id) values
  ('c1000000-0000-4000-8000-000000000072', 'c1000000-0000-4000-8000-000000000002',
   'Skarv', 'c1000000-0000-4000-8000-000000000014');

insert into komponent (id, projekt_id, komponentmall_id, artikel_id, beteckning, nummer, zon_id) values
  ('c1000000-0000-4000-8000-000000000044', 'c1000000-0000-4000-8000-000000000002',
   'b1000000-0000-4000-8000-000000000051', 'b1000000-0000-4000-8000-000000000071', 'Injektor 1', 1,
   'c1000000-0000-4000-8000-000000000014');

insert into komponentanslutning (id, komponent_id, anslutningsmall_id) values
  ('c1000000-0000-4000-8000-000000000055', 'c1000000-0000-4000-8000-000000000044', 'b1000000-0000-4000-8000-000000000062');

insert into nod (id, projekt_id, port_id, komponentanslutning_id, jordpunkt_id, skarvpunkt_id) values
  ('c1000000-0000-4000-8000-00000000008d', 'c1000000-0000-4000-8000-000000000002', 'c1000000-0000-4000-8000-000000000035', null, null, null),
  ('c1000000-0000-4000-8000-00000000008e', 'c1000000-0000-4000-8000-000000000002', null, 'c1000000-0000-4000-8000-000000000055', null, null),
  ('c1000000-0000-4000-8000-00000000008f', 'c1000000-0000-4000-8000-000000000002', null, null, 'c1000000-0000-4000-8000-000000000066', null),
  ('c1000000-0000-4000-8000-000000000090', 'c1000000-0000-4000-8000-000000000002', null, null, null, 'c1000000-0000-4000-8000-000000000072');

insert into kabel (id, projekt_id, nod_a, nod_b, area_mm2, typ, farg, langd_mm, skarmad, markning) values
  ('c1000000-0000-4000-8000-000000000096', 'c1000000-0000-4000-8000-000000000002',
   'c1000000-0000-4000-8000-00000000008e', 'c1000000-0000-4000-8000-00000000008d',
   0.75, 'thin_wall', 'grå', 1000, false, 'INJ1');

insert into blad (id, projekt_id, namn, ordning, format, skala) values
  ('c1000000-0000-4000-8000-0000000000a3', 'c1000000-0000-4000-8000-000000000002', 'Motorrum', 1, 'A3', 1.000);

insert into bladfilter_zon (blad_id, zon_id) values
  ('c1000000-0000-4000-8000-0000000000a3', 'c1000000-0000-4000-8000-000000000014');

insert into bladfilter_enhet (blad_id, enhet_id) values
  ('c1000000-0000-4000-8000-0000000000a3', 'c1000000-0000-4000-8000-000000000023');

-- ---------- MaxxECU Race i Evo-projektet ----------
-- Instansieras ur mallen på samma sätt som laggTillEnhet() gör i appen: alla
-- portar skapas med mallens standardroll och blir noder. 80 portar för hand i
-- en fröfil hade varit oläsbart och skulle sluta stämma vid första ändringen.

do $block$
declare
  ny_enhet uuid;
  vev_id uuid;
  nod_trigger uuid;
  nod_vev uuid;
begin
  insert into enhet (projekt_id, enhetsmall_id, beteckning, zon_id)
  select 'c1000000-0000-4000-8000-000000000001', e.id, 'MaxxECU Race',
         'c1000000-0000-4000-8000-000000000012'
    from enhetsmall e
   where e.agare is null and e.fabrikat = 'MaxxECU' and e.modell = 'Race'
  returning id into ny_enhet;

  insert into port (enhet_id, portmall_id, vald_roll_id)
  select ny_enhet, pm.id, (select r.id from portroll r
                            where r.portmall_id = pm.id and r.ar_standard limit 1)
    from portmall pm
    join enhetsmall e on e.id = pm.enhetsmall_id
   where e.agare is null and e.fabrikat = 'MaxxECU' and e.modell = 'Race';

  insert into nod (projekt_id, port_id)
  select 'c1000000-0000-4000-8000-000000000001', p.id
    from port p where p.enhet_id = ny_enhet;

  insert into komponent (projekt_id, komponentmall_id, beteckning, nummer, zon_id)
  select 'c1000000-0000-4000-8000-000000000001', m.id, 'Vevaxelgivare 1', 1,
         'c1000000-0000-4000-8000-000000000011'
    from komponentmall m where m.agare is null and m.namn = 'Vevaxelgivare'
  returning id into vev_id;

  insert into komponentanslutning (komponent_id, anslutningsmall_id)
  select vev_id, a.id from komponentanslutningsmall a
    join komponentmall m on m.id = a.komponentmall_id
   where m.agare is null and m.namn = 'Vevaxelgivare';

  insert into nod (projekt_id, komponentanslutning_id)
  select 'c1000000-0000-4000-8000-000000000001', ka.id
    from komponentanslutning ka where ka.komponent_id = vev_id;

  -- Vevaxelgivarens signal till TRIGGER. Kabeln finns för att fas 4 ska ha ett
  -- fall att pröva och för att F1-17 ska gå att visa: byt roll på TRIGGER och
  -- raden i kopplingslistan ändrar signaltyp.
  select n.id into nod_trigger
    from nod n join port p on p.id = n.port_id
    join portmall pm on pm.id = p.portmall_id
   where p.enhet_id = ny_enhet and pm.beteckning = 'TRIGGER';

  select n.id into nod_vev
    from nod n join komponentanslutning ka on ka.id = n.komponentanslutning_id
    join komponentanslutningsmall am on am.id = ka.anslutningsmall_id
   where ka.komponent_id = vev_id and am.beteckning = 'signal';

  insert into kabel (projekt_id, nod_a, nod_b, area_mm2, typ, farg, langd_mm, skarmad, markning)
  values ('c1000000-0000-4000-8000-000000000001', nod_vev, nod_trigger,
          0.50, 'thin_wall', 'vit', 1500, true, 'TRIG');
end $block$;
