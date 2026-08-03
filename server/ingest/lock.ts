/** Bible is already Swedish source — never overwrite without an explicit force id. */
const SWEDISH_SOURCE_IDS = new Set(['bibel-1917'])

/** Parses FORCE_RETRANSLATE (comma-separated work ids that may overwrite locked rows). */
export const parseForceRetranslate = (raw: string | undefined): Set<string> => {
  if (!raw?.trim()) return new Set()
  return new Set(
    raw
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0),
  )
}

/**
 * A work already in the DB is locked when it is marked translated, or when it is
 * the Swedish-source Bible. Force-allowlisted ids are never locked.
 */
export const isWorkLocked = (
  id: string,
  status: Map<string, boolean>,
  force: Set<string>,
): boolean => {
  if (force.has(id)) return false
  if (!status.has(id)) return false
  if (SWEDISH_SOURCE_IDS.has(id)) return true
  return status.get(id) === true
}
