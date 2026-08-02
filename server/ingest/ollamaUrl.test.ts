import { describe, expect, it } from 'vitest'
import { resolveOllamaUrl } from './ollamaUrl'

describe('resolveOllamaUrl', () => {
  it('använder OLLAMA_URL när den är satt', () => {
    expect(
      resolveOllamaUrl({
        envUrl: 'http://example.test/api/generate',
        inDocker: true,
      }),
    ).toBe('http://example.test/api/generate')
  })

  it('pekar på host.docker.internal inne i Docker utan OLLAMA_URL', () => {
    expect(resolveOllamaUrl({ envUrl: undefined, inDocker: true })).toBe(
      'http://host.docker.internal:11434/api/generate',
    )
  })

  it('pekar på localhost utanför Docker utan OLLAMA_URL', () => {
    expect(resolveOllamaUrl({ envUrl: undefined, inDocker: false })).toBe(
      'http://127.0.0.1:11434/api/generate',
    )
  })
})
