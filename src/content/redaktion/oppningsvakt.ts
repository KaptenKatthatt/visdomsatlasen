// Öppningsvakt: öppningen ska landa i läsarens vardag (eller en öppen fråga) och
// aldrig introducera källan — det gör Kärnan (docs/checklists/review-language.md,
// "Öppningen får inte teasa"). Den här vakten fångar teaser-öppningar:
// nyfikenhetsluckor som lockar vidare utan att berätta vad ("Zhuangzi berättar om
// en kock.", "Daodejing har en bild för det."). Det är en heuristik, inte ett
// orakel — den fångar de mönster vi sett återkomma och växer med nya. Den läser
// bara öppningens SISTA stycke, för det är där bryggan till källan brukar smyga
// sig in.

// Källan presenteras som något på väg ("berättar/skildrar/har en bild för …").
// Ordgränserna använder \p{L} (u-flaggan) — JS \b räknar å/ä/ö som icke-ord och
// skulle missa t.ex. "vänder på" och "återger".
const PRESENTERANDE =
  /(?<!\p{L})(?:berättar|skildrar|återger|förtäljer|tar upp)(?!\p{L})|har en bild för|vänder (?:blicken|på)(?!\p{L})/iu

// Sagoaktig temporal upptakt som dinglar en berättelse ("För över tusen år sedan …").
const TEMPORAL_UPPTAKT =
  /^(för (över |nästan |drygt )?[\wåäö-]+ (tusen|hundra|år)[^.?!]*sedan|en gång i tiden|för länge sedan)\b/i

// En öppen fråga bjuder in i stället för att locka; den är alltid tillåten,
// även om den råkar innehålla ett annars presenterande ord.
const ÄR_FRÅGA = /\?[»«"'”’)\]]*$/

const sistaStycket = (öppning: string): string => {
  const stycken = öppning
    .trim()
    .split(/\n\s*\n/)
    .map((stycke) => stycke.trim())
    .filter((stycke) => stycke.length > 0)
  return stycken[stycken.length - 1] ?? ''
}

/** Sant om öppningens sista stycke teasar/introducerar källan i stället för att
 * landa i det vardagliga. Tom eller frågeavslutad öppning är aldrig en teaser. */
export const ärTeaseröppning = (öppning: string): boolean => {
  const sista = sistaStycket(öppning)
  if (sista.length === 0) return false
  if (ÄR_FRÅGA.test(sista)) return false
  return PRESENTERANDE.test(sista) || TEMPORAL_UPPTAKT.test(sista)
}
