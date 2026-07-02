# KIERUNEK.md — rady po przeglądzie kodu (Claude, 2026-07-02)

Ten plik powstał po pełnym przeglądzie gry pod kątem wydajności, martwego kodu, bugów
i dostosowania do polskiego gracza. Wszystkie naprawy z tego przeglądu są oznaczone
w kodzie komentarzami `[Claude]` z wyjaśnieniem *dlaczego* — szczegółowa lista zmian
jest w `CHANGELOG.md` (wersja 4.1.1). Poniżej to, czego **nie** naprawiłem, bo wymaga
decyzji lub większej przebudowy — w kolejności od najważniejszego.

**Stan realizacji (2026-07-02, wersja 4.2.0):** sekcja 1 (architektura) — ✅ W CAŁOŚCI zrobiona
(1.1 silnik: PR #6; 1.2 zakładki i 1.3 wspólne wzory: PR #7). Sekcja 7: 7.1 testy ✅ (PR #6),
7.2 przełącznik CRT ✅ i 7.3 koniec wyciszeń purity ✅ (PR #7). Punkt 5 (wielkie liczby) ✅ Gemini.
Do wzięcia pozostają: sekcja 2 (wersjonowanie zapisu), 3 (kolejka modali), 4 (podział paczki JS),
uwaga z sekcji 6 (wyzwalacz recesji po Mikroapartamentach — odłożone u Gemini) i kosmetyka stopki z 7.

---

## 1. App.tsx ma ~11 600 linii — to główne źródło przyszłych bugów

Cała gra (pętla, logika 20 faz, wszystkie zakładki UI) żyje w jednym komponencie.
Skutki już widać: **Faza T (Recesja 2008) była w całości martwa** — zdarzenie
wyzwalające nie istniało, licznik nie był odliczany, a opcje walutowe nie miały
rozliczenia. Przy tej skali pliku nikt (ani człowiek, ani model) nie jest w stanie
zauważyć, że jakiś kawałek stanu nie ma domknięcia.

Proponowana kolejność przebudowy (można robić etapami, gra cały czas działa):

1. ✅ **ZROBIONE (Claude, PR #6, 4.1.2)** — pętla gry wydzielona do `src/game/engine.ts`
   jako czysta funkcja `tick(state, deltaSec, ctx) -> { state, events }`. Zdarzenia
   (alerty, dźwięki, toasty, postęp C64) wracają jako lista i są odtwarzane przez
   App po aktualizacji stanu; podwójne alerty ze StrictMode zniknęły. Logika
   przeniesiona 1:1 — porządkowanie wnętrza silnika to dalszy krok.
2. ✅ **ZROBIONE (Claude, PR #7, 4.2.0)** — 13 zakładek wydzielonych do `src/tabs/`
   (TabPraca, TabBazar, ..., TabLata2000), każda w `React.memo`. Dane i akcje płyną
   z kontekstu `GameApi` (jawny interfejs w `GameApiContext.tsx` — tsc pilnuje zgodności
   App ↔ zakładki). App.tsx zmalał z ~9,8 tys. do ~5,2 tys. linii; JSX przeniesiony 1:1.
3. ✅ **ZROBIONE (Claude, PR #7, 4.2.0)** — wspólne wzory w `src/game/formulas.ts`
   (tempo pomocników i biznesów, czas kolejki, kurs cinkciarza, ceny Bazaru) + testy
   w `formulas.test.ts`. Ujednolicenie wykryło i naprawiło rozjazdy: Casio pomijał
   Grundiga/Wilczka/inflację kursu, a Bazar w dolarach obiecywał na przycisku bonus
   Uwolnienia Cen, którego sprzedaż nigdy nie wypłacała.

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

## 5. ✅ ZROBIONE — duże liczby, skrócone formatowanie

Zrobione przez Gemini: `fmtShort()` w `src/utils/format.ts` (tys./mln/mld z polskim
przecinkiem), zastosowane w UI Drukarni Centralnej. Jeśli w innych panelach kwoty
zaczną rozpychać układ, wystarczy użyć tej samej funkcji.

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

- ✅ **ZROBIONE (Claude, PR #6)** — testy silnika: `vitest` + 9 testów scenariuszowych
  w `src/game/engine.test.ts` (`npm test`): recesja, krach GPW, opcje walutowe,
  denominacja, pomocnicy, bonus Solidarności, godzina ticków bez NaN. Przy zmianach
  w `engine.ts` należy dopisywać kolejne testy (patrz `.agents/AGENTS.md`).
- ✅ **ZROBIONE (Claude, PR #7)** — przełącznik „Efekt CRT (scanlines)" w ustawieniach;
  wybór trwały w localStorage, klasa `.crt-off` wyłącza scanlines i migotanie.
- ✅ **ZROBIONE (Claude, PR #7)** — zero wyciszeń `react-hooks/purity`: identyfikatory
  i rzuty kością idą przez `src/utils/rng.ts` (uniqueId/chance — przy okazji cała losowość
  gry przechodzi przez jeden moduł, gotowy na przyszłe ziarno/seed do testów), a licznik
  ofert czarnego rynku czyta zegar ze stanu (realTime) zamiast Date.now() w renderze.
- **Ikony walut w stopce**: skróty „Rub", „bon." są niejednolite z resztą
  (szt./zł/$) — kosmetyka.

## 8. Czego celowo NIE zmieniałem

- Balansu ekonomii (poza dodaniem ceny Poloneza — 2,5 mln zł, między Fiatem 125p
  a Ursusem — bez tego auta z FSO przepadały bez śladu).
- Wyglądu i klimatu CRT (jest świetny).
- Struktury zapisu w localStorage (stare zapisy wczytują się bez zmian; usunięte
  martwe pola `unlockedCocomNodes`/`devFreezeVatRisk` są po prostu ignorowane).
