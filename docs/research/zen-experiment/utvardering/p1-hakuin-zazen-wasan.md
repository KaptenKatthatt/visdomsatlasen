# Utvärderingsprotokoll: p1-hakuin-zazen-wasan

Filologisk utvärdering utförd av Claude (Fable 5) 2026-07-13, mot originalet i
`passages/p1-hakuin-zazen-wasan.json` och utdata i `results/`. Runda 1 avser
körning 3 (tokenbudget 4 096); runda 2 avser omkörningen (16 384). Alla
poängtabeller: tio kriterier 1–5 i ordningen Trohet, Tvetydighetshantering,
Buddhistisk terminologi, Grammatik, Metafor/ton, Naturlig svenska, Läsbarhet,
Transparens, Hallucinationsresistens, Lämplighet för Visdomsatlasen.

## Runda 1 (körning 3)

**Teknisk grundnotis:** 5 av 12 svenska slutöversättningar saknades eller var
trunkerade. qwen3.5 levererade tomma svar i A, B och C; glm-5.1 B var tom och
glm-5.1 A klipptes mitt i den läsbara översättningen.

| Modell×Flöde | Poäng |
|---|---|
| qwen A/B/C (tomma) | 1 rakt över |
| deepseek A | 4,4,3,4,3,3,4,4,4,3 |
| deepseek B | 4,4,4,3,4,4,4,4,5,4 |
| deepseek C | 4,5,4,4,4,4,5,5,4,4 |
| glm A (trunkerad) | 2,1,2,2,2,1,1,1,3,1 |
| glm B (tom) | 1 rakt över |
| glm C | 3,3,4,3,3,4,4,3,4,2 |
| gemma A | 3,4,4,4,3,4,4,2,3,3 |
| gemma B | 3,3,4,3,4,4,4,2,3,3 |
| gemma C | 4,4,4,4,4,4,4,2,2,3 |

**Viktigaste felen (runda 1):**
1. Begreppsfel (kärnmetaforen inverterad), glm C läsbar: "Skiljer man vattnet från
   isen finns ingen is" — 水を離れて氷なく = "skild från vattnet finns ingen is".
   Mildare inversion även i deepseek C och gemma C ordagrann ("Utan att lämna
   vattnet…"). Källa: C-analysernas gloss "lämna/separera".
2. Hallucination (felattribuering), gemma C analys: liknelsen sägs komma från
   "Sutra om det gyllene ljuset" — den kommer från Lotussutran kap. 4 (信解品).
3. Begreppsfel via engelsk interferens, gemma B: "Utan att veta att kännande
   varelser är nära" — subjekt/objekt bytta, ärvt från engelska mellansteget.
4. Språkfel, gemma A läsbar: "precis som vatten är is" — kopulan förvandlar
   liknelse till identitetspåstående.
5. Stilproblem, deepseek A läsbar: "Paradiset" för 蓮華国 raderar lotusbilden
   (dock transparent redovisat).
6. Omotiverad säkerhet, gemma alla flöden: konfidens 5 trots fel 2–4.

Positivt: ingen modell fyllde det utelämnade partiet （……） med påhitt.

**Flöde D:** granskningen av glm (granskare gemma4) fångade två verkliga fel
(trunkeringen; rad 3-inversionen) med korrekta teckencitat men hade falska
positiver. Granskningen av qwen (granskare deepseek) vägrade korrekt granska tomma
indata men gled utanför uppdraget. Granskningarna av deepseek och gemma var tomma.

**Bäst runda 1:** deepseek B (läsbar version korrekt i alla ankarpunkter; behåller
lotusbilden; dokumenterade avvikelser från engelskan). Tvåa: deepseek C.

## Runda 2 (omkörning, nya filer: glm A/B, qwen A, deepseek-D)

| Fil | Poäng |
|---|---|
| glm A | 4,3,3,4,4,4,4,2,5,3 |
| glm B | 5,5,4,5,5,4,5,4,5,4 |
| qwen A | 2,1,2,2,2,1,1,1,3,1 |

- qwen B/C/D saknas — tomt svar trots 16k × 3 försök (leveransfynd).
- Trunkering kvarstår trots höjd budget: glm A/B bryts i apparaten; qwen A är
  korrupt ("[fändå]", "Után vatten") och bryts mitt i läsbar version.
- glm B är nu passagens bästa översättningstext och filologiska apparat (engelskt
  mellansteg exemplariskt: Lotussutra-liknelsen, jakumetsu, subjektsambiguiteten i
  現前), men apparatens tre sista rubriker saknas.
- deepseek-D (granskning av deepseek, granskare glm): äkta träff (den logiska
  inversionen i C-flödets vattenmetafor, med teckencitat) men trunkerad efter
  drygt en rubrik av nio.

**Slutdom P1:** som färdig komplett leverans står deepseek B kvar som vinnare; som
råtext att redigera vidare är glm B förstahandsval.

## Runda 3 (flaggskepp: deepseek-v4-pro, glm-5.2, gemma4, qwen3.5:397b)

Poäng (endast kompletta celler; tio kriterier i standardordning):

| Cell | Poäng |
|---|---|
| deepseek-v4-pro A | 4,5,5,5,4,4,5,5,4,5 |
| deepseek-v4-pro C | 4,5,4,3,3,3,4,5,4,4 |
| glm-5.2 A | 4,4,4,4,4,4,4,4,5,4 |
| glm-5.2 B | 5,5,5,5,4,4,5,5,5,5 |
| glm-5.2 C | 4,4,3,4,4,3,4,4,4,4 |
| gemma4 A | 3,4,4,5,3,5,5,4,3,4 |
| gemma4 B | 4,4,5,5,4,5,5,5,4,4 |
| gemma4 C | 3,4,4,5,4,5,5,4,3,4 |
| qwen3.5:397b (alla) | EJ LEVERERAD (trunkerad/saknas) |

- deepseek-v4-pro B saknas; deepseek-D trunkerad; gemma-D saknas.
- Viktiga fel: 水を離れて氷なく inverterad hos gemma (alla) och qwen C ordagrann;
  近き fellläst; "futiliter" (deepseek C, kalk); 渇を叫ぶ "ropa efter törst" (glm/deepseek C).
- **Bästa enskilda: glm-5.2 B** (korrekt is/vatten-riktning, öppen 近き-tvetydighet,
  bevarad lotusbild). deepseek-v4-pro A tvåa.
