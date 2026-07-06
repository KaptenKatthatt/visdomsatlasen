import { l, type Topic } from '../model'

export const lidandet: Topic = {
  id: 'lidandet',
  title: 'Människan och lidandet',
  tradition: 'Buddhism',
  min: 4,
  intro:
    'Buddhas första sanning är en diagnos, inte en dom: att vara människa är att vara i friktion med tillvaron. Frågan är vad man gör med det.',
  essay: [
    [
      l('Siddharta Gautama', 'person', 'siddharta'),
      ' beskrev sin lära som en läkares: här är sjukdomen, här är dess orsak, här är botemedlet. Sjukdomen kallade han dukkha — ofta översatt med lidande, men närmare otillfredsställelse, som ett hjul som skaver mot sin axel. Orsaken är begäret: inte önskningarna i sig, utan greppet, klamrandet vid det som inte kan bestå.',
    ],
    [
      'Botemedlet är varken förnekelse eller flykt utan uppmärksamhet: att se begäret när det uppstår, utan att genast lyda. ',
      l('Epiktetos', 'person', 'epiktetos'),
      ' lärde något påfallande likt i Rom, utan känd kontakt mellan traditionerna: det är inte tingen som plågar oss, utan våra omdömen om tingen. Två världar, samma insikt — lidandet börjar i greppet, inte i världen.',
    ],
    [
      l('Kristendomen', 'topic', 'historiska-jesus'),
      ' valde en tredje väg: lidandet förnekas inte utan bärs, och får i korset en plats i själva gudsbilden. ',
      l('Predikaren', 'topic', 'predikaren'),
      ', äldst av dem alla, nöjer sig med att konstatera att gråt och skratt har var sin tid. Ingen av traditionerna vänder bort blicken.',
    ],
  ],
  context: [
    [
      'Siddharta Gautama levde i norra Indien under en tid av religiös jäsning, då missnöje med den vediska offerkulten födde nya rörelser — jainismen, ajivikerna, buddhismen. Gemensamt var frågan hur människan tar sig ur kretsloppet av begär och återfödelse.',
    ],
    [
      'Läran spreds längs handelsvägarna: söderut till Sri Lanka, norrut över Sidenvägen till Kina, där den mötte taoismen och långsamt bytte gestalt. Få idéer har vandrat längre.',
    ],
  ],
  sources: ['dhammapada'],
  related: ['stoicism', 'historiska-jesus', 'sjalen'],
  people: ['siddharta', 'epiktetos'],
}
