import { l, type Topic } from '../model'

export const sjalen: Topic = {
  id: 'sjalen',
  title: 'Vad är själen?',
  tradition: 'Antik filosofi',
  min: 4,
  intro:
    'Är den en fånge i kroppen, kroppens form — eller en illusion? Tre svar som fortfarande formar hur vi tänker om oss själva.',
  essay: [
    [
      'Hos Homeros är psyche knappt mer än en andedräkt som lämnar den döende. Det är med ',
      l('Platon', 'person', 'platon'),
      ' själen blir ett väsen: odödlig, besläktad med idéerna, tillfälligt instängd i en kropp. I dialogen ',
      l('Faidon', 'source', 'faidon'),
      ' låter han Sokrates argumentera, timmarna före sin egen avrättning, för att filosofens hela liv är en övning i att dö.',
    ],
    [
      'Aristoteles svarade sin lärare: själen är inte en fånge utan kroppens form — det som gör ett levande ting levande, så som synförmågan är ögats själ. Och österut ställde ',
      l('Buddha', 'person', 'siddharta'),
      ' frågan på ett annat sätt: kanske finns där inget bestående själv alls, bara ett flöde av tillstånd som klamrar sig fast vid tanken på ett jag.',
    ],
    [
      l('Egyptierna', 'topic', 'egypten'),
      ' räknade själens delar, de kristna gav den evigt värde, ',
      l('stoikerna', 'topic', 'stoicism'),
      ' såg den som ett fragment av världsförnuftet. Frågan är inte avgjord — den har bara bytt språk, från religionens till psykologins och hjärnforskningens.',
    ],
  ],
  context: [
    [
      'Ordet avslöjar tanken. Grekiskans psyche, latinets anima och sanskrits atman betyder alla ursprungligen andedräkt eller vind — själen är det som andas, det som skiljer den levande från den döda.',
    ],
    [
      'Frågan om själen var aldrig bara teoretisk: den avgjorde hur man såg på döden, på moraliskt ansvar och på vad en människa ytterst är. Varje tradition i denna atlas har gett sitt eget svar.',
    ],
  ],
  sources: ['faidon'],
  related: ['lidandet', 'egypten', 'stoicism'],
  people: ['platon', 'siddharta'],
}
