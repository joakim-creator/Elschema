-- F1-09  Startbiblioteket enligt D1.
--
-- Mallen är generisk och bär anslutningarnas *funktion*. Artikeln bär de
-- mätbara värdena. Instansen är exemplaret i fordonet (B-008).
--
-- Jordpunkt ingår inte som komponent trots att D1 räknar upp den: den är ett
-- eget objekt i nätlistan med egen klass och ägande enhet (B-010). Att också
-- ha den som komponentmall hade gett två sätt att uttrycka samma sak.
--
-- Strömvärdena på artiklarna är typiska, inte uppmätta. De är där för att
-- kontrollen i F4-04 ska ha något att räkna på, och ska bytas mot verkliga
-- värden när de är kända.

do $block$
declare
  mall_id uuid;
  v record;
  a record;
begin
  for v in
    select * from (values
      -- namn, kategori, anslutningar som "beteckning|funktion|signaltyp"
      ('Injektor',            'bransle',  array['1|matning|matning_12v', '2|styrning|injektorutgang']),
      ('Tändspole',           'tandning', array['+12V|matning|matning_12v', 'styr|styrning|tandutgang', 'gnd|jord|chassijord']),
      ('Gaspedal (APP)',      'givare',   array['5V|matning|matning_5v', 'signal 1|signal|analog_in', 'signal 2|signal|analog_in', 'retur|jord|sensorjord']),
      ('Trottelhus (DBW)',    'stalldon', array['motor+|styrning|h_brygga', 'motor-|styrning|h_brygga', '5V|matning|matning_5v', 'TPS 1|signal|analog_in', 'TPS 2|signal|analog_in', 'retur|jord|sensorjord']),
      ('Oljetrycksgivare',    'givare',   array['5V|matning|matning_5v', 'signal|signal|analog_in', 'retur|jord|sensorjord']),
      ('Kylvätsketempgivare', 'givare',   array['signal|signal|analog_in', 'retur|jord|sensorjord']),
      ('MAP-givare',          'givare',   array['5V|matning|matning_5v', 'signal|signal|analog_in', 'retur|jord|sensorjord']),
      ('MAF-givare',          'givare',   array['+12V|matning|matning_12v', 'signal|signal|analog_in', 'retur|jord|sensorjord']),
      ('Lambdagivare',        'givare',   array['värme+|matning|matning_12v', 'värme-|styrning|lagsidesdrivare', 'IP|signal|wbo2', 'VS|signal|wbo2', 'COM|signal|wbo2', 'RCAL|signal|wbo2']),
      ('Vevaxelgivare',       'givare',   array['signal|signal|vr_in', 'retur|jord|vr_jord', 'skärm|jord|skarmjord']),
      ('Kamaxelgivare',       'givare',   array['signal|signal|vr_in', 'retur|jord|vr_jord', 'skärm|jord|skarmjord']),
      ('Bränslepump',         'bransle',  array['+12V|matning|matning_12v', 'gnd|jord|chassijord']),
      ('Relä',                'kraft',    array['30|matning|matning_12v', '87|utgang|matning_12v', '85|spole|matning_12v', '86|spole|lagsidesdrivare']),
      ('Säkring',             'kraft',    array['in|matning|matning_12v', 'ut|utgang|matning_12v']),
      ('Batteri',             'kraft',    array['+|matning|matning_12v', '-|jord|chassijord']),
      ('Kylfläkt',            'stalldon', array['+12V|matning|matning_12v', 'gnd|jord|chassijord']),
      ('Bromsljus',           'belysning',array['+12V|matning|matning_12v', 'gnd|jord|chassijord']),
      ('Varningslampa',       'instrument',array['+12V|matning|matning_12v', 'styr|styrning|lagsidesdrivare'])
    ) as t(namn, kategori, anslutningar)
  loop
    insert into komponentmall (agare, namn, kategori)
    values (null, v.namn, v.kategori)
    returning id into mall_id;

    insert into komponentanslutningsmall (komponentmall_id, beteckning, funktion, signaltyp_id)
    select mall_id,
           split_part(d, '|', 1),
           split_part(d, '|', 2),
           (select id from signaltyp where nyckel = split_part(d, '|', 3) and agare is null)
      from unnest(v.anslutningar) as d;
  end loop;

  for a in
    select * from (values
      ('Injektor',            'Bosch',   '0280158123', 1.20, 10.0, 16.0),
      ('Injektor',            'Bosch',   '0280158829', 1.40, 10.0, 16.0),
      ('Tändspole',           'Bosch',   '0221504470', 7.00, 10.0, 16.0),
      ('Oljetrycksgivare',    'Bosch',   '0261230482', 0.02,  4.5,  5.5),
      ('Kylvätsketempgivare', 'Bosch',   '0280130039', 0.01,  0.0,  5.0),
      ('MAP-givare',          'Bosch',   '0261230119', 0.02,  4.5,  5.5),
      ('Lambdagivare',        'Bosch',   'LSU 4.9',    2.50, 10.0, 16.0),
      ('Bränslepump',         'Walbro',  'GSS342',    12.00, 10.0, 16.0),
      ('Kylfläkt',            'Generisk','fläkt 200W', 16.00, 10.0, 16.0),
      ('Bromsljus',           'Generisk','LED',         0.50, 10.0, 16.0),
      ('Varningslampa',       'Generisk','LED',         0.05, 10.0, 16.0)
    ) as t(mall, fabrikat, artnr, strom, vmin, vmax)
  loop
    insert into artikel (komponentmall_id, agare, fabrikat, artikelnummer,
                         strom_a, spanning_min_v, spanning_max_v, anteckning)
    select id, null, a.fabrikat, a.artnr, a.strom, a.vmin, a.vmax,
           'Typiskt värde, inte uppmätt.'
      from komponentmall where agare is null and namn = a.mall;
  end loop;
end $block$;
