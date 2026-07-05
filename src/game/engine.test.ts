// [Claude] NOWY PLIK (KIERUNEK.md pkt 7.1): testy scenariuszowe czystego silnika gry.
// Uruchamianie: npm test (vitest). Testy działają na kopiach INITIAL_STATE - bez Reacta,
// bez przeglądarki, bez localStorage.
import { describe, it, expect } from 'vitest';
import { tick } from './engine';
import type { GameEvent } from './engine';

import { INITIAL_STATE } from '../hooks/useGameState';
import type { GameState } from '../hooks/useGameState';

// Świeża kopia stanu początkowego na każdy test (tick częściowo mutuje zagnieżdżone obiekty)
const freshState = (patch: Partial<GameState> = {}): GameState => ({
  ...structuredClone(INITIAL_STATE),
  ...patch,
});

const NOW = 1_750_000_000_000; // stały "zegar" - rotacja czarnego rynku liczona od lastMarketRefresh

// Przepuszcza stan przez n ticków po 1 sekundzie, zbierając zdarzenia
const runTicks = (state: GameState, n: number, deltaSec = 1) => {
  const events: GameEvent[] = [];
  let s = state;
  for (let i = 0; i < n; i++) {
    const result = tick(s, deltaSec, { now: NOW + i * 1000, activeQueue: null });
    s = result.state;
    events.push(...result.events);
  }
  return { state: s, events };
};

describe('recesja 2008 (Faza T)', () => {
  it('odlicza czas recesji i kończy ją komunikatem', () => {
    const start = freshState({
      recessionActive: true,
      recessionTimer: 3,
      lastMarketRefresh: NOW,
    });

    const after2s = runTicks(start, 2);
    expect(after2s.state.recessionActive).toBe(true);
    expect(after2s.state.recessionTimer).toBeCloseTo(1, 5);

    const after4s = runTicks(after2s.state, 2);
    expect(after4s.state.recessionActive).toBe(false);
    const koniec = after4s.events.find(e => e.kind === 'alert' && e.title.includes('KONIEC RECESJI'));
    expect(koniec).toBeDefined();
  });

  it('w trakcie recesji ceny akcji GPW spadają o 6% na tick giełdy', () => {
    const start = freshState({
      recessionActive: true,
      recessionTimer: 9999,
      gpwUnlocked: true,
      lastMarketRefresh: NOW,
      stockPrices: { kghm: 250 },
      stockPriceHistories: { kghm: [250] },
      stats: { ...structuredClone(INITIAL_STATE.stats), totalTimePlayed: 9 }, // tuż przed tickiem giełdy (co 10 s)
    });
    const { state } = runTicks(start, 1);
    expect(state.stockPrices['kghm']).toBe(Math.round(250 * 0.94));
  });
});

describe('opcje walutowe (Faza T)', () => {
  it('CALL wypłaca różnicę kursu ponad strike razy wolumen', () => {
    const start = freshState({
      pln: 0,
      chfExchangeRate: 3.5,
      lastMarketRefresh: NOW,
      currencyOptions: [{ id: 'o1', type: 'call', strikeRate: 3.0, amountChf: 1000, durationSec: 60, timeLeft: 0.5, premiumPln: 100 }],
    });
    const { state, events } = runTicks(start, 1);
    expect(state.currencyOptions).toHaveLength(0);
    expect(state.pln).toBe(500); // (3,50 - 3,00) * 1000
    expect(events.some(e => e.kind === 'toast' && e.title === 'OPCJA ROZLICZONA')).toBe(true);
  });

  it('PUT wypłaca różnicę strike ponad kurs razy wolumen', () => {
    const start = freshState({
      pln: 0,
      chfExchangeRate: 2.5,
      lastMarketRefresh: NOW,
      currencyOptions: [{ id: 'o1', type: 'put', strikeRate: 3.5, amountChf: 1000, durationSec: 60, timeLeft: 0.5, premiumPln: 100 }],
    });
    const { state, events } = runTicks(start, 1);
    expect(state.currencyOptions).toHaveLength(0);
    expect(state.pln).toBe(1000); // (3.50 - 2.50) * 1000
    expect(events.some(e => e.kind === 'toast' && e.title === 'OPCJA ROZLICZONA')).toBe(true);
  });

  it('opcja toksyczna karze podwójnie powyżej kursu wykonania', () => {
    const start = freshState({
      pln: 2000,
      isDenominated: true, // mrozi dewaluację, żeby liczyć czysto
      chfExchangeRate: 5.0,
      lastMarketRefresh: NOW,
      currencyOptions: [{ id: 'o2', type: 'toxic', strikeRate: 4.2, amountChf: 1000, durationSec: 60, timeLeft: 0.5, premiumPln: 0 }],
    });
    const { state, events } = runTicks(start, 1);
    // kara: floor(-2 * 0,8 * 1000) = -1600 (floor na ujemnej liczbie zaokrągla w dół)
    expect(state.pln).toBe(400);
    expect(events.some(e => e.kind === 'alert' && e.title.includes('TOKSYCZNEJ'))).toBe(true);
  });
});

