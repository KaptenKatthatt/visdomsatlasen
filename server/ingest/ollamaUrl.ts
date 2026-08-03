import { existsSync } from 'node:fs'

const HOST_OLLAMA = 'http://127.0.0.1:11434/api/generate'
const DOCKER_OLLAMA = 'http://host.docker.internal:11434/api/generate'

/** Where Ollama lives: env override, else host gateway in Docker, else localhost. */
export const resolveOllamaUrl = (opts: {
  envUrl: string | undefined
  inDocker: boolean
}): string => {
  if (opts.envUrl) return opts.envUrl
  return opts.inDocker ? DOCKER_OLLAMA : HOST_OLLAMA
}

/** Runtime default for ingest inside/outside the container. */
export const defaultOllamaUrl = (): string =>
  resolveOllamaUrl({
    envUrl: process.env['OLLAMA_URL'],
    inDocker: existsSync('/.dockerenv'),
  })
