import { Link } from '@tanstack/react-router'
import { useSidtitel } from '../lib/useSidtitel'

/** Calm 404 for missing topics, sources, people or routes. */
export const NotFoundNote = ({ subject = 'Sidan' }: { subject?: string }) => {
  useSidtitel(`${subject} kunde inte hittas`)
  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1
        style={{
          fontSize: '2.0625rem',
          fontWeight: 500,
          lineHeight: 1.16,
          margin: '56px 0 0',
          letterSpacing: '-0.01em',
        }}
      >
        {subject} kunde inte hittas
      </h1>
      <p
        style={{
          fontSize: '1.0625rem',
          color: 'var(--soft-strong)',
          fontStyle: 'italic',
          margin: '8px 0 0',
          lineHeight: 1.5,
        }}
      >
        Kanske har den flyttats, kanske har den aldrig funnits. Atlasen är öppen åt alla håll.
      </p>
      <p style={{ marginTop: 28, fontSize: '1.1875rem' }}>
        <Link to="/" style={{ color: 'var(--accent)' }}>
          Tillbaka hem
        </Link>
      </p>
    </div>
  )
}