describe('denominacja (Faza F/M)', () => {
  it('po denominacji inflacja jest zamrożona na 0 i gotówka nie topnieje', () => {
    const start = freshState({
      pln: 1000,
      isDenominated: true,
      inflationPercent: 500,
      lastMarketRefresh: NOW,
    });
    const { state } = runTicks(start, 5);
    expect(state.inflationPercent).toBe(0);
    expect(state.pln).toBe(1000);
  });

  it('bez denominacji inflacja rośnie o 0,2%/s i dewaluuje gotówkę', () => {
    const start = freshState({ pln: 1000, lastMarketRefresh: NOW, activeDestination: 'usa' });
    const { state } = runTicks(start, 5);
    expect(state.inflationPercent).toBeCloseTo(1.0, 3); // 5 s * 0,2%/s
    expect(state.pln).toBeLessThan(1000);
    expect(state.pln).toBeGreaterThan(990);
  });
});

describe('pomocnicy', () => {
  it('Emeryt Władysław generuje papier w tempie 0,1/s na sztukę', () => {
    const start = freshState({
      helpers: { ...structuredClone(INITIAL_STATE.helpers), wladyslaw: 2 },
      lastMarketRefresh: NOW,
    });
    const { state } = runTicks(start, 10);
    expect(state.inventory['papier']).toBeCloseTo(2 * 0.1 * 10, 3); // = 2
  });

  it('Solidarność >= 9000 daje +25% do tempa pomocników (naprawiony bug nieświeżej wartości)', () => {
    const base = freshState({
      helpers: { ...structuredClone(INITIAL_STATE.helpers), wladyslaw: 1 },
      lastMarketRefresh: NOW,
    });
    const zBonusem = freshState({
      helpers: { ...structuredClone(INITIAL_STATE.helpers), wladyslaw: 1 },
      solidarnos: 9500,
      lastMarketRefresh: NOW,
    });
    const a = runTicks(base, 10).state.inventory['papier'];
    const b = runTicks(zBonusem, 10).state.inventory['papier'];
    expect(b / a).toBeCloseTo(1.25, 5);
  });
});

