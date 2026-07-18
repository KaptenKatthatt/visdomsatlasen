import { TopBar } from '../../components/TopBar'
import { libraryRooms } from '../../lib/library'
import { allRooms } from '../../lib/content'
import styles from './Bibliotek.module.css'
import { RoomList, roomCount, Sidhuvud } from './Biblioteksdelar'

/** All published rooms — a finite list (library.md, Browsing): the count
 * stands at the top so you can see how much there is. No infinite scroll. */
export const RumlistaPage = () => {
  const rooms = libraryRooms(allRooms)
  return (
    <div className="screenSub">
      <TopBar />
      <Sidhuvud kicker="Rum" title="Alla rum">
        <p className={styles.antal}>{roomCount(rooms.length)}</p>
      </Sidhuvud>
      <div className={styles.section}>
        <RoomList rum={rooms} tomtBesked="Det finns inga färdiga rum ännu." />
      </div>
    </div>
  )
}
