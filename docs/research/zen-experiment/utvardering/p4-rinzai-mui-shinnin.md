# Utvärderingsprotokoll: p4-rinzai-mui-shinnin

Filologisk utvärdering utförd av Claude (Fable 5) 2026-07-13. Kriterieordning och
metod: se p1-protokollet.

## Runda 1 (körning 3)

**Leveransstatus:** qwen A tomt; qwen B utan engelskt mellansteg, trunkerad;
qwen C, glm A/B/C trunkerade i metaavsnitten; deepseek D tomt; gemma D trunkerad.
Endast deepseek A/B/C och gemma A/B/C kompletta.

| Modell×Flöde | Poäng |
|---|---|
| qwen A (tomt) | 1 rakt över |
| qwen B | 4,3,4,3,4,3,3,3,5,3 |
| qwen C | 4,4,4,4,4,4,4,4,4,4 |
| deepseek A | 4,3,5,3,4,4,4,4,4,4 |
| deepseek B | 4,3,4,2,4,3,4,4,4,3 |
| deepseek C | 4,4,5,3,4,3,4,5,4,4 |
| glm A | 4,4,3,4,5,4,4,3,5,4 |
| glm B | 3,4,4,3,4,3,4,4,3,3 |
| glm C | 4,4,4,3,4,4,4,5,4,4 |
| gemma A | 3,3,3,3,3,3,4,3,2,2 |
| gemma B | 4,3,3,4,3,4,4,4,3,3 |
| gemma C | 3,2,3,4,3,4,4,3,2,2 |

**Viktigaste felen (runda 1):**
1. Språk-/begreppsfel (gemma A): 道道 som "Säger, säger" — ska vara imperativt
   "Tala! Tala!".
2. Hallucination (gemma C): uppdiktad tvetydighet "'Säg, säg!' [eller: 'Vägen,
   vägen!']" — 道 är här entydigt "säga" (Tang-talspråk).
3. Omotiverad säkerhet (granskaren av glm, dvs. gemma4): underkände korrekt
   "Säg! Säg!" som "allvarligt fel" med Dao-läsningen som facit.
4. Hallucination (granskaren av qwen, dvs. deepseek): recenserade en tom
   översättning ("Ingen mening är utelämnad i någon av översättningarna").
5. Begreppsfel via engelsk interferens (glm B): "huvudet" för 赤肉團-debatten
   (hjärtat/kroppen) — ur eget engelskt mellansteg.
6. Stilproblem/mildring (gemma A/B): "dyng-pinne"/"avföringspinne" med motivering
   "klinisk precision" — grovheten i 乾屎橛 är poängen. Språkligt: deepseeks
   "återvorde", "avfödslesticka", "avförestapp".

**Flöde D:** granskningen av gemma (granskare qwen) var bäst i runda 1 — fångade
道道-felet åt båda hållen. Ingen granskare tog upp pinne/klump-debatten om 乾屎橛.

**Bäst runda 1:** deepseek C (komplett apparat, korrekt 道道, frågeform bevarad,
uttalat motstånd mot mildring). Tätt efter: glm C och qwen C.

## Runda 2 (omkörning, nya filer: qwen A/B/C, glm A/B/C, tre D-filer)

| Fil | Poäng |
|---|---|
| qwen A | 5,5,4,5,5,4,5,5,5,5 |
| qwen B (trunk.) | 1,1,2,2,2,2,1,1,5,1 |
| qwen C (trunk.) | 3,2,4,4,4,3,2,2,5,2 |
| glm A | 4,3,4,4,5,4,4,3,5,4 |
| glm B | 5,5,4,5,5,4,5,4,5,5 |
| glm C | 5,5,4,4,5,3,4,5,4,4 |

- Endast qwen A och glm C är helt kompletta; qwen B/C trunkerade i slutstegen,
  glm A/B i apparaten.
- qwen A är den bästa nya filen (48/50): ensam om att redovisa kropp/hjärta-
  debatten för 赤肉團 i en helt levererad apparat; ogarderat "torr skitpinne".
- glm B innehållsligt starkast på tvetydighet (enda med 乾屎橛-filologin
  torkpinne/klump) men trunkerad apparat.
- Nya fel: glm C "abbotrumman" (icke-ord), genusinkonsekvens "är hon"; qwen A
  "ancient Kina"; glm B "Linsjies".
- D-filerna: granskningen av qwen (granskare deepseek) hade grov falsk negativ
  ("ingen mening utelämnad" trots trunkerad Ö2); granskningen av deepseek
  (granskare glm) vass men trunkerad efter 2,5 rubriker; granskningen av glm
  (granskare gemma4) komplett och bäst kalibrerad — fångade bl.a. att apparaten
  avbryter sin egen analys. 道道 klanderfritt hos alla granskare denna gång.

**Slutdom P4:** deepseek C behåller förstaplatsen; därefter qwen A ≈ glm B/C.
Mönstret "C-flödet vinner" försvagas: med större tokenbudget är trunkering i
flerstegsflödena den dominerande felkällan, medan direktflödet A levererar helt.
Leveranssäkerhet, inte filologi, är den nya skiljelinjen.

## Runda 3 (flaggskepp)

| Cell | Poäng |
|---|---|
| deepseek-v4-pro A | 5,4,5,5,5,5,5,4,5,5 |
| deepseek-v4-pro B | 5,5,5,5,5,5,5,5,5,5 |
| deepseek-v4-pro C | 4,5,2,4,3,4,4,4,2,4 |
| glm-5.2 A | 4,4,4,4,4,4,4,4,4,5 |
| glm-5.2 B | 5,5,4,4,4,4,4,5,5,5 |
| glm-5.2 C | 5,5,4,3,4,4,4,5,5,5 |
| gemma4 A | 3,3,2,4,2,2,4,3,1,3 |
| gemma4 B | 4,4,4,3,4,4,4,4,4,4 |
| gemma4 C | 4,4,4,4,4,4,4,4,5,4 |
| qwen3.5:397b (alla) | EJ LEVERERAD (trunkerad/saknas) |

- Fel: gemma A "spillkråka" (fågel!) för 乾屎橛; deepseek C "skitspade" (橛=pinne);
  gemma A/B 托開 "släppte" (ska vara stötte bort); glm-D falsk positiv mot korrekt 道道.
- deepseek-D (glm granskar deepseek) fångade "skitspade"-felet men trunkerade.
- **Bästa enskilda: deepseek-v4-pro B** (alla ankare rätt: "Tala! Tala!", "torr
  skitpinne" med bevarad grovhet, kropp/hjärta-debatten redovisad). glm C tvåa.
