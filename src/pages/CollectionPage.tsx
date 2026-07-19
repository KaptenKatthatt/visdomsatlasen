import { RowLink } from '../components/RowLink'
import { RoomRow } from '../components/RoomRow'
import type { Room, Path } from '../content/editorial/schema'
import { findTopic } from '../content/topics'
import { findRoomById, findPathById } from '../lib/content'
import {
  chapterKey,
  sortedNotes,
  savedIdsByTime,
  type ChapterBookmark,
  type SavedItem,
} from '../lib/personal'
import { useAtlas } from '../lib/store'
import { useDocumentTitle } from '../lib/useDocumentTitle'
import styles from './CollectionPage.module.css'
import {
  NoteCard,
  noteToCard,
  Group,
  EmptyState,
  PathCard,
  type Card,
} from './SavedParts'

type SavedPath = { path: Path; recentRoom: string | undefined }

const RoomGroup = ({ rooms }: { rooms: Room[] }) =>
  rooms.length === 0 ? null : (
    <Group heading="Rum">
      {rooms.map((room) => (
        <RoomRow key={room.id} room={room} />
      ))}
    </Group>
  )

const PathGroup = ({ paths }: { paths: SavedPath[] }) =>
  paths.length === 0 ? null : (
    <Group heading="Vandringar">
      {paths.map(({ path, recentRoom }) => (
        <PathCard key={path.id} path={path} recentRoom={recentRoom} />
      ))}
    </Group>
  )

const BookmarkGroup = ({ topics }: { topics: { id: string; title: string; tradition: string; min: number }[] }) =>
  topics.length === 0 ? null : (
    <Group heading="Bokmärken">
      {topics.map((topic) => (
        <RowLink
          key={topic.id}
          to={{ kind: 'topic', id: topic.id }}
          title={topic.title}
          sub={`${topic.tradition} · ${topic.min} min`}
          chevron
          size="md"
        />
      ))}
    </Group>
  )

const SourcesGroup = ({ chapters }: { chapters: ChapterBookmark[] }) =>
  chapters.length === 0 ? null : (
    <Group heading="Källor">
      {chapters.map((b) => (
        <RowLink
          key={chapterKey(b.workId, b.bookSlug, b.chapter)}
          to={{ kind: 'kapitel', workId: b.workId, bookSlug: b.bookSlug, chapter: b.chapter }}
          title={b.bookName}
          sub={`Kapitel ${b.chapter}`}
          chevron
          size="md"
        />
      ))}
    </Group>
  )

const NoteGroup = ({ card }: { card: Card[] }) =>
  card.length === 0 ? null : (
    <Group heading="Anteckningar">
      {card.map((k) => (
        <NoteCard key={k.key} title={k.title} text={k.text} date={k.date} to={k.to} />
      ))}
    </Group>
  )

/** Recently visited (spec Recently Opened Items): only orientation, never a
 * demanding queue. Separate from Saved and clearable by the reader. No »Fortsätt
 * läsa« phrasing. */
const RecentlyVisitedGroup = ({ rooms, onClear }: { rooms: Room[]; onClear: () => void }) =>
  rooms.length === 0 ? null : (
    <section className={styles.recent}>
      <div className={styles.recentHead}>
        <h2 className="kicker sectionKicker">Senast besökt</h2>
        <button type="button" className={styles.clear} onClick={onClear}>
          Rensa
        </button>
      </div>
      {rooms.map((room) => (
        <RowLink
          key={room.id}
          to={{ kind: 'rum', slug: room.slug }}
          title={room.title}
          sub={room.summary}
          size="md"
        />
      ))}
    </section>
  )

const savedPathsList = (
  savedPaths: Record<string, SavedItem>,
  pathPositions: Record<string, string>,
): SavedPath[] =>
  savedIdsByTime(savedPaths)
    .map((id) => findPathById(id))
    .filter((path): path is Path => path !== undefined)
    .map((path) => ({
      path,
      recentRoom: findRoomById(pathPositions[path.id] ?? '')?.title,
    }))

/** Saved (notes-and-saved.md): a quiet place for what the reader chose to keep,
 * grouped and easy to take in — never a content feed, never a measure
 * of progress. Only groups with content are shown; if nothing is saved a calm
 * empty state greets you. Recently visited sits separately last, for orientation. */
export const CollectionPage = () => {
  useDocumentTitle('Sparat')
  const store = useAtlas()
  const rooms = savedIdsByTime(store.savedRooms)
    .map((id) => findRoomById(id))
    .filter((room): room is Room => room !== undefined)
  const paths = savedPathsList(store.savedPaths, store.pathPositions)
  const topics = Object.keys(store.bookmarks)
    .filter((id) => store.bookmarks[id])
    .map(findTopic)
    .filter((topic) => topic !== undefined)
  const chapters = Object.values(store.chapterBookmarks).sort((a, b) => b.savedAt - a.savedAt)
  const short = sortedNotes(store.notes).map(noteToCard)
  const recent = store.recentRooms
    .map((id) => findRoomById(id))
    .filter((room): room is Room => room !== undefined)

  const nothingSaved =
    rooms.length === 0 &&
    paths.length === 0 &&
    topics.length === 0 &&
    chapters.length === 0 &&
    short.length === 0

  return (
    <div className="screenTab">
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Sparat</h1>
      <p className={styles.lede}>Det du sparat och tänkt.</p>
      {nothingSaved ? (
        <EmptyState />
      ) : (
        <>
          <RoomGroup rooms={rooms} />
          <PathGroup paths={paths} />
          <BookmarkGroup topics={topics} />
          <SourcesGroup chapters={chapters} />
          <NoteGroup card={short} />
        </>
      )}
      <RecentlyVisitedGroup rooms={recent} onClear={store.clearRecentlyVisited} />
    </div>
  )
}