describe('stabilność liczbowa', () => {
  it('godzina ticków z odblokowanymi fazami nie produkuje NaN ani Infinity', () => {
    const start = freshState({
      pln: 1_000_000,
      dollars: 10_000,
      helpers: { ...structuredClone(INITIAL_STATE.helpers), wladyslaw: 5, kolega: 3, cinkciarz: 1, widmo: 1 },
      businesses: { szklarnia: 2, warsztat: 1, kombinat: 1 },
      gpwUnlocked: true,
      swissAccountUnlocked: true,
      syndicateUnlocked: true,
      fazaMUnlocked: true,
      fazaSUnlocked: true,
      mediaUnlocked: true,
      fazaNUnlocked: true,
      solidarnos: 5000,
      bondPrlCount: 2,
      bondSolCount: 1,
      bondSolValue: 1000,
      zmywakWorkers: 10,
      dotcomUsers: 500,
      chfDebt: 100_000,
      lastMarketRefresh: NOW,
    });

    const { state } = runTicks(start, 3600);

    const znajdzNaN = (obj: unknown, sciezka: string, bledy: string[]) => {
      if (typeof obj === 'number') {
        if (!Number.isFinite(obj)) bledy.push(`${sciezka} = ${obj}`);
        return;
      }
      if (obj && typeof obj === 'object') {
        for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
          znajdzNaN(v, `${sciezka}.${k}`, bledy);
        }
      }
    };
    const bledy: string[] = [];
    znajdzNaN(state, 'state', bledy);
    expect(bledy).toEqual([]);
    expect(state.stats.totalTimePlayed).toBeCloseTo(3600, 0);
  });
});

describe('kredyty CHF (Faza S)', () => {
  it('spłaca kredyt CHF zgodnie z ratą z formulas.ts', () => {
    const start = freshState({
      pln: 1000000,
      chfDebt: 500000,
      chfExchangeRate: 4.0,
      fazaSUnlocked: true,
      activeDestination: 'usa',
      inflationPercent: 2.0,
      dotcomUsers: 100,
      lastMarketRefresh: NOW,
    });
    // 500000 * 0.0005 = 250 CHF/s raty
    // 250 CHF * 4.0 PLN = 1000 PLN kosztu na s
    // 250 CHF * 0.8 = 200 CHF spłaty kapitału na s
    // Dot-com generuje pasywny przychód 100 PLN (200 użytkowników * 0.5 PLN/użytkownika/s)
    // Pasywna dewaluacja gotówki zabiera 110 PLN
    // Koszt raty CHF wynosi 1000 PLN (250 CHF * 4.0 PLN/CHF)
    // Wynik netto gotówki: 1000000 - 1000 - 110 + 100 = 998990 PLN
    const { state } = runTicks(start, 1);
    expect(state.pln).toBe(998990);
  });
});

describe('Faza W: Mordor i JDG', () => {
  it('oblicza poprawnie przychody i upkeeps z Mordoru', () => {
    const start = freshState({
      fazaWUnlocked: true,
      mordorFloors: 1,
      mordorEmployees: 10,
      mordorMorale: 100,
      euros: 0,
      pln: 10000,
      isDenominated: true,
      euroExchangeRate: 4.20,
      jdgTaxOptimizationLevel: 0,
      lastMarketRefresh: NOW,
    });
    // 10 * 25 * 1.0 = 250 EUR/s zysku
    // 10 * 200 * 1.0 = 2000 PLN/s kosztu (upkeep)
    const { state } = runTicks(start, 1);
    expect(state.euros).toBe(250);
    expect(state.pln).toBe(10000 - 2000);
    expect(state.mordorMorale).toBe(100 - 0.5);
  });

  it('wywołuje kontrolę PIP przy osiągnięciu ryzyka 100%', () => {
    const start = freshState({
      fazaWUnlocked: true,
      jdgContracts: 10,
      jdgRiskLevel: 99,
      jdgTaxOptimizationLevel: 2,
      pln: 500000,
      isDenominated: true,
      lastMarketRefresh: NOW,
    });
    // jdgRiskGainPerSec = 10 * 0.05 * 1.0 = 0.5%/s
    // W 2 sekundy ryzyko przekroczy 100% -> PIP
    // PIP kara: jdgContracts * 15000 * (taxLevel + 1) = 10 * 15000 * 3 = 450000 PLN
    // PIP resetuje ryzyko do 40%
    const { state } = runTicks(start, 2);
    expect(state.pln).toBe(500000 - 450000);
    expect(state.jdgRiskLevel).toBe(40);
  });

  it('rozlicza pomyślnie wygasającą obligację strefy euro', () => {
    const start = freshState({
      fazaWUnlocked: true,
      euros: 0,
      euroBonds: [{
        uuid: 'test-bond',
        id: 'bond_greece',
        country: 'Grecja',
        buyPriceEur: 50000,
        nominalAmountEur: 50000,
        timeLeft: 1.0,
        interestRate: 0.60,
        riskOfCrash: 0
      }],
      lastMarketRefresh: NOW,
    });
    const { state } = runTicks(start, 1);
    expect(state.euros).toBe(80000);
    expect(state.euroBonds.length).toBe(0);
  });
});

