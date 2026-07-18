// The search types and the shareable search parameter — extracted from sokindex.ts so that
// the router (which validates the URL's ?type= against SOKTYPER) can import them without
// pulling in the index build. sokindex.ts builds the entire public index from all
// content at module load; were the router to import from there, every
// page load would build the index needlessly. This module has no content dependencies.

export type SearchType = 'fraga' | 'tema' | 'rum' | 'vandring' | 'kalla' | 'tradition' | 'person'

/** The search types in editorial priority order — a single source shared by router,
 * ranking and filter (so a new type is added in one place). */
export const SEARCH_TYPES: readonly SearchType[] = ['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition', 'person']

/** The shareable search parameter: query and optional type filter. Never private values. */
export type SearchParams = { q?: string; type?: SearchType }
