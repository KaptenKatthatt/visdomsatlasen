# Översättningsflöde för klassiska zentexter

Forskningsrapport för Visdomsatlasen. Frågan: hur skapar vi egna svenska
översättningar av äldre japanska och kinesiska zentexter (public domain) med
hjälp av Ollama Cloud-modeller via Hermes-gatewayen — vilken modell, vilket
arbetsflöde, och med vilka skyddsräcken?

Testdatum: 2026-07-13. Experimentkod och rådata: `docs/research/zen-experiment/`
(passager med proveniens, samtliga modellutdata) och `scripts/zen-experiment/`
(körbart harness). Allt i denna rapport som kräver specialistverifiering är
markerat **[kräver specialistgranskning]**.

---

## 1. Exekutiv rekommendation

*Baserad på omkörningen med de aktuella Ollama Cloud-flaggskeppen (2026-07-14):
`deepseek-v4-pro:cloud` (512k kontext), `glm-5.2:cloud` (1M), `gemma4:31b-cloud`
(256k, dagens ingest-modell) och `qwen3.5:397b-cloud`. Den tidigare
v3.2-rekommendationen är ersatt.*

- **Primär översättningsmodell: `glm-5.2:cloud`.** Den bästa kombinationen av
  filologisk kvalitet och leveranssäkerhet: producerade den bästa enskilda svenska
  översättningen på tre av fem passager — inklusive båda de svåraste Dōgen-texterna
  (Genjōkōan och Uji) — och levererade komplett i 13 av 15 översättningsceller.
  Håller genomgående tvetydigheter synliga (t.ex. 有時 dubbeltydig, 者僧-läsningen),
  bevarar negationsmönster och metaforer, och är mest transparent om osäkerhet.
  Svagheter: enstaka lexikalfel (払子 "piska", 虚空 "intet") som oftast rättas i dess
  eget analysflöde, samt stavskavanker — svensk språktvätt förblir obligatorisk.
- **Kvalitativ medparti: `deepseek-v4-pro:cloud`.** Högst tak i materialet — bästa
  enskilda översättning på P2 och P4, med flera celler i det närmaste felfria — och
  gav de mest träffsäkra korsgranskningsfynden (fångade bl.a. "skitspade" för 橛 och
  en påhittad buddhagestalt). Men leveranssäkerheten är sämre: dess analystunga
  C-flöde och delar av A trunkerade på de svåraste passagerna (bara 10 av 15 celler
  kompletta), och som granskare trunkerar den ibland. Utmärkt när den fullföljer,
  men mindre pålitlig som ensam produktionsmotor.
- **Granskningsmodell: `deepseek-v4-pro:cloud`** (dess granskningar gav de skarpaste,
  mest korrekta fynden), med **`gemma4:31b-cloud` som pålitlig reserv** (resonerar
  inte → trunkerar aldrig, och fångade bl.a. den dolda 有時-tvetydigheten i P5).
  Ovillkorlig regel: *ingen* granskarmodell duger som automatisk grind — samtliga
  injicerade minst en självsäker falsk positiv (t.ex. underkände korrekt 道道 =
  "Tala!" som "borde vara Vägen", eller stämplade den reella 赤肉團-debatten som
  påhitt). Granskningsfynd är uppslag för mänsklig kontroll, aldrig facit. Använd en
  annan modell än översättaren (glm-5.2 översätter → deepseek-v4-pro/gemma4 granskar).
- **Rekommenderat flöde: C (analytiskt) — analys först, sedan svensk översättning ur
  analysen, direkt från originalet.** C gav den bästa enskilda översättningen på tre
  av fem passager och den starkaste tvetydighetsapparaten. Avvägning: C är också det
  mest trunkeringskänsliga flödet (analyssteget är det längsta), så det förutsätter en
  leveranssäker primärmodell (glm-5.2) och leveranskontroll per steg. **Flöde B
  (engelskt mellanled) är ett dugligt andraval** (vann P1 och P4) men bär
  interferens-/propageringsrisk; **flöde A (direkt) är den mest leveranssäkra
  reserven** när C trunkerar.
