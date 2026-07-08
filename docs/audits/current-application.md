# Granskning av nuvarande applikation (Fas 0)

- **Datum:** 2026-07-08
- **Gren:** `remake` (identisk med `main` vid granskningen), commit `a67f8d6`
- **Granskare:** Claude (AI), på uppdrag enligt `docs/specs/implementation-roadmap.md`, Fas 0
- **Omfattning:** Hela repot — appkod, serverkod, konfiguration, dokument. Ingen appkod har ändrats.

---

## Sammanfattning

Den nuvarande applikationen är en välbyggd, liten och kvalitetssäkrad kodbas (~6 300 rader TS/CSS)
som redan delar den nya visionens *själ* — lugn typografi, inga engagemangsmekanismer, inga emojis,
offline-stöd, privat data i enheten — men inte dess *struktur*. Appen är organiserad kring
**traditioner, verk och personer**; specifikationerna kräver organisation kring **frågor, teman och
reflektionsrum**.

Slutsatsen är att grunden (verktygskedja, backend, designsystem, biblioteksläsare, lagringsmönster)
ska **behållas**, att skalet (hem, läsvy, navigation, samling) ska **anpassas**, och att
**innehållsmodellen och innehållsorganisationen ersätts**. Väldigt lite behöver kastas.

Det största arbetet i omgörningen är inte kod — det är **innehåll** (18–30 granskade rum enligt
Fas 12) och de **redaktionella modellerna** som bär det.

---

## Metod och verifierat tillstånd

Granskningen bygger på genomläsning av samtliga filer i `src/`, `server/`, `scripts/`, rotkonfig,
`docs/vision/` (11 dokument), `docs/specs/` (13 dokument) och `docs/checklists/` (4 dokument),
samt på följande körningar (2026-07-08, Node 22, Windows):

| Kontroll | Resultat |
| --- | --- |
| `npm ci` | OK |
| `npm run check:types` (`tsc -b`, app + node + server) | OK |
| `npm run check:coverage` (type-coverage) | 100,00 % app (5191/5191) · 100,00 % server (3505/3505) |
| `npm run check:length` (fallow, max 50 rader/funktion) | OK — 416 funktioner analyserade |
| `npm run check:dead` (fallow dead-code) | OK — inga fynd |
| `npm run build` (tsc + vite build) | OK — 344 kB JS (111 kB gzip), 82 kB CSS, PWA-precache 17 poster |
| `BIBLE_SOURCE=fixture TRANSLATE=off npm run ingest` | OK — databasen fylldes med samtliga registrerade verk |
| Körning i webbläsare (Vite + API, 375×812) | OK — hem, läsvy (`/las/stoicism/essa`) och bibliotekskapitel (`/kapitel/dhammapada/dhammapada/1`) renderar utan konsolfel |

**Saknas i dag:** testrunner (inga tester finns), ESLint eller motsvarande lint utöver fallow.
Detta är Fas 1-krav i roadmapen.

---

## Nuvarande arkitektur

Appen består av två innehållsvärldar sida vid sida, med gemensamt skal:

