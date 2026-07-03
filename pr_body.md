## Opis zmian

Wdrożenie obietnicy z changeloga 4.1.0 – wprowadzenie czasu budowy dla deweloperki oraz uczynienie Wielkiej Recesji z 2008 roku zjawiskiem deterministycznym, wywoływanym poprzez ukończenie inwestycji *Mikroapartamenty na Woli*.

### Szczegóły implementacji:
1. **Współbieżność stratna (formulas.ts)**: Można teraz budować kilka nieruchomości naraz, jednak każda kolejna konstrukcja tego samego typu zwiększa koszt o 15% i wydłuża czas budowy o 10%. Zmiany te są wyliczane za pomocą nowych funkcji w głównym pliku ormulas.ts.
2. **Kolejkowanie budów (App.tsx & GameApiContext)**: Zakup nieruchomości nie dodaje jej natychmiast do portfela. Zamiast tego trafia ona do nowej tablicy 
ealEstateUnderConstruction z odpowiednim 	imeLeft.
3. **Postęp budowy w pętli gry (engine.ts)**: Silnik Fazy S odlicza czas w tablicy budów. Po zakończeniu budowy budynek trafia do 
ealEstateOwned z odpowiednim komunikatem.
4. **Wyzwalacz Krachu 2008 (engine.ts & items.ts)**: Gdy oddaną budowlą są *Mikroapartamenty na Woli*, gra jednorazowo uruchamia fazę Recesji (ustawia 
ecessionActive, odpala 180 sekund licznika, wyrzuca kurs CHF na ponad 7 PLN i generuje alert). W związku z tym usunięto z items.ts lehman_recession oraz 	oxic_options_scandal jako wydarzenia losowe.
5. **Interfejs UI (TabLata2000.tsx)**: Zakładka deweloperki wyświetla dynamiczne ceny budynków oraz listę czasów dla inwestycji w trakcie budowy.

Zgodnie z protokołem wprowadzono również odpowiednie testy jednostkowe zapewniające domknięcie pętli mechaniki.
