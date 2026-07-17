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
sätter en HttpOnly-cookie (härledd token, aldrig plaintext); kod-sidan är emojifri och
`noindex`. Manuellt engångssteg på VPS:en: lägg `ACCESS_CODE=<lång slumpad kod>` i
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

## Kända skulder

- PWA saknar PNG/maskable-ikoner (Fas 13).
- Sandlådefällor: `getbible.net` ger 403 vid ingest (ofarligt, bara Bibeln);
  bakgrunds-Vite/API dör mellan skalkommandon — starta om vid ECONNREFUSED.
