# Mänsklig granskning — testöversättningar (utkast)

Granskning av produktionskörningens fyra översättningar (`radata/<id>.json`) mot de
filologiska ankarna i `docs/research/zen-experiment/utvardering/p*.md` och
checklistorna `docs/checklists/review-language.md` + `verify-sources.md`. Utförd av
Claude som förgranskning; **ägaren (redaktören) beslutar**. Granskningsfynden från
`deepseek-v4-pro` är uppslag, aldrig facit.

Metod: för varje passage läses original + `svenskOrdagrann` + `svenskLasbar` +
modellens tvetydighets-/terminologinoter + korsmodellsgranskningen, mot de kända
fällorna nedan (från experimentets felanalys). Varje ankare får utfall
**OK / avviker / kräver ägare/specialist**.

## Kända fällor att kontrollera (ankare)

**p1 — Hakuin, Zazen wasan (inledning)**
- `水を離れて氷なく` = "skild från vattnet finns ingen is" (riktningen får inte
  inverteras till "skiljer man vattnet från isen …").
- `衆生近きを知らず` — 近き ("det nära") ska inte felläsas.
- `はかなさ` = förgänglighet/fåfänglighet (inte engelsk kalk "futiliter").
- `渇を叫ぶ` = "ropar av törst / skriker efter [vatten] i sin törst" (inte "ropa
  efter törst").
- `長者の家の子` = den rike mannens/storgårdens barn (Lotussutrans liknelse om den
  förlorade sonen, kap. 4 信解品 — inte "Sutra om det gyllene ljuset").

**p2 — Mumonkan fall 7**
- `洗鉢盂去` = "gå och tvätta skålen" — verbet 洗 (tvätta/diska) får inte tappas.
- `露出心肝｜者僧` — segmentering: 者僧 (= 這僧, Song-talspråk) hör till nästa sats
  ("den munken"), inte till 心肝.
- `喚鐘作甕` = "kallar klockan för en kruka/tunna" — ingen utbroderad scen ("trodde
  det var ett vattenkärl").
- `有省` = "fick en insikt / vaknade".
- `鉢盂` = allmoseskål (inte pseudoetymologisk "almskål").
- Versen är kontrafaktisk ("hade man tidigare vetat …") — får inte vändas till en
  positiv sats.

**p3 — Dōgen, Genjōkōan (öppningen)**
- `草は棄嫌におふる` = gräset **växer** (生ふ) mitt i motvilja — inte "vissnar".
- `われにあらざる` = "inte är jag" (radikal negation) — inte mildrat till "tillhör
  inte jaget" eller monistiskt "inte skilt från mig".
- `豊倹` = överflöd/knapphet (rikedom/sparsamhet) — inte "fullhet och tomhet".
- `生仏` = varelser-och-buddhor (sammandragning) — inte "att bli buddha" (成仏) eller
  bara "levande buddhor".
- `時節` temporalt ("när/vid tiden då").
- `のみなり` (slutbildens "endast så") ska bevaras.

**p5 — Dōgen, Uji (öppningen)**
- `有時` hålls dubbeltydig ("ibland" / "varande-tid") synlig även i den läsbara
  texten — får inte plattas till bara "ibland".
- `丈六八尺` = två gestalter (~4,8 m resp. ~2,4 m / sexton fot resp. åtta fot) — inte
  "sex fot"/"1,8 m".
- `払子` = flugviska — inte "barn", "kvast" eller "flugsmälla".
- `露柱灯籠` = två ting (den nakna pelaren OCH lyktan) — inte hopslaget.
- `虚空` = rymden/tomrummet — inte "intet".
- `杖` = staven; `丈六金身` = den gyllene gestalten (manifestationskroppen), inte
  "förmultnande kropp".

## Leveransutfall

Alla fyra passager levererade **komplett flöde C** (`glm-5.2:cloud`): analys →
svensk översättning med samtliga fem rubriker, terminalt avslutade. **Ingen
A-reserv utlöstes.** Det bekräftar rapportens §1: glm-5.2 är leveranssäker för det
analystunga C-flödet. Korsgranskaren `deepseek-v4-pro:cloud` levererade komplett
granskning på alla fyra.

## Per passage

### p1 — Hakuin, Zazen wasan
**Ankare: alla OK i den ordagranna versionen.** 水を離れて氷なく korrekt riktning
("åtskilda från vatten finns ingen is"); 近き-tvetydigheten öppet redovisad;
Lotussutra-liknelsen korrekt attribuerad (inte "gyllene ljuset"); はかなさ =
"fåfänglighet" (ingen engelsk kalk).

**Verifierade fynd (kräver redaktionell fix):**
- **Läsbar rad 3** "Utan att skiljas från vatten finns ingen is" är stapplande och
  vänder villkoret; *ordagranna* raden är korrekt. Rättas till t.ex. "Skild från
  vattnet finns ingen is". (Korsgranskningen fångade detta riktigt.)
- Läsbar mildrar 子となりて ("bli") till "vara barn" — den ordagranna har "bli".

**Falska positiver / överdrifter (avvisas):** deepseeks samlade dom ("inte duglig,
varje rad måste göras om") är kraftigt överdriven — översättningen är i huvudsak
korrekt. "Påhittade förklaringar" (och ändå / eller / men) är normala läsbarhets-
bindningar i en *läsbar* version, inte hallucinationer; den ordagranna saknar dem.

### p2 — Mumonkan fall 7
**Ankare: alla OK.** 洗 ("tvätta skålen") bevarat; 者僧-segmenteringen korrekt
(både läsningarna redovisade, 者僧="denne munk" vald); 喚鐘作甕 = "kallar klockan
för en kruka" utan utbroderad scen; 有省 = "fick insikt"; 鉢盂 = "munkskål";
kontrafaktisk vers bevarad.

**Verifierade fynd (redaktionell not):**
- **開口見膽 / 露出心肝** — de konkreta organen (膽 galla/mod, 心肝 hjärta/lever) bör
  bevaras tydligare än glm:s "visar sitt hjärta / blottar sitt innersta". Äkta
  fynd; en fråga för den redaktionella versionens bildspråk.

**Semi-falska positiver:** deepseek anför 者僧 och 洗鉢盂去 under "falsk säkerhet/dold
tvetydighet" — men glm *redovisade* båda läsningarna i sin apparat. Läsvärt men
inte en dold tvetydighet. Samlad dom "duglig utgångspunkt": rimlig.

### p3 — Dōgen, Genjōkōan
**Ankare: alla OK.** 草は…おふる = "gräset **växer**" (inte "vissnar"); われにあらざる
= "inte är mig" (radikal negation, ej mildrad); 豊倹 = "överflöd och brist"; 生仏 =
"levande varelser och buddhor" (ej 成仏); のみなり = "det är helt enkelt så" bevarat.

**Verifierade fynd (kräver redaktionell fix):**
- **滅 översatt "död" i läsbar** (生なく滅なし → "varken födelse eller död"). Äkta
  fel: 滅 = upphörande/utslocknande, skilt från 死 (död) i första meningen. Den
  *ordagranna* har korrekt "upphörande". Rättas i läsbar.
- Läsbar reducerar 愛惜/棄嫌 till en komponent ("fästelse"/"avvisande"); ordagranna
  har hela paren. Mindre; överväg att återinföra dubbelheten.

**Falska positiver:** deepseeks "dolda tvetydigheter" (すなはち, に, われにあらざる)
är samtliga *öppet redovisade* i glm:s tvetydighetsapparat. Samlad dom "duglig
utgångspunkt": rimlig; 滅-fyndet är det värdefulla.

### p5 — Dōgen, Uji
**Ankare: alla OK — fältets starkaste.** 有時 dubbeltydig och synlig ("varande-tid"
+ "ibland" med not); 丈六八尺 = "sexton fot och åtta fot" (två mått, inte "sex fot");
払子 = "viftare" (inte "barn"); 露柱灯籠 = "bar pelare och lykta" (två ting); 虚空 =
"tomma rymden" (inte "intet"); 丈六金身 = "gyllene kroppen" (inte "förmultnande").

**Verifierade fynd (öppna redaktionella frågor, ej fel):** deepseek anmärker inget
term-, utelämnings- eller interferensfel. Dess "dolda tvetydigheter" (subjektet
[någon] i citatet, 有時 i citatet, 一如なるべし normativt/ontologiskt) är alla
redovisade i glm:s ordagranna/analys. Öppna val för den redaktionella versionen,
inte fel. Samlad dom "mycket duglig utgångspunkt": välgrundad.

## Sammanfattande omdöme

Pipelinen (glm-5.2 flöde C + deepseek-v4-pro-granskning) **klarade valideringen**:
alla fyra översättningar träffar samtliga kända filologiska fällor i den ordagranna
versionen och håller tvetydigheter synliga. Kvarstående brister är få, konkreta och
ligger i den **läsbara** versionen (p1 rad 3, p3 滅, p2 organbildspråk) — precis den
typ av redaktionell finputs pipelinen förutsätter. Korsgranskaren gav genuint värde
(fångade p1-rad-3, p3-滅, p2-organen) men bekräftade också rapportens varning:
självsäkra falska positiver (p1:s underkännande, upprepade "dolda tvetydigheter" som
i själva verket var redovisade). **Granskningsfynd är uppslag, inte facit.**

**Beslut:** kvaliteten bedöms räcka som *utkast* för ägarens granskning. Ingenting
publiceras utan ägarens beslut (AI publicerar aldrig ensamt). Förbehåll som står
kvar: p3/p5 japanska bör kollationeras mot SAT före publicering; p1 slutlig
teckenverifiering mot tryckt utgåva; de öppna terminologibesluten i
`terminologi.md`.

## Ägarens beslut (chattgranskning 2026-07-14)

Ägaren (Jonas Olson) läste alla fyra texterna, en i taget:

| Passage | Beslut | Grund |
|---|---|---|
| p1 Hakuin, Zazen wasan | **godkänd** | Enkel, gripbar lekmannavers (vatten/is). |
| p2 Mumonkan fall 7 | avvisad | Vill inte ha med texten. |
| p3 Dōgen, Genjōkōan | avvisad | För svårgripbar. |
| p5 Dōgen, Uji | avvisad | För svårtillgänglig/abstrakt. |

**Redaktionell riktning (ägarens ord):** appen ska vara *avslappnad och lugn, inte
svår*. Buddhism är välkommet, men **mer lättillgängligt — som genom Alan Watts** —
inte klassiska filosofiska primärtexter. Det bekräftar den befintliga
Watts-inriktningen (`docs/research/alan-watts.md`, roadmapens Fas 12 »Modern
Interpreters: Alan Watts«, de publicerade Watts-rummen).

**Slutsats för valideringen:** pipelinen (glm-5.2 flöde C + deepseek-granskning)
**fungerar filologiskt** — den producerar trogna, transparenta översättningar som
klarar de kända fällorna. Den avgörande begränsningen ligger inte i
översättningskvaliteten utan i **texturvalet**: tunga primärtexter (särskilt Dōgen)
passar inte appens ton. Framtida översättningsarbete bör därför rikta in sig på
tillgängligt, lugnt material (uttolkare som Watts; enklare lekmannatexter av
p1-typ), inte på svår klassisk zenfilosofi. Endast p1 går vidare som kandidat, och
även den bara som *utkast* tills teckenverifiering mot tryckt utgåva är gjord.

