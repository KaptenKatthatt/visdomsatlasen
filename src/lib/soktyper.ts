// Söktyperna och den delbara sökparametern — utbrutna ur sokindex.ts så att
// routern (som validerar URL:ens ?typ= mot SOKTYPER) kan importera dem utan att
// dra in indexbygget. sokindex.ts bygger hela det publika indexet ur allt
// innehåll vid moduladdning; skulle routern importera därifrån skulle varje
// sidladdning bygga indexet i onödan. Denna modul har inga innehållsberoenden.

export type Soktyp = 'fraga' | 'tema' | 'rum' | 'vandring' | 'kalla' | 'tradition'

/** Söktyperna i redaktionell prioritetsordning — en enda källa som router,
 * rankning och filter delar (så en ny typ läggs till på ett ställe). */
export const SOKTYPER: readonly Soktyp[] = ['fraga', 'tema', 'rum', 'vandring', 'kalla', 'tradition']

/** Den delbara sökparametern: fråga och valfritt typfilter. Aldrig privata värden. */
export type SökParametrar = { q?: string; typ?: Soktyp }
