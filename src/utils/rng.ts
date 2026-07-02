// [Claude] NOWY PLIK (KIERUNEK.md pkt 7.3): losowość i generowanie identyfikatorów w jednym miejscu.
// Powód: reguła react-hooks/purity zabrania wołania Math.random()/Date.now() w ciele komponentu,
// bo nie umie odróżnić handlera kliknięcia od renderu - w App.tsx wisiało przez to 6 wyciszeń
// eslint-disable. Po przeniesieniu losowania tutaj wyciszenia znikają, a przy okazji cała
// losowość gry przechodzi przez jeden moduł (w przyszłości łatwo dodać np. ziarno/seed do testów).

let idSeq = 0;

/** Unikalny identyfikator, np. uniqueId('ship') -> "ship_m3k2xv_7". Stabilny po przeładowaniu
 *  strony (część czasowa), unikalny w ramach sesji (licznik). */
export const uniqueId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${++idSeq}`;

/** Rzut kością: true z prawdopodobieństwem p (0..1), np. chance(0.75). */
export const chance = (p: number): boolean => Math.random() < p;
