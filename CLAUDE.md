# Visdomsatlasen — arbetsminne

En svenskspråkig, mobil-först reflektionsapp (React + TypeScript). Omgörningen byggs
fas för fas enligt `docs/specs/implementation-roadmap.md`; visionen ligger i
`docs/vision/`, specarna i `docs/specs/`, checklistorna i `docs/checklists/`.

## Kommandon

- `npm ci` först i en ny miljö.
- **Grinden:** `npm run check` — typer (tsc), ESLint, Vitest, innehållsvalidering
  (`check:content`), type-coverage 100 % (app + server), fallow (komplexitet +
  dead-code). CI kör samma. Ska vara grön per commit.
  - Kör inte `npm run check | tail` utan `set -o pipefail` — pipen maskerar felkoden.
- **Kör appen:** `npm run dev` (Vite 5173, proxar `/api` → 8080) +
  `npx tsx server/index.ts` (API 8080). API:t är öppet — ingen inloggning.
- **E2E:** verify-skillen. Playwright med `executablePath: '/opt/pw-browsers/chromium'`,
  viewport 430×900. `npm i playwright-core` i scratchpad.

## Arkitektur

- **Router:** kod-först i `src/app/router.tsx` (TanStack Router). Sidor i `src/pages/`
  (redaktionella bibliotekssidor i `src/pages/bibliotek/`, verkläsaren i
  `src/pages/library/`). Navlöst styrs av `NAVLESS_PREFIXES` i `RootLayout.tsx`.
- **Nav:** `src/components/NavTabs.tsx` — fyra flikar (Läsrummet · Biblioteket ·
  Sparat · Inställningar). Aktiv flik = mörkare text + `aria-current="page"`.
- **Store:** `src/lib/store.tsx` (React Context, localStorage-nyckel `visdomsatlasen`,
  fältvalidering vid inläsning). Fält: dark/font/textStep/bg, bookmarks,
  chapterBookmarks, notes, sparadeRum, lastRead, senastLastaRum.
- **CSS:** globala klasser `screenTab`/`screenSub`/`screenReader`, `kicker`,
  `sectionKicker`, `dots`; per-sida CSS-moduler. Inga emojis, någonsin.
- **Bibliotekets datalager:** `src/lib/innehall.ts` (laddar rum/teman/frågor/kallor/
  traditioner/vandringar via `import.meta.glob`), `src/lib/bibliotek.ts` (urvalslogik —
  bara publicerat visas), `src/lib/rumsval.ts` (deterministiskt rumsval). Verkläsaren =
  Hono + SQLite (`server/`), klient i `src/lib/api.ts`.
- **Vandringar (Fas 7):** läsrummet får vandringskontext via sökparametern
  `?vandring=<slug>` på `/rum/$slug` (utan den läses rummet fristående, utan
  vandrings-UI). Senast öppnade rum per vandring minns i store (`vandringsplatser`) —
  bara orientering, aldrig förlopp.

## Redaktionell innehållspipeline

Markdown + frontmatter under `src/content/<typ>/`, zod-scheman i
`src/content/redaktion/schema.ts`, korsvalidering i `validera.ts` (körs av
`check:content`). Regler: **publicerat får aldrig länka opublicerat**; publicerade
rum kräver primär källa + lästid ≤ 10 min. **AI publicerar aldrig ensamt** — Claude
förgranskar mot `docs/checklists/`, redaktören (ägaren) läser och beslutar;
publicering = ägarens merge/granskning, dokumenteras i rummets `redaktion.noteringar`.

## Gren- och deployflöde

