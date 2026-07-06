# Visdomsatlasen

En stilla, mobilanpassad svensk PWA för att vandra fritt bland mänsklighetens
idéer, texter, personer och traditioner. Ingen kursplattform – ett bibliotek,
en atlas, ett läsrum.

Den centrala frågan: **”Vad vill du utforska i dag?”**

Gränssnittet följer designen *Visdomsatlasen mobile design* (riktningen
»Folianten«): varmt papper (#FAF6ED), mörkt bläck, en djupröd accent (#772F35),
EB Garamond rakt igenom, ett centrerat 430 px-skal och mörkt läge.

Appen har två slags innehåll som lever sida vid sida:

- **Atlasen** – kuraterade essäer, personer, tidslinje och citat, skrivna som
  typade TypeScript-moduler i `src/content/`. Små, handskrivna, sammanlänkade.
- **Biblioteket** – *hela* källtexter. Nu: **Bibeln 1917** (public domain) och
  **Dhammapada** (SuttaCentral, CC0, svensk översättning via Ollama). På väg in:
  stoiska och taoistiska verk. De bor i en SQLite-databas som en liten
  Node-backend serverar, och de cachas i din enhet för läsning offline.

## Teknik

**Frontend (atlasen + biblioteksläsaren)**

- React 19 + Vite 7 + TypeScript (strict)
- TanStack Router (kodbaserade rutter)
- CSS Modules + globala designtokens
- localStorage för bokmärken, anteckningar, senast läst och mörkt läge
- Självhostad EB Garamond via `@fontsource/eb-garamond`
- PWA via `vite-plugin-pwa`; biblioteks-API:t runtime-cachas (Workbox) så
  hämtade texter går att läsa offline

**Backend (biblioteket) – samma driftsätt som newsAgg**

- Node + [Hono](https://hono.dev) som serverar både det byggda SPA:t och `/api`
- SQLite via `better-sqlite3`, schema och frågor med Drizzle ORM
- FTS5-index för snabb, diakritik-okänslig fritextsök över alla verser
- Ingest-pipeline med utbytbara källadaptrar (getbible, senare Gutenberg m.fl.)
- Ollama via Hermes-gateway för att översätta icke-svenska traditioner till svenska
- Basic auth + Tailscale-only – privat, bara för dig, men nåbar från mobilen
- Docker-container, deploy via GitHub Actions till Hetzner (som newsAgg)

## Kom igång

```bash
npm install
cp .env.example .env        # sätt ATLAS_USER/ATLAS_PASS m.m.

# Fyll databasen med ett urval av 1917 års bibel (utan nätverk):
BIBLE_SOURCE=fixture npm run ingest

# Kör backend (API + statisk server) och Vite-dev parallellt:
npm run dev:api             # Node-servern på http://localhost:8080
npm run dev                 # Vite på http://localhost:5173 (proxar /api → 8080)
```

Vill du köra hela 1917 års bibel lokalt kör du `npm run ingest` utan
`BIBLE_SOURCE` – då hämtas den från [getbible](https://getbible.net) (public
domain, Projekt Runeberg). Getbibles värd är blockerad i vissa sandlådor men nås
normalt från din maskin och VPS:en.

## Bygga

```bash
npm run build      # typkontroll + produktionsbygge till dist/
npm run server     # kör Node-servern mot dist/ (samma som i containern)
```

## Kvalitetskontroller

```bash
npm run check              # allt nedan i följd
npm run check:types        # tsc -b (app, node och server)
npm run check:coverage     # type-coverage, kräver 100 % (app + server)
npm run check:length       # fallow: komplexitets- och längdgränser (max 50 rader/funktion)
npm run check:dead         # fallow: död kod och oanvända exporter
```

## Biblioteket – hela källtexter

### Datamodell

Texterna normaliseras till **verk → bok → kapitel → vers** och lagras i SQLite
(`server/db/schema.ts`):

- `works` – ett verk (Bibeln, Självbetraktelser …) med tradition, författare,
  översättning, licens och om texten är maskinöversatt.
- `books` – böcker/avdelningar (Bibelns 66 böcker; ett kort verk har en bok).
- `verses` – enskilda verser, med valfri originaltext vid sidan av översättningen.
- `verses_fts` – ett FTS5-index (triggeruppdaterat) för sök.

### API

Allt bakom basic auth (`server/index.ts`). Samma origin, så webbläsarens
inloggning följer automatiskt med SPA:ets anrop.

| Endpoint | Svar |
| --- | --- |
| `GET /api/library/works` | alla verk med bok- och versantal |
| `GET /api/library/works/:id` | ett verk + dess böcker |
| `GET /api/library/books/:bookId/chapters/:n` | ett kapitels verser (+ föregående/nästa) |
| `GET /api/library/search?q=` | fritextsök över alla verser (FTS5) |
| `POST /api/ingest` | kör ingest (skyddad av `INGEST_TOKEN`, som newsAggs `/api/update`) |

### Ingest och källadaptrar

En **källadapter** hämtar och normaliserar ett verk (`server/ingest/`). Bibeln
har två adaptrar för samma verk:

- `bible/getbible.ts` – hämtar hela 1917 års bibel från getbibles API (VPS/produktion).
- `bible/fixture.ts` – läser ett litet urval ur `data/fixtures/` (lokal verifiering,
  och grunden för CI).

Kör ingest via CLI (som newsAggs `update-news.ts`, lämpligt för cron på hosten):

```bash
npm run ingest                 # alla verk
npm run ingest bibel-1917      # bara Bibeln
BIBLE_SOURCE=fixture npm run ingest   # från fixture-filen
```

Fler traditioner läggs till genom att registrera en builder i
`server/ingest/run.ts`. Icke-svenska public domain-texter översätts till svenska
med Ollama vid ingest (`server/ingest/translate.ts`); sätt `TRANSLATE=off` för
att hoppa över översättningen vid lokal verifiering.

Inlagda verk:

- **Bibeln 1917** – `server/ingest/bible/` (getbible, public domain).
- **Dhammapada** – `server/ingest/dhammapada/` (SuttaCentral bilara-data, CC0):
  hela 423 verser i 26 vaggas, engelska (Bhikkhu Sujato) + pali som originaltext,
  översatt till svenska via Ollama.

### Offline

`vite-plugin-pwa` runtime-cachar `/api/library/*`. Knappen **”Ladda ner för
offline”** i biblioteket hämtar hem alla kapitel medan du är ansluten (via
Tailscale), varefter de går att läsa utan uppkoppling.

## Docker

```bash
docker build -t visdomsatlasen .
docker run -p 3001:8080 \
  -v $PWD/data:/app/data \
  --env-file .env \
  visdomsatlasen
# öppna http://localhost:3001 (kräver ATLAS_USER/ATLAS_PASS)
```

Bygget är flerstegs: ett deps-steg bygger `better-sqlite3`, ett byggsteg
producerar `dist/`, och körsteget startar Node-servern som levererar både SPA
och API. Databasen ligger i den monterade volymen `/app/data`.

## Driftsättning på Hetzner (privat, via Tailscale)

Samma modell som newsAgg:

1. **CI** (`.github/workflows/ci.yml`) kör typkontroll, fallow, bygge och en
   fixture-ingest på varje PR.
2. **Deploy** (`.github/workflows/deploy.yml`) bygger imagen vid push till
   `main`, pushar den till GHCR, ansluter till Tailscale och kör om containern
   `visdomsatlasen` på servern (host-port 3001 → container 8080), med
   `/opt/visdomsatlasen/data` som volym och `/opt/visdomsatlasen/.env` som miljö.
3. **Privat:** servern nås bara via Tailscale och kräver basic auth. Ingen öppen
   internetexponering.
4. **Fyll biblioteket:** kör `npm run ingest` (eller `POST /api/ingest` med
   `INGEST_TOKEN`) en gång på servern; texterna är statiska och behöver inte
   uppdateras löpande.

Nödvändiga GitHub-secrets (som newsAgg): `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`,
`HETZNER_TS_IP`, `HETZNER_USER`, `HETZNER_SSH_KEY`.

## Projektstruktur

```
src/                 frontend (atlasen + biblioteksläsaren)
  app/               router och rotlayout (skal + bottennavigering)
  components/        små återanvändbara delar
  content/           atlasens typade innehåll (essäer, personer, tidslinje …)
  lib/               store, sök, API-klient (api.ts), offline-hämtning
  pages/             en komponent per skärm
    library/         Bibliotek, Verk, Bok, Kapitel (läsare), sök
  styles/            globala tokens (ljust/mörkt), animationer, bastypografi
server/              Node-backend (Hono + SQLite)
  db/                schema, migreringar, databasinit
  library/           lagring (store) och läsning (repository, search)
  ingest/            normaliserad modell + källadaptrar (bible/…)
  api/               Hono-rutter (library, ingest)
scripts/ingest.ts    CLI-ingest (körs av cron på VPS:en)
data/fixtures/       urval av 1917 för lokal verifiering (DB byggs, ej i git)
```

### Lägga till ett atlas-ämne

Skapa `src/content/topics/<namn>.ts` som exporterar en `Topic` och registrera det
i `topics/index.ts` och en tradition i `traditions.ts`.

## Skärmar och rutter

| Rutt | Skärm |
| --- | --- |
| `/` | Hem: dagens datum, ämnena, »Fortsätt där du var«, dagens citat |
| `/utforska` | Samlingarna ordnade efter tradition + register |
| `/bibliotek` | Biblioteket: hela källtexter per tradition + offline-hämtning |
| `/bibliotek/$workId` | Ett verk och dess böcker |
| `/bibliotek/$workId/$bookSlug` | En boks kapitel |
| `/kapitel/$workId/$bookSlug/$chapter` | Läsläge för ett kapitel |
| `/bibliotek-sok` | Fritextsök över alla verser |
| `/amne/$id` | Ämnessida: ingång, vägar in, personer, relaterade idéer |
| `/las/$id/$mode` | Läsläge för essä/kontext med anteckningsark |
| `/kalla/$id` | Kuraterad originaltext (atlasen) |
| `/tidslinje` · `/personer` · `/person/$id` · `/atlas` · `/samling` · `/sok` | Atlasens övriga skärmar |

Bottennavigeringen (Hem · Utforska · Texter · Atlas · Samling) döljs i läsläge,
originaltext och sök.

## Kända begränsningar

- Biblioteket kräver backend (SQLite) igång; atlasen fungerar även helt statiskt.
- Svenska public domain-översättningar finns i praktiken bara för Bibeln (1917).
  Övriga traditioner översätts maskinellt med Ollama och bör läsas med urskillning
  (verk markeras »översatt«).
- Getbible-adaptern kräver nätverk vid ingest; texten cachas sedan lokalt.
- Anteckningar och bokmärken lagras per enhet/webbläsare – ingen synk.

## Förslag på nästa steg

- Fylla på stoicism och taoism (adaptrar + Ollama-översättning); Bibeln och
  Dhammapada är inne.
- Länka atlasens ämnen direkt in i biblioteksverserna.
- Export/import av anteckningar (JSON).
- PNG-ikoner och skärmbilder i manifestet för bättre installationsupplevelse.
- Enkla tester för sök, ingest-normalisering och localStorage-storen.
