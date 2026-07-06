import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { BackIcon } from '../components/Icons'
import { RowLink } from '../components/RowLink'
import { searchAtlas } from '../lib/search'
import styles from './SokPage.module.css'

export const SokPage = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const results = searchAtlas(query)
  const idle = query.trim().length === 0

  return (
    <div className="screenReader">
      <div className={styles.bar}>
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Tillbaka"
          className="iconBtn"
          style={{ padding: '6px 6px 6px 0' }}
        >
          <BackIcon />
        </button>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoFocus
          placeholder="Sök ämnen, personer, texter…"
          aria-label="Sök i atlasen"
          className={styles.input}
        />
      </div>
      {idle && (
        <p className={styles.hint}>
          Atlasen är liten men växer. Pröva »själen«, »döden«, »Jesus« eller »mening».
        </p>
      )}
      {!idle && results.length === 0 && (
        <p className={styles.hint}>Ingenting i atlasen svarar mot »{query}« ännu.</p>
      )}
      <div className={styles.results}>
        {results.map((hit) => (
          <RowLink key={hit.key} to={hit.to} title={hit.title} sub={hit.sub} chevron />
        ))}
      </div>
    </div>
  )
}
