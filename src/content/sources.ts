import type { Source } from './model'

export const allSources: Source[] = [
  {
    id: 'markus',
    title: 'Markusevangeliet 1:14–15',
    author: 'Okänd författare',
    origin: 'ca 70 e.Kr, troligen Rom',
    originShort: 'ca 70 e.Kr',
    lang: 'Grekiska (koine)',
    trans: '1917 års kyrkobibel',
    note: 'Markusevangeliet är det äldsta bevarade evangeliet, skrivet omkring år 70, kort efter templets förstörelse. Dess Jesus är gåtfull och brådskande — ordet »genast« återkommer över fyrtio gånger.',
    text: [
      'Men sedan Johannes hade blivit satt i fängelse, kom Jesus till Galileen och predikade Guds evangelium.',
      'Och han sade: »Tiden är fullbordad, och Guds rike är nära; gören bättring, och tron evangelium.«',
    ],
  },
  {
    id: 'aurelius',
    title: 'Självbetraktelser II:1',
    author: 'Marcus Aurelius',
    origin: 'ca 170 e.Kr, fältläger vid Donau',
    originShort: 'ca 170 e.Kr',
    lang: 'Grekiska',
    trans: 'Fri översättning',
    note: 'Marcus Aurelius förde sina anteckningar på grekiska under fälttågen mot markomannerna. Titeln Självbetraktelser är senare — själv kallade han dem »Till sig själv«.',
    text: [
      'När du vaknar om morgonen, säg till dig själv: i dag ska jag möta människor som är påträngande, otacksamma, övermodiga, svekfulla, avundsjuka och osällskapliga. Sådana är de eftersom de inte kan skilja gott från ont.',
      'Men jag, som har sett det godas natur — att det är skönt — och det ondas — att det är skamligt — och den felandes — att han är av samma släkt som jag: jag kan inte skadas av någon av dem, och inte heller vredgas på min frände eller vända mig ifrån honom.',
      'Vi är skapade för samverkan, som fötterna, som händerna, som ögonlocken, som tändernas övre och undre rad.',
    ],
  },
  {
    id: 'dodsboken',
    title: 'Dödsboken, kapitel 125',
    author: 'Den negativa bekännelsen',
    origin: 'ca 1550 f.Kr, Egypten',
    originShort: 'ca 1550 f.Kr',
    lang: 'Fornegyptiska',
    trans: 'Fri översättning',
    note: 'Den negativa bekännelsen uttalades inför dödsrikets fyrtiotvå domare. Att bedyra sin oskuld — inte bekänna sin synd — var vägen genom domen.',
    text: [
      'Jag har inte gjort människor orätt.',
      'Jag har inte förtryckt de mina.',
      'Jag har inte tagit mjölken ur barnets mun.',
      'Jag har inte fått någon att gråta.',
      'Jag har inte dödat, och inte befallt att döda.',
      'Jag är ren. Jag är ren. Jag är ren.',
    ],
  },
  {
    id: 'faidon',
    title: 'Faidon 64a',
    author: 'Platon',
    origin: 'ca 380 f.Kr, Aten',
    originShort: 'ca 380 f.Kr',
    lang: 'Grekiska',
    trans: 'Fri översättning',
    note: 'Dialogen utspelar sig i Sokrates fängelsecell under hans sista timmar, våren 399 f.Kr. Platon låter honom argumentera för själens odödlighet — och tömma giftbägaren utan fruktan.',
    text: [
      'De som ägnar sig åt filosofin på rätt sätt övar sig i ingenting annat än att dö och att vara döda.',
      'Och om detta är sant, vore det besynnerligt att hela livet sträva efter just detta — och att sedan, när det kommer, harmas över det som man så länge har eftersträvat.',
    ],
  },
  {
    id: 'predikaren',
    title: 'Predikaren 1:2–5',
    author: 'Qohelet',
    origin: 'ca 250 f.Kr, Juda',
    originShort: 'ca 250 f.Kr',
    lang: 'Hebreiska',
    trans: '1917 års kyrkobibel',
    note: 'Öppningsorden i 1917 års översättning. Hebreiskans hevel — här »fåfänglighet« — betyder ordagrant dimma eller andedräkt.',
    text: [
      'Fåfängligheters fåfänglighet! säger Predikaren. Fåfängligheters fåfänglighet! Allt är fåfänglighet!',
      'Vad förmån har människan av all möda som hon gör sig under solen?',
      'Släkte går, och släkte kommer, och jorden står evinnerligen kvar.',
      'Och solen går upp, och solen går ned, och har sedan åter brått att komma till den ort där hon går upp.',
    ],
  },
  {
    id: 'dhammapada',
    title: 'Dhammapada 1–2',
    author: 'Ur Buddhas undervisning',
    origin: 'ca 100 f.Kr, nedtecknad på Sri Lanka',
    originShort: 'ca 100 f.Kr',
    lang: 'Pali',
    trans: 'Fri översättning',
    note: 'Dhammapada, »sanningens väg«, är en samling av 423 verser ur Buddhas undervisning, nedtecknad på pali omkring vår tideräknings början.',
    text: [
      'Allt vad vi är är följden av vad vi har tänkt: det vilar på våra tankar, det är gjort av våra tankar.',
      'Talar eller handlar någon med oren tanke, följer honom lidandet, som hjulet följer dragdjurets fot.',
      'Talar eller handlar någon med ren tanke, följer honom glädjen, som skuggan, som aldrig viker.',
    ],
  },
]

export const findSource = (id: string): Source | undefined =>
  allSources.find((source) => source.id === id)
