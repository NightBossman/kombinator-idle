# Changelog - Kombinator 4.0: Droga do Wolności

Wszystkie istotne zmiany i wydania projektu będą dokumentowane w tym pliku.

---

## [4.4.1] - 2026-07-05
Przegląd nowych faz (W/X/Y/Z) i naprawa błędów — Claude. Zmiany oznaczone `[Claude]`.
Uwaga porządkowa: `package.json`/README były wciąż na 4.3.0 mimo wydania faz W–Z — wyrównano do 4.4.1.

### Naprawiono
- **Telegram PAP „cofał się" po ucieczce/prestiżu**: `eventsUnlocked` to odblokowanie NA STAŁE,
  ale `resetGame` go gubił — po każdej emigracji gracz musiał od nowa trzymać 100 000 zł przez
  10 minut. Flaga przechodzi teraz przez reset (jak inne odblokowania), a licznik progu jest
  ustawiany na spełniony. Usunięto też łatę w `mergeSavedState`, która wymuszała odblokowanie
  przy `pln >= 100000` — omijała wymóg 10 minut przy każdym wczytaniu.
- **Zdarzenie „Przemówienie Draghi" nie robiło nic**: było zdefiniowane i pokazywało telegram
  obiecujący korzyści, ale nie miało żadnego efektu w kodzie. Teraz na czas trwania: rentowność
  rozliczanych obligacji euro +40%, a przyrost ryzyka w Mordorze −50%.
- **Lobbing KPO był ślepą uliczką**: pasek dochodził do 10 000 (i przekraczał 100%!), a nagroda
  nie istniała — `kpoApproved` nigdy się nie aktywowało. Po osiągnięciu progu Bruksela wypłaca
  jednorazową dotację 15 000 000 EUR i zatwierdza KPO na stałe. Naprawiono też skalę postępu:
  przyciski USD/EUR dodawały surowe 100 000 pkt (10× ponad cel) zamiast punktów wpływu.

