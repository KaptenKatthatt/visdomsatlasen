import { ToLink } from '../../components/ToLink'
import { TopBar } from '../../components/TopBar'
import { libraryPaths, pathReadingTime, roomsForPath } from '../../lib/library'
import { allPaths, allRooms } from '../../lib/content'
import styles from './Library.module.css'
import { pathCount, roomCount, Row, Sidhuvud } from './LibraryParts'

/** All published paths — a finite list (library.md, Browsing): the count stands
 * at the top so you can see how much there is. Each row carries the same quiet
 * metadata as the landing's path section (number of rooms + approximate time),
 * never a progress cue. No infinite scroll. */
export const PathListPage = () => {
  const paths = libraryPaths(allPaths)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Vandringar" title="Alla vandringar">
        <p className={styles.antal}>{pathCount(paths.length)}</p>
      </Sidhuvud>
      <div className={styles.section}>
        {paths.length === 0 ? (
          <p className={styles.empty}>Inga vandringar ännu.</p>
        ) : (
          paths.map((path) => {
            const rooms = roomsForPath(path, allRooms)
            const sub = `${roomCount(rooms.length)} · ca ${pathReadingTime(rooms)} min`
            return (
              <ToLink
                key={path.id}
                to={{ kind: 'vandring', slug: path.slug }}
                className={styles.row}
              >
                <Row title={path.title} sub={sub} />
              </ToLink>
            )
          })
        )}
      </div>
    </div>
  )
}
