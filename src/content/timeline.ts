import type { TimelineEvent } from './model'

export const timeline: TimelineEvent[] = [
  { year: 'ca 1550 f.Kr', label: 'Dödsboken börjar sammanställas i Egypten', to: { kind: 'source', id: 'dodsboken' } },
  { year: 'ca 480 f.Kr', label: 'Siddharta Gautama föds i Lumbini', to: { kind: 'person', id: 'siddharta' } },
  { year: '427 f.Kr', label: 'Platon föds i Aten', to: { kind: 'person', id: 'platon' } },
  { year: 'ca 380 f.Kr', label: 'Faidon skrivs — själens odödlighet prövas', to: { kind: 'source', id: 'faidon' } },
  { year: 'ca 300 f.Kr', label: 'Zenon börjar undervisa i Atens målade pelarhall', to: { kind: 'topic', id: 'stoicism' } },
  { year: 'ca 250 f.Kr', label: 'Predikaren nedtecknas', to: { kind: 'source', id: 'predikaren' } },
  { year: 'ca 4 f.Kr', label: 'Jesus föds i Galileen', to: { kind: 'person', id: 'jesus' } },
  { year: 'ca 30 e.Kr', label: 'Jesus avrättas i Jerusalem', to: { kind: 'topic', id: 'historiska-jesus' } },
  { year: 'ca 50 e.Kr', label: 'Paulus skriver sina brev', to: { kind: 'person', id: 'paulus' } },
  { year: 'ca 70 e.Kr', label: 'Markusevangeliet skrivs', to: { kind: 'source', id: 'markus' } },
  { year: 'ca 125 e.Kr', label: 'Epiktetos samtal nedtecknas av Arrianos', to: { kind: 'person', id: 'epiktetos' } },
  { year: 'ca 170 e.Kr', label: 'Marcus Aurelius skriver Självbetraktelser', to: { kind: 'source', id: 'aurelius' } },
]