### Zmieniono
- Ticker PAP w stanie spoczynku ma czytelniejszy, estetyczniejszy napis (mniej „szumu"),
  a treść po odblokowaniu nie sugeruje już błędnie, że trzeba utrzymywać kapitał.

### Usunięto
- Martwe pole stanu `pipInspectionTimer` (nieczytane i nieustawiane; kontrola PIP działa
  na podstawie `jdgRiskLevel`).

---

## [4.4.0] - 2026-07-04
Wdrożenie Fazy W – Mordor na Domaniewskiej (Lata 2010.).

### Dodano
- **Nowa era: Faza W - Lata 2010.**: Odblokowywana po spłacie kredytu CHF, zakończeniu Recesji 2008 i uzbieraniu 100 000 000 PLN.
- **Korporacyjny Mordor na Domaniewskiej (BPO/SSC)**:
  - Budowanie kolejnych pięter biurowca i zatrudnianie pracowników korporacyjnych.
  - Pasywna produkcja waluty EURO (EUR/s) na podstawie liczby pracowników.
  - Mechanika wypalenia zawodowego (morale) spowalnianego benefitami pozapłacowymi (owocowe czwartki, chillout zone, wejściówki na siłownię).
- **Samozatrudnienie B2B (JDG)**:
  - Przenoszenie pracowników korporacji na kontrakty B2B w celu drastycznego obniżenia kosztów ich utrzymania.
  - Optymalizacja podatkowa JDG (od skali podatkowej po spółkę komandytowo-akcyjną).
  - Ryzyko kontroli Państwowej Inspekcji Pracy (PIP) i potencjalne kary finansowe rosnące wraz z liczbą kontraktów B2B.
- **Rynek Obligacji Europejskich**:
  - Spekulacja papierami dłużnymi krajów strefy euro (Niemcy, Hiszpania, Włochy, Grecja).
  - Mechanika bankructwa państw (np. Grecji) z określonym procentem ryzyka i potencjalną utratą kapitału.
- **Kantor NBP**: Możliwość wymiany zarobionych EUR na PLN po płynnym kursie rynkowym.
- **Integracja UI**:
  - Dodano kolumnę waluty **EURO** na głównym pasku HUD.
  - Zakładka nawigacji **MORDOR (2010.)** ładowana dynamicznie po odblokowaniu fazy.
  - Uzupełnienie statystyk pasywnego przychodu i kosztów w kalkulatorze Casio fx-3600P o wartości z Mordoru.
  - Opcje deweloperskie ułatwiające testowanie Fazy W w ustawieniach (+1M EUR, +100M PLN, natychmiastowe odblokowanie).

### Naprawiono
- Usunięto bony Baltona z głównego paska HUD na rzecz logicznego uszeregowania głównych walut (PLN, USD, EUR).

---

## [4.3.0] - 2026-07-03
Domknięcie WSZYSTKICH punktów `docs/KIERUNEK.md` (2, 3, 4, 7.4) + rzadszy autozapis — Claude.
Mechanika gry bez zmian, stare zapisy wczytują się bez utraty czegokolwiek.

### Zmieniono
- **Wersjonowanie zapisu gry (KIERUNEK 2)**: ~180 ręcznych linii „backward compat"
  zastąpione głębokim scalaniem zapisu z `INITIAL_STATE` (`mergeSavedState` + pole
  `saveVersion` z miejscem na migracje). Dynamiczne klucze zapisu zostają, brakujące pola
  dostają wartości domyślne, martwe pola starych zapisów wypadają. Nowe pole stanu wymaga
  odtąd tylko wpisu w `GameState` + `INITIAL_STATE`. Do tego 5 testów scalania.
- **Autozapis co 60 sekund** (wcześniej co 5 s) — serializacja całego stanu to najdroższa
  cykliczna operacja poza renderem. Nic nie ginie: gra dodatkowo **zapisuje się natychmiast
  przy zamknięciu strony i przy ukryciu karty** (przełączenie okna, telefon).
- Stan początkowy jest klonowany przy wczytaniu i resecie — rozgrywka nie może już po cichu
  zmutować `INITIAL_STATE` (współdzielone zagnieżdżone obiekty).
- **Podział paczki JS (KIERUNEK 4)**: wszystkie 13 zakładek ładuje się przez `React.lazy`
  dopiero przy pierwszym wejściu (retro-komunikat „WCZYTYWANIE MODUŁU..." na czas dogrywania).
  Główna paczka zmalała z ~628 kB do ~352 kB; ostrzeżenie Vite o rozmiarze zniknęło.

### Dodano
- **Kolejka modali (KIERUNEK 3)**: gdy kilka zdarzeń wypadnie naraz, komunikaty czekają
  w kolejce („ZROZUMIANO" pokazuje następny) zamiast się nadpisywać. Identyczna treść nie
  dubluje się, limit 8 okien, pod przyciskami licznik „+N kolejnych komunikatów w kolejce".

### Naprawiono
- Pasek zasobów: skrót „Rub" ujednolicony do „rub." (spójnie z szt./bon./oz) — KIERUNEK 7.4.

---

## [4.2.0] - 2026-07-02
Dokończenie refaktoryzacji architektury z KIERUNEK.md (punkty 1.2, 1.3, 7.2, 7.3) — Claude.
Mechanika gry bez zmian (poza opisanymi niżej naprawami rozjazdów wyświetlania), zapisy kompatybilne.

### Zmieniono (architektura)
- **13 zakładek UI wydzielonych z App.tsx do osobnych komponentów** w `src/tabs/` (TabPraca,
  TabBazar, TabCzarnyRynek, TabPrzemyt, TabPartia, TabOdznaczenia, TabGpw, TabOffshore,
  TabSyndykat, TabWybory, TabLata90, TabMiasto, TabLata2000), każdy w `React.memo`.
  Dane i akcje przepływają przez kontekst `GameApi` z jawnym interfejsem
  (`src/tabs/GameApiContext.tsx`) — TypeScript pilnuje zgodności App ↔ zakładki.
  App.tsx zmalał z ~9,8 tys. do ~5,2 tys. linii; JSX zakładek przeniesiony 1:1.
- **Wspólne wzory mnożników w `src/game/formulas.ts`**: tempo pomocników i biznesów,
  czas kolejki, kurs cinkciarza, ceny sprzedaży na Bazarze (zł i $). Jedno źródło prawdy
  dla silnika gry, symulacji offline i wszystkich paneli UI + testy w `formulas.test.ts`.
- Losowość i identyfikatory przez `src/utils/rng.ts` (uniqueId/chance) — cała losowość gry
  przechodzi przez jeden moduł (w przyszłości łatwo dodać ziarno/seed do testów);
  usunięto wszystkie wyciszenia `eslint-disable react-hooks/purity` (6 sztuk).

### Dodano
- **Przełącznik „Efekt CRT (scanlines)" w ustawieniach** — wyłącza linie ekranu
  kineskopowego i migotanie na słabszych komputerach; wybór zapamiętywany w localStorage.
- 6 testów wzorów (`formulas.test.ts`) — razem 15 testów w `npm test`.

### Naprawiono (rozjazdy wyświetlania wykryte przy ujednolicaniu wzorów)
- **Kalkulator Casio zaniżał wskazania**: pomijał Magnetofon Grundig (+40% pomocników),
  Ustawę Wilczka i Prywatny Import, a kurs cinkciarza pokazywał bez inflacji
  i Czarnego Wtorku. Teraz Casio pokazuje dokładnie to, co liczy silnik.
- **Bazar w dolarach obiecywał bonus Uwolnienia Cen (×2,5), którego sprzedaż nigdy
  nie wypłacała** — przycisk pokazuje teraz prawdziwą kwotę.
- **Wypłata ze sprzedaży x10/x100 = dokładnie cena z przycisku razy sztuki**
  (wcześniej różnice zaokrągleń mogły dać o parę złotych inną kwotę).
- Licznik ważności ofert czarnego rynku liczony z zegara gry (bez `Date.now()` w renderze).
- Efekty kolejek nie restartują się już co sekundę (zależą od wyliczonego czasu,
  a nie od klonowanych co tick obiektów stanu).

---

## [4.1.2] - 2026-07-02
Refaktoryzacja architektury wykonana przez Claude (KIERUNEK.md, punkty 1.1 i 7.1).
Zero zmian w mechanice gry - logika przeniesiona 1:1, zapisy w pełni kompatybilne.

### Zmieniono
- **Silnik gry wydzielony z App.tsx do `src/game/engine.ts`**: cała logika ticku (dawniej ~1900 linii
  wewnątrz komponentu Reacta) jest teraz czystą funkcją `tick(stan, deltaSec, kontekst)`, która zwraca
  nowy stan oraz listę zdarzeń (dźwięki, alerty, toasty, postęp auto-pchacza C64). App.tsx zmalał
  z ~11,7 tys. do ~9,8 tys. linii i tylko odtwarza zdarzenia po aktualizacji stanu.
- Komunikaty z pętli gry nie używają już `setTimeout` wewnątrz updatera stanu - dzięki temu
  **w trybie deweloperskim zniknęły podwójne alerty i dźwięki** (React StrictMode celowo wywołuje
  updatery dwukrotnie; bufor zdarzeń z identyfikatorem ticku usuwa duplikaty).

### Dodano
- **Testy silnika (vitest, `npm test`)** - 9 testów scenariuszowych: odliczanie i koniec recesji 2008,
  krach GPW (-6%/tick), rozliczenie opcji CALL i toksycznej, zamrożenie inflacji po denominacji,
  dewaluacja gotówki przed denominacją, produkcja pomocników, bonus Solidarności +25%
  oraz godzina ticków z odblokowanymi fazami bez ani jednego NaN/Infinity w stanie gry.

### Naprawiono
- Martwy warunek pauzy w ticku lobbingu (sprawdzał `settingsOpen`, choć pętla i tak nie działa w pauzie).

---

## [4.1.1] - 2026-07-02
Przegląd i naprawa kodu wykonana przez Claude (Anthropic). Wszystkie zmiany w kodzie
oznaczone komentarzami `[Claude]` z uzasadnieniem. Rady na przyszłość: `docs/KIERUNEK.md`.

### Naprawiono
- **Faza T (Wielka Recesja 2008) była w całości martwa (Krytyczny)**:
  - Zdarzenia `lehman_recession` i `toxic_options_scandal` były obsługiwane w pętli gry, ale nie istniały na liście `HISTORY_EVENTS` — recesja nie miała żadnego działającego wyzwalacza. Dodano oba zdarzenia (losują się w erze Lat 2000.).
  - `recessionTimer` był ustawiany, ale nigdy nie odliczany — raz rozpoczęta recesja trwałaby wiecznie. Dodano odliczanie i komunikat końca recesji (180 s).
  - Opcje walutowe (PUT/CALL/toksyczne) dawało się kupić, ale nigdy nie były rozliczane — gracz płacił premię i nic nie otrzymywał. Dodano pełne rozliczenie przy wygaśnięciu, zgodne z opisami kontraktów.
- **Polonez z FSO przepadał bez śladu**: spółka Inter-Viag produkowała auta `polonez`, których nie było na żadnej liście sprzedaży Bazaru. Dodano FSO Polonez do towarów (cena 2 500 000 zł).
- **Dwa sprzeczne systemy kursu dolara**: autozapis co 2 s losowo zmieniał kurs (±10, widełki 50–500) i walczył z wahaniami z pętli gry (co 10 s, widełki 80–150). Zostawiono wyłącznie system z pętli gry.
- **Bonus Solidarności ≥9000 (+25% pomocników) nie działał na bieżąco**: pętla gry używała wartości z momentu montażu efektu (deklarowanej ~5200 linii niżej). Mnożnik liczony jest teraz świeżo w każdym ticku.
- **Kupno Kawy Jacobs nie skracało trwającej kolejki**: brakująca zależność `baltonaUpgrades` w efektach obu kolejek.
- **Ikona gry (favicon) zwracała 404**: `index.html` wskazywał nieistniejący `/vite.svg` zamiast `/favicon.svg`; przy okazji `lang="en"` → `lang="pl"` i tytuł strony zaktualizowany do pełnej nazwy gry.

### Zmieniono (dostosowanie do polskiego gracza)
- Nowy moduł `src/utils/format.ts`: wszystkie liczby dziesiętne wyświetlane z polskim przecinkiem (np. „3,50 PLN/CHF" zamiast „3.50") — zastąpiono 36 wywołań `toFixed()`.
- 128 wywołań `toLocaleString()` związano na stałe z lokalizacją `pl-PL` (dotąd zależały od ustawień przeglądarki).
- Poprawna odmiana rzeczowników po liczebnikach (funkcja `pluralPL`): „1 kartka / 2 kartki / 5 kartek", „22 ruble", „3 Bony Towarowe", „1 osobę / 100 osób".
- Literówki: „Wyslij" → „Wyślij", „Alpejski Przełęcz" → „Alpejska Przełęcz", „bakem" → „bakiem", „Kukurudźnik" → „Kukuruźnik".

### Wydajność
- Paski postępu (kolejki, przemyt, druk bibuły, rejsy) tykały co 50–100 ms, wymuszając do ~60 pełnych re-renderów całej aplikacji na sekundę. Tick zmniejszony do 200 ms, a płynność zachowana przez animację CSS na paskach.
- Autozapis (serializacja całego stanu do localStorage) co 5 s zamiast co 2 s.

### Usunięto (martwy kod)
- `COCOM_NODES` + pole stanu `unlockedCocomNodes` (mapa węzłów przemytniczych nigdy nie powstała w UI).
- Flaga `devFreezeVatRisk` (czytana w pętli, ale nigdy nie ustawiana).
- Martwe `void DEBATE_OPTIONS; void ELECTION_UPGRADES;` (stałe są od dawna używane), nieużywany licznik `activeCount`, nieużywane pliki `src/assets/` (react.svg, vite.svg, hero.png).
- Porządki ESLint: `npm run lint` przechodzi teraz bez błędów (typy zamiast `any` w symulacji offline, `prefer-const`, puste bloki `catch`).

---

## [4.1.0] - 2026-07-01
### Dodano
- **Faza T: Wielka Recesja 2008**:
  - Wyzwalacz krachu finansowego wywoływany ukończeniem budowy Mikroapartamentów na Woli.
  - Dynamika kursu CHF/PLN (skoki wartości franka szwajcarskiego do 7.20 PLN).
  - Krach na GPW (spadek wycen akcji o 70% i wstrzymanie dywidend).
  - Spekulacja opcjami walutowymi (kontrakty PUT, CALL oraz asymetryczne Toksyczne Opcje Walutowe).
  - Licytacje u syndyka (odkupywanie niedokończonych budów, wykańczanie i zamrożenie sprzedaży do końca recesji).
  - Doradcy bankowi (zatrudnianie do 3 doradców redukujących raty o 15% każdy).
  - Restrukturyzacja długu w CHF (przewalutowanie po karnym kursie w celu zamrożenia ryzyka).
- **Panel Ustawień (Settings Menu)**:
  - Retro przycisk "USTAWIENIA" w prawym górnym rogu.
  - Opcja włączania/wyłączania dźwięku.
  - Przycisk Hard Resetu (usuwanie zapisu gry i restart od zera).
  - Skróty deweloperskie (Odblokowanie gry oraz Zerowanie długu CHF) z pełnym zapamiętywaniem i przywracaniem stanu gry (toggle/backup).

### Naprawiono
- **Błąd pożerania gotówki po denominacji (Krytyczny)**:
  - Naprawiono błąd w pętli gry, przez który pasywna dewaluacja PLN oraz wskaźnik inflacji rosły i pożerały gotówkę gracza nawet po pomyślnym przejściu denominacji. Po denominacji inflacja jest na stałe zamrożona na 0%.
- **Błąd nawigacji Lata 2000**:
  - Naprawiono brakujący przycisk "LATA 2000." na głównym pasku zakładek, uniemożliwiający wejście do nowej ery.

---

## [4.0.0] - 2026-06-30
### Dodano
- **Faza S: Integracja europejska i startupy**:
  - Wejście do lat 2000. i integracja z UE.
  - Dotacje unijne i ryzyko kontroli OLAF/Urzędu Skarbowego (mechanika łapówek).
  - Inwestycje deweloperskie i pierwsze kredyty we frankach (CHF).
  - Portal internetowy Dot-com (zarabianie na AdSense, serwery, pasywni użytkownicy).
  - Agencja pracy (emigracja zarobkowa na zmywak do UK, pasywny dochód w GBP).
- **Kalkulator Casio fx-3600P**:
  - Szczegółowy bilans przepływów pieniężnych (Live Cashflow) pokazujący wszystkie pasywne źródła przychodów i kosztów w czasie rzeczywistym.
