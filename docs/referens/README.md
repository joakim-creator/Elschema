# Referensmaterial

Förlagor och underlag som specifikationen hänvisar till. Inget här är källkod och
inget här ändras av appen — det är material att rita *efter*.

Kontrollerat 2026-08-31: samtliga filer lästa, inte bara närvarokontrollerade.

| Fil | Innehåll | Används av |
|---|---|---|
| `maxxecu-rev9-kopplingsbild.pdf` | 2 sidor. S1 = kopplingsbilden för connector 1 (förlagan i avsnitt 11). S2 = connector 2: EGT 1–8, analog in 5–8, e-throttle. Titeln i filen är `MaxxECU RACE wirings.indb` | Layoutförlaga, F2-01 |
| `maxxecu-race-pinout.html` | MaxxECU **GEN1** pinout: MINI (32-pin), STREET/SPORT/V1/RACE/PRO connector 1 (48-pin), RACE connector 2 (32-pin svart), PRO connector 2 och 3. Sparad webbsida med tillhörande `_files`-mapp | **F1-03** |
| `maxxecu-pdm-kanaler.pdf` | 2 sidor. PDM**20**: 20 utgångar med individuell strömgräns, taket 230 A för hela enheten, egna AIN, egen 5 V och sensorjord, keypad-kopplingar. **Sida 2 bär kabelarea/strömtabellen** | **F6-06**, och tabellen matas in i **F1-18** |
| `MaxxECU Expansion Module - Wiring-en.pdf` | 2 sidor. EXP-modul: 12 analoga ingångar med valbara pullups, 4 pulsingångar (VR eller digital), 8 utgångar varav 4 H-brygga, egen CAN **utan** inbyggd terminering | **F6-07, F6-08.** Sitter inte på Evo:n idag, men stöd ska byggas |

## Vad läsningen ändrade

Fyra fel i datamodellen upptäcktes vid genomläsningen och är förda som `U-001`–`U-004`
i backloggen. Se [beslutsloggen](../beslutslogg.md) B-010 till B-012.

## Kabelarea och ström

Tabellen på sida 2 i PDM-underlaget ger bärförmåga per area och kabeltyp — 0,5 mm²
klarar 11 A som thin-wall (TXL, R2) men 5 A som vanlig kabel (RK, RKUB), och så vidare
upp till 16 mm². Den matas in som frödata i F1-18 och är grunden för dimensioneringen
([B-013](../beslutslogg.md)).

Underlaget varnar själv: kablar i varm miljö och i stammar med många hårt belastade
ledare behöver större area än tabellen anger. Den varningen ska följa med till
gränssnittet — tabellen är en utgångspunkt, inte ett facit.
