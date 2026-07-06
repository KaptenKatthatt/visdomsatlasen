# Visdomsatlasen

En stilla, mobilanpassad svensk PWA för att vandra fritt bland mänsklighetens
idéer, texter, personer och traditioner. Ingen kursplattform – ett bibliotek,
en atlas, ett läsrum.

Den centrala frågan: **”Vad vill du utforska i dag?”**

Gränssnittet följer designen *Visdomsatlasen mobile design* (riktningen
»Folianten«): varmt papper (#FAF6ED), mörkt bläck, en djupröd accent (#772F35),
EB Garamond rakt igenom, ett centrerat 430 px-skal och mörkt läge.

## Teknik

- React 19 + Vite 7 + TypeScript (strict)
- TanStack Router (kodbaserade rutter)
- CSS Modules + globala designtokens
- Typat innehåll i TypeScript-moduler (essäer med länkar in i atlasen)
- localStorage för bokmärken, anteckningar, senast läst och mörkt läge
- Självhostad EB Garamond via `@fontsource/eb-garamond`
- PWA via `vite-plugin-pwa` (offline-cache av byggda filer)
- Ingen backend, ingen databas, ingen inloggning

## Kom igång

```bash
npm install
npm run dev        # utvecklingsserver på http://localhost:5173
```

## Bygga

```bash
npm run build      # typkontroll + produktionsbygge till dist/
npm run preview    # provkör produktionsbygget lokalt
```

## Kvalitetskontroller

```bash
npm run check              # allt nedan i följd
npm run check:types        # tsc, strict
npm run check:coverage     # type-coverage, kräver 100 %
npm run check:length       # fallow: komplexitets- och längdgränser (max 50 rader/funktion)
npm run check:dead         # fallow: död kod och oanvända exporter
```

Anmärkning: `type-coverage` körs i standardläge (inte `--strict`), eftersom
TanStack Routers publicerade typer innehåller `any` som typargument i sina
generics. All egen kod är 100 % typtäckt.

## Docker

```bash
docker build -t visdomsatlasen .
docker run -p 8080:80 visdomsatlasen
# öppna http://localhost:8080
```

Bygget är tvåstegs: Node bygger, nginx serverar `dist/` med SPA-fallback
(alla rutter → `index.html`).

## Driftsättning på Hetzner VPS

1. Installera Docker på servern: `curl -fsSL https://get.docker.com | sh`
2. Klona repot eller kopiera upp projektet: `git clone <repo> && cd visdomsatlasen`
3. Bygg och starta:
   ```bash
   docker build -t visdomsatlasen .
   docker run -d --restart unless-stopped -p 80:80 --name visdomsatlasen visdomsatlasen
   ```
4. HTTPS rekommenderas (krävs för PWA-installation). Enklast är en reverse
   proxy med automatiska certifikat, t.ex. Caddy:
   ```
   din-doman.se {
       reverse_proxy localhost:8080
   }
   ```
   och kör då containern på `-p 127.0.0.1:8080:80` i stället.
5. Uppdatering: `git pull && docker build -t visdomsatlasen .` och starta om
   containern med den nya imagen.

## Projektstruktur

```
src/
  app/            router och rotlayout (skal + bottennavigering)
  components/     små återanvändbara delar (rader, toppbar, ikoner, anteckningsark …)
  content/
    model.ts      innehållstyper och länkmodellen (To/Segment/Paragraph)
    topics/       ämnena – essä, historisk kontext, källor, personer, relaterat
    sources.ts    originaltexterna med metadata och verser
    people.ts     personregister med biografier
    traditions.ts traditionerna som grupperar utforskasidan
    timeline.ts   tidslinjens händelser
    atlasMap.ts   atlasvyns noder och trådar
    quotes.ts     dagens citat
  lib/            localStorage-store (context), sök, lagring
  pages/          en komponent per skärm
  styles/         globala tokens (ljust/mörkt), animationer, bastypografi
```

### Lägga till ett ämne

Skapa `src/content/topics/<namn>.ts` som exporterar en `Topic` (essä och
kontext skrivs som stycken av textsegment; `l('ord', 'topic'|'person'|'source', 'id')`
skapar en länk in i atlasen). Registrera ämnet i `topics/index.ts` och i en
tradition i `traditions.ts`. Ämnet dyker då upp på hem, utforska och i sök.

## Skärmar och rutter

| Rutt | Skärm |
| --- | --- |
| `/` | Hem: dagens datum, ämnena, »Fortsätt där du var«, dagens citat |
| `/utforska` | Samlingarna ordnade efter tradition + register |
| `/amne/$id` | Ämnessida: ingång, vägar in, personer, relaterade idéer |
| `/las/$id/$mode` | Läsläge (`essa` eller `kontext`) med anteckningsark |
| `/kalla/$id` | Originaltext med tillkomst, språk, översättning |
| `/tidslinje` | Tidslinjen från Dödsboken till Självbetraktelserna |
| `/personer` | Personer & traditioner |
| `/person/$id` | Personsida med biografi |
| `/atlas` | Atlasvyn – idéernas karta med trådar |
| `/samling` | Bokmärken och anteckningar |
| `/sok` | Sök över ämnen, personer och originaltexter |

Bottennavigeringen (Hem · Utforska · Atlas · Samling) döljs i läsläge,
originaltext och sök, precis som i designen.

## Kända begränsningar

- Sex ämnen och sex originaltexter i MVP:n.
- Designens alternativa riktningar (»Arkivet«, »Atlasen«) och textskalan är
  inte implementerade – appen följer standardriktningen »Folianten«.
- PWA-ikonen är en SVG; äldre enheter kan vilja ha PNG-ikoner (192/512 px).
- Sökningen är enkel delsträngsmatchning, ingen rankning eller stavningstolerans.
- Anteckningar och bokmärken lagras per enhet/webbläsare – ingen synk.
- Inga automatiska tester ännu.

## Förslag på nästa steg

- Fler ämnen och källtexter (taoism saknas t.ex. helt).
- Export/import av anteckningar (JSON) så att inget går förlorat.
- PNG-ikoner och skärmbilder i manifestet för bättre installationsupplevelse.
- Följ systemets mörka läge (`prefers-color-scheme`) som startvärde.
- Enkla tester för sökningen och localStorage-storen.
