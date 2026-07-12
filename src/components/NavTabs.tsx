import { Link, useRouterState } from '@tanstack/react-router'
import styles from './NavTabs.module.css'

const tabs = [
  { to: '/', label: 'Läsrummet' },
  { to: '/bibliotek', label: 'Biblioteket' },
  { to: '/samling', label: 'Sparat' },
  { to: '/installningar', label: 'Inställningar' },
] as const

const activeTab = (pathname: string): string => {
  const match = tabs.find((tab) => tab.to !== '/' && pathname.startsWith(tab.to))
  return match ? match.to : '/'
}

export const NavTabs = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const current = activeTab(pathname)
  return (
    <nav className={styles.nav} aria-label="Navigering">
      {tabs.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          className={current === tab.to ? `${styles.tab} ${styles.active}` : styles.tab}
        >
          <span className={styles.dot} />
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
