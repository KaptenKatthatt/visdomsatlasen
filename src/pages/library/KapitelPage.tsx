import { Link, useNavigate } from '@tanstack/react-router'
import { BookmarkButton } from '../../components/BookmarkButton'
import { ReadingSettingsButton } from '../../components/ReadingSettingsButton'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { useSidtitel } from '../../lib/useSidtitel'
import { bookId, fetchChapter } from '../../lib/api'
import { chapterKey } from '../../lib/personligt'
import { useAtlas } from '../../lib/store'
import { StateNote } from './StateNote'
import styles from './KapitelPage.module.css'

type Props = { workId: string; bookSlug: string; chapter: string }

/** Bokmärke + "Aa" i kapitelläsarens topbar. Kräver boknamnet för att kunna
 * spara ett bokmärke som Samling kan visa, så den lever i den laddade grenen. */
const KapitelActions = ({
  workId,
  bookSlug,
  chapter,
  bookName,
}: {
  workId: string
  bookSlug: string
  chapter: number
  bookName: string
}) => {
  const { chapterBookmarks, toggleChapterBookmark } = useAtlas()
  const marked = !!chapterBookmarks[chapterKey(workId, bookSlug, chapter)]
  return (
    <div className={styles.actions}>
      <BookmarkButton
        marked={marked}
        onToggle={() =>
          toggleChapterBookmark({ workId, bookSlug, chapter, bookName, savedAt: Date.now() })
        }
      />
      <ReadingSettingsButton />
    </div>
  )
}

const NavLink = ({
  workId,
  bookSlug,
  target,
  label,
}: {
  workId: string
  bookSlug: string
  target: number | null
  label: string
}) => {
  if (target === null) return <span />
  return (
    <Link
      to="/kapitel/$workId/$bookSlug/$chapter"
      params={{ workId, bookSlug, chapter: String(target) }}
      className={styles.navLink}
    >
      {label}
    </Link>
  )
}

export const KapitelPage = ({ workId, bookSlug, chapter }: Props) => {
  const n = Number(chapter)
  const id = bookId(workId, bookSlug)
  const navigate = useNavigate()
  const goUp = () =>
    navigate({ to: '/bibliotek/verk/$workId/$bookSlug', params: { workId, bookSlug } })
  const { data, loading, error } = useAsync(() => fetchChapter(id, n), [id, n])
  useSidtitel(data ? `${data.book.name} ${data.chapter}` : '')
  if (!data) {
    return (
      <div className="screenReader">
        <TopBar right={<ReadingSettingsButton />} onBack={goUp} />
        <StateNote loading={loading} error={error} />
      </div>
    )
  }
  return (
    <div className="screenReader">
      <TopBar
        right={
          <KapitelActions
            workId={workId}
            bookSlug={bookSlug}
            chapter={n}
            bookName={data.book.name}
          />
        }
        onBack={goUp}
      />
      <header className={styles.head}>
        <div className="kicker">{data.book.name}</div>
        <h1 className={styles.chapterTitle}>Kapitel {data.chapter}</h1>
      </header>
      <div className={styles.verses}>
        {data.verses.map((verse) => (
          <p key={verse.id} className={styles.verse}>
            <span className={styles.num}>{verse.verse}</span>
            {verse.text}
          </p>
        ))}
      </div>
      <div className={styles.nav}>
        <NavLink workId={workId} bookSlug={bookSlug} target={data.prev} label="‹ Föregående" />
        <NavLink workId={workId} bookSlug={bookSlug} target={data.next} label="Nästa ›" />
      </div>
    </div>
  )
}
