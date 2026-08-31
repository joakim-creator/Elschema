-- F1-16  Vyer som gör nätlistan läsbar.
--
-- Etiketten på en nod räknas fram på ett ställe. Utan det skulle varje
-- rullgardin, varje tabell och senare varje ritning bygga sin egen variant, och
-- de skulle sluta stämma överens.
--
-- security_invoker = true: vyn läses med den frågandes rättigheter, så RLS på
-- de underliggande tabellerna gäller. Utan flaggan hade vyn läckt hela
-- nätlistan till varje inloggad.

create view nod_vy with (security_invoker = true) as
select
  n.id,
  n.projekt_id,
  case
    when n.port_id is not null then 'port'
    when n.komponentanslutning_id is not null then 'komponent'
    when n.jordpunkt_id is not null then 'jord'
    else 'skarv'
  end as sort,
  coalesce(e.beteckning, k.beteckning, j.beteckning, sk.beteckning) as bararen,
  coalesce(pm.beteckning, kam.beteckning) as anslutning,
  coalesce(e.zon_id, k.zon_id, j.zon_id, sk.zon_id) as zon_id,
  st.nyckel as signaltyp,
  st.namn as signaltyp_namn,
  least(pm.max_strom_a, min(sm.max_strom_a)) as max_strom_a,
  art.strom_a as last_a,
  ka.id as komponentanslutning_id,
  n.port_id,
  n.jordpunkt_id,
  n.skarvpunkt_id,
  j.klass as jordklass,
  j.enhet_id as jord_enhet_id
from nod n
left join port p on p.id = n.port_id
left join enhet e on e.id = p.enhet_id
left join portmall pm on pm.id = p.portmall_id
left join portstift ps on ps.portmall_id = pm.id
left join stiftmall sm on sm.id = ps.stiftmall_id
left join portroll pr on pr.id = p.vald_roll_id
left join komponentanslutning ka on ka.id = n.komponentanslutning_id
left join komponent k on k.id = ka.komponent_id
left join komponentanslutningsmall kam on kam.id = ka.anslutningsmall_id
left join artikel art on art.id = k.artikel_id
left join jordpunkt j on j.id = n.jordpunkt_id
left join skarvpunkt sk on sk.id = n.skarvpunkt_id
left join signaltyp st on st.id = coalesce(pr.signaltyp_id, kam.signaltyp_id)
group by
  n.id, n.projekt_id, e.beteckning, k.beteckning, j.beteckning, sk.beteckning,
  pm.beteckning, kam.beteckning, e.zon_id, k.zon_id, j.zon_id, sk.zon_id,
  st.nyckel, st.namn, pm.max_strom_a, art.strom_a, ka.id, n.port_id,
  n.jordpunkt_id, n.skarvpunkt_id, j.klass, j.enhet_id;

comment on view nod_vy is
  'En rad per elektrisk punkt, med bäraren och anslutningen namngivna. Strömgränsen är den lägsta av portens och dess stifts (B-011).';

-- Kopplingslistan. Det här är vyn som ersätter Excel (F1-16).
create view kabel_vy with (security_invoker = true) as
select
  c.id,
  c.projekt_id,
  a.bararen as fran_bararen,
  a.anslutning as fran_anslutning,
  a.sort as fran_sort,
  a.signaltyp_namn as fran_signaltyp,
  b.bararen as till_bararen,
  b.anslutning as till_anslutning,
  b.sort as till_sort,
  b.signaltyp_namn as till_signaltyp,
  c.area_mm2,
  c.typ,
  c.farg,
  c.langd_mm,
  c.skarmad,
  c.markning,
  coalesce(a.zon_id, b.zon_id) as zon_id,
  greatest(coalesce(a.last_a, 0), coalesce(b.last_a, 0)) as last_a,
  c.nod_a,
  c.nod_b
from kabel c
join nod_vy a on a.id = c.nod_a
join nod_vy b on b.id = c.nod_b;

comment on view kabel_vy is
  'Kopplingslistan: en rad per kabel med båda ändarna utskrivna.';
