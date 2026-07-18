// Opening guard: the opening should land in the reader's everyday life (or an open
// question) and never introduce the source — that is the Core's job
// (docs/checklists/review-language.md, "Öppningen får inte teasa"). This guard
// catches teaser openings: curiosity gaps that lure the reader on without saying
// what ("Zhuangzi berättar om en kock.", "Daodejing har en bild för det."). It is a
// heuristic, not an oracle — it catches the patterns we have seen recur and grows
// with new ones. It reads only the opening's LAST paragraph, because that is where
// the bridge to the source tends to sneak in.

// The source is presented as something underway ("berättar/skildrar/har en bild för …").
// The word boundaries use \p{L} (the u flag) — JS \b treats å/ä/ö as non-word chars
// and would miss e.g. "vänder på" and "återger".
const PRESENTERANDE =
  /(?<!\p{L})(?:berättar|skildrar|återger|förtäljer|tar upp)(?!\p{L})|har en bild för|vänder (?:blicken|på)(?!\p{L})/iu

// Fairytale-like temporal lead-in that dangles a story ("För över tusen år sedan …").
const TEMPORAL_UPPTAKT =
  /^(för (över |nästan |drygt )?[\wåäö-]+ (tusen|hundra|år)[^.?!]*sedan|en gång i tiden|för länge sedan)\b/i

// An open question invites rather than lures; it is always allowed, even if it
// happens to contain an otherwise presenting word.
const IS_QUESTION = /\?[»«"'”’)\]]*$/

const sistaStycket = (opening: string): string => {
  const paragraphs = opening
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
  return paragraphs[paragraphs.length - 1] ?? ''
}

/** True if the opening's last paragraph teases/introduces the source instead of
 * landing in the everyday. An empty or question-ended opening is never a teaser. */
export const isTeaserOpening = (opening: string): boolean => {
  const sista = sistaStycket(opening)
  if (sista.length === 0) return false
  if (IS_QUESTION.test(sista)) return false
  return PRESENTERANDE.test(sista) || TEMPORAL_UPPTAKT.test(sista)
}
