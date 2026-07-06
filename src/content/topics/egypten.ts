import { l, type Topic } from '../model'

export const egypten: Topic = {
  id: 'egypten',
  title: 'Hur såg egyptierna på döden?',
  tradition: 'Egyptisk religion',
  min: 4,
  intro:
    'Ingen annan kultur har ägnat döden så mycket omsorg. För egyptierna var den inte ett slut utan en resa — med karta, lösenord och en våg.',
  essay: [
    [
      'I det gamla Egypten var döden en fortsättning som krävde förberedelse. Kroppen bevarades för att ',
      l('själen', 'topic', 'sjalen'),
      ' — som man tänkte sig i flera delar, bland dem ba och ka — skulle ha ett hem att återvända till. Gravarna fylldes med bröd, öl, verktyg och texter: allt en människa kunde behöva på andra sidan.',
    ],
    [
      'Den samling besvärjelser vi kallar ',
      l('Dödsboken', 'source', 'dodsboken'),
      ' var i praktiken en reseguide. Dess mest berömda scen är hjärtats vägning: den dödas hjärta läggs i ena vågskålen, sanningens fjäder i den andra. Maat, ordningens och rättens princip, avgör om livet varit i balans. Domen handlar inte om vad man trott utan om hur man levt.',
    ],
    [
      'Tanken att döden prövar livet återkommer långt senare: hos ',
      l('stoikerna', 'topic', 'stoicism'),
      ' som daglig övning, hos ',
      l('Predikaren', 'topic', 'predikaren'),
      ' som svalkande insikt, i kristendomens föreställning om räkenskap. Egyptierna var tidigast — och kanske ärligast — med att göra döden till livets måttstock.',
    ],
  ],
  context: [
    [
      'Livet i Egypten följde Nilens rytm: översvämning, sådd, skörd. Ur denna återkommande ordning växte begreppet maat — den kosmiska balans som farao, prästerna och varje enskild människa hade att upprätthålla mot kaos.',
    ],
    [
      'Föreställningarna om dödsriket demokratiserades med tiden. Det som i pyramidtexterna var faraos privilegium blev via kisttexterna till slut var människas möjlighet: Dödsbokens rullar kunde köpas färdigskrivna, med tom plats för den dödas namn.',
    ],
  ],
  sources: ['dodsboken'],
  related: ['stoicism', 'predikaren', 'sjalen'],
  people: [],
}
