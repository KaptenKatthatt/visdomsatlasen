import type { Topic } from '../model'
import { egypten } from './egypten'
import { historiskaJesus } from './historiskaJesus'
import { lidandet } from './lidandet'
import { predikaren } from './predikaren'
import { sjalen } from './sjalen'
import { stoicism } from './stoicism'

/** Order used on the home screen. */
export const allTopics: Topic[] = [
  historiskaJesus,
  stoicism,
  egypten,
  sjalen,
  predikaren,
  lidandet,
]

export const findTopic = (id: string): Topic | undefined =>
  allTopics.find((topic) => topic.id === id)

export const topicsUsingSource = (sourceId: string): Topic[] =>
  allTopics.filter((topic) => topic.sources.includes(sourceId))
