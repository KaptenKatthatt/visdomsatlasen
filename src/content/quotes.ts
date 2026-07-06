import type { Quote } from './model'

const quotes: Quote[] = [
  {
    t: 'Det är inte tingen som oroar oss, utan våra föreställningar om tingen.',
    by: 'Epiktetos',
    to: { kind: 'person', id: 'epiktetos' },
  },
  {
    t: 'Släkte går, och släkte kommer, och jorden står evinnerligen kvar.',
    by: 'Predikaren 1:4',
    to: { kind: 'source', id: 'predikaren' },
  },
  {
    t: 'Tiden är fullbordad, och Guds rike är nära.',
    by: 'Markusevangeliet 1:15',
    to: { kind: 'source', id: 'markus' },
  },
  {
    t: 'Allt vad vi är är följden av vad vi har tänkt.',
    by: 'Dhammapada',
    to: { kind: 'source', id: 'dhammapada' },
  },
]

/** Same quote all day, next quote tomorrow. */
export const quoteOfTheDay = (date: Date): Quote => {
  const fallback: Quote = { t: '', by: '', to: { kind: 'screen', id: 'utforska' } }
  return quotes[Math.floor(date.getTime() / 86_400_000) % quotes.length] ?? fallback
}