```
Frontend (React 19 + Vite 7 + TanStack Router, kodbaserade rutter)
├── Atlasen — kuraterat innehåll som typade TS-moduler (src/content/)
│   ├── 6 ämnen (topics): historiskaJesus, stoicism, egypten, sjalen, predikaren, lidandet
│   ├── personer, källutdrag, citat, tidslinje, atlas-karta, traditioner
│   └── Sidor: Hem, Utforska, Ämne, Läs (essä/kontext), Källa, Tidslinje,
│       Personer, Person, Atlas, Samling, Sök
└── Biblioteket — hela källtexter via API (src/pages/library/)
    └── Sidor: Bibliotek, Verk, Bok, Kapitel (läsare), Bibliotekssök

Backend (Node + Hono, server/)
├── SQLite via better-sqlite3 + Drizzle: works → books → verses (+ FTS5-index)
├── API: GET works / work / chapter / search, POST ingest (token-skyddad)
├── Ingest-pipeline med källadaptrar (11 verk: Bibeln 1917, Dhammapada,
│   Självbetraktelser, Tao Te Ching, Analekterna, båda Eddorna, Epiktetos ×2,
│   Seneca, Zhuangzi, Sokrates försvarstal) + Ollama-översättning till svenska
└── Serverar byggt SPA; Tailscale-only; ingen inloggning (borttagen i 2c02a6a)

Tvärgående
├── Designsystem »Folianten«: papper #FAF6ED, bläck, accent #772F35,
│   EB Garamond, 430 px centrerat skal, mörkt läge, CSS-tokens i global.css
├── Läsinställningar: 4 typsnitt (inkl. Atkinson Hyperlegible), 5 storlekar,
│   3 bakgrunder, mörkt läge — data-attribut + pre-paint-skript i index.html
├── PWA (vite-plugin-pwa/Workbox): precache + runtime-cache av /api/library,
│   offline-nedladdningsknapp med persisterad flagga
├── localStorage-store (React context): bokmärken, kapitelbokmärken,
│   anteckningar, senast läst, temaval — med defaults-merge och validering
└── Drift: Docker (flerstegs), GitHub Actions CI (check + build + fixture-ingest)
    och deploy till Hetzner via Tailscale
```

**Ramverk och routing:** React 19, Vite 7, TanStack Router med kodbaserade rutter i
`src/app/router.tsx` (16 rutter). CSS Modules per sida/komponent + globala tokens.
**State:** en enda React-context (`src/lib/store.tsx`) över localStorage — ingen extern
state-lib. **Backendberoende:** endast biblioteket kräver API; atlasen är helt statisk.

---

## Klassificering

Roadmapens kategorier: *keep* (behåll som är), *adapt* (bygg om för nya specen),
*replace* (ersätt med ny lösning), *remove* (ta bort), *investigate* (utred innan beslut).

### Keep — behåll

| Del | Filer | Motivering |
| --- | --- | --- |
| Verktygskedja | `package.json`, `tsconfig*.json`, `.fallowrc.json`, `vite.config.ts` | Strict TS, 100 % type-coverage, funktionslängds- och dödkodskontroll. Uppfyller redan halva Fas 1. |
| Backend-kärna | `server/index.ts`, `server/db/*`, `server/library/*`, `server/api/*`, `server/auth.ts`, `server/config.ts`, `server/lib/*` | Liten, läsbar Hono/SQLite-server med FTS5-sök och skyddad ingest. Ingenting i specarna motsäger den. |
| Ingest-pipeline | `server/ingest/**`, `scripts/ingest.ts`, `data/fixtures/` | Utbytbara källadaptrar, normaliserad modell, auto-ingest vid start, fixture-läge för CI. Blir grunden för specens källpassager. |
| Drift | `Dockerfile`, `.github/workflows/ci.yml`, `deploy.yml`, `.env.example` | Beprövad modell (samma som newsAgg). CI kör check + build + fixture-ingest. |
| PWA/offline | `vite.config.ts` (Workbox-konfig), `src/lib/offline.ts`, pre-paint-skriptet i `index.html` | Motsvarar visionens »offline först«. Runtime-cache + explicit nedladdning med persisterad flagga. |
| Designsystem | `src/styles/global.css`, `src/lib/theme.ts` | Tokens, mörkt läge som kvällsläsning, reduced-motion, focus-visible — ligger mycket nära `06-design-principles`. Inga emojis någonstans (verifierat med teckenskanning). |
| Läsinställningar | `ReadingSettingsSheet/Button`, delar av `store.tsx` | Exakt den personalisering `home-and-entry.md` tillåter (textstorlek, utseende). Atkinson Hyperlegible är en tillgänglighetsstyrka. |
| Lagringsmönster | `src/lib/storage.ts`, `src/lib/store.tsx` | Defaults-merge + validering av sparad state; user state separerad från innehåll — precis vad specarna kräver. Växer med nya fält (adapt-inslag). |
| Basbibliotek | `useAsync`, `useDebounced`, `shell.ts` | Små, testbara byggstenar utan beroenden. |
| Baskomponenter | `TopBar`, `BottomSheet`, `NotesSheet`, `BookmarkButton`, `RowLink`, `ToLink`, `Icons`, `StateNote`, `LinkedParagraph` | Lugna, återanvändbara. `NotesSheet` är nästan färdig för `notes-and-saved.md` (stängd som standard, autospar via onChange). |
| Biblioteksläsaren | `BibliotekPage`, `VerkPage`, `BokPage`, `KapitelPage`, `BibliotekSokPage`, `OfflineButton` | Motsvarar specens »Källor«-del av Biblioteket: verk → bok → kapitel med FTS-sök. Behålls som den fungerar; får ny plats i den större biblioteksstrukturen (adapt-inslag i navigering). |