Utveckla på featuregren → **utkast-PR**. Deploy till Hetzner (Tailscale-only)
triggas när ändringen når `main` (merge-commit, **inte squash**) — ägarens beslut.
Direktpush till `main` nekas.
Obs (2026-07-13): den tidigare `remake`-mellangrenen promoverades till `main` (#24)
och **raderades** — `main` bär nu allt `remake` hade. Feature-PR:er baseras därför
på `main` tills en ny mellangren ev. återskapas. Starta om grenen från `origin/main`
för uppföljningsarbete.

### Testaråtkomst (testarläget)

För att släppa in inbjudna testare utan att öppna appen för alla exponeras servern
publikt via **Tailscale Funnel** och göms bakom en **delad kod**. Spärren bor i Hono
(`server/gate.ts`, hjälpare i `server/auth.ts`) och aktiveras bara när `ACCESS_CODE`
är satt — utan koden är appen öppen inom tailnet som förr (bakåtkompatibelt). Rätt kod
sätter en HttpOnly-cookie (härledd token, aldrig plaintext); Secure-flaggan sätts bara
när anropet kom över HTTPS (via `X-Forwarded-Proto` eller URL:en), så inloggning funkar
även mot direkt tailnet-IP över http. `POST /api/ingest` går förbi spärren (bara POST —
eget INGEST_TOKEN-skydd i routern). Kod-sidan är emojifri och `noindex`. Manuellt engångssteg på VPS:en: lägg `ACCESS_CODE=<lång slumpad kod>` i
`/opt/visdomsatlasen/.env`, starta om containern, kör `tailscale funnel --bg 3001`,
dela `*.ts.net`-URL:en + koden. "Stäng av alla" = byt koden och starta om (gamla
cookies dör). **Väg till publikt** (byggs inte nu): ta bort `ACCESS_CODE` (noll kod)
→ ersätt Funnel med egen domän + Caddy (auto-TLS) → ta bort `robots.txt`/`noindex` →
städa bort spärr-koden.

## Status (uppdatera per fas)

Fas 0–6 klara och i produktion (`main`); nav-nedtoningen (#20) och Sparat-fixen (#23)
i produktion via promoveringen till `main` (#24). Fas 6 = Biblioteket (landning med
Frågor/Teman/Rum/Källor/Traditioner/Sparat, fråge-/tema-/käll-sidor, verkläsaren
flyttad till `/bibliotek/verk/…`, ny Inställningar-sida).

**Fas 7 — Vandringar (`docs/specs/paths.md`) klar, mergad till `main` (#26).** Laddning
(`allaVandringar`/`hittaVandringViaSlug`), urval (`bibliotek.ts`: `bibliotekVandringar`,
`rumForVandring` = redaktionell ordning, `vandringLastid`, `traditionerForVandring`),
översiktssida (`VandringPage`), routen `/bibliotek/vandring/$slug`, To-målet `vandring`,
landningssektion (döljs tills publicerat) och läsrummets vandringsfot (»Fortsätt
vandringen«/»Stanna här«, sökparametern `?vandring`, avslutande reflektion på sista
rummet) + `vandringsplatser` i store. Valideringen kräver att en publicerad vandring
bara länkar publicerade rum **och** publicerad central fråga. Innehållet (`Vägen mot
lugn` + tre nya rum ur Enchiridion, avsnitt 5/8/43) är **publicerat** — godkänt av
redaktören Jonas Olson 2026-07-13 efter läsning av alla fyra texterna; vandringen och
dess tre rum publicerade tillsammans.

**Fas 8 — Källor och kontext (`docs/specs/source-and-context.md`) klar, mergad till
`main` (#28).** Källpassager, skärpt publiceringsgrind (publicerad källa måste
deklarera `upphov` och `datering`, källpassagers status valideras), källkontext i
läsrummet och på källsidor. Efter #28 mergades #25 (Alan Watts-research): rapporten
`docs/research/alan-watts.md`, källposter för hela verkläsarens bestånd samt sex
traditionsposter, plus roadmapens Fas 12-insteg »Modern Interpreters: Alan Watts«.

**Fas 9 — Sparat och anteckningar (`docs/specs/notes-and-saved.md`) klar, mergad till
`main` (#33).** Låter användaren bevara platser och tankar utan produktivitetspress:
spara/ta bort vandringar (`sparadeVandringar`), omgjord Sparat-yta (`SamlingPage` +
`SparatDelar.tsx`: grupper, preview-kort, spec-enliga tomlägen, »Senast besökt«),
anteckningar med ursprungskoppling (`personligt.ts`: `Anteckning`/`SparadPost`,
ersätter `notes` — tyst förlustfri migrering vid inläsning), autospar-status och
radering i `NotesSheet`, samt export/import och förutsägbar rensning (`dataflytt.ts`,
»Dina data« i Inställningar). Personlig data är privat — påverkar aldrig rumsvalet,
publik sök, AI eller analytics. `chapterKey`/`ChapterBookmark` bor nu i `personligt.ts`.

**Fas 10 — Sök i Biblioteket (`docs/specs/search.md`) klar, mergad till `main` (#38).**
Konventionellt genererat publikt sökindex över publicerat redaktionellt innehåll
(frågor/teman/rum/vandringar/källor m. passager/traditioner) — ingen AI, ingen
popularitetssignal. Kärnan i rena, testade lib-moduler: `soknormalisering.ts` (svensk
diakritvikning, stopord, konservativ stam + stavfelstolerans), `sokindex.ts` (`byggSokindex`/
`sokindexet` byggt enbart via `bibliotek.ts`-urvalen — utkast läcker aldrig; `SOKTYPER`),
`soklogik.ts` (`sokIBiblioteket`/`synligaTraffar`, vägd rankning där frågor/teman slår
författare, dubbelriktade synonymer, exporterad `RUBRIK`), `sokanteckningar.ts` (privat
anteckningssök på helt egen väg — aldrig i publikt index eller URL). Route `/bibliotek/sok`
med URL-buret sökstate (`SökParametrar`), söksida `SokBibliotekPage`/`SokDelar.tsx` (grupperade
ändliga resultat, »Visa fler«, hopfällda typfilter, gruppen »Ur källtexterna« = verkläsarens
FTS, sökingång på landningssidan). Legacy `/sok` + `/bibliotek-sok` orörda.

**Fas 11 — Tillgänglighet och läskvalitet (roadmapens »Accessibility and Reading
Quality«) klar.** Tvärgående remediering: BottomSheet är nu en riktig modal
(fokusfälla/Escape/fokusåterlämning via `useDialogTangentbord`, aria-modal, egen
portal till `.shell`, bakgrunden inertas via `useInertBakgrund` — StrictMode-säkert);
skip-link (»Hoppa till innehåll«); per-sida-dokumenttitlar (`useSidtitel`, bibliotekets
undersidor via `Sidhuvud`); sektionsrubriker på aktiva sidor är h2; träffytor ≥44px
(navflikar bär höjden själva, små kontroller får osynlig utökad träffyta via
pseudoelement, delad global `.hitArea` via composes); all dämpad text bytte `--soft` →
`--soft-strong` (AA 4.5:1 i ljust läge; `--soft` kvar bara på dekorativa `.dots` och
ikonknappar som klarar 3:1);
NotesSheet har kopplad sr-only-etikett och autofokuserar inte längre (globala
no-autofocus-undantaget borta; sökskärmarna har riktade undantag); aktiv navflik
markeras även med font-weight 600 (pricken från #20 återinförs inte); all font-size
i rem med `html { font-size: 100% }` (text-only-zoom funkar; --rs-stegen i rem;
layoutmått förblir px); TopBar är `<header>`. Testgrinden har jsdom +
@testing-library/react — komponent-/hook-tester väljer jsdom per fil med
`// @vitest-environment jsdom` (default node kvar, server/** kräver det).
E2E-verifierat: tangentbordsflöden, fälla/inert/återlämning, 200 % zoom utan
horisontell scroll (430/834/1280), role=status vid sökuppdatering, reduced motion.

**Fas 12 — Innehållsförberedelse (`docs/specs/implementation-roadmap.md`, »Content
Preparation«) klar.** Appen fylld med material enligt fasens kriterier (roadmapen
bockad): sex publicerade teman med minst tre rum vardera (Lugn 10, Människan 3,
Mening 3, Mod 4, Sanning 4, Lidande 5), 22 frågor (minst två per tema), 28 rum, fyra
vandringar (Vägen mot lugn, Tillgänglig buddhism, Att stå i det ovissa, Det som går
förlorat) och 30 verifierade källpassager ur 15 källor — inga platshållare. Byggt i
batcher, var och en granskad rum för rum av redaktören i chatt innan publicering
(#43 Mod, #45 Sanning, #46 Lidande, #47 Människan/Mening, #42 buildout-rum +
teaser-städning + vandringen Tillgänglig buddhism, #49 två vandringar). Två
tidigare parallella innehållsspår (#42 och Fas 12-batcherna) konsoliderades till
ett sekventiellt flöde och #42 ombaserades in. Rummen bygger på fria primärkällor
(strategi D); de uppskjutna Watts-rummen (Tolken i väst, Molnet av icke-vetande,
Avskildheten) spåras i issue #44 och ligger utanför fasen. Ny maskinell språkgrind:
`src/content/redaktion/oppningsvakt.ts` (`ärTeaseröppning`) körs i `check:content`
och fäller bygget om ett rums öppning teasar/introducerar källan i stället för att
landa i vardagen — även för utkast. Öppningsreglerna står i
`docs/checklists/review-language.md` §4b (ingen teaser) och §4c (öppningen bygger en
egen båge och landar i en slutkläm; Kärnan låter källan bekräfta i stället för att
introducera).

**Fas 13 — Prestanda och offline (`docs/specs/implementation-roadmap.md`, »Performance
and Offline Behaviour«) klar.** Appen kod-delas (React.lazy + Suspense med stilla
väntetillstånd, `Sidladdning`): bara tröskeln, skalet och NotFoundNote i startbunten,
övriga sidor egna chunkar som precachas och förladdas vid intention (`defaultPreload:
'intent'`). Hemskärmen laddar bara temana (`troskeldata.ts` — egen teman-glob, inga
rumsberoenden); rummen hämtas via dynamisk import först vid temaval (delar chunk med
läsrummet). Storen och routern tappade sina innehållsberoenden (notismigrering på
id-prefixet `rum-`; söktyperna i `soktyper.ts` så routern slipper bygga sökindexet vid
start). Bara EB Garamond i startbunten; valbara typsnitt registreras vid val (`fonter.ts`).
Lugna svenska offline-fel i `api.ts` (verkläsarens texter; det bundlade innehållet berörs
aldrig). PWA-ikoner (192/512/maskable ur `icon.svg`). localStorage-gränser täckta av
`storage.test.ts`. Resultat: startbunt 147 kB gzip (från 242), start-CSS 17 kB (från 93).

**Fas 14 — Analys och felrapportering (`docs/specs/analytics.md`) klar.** Appen samlar
bara tekniskt minimum, aldrig engagemang. Sänkan är medvetet enkel (ägarens beslut):
klientens tekniska fel loggas till webbläsarens konsol (`telemetri.ts` — `rapportera`,
`installeraGlobalaFelfangare`), serverns till serverloggen (Hono `onError`). Ingen
tredjepart, ingen endpoint, ingen DSN. Händelser: sidladdningsfel (felgräns `Felgrans`
kring de kod-delade sidorna, innehålls-import i tröskeln, ej-ok API-svar),
offline-laddningsfel, brutna källänkar/ogiltiga innehållsrelationer (`RumPage`), sökfel
och anonymiserade nollträffar (`SokBibliotekPage`), okaught-fel (globala fångare). Privata
anteckningar rörs aldrig; nollträffar loggas bara som längd/ordantal (aldrig texten,
`anonymiseraFraga`) och frågesträngen strippas ur resurs-URL:er (`utanFraga`); okaught-fel
loggar bara meddelande + kodplats. Rumsvalet förblir deterministiskt och läser aldrig
någon telemetri — ingen engagemang-dashboard styr rumsval. Ingen instrumentering finns för
de förbjudna storheterna (session, återkomst, streaks, sparande, notiser, vandringsavslut).

**Watts-rummen (issue #44, PR #52):** Molnet av icke-vetande och Avskildheten
publicerade (godkända av redaktören 2026-07-18); tema Jesus (tröskelordning 7)
och traditionen kristen mystik nya. Temat döptes 2026-07-19 om till **Tro**
(`tema-tro`, slug `tro`) — tröskelns teman ska vara allmänmänskliga, inte
bundna till en särskild religion; »jesus« ligger kvar som sök-nyckelord. Tolken i väst blev **inte** ett rum
(redaktörens beslut) utan bibliotekets första **personsida**:
`src/content/personer/`, route `/bibliotek/person/$slug`, sektionen Personer
sist på landningen (dold tills publicerat). Personsidorna är ett provisorium —
kandidater och uppstyrning i roadmapens »Person Pages (to do)«. Eckhart-rummets
källpassage återstår (Fields fulltext onåbar i byggmiljön). Tröskelns
temafilter skärpt till bara publicerade (i `troskeldata.ts` efter Fas 13).
Personer är sökbara (granskningsfynd i PR #52): `Soktyp` »person« rankas
sist, målet `personpost` i To/ToLink, `kortbeskrivning` bär sökunderraden.

## Kända skulder

- Sandlådefällor: `getbible.net` ger 403 vid ingest (ofarligt, bara Bibeln);
  bakgrunds-Vite/API dör mellan skalkommandon — starta om vid ECONNREFUSED.