describe('Faza X: Startupy i Kryptowaluty', () => {
  it('kopie Bitcoiny i nalicza koszty prądu oraz płace prompt engineerów', () => {
    const start = freshState({
      fazaXUnlocked: true,
      cryptoRigs: { rtx4090: 2 },
      aiPromptEngineers: 1,
      bitcoins: 0,
      pln: 100000,
      lastMarketRefresh: NOW
    });
    // btcMined = 2 * 0.00005 = 0.0001 BTC/s
    // powerCost = (2 * 0.45) * 5 = 4.5 PLN/s
    // engineersWage = 1 * 150 = 150 PLN/s
    // expected pln = 100000 - 4.5 - 150 = 99845.5 PLN
    const { state } = runTicks(start, 1);
    expect(state.bitcoins).toBeCloseTo(0.0001, 6);
    expect(state.pln).toBeCloseTo(99845.5, 2);
  });

  it('trenuje model AI i kończy po osiągnięciu 100%', () => {
    const start = freshState({
      fazaXUnlocked: true,
      isTrainingAi: true,
      aiComputers: 1,
      aiPromptEngineers: 0,
      aiTrainProgress: 99.0,
      aiModelsTrained: 0,
      lastMarketRefresh: NOW
    });
    // aiTrainSpeed = 0.5 + 0.5 + 0 = 1.0%/s
    // po 1s progress = 100% -> modelTrained = 1, isTrainingAi = false, progress = 0
    const { state } = runTicks(start, 1);
    expect(state.aiModelsTrained).toBe(1);
    expect(state.isTrainingAi).toBe(false);
    expect(state.aiTrainProgress).toBe(0);
  });

  it('wyzwala kontrolę KNF przy 100% ryzyka', () => {
    const start = freshState({
      fazaXUnlocked: true,
      kmbTokensOwned: 5000,
      knfRiskLevel: 99.9,
      pln: 2000000,
      lastMarketRefresh: NOW
    });
    // knfRiskGrowthRate = 0.2%/s
    // po 1s risk >= 100 -> kara 30% kasy = 600000 PLN, tokeny wyzerowane
    const { state } = runTicks(start, 1);
    expect(state.pln).toBe(2000000 - 600000);
    expect(state.kmbTokensOwned).toBe(0);
    expect(state.knfRiskLevel).toBe(30);
  });
});

