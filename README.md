# Visdomsatlasen

En stilla, mobilanpassad svensk PWA för att vandra fritt bland mänsklighetens
idéer, texter, personer och traditioner. Ingen kursplattform – ett bibliotek,
en atlas, ett läsrum.

Den centrala frågan: **”Vad vill du utforska i dag?”**

Gränssnittet följer designen *Visdomsatlasen mobile design* (riktningen
»Folianten«): varmt papper (#FAF6ED), mörkt bläck, en djupröd accent (#772F35),
EB Garamond rakt igenom, ett centrerat 430 px-skal och mörkt läge.

Appen har två slags innehåll som lever sida vid sida:

- **Det redaktionella innehållet** – reflektionsrum, frågor, teman, källor och
  vandringar, skrivna som Markdown med frontmatter under `src/content/<typ>/` och
  validerade av zod-scheman (`src/content/redaktion/`). Läses i **Läsrummet**
  (`/rum/$slug`) och utforskas via **Biblioteket** (`/bibliotek`); bara publicerat
  innehåll visas. (Den äldre atlasen – typade TypeScript-moduler under
  `src/content/topics/`, `people.ts`, `timeline.ts` – finns kvar bakom sina rutter
  men fasas ut fas för fas.)
- **Biblioteket** – *hela* källtexter: **Bibeln 1917**, **Dhammapada**
  (buddhism), **Självbetraktelser** av Marcus Aurelius (stoicism) och **Tao Te
  Ching** (taoism). Alla public domain; de icke-svenska översätts till svenska
  via Ollama. De bor i en SQLite-databas som en liten Node-backend serverar, och
  de cachas i din enhet för läsning offline.

## Teknik

**Frontend (läsrummet, biblioteket, biblioteksläsaren)**

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
- Tailscale-only – privat, bara för dig, men nåbar från mobilen (ingen
  inloggning: innehållet är public domain och ingen personlig data lämnar enheten)
- Docker-container, deploy via GitHub Actions till Hetzner (som newsAgg)

## Kom igång

```bash
npm ci
cp .env.example .env        # sätt INGEST_TOKEN m.m.

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
npm run check              # hela grinden nedan i följd (samma som CI)
npm run check:types        # tsc -b (app, node och server)
npm run check:lint         # ESLint
npm run test               # Vitest
npm run check:content      # innehållsvalidering (scripts/validera-innehall.ts)
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

Läs-endpointsen är öppna (servern körs Tailscale-only, `server/index.ts`); bara
den skrivande ingest-endpointen kräver en token.

| Endpoint | Svar |
| --- | --- |
| `GET /api/library/works` | alla verk med bok- och versantal |
| `GET /api/library/works/:id` | ett verk + dess böcker |
| `GET /api/library/books/:bookId/chapters/:n` | ett kapitels verser (+ föregående/nästa) |
| `GET /api/library/search?q=` | söker böcker på namn (t.ex. "matteus") + fritextsök över alla verser (FTS5) |
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
  423 verser i 26 vaggas, engelska (Bhikkhu Sujato) + pali som originaltext.
- **Självbetraktelser** – `server/ingest/meditations/` (Marcus Aurelius, George
  Longs engelska via Project Gutenberg): 12 böcker, 435 sektioner.
- **Tao Te Ching** – `server/ingest/taote/` (Laozi, James Legges engelska via
  Standard Ebooks): 81 kapitel.

De icke-svenska verken översätts till svenska via Ollama vid ingest; den
engelska källtexten bevaras som originaltext vid sidan av översättningen.

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
# öppna http://localhost:3001 (ingen inloggning – läsning är öppen)
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
3. **Privat:** servern nås bara via Tailscale — ingen öppen internetexponering.
   Läsning kräver ingen inloggning (public domain-innehåll, ingen personlig data
   på servern); bara `POST /api/ingest` skyddas av `INGEST_TOKEN`.
4. **Fyll biblioteket:** sker **automatiskt** — vid varje serverstart ingest:as
   de verk som saknas i databasen i bakgrunden (`AUTO_INGEST`, på som standard).
   Så ett nytt verk fylls på av sig självt vid nästa deploy, utan att befintliga
   verk översätts om. Vill du köra manuellt (eller om-ingesta ett verk) går det
   fortfarande via `npm run ingest [verk-id]` eller `POST /api/ingest` med
   `INGEST_TOKEN`. Texterna är statiska och behöver ingen löpande uppdatering.

Nödvändiga GitHub-secrets (som newsAgg): `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`,
`HETZNER_TS_IP`, `HETZNER_USER`, `HETZNER_SSH_KEY`.

## Projektstruktur

```
src/                 frontend (läsrummet, biblioteket, biblioteksläsaren)
  app/               router och rotlayout (skal + bottennavigering)
  components/        små återanvändbara delar
  content/           innehåll: redaktionell Markdown (rum/fragor/teman/kallor/
                     vandringar/traditioner) + redaktion/ (zod-scheman, validering);
                     äldre typade moduler (topics/, people.ts, timeline.ts)
  lib/               store, sök, API-klient (api.ts), offline; innehall.ts,
                     bibliotek.ts, rumsval.ts (redaktionellt datalager)
  pages/             en komponent per skärm
    bibliotek/       landning + fråge-/tema-/rumslist-/käll-/vandringssidor
    library/         verkläsaren: Verklista, Verk, Bok, Kapitel, sök
  styles/            globala tokens (ljust/mörkt), animationer, bastypografi
server/              Node-backend (Hono + SQLite)
  db/                schema (Drizzle ORM), migreringar (handskriven SQL), databasinit
  library/           lagring (store) och läsning (repository, search)
  ingest/            normaliserad modell + källadaptrar (bible/…)
  api/               Hono-rutter (library, ingest)
scripts/ingest.ts    CLI-ingest (körs av cron på VPS:en)
data/fixtures/       urval av 1917 för lokal verifiering (DB byggs, ej i git)
```

### Lägga till innehåll

**Redaktionellt innehåll (rum, frågor, teman, källor, vandringar)** skrivs som
Markdown med frontmatter under `src/content/<typ>/`, mot zod-scheman i
`src/content/redaktion/schema.ts`. Korsvalideringen (`validera.ts`, körs av
`npm run check:content`) upprätthåller att **publicerat aldrig länkar
opublicerat**, att publicerade rum har primär källa och lästid ≤ 10 min, m.m.
Bara `status: publicerad` visas för läsare; utkast nås via direkt länk.
Publicering är redaktörens beslut.

**Äldre atlas-ämne (utfasas):** skapa `src/content/topics/<namn>.ts` som
exporterar en `Topic` och registrera det i `topics/index.ts` och en tradition i
`traditions.ts`.

## Skärmar och rutter

| Rutt | Skärm |
| --- | --- |
| `/` | Läsrummet: dagens reflektionsrum |
| `/rum/$slug` | Ett reflektionsrum (valfri vandringskontext via `?vandring=`) |
| `/bibliotek` | Biblioteket: landning med Frågor, Teman, Rum, Källor, Traditioner, Sparat |
| `/bibliotek/fraga/$slug` | En fråga och dess rum |
| `/bibliotek/tema/$slug` | Ett tema och dess rum |
| `/bibliotek/rum` | Alla rum (ändlig lista) |
| `/bibliotek/kalla/$slug` | En källpost |
| `/bibliotek/vandring/$slug` | En vandring (kuraterad rumsföljd) |
| `/bibliotek/verk` | Verkläsaren: alla hela källtexter |
| `/bibliotek/verk/$workId` | Ett verk och dess böcker |
| `/bibliotek/verk/$workId/$bookSlug` | En boks kapitel |
| `/kapitel/$workId/$bookSlug/$chapter` | Läsläge för ett kapitel |
| `/bibliotek-sok` | Fritextsök över alla verser |
| `/installningar` | Inställningar (läsning + utseende) |
| `/samling` | Sparat |
| `/amne/$id` · `/las/$id/$mode` · `/kalla/$id` · `/tidslinje` · `/personer` · `/person/$id` · `/atlas` · `/utforska` · `/sok` | Äldre atlas-skärmar (nås via direkt-URL, utan navflik) |

De fyra bottenflikarna är **Läsrummet · Biblioteket · Sparat · Inställningar**
(`src/components/NavTabs.tsx`). Naven döljs på navlösa rutter — `NAVLESS_PREFIXES`
i `src/app/RootLayout.tsx`: `/las`, `/kalla`, `/sok`, `/kapitel`, `/bibliotek-sok`,
`/rum`.

## Kända begränsningar

- Biblioteket kräver backend (SQLite) igång; atlasen fungerar även helt statiskt.
- Svenska public domain-översättningar finns i praktiken bara för Bibeln (1917).
  Övriga traditioner översätts maskinellt med Ollama och bör läsas med urskillning
  (verk markeras »översatt«).
- Getbible-adaptern kräver nätverk vid ingest; texten cachas sedan lokalt.
- Anteckningar och bokmärken lagras per enhet/webbläsare – ingen synk.

## Förslag på nästa steg

- Fler verk och traditioner (samma adapter-mönster i `server/ingest/`).
- Länka atlasens ämnen direkt in i biblioteksverserna.
- Export/import av anteckningar (JSON).
- PNG-ikoner och skärmbilder i manifestet för bättre installationsupplevelse.
