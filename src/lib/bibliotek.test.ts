import { describe, expect, it } from 'vitest'
import type { Rum, Tema } from '../content/redaktion/schema'
import { bibliotekRum, bibliotekTeman } from './bibliotek'

// Fabricerade poster: bara fälten biblioteket läser behöver vara meningsfulla.
const rum = (titel: string, status: Rum['status'] = 'publicerad'): Rum => ({
  id: `rum-${titel}`,
  slug: titel,
  titel,
  sammanfattning: 'x',
  primärFråga: 'fraga-x',
  teman: ['tema-x'],
  tankeAttBära: 'x',
  reflektionsfrågor: ['x?'],
  källor: [{ källa: 'kalla-x', bruk: 'bearbetning', primär: true }],
  lästidMinuter: 4,
  språk: 'sv',
  status,
  skapad: '2026-07-12',
  uppdaterad: '2026-07-12',
  öppning: 'x',
  kärna: 'x',
})

const tema = (
  etikett: string,
  extra: Partial<Pick<Tema, 'status' | 'ordning'>> = {},
): Tema => ({
  id: `tema-${etikett}`,
  slug: etikett,
  etikett,
  status: 'publicerad',
  ...extra,
})

describe('bibliotekTeman', () => {
  it('släpper bara igenom publicerade teman — utkast hör inte hemma i biblioteket', () => {
    const teman = [
      tema('lugn'),
      tema('mod', { status: 'utkast' }),
      tema('sanning', { status: 'granskning' }),
      tema('mening', { status: 'arkiverad' }),
    ]
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual(['lugn'])
  })

  it('följer redaktionell ordning och därefter svensk etikettordning', () => {
    const teman = [
      tema('österlandet'),
      tema('ande'),
      tema('mening', { ordning: 2 }),
      tema('lugn', { ordning: 1 }),
    ]
    // Ordnade teman först; oordnade sist i svensk ordning (ö efter a).
    expect(bibliotekTeman(teman).map((t) => t.etikett)).toEqual([
      'lugn',
      'mening',
      'ande',
      'österlandet',
    ])
  })
})

describe('bibliotekRum', () => {
  it('släpper bara igenom publicerade rum, i svensk titelordning', () => {
    const alla = [
      rum('över tröskeln'),
      rum('att vänta'),
      rum('utkastet', 'utkast'),
      rum('granskningen', 'granskning'),
      rum('arkivet', 'arkiverad'),
    ]
    expect(bibliotekRum(alla).map((r) => r.titel)).toEqual(['att vänta', 'över tröskeln'])
  })
})
