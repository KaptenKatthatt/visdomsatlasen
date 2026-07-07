---
name: verify
description: Bygg, starta och driv Visdomsatlasen för att verifiera ändringar end-to-end i riktig webbläsare.
---

# Verifiera Visdomsatlasen

## Starta

```bash
npm run dev                                   # Vite på :5173, proxar /api → :8080
ATLAS_USER=test ATLAS_PASS=test npx tsx server/index.ts   # API på :8080 (utan ATLAS_* nekas allt)
```

API:t auto-ingestar fixturer/bundlade texter vid start (bibel-ingest mot getbible.net kan ge 403 i sandlåda — ofarligt). Basic auth funkar direkt: `curl -u test:test localhost:8080/api/library/works`.

## Driv med Playwright

`npm i playwright-core` i scratchpad; starta med `executablePath: '/opt/pw-browsers/chromium'`, viewport 430×900 (appens skal är 430px), `httpCredentials: { username: 'test', password: 'test' }` för `/kapitel`-sidor.

Bra rutter: `/las/stoicism/essa` (essä), `/kalla/markus` (källtext), `/kapitel/dhammapada/dhammapada/1` (bibliotek, kräver API).

## Fallgropar

- Tema/läsinställningar läses från localStorage-nyckeln `visdomsatlasen`; data-attribut (`data-dark`, `data-bg`, `data-font`, `data-size`) sätts på `.desk` och `<html>`.
- `.desk`/`html` har `transition: background-color 0.5s` — vänta ~700 ms innan färgmätning.
- Selektorn `[class*="verse"]` träffar containern `.verses` — använd `p[class*="verse"]`.
- Playwright `:has-text("Vit")` matchar även "Krämvit" — använd `:text-is(...)`.
- `.topbar` har `backdrop-filter`, vilket gör den till containing block för `position: fixed`-barn — overlays som renderas därifrån måste portalas till skalelementet via `useShell()` i `src/lib/shell.ts` (se ReadingSettingsButton).
