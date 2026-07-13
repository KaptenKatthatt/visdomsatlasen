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
  `npx tsx server/index.ts` (API 8080). API:t är öppet — ingen inloggning
  (verify-skillens doc nämner `ATLAS_USER`/`ATLAS_PASS`; det är inaktuellt).
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

## Status (uppdatera per fas)

Fas 0–6 klara och i produktion (`main`); nav-nedtoningen (#20) och Sparat-fixen (#23)
i produktion via promoveringen till `main` (#24). Fas 6 = Biblioteket (landning med
Frågor/Teman/Rum/Källor/Traditioner/Sparat, fråge-/tema-/käll-sidor, verkläsaren
flyttad till `/bibliotek/verk/…`, ny Inställningar-sida).

**Fas 7 — Vandringar (`docs/specs/paths.md`) i PR (mot `main`).** Laddning
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

**Nästa: Fas 8 — Källor och kontext (`docs/specs/source-and-context.md`).**

## Kända skulder

- Källpost saknar `edition`/`source location` (fält hör till Fas 8, källpassager).
- Sparat-ytan görs om i Fas 9 (grupper, export, spec-enliga tomlägen).
- BottomSheet saknar fokusfälla/Escape (Fas 11); PWA saknar PNG/maskable-ikoner
  (Fas 13); README beskriver delvis gamla appen; `drizzle.config.ts` vestigial.
- Sandlådefällor: `getbible.net` ger 403 vid ingest (ofarligt, bara Bibeln);
  bakgrunds-Vite/API dör mellan skalkommandon — starta om vid ECONNREFUSED.
