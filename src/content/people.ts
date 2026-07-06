import type { Person } from './model'

/** Order used in the people index. */
export const allPeople: Person[] = [
  {
    id: 'jesus',
    name: 'Jesus från Nasaret',
    years: 'ca 4 f.Kr–ca 30 e.Kr',
    epithet: 'Predikant från Galileen',
    bio: 'Judisk predikant och undervisare från Nasaret i Galileen. Döptes av Johannes Döparen, samlade lärjungar och förkunnade Guds rike i liknelser, innan han avrättades genom korsfästelse under Pontius Pilatus. Källorna om honom är få men tidiga — och ingen enskild människa har satt djupare avtryck i västerlandets historia.',
    topics: ['historiska-jesus', 'predikaren'],
  },
  {
    id: 'paulus',
    name: 'Paulus',
    years: 'ca 5–ca 64 e.Kr',
    epithet: 'Apostel och brevskrivare',
    bio: 'Farisé från Tarsos som förföljde den unga Jesusrörelsen — tills en omvälvande erfarenhet på vägen till Damaskus gjorde honom till dess främste missionär. Hans brev är Nya testamentets äldsta texter, skrivna före evangelierna, och de formade kristendomen till en tro även för icke-judar.',
    topics: ['historiska-jesus'],
  },
  {
    id: 'epiktetos',
    name: 'Epiktetos',
    years: 'ca 50–ca 135 e.Kr',
    epithet: 'Stoisk lärare, född slav',
    bio: 'Föddes som slav i Hierapolis och blev en av antikens mest inflytelserika lärare. Skrev ingenting själv — hans undervisning bevarades av lärjungen Arrianos. Kärnan: skilj mellan det som beror på dig och det som inte gör det, och lägg all din omsorg vid det första.',
    topics: ['stoicism', 'lidandet'],
  },
  {
    id: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    years: '121–180 e.Kr',
    epithet: 'Kejsare och stoiker',
    bio: 'Romersk kejsare 161–180 och stoisk filosof. Tillbringade sina sista år i fältläger vid Donau, där han om kvällarna skrev förmaningar till sig själv — aldrig avsedda för andras ögon. De blev en av världslitteraturens mest lästa böcker.',
    topics: ['stoicism'],
  },
  {
    id: 'platon',
    name: 'Platon',
    years: '427–347 f.Kr',
    epithet: 'Atensk filosof',
    bio: 'Sokrates lärjunge och Aristoteles lärare. Grundade Akademin och skrev dialoger där frågorna ofta väger tyngre än svaren. Hans lära om själen och idévärlden präglade både antik filosofi och kristen teologi.',
    topics: ['sjalen'],
  },
  {
    id: 'siddharta',
    name: 'Siddharta Gautama',
    years: 'ca 480–ca 400 f.Kr',
    epithet: 'Buddha — den uppvaknade',
    bio: 'Prins från Shakya-klanen som enligt traditionen lämnade palatset, mötte ålderdom, sjukdom och död — och sökte i sju år innan han under bodhiträdet nådde uppvaknandet. Undervisade sedan i fyrtiofem år om lidandets orsak och vägen till frihet.',
    topics: ['lidandet', 'sjalen'],
  },
]

export const findPerson = (id: string): Person | undefined =>
  allPeople.find((person) => person.id === id)
