# Utvärderingsprotokoll: p5-dogen-uji

Filologisk utvärdering utförd av Claude (Fable 5) 2026-07-13. Kriterieordning och
metod: se p1-protokollet.

## Runda 1 (körning 3)

**Leveransstatus:** qwen A och B tomma (B: båda stegen); qwen C avbruten mitt i
ordet; glm A trunkerad i terminologin, glm B:s svenska steg avhugget mitt i
meningen; 2 av 4 D-granskningar tomma.

| Modell×Flöde | Poäng |
|---|---|
| qwen A/B (tomma) | 1 rakt över |
| qwen C (trunk.) | 3,4,2,2,3,1,1,2,4,1 |
| deepseek A | 4,5,4,4,4,4,5,5,4,4 |
| deepseek B | 4,4,4,3,4,4,4,5,4,4 |
| deepseek C | 4,3,4,4,4,4,5,4,3,4 |
| glm A (trunk.) | 4,5,3,4,4,3,4,4,4,3 |
| glm B (trunk.) | 3,3,3,2,3,2,1,1,4,1 |
| glm C | 3,5,2,4,4,4,4,4,3,3 |
| gemma A | 2,4,2,3,2,3,4,3,1,2 |
| gemma B | 2,4,2,2,2,2,3,3,1,1 |
| gemma C | 3,4,3,4,3,4,4,4,3,3 |

**Viktigaste felen (runda 1):**
1. Hallucination (grav, gemma A/B): "Ibland borstar man bort barn med en stav" /
   "ett stav-sopande barn" — 杖払子 = "staven och flugviskan"; inget barn.
   Försvarat som "bokstavlig återgivning" = omotiverad säkerhet ovanpå
   hallucination.
2. Begreppsfel (mått): glm C "en shaku och sex" för 丈六 (= sexton fot); gemma
   "sex fot"/"en zhang sex sun". deepseek ensam om genomgående korrekt
   "sexton fot eller åtta fot".
3. Begreppsfel (ihopslagna bilder): gemma "nakenpelarlykta"/"daggpelare-lykta" —
   露柱灯籠 är två ting.
4. Engelsk interferens: gemma B "en hög, hög peak"; deepseek B "det tomma
   rymden", "tolf timmar".
5. Lapsus: deepseek A "Buddhas förmultnande kropp" om 丈六金身 (avses
   manifestationskroppen); deepseek C "Existens är alltid tid" för みな = alla.
6. Omotiverad säkerhet: gemma konfidens 4 trots barn-hallucinationen.

**Flöde D:** granskningen av glm (granskare gemma4) var experimentets bästa —
fångade exakt 丈六-felet och den dolda 有時-tvetydigheten ("Genom att i den
läsbara texten bara skriva 'ibland' raderar man helt Dōgens poäng"). Granskningen
av qwen (granskare deepseek) citerade text som inte fanns. Två granskningar tomma.

**Bäst runda 1:** deepseek A — komplett, versens alla åtta bilder korrekta,
övergången till Dōgens omläsning markerad och redovisad.

## Runda 2 (omkörning, nya filer: glm A/B/C, qwen B/C, två D-filer)

| Fil | Poäng |
|---|---|
| glm A | 4,5,3,4,4,4,4,3,5,4 |
| glm B | 4,4,3,4,4,3,4,3,4,3 |
| glm C | 4,5,3,4,4,3,3,3,4,4 |
| qwen B | 3,3,2,3,3,3,3,2,4,2 |
| qwen C | 3,4,2,3,3,3,2,2,4,2 |

- Alla fem trunkeras fortfarande i apparaten (KONFIDENS saknas i samtliga).
- glm A klarar måttankaret bäst ("en jō och sex shaku eller åtta shaku" + not om
  två buddhagestalter) och håller 有時-dubbelläsningen synlig in i ordagranna
  texten; fälls på "dagg-pelare" och "kvast" för 払子.
- qwen B: engelska steget levererade bara metadata-eko — svenskan arbetade utan
  stöd; 八尺 tappas helt. qwen C: "sexton [jō]" (fel enhet, ≈ 48 m); läsbar
  version trunkeras katastrofalt före hela wabun-delen. qwen B/C: "flugsmälla"
  för 払子 (fel föremål, komisk registerkrock).
- D-filerna: granskningen av glm (granskare gemma4) komplett och bäst — fångade
  有時-frågan, "dagg-pelare" och "tolv tidsåldrar"; granskningen av deepseek
  (granskare glm) hade en fabricerad falsk positiv ("saknar verben 立 och 行" —
  de finns) och trunkerades.

**Slutdom P5:** deepseek A står, glm A stark tvåa (vinner tvetydighetskriteriet,
förlorar på leverans). qwen fortsatt fältets svagaste leverantör.

## Runda 3 (flaggskepp)

| Cell | Poäng |
|---|---|
| deepseek-v4-pro A | 4,4,4,4,4,4,5,4,4,4 |
| deepseek-v4-pro B | 5,5,4,4,4,3,3,5,5,4 |
| deepseek-v4-pro C | 4,4,4,4,4,3,4,4,5,4 |
| glm-5.2 A | 4,5,3,4,4,4,4,5,4,4 |
| glm-5.2 B | 4,4,3,4,4,3,3,4,4,3 |
| glm-5.2 C | 5,5,4,4,4,4,4,5,5,5 |
| gemma4 A | 2,3,2,3,2,4,4,3,1,2 |
| gemma4 B | 2,3,2,3,2,3,3,3,1,2 |
| gemma4 C | 2,3,2,3,2,4,4,3,1,2 |
| qwen3.5:397b (alla) | EJ LEVERERAD (trunkerad/saknas) |

- deepseek-v4-pro levererade alla fyra flöden komplett här (hög leveranssäkerhet).
- Fel: gemma hallucinerar "barn" ur 払子 (alla flöden) + måttkollaps 丈六="sex fot";
  deepseek A tappar 八尺 ("buddhastaty på sexton fot"); glm A 虚空="intet" (rättat i C).
- glm-D (gemma granskar glm) fångade den dolda 有時-tvetydigheten skarpt.
- **Bästa enskilda: glm-5.2 C** (有時 dubbeltydig, 丈六八尺 två gestalter, staven+
  flugviskan utan barn, pelare OCH lykta, 虚空="rymden"). deepseek B tvåa.
