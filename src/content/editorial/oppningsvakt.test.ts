import { describe, expect, it } from 'vitest'
import { ärTeaseröppning } from './oppningsvakt'

// De sex teaser-rader som redaktören lät ta bort 2026-07-16 — regressionsskydd.
// Var och en avslutade en opening och lockade vidare utan att berätta vad.
const BORTTAGNA_TEASERS = [
  'En vardaglig upptakt om motstånd.\n\nZhuangzi, den lekfullaste av de gamla kinesiska böckerna, berättar om en kock.',
  'En vardaglig upptakt om nytta.\n\nZhuangzi, den lekfullaste av de gamla kinesiska böckerna, berättar om ett träd.',
  'Något är grumligt och instinkten är att röra om.\n\nDaodejing har en bild för det.',
  'Vi håller fast vid det goda och det svåra.\n\nEn av buddhismens äldsta verser vänder blicken mot själva fasthållandet.',
  'Vi strävar mot att bli färdiga.\n\nEn gammal japansk sång vänder på den förutsättningen.',
  'Rädslan talar med stor säkerhet.\n\nFör över två tusen år sedan stod en gammal man inför en domstol i Aten, anklagad till döden, och vägrade spela med i den säkerheten.',
]

// Öppningar som ska passera: de landar i vardagen eller i en öppen fråga och
// introducerar aldrig källan (Kärnan gör det).
const GODA_ÖPPNINGAR = [
  'Vi tvivlar sällan på att vi är vakna. Golvet bär, kaffet är varmt, dagen är på riktigt. Det mesta vi lever efter tar vi för givet och vänder aldrig på, och för det mesta är det bra så.',
  'Rädslan talar med stor säkerhet. Den säger inte »kanske«, den säger »så här kommer det att gå«. Mycket av det vi drar oss för gör vi inte för att vi vet hur det slutar, utan för att rädslan låter så säker på sin sak.',
  'Önskan pekar nästan alltid åt samma håll: att verkligheten ska rätta sig efter oss. Vad händer om man vänder på den?',
  'Något behöver avgöras, och det är svårt att veta var gränsen går. Var går den gränsen?',
]

describe('ärTeaseröppning', () => {
  it('flaggar varje borttagen teaser-rad', () => {
    for (const opening of BORTTAGNA_TEASERS) {
      expect(ärTeaseröppning(opening), opening).toBe(true)
    }
  })

  it('släpper igenom öppningar som landar i vardagen eller en öppen fråga', () => {
    for (const opening of GODA_ÖPPNINGAR) {
      expect(ärTeaseröppning(opening), opening).toBe(false)
    }
  })

  it('behandlar en tom opening som ofarlig', () => {
    expect(ärTeaseröppning('')).toBe(false)
    expect(ärTeaseröppning('   \n\n  ')).toBe(false)
  })

  it('låter en öppen fråga passera även med annars presenterande ord', () => {
    expect(ärTeaseröppning('En vardaglig upptakt.\n\nVad vänder du på när något skaver?')).toBe(
      false,
    )
  })
})