### Adapt — anpassa

| Del | Filer | Vad som ändras |
| --- | --- | --- |
| Hemskärmen → tröskeln | `HemPage.tsx` + CSS | Ny huvudfråga (»Vad vill du bära med dig idag?«), 4–8 breda teman i stället för ämneslista med tradition + lästid. Datum, »Fortsätt där du var«-kortet och dagens citat bort från tröskeln (se konflikter 1–3). Skalet, typografin och lugnet behålls. |
| Läsvyn → Läsrummet | `LasPage.tsx`, `LasActions.tsx` | Ny rumsstruktur enligt `reading-room.md`: stilla öppning → kärntext → paus → tanke att bära → frågor i stillhet → synlig källsummering → valfri kontext. »Läs vidare«-listan tas bort ur rummet (konflikt 4). Bokmärke/anteckningar/läsinställningar i topbaren behålls. |
| Bottennavigeringen | `NavTabs.tsx`, `RootLayout.tsx` | Från fem flikar (Hem · Utforska · Texter · Atlas · Samling) till specens rekommenderade destinationer (Läsrummet · Biblioteket · Sparat [· Inställningar]). Mekaniken (döljs i läsläge) behålls. |
| Samling → Sparat | `SamlingPage.tsx` | Behåller bokmärken + anteckningar; får grupper (Rum/Vandringar/Frågor/Källor/Anteckningar), export (Markdown/JSON — krav i `notes-and-saved.md`), och »Utseende«-sektionen flyttar till inställningar. |
| Store | `store.tsx` | Nya fält: `recentRoomIds` (rumsval), sparade vandringar/frågor/källor, `RecentItem`. Migrationsdisciplin så befintliga anteckningar/bokmärken överlever (mönstret finns redan). |
| Router | `router.tsx` | Nya rutter (rum, teman, frågor, vandringar, källsidor) läggs till parallellt; gamla rutter behålls tills omgörningen är klar (kravet att appen fungerar hela vägen). |
| Bibliotekets hem | `BibliotekPage.tsx` | Blir »Källor«-sektionen i ett nytt bibliotekshem med Frågor / Teman / Rum / Källor / Vandringar / Sparat enligt `library.md`. |

### Replace — ersätt

| Del | Filer | Ersätts med |
| --- | --- | --- |
| Innehållsmodellen | `src/content/model.ts` (`Topic` med `essay`/`context`/`related`) | Specens redaktionella modeller: `ReflectionRoom`, `Question`, `Theme`, `Path`, `Source`, `SourcePassage`, `RoomSourceRelation` (med bruksdeklaration), `EditorialRecord`, status `draft/review/published/archived` + valideringsregler (roadmap Fas 2, `room-schema.md`, `source-and-context.md`). |
| Innehållsorganisationen | `src/content/topics/*` (6 ämnen per tradition) | Rum organiserade efter fråga/tema. Texterna är bra **råmaterial** som kan omarbetas genom innehållspipelinen (`content-pipeline.md`), men strukturen (tradition → essä + kontext) ersätts. |
| Atlas-söket | `src/lib/search.ts` (substring över topics/personer/källor), `SokPage.tsx` | Genererat sökindex med gruppering per typ, frågor först, alias, synonymer, svensk normalisering (`search.md`). Bibliotekets FTS5-verssök behålls och blir en del av det samlade söket. |
| »Fortsätt där du var« på hem | `HemPage.tsx` (`LastReadCard`) | »Senast besökt« som sekundär orientering på annan plats (Sparat), per `home-and-entry.md` och `notes-and-saved.md`. |

