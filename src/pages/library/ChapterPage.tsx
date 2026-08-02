import { useRef } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { BookmarkButton } from '../../components/BookmarkButton'
import { ReadingSettingsButton } from '../../components/ReadingSettingsButton'
import { TopBar } from '../../components/TopBar'
import { useAsync } from '../../lib/useAsync'
import { useChapterSwipe } from '../../lib/useChapterSwipe'
import { useDocumentTitle } from '../../lib/useDocumentTitle'
import { bookId, fetchChapter } from '../../lib/api'
import { chapterKey } from '../../lib/personal'
import { emphasisParts } from '../../lib/verseText'
import { useAtlas } from '../../lib/store'
import { StateNote } from './StateNote'
import styles from './ChapterPage.module.css'

type Props = { workId: string; bookSlug: string; chapter: string }

/** Bookmark + "Aa" in the chapter reader's topbar. Needs the book name to be able
 * to save a bookmark that Samling can show, so it lives in the loaded branch. */
const ChapterActions = ({
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

/** Verse text with the source's own italics kept: Giles italicises foreign words
 * ("many thousand _li_") and book titles, and that emphasis belongs to the text. */
const VerseText = ({ text }: { text: string }) => (
  <>
    {emphasisParts(text).map((part, i) =>
      part.emphasis ? <em key={i}>{part.text}</em> : <span key={i}>{part.text}</span>,
    )}
  </>
)

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

export const ChapterPage = ({ workId, bookSlug, chapter }: Props) => {
  const n = Number(chapter)
  const id = bookId(workId, bookSlug)
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const goUp = () =>
    navigate({ to: '/bibliotek/verk/$workId/$bookSlug', params: { workId, bookSlug } })
  const goChapter = (target: number) =>
    navigate({
      to: '/kapitel/$workId/$bookSlug/$chapter',
      params: { workId, bookSlug, chapter: String(target) },
    })
  const { data, loading, error } = useAsync(() => fetchChapter(id, n), [id, n])
  useDocumentTitle(data ? `${data.book.name} ${data.chapter}` : undefined)
  useChapterSwipe(rootRef, {
    prev: data?.prev ?? null,
    next: data?.next ?? null,
    onNavigate: goChapter,
  })
  return (
    <div ref={rootRef} className="screenReader">
      {!data ? (
        <>
          <TopBar right={<ReadingSettingsButton />} onBack={goUp} />
          <StateNote loading={loading} error={error} />
        </>
      ) : (
        <>
          <TopBar
            right={
              <ChapterActions
                workId={workId}
                bookSlug={bookSlug}
                chapter={n}
                bookName={data.book.name}
              />
            }
            onBack={goUp}
          />
          <div key={n} className={styles.chapterEnter}>
            <header className={styles.head}>
              <div className="kicker">{data.book.name}</div>
              <h1 className={styles.chapterTitle}>Kapitel {data.chapter}</h1>
            </header>
            <div className={styles.verses}>
              {data.verses.map((verse) => (
                <p key={verse.id} className={styles.verse}>
                  <span className={styles.num}>{verse.verse}</span>
                  <VerseText text={verse.text} />
                </p>
              ))}
            </div>
            <div className={styles.nav}>
              <NavLink
                workId={workId}
                bookSlug={bookSlug}
                target={data.prev}
                label="‹ Föregående"
              />
              <NavLink
                workId={workId}
                bookSlug={bookSlug}
                target={data.next}
                label="Nästa ›"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
