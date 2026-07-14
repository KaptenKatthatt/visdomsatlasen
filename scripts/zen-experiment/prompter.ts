// Promptmallar för de fyra arbetsflödena (A direkt, B engelskt mellanled,
// C analytiskt, D korsgranskning). Alla svenska svar följer samma rubrikstruktur
// så att utvärderingen kan jämföra flöden rakt av.
import type { Passage } from './typer'

export const systemSv = [
  'Du är en filologiskt noggrann översättare av klassiska zenbuddhistiska texter',
  '(klassisk kinesiska, kanbun och klassisk japanska) till svenska.',
  'Du hittar aldrig på innehåll. När originalet är tvetydigt redovisar du tvetydigheten',
  'i stället för att dölja den bakom flytande prosa. Du skiljer alltid mellan vad som',
  'står i texten och vad som är tolkning. Svara på svenska.',
].join(' ')

export const systemEn = [
  'You are a philologically careful translator of classical Zen Buddhist texts',
  '(classical Chinese, kanbun, classical Japanese) into English.',
  'You never invent content. You keep ambiguity visible instead of smoothing it over.',
].join(' ')

const metadata = (passage: Passage): string =>
  [
    `Författare: ${passage.forfattare}`,
    `Verk: ${passage.verk}`,
    `Datering: ${passage.datum}`,
    `Språktyp: ${passage.sprak}`,
  ].join('\n')

const svenskaSektioner = [
  'Svara med exakt dessa rubriker:',
  '## ORDAGRANN ÖVERSÄTTNING',
  '(så nära originalets ordföljd och bilder som svenskan tillåter, med [alternativa läsningar] i hakparentes)',
  '## LÄSBAR ÖVERSÄTTNING',
  '(naturlig svensk prosa för en allmänbildad läsare, trogen originalets ton och metaforer)',
  '## TVETYDIGHETER',
  '(ställen där originalet tillåter flera läsningar och vilken du valt och varför)',
  '## TERMINOLOGIBESLUT',
  '(hur du återger buddhistiska facktermer och varför)',
  '## KONFIDENS',
  '(1–5 där 5 är säkrast, med motivering; var ärlig om svagheter)',
].join('\n')

export const promptA = (passage: Passage): string =>
  [
    'Översätt följande text till svenska.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    svenskaSektioner,
  ].join('\n')

export const promptB1 = (passage: Passage): string =>
  [
    'Produce a literal English working translation of the following text.',
    'Stay close to the source syntax, keep every image, mark [alternative readings]',
    'in brackets, and add short notes on ambiguity. Do not polish the English.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
  ].join('\n')

export const promptB2 = (passage: Passage, engelsk: string): string =>
  [
    'Översätt följande text till svenska. Du får också en ordagrann engelsk',
    'arbetsöversättning som stöd. Den engelska versionen är ett arbetsverktyg,',
    'inte källan: kontrollera varje sats mot originalet och följ originalet när',
    'de skiljer sig åt.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    'Engelsk arbetsöversättning:',
    engelsk,
    '',
    svenskaSektioner,
    '## AVVIKELSER FRÅN DEN ENGELSKA VERSIONEN',
    '(ställen där du följde originalet i stället för den engelska tolkningen)',
  ].join('\n')

export const promptC1 = (passage: Passage): string =>
  [
    'Analysera följande text inför en översättning till svenska. Översätt inte ännu.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    'Svara med exakt dessa rubriker:',
    '## SEGMENTERING',
    '(dela upp texten i satser/fraser med radnummer)',
    '## GRAMMATISK ANALYS',
    '(per segment: konstruktion, partiklar/funktionsord, subjekt och syftningar)',
    '## NYCKELTERMER',
    '(buddhistiska och litterära facktermer: betydelse, bakgrund, översättningsalternativ)',
    '## ALTERNATIVA LÄSNINGAR',
    '(ställen där texten kan förstås på flera sätt, med argument för varje läsning)',
    '## HISTORISK OCH BUDDHISTISK KONTEXT',
    '(bara det som behövs för att översätta rätt; spekulera inte)',
    '## OLÖSTA OSÄKERHETER',
    '(det du inte kan avgöra från texten ensam)',
  ].join('\n')

export const promptC2 = (passage: Passage, analys: string): string =>
  [
    'Utgå från din analys nedan och översätt nu texten till svenska.',
    'Följ analysen där den är säker och redovisa oavgjorda ställen som tvetydiga.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    'Analys:',
    analys,
    '',
    svenskaSektioner,
  ].join('\n')

// Produktionsgranskning: samma protokoll som flöde D men för en enda översättning
// (det analytiska C-flödet). Används av produktionskörningen (scripts/zen-oversatt),
// där bara C finns. Fynden är uppslag för mänsklig kontroll, aldrig facit.
export const promptGranska = (passage: Passage, oversattning: string): string =>
  [
    'Granska en svensk översättning av en klassisk zentext, gjord av en annan modell.',
    'Jämför varje sats mot originalet. Var strängt kritisk men konkret: peka på exakta',
    'ställen och citera originalets tecken när du påtalar fel. Om du inte hittar något',
    'fel under en rubrik, skriv "inget att anmärka" — hitta inte på fel.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    'Översättning (analytiskt flöde):',
    oversattning,
    '',
    'Svara med exakt dessa rubriker:',
    '## UTELÄMNAD MENING',
    '## PÅHITTADE FÖRKLARINGAR',
    '## FELÖVERSATTA TERMER',
    '## ÖVERDRIVEN MODERNISERING',
    '## ENGELSK INTERFERENS',
    '## ONATURLIG SVENSKA',
    '## FALSK SÄKERHET',
    '(påståenden som låter säkrare än originalet medger)',
    '## DOLD TVETYDIGHET',
    '(tvetydigheter i originalet som översättningen osynliggör)',
    '## SAMLAD BEDÖMNING',
    '(är översättningen en duglig utgångspunkt för mänsklig granskning, och vad bör granskas närmast)',
  ].join('\n')

export const promptD = (passage: Passage, oversattningA: string, oversattningC: string): string =>
  [
    'Granska två svenska översättningar av samma klassiska zentext, gjorda av en annan',
    'modell. Jämför varje sats mot originalet. Var strängt kritisk men konkret:',
    'peka på exakta ställen och citera originalets tecken när du påtalar fel.',
    '',
    metadata(passage),
    '',
    'Original:',
    passage.original,
    '',
    'Översättning 1 (direktflöde):',
    oversattningA,
    '',
    'Översättning 2 (analytiskt flöde):',
    oversattningC,
    '',
    'Svara med exakt dessa rubriker, och behandla båda översättningarna under varje rubrik:',
    '## UTELÄMNAD MENING',
    '## PÅHITTADE FÖRKLARINGAR',
    '## FELÖVERSATTA TERMER',
    '## ÖVERDRIVEN MODERNISERING',
    '## ENGELSK INTERFERENS',
    '## ONATURLIG SVENSKA',
    '## FALSK SÄKERHET',
    '(påståenden som låter säkrare än originalet medger)',
    '## DOLD TVETYDIGHET',
    '(tvetydigheter i originalet som översättningen osynliggör)',
    '## SAMLAD BEDÖMNING',
    '(vilken översättning som är bäst som utgångspunkt och varför)',
  ].join('\n')
