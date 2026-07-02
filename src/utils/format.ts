// [Claude] NOWY PLIK: centralne formatowanie liczb w polskiej konwencji.
// Powód: gra używała toFixed(), które ZAWSZE daje amerykańską kropkę dziesiętną
// (np. "3.50" zamiast "3,50"), oraz toLocaleString() bez wskazania języka
// (wynik zależał od ustawień przeglądarki gracza). Tu wszystko idzie przez pl-PL.

const formatterCache = new Map<string, Intl.NumberFormat>();

const getFormatter = (minFrac: number, maxFrac: number): Intl.NumberFormat => {
  const key = `${minFrac}:${maxFrac}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat('pl-PL', {
      minimumFractionDigits: minFrac,
      maximumFractionDigits: maxFrac,
    });
    formatterCache.set(key, fmt);
  }
  return fmt;
};

/**
 * Formatuje liczbę po polsku: przecinek dziesiętny, spacje tysięcy.
 * fmtNum(1234.5, 2)        -> "1 234,50"
 * fmtNum(1234.5, 2, true)  -> "1 234,5"  (trim: bez zbędnych zer na końcu)
 */
export const fmtNum = (value: number, decimals: number = 0, trim: boolean = false): string => {
  if (!Number.isFinite(value)) return '0';
  return getFormatter(trim ? 0 : decimals, decimals).format(value);
};


export const fmtShort = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  if (value >= 1e9) return getFormatter(2, 2).format(value / 1e9) + ' mld';
  if (value >= 1e6) return getFormatter(2, 2).format(value / 1e6) + ' mln';
  if (value >= 1e4) return getFormatter(1, 1).format(value / 1e3) + ' tys.';
  return getFormatter(0, 2).format(value);
};
/**
 * Odmiana rzeczownika po liczebniku (polskie reguły):
 * pluralPL(1, 'kartka', 'kartki', 'kartek') -> "kartka"
 * pluralPL(3, ...) -> "kartki"; pluralPL(5, ...) -> "kartek"; pluralPL(22, ...) -> "kartki"
 * Zwraca samą formę słowa (bez liczby).
 */
export const pluralPL = (count: number, one: string, few: string, many: string): string => {
  const n = Math.abs(Math.floor(count));
  if (n === 1) return one;
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) return few;
  return many;
};
