# KIERUNEK.md — rady po przeglądzie kodu (Claude, 2026-07-02)

Ten plik powstał po pełnym przeglądzie gry pod kątem wydajności, martwego kodu, bugów
i dostosowania do polskiego gracza. Wszystkie naprawy z tego przeglądu są oznaczone
w kodzie komentarzami `[Claude]` z wyjaśnieniem *dlaczego* — szczegółowa lista zmian
jest w `CHANGELOG.md` (wersja 4.1.1). Poniżej to, czego **nie** naprawiłem, bo wymaga
decyzji lub większej przebudowy — w kolejności od najważniejszego.

---

## 1. App.tsx ma ~11 600 linii — to główne źródło przyszłych bugów

Cała gra (pętla, logika 20 faz, wszystkie zakładki UI) żyje w jednym komponencie.
Skutki już widać: **Faza T (Recesja 2008) była w całości martwa** — zdarzenie
wyzwalające nie istniało, licznik nie był odliczany, a opcje walutowe nie miały
rozliczenia. Przy tej skali pliku nikt (ani człowiek, ani model) nie jest w stanie
zauważyć, że jakiś kawałek stanu nie ma domknięcia.

Proponowana kolejność przebudowy (można robić etapami, gra cały czas działa):

1. **Wydzielić pętlę gry do `src/game/engine.ts`** jako czystą funkcję
   `tick(state, deltaSec) -> { nextState, zdarzenia }`. Zdarzenia (alerty, dźwięki,
   toasty) zwracać jako listę, a nie odpalać `setTimeout` w środku aktualizacji stanu.
   Korzyści: można pisać testy („po 180 s recesja się kończy"), znika problem
   podwójnych alertów w trybie deweloperskim (React StrictMode celowo wywołuje
   aktualizacje stanu dwukrotnie — obecne `setTimeout(...)` w środku updaterów
   podwajają wtedy komunikaty).
2. **Podzielić UI na komponent na zakładkę** (`TabPraca.tsx`, `TabBazar.tsx`, ...)
   i owinąć w `React.memo`. Dziś każdy tick renderuje od nowa całość; po podziale
   renderuje się tylko aktywna zakładka i nagłówek.
3. **Wydzielić wspólne wzory mnożników** (helperMult, mnożniki bazaru itd.) do
   jednego modułu. Dziś te same wzory są skopiowane w 3 miejscach: pętla gry,
   symulacja offline w `useGameState.ts` i panel Casio. Tak właśnie zepsuł się
   bonus Solidarności (+25% pomocników) — jedna kopia była nieświeża.

## 2. Wersjonowanie zapisu gry

`useGameState.ts` ma ~200 linii ręcznego „backward compat" (osobna linijka na każde
pole). Prościej: pole `saveVersion` w zapisie + jedna pętla domyślnych wartości z
`INITIAL_STATE` (głębokie scalenie) + krótkie migracje tylko tam, gdzie zmienia się
znaczenie pola. Mniej kodu, zero szans na pominięcie nowego pola.

## 3. Jeden modal na raz — komunikaty się nadpisują

`showAlert` trzyma pojedynczy `activeModal`. Gdy w tej samej sekundzie wypada kilka
zdarzeń (np. koniec lokaty + nalot SB), gracz widzi tylko ostatni komunikat.
Warto zrobić kolejkę modali (tablica; „ZROZUMIANO" pokazuje następny).

## 4. Rozmiar paczki (622 kB JS)

Vite ostrzega przy buildzie. Po podziale na komponenty per zakładka można dodać
`React.lazy`/dynamic import dla późnych er (Lata 90., Lata 2000.) — gracz w PRL-u
nie musi pobierać kodu GPW i karuzeli VAT. Niekrytyczne, gra ładuje się raz.

## 5. Duże liczby — skrócone formatowanie

W późnej grze kwoty sięgają setek milionów („150 000 000 zł" rozpycha panele).
Jest już centralny moduł `src/utils/format.ts` — łatwo dodać `fmtShort()`:
1 234 567 → „1,23 mln zł", 2 500 000 000 → „2,5 mld zł". Rekomendacja: stosować
od ~1 mln w panelach bocznych, pełną liczbę zostawić w tooltipach/statystykach.

## 6. Rozliczenie opcji walutowych — dobrane wartości do przejrzenia

Naprawiając martwe opcje (Faza T) przyjąłem wzory zgodne z opisami w grze:
- CALL/PUT: wypłata `(kurs − strike) × wolumen`, gdy kurs > strike, inaczej 0;
- toksyczna: `(strike − kurs) × wolumen × 0,05` zysku poniżej 4,20;
  **podwójna kara** `2 × (kurs − strike) × wolumen` powyżej.
Współczynnik `0,05` dla opcji toksycznej to moja kalibracja „na oko" — warto
przetestować balans w grze i ewentualnie podkręcić/skręcić.

**Uwaga do decyzji**: changelog 4.1.0 obiecywał, że krach wywołuje „ukończenie
budowy Mikroapartamentów na Woli" — takiego wyzwalacza nigdy w kodzie nie było
(co więcej, pole `buildTimeSec` w `REAL_ESTATE_PROJECTS` jest w ogóle nieużywane:
`buyRealEstate` dodaje nieruchomość od razu, bez czasu budowy). Przywróciłem recesję
jako losowe zdarzenie historyczne ery Lat 2000. Jeśli wolisz wersję z changeloga
(deterministyczny wyzwalacz po mikro_wola), trzeba najpierw zaimplementować czas
budowy nieruchomości — dobre zadanie na osobną, małą fazę.

## 7. Drobiazgi warte zrobienia przy okazji

- **Testy silnika**: po wydzieleniu `engine.ts` dodać `vitest` i kilka testów
  scenariuszowych (recesja, denominacja, offline 24 h — czy nie ma NaN).
- **Efekt CRT**: pełnoekranowa animacja `flicker` (0,15 s, nieskończona) działa
  stale nawet w tle. Na słabszych komputerach warto dodać przełącznik „Wyłącz
  efekt CRT" w ustawieniach (sama animacja zmienia tylko `opacity`, więc jest
  tania, ale scanline-gradient + flicker razem potrafią obciążyć zintegrowane GPU).
- **`react-hooks/purity`**: sześć wyciszeń `eslint-disable` w App.tsx to fałszywe
  alarmy nowej reguły (losowanie w handlerach kliknięć, nie w renderze). Po
  wydzieleniu silnika te funkcje i tak zmienią miejsce — wtedy wyciszenia znikną.
- **Ikony walut w stopce**: skróty „Rub", „bon." są niejednolite z resztą
  (szt./zł/$) — kosmetyka.

## 8. Czego celowo NIE zmieniałem

- Balansu ekonomii (poza dodaniem ceny Poloneza — 2,5 mln zł, między Fiatem 125p
  a Ursusem — bez tego auta z FSO przepadały bez śladu).
- Wyglądu i klimatu CRT (jest świetny).
- Struktury zapisu w localStorage (stare zapisy wczytują się bez zmian; usunięte
  martwe pola `unlockedCocomNodes`/`devFreezeVatRisk` są po prostu ignorowane).
