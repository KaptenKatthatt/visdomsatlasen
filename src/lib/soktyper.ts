// Söktyperna och den delbara sökparametern — utbrutna ur sokindex.ts så att
// routern (som validerar URL:ens ?type= mot SOKTYPER) kan importera dem utan att
// dra in indexbygget. sokindex.ts bygger hela det publika indexet ur allt
// innehåll vid moduladdning; skulle routern importera därifrån skulle varje
// sidladdning bygga indexet i onödan. Denna modul har inga innehållsberoenden.

export type SearchType = 'fraga' | 'tema' | 'rum' | 'vandring' | 'kalla' | 'tradition'

/** Söktyperna i redaktionell prioritetsordning — en enda source som router,
 * rankning och filter delar (så en ny type läggs till på ett ställe). */
export const SOKTYPER: readonly SearchType[] = ['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition']

/** Den delbara sökparametern: fråga och valfritt typfilter. Aldrig privata värden. */
export type SearchParams = { q?: string; type?: SearchType }
