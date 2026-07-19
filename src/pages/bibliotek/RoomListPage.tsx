import { TopBar } from '../../components/TopBar'
import { libraryRooms } from '../../lib/library'
import { allRooms } from '../../lib/content'
import styles from './Library.module.css'
import { RoomList, roomCount, Sidhuvud } from './LibraryParts'

/** All published rooms — a finite list (library.md, Browsing): the count
 * stands at the top so you can see how much there is. No infinite scroll. */
export const RoomListPage = () => {
  const rooms = libraryRooms(allRooms)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Rum" title="Alla rum">
        <p className={styles.antal}>{roomCount(rooms.length)}</p>
      </Sidhuvud>
      <div className={styles.section}>
        <RoomList rooms={rooms} emptyMessage="Det finns inga färdiga rum ännu." />
      </div>
    </div>
  )
}
