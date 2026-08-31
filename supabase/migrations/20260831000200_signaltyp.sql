-- F0-09  Signaltyper: fast kärna som appen kontrollerar, egna som bara lagras.
-- B-006. Kärnan är utökad mot förlagan: fyra jordar, 5 V sensormatning,
-- tänd- och injektorutgång som egna typer.

create type signalkategori as enum ('jord', 'matning', 'ingang', 'utgang', 'buss');

create table signaltyp (
  id          uuid primary key default gen_random_uuid(),
  nyckel      text not null check (nyckel ~ '^[a-z0-9_]{2,40}$'),
  namn        text not null,
  kategori    signalkategori not null,
  ar_karna    boolean not null default false,
  agare       uuid references profiler (id) on delete cascade,
  -- Kärntyper ägs av systemet och får inte ha ägare; egna typer måste ha det.
  constraint karna_saknar_agare check (ar_karna = (agare is null))
);

-- Kärnan är unik globalt; egna typer är unika per ägare.
create unique index signaltyp_karna_nyckel_idx on signaltyp (nyckel) where ar_karna;
create unique index signaltyp_egen_nyckel_idx on signaltyp (agare, nyckel) where not ar_karna;

insert into signaltyp (nyckel, namn, kategori, ar_karna) values
  ('sensorjord',        'Sensorjord',            'jord',    true),
  ('vr_jord',           'VR-jord',               'jord',    true),
  ('skarmjord',         'Skärmjord',             'jord',    true),
  ('chassijord',        'Chassi- och motorjord', 'jord',    true),
  ('matning_5v',        '5 V sensormatning',     'matning', true),
  ('matning_12v',       '12 V matning',          'matning', true),
  ('analog_in',         'Analog ingång 0–5 V',   'ingang',  true),
  ('digital_in',        'Digital ingång',        'ingang',  true),
  ('vr_in',             'VR- eller frekvensingång', 'ingang', true),
  ('pwm_ut',            'PWM-utgång',            'utgang',  true),
  ('lagsidesdrivare',   'Lågsidesdrivare',       'utgang',  true),
  ('hogsidesdrivare',   'Högsidesdrivare',       'utgang',  true),
  ('h_brygga',          'H-bryggeutgång',        'utgang',  true),
  ('tandutgang',        'Tändutgång',            'utgang',  true),
  ('injektorutgang',    'Injektorutgång',        'utgang',  true),
  ('can_h',             'CAN H',                 'buss',    true),
  ('can_l',             'CAN L',                 'buss',    true);
