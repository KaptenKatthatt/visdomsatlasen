import { allPeople } from '../content/people'
import { allSources } from '../content/sources'
import { allTopics } from '../content/topics'
import type { To } from '../content/model'

export type SearchHit = {
  key: string
  title: string
  sub: string
  to: To
}

/** Simple substring search over topics, people and sources. */
export const searchAtlas = (query: string): SearchHit[] => {
  const q = query.trim().toLowerCase()
  if (q.length === 0) return []
  const hits: SearchHit[] = []
  for (const topic of allTopics) {
    if (`${topic.title} ${topic.tradition} ${topic.intro}`.toLowerCase().includes(q)) {
      hits.push({
        key: `topic-${topic.id}`,
        title: topic.title,
        sub: `Ämne · ${topic.tradition}`,
        to: { kind: 'topic', id: topic.id },
      })
    }
  }
  for (const person of allPeople) {
    if (`${person.name} ${person.epithet}`.toLowerCase().includes(q)) {
      hits.push({
        key: `person-${person.id}`,
        title: person.name,
        sub: `Person · ${person.years}`,
        to: { kind: 'person', id: person.id },
      })
    }
  }
  for (const source of allSources) {
    if (`${source.title} ${source.author} ${source.note}`.toLowerCase().includes(q)) {
      hits.push({
        key: `source-${source.id}`,
        title: source.title,
        sub: `Originaltext · ${source.originShort}`,
        to: { kind: 'source', id: source.id },
      })
    }
  }
  return hits
}