### Remove — ta bort

| Del | Filer | Motivering |
| --- | --- | --- |
| Dagens citat | `src/content/quotes.ts`, citatfoten i `HemPage` | Dagligt innehåll på tröskeln skapar temporalitet; `home-and-entry.md` avråder uttryckligen (»Daily Content«). Citaten kan återanvändas som källpassager i rum, men funktionen »dagens citat« utgår. |
| Datumvisningen på hem | `HemPage.tsx` (`dateLabel`) | »The application always begins in the present« — datumet tillför temporalitet utan funktion; specen avråder tidsberoende budskap. |
| Utforska som primär flik | `UtforskaPage.tsx` | Traditionsfirst-bläddring som huvudnavigation strider mot `navigation.md`/`question-taxonomy.md` (»Never religions«). Funktionen absorberas av Bibliotekets sektioner (Traditioner som sekundär ingång). |
| Inaktuell skill-dokumentation | `.claude/skills/verify/SKILL.md` | Refererar borttagen Basic auth (`ATLAS_USER`/`ATLAS_PASS`, borttagen i commit `2c02a6a`) och Linux-sökvägar. Uppdateras eller skrivs om (ej appkod — kan göras när som helst). |

### Investigate — utred

| Fråga | Berör | Vad som behöver avgöras |
| --- | --- | --- |
| Innehållsformat för rum | Fas 2-beslut | Markdown + frontmatter (specens preferens), TS-moduler (nuvarande mönster, tillåtet för liten första mängd) eller SQLite. Bundeln är i dag 344 kB; växande innehåll i TS-moduler följer med i bundeln, vilket talar för Markdown/JSON per rum eller DB. Beslutet bör tas **innan** innehållsproduktionen börjar. |
| Bro atlas ↔ bibliotek | `RoomSourceRelation.passageId` | Stor möjlighet: verserna i SQLite kan bli specens `SourcePassage`-referenser, så rum pekar på exakta verser i biblioteket. README föreslår redan detta som nästa steg. Kräver design av id-form och API. |
| Atlas-kartan | `AtlasPage.tsx`, `atlasMap.ts` | Nätverkskartan matchar `question-taxonomy.md`:s långsiktiga vision (»ett landskap av idéer«) men ingår inte i första releasen. Utred som framtida biblioteksvy; bort från huvudnavigationen. |
| Tidslinjen | `TidslinjePage.tsx`, `timeline.ts` | `02-rooms-and-paths` placerar tidslinjer i Biblioteket. Behåll data, utred placering som bibliotekssektion i senare fas. |
| Personer | `PersonerPage`, `PersonPage`, `people.ts` | Specen: personer är stödposter utan egen topplevel-sektion initialt (roadmap Fas 6). Datamodellen återanvänds; sidorna flyttar in under Biblioteket senare. |
| Kuraterade källutdrag | `KallaPage.tsx`, `sources.ts` | Överlappar specens `SourcePassage`. Utred konsolidering: utdragen bör bli passager kopplade till källposter (och där möjligt till bibliotekets verser) med bruksdeklaration och upphovsrättsstatus. |
| Maskinöversättningar vs. publiceringspolicy | `server/ingest/translate.ts`, verkens `translated`-flagga | `source-and-context.md`: maskinöversättning får inte publiceras utan mänsklig granskning. Biblioteket markerar i dag »översatt« ärligt — bra. Men **rum** som citerar Ollama-översatta passager behöver en granskningsrutin innan publicering. |
| Ingest-datakvalitet | t.ex. Dhammapada 1:17 | Råa `<j>`-markörer från SuttaCentral-källan syns i löptexten (verifierat i körning). Normaliseringen behöver en städpass; inventera fler artefakter. |
| Desktopupplevelsen | `.shell` (430 px fast) | `06-design-principles`: desktop ska kännas som ett stort skrivbord, inte en centrerad mobil. Acceptabelt nu; utred i Fas 11/13. |
| Offline för rum | PWA-konfig | Atlasinnehåll i JS-bundeln är offline av sig självt. Väljs Markdown/JSON/DB för rum behövs precache-strategi så temaval kan öppna cachade rum offline (Fas 13, `room-selection.md` offline-krav). |
| Testramverk och lint | Fas 1 | Vitest är naturligt för Vite; ESLint (flat config) + jsx-a11y skulle komplettera fallow. Avgör om fallow behålls parallellt (rekommenderas — de överlappar inte). |
| Gamla länkar | `/amne/`, `/las/`, `/kalla/` | Bokmärkta URL:er och PWA-klienter med gammal cache: ska gamla rutter redirecta till nya motsvarigheter eller tas bort? Avgör vid utfasningen. |

