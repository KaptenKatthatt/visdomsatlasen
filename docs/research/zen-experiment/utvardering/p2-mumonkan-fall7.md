# Utvärderingsprotokoll: p2-mumonkan-fall7

Filologisk utvärdering utförd av Claude (Fable 5) 2026-07-13. Kriterieordning och
metod: se p1-protokollet.

## Runda 1 (körning 3)

**Leveransstatus:** qwen A tomt; qwen B utan engelskt mellansteg och trunkerad;
qwen C trunkerad i terminologin; glm A avbruten mitt i versen; glm C analyssteg
tomt och slutsteg avhugget; gemma D tomt. Endast deepseek levererade kompletta
A+B+C.

| Modell×Flöde | Poäng |
|---|---|
| qwen A (tomt) | 1 rakt över |
| qwen B (trunk.) | 3,2,3,2,3,2,1,2,4,1 |
| qwen C | 4,4,4,4,4,4,4,4,3,4 |
| deepseek A | 4,3,4,4,4,4,5,3,4,4 |
| deepseek B | 3,3,4,3,3,3,4,3,2,3 |
| deepseek C | 3,4,3,2,2,3,3,4,3,2 |
| glm A (trunk.) | 4,2,3,3,4,2,1,1,5,1 |
| glm B | 5,5,4,4,5,4,4,4,5,4 |
| glm C (trunk.) | 4,2,3,3,4,2,1,1,5,1 |
| gemma A | 2,3,3,3,3,4,4,2,3,2 |
| gemma B | 2,3,3,3,3,3,4,3,2,2 |
| gemma C | 4,4,4,4,4,4,4,4,4,4 |

**Viktigaste felen (runda 1):**
1. Hallucination (gravast): granskaren av qwen recenserade en TOM översättning,
   citerade text ur fel översättning och rekommenderade den tomma som "bästa
   utgångspunkt".
2. Utelämning: deepseek C läsbar: "Gå då och skålen" — verbet 洗 (diska) saknas.
3. Begreppsfel: gemma A/B "Zhōu Zhōu"/"Zh州" för 趙州 = Zhàozhōu.
4. Hallucination via mellansteg: gemma B — engelska stegets "those who
   over-explain" för 露出心肝者 propagerade till svenskan.
5. Hallucination: deepseek B "förväxlade det klara klockljudet med dunklet från en
   lerkruka" — 喚鐘作甕 säger bara "kallar klockan för en kruka".
6. Omotiverad säkerhet: gemma A konfidens 5 trots namnfel m.m.

**Flöde D:** granskningen av deepseek (granskare glm) fångade "Gå då och skålen"
och utslätningen av 喚鐘作甕 men trunkerades. Ingen granskare lyfte
Taishō-interpunktionens segmenteringsfråga självständigt.

**Bäst runda 1:** glm B — komplett läsbar version, alla konkreta bilder bevarade,
有省 = "fick en insikt", och ensam om att redovisa den textkritiska punkten
(者僧 = 這僧, Song-talspråk).

## Runda 2 (omkörning, nya filer: glm A/B/C, qwen C, tre D-filer)

| Fil | Poäng |
|---|---|
| glm A | 4,4,4,4,5,4,4,3,5,4 |
| glm B | 5,5,4,5,5,4,4,4,5,5 |
| glm C | 5,5,3,5,4,4,5,4,4,4 |
| qwen C | 4,5,3,4,4,2,3,4,4,3 |

- Alla fyra träffar ankarna (grötfrågan, "gå och tvätta skålen", "fick insikt",
  kontrafaktisk vers, korrekt segmentering 露出心肝｜者僧) men är fortfarande
  svansavhuggna i apparaten.
- Nya fel: "almskål" för 鉢盂 (= allmoseskål) i glm C och qwen C med
  pseudoetymologi; qwen C svengelska ("monken", "mastern", "Hadet du tidigare
  vetat", kvarlämnade hanzi); glm C hallucinerad idiomparallell ("ta hästen för
  häst och vagn för vagn").
- D-filerna: granskningen av deepseek (granskare glm) havererade efter två meningar
  (dock äkta påbörjat fynd); granskningen av glm (granskare gemma4) komplett men
  med falska positiver (underkände korrekt kontrafaktisk vers och korrekt
  jag-läsning av 某甲); granskningen av gemma4 (granskare qwen) trunkerad efter en
  pedantisk notis — missade "Tvätta skålen och gå" (felläst 去) och "Zhōu Zhōu".

**Slutdom P2:** glm B står sig som bästa översättning. qwen C:s filologi är stark
men språkdräkten diskvalificerar den. Korsgranskningen gav på denna passage sämre
utbyte än sin tokenkostnad.

## Runda 3 (flaggskepp)

| Cell | Poäng |
|---|---|
| deepseek-v4-pro A | 5,4,4,4,4,5,5,4,5,5 |
| deepseek-v4-pro B | 5,5,5,5,5,5,5,5,5,5 |
| deepseek-v4-pro C | 5,5,5,5,5,5,5,5,5,5 |
| glm-5.2 A | 4,4,5,4,4,5,5,4,5,5 |
| glm-5.2 C | 5,4,5,5,5,5,5,5,5,5 |
| gemma4 A | 3,3,3,4,3,4,4,3,2,3 |
| gemma4 B | 2,2,4,4,3,4,4,3,3,2 |
| gemma4 C | 4,4,4,4,3,4,4,4,3,4 |
| qwen3.5:397b C | 3,4,4,3,4,3,3,4,3,3 (A/B/D ej levererade) |

- glm B trunkerade i apparaten (översättningen komplett).
- Fel: gemma B inverterar 者僧 ("munkar som inte lyssnar"); gemma A hallucinerar
  "hörde klockan men trodde vattenkärl"; glm-D falsk positiv mot den kontrafaktiska versen.
- **Bästa enskilda: deepseek-v4-pro C** (korrekt 者僧, 甕="kruka", bevarad kontrafaktik).
  deepseek B och glm C tätt efter.
