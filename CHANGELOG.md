# Changelog - Kombinator 4.0: Droga do Wolności

Wszystkie istotne zmiany i wydania projektu będą dokumentowane w tym pliku.

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
