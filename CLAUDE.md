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
  traditioner via `import.meta.glob`), `src/lib/bibliotek.ts` (urvalslogik — bara
  publicerat visas), `src/lib/rumsval.ts` (deterministiskt rumsval). Verkläsaren =
  Hono + SQLite (`server/`), klient i `src/lib/api.ts`.

## Redaktionell innehållspipeline

Markdown + frontmatter under `src/content/<typ>/`, zod-scheman i
`src/content/redaktion/schema.ts`, korsvalidering i `validera.ts` (körs av
`check:content`). Regler: **publicerat får aldrig länka opublicerat**; publicerade
rum kräver primär källa + lästid ≤ 10 min. **AI publicerar aldrig ensamt** — Claude
förgranskar mot `docs/checklists/`, redaktören (ägaren) läser och beslutar;
publicering = ägarens merge/granskning, dokumenteras i rummets `redaktion.noteringar`.

## Gren- och deployflöde

Utveckla på featuregren → **utkast-PR mot `remake`**. Deploy till Hetzner
(Tailscale-only) triggas när `remake` promoveras till `main` via en egen PR
(merge-commit, **inte squash**) — ägarens beslut. Direktpush till `main` nekas.
Obs: PR till remake kan squash-mergas och grenen raderas; starta då om grenen
från `origin/remake` för uppföljningsarbete.

## Status (uppdatera per fas)

Fas 0–6 klara och i produktion (`main`). Fas 6 = Biblioteket (landning med Frågor/
Teman/Rum/Källor/Traditioner/Sparat, fråge-/tema-/käll-sidor, verkläsaren flyttad
till `/bibliotek/verk/…`, ny Inställningar-sida). Nav-nedtoning (ingen prick,
tröskeln utan bibliotekslänk, aria-current) i PR #20.

**Nästa: Fas 7 — Vandringar (`docs/specs/paths.md`).** `vandringSchema` +
valideringen finns redan (`schema.ts`, `validera.ts`: publicerad vandring får inte
innehålla opublicerat rum). Saknas: laddning i `innehall.ts`, sidor, `src/content/
vandringar/`-innehåll, koppling i biblioteket. Följ mönstret från Fas 6.

## Kända skulder

- Källpost saknar `edition`/`source location` (fält hör till Fas 8, källpassager).
- Sparat-ytan görs om i Fas 9 (grupper, export, spec-enliga tomlägen).
- BottomSheet saknar fokusfälla/Escape (Fas 11); PWA saknar PNG/maskable-ikoner
  (Fas 13); README beskriver delvis gamla appen; `drizzle.config.ts` vestigial.
- Sandlådefällor: `getbible.net` ger 403 vid ingest (ofarligt, bara Bibeln);
  bakgrunds-Vite/API dör mellan skalkommandon — starta om vid ECONNREFUSED.
