// [Claude] testy scalania zapisu (KIERUNEK 2) - pilnują zgodności starych zapisów
// z nowymi wersjami gry bez ręcznych linii "backward compat".
import { describe, it, expect } from 'vitest';
import { mergeSavedState, INITIAL_STATE, SAVE_VERSION } from './useGameState';

describe('mergeSavedState (wersjonowanie zapisu)', () => {
  it('pusty/uszkodzony zapis daje stan początkowy z bieżącą wersją', () => {
    const s = mergeSavedState(null);
    expect(s.pln).toBe(INITIAL_STATE.pln);
    expect(s.saveVersion).toBe(SAVE_VERSION);
    // klon, nie współdzielenie - mutacja stanu nie może zepsuć INITIAL_STATE
    s.stats.totalPlnEarned = 999;
    expect(INITIAL_STATE.stats.totalPlnEarned).toBe(5);
  });

  it('stary częściowy zapis: wartości gracza zostają, brakujące pola dostają domyślne', () => {
    const s = mergeSavedState({
      pln: 12345,
      inventory: { papier: 7, polonez: 2 },      // polonez = klucz dynamiczny spoza INITIAL_STATE
      stats: { totalPlnEarned: 500 },            // reszta statystyk ma się uzupełnić
    });
    expect(s.pln).toBe(12345);
    expect(s.inventory['papier']).toBe(7);
    expect(s.inventory['polonez']).toBe(2);      // dynamiczne klucze przeżywają scalanie
    expect(s.inventory['mydlo']).toBe(0);        // domyślna wartość dołożona
    expect(s.stats.totalPlnEarned).toBe(500);
    expect(s.stats.totalItemsSold).toBe(0);      // domyślna statystyka dołożona
    expect(s.recessionActive).toBe(false);       // pole z późniejszej fazy dostaje domyślne
    expect(s.saveVersion).toBe(SAVE_VERSION);
  });

  it('martwe pola z bardzo starych zapisów wypadają na poziomie najwyższym', () => {
    const s = mergeSavedState({ pln: 1, unlockedCocomNodes: { warszawa: true } });
    expect('unlockedCocomNodes' in s).toBe(false);
  });

  it('dynamiczne rekordy zagnieżdżone (spółki, akcje) zostają w całości', () => {
    const s = mergeSavedState({
      nomenklaturaCompanies: { huta: { registered: true, assetLevel: 3, directorCount: 2, twAssigned: true } },
      sharesOwned: { kghm: 150 },
    });
    expect(s.nomenklaturaCompanies['huta'].assetLevel).toBe(3);
    expect(s.sharesOwned['kghm']).toBe(150);
  });

  it('null jako świadoma wartość gracza wygrywa z domyślną', () => {
    const s = mergeSavedState({ partyRank: null, activeDestination: 'usa' });
    expect(s.partyRank).toBeNull();
    expect(s.activeDestination).toBe('usa');
  });

  it('Telegram PAP: sam wysoki kapitał NIE odblokowuje zdarzeń przy wczytaniu (wymóg 10 minut pilnuje silnik)', () => {
    // [Claude] regresja: dawna łata wymuszała eventsUnlocked=true, gdy pln>=100000, omijając 10-min próg
    const s = mergeSavedState({ pln: 5000000, eventsUnlocked: false });
    expect(s.eventsUnlocked).toBe(false);
  });

  it('Telegram PAP: stary zapis w późnej fazie odzyskuje odblokowanie (siatka bezpieczeństwa)', () => {
    const s = mergeSavedState({ fazaSUnlocked: true, eventsUnlocked: false });
    expect(s.eventsUnlocked).toBe(true);
  });
});