---

## Konflikter med specifikationerna

Numrerade, med belägg. Inget av detta är kritik av den byggda appen — den byggdes mot en annan
målbild (»utforska fritt«) än den specarna nu definierar (»stanna hos en tanke«).

1. **Hemskärmens fråga och ingångar.** Nuvarande: »Vad vill du utforska i dag?« följt av sex
   ämnen märkta med tradition och lästid (`HemPage.tsx`). Spec: »Vad vill du bära med dig idag?«
   med 4–8 breda mänskliga teman (Lugn, Mening, Mod …); traditionsetiketter hör inte hemma som
   primära val (`home-and-entry.md`, Theme Labels).
2. **»Fortsätt där du var« på tröskeln.** `LastReadCard` visas framträdande på hem (verifierat i
   körning). Spec: återvändande användare ska inte mötas av aktivitet; senast öppnat får finnas som
   sekundär orientering på annan plats (`home-and-entry.md`, Returning Users).
3. **Temporalitet på hem.** Datumrubrik + dagens citat (`dateLabel`, `quoteOfTheDay`). Spec avråder
   tidsberoende innehåll och dagligt innehåll på tröskeln (`home-and-entry.md`, Time of Day / Daily
   Content).
4. **Rekommendationer i läsvyn.** `LasPage` avslutar med »Läs vidare« (tre relaterade ämnen).
   Spec: Läsrummet får inte innehålla relaterade rum eller rekommendationer; rummet ska kännas
   komplett (`reading-room.md`, One Room at a Time). Inline-länkar i löptexten är däremot förenliga
   med visionens »dörrar« (`02-rooms-and-paths`) — det är slutlistan som är konflikten.
5. **Navigationen är innehållstyps-/traditionsorienterad.** Utforska (per tradition), Personer,
   Atlas som topplevel. Spec: navigation följer frågor — aldrig författare, böcker eller religioner
   som primär struktur (`navigation.md`, `question-taxonomy.md`).
6. **Innehållsmodellen saknar specens kärnbegrepp.** `Topic` har varken fråga, tema, status,
   `thoughtToCarry`, reflektionsfrågor eller källrelationer med bruksdeklaration
   (`content/model.ts` vs. `room-schema.md`, roadmap Fas 2).
7. **Ingen redaktionell statusworkflow eller validering.** Allt innehåll är implicit publicerat;
   inget draft/review/published, ingen valideringskommando som stoppar ogiltigt innehåll
   (`content-pipeline.md`, roadmap Fas 2).
8. **Källredovisningen är oformaliserad.** Atlasens essäer länkar till källor men deklarerar inte
   citat/parafras/bearbetning; `KallaPage` visar »Fri översättning« utan upphovsrättsstatus,
   osäkerhetsmarkering eller bruksdeklaration (`source-and-context.md`, Publication Gate).
