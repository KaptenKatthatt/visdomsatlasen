/** True when enough verses changed for the work to count as translated (≥ 90 %). */
export const isTranslatedEnough = (translatedVerses: number, totalVerses: number): boolean =>
  totalVerses > 0 && translatedVerses * 10 >= totalVerses * 9
