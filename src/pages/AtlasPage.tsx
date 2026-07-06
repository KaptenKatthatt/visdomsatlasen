import { ToLink } from '../components/ToLink'
import { mapEdges, mapNodes } from '../content/atlasMap'
import styles from './AtlasPage.module.css'

const nodeById = (id: string) => mapNodes.find((node) => node.id === id)

export const AtlasPage = () => (
  <div className={styles.screen}>
    <div className={styles.text}>
      <div className="kicker">Visdomsatlasen</div>
      <h1 className={styles.title}>Atlas</h1>
      <p className={styles.lede}>Allt hänger ihop. Följ en tråd genom idéhistorien.</p>
    </div>
    <div className={styles.map}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className={styles.lines} aria-hidden>
        {mapEdges.map(([fromId, toId]) => {
          const from = nodeById(fromId)
          const to = nodeById(toId)
          if (!from || !to) return null
          return (
            <line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="var(--accsoft)"
              strokeWidth="1"
              strokeDasharray="1.5 2.5"
              opacity="0.45"
              vectorEffect="non-scaling-stroke"
            />
          )
        })}
      </svg>
      {mapNodes.map((node) => (
        <ToLink
          key={node.id}
          to={node.to}
          className={styles.node}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          {node.label}
        </ToLink>
      ))}
    </div>
    <p className={styles.caption}>Rör vid en punkt för att vandra dit.</p>
  </div>
)
