import type { MapNode } from './model'

export const mapNodes: MapNode[] = [
  { id: 'jesus', label: 'Jesus', x: 30, y: 5, to: { kind: 'person', id: 'jesus' } },
  { id: 'rom', label: 'Romarriket', x: 71, y: 10, to: { kind: 'screen', id: 'tidslinje' } },
  { id: 'stoicism', label: 'Stoicism', x: 74, y: 25, to: { kind: 'topic', id: 'stoicism' } },
  { id: 'marcus', label: 'Marcus Aurelius', x: 33, y: 29, to: { kind: 'person', id: 'marcus-aurelius' } },
  { id: 'dygd', label: 'Dygd', x: 64, y: 40, to: { kind: 'topic', id: 'stoicism' } },
  { id: 'epiktetos', label: 'Epiktetos', x: 23, y: 45, to: { kind: 'person', id: 'epiktetos' } },
  { id: 'buddhism', label: 'Buddhism', x: 70, y: 56, to: { kind: 'topic', id: 'lidandet' } },
  { id: 'lidandet', label: 'Lidandet', x: 34, y: 61, to: { kind: 'topic', id: 'lidandet' } },
  { id: 'sjalen', label: 'Själen', x: 19, y: 76, to: { kind: 'topic', id: 'sjalen' } },
  { id: 'egypten', label: 'Egypten', x: 67, y: 72, to: { kind: 'topic', id: 'egypten' } },
  { id: 'doden', label: 'Döden', x: 38, y: 86, to: { kind: 'topic', id: 'egypten' } },
  { id: 'mening', label: 'Mening', x: 64, y: 95, to: { kind: 'topic', id: 'predikaren' } },
]

export const mapEdges: [string, string][] = [
  ['jesus', 'rom'],
  ['rom', 'stoicism'],
  ['stoicism', 'marcus'],
  ['marcus', 'dygd'],
  ['dygd', 'epiktetos'],
  ['epiktetos', 'stoicism'],
  ['epiktetos', 'buddhism'],
  ['buddhism', 'lidandet'],
  ['lidandet', 'egypten'],
  ['egypten', 'doden'],
  ['doden', 'mening'],
  ['sjalen', 'lidandet'],
  ['sjalen', 'doden'],
  ['jesus', 'lidandet'],
]