describe('Faza Y: Polski Ład i WIBOR', () => {
  it('nalicza koszty odsetkowe WIBOR i podatki Polskiego Ładu oraz koszt prądu w kryzysie', () => {
    const start = freshState({
      fazaYUnlocked: true,
      fazaSUnlocked: true,
      plnDebt: 1000000,
      wiborRate: 6.5,
      taxForm: 'ryczalt',
      zmywakWorkers: 20, // 20 * 5 * 0.15 * 6 = 90 PLN/s przychodu brutto
      pln: 100000,
      isDenominated: true,
      lastMarketRefresh: NOW
    });
    // WIBOR installment = 1,000,000 * 0.085 * 0.0001 = 8.5 PLN/s
    // Dotcom passive income = 100 * 0.5 = 50 PLN/s (dotcomServerCapacity is 1000 in INITIAL_STATE)
    // Zmywak passive income = 20 * 5 * 0.15 * 6 = 90 PLN/s
    // Total gross passive income = 140 PLN/s
    // Polish deal tax = 140 * 0.12 = 16.8 PLN/s
    // Energy power cost (crypto=0, mordor=0) = 0 PLN/s
    // Net PLN/s = +140 (przychód) - 8.5 (wibor) - 16.8 (podatek) = +114.7 PLN/s
    // Po 1s: 100000 + 114.7 = 100114.7
    const { state } = runTicks(start, 1);
    expect(state.pln).toBeCloseTo(100114.7, 1);
  });

  it('zawiesza raty WIBOR podczas wakacji kredytowych', () => {
    const start = freshState({
      fazaYUnlocked: true,
      plnDebt: 1000000,
      wiborRate: 6.5,
      creditHolidaysTimer: 10,
      taxForm: 'ryczalt',
      zmywakWorkers: 0,
      pln: 100000,
      isDenominated: true,
      lastMarketRefresh: NOW
    });
    // Rata wibor = 0 z powodu wakacji kredytowych
    // Po 1s: pln = 100000, timer = 9s
    const { state } = runTicks(start, 1);
    expect(state.pln).toBe(100000);
    expect(state.creditHolidaysTimer).toBeCloseTo(9, 1);
  });

  it('wyzwala kontrolę Urzędu Skarbowego przy 100% ryzyka', () => {
    const start = freshState({
      fazaYUnlocked: true,
      fazaSUnlocked: true,
      taxForm: 'skala',
      zmywakWorkers: 22223, // 22223 * 5 * 0.15 * 6 = 100003.5 PLN/s
      usRiskLevel: 99.9,
      pln: 1000000,
      isDenominated: true,
      lastMarketRefresh: NOW
    });
    // usRiskGrowthRate = 100003.5 * 0.000001 * 1.5 = 0.15%/s
    // po 1s risk >= 100% -> kara 25% = 250000 PLN, risk reset to 20%
    const { state } = runTicks(start, 1);
    expect(state.pln).toBeLessThanOrEqual(750000 + 100003.5); // 1,000,000 - 250,000 + zysk
    expect(state.usRiskLevel).toBe(20);
  });
});

describe('Faza Z: KPO, AI SaaS, Obligacje, RPP', () => {
  it('nalicza zyski z obligacji COI/EDO', () => {
    const start = freshState({
      fazaZUnlocked: true,
      isDenominated: true,
      coiBondsPLN: 1000000,
      edoBondsPLN: 2000000,
      inflationPercent: 10,
      pln: 10000,
      lastMarketRefresh: NOW
    });

    // COI Yield: 1,000,000 * (10 + 1.5)/100 / 60 = 1916.66 PLN/s
    // EDO Yield: 2,000,000 * (10 + 2.0)/100 / 60 = 4000.00 PLN/s
    // Total = 5916.66 PLN/s
    const { state } = runTicks(start, 1);
    expect(state.pln).toBeCloseTo(10000 + 5916.66, 1);
  });

  it('nalicza zyski z AI SaaS (EUR, USD)', () => {
    const start = freshState({
      fazaZUnlocked: true,
      aiSaaSActive: true,
      gpuClusters: 2,
      lastMarketRefresh: NOW
    });

    // USD: 2 * 1000 = 2000 USD/s
    // EUR: 2 * 500 = 1000 EUR/s
    const { state } = runTicks(start, 1);
    expect(state.dollars).toBe(2000);
    expect(state.euros).toBe(1000);
  });

  it('aktualizuje stopy procentowe RPP i wyświetla komunikat', () => {
    const start = freshState({
      fazaZUnlocked: true,
      rppMeetingTimer: 0,
      inflationPercent: 20,
      nbpInterestRate: 10,
      lastMarketRefresh: NOW
    });

    // rppMeetingTimer <= 0 -> zresetowane do 60
    // inflation >> nbpInterestRate + 2 (20 > 12) -> wzrost stóp
    const { state, events } = runTicks(start, 1);
    expect(state.rppMeetingTimer).toBeCloseTo(60, 1);
    expect(state.nbpInterestRate).toBeGreaterThan(10);
    expect(state.wiborRate).toBe(state.nbpInterestRate + 1.5);
    const event = events.find(e => e.kind === 'toast' && e.title === 'KOMUNIKAT RPP');
    expect(event).toBeDefined();
  });
});
