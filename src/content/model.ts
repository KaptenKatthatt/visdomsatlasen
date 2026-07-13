export type ReadMode = 'essa' | 'kontext'

export type ScreenId = 'tidslinje' | 'personer' | 'sok' | 'utforska'

export type To =
  | { kind: 'topic'; id: string }
  | { kind: 'person'; id: string }
  | { kind: 'source'; id: string }
  | { kind: 'las'; id: string; mode: ReadMode }
  | { kind: 'kapitel'; workId: string; bookSlug: string; chapter: number }
  | { kind: 'screen'; id: ScreenId }
  // Omgörningens redaktionella mål (fas 6): läsrummet och bibliotekets sidor.
  | { kind: 'rum'; slug: string }
  | { kind: 'tema'; slug: string }
  | { kind: 'kallpost'; slug: string }
  | { kind: 'fraga'; slug: string }
  // Vandringar (fas 7).
  | { kind: 'vandring'; slug: string }

export type LinkSegment = { t: string; to: To }
export type Segment = string | LinkSegment
export type Paragraph = Segment[]

export type Topic = {
  id: string
  title: string
  tradition: string
  min: number
  intro: string
  essay: Paragraph[]
  context: Paragraph[]
  sources: string[]
  related: string[]
  people: string[]
}

export type Source = {
  id: string
  title: string
  author: string
  origin: string
  originShort: string
  lang: string
  trans: string
  note: string
  text: string[]
}

export type Person = {
  id: string
  name: string
  years: string
  epithet: string
  bio: string
  topics: string[]
}

export type Tradition = {
  name: string
  line: string
  topics: string[]
}

export type TimelineEvent = {
  year: string
  label: string
  to: To
}

export type MapNode = {
  id: string
  label: string
  x: number
  y: number
  to: To
}

/** Inline link inside an essay paragraph. */
export const l = (t: string, kind: 'topic' | 'person' | 'source', id: string): LinkSegment => ({
  t,
  to: { kind, id },
})
