import { describe, expect, it } from 'vitest'
import { isTeaserOpening } from './openingGuard'

// The six teaser lines the editor had removed on 2026-07-16 — regression guard.
// Each one closed an opening and lured the reader on without saying what.
const BORTTAGNA_TEASERS = [
  'En vardaglig upptakt om motstånd.\n\nZhuangzi, den lekfullaste av de gamla kinesiska böckerna, berättar om en kock.',
  'En vardaglig upptakt om nytta.\n\nZhuangzi, den lekfullaste av de gamla kinesiska böckerna, berättar om ett träd.',
  'Något är grumligt och instinkten är att röra om.\n\nDaodejing har en bild för det.',
  'Vi håller fast vid det goda och det svåra.\n\nEn av buddhismens äldsta verser vänder blicken mot själva fasthållandet.',
  'Vi strävar mot att bli färdiga.\n\nEn gammal japansk sång vänder på den förutsättningen.',
  'Rädslan talar med stor säkerhet.\n\nFör över två tusen år sedan stod en gammal man inför en domstol i Aten, anklagad till döden, och vägrade spela med i den säkerheten.',
]

// Openings that should pass: they land in everyday life or in an open question and
// never introduce the source (the Core does that).
const GOOD_OPENINGS = [
  'Vi tvivlar sällan på att vi är vakna. Golvet bär, kaffet är varmt, dagen är på riktigt. Det mesta vi lever efter tar vi för givet och vänder aldrig på, och för det mesta är det bra så.',
  'Rädslan talar med stor säkerhet. Den säger inte »kanske«, den säger »så här kommer det att gå«. Mycket av det vi drar oss för gör vi inte för att vi vet hur det slutar, utan för att rädslan låter så säker på sin sak.',
  'Önskan pekar nästan alltid åt samma håll: att verkligheten ska rätta sig efter oss. Vad händer om man vänder på den?',
  'Något behöver avgöras, och det är svårt att veta var gränsen går. Var går den gränsen?',
]

describe('ärTeaseröppning', () => {
  it('flaggar varje borttagen teaser-rad', () => {
    for (const opening of BORTTAGNA_TEASERS) {
      expect(isTeaserOpening(opening), opening).toBe(true)
    }
  })

  it('släpper igenom öppningar som landar i vardagen eller en öppen fråga', () => {
    for (const opening of GOOD_OPENINGS) {
      expect(isTeaserOpening(opening), opening).toBe(false)
    }
  })

  it('behandlar en tom öppning som ofarlig', () => {
    expect(isTeaserOpening('')).toBe(false)
    expect(isTeaserOpening('   \n\n  ')).toBe(false)
  })

  it('låter en öppen fråga passera även med annars presenterande ord', () => {
    expect(isTeaserOpening('En vardaglig upptakt.\n\nVad vänder du på när något skaver?')).toBe(
      false,
    )
  })
})