9. **Sök uppfyller inte specen.** Två separata sök (atlas-substring + vers-FTS), ingen gruppering
   per typ, inga alias/synonymer, ingen svensk normalisering i atlasdelen, frågor kan inte rankas
   först eftersom frågor inte finns som entitet (`search.md`).
10. **Rumsval finns inte.** Ingen motsvarighet till tema → ett publicerat rum med redaktionell
    default och upprepningsundvikande (`room-selection.md`) — helt ny funktion.
11. **Vandringar finns inte.** Ingen path-modell eller sidor (`paths.md`) — helt ny funktion.
12. **Export saknas.** Anteckningar och sparat kan inte exporteras (`notes-and-saved.md`, Export;
    även `09-technical-philosophy`: »Innehållet får aldrig låsas«).
13. **Tester och lint saknas.** Inga tester, ingen testrunner, ingen ESLint (Fas 1-krav;
    `room-selection.md` kräver deterministiska tester).

**Icke-konflikter värda att nämna** (ofta lätta att tro är problem, men de är förenliga):
lästid i förhandsvisningar är tillåten (`library.md` Room previews); anteckningsarket är redan
stängt som standard med autospar; bokmärken är tysta utan räknare; FTS-söket är verktygsaktigt
och ändligt; ingen engagemangsoptimering förekommer någonstans i kodbasen.

---

## Återanvändbara delar — de starkaste tillgångarna

1. **Biblioteket är specens »Källor« i förskott.** Backend + läsare för hela källtexter med
   licens-/översättningsmetadata, FTS5-sök och offline. `RoomSourceRelation.passageId` kan peka
   rakt in i versdatabasen — då blir varje rum spårbart till exakt vers, vilket är kärnan i
   `source-and-context.md`.
2. **Kvalitetskulturen.** 100 % type-coverage, funktionsgränser, dödkodskontroll, CI med
   fixture-ingest. Fas 1 handlar mest om att lägga till test + lint, inte att sanera.
3. **Designsystemet bär redan visionen.** Folianten-tokens, mörkt läge, läsinställningar,
   reduced-motion, inga emojis. »Visuell tystnad« är till stor del implementerad.
4. **Lagringsmönstret.** User state separerad från innehåll, defaults-merge, validering av sparade
   värden — direkt utbyggbart för `recentRoomIds`, sparade vandringar och export.
5. **Skal- och komponentbiblioteket.** TopBar/BottomSheet/NotesSheet/RowLink räcker långt för
   Läsrummets och Bibliotekets nya vyer utan nya beroenden.
6. **Zod finns redan som beroende** (används i `server/ingest/bible/fixture.ts`) — naturligt val
   för Fas 2-valideringen utan att utöka beroendeträdet.

---

## Risker

1. **Innehållet är den kritiska vägen.** 18–30 granskade rum × obligatorisk pipeline
   (fråga → research → källor → utkast → tre granskningar → publicering) är veckor av redaktionellt
   arbete. Kod utan innehåll ger tomma teman. *Motmedel:* börja innehållsarbetet parallellt med
   Fas 2–3; låt »Milestone 1: The Chair« bevisa ett enda komplett rum tidigt.
2. **Dubbel arkitektur under övergången.** Gamla och nya rutter/modeller lever parallellt; kravet
   är att appen fungerar och kan deployas hela tiden. Roadmapens varning (»No feature
   implementation depends on temporary duplicate architecture«) kräver en tydlig utfasningsplan
   och att `main` hålls releasebar medan `remake` byggs om. *Motmedel:* additiva PR:ar, gamla
   rutter orörda tills de nya är kompletta, utfasning som egen, sista fas.
3. **Innehållsformatbeslutet låser produktionen.** Väljs fel format (t.ex. TS-moduler för 30 rum)
   blir migreringen dyr och bundeln växer. *Motmedel:* avgör formatet i Fas 2 innan mer än ett
   exempelrum skrivs.
4. **Maskinöversättningar i rum.** Ollama-översatta passager får inte publiceras i rum utan
   mänsklig granskning (`source-and-context.md`). *Motmedel:* granskningssteget i
   `verify-sources.md` + bruksdeklaration per passage; bibliotekets »översatt«-flagga följer med
   in i källmetadatan.
