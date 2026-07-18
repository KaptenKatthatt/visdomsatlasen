# Analys och felrapportering (Fas 14)

## Syfte

Visdomsatlasen samlar **bara det tekniska minimum som krävs för att hålla
kvaliteten uppe** — aldrig engagemang. Målet är att en trasig sida, en bruten
källänka eller ett återkommande sökfel ska gå att upptäcka och åtgärda, utan att
appen någonsin mäter hur mycket eller hur ofta någon läser. Detta linjerar med
`docs/vision/08-things-we-will-never-do.md`: vi optimerar aldrig för skärmtid,
skapar aldrig beroende och mäter aldrig framgång i minuter.

## Sänka

Sänkan är medvetet enkel (ägarens beslut 2026-07-18): **ingen tredjepart, ingen
telemetri-endpoint, ingen DSN.**

- **Klienten:** tekniska fel loggas lugnt till webbläsarens konsol via
  `src/lib/telemetri.ts` (`rapportera`, `console.warn` med prefixet
  `[telemetri]`). Loggen fäller aldrig appen.
- **Servern:** oväntade fel loggas till serverloggen via Hono `onError` i
  `server/index.ts` (metod, sökväg och felmeddelande — aldrig personlig text).

Vägen till en riktig hopsamling (egen Hono-endpoint eller tredjepart) är medvetet
inte byggd; skulle den byggas senare får den bara bära exakt de händelser som
listas nedan.

## Tillåtna mätningar

De enda händelser appen får rapportera (`TekniskHandelse` i `telemetri.ts`):

| Händelse | Var den fångas | Fält (minimerade) |
| --- | --- | --- |
| `sidladdningsfel` | Felgräns kring kod-delade sidor (`Felgrans`), misslyckad innehålls-import i tröskeln (`HemPage`), API-svar som inte är ok (`api.ts`) | `resurs`, valfri `detalj` (utan frågesträng) |
| `offline-laddningsfel` | Verkläsarens API-anrop när enheten är offline (`api.ts`) | `resurs` (utan frågesträng) |
| `bruten-kallalank` | Läsrummet: ett rum pekar på en källa som inte kan slås upp (`RumPage`) | `från` (rum-id), `till` (käll-id) |
| `ogiltig-innehallsrelation` | Läsrummet: ett rum pekar på en passage som inte kan slås upp (`RumPage`) | `slag`, `från`, `referens` (id:n) |
| `sokfel` | Bibliotekssöket när indexsökningen kastar (`SokBibliotekPage`) | `detalj` |
| `sok-nolltraff` | Bibliotekssöket när en fråga (≥ 2 tecken) ger noll träffar överallt | `langd`, `ord` — **aldrig frågans text** |
| `okaught-fel` | Globala `error`/`unhandledrejection` (`installeraGlobalaFelfangare`) | `meddelande`, valfri `källa` (fil:rad) |

Build-grinden (`check:content`) fångar redan brutna länkar och ogiltiga
relationer för publicerat innehåll; runtime-händelserna ovan är ett skyddsnät mot
drift och regressions, inte den primära kontrollen.

## Förbjuden optimering

Appen mäter **aldrig** och har ingen instrumentering för:

session­längd · rum per session · daglig återkomst · streaks · antal fortsatta
läsningar · sparkonvertering · skapande av anteckningar · vandringsavslut ·
emotionellt engagemang.

Ingen av dessa storheter beräknas, loggas eller lagras någonstans.

## Integritet

- **Privata anteckningar utesluts alltid.** Telemetrin rör aldrig
  `src/lib/personligt.ts`, storens anteckningsfält eller anteckningssöket
  (`sokanteckningar.ts`). Ingen händelse bär anteckningsinnehåll.
- **Känslig sökdata minimeras.** En nollträffssökning loggas bara som längd och
  ordantal (`anonymiseraFraga`), aldrig som text. Frågesträngen strippas ur alla
  resurs-URL:er innan de loggas (`utanFraga`), så `?q=…` aldrig läcker in via ett
  fel-anrop.
- **Felrapportering samlar ingen onödig personlig text.** Okaught-fel loggar
  felets meddelande och kodplats (fil:rad), inte sidans innehåll eller det
  användaren skrivit.

## Rumsvalet påverkas aldrig

Rumsvalet (`src/lib/rumsval.ts`) är deterministiskt och läser bara publicerat
innehåll och lokal orienteringshistorik. Ingen telemetri, ingen popularitets-
eller engagemangssignal matas någonsin tillbaka in i valet — det finns ingen
dashboard som styr vilket rum en läsare möter.