- **Engelska som mellanled: inte som separat standardlager.** Flöde B gav visserligen
  bästa resultat på två passager, men fel i det engelska steget propagerade till
  svenskan på flera passager (gemmas barn-hallucination ur 払子 via engelskan i P5,
  "over-explainer"-läsningen i P2) trots uttrycklig verifieringsinstruktion. Med en
  stark primärmodell i C-flödet behövs inget engelskt lager; en engelsk
  arbetsöversättning får sparas som *dokumentation* men inte utgöra underlaget.
- **Största begränsningar:** (1) fem korta passager, en körning per cell — små
  underlag, inga upprepningar; (2) utvärderingen är gjord av AI (Claude) mot ordböcker
  och etablerade översättningar, inte av en specialist på klassisk japanska/kinesiska
  — **[kräver specialistgranskning]**; (3) **de tunga resonerande flaggskeppen
  trunkerar** — deras interna tankeblock äter tokenbudgeten och kapar de långa
  analyssvaren även vid 49 152 tokens; `qwen3.5:397b` visade sig i praktiken
  icke-levererande för denna strukturerade uppgift (≈2 av 15 kompletta celler) och
  uteslöts, medan `gemma4` (icke-resonerande) alltid levererade komplett. Leverans-
  säkerhet vägde därför lika tungt som filologi vid modellvalet (se §5); (4) kontots
  Ollama-kvot begränsar hur mycket som kan köras per fönster (~5 h reset); (5)
  modellversioner är färskvara — verifiera utbudet mot `ollama.com/library?c=cloud`
  och omtesta vid modellbyte.

---

## 2. Källtabell

| # | Författare | Verk | Datering | Källspråk | Upphovsrätt (original) | Svårighet | Skäl för urval |
|---|---|---|---|---|---|---|---|
| P1 | Hakuin Ekaku (1686–1769) | Zazen wasan (坐禅和讃) | ca 1750-tal | Tidigmodern japanska (7-5-vers) | Public domain (död 1769) | Enkel | Enkel undervisningstext för lekfolk; testar ton och naturlig svenska |
| P2 | Wumen Huikai (1183–1260) | Wumenguan/Mumonkan, fall 7 med kommentar och vers | 1228 | Klassisk kinesiska (läst som kanbun) | Public domain (1228) | Medel | Kōan + kommentar; tre register; öppen segmentering i Taishō-interpunktionen |
| P3 | Dōgen (1200–1253) | Shōbōgenzō: Genjōkōan, öppningen | 1233 | Klassisk japanska (wabun) | Public domain (död 1253) | Svår | Språkligt svåraste författaren; omdiskuterade termer (豊倹, 跳出) |
| P4 | Linji Yixuan (d. 866); red. 1120 | Rinzai-roku: 無位真人-passagen | 800-tal/1120 | Klassisk kinesiska med Tang-talspråk | Public domain | Svår | Tung buddhistisk terminologi; filologiskt omtvistade ord (赤肉團, 面門, 乾屎橛) |
| P5 | Dōgen (1200–1253) | Shōbōgenzō: Uji, öppningen | 1240 | Kanbun-citat + klassisk japanska | Public domain (död 1253) | Mycket svår | Genuint tvetydigt nyckelord (有時); språkbyte mitt i passagen |

Fullständig proveniens (utgåva, transkriptionskälla med länk, PD-motivering,
transkriptionsanmärkningar) ligger i `docs/research/zen-experiment/passages/*.json`.
Kinesiskan är teckenexakt ur Taishō-utgåvan via CBETA:s XML
([T48n2005](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T48/T48n2005.xml),
[T47n1985](https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml));
japanskan är kryssverifierad mot flera oberoende transkriptioner men bör
kollationeras mot SAT-databasen eller tryckt utgåva före publicering
**[kräver specialistgranskning]**.

Viktig distinktion: *originalen* är fria; *moderna utgåvors* interpunktion,
kanaval och styckeindelning är redaktionella tillägg (Taishō 1924–34, CBETA,
Iwanami). Vi återger utgåvans text med attribution och dokumenterar det som
utgåveberoende — inte som del av 1200-talstexten.

## Jämförelsereferenser (konsulterade, aldrig kopierade)

Etablerade översättningar användes som riktmärken vid poängsättningen, med
exakt attribution och utan att deras formuleringar återanvänds i föreslagna
svenska texter:

