// Dhammapada's 26 vaggas (chapters) with SuttaCentral's verse ranges. The file
// names in bilara-data follow `dhp{start}-{end}`. The names are Swedish with Pali in parentheses.
export type Vagga = { index: number; range: string; name: string }

export const DHAMMAPADA_VAGGAS: Vagga[] = [
  { index: 1, range: '1-20', name: 'Verserna i par (Yamaka)' },
  { index: 2, range: '21-32', name: 'Vaksamhet (Appamāda)' },
  { index: 3, range: '33-43', name: 'Sinnet (Citta)' },
  { index: 4, range: '44-59', name: 'Blommorna (Puppha)' },
  { index: 5, range: '60-75', name: 'Dåren (Bāla)' },
  { index: 6, range: '76-89', name: 'Den vise (Paṇḍita)' },
  { index: 7, range: '90-99', name: 'Den fulländade (Arahant)' },
  { index: 8, range: '100-115', name: 'Tusenden (Sahassa)' },
  { index: 9, range: '116-128', name: 'Ondska (Pāpa)' },
  { index: 10, range: '129-145', name: 'Våld (Daṇḍa)' },
  { index: 11, range: '146-156', name: 'Ålderdom (Jarā)' },
  { index: 12, range: '157-166', name: 'Jaget (Atta)' },
  { index: 13, range: '167-178', name: 'Världen (Loka)' },
  { index: 14, range: '179-196', name: 'Den vaknade (Buddha)' },
  { index: 15, range: '197-208', name: 'Lycka (Sukha)' },
  { index: 16, range: '209-220', name: 'Det kära (Piya)' },
  { index: 17, range: '221-234', name: 'Vrede (Kodha)' },
  { index: 18, range: '235-255', name: 'Orenhet (Mala)' },
  { index: 19, range: '256-272', name: 'Den rättfärdige (Dhammaṭṭha)' },
  { index: 20, range: '273-289', name: 'Vägen (Magga)' },
  { index: 21, range: '290-305', name: 'Blandade verser (Pakiṇṇaka)' },
  { index: 22, range: '306-319', name: 'Nedgången (Niraya)' },
  { index: 23, range: '320-333', name: 'Elefanten (Nāga)' },
  { index: 24, range: '334-359', name: 'Begäret (Taṇhā)' },
  { index: 25, range: '360-382', name: 'Munken (Bhikkhu)' },
  { index: 26, range: '383-423', name: 'Brahminen (Brāhmaṇa)' },
]
