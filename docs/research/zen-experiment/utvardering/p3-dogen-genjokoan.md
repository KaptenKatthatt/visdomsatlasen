# Utvärderingsprotokoll: p3-dogen-genjokoan

Filologisk utvärdering utförd av Claude (Fable 5) 2026-07-13. Kriterieordning och
metod: se p1-protokollet.

## Runda 1 (körning 3)

**Leveransstatus:** qwen tomt i samtliga egna flöden; glm svårt trunkerad
(A avbröts efter fyra ord). Poäng nedan avser det som levererades.

| Modell×Flöde | Poäng |
|---|---|
| qwen A/B/C (tomma) | 1 rakt över |
| deepseek A | 4,4,4,4,4,4,4,4,4,4 |
| deepseek B | 4,4,4,3,3,3,3,4,4,3 |
| deepseek C | 3,4,3,4,3,4,4,4,3,3 |
| glm A (haveri) | 1 rakt över |
| glm B (trunk.) | 4,5,4,3,4,3,4,3,5,4 |
| glm C (trunk.) | 4,4,4,3,4,3,4,3,4,4 |
| gemma A | 2,3,3,4,2,3,4,3,3,2 |
| gemma B | 2,3,3,3,2,2,3,3,3,2 |
| gemma C | 2,3,2,4,3,4,4,4,2,2 |

**Viktigaste felen (runda 1):**
1. Begreppsfel (gemma A/B/C): "gräset vissnar i avsmak" — 草は棄嫌におふる =
   "ogräs VÄXER mitt i motvilja" (生ふ). Felet vänder Dōgens poäng; såddes i
   gemmas C-analys och B-mellansteg ("grass withers").
2. Begreppsfel/dold tvetydighet (deepseek C läsbar): "inte skilda från mig själv"
   för われにあらざる = "inte är jag" — radikal negation blev monistisk identitet.
3. Begreppsfel + intern motsägelse (deepseek C läsbar): "fullhet och tomhet" för
   豊倹 (= överflöd/knapphet), i strid med modellens eget terminologibeslut.
4. Hallucination (gemma C): 生仏 glossat som 成仏 "att bli en buddha" — originalet
   är sammandragningen varelser-och-buddhor.
5. Övermodernisering (deepseek A läsbar): didaktiska expansioner av den avsiktligt
   oexplikerade slutbilden.
6. Omotiverad säkerhet (granskaren av glm, dvs. gemma4): dömde den etablerade
   läsningen av 生仏 som "allvarligt filologiskt fel" med minoritetsläsningen som
   facit.

**Flöde D:** granskningen av deepseek (granskare glm) var bäst — tre verkliga fynd.
Granskningen av qwen (granskare deepseek) rapporterade ärligt att inget fanns att
granska. Granskningen av gemma (granskare qwen) var tom — den granskning som
behövdes mest uteblev.

**Bäst runda 1:** glm B som text (trunkerad); deepseek A som bästa kompletta
leverans.

## Runda 2 (omkörning, nya filer: glm A/B/C, qwen C, två D-filer)

| Fil | Poäng |
|---|---|
| glm A | 4,4,4,4,4,4,4,3,3,3 |
| glm B | 2,1,3,4,1,3,1,1,4,1 |
| glm C | 4,3,4,3,4,4,4,2,4,3 |
| qwen C | 3,4,3,4,3,4,4,3,3,3 |

- glm B blev VÄRRE i omkörningen: svenska steget dör efter en och en halv mening.
- qwen C: 生仏 → "levande Buddhar" (parförlusten); kausal huvudläsning av
  slutbilden (dock ärligt redovisad som tvetydig).
- glm A: fel sanskritterm "(mūla)" för jaget (ska vara ātman); typo "buddhavs väg".
- glm C: typo "buddhavigen"; läsbar version mjukar "inte är jag" till "inte
  tillhör jaget"; bästa slutbilden av de nya filerna.
- D-filerna: granskningen av glm (granskare gemma4) upprepade den falska positiven
  om 生仏 med full säkerhet; granskningen av gemma4 (granskare qwen) trunkerades
  efter två meningar men det påbörjade fyndet var äkta.

**Slutdom P3:** deepseek A bäst (enda med fullständig apparat och korrekt
生仏-identifiering); ny tvåa glm C. Rangordning: deepseek A > glm C > glm A >
qwen C >> glm B.

## Runda 3 (flaggskepp)

| Cell | Poäng |
|---|---|
| deepseek-v4-pro B | 5,4,4,5,5,4,4,3,5,4 |
| glm-5.2 A | 4,4,4,5,4,4,4,4,3,4 |
| glm-5.2 C | 5,5,4,5,5,4,4,5,5,5 |
| gemma4 A | 4,4,4,5,3,5,5,4,4,4 |
| gemma4 B | 3,3,4,5,3,4,4,4,3,3 |
| gemma4 C | 4,4,4,5,3,5,5,4,4,4 |
| deepseek-v4-pro A/C, qwen (alla), glm B | EJ LEVERERAD (trunkerad/saknas) |

- deepseek-v4-pro:s leverans brast här (A trunkerad, C saknas) — bara B poängsättbar.
- Fel: gemma 草…おふる = "vissnar" (alla flöden, befäst i analysen); gemma B 時節 =
  "tid och rum"; glm A psykologiserande tillägg; われにあらざる försvagad till "tillhör".
- **Bästa enskilda: glm-5.2 C** (temporal ram, radikal negation, treställsstruktur,
  gräset *växer*, のみなり bevarat, inga tillägg).
