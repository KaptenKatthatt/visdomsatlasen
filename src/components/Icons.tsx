type IconProps = { size?: number }

export const BackIcon = ({ size = 20 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 5 7.5 12l7 7" />
  </svg>
)

export const SearchIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
    <circle cx="11" cy="11" r="6.5" />
    <line x1="15.8" y1="15.8" x2="20.5" y2="20.5" />
  </svg>
)

export const MoonIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 3.8 a8.2 8.2 0 0 1 0 16.4 z" fill="currentColor" stroke="none" />
  </svg>
)

export const BookmarkIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <path d="M7 3.5h10v17l-5-3.6-5 3.6z" />
  </svg>
)

/** "Aa" — reading settings (font, size, background, theme). */
export const TypeIcon = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 19 8.5 4.5 14.5 19" />
    <path d="M4.6 14h7.8" />
    <path d="M21.5 19v-6.8a3.2 3.2 0 0 0-5.8-1.4" />
    <path d="M21.5 15.6a3.4 3.4 0 1 1-3.4-3.4 3.4 3.4 0 0 1 3.4 3.4z" />
  </svg>
)

export const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 19.5l.9-3.6L16.6 4.7a1.7 1.7 0 0 1 2.4 2.4L7.8 18.3l-3.3 1.2z" />
  </svg>
)
