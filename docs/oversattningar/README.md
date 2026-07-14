# Översättningar (staging — kvalitetsvalidering)

Denna katalog är en **stagingyta** för att validera den rekommenderade
produktionspipelinen i `docs/research/zen-oversattningsflode.md` (särskilt §6
pipeline och §7 metadataformat) från början till slut på riktiga zenpassager.
Det är en **kvalitetsvalidering, inte skarp innehållsproduktion**: ingenting här
kopplas in i `src/content` via `innehall.ts` — det är en separat uppföljning om
och när ägaren bedömer att kvaliteten räcker.

## Innehåll

- `radata/<passageId>.json` — råa modellutdata från produktionskörningen
  (`scripts/zen-oversatt/run.ts`), committade av CI-workflowen
  `.github/workflows/zen-oversatt.yml`. Ett steg per anrop: analys, svensk
  översättning ur analysen (flöde C), samt korsmodellsgranskningen.
- `radata/modeller.json` — valda modeller (översättare/granskare), probstatus och
  modellmetadata (digest, kontextlängd) för proveniens.
- `<id>.json` — en översättningspost per passage i §7-formatet, handförfattad
  efter mänsklig granskning (original, källreferens, svenskOrdagrann,
  svenskLasbar, terminologinoter, osäkerheter, modell, granskning, status).
- `terminologi.md` — gemensam terminologiordlista över passagerna, så att samma
  term återges lika (avvikelser motiveras).
- `granskning.md` — den mänskliga granskningen (Claude + ägaren) mot de
  filologiska ankarna i `docs/research/zen-experiment/utvardering/` och
  checklistorna `docs/checklists/review-language.md` + `verify-sources.md`.

## Pipeline (per passage)

1. **Källa/PD/transkription** — passagerna ligger i
   `docs/research/zen-experiment/passages/*.json` med proveniens. p1 finaliserad
   till ren självständig inledning; p3/p5 flaggade för SAT-kollation före
   publicering.
2. **Modellöversättning** — `glm-5.2:cloud`, flöde C (analys → svensk ur
   analysen), leveranskontroll per steg (A-reserv vid trunkering).
3. **Korsmodellsgranskning** — `deepseek-v4-pro:cloud` (reserv `gemma4:31b-cloud`)
   granskar C-översättningen. Fynden är uppslag för mänsklig kontroll, aldrig
   facit.
4. **Mänsklig granskning** — Claude + ägaren mot ankare och checklistor.
5. **Redaktionell slutbearbetning** — ren svensk version i Visdomsatlasens ton.
6. **Proveniensmetadata** — översättningsposten i §7-format, `status: "utkast"`.

## Publiceringsregel

**AI publicerar aldrig ensamt.** Ingenting här är publicerat. Statusen är
`utkast` tills ägaren (redaktören) läser och beslutar. Posterna visar hur de
mappar mot appens `kallpassageSchema`
(`src/content/redaktion/schema.ts`), men inga skarpa källpassage-poster skapas i
detta test.