5. **localStorage-migrering.** Nya state-fält och nya innehålls-id:n får inte tappa användarens
   befintliga anteckningar/bokmärken. *Motmedel:* mönstret i `initialState()` (defaults-merge)
   + explicit migrationssteg när nycklar byter form.
6. **PWA-cache vid strukturbyte.** Klienter med gammal precache/gamla bokmärkta URL:er möter nya
   rutter. *Motmedel:* `autoUpdate` finns redan; behåll eller redirecta gamla rutter under en
   övergångsperiod (se Investigate: Gamla länkar).
7. **Specomfånget frestar till storbygge.** Tretton specar på en gång inbjuder till att bygga
   allt parallellt. *Motmedel:* roadmapens fasordning och »smallest safe change« — en fas i taget,
   granskning emellan.

---

## Rekommenderad första implementationsuppgift

**Fas 1, steg 1: inför testrunner och lint.**

Konkret: lägg till Vitest (naturligt i Vite-miljön) med ett första test på befintlig ren logik
(t.ex. `chapterKey`/`initialState`-validering i `store.tsx` eller `toFtsQuery` i
`server/library/search.ts`), och ESLint (flat config + `jsx-a11y`) vid sidan av fallow; koppla in
båda i `npm run check` och CI.

Motivering: det är roadmapens Fas 1-krav, det ändrar inget beteende i appen (uppfyller kravet att
nuvarande app fortsätter fungera), och varje senare fas — rumsval, innehållsvalidering, sök —
förutsätter deterministiska tester. Direkt därefter: **Fas 2, »Create the validated
reflection-room schema«** med zod, plus ett (1) exempelrum som lastas från redaktionellt innehåll —
roadmapens första »good task example« och grunden för Milestone 1: The Chair.

---

## Fas 0-verifiering (roadmapens kriterier)

- [x] Den nuvarande applikationsstrukturen är dokumenterad (detta dokument).
- [x] Befintliga återanvändbara komponenter är identifierade (Keep/Adapt-tabellerna).
- [x] Motstridiga funktioner är listade (Konflikter 1–13).
- [x] Inga större arkitekturbeslut vilar på overifierade antaganden — bygge, kontroller, ingest
      och körning i webbläsare är verifierade ovan. Kvarstående overifierat: fullständig
      tillgänglighetsgranskning (Fas 11), beteende på riktig mobil enhet, samt getbible-ingest
      mot nätverk (endast fixture kördes lokalt; getbible körs i produktion enligt README).

---

## Granskade filer

**Dokument:** samtliga i `docs/vision/` (00–10), `docs/specs/` (13 st inkl. roadmap),
`docs/checklists/` (4 st), `README.md`.

**Frontend:** `index.html`, `vite.config.ts`, `src/main.tsx`, `src/app/*` (router, RootLayout),
`src/components/*` (samtliga 12), `src/content/*` (model, topics/6 st + index, people, sources,
quotes, timeline, traditions, atlasMap), `src/lib/*` (api, offline, search, shell, storage, store,
theme, useAsync, useDebounced), `src/pages/*` (samtliga 13) och `src/pages/library/*` (samtliga 9),
`src/styles/global.css`.

**Backend:** `server/index.ts`, `server/auth.ts`, `server/config.ts`, `server/api/*`,
`server/db/*`, `server/library/*` (repository, search, store), `server/ingest/**` (modell, run,
translate, lib, samtliga adaptrar), `scripts/ingest.ts`.

**Konfiguration/drift:** `package.json`, `package-lock.json` (skummad), `tsconfig*.json`,
`.fallowrc.json`, `drizzle.config.ts`, `Dockerfile`, `.dockerignore`, `.env.example`,
`.gitignore`, `.github/workflows/ci.yml` + `deploy.yml`, `.claude/launch.json`,
`.claude/skills/verify/SKILL.md`.
