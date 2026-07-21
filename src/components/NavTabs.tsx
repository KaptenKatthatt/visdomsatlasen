import { Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { BottomSheet } from './BottomSheet'
import { MenuIcon } from './Icons'
import styles from './NavTabs.module.css'

// The visible tabs. `match` is the prefix that marks the tab active — it defaults
// to `to`, but Vandringar links to the list yet stays lit for a single path too
// (`/bibliotek/vandring/$slug`), so its match is the shorter shared prefix.
const tabs = [
  { to: '/', label: 'Läsrummet' },
  { to: '/bibliotek', label: 'Biblioteket' },
  { to: '/bibliotek/vandringar', label: 'Vandringar', match: '/bibliotek/vandring' },
] as const

// Gathered behind the »Mer« menu — reached, not owned by a tab.
const menuItems = [
  { to: '/samling', label: 'Sparat' },
  { to: '/installningar', label: 'Inställningar' },
] as const

const matchOf = (tab: { to: string; match?: string }): string => tab.match ?? tab.to

// Longest matching prefix wins, so `/bibliotek/vandringar` picks Vandringar over
// Biblioteket. `'/'` matches only the exact root. Null when no target owns the
// page (e.g. old atlas screens via a direct URL) — better no marker than a wrong one.
const activeTarget = (pathname: string): string | null => {
  if (pathname === '/') return '/'
  const targets = [...tabs.map(matchOf), ...menuItems.map((item) => item.to)]
  return (
    targets
      .filter((target) => target !== '/' && pathname.startsWith(target))
      .sort((a, b) => b.length - a.length)[0] ?? null
  )
}

export const NavTabs = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const [menuOpen, setMenuOpen] = useState(false)
  const current = activeTarget(pathname)
  const menuActive = menuItems.some((item) => item.to === current)
  return (
    <>
      <nav className={styles.nav} aria-label="Navigering">
        {tabs.map((tab) => {
          const active = current === matchOf(tab)
          return (
            <Link
              key={tab.to}
              to={tab.to}
              // Exact matching keeps TanStack from force-marking a prefix parent
              // (Biblioteket) active on a nested route (the vandringar list); the
              // active state below is our own longest-prefix decision instead.
              activeOptions={{ exact: true }}
              aria-current={active ? 'page' : undefined}
              className={active ? `${styles.tab} ${styles.active}` : styles.tab}
            >
              <span>{tab.label}</span>
            </Link>
          )
        })}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Mer"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          className={menuActive ? `${styles.tab} ${styles.active}` : styles.tab}
        >
          <MenuIcon />
        </button>
      </nav>
      {menuOpen && (
        <BottomSheet label="Meny" showDone={false} onClose={() => setMenuOpen(false)}>
          <div className={styles.menuList}>
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={current === item.to ? 'page' : undefined}
                className={styles.menuLink}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </BottomSheet>
      )}
    </>
  )
}
