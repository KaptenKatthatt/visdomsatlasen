import { l, type Topic } from '../model'

export const predikaren: Topic = {
  id: 'predikaren',
  title: 'Mening enligt Predikaren',
  tradition: 'Judendom',
  min: 4,
  intro:
    'Mitt i Bibeln står en bok som låter som en trött filosof: allt är vindars jagande. Ändå slutar den inte i mörker.',
  essay: [
    [
      'Predikaren — Qohelet på hebreiska — är Bibelns märkligaste bok. Dess återkommande ord, hevel, brukar översättas med fåfänglighet men betyder snarare dimma eller andedräkt: det som inte låter sig gripas. Rikedom, visdom, arbete, nöjen — Predikaren har prövat allt och funnit samma sak. ',
      l('Allt går förbi', 'source', 'predikaren'),
      '.',
    ],
    [
      'Men boken är ingen uppmaning till förtvivlan. Just för att ingenting består, säger den, ska människan äta sitt bröd med glädje, arbeta med sina händer och leva med den hon älskar. Det är en mening som inte pekar bort från livet utan in i det — närmare ',
      l('stoikernas', 'topic', 'stoicism'),
      ' övning i nuet än man kunde vänta av en biblisk text.',
    ],
    [
      'Att en så skeptisk röst fick plats i kanon säger något om judendomens förhållande till tvivlet: frågan hör hemma i tron. ',
      l('Jesus', 'person', 'jesus'),
      ', som växte upp med dessa texter, ärvde deras blick för det förgängliga — liljorna på marken, som är i dag och i morgon kastas i ugnen.',
    ],
  ],
  context: [
    [
      'Predikaren tillhör Bibelns vishetslitteratur, tillsammans med Job och Ordspråksboken. Boken dateras oftast till hellenistisk tid, omkring 250 f.Kr, då grekiskt tankegods mötte judisk tradition i handelsstädernas skugga.',
    ],
    [
      'Traditionen tillskrev orden kung Salomo, men språket röjer en senare tid. Att boken alls togs in i kanon var omstritt — dess skepsis balanseras av slutordens uppmaning att frukta Gud, möjligen tillfogad av en senare hand.',
    ],
  ],
  sources: ['predikaren'],
  related: ['stoicism', 'historiska-jesus', 'egypten'],
  people: ['jesus'],
}