- *The Record of Linji*, öv. Ruth Fuller Sasaki, red. Thomas Yūhō Kirchner
  (University of Hawai'i Press, 2009) — standardutgåvan med Iriya Yoshitakas
  och Yanagida Seizans filologi ([UH Press](https://uhpress.hawaii.edu/title/the-record-of-linji/)).
- Norman Waddell & Masao Abe, *The Heart of Dōgen's Shōbōgenzō* (SUNY Press, 2002) —
  Genjōkōan och Uji.
- Kazuaki Tanahashi (red.), *Treasury of the True Dharma Eye* (Shambhala, 2010) —
  Genjōkōan och Uji ([förlagssida](https://www.shambhala.com/dogen/)).
- Shōhaku Okumura, *Realizing Genjōkōan* (Wisdom Publications, 2010) — kommentar
  ([Wisdom](https://wisdomexperience.org/product/realizing-genj%C5%8Dk%C5%8D/)).
- Katsuki Sekida, *Two Zen Classics: Mumonkan and Hekiganroku* (Weatherhill, 1977)
  och Zenkei Shibayama, *Zen Comments on the Mumonkan* (Harper & Row, 1974) — Mumonkan.
- Översiktskatalog över Genjōkōan-översättningar:
  [thezensite](http://www.thezensite.com/ZenTeachings/Dogen_Teachings/GenjoKoan8.htm).

Någon etablerad svensk översättning av Dōgen eller Rinzai-roku hittades inte i
sökningen (2026-07-13); svenskan bedöms därför mot norm för svensk sakprosa och
mot de engelska standardöversättningarnas semantik, inte mot en svensk
föregångare. **[kräver specialistgranskning om svensk utgåva finns]**

Terminologi kontrollerades mot fritt tillgängliga ordboksverk, främst Soothill &
Hodous, *A Dictionary of Chinese Buddhist Terms* (1937, public domain) samt
öppna poster i Digital Dictionary of Buddhism (buddhism-dict.net).

---

## 3. Modelljämförelse

Testade flaggskepp (exakta taggar, kontextlängder och prob-status maskinellt i
`results/modeller.json`; testdatum 2026-07-14, Ollama-daemon 0.24.0 via
Hermes-gatewayen; temperatur 0,2, tokenbudget höjd i steg till 49 152 för att rymma
tankeblocken). Kandidatlistan verifierades mot `ollama.com/library?c=cloud` och leder
varje familj med aktuellt flaggskepp. `kimi-k2.7-code:cloud` uteslöts som
coder-specialiserad; MiniMax fanns som fallback men behövdes ej.

| Modell | Kontext | Kompletta A/B/C (av 15) | Bästa-översättning-vinster (av 5) | Karakteristik |
|---|---|---|---|---|
| `glm-5.2:cloud` (MoE) | 1 000 000 | **13/15** | **3** (P1, P3, P5) | Bäst helhet: hög filologisk kvalitet + hög leveranssäkerhet. Vann båda svåra Dōgen-passagerna. Håller tvetydigheter synliga, bevarar negation/metafor, mest transparent. Enstaka lexikalfel (払子 "piska", 虚空 "intet") rättas oftast i eget C-flöde. |
| `deepseek-v4-pro:cloud` (MoE) | 524 288 | 10/15 | **2** (P2, P4) | Högst tak — flera nästan felfria celler och de skarpaste granskningsfynden — men leveranssvag: analystunga C och delar av A trunkerade på de svåraste passagerna. Bäst när den fullföljer. |
| `gemma4:31b-cloud` (tät) | 262 144 | **15/15** (snabbast) | 0 | Alltid komplett (resonerar inte) och flytande svenska, men filologiskt svagast: hallucinationer (barn ur 払子, "spillkråka"/"skitspade" för 乾屎橛, "vissnar" för växer) och systematiskt konfidens 5 på felaktiga svar. Reserv/granskare snarare än översättare. |
| `qwen3.5:397b-cloud` (MoE) | 262 144 | **≈2/15** | 0 | I praktiken icke-levererande: tankeblocken trunkerar det synliga svaret även vid 49 152 tokens (A 1/5, B 0/5, C 1/5). Utesluten från de sista körningarna; partiella resultat behållna som belägg. Filologiskt vaken där text finns, men oanvändbar som produktionsmodell i nuläget. |

**Bästa enskilda leverans per passage** (komplett cell med apparat): P1 `glm-5.2` B ·
P2 `deepseek-v4-pro` C · P3 `glm-5.2` C · P4 `deepseek-v4-pro` B · P5 `glm-5.2` C.
Sammantaget: glm-5.2 3, deepseek-v4-pro 2 — och glm-5.2 vann de två filologiskt
svåraste (Genjōkōan, Uji), där deepseek-v4-pro:s leverans dessutom brast.

**Som granskare (flöde D):** deepseek-v4-pro gav de skarpaste, mest korrekta fynden
(t.ex. "skitspade"-felet i P4, den påhittade buddhagestalten i P5) men trunkerade
ibland; gemma4 levererade alltid och fångade den dolda 有時-tvetydigheten i P5, men
med fler falska positiver; glm-5.2:s granskningar var jämna. Genomgående injicerade
granskarna dock självsäkra fel — särskilt 道道 = "Tala!" underkänt till förmån för
"Vägen", och den reella 赤肉團-debatten (hjärta/kropp) avfärdad som påhitt. **Ingen
duger som automatisk grind.** *Attributionsnot:* resultatfilerna namnger den granskade
modellen men inte granskaren (harness-begränsning) — granskaren följer ringen
deepseek→glm→gemma i `run.ts`.

## 4. Flödesjämförelse

**Flöde A (direkt).** Mest leveranssäkert av översättningsflödena (kortast utdata →
minst trunkering) och gav kompetent svenska hos glm-5.2 och deepseek-v4-pro, men
tunnast tvetydighetsapparat och lockade svaga modeller till överkonfidens (gemma).
Bästa reserv när C trunkerar.

**Flöde B (engelskt mellanled).** Vann bästa enskilda översättning på P1 och P4 — en
god engelsk arbetsöversättning skärpte term- och tvetydighetsbesluten. Men
felpropagering från det engelska steget var återkommande och svårupptäckt: gemmas
"barn" ur 払子 (P5) och "over-explainer"-läsningen av 露出心肝者 (P2) föddes i
engelskan och ärvdes av svenskan, trots uttrycklig verifieringsinstruktion. Höjer
taket för starka modeller men sänker golvet för svaga — fel byte som separat
standardlager.

**Flöde C (analytiskt).** Gav den bästa enskilda översättningen på tre av fem passager
(P2, P3, P5) och den starkaste tvetydighets- och transparensapparaten; analyssteget
disciplinerade term- och läsningsval. Priset är trunkeringskänslighet: analyssteget är
det längsta utdata och kapades oftast för de resonerande modellerna (deepseek-v4-pro C
trunkerade på P2/P3/P4; qwen C nästan alltid). **C rekommenderas som produktionsflöde
tillsammans med en leveranssäker primärmodell (glm-5.2) och leveranskontroll per
steg** — vinsterna (golv, apparat, transparens) väger tyngre än risken, som den
mänskliga granskningen är rustad att fånga eftersom analysen är synlig.

**Flöde D (korsgranskning).** Gav verkligt värde på varje passage — fångade bl.a.
kärnmetaforens inversion, "skitspade" för 橛, den påhittade buddhagestalten och den
dolda 有時-tvetydigheten — men var också farligast när den fällde fel dom (underkände
korrekt 道道, dömde den reella 赤肉團-debatten som påhitt). **Behålls som felgenerator
för mänsklig kontroll, aldrig som automatisk grind**, och körs av en annan modell än
översättaren.

**Ändrad slutsats mot v3.2-omgången:** när alla flöden levererar komplett vinner C
fortfarande oftast, men med de resonerande flaggskeppen blev *leveranssäkerhet* den
avgörande skiljelinjen — flödesval och modellval hänger ihop, och den analystunga
C-vägen kräver en modell som faktiskt fullföljer den.

## 5. Felanalys

Kategoriserade huvudfynd (fullständiga per-passage-protokoll med poängtabeller för
båda omgångarna i `docs/research/zen-experiment/utvardering/`; alla utdata i
`results/`):

**Leveransfel (den dominerande felkällan i flaggskeppsomgången).** De tunga
resonerande modellerna trunkerar de långa analyssvaren mitt i ordet därför att
tankeblocket äter tokenbudgeten: deepseek-v4-pro:s C-flöde kapades på P2/P3/P4 ("...去
kan tol"), och `qwen3.5:397b` levererade knappt något komplett alls (A 1/5, B 0/5,
C 1/5) trots 49 152 tokens och tre omförsök per cell. Detta är inte konfiguration
utan ett drag hos modellerna — den icke-resonerande `gemma4` levererade alltid
komplett. Slutsats: en modell man inte tillförlitligt får komplett utdata ur är inte
produktionsklar oavsett latent kvalitet.

**Begreppsfel.** gemma "gräset *vissnar*" för 草…おふる = *växer* (P3, alla flöden,
befäst i dess egen analys); inversion av 水を離れて氷なく (P1); "skitspade" för 乾屎橛
(橛 = pinne, deepseek C P4); 丈六 nedskalat till "sex fot"/"1,8 m" (gemma P5, ska vara
~4,8 m); 払子 som "barn" (gemma P5).

**Stilproblem.** Mildring/förvanskning av grova 乾屎橛 ("spillkråka" hos gemma A P4 —
en fågel); kristnande ordval; didaktiska expansioner av avsiktligt oexplikerade
slutbilder; engelsk interferens ("positionslös sann människa" för 無位, "futiliter"
för はかなさ).

**Hallucinationer.** gemmas "barn" ur 払子 och "spillkråka" ur 乾屎橛; utbroderade
scener ("hörde klockan men trodde det var ett vattenkärl", P2). I granskningarna:
felaktiga påståenden om att korrekta läsningar vore påhitt.

**Omotiverad säkerhet.** gemma satte genomgående konfidens 5 på svar med påvisbara fel
(namn, mått, verb, hallucinationer); granskarna underkände korrekta läsningar (道道,
kontrafaktisk vers) med full säkerhet. glm-5.2 och deepseek-v4-pro var bäst
kalibrerade men inte felfria. Konfidenssiffror från okalibrerade modeller är sämre än
inga — de sparas som modellutsaga, inte som kvalitetsmått.

**Metodlärdom (leveranssäkerhet i flera steg).** Tokenbudgeten höjdes 4 096 → 16 384 →
20 480 → 32 768 → 49 152; tomt svar gjordes till fel med omförsök; varje svar
leveranskontrollerades (slutar det terminalt? finns alla rubriker?). Även vid 49 152
kvarstod trunkering för de mest verbosa resonerande modellerna — den praktiska
konsekvensen är att välja en leveranssäker modell (glm-5.2 eller en icke-resonerande
modell) snarare än att jaga en budget som rymmer godtyckligt långa tankeblock.

## 6. Rekommenderad produktionspipeline

Repeterbart flöde för en ny textpassage, i linje med
`docs/specs/source-and-context.md`, `docs/checklists/verify-sources.md` och
regeln att AI aldrig publicerar ensamt:

1. **Källverifiering.** Identifiera verk, författare, datering, språktyp.
   Hämta texten ur en spårbar transkription (CBETA/SAT för kanon; namngiven
   utgåva för japanska verk). Dokumentera Taishō-nummer eller motsvarande.
2. **Upphovsrättsverifiering.** Kontrollera originalets PD-status (upphovsmannens
   dödsår) och transkriptionens licens separat. Skilj original från utgåva.
3. **Originaltranskription.** Lägg passagen som teckenexakt fil med
   proveniensmetadata (formatet i `passages/*.json`).
4. **Modellöversättning.** Kör det rekommenderade flödet (se §1) med den
   rekommenderade modellen via Hermes: analys först, sedan svensk översättning ur
   analysen, direkt från originalet. Ordagrann + läsbar version, tvetydighets-
   och terminologinoter, konfidens. Tokenbudget ≥16k, temperatur låg,
   **leveranskontroll per steg** (tomt/trunkerat svar = omförsök; kontrollera att
   alla begärda rubriker finns) innan nästa steg får köra.
5. **Terminologiordlista.** För in valda termåtergivningar i en gemensam ordlista
   så att samma term återges lika i hela atlasen; avvikelser motiveras.
6. **Korsmodellsgranskning.** Låt granskningsmodellen (deepseek-v4-pro, med gemma4 som
   reserv) granska mot
   originalet med granskningsprotokollet (flöde D-prompten i
   `scripts/zen-experiment/prompter.ts`). Granskningens fynd är uppslag för
   den mänskliga granskningen — varje påstående verifieras, inget åtgärdas
   automatiskt (experimentet dokumenterade självsäkra falska positiver hos
   samtliga granskarmodeller).
7. **Mänsklig granskning.** Redaktören läser original, översättning och noter
   mot `docs/checklists/review-language.md` och `verify-sources.md`; vid behov
   konsulteras specialist på klassisk japanska/kinesiska.
8. **Redaktionell slutbearbetning.** Anpassa till Visdomsatlasens ton
   (lugn, seriös, utan att tvetydigheter döljs); notera alla medvetna avsteg.
9. **Proveniensmetadata.** Spara översättningsposten (format i §7) tillsammans
   med rummet/källpassagen; publicering beslutas av ägaren enligt
   redaktionsflödet i CLAUDE.md.

---

## 7. Rekommenderat format för översättningspost

JSON (eller frontmatter) per översatt passage, förslagsvis under
`src/content/kallpassager/` när Fas 8 byggs:

```json
{
  "id": "rinzai-mui-shinnin",
  "original": "上堂云：「赤肉團上有一無位真人…",
  "kallreferens": {
    "verk": "Zhenzhou Linji Huizhao chanshi yulu",
    "utgava": "Taishō T47n1985, 0496c10–14",
    "transkription": "CBETA xml-p5 (hämtad 2026-07-13)",
    "lank": "https://raw.githubusercontent.com/cbeta-org/xml-p5/master/T/T47/T47n1985.xml",
    "upphovsratt": "original public domain; interpunktion CBETA"
  },
  "engelskArbetsoversattning": null,
  "svenskOrdagrann": "…",
  "svenskLasbar": "…",
  "terminologinoter": [{ "term": "無位真人", "atergivning": "…", "motivering": "…" }],
  "osakerheter": ["…"],
  "modell": { "namn": "glm-5.2:cloud", "digest": "…", "flode": "C-analytiskt", "datum": "2026-07-14" },
  "granskning": [
    { "typ": "korsmodell", "modell": "…", "datum": "…", "resultat": "…" },
    { "typ": "mansklig", "granskare": "ägaren", "datum": "…", "beslut": "…" }
  ],
  "status": "utkast"
}
```

Principer: originalet och dess proveniens är obligatoriska; den engelska
arbetsöversättningen sparas när den använts (transparens om härledningsvägen);
ordagrann och läsbar version hålls isär; osäkerheter följer med posten hela
vägen till publicering i stället för att strykas under putsningen.

---

## Bilagor

- Rådata: `docs/research/zen-experiment/results/` (alla prompter och svar,
  latenser, modellmetadata).
- Utvärderingsprotokoll per passage (poängtabeller, felkatalog; v3.2-omgången och
  flaggskeppsomgången): `docs/research/zen-experiment/utvardering/`.
- Harness: `scripts/zen-experiment/run.ts` (återupptagbar; körs via
  `.github/workflows/zen-experiment.yml`).
- Metodhistorik: experimentet kördes i två omgångar. Den första (körning 3–4) testade
  `deepseek-v3.2`, `qwen3.5:cloud`, `glm-5.1` och `gemma4` och rekommenderade v3.2 —
  men kandidatlistan byggde på modell-rankningsbloggar och missade de aktuella
  flaggskeppen. Den andra (körning 5–9) uppdaterade mot den live-listade katalogen och
  testade `deepseek-v4-pro`, `qwen3.5:397b`, `glm-5.2` och `gemma4`; den ligger till
  grund för §1/§3/§4/§5. Lärdom: verifiera alltid mot `ollama.com/library?c=cloud`,
  inte mot sekundärkällor.
- Modellkatalogläget 2026-07 (verifierat mot library-listningen): Ollama Cloud omfattar
  bl.a. `deepseek-v4-pro`/`deepseek-v4-flash`, `qwen3.5:397b`, `glm-5.2`, `kimi-k2.6`,
  `minimax-m3`, `mistral-large-3`, `nemotron-3-ultra`, `gpt-oss` och `gemma4`;
  prissättning per abonnemang (Free/Pro/Max, debiterat efter GPU-tid). Källor:
  [Ollama cloud-katalog](https://ollama.com/search?c=cloud),
  [Ollama Cloud-docs](https://docs.ollama.com/cloud),
  [ollama/ollama på GitHub](https://github.com/ollama/ollama),
  [MiniMax M3](https://www.minimax.io/blog/minimax-m3),
  [Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4).
