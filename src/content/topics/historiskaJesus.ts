import { l, type Topic } from '../model'

export const historiskaJesus: Topic = {
  id: 'historiska-jesus',
  title: 'Historiska Jesus',
  tradition: 'Kristendom',
  min: 4,
  intro:
    'Bakom två tusen år av teologi finns en människa som få samtida källor nämner — och som ändå förändrade världshistorien. Vad kan vi faktiskt veta?',
  essay: [
    [
      'Nästan allt vi vet om Jesus från Nasaret kommer från texter skrivna årtionden efter hans död. ',
      l('Evangelierna', 'source', 'markus'),
      ' är inte biografier i modern mening utan trosdokument, formade av de tidiga församlingarnas frågor och strider. Utanför dem är källorna få: den judiske historikern Josefus nämner honom kort, liksom den romerske senatorn Tacitus. Ändå räcker det för att de flesta historiker ska vara eniga om grunddragen — en judisk predikant från Galileen som döptes av Johannes, samlade lärjungar och avrättades av den romerska makten.',
    ],
    [
      'Hans undervisning kretsade kring det han kallade Guds rike — inte en plats utan ett tillstånd där de sista blir de första. Han talade i liknelser som sällan ger färdiga svar, och möttes ofta av frågor med en motfråga. I detta liknar han andra lärare från antiken: ',
      l('Epiktetos', 'person', 'epiktetos'),
      ' undervisade också genom samtal, och ',
      l('buddhistiska texter', 'topic', 'lidandet'),
      ' använder samma paradoxala vändningar för att rubba invanda tankemönster.',
    ],
    [
      'Jesus levde i en tid av ockupation och apokalyptisk förväntan. Många judar väntade på att Gud skulle ingripa i historien, och rörelser som hans var fler än en. Att just denna rörelse överlevde sin ledares avrättning — och inom tre århundraden blev romarrikets religion — är en av historiens mest omdiskuterade frågor. Svaret börjar hos ',
      l('Paulus', 'person', 'paulus'),
      ', en man som aldrig mötte Jesus.',
    ],
  ],
  context: [
    [
      'Galileen var på Jesu tid en romersk lydstat, styrd av Herodes Antipas på kejsarens nåder. Skattetrycket var hårt, avståndet mellan stad och landsbygd växte, och grekiska städer låg en dagsmarsch från arameisktalande byar. Det var en värld där flera språk, ekonomier och gudar trängdes på samma marknad.',
    ],
    [
      'Inom judendomen levde flera riktningar sida vid sida: fariséer, sadducéer, esséer, seloter. Förväntan på en Messias — en smord befriare — tog olika former, från politisk resning till kosmiskt ingripande. Det är i denna väv av tro, politik och motstånd som Jesus ska förstås; ',
      l('Predikarens', 'topic', 'predikaren'),
      ' svalka och psalmernas glöd var hans modersmål.',
    ],
  ],
  sources: ['markus'],
  related: ['lidandet', 'predikaren', 'stoicism'],
  people: ['jesus', 'paulus'],
}
