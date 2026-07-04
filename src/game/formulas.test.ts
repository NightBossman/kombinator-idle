// [Claude] testy wspólnych wzorów (KIERUNEK 1.3) - pilnują, żeby mnożniki
// nie rozjechały się ponownie między silnikiem, symulacją offline i UI.
import { describe, it, expect } from 'vitest';
import { helperSpeedMult, businessProductionMult, queueTimeMs, cinkciarzRate, bazarPlnUnitPrice, bazarUsdUnitPrice, generalProductionMult, chfInstallmentPerSec, vatCarouselRefundPerSec, vatCarouselRiskGainPerSec, mordorIncomePerSec, mordorMoraleDecayPerSec, mordorEmployeeUpkeepPerSec, jdgRiskGainPerSec } from './formulas';
import { INITIAL_STATE } from '../hooks/useGameState';
import type { GameState } from '../hooks/useGameState';

const freshState = (patch: Partial<GameState> = {}): GameState => ({
  ...structuredClone(INITIAL_STATE),
  ...patch,
});

describe('wzory mnożników (formulas.ts)', () => {
  it('stan początkowy daje neutralne mnożniki', () => {
    const s = freshState();
    expect(generalProductionMult(s)).toBe(1);
    expect(helperSpeedMult(s)).toBe(1);
    expect(businessProductionMult(s, 'pln')).toBe(1);
    expect(queueTimeMs(1000, s)).toBe(1000);
  });

  it('helperSpeedMult: Grundig i Wilczek liczone tak samo jak w silniku', () => {
    const s = freshState({
      baltonaUpgrades: { grundig: true },
      activeEvent: 'reforma_wilczka',
    });
    expect(helperSpeedMult(s)).toBeCloseTo(1.4, 10);                          // offline: bez zdarzeń
    expect(helperSpeedMult(s, { zZdarzeniami: true })).toBeCloseTo(1.4 * 1.5, 10); // online: z Wilczkiem
  });

  it('businessProductionMult: Prywatny Import tylko dla PLN/USD, nie dla towarów', () => {
    const s = freshState({ baltonaUpgrades: { import: true } });
    expect(businessProductionMult(s, 'pln')).toBeCloseTo(1.35, 10);
    expect(businessProductionMult(s, 'dollars')).toBeCloseTo(1.35, 10);
    expect(businessProductionMult(s, 'gozdziki')).toBe(1);
  });

  it('queueTimeMs: modyfikatory kumulują się (Toblerone + Kryzys Paliwowy)', () => {
    const s = freshState({
      pewexItems: { ...structuredClone(INITIAL_STATE.pewexItems), toblerone: true },
      activeEvent: 'kryzys',
    });
    expect(queueTimeMs(10000, s)).toBeCloseTo(10000 * 0.85 * 1.20, 6);
  });

  it('cinkciarzRate: inflacja i Czarny Wtorek podbijają kurs', () => {
    const s = freshState({ exchangeRate: 100, inflationPercent: 100 });
    expect(cinkciarzRate(s)).toBe(200); // 100 zł * (1 + 100%)
    const wtorek = freshState({ exchangeRate: 100, inflationPercent: 0, activeEvent: 'czarny_wtorek' });
    expect(cinkciarzRate(wtorek)).toBe(200); // podwojenie z paniki
  });

  it('bazar: cena PLN rośnie przy Uwolnieniu Cen, cena USD celowo nie', () => {
    const zwykly = freshState();
    const uwolnienie = freshState({ activeEvent: 'uwolnienie_cen' });
    expect(bazarPlnUnitPrice(100, 'mydlo', uwolnienie)).toBe(Math.floor(bazarPlnUnitPrice(100, 'mydlo', zwykly) * 2.5));
    expect(bazarUsdUnitPrice(10, 'wyroby_hutnicze', uwolnienie)).toBe(bazarUsdUnitPrice(10, 'wyroby_hutnicze', zwykly));
  });

  it('chfInstallmentPerSec: calculates mortgage installment with advisor discount', () => {
    const s = freshState({ chfDebt: 1000000, bankAdvisors: 0 });
    // 1000000 * 0.0005 * 1.0 = 500
    expect(chfInstallmentPerSec(s)).toBe(500);

    const sDiscount = freshState({ chfDebt: 1000000, bankAdvisors: 2 });
    // 1000000 * 0.0005 * (1 - 0.30) = 350
    expect(chfInstallmentPerSec(sDiscount)).toBe(350);
  });

  it('vatCarouselRefundPerSec & vatCarouselRiskGainPerSec: calculates VAT refunds and risk correctly', () => {
    const s = freshState({
      vatCarouselActive: true,
      vatCompanies: [
        { id: 'c1', name: 'F1', goodsType: 'steel', capital: 1000000, isActive: true, status: 'trading' },
        { id: 'c2', name: 'F2', goodsType: 'fuel', capital: 500000, isActive: true, status: 'trading' }
      ]
    });
    // steel: turnover = 1M * 0.05 = 50k, refund = 11k
    // fuel: turnover = 500k * 0.20 = 100k, refund = 22k
    // Total turnover = 150k
    // Total refund = 33k
    expect(vatCarouselRefundPerSec(s)).toBeCloseTo(33000, 2);

    // steel risk = 0.1, fuel risk = 0.6. Total risk = 0.7
    // turnover mult = 1 + 150000 / 1000000 = 1.15
    // expected risk gain = 0.7 * 1.15 = 0.805
    expect(vatCarouselRiskGainPerSec(s)).toBeCloseTo(0.805, 4);
  });

  it('mordorIncomePerSec: calculates correct EUR income', () => {
    const s = freshState({ fazaWUnlocked: true, mordorEmployees: 10, mordorMorale: 100 });
    // 10 * 25 * 1.0 = 250 EUR/s
    expect(mordorIncomePerSec(s)).toBe(250);

    const sLowMorale = freshState({ fazaWUnlocked: true, mordorEmployees: 10, mordorMorale: 40 });
    // 10 * 25 * 0.4 = 100 EUR/s
    expect(mordorIncomePerSec(sLowMorale)).toBe(100);
  });

  it('mordorMoraleDecayPerSec: calculates decay with upgrades', () => {
    const s = freshState({ fazaWUnlocked: true, mordorEmployees: 5, mordorUpgrades: {} });
    expect(mordorMoraleDecayPerSec(s)).toBeCloseTo(0.5, 4);

    const sUpgrades = freshState({
      fazaWUnlocked: true,
      mordorEmployees: 5,
      mordorUpgrades: { owocowe_czwartki: true, multisport: true }
    });
    // 0.5 * 0.7 * 0.8 = 0.28
    expect(mordorMoraleDecayPerSec(sUpgrades)).toBeCloseTo(0.28, 4);
  });

  it('mordorEmployeeUpkeepPerSec: calculates PLN upkeep depending on tax level', () => {
    const s = freshState({ fazaWUnlocked: true, mordorEmployees: 10, jdgTaxOptimizationLevel: 0 });
    // 10 * 200 * 1.0 = 2000 PLN/s
    expect(mordorEmployeeUpkeepPerSec(s)).toBe(2000);

    const sOpt = freshState({ fazaWUnlocked: true, mordorEmployees: 10, jdgTaxOptimizationLevel: 2 });
    // 10 * 200 * 0.7 = 1400 PLN/s
    expect(mordorEmployeeUpkeepPerSec(sOpt)).toBe(1400);
  });

  it('jdgRiskGainPerSec: calculates risk gain depending on B2B contracts and tax level', () => {
    const s = freshState({ fazaWUnlocked: true, jdgContracts: 5, jdgTaxOptimizationLevel: 2 });
    // 5 * 0.05 * 1.0 = 0.25% per second
    expect(jdgRiskGainPerSec(s)).toBeCloseTo(0.25, 4);
  });
});

import { fmtNum, fmtShort, pluralPL } from '../utils/format';

describe('Format Utils (Polonizacja)', () => {
  it('formats numbers with spaces correctly', () => {
    // Note: pl-PL formatter might use non-breaking spaces (  or similar). 
    // We can just verify it replaces dots with commas and adds some space.
    const formatted = fmtNum(1234.56, 2);
    expect(formatted).toMatch(/1\s?234,56/);
  });

  it('formats short numbers correctly', () => {
    expect(fmtShort(1500000)).toMatch(/1,50\s?mln/);
    expect(fmtShort(20000)).toMatch(/20,0\s?tys\./);
  });

  it('pluralizes correctly in Polish', () => {
    expect(pluralPL(1, 'plik', 'pliki', 'plikow')).toBe('plik');
    expect(pluralPL(2, 'plik', 'pliki', 'plikow')).toBe('pliki');
    expect(pluralPL(4, 'plik', 'pliki', 'plikow')).toBe('pliki');
    expect(pluralPL(5, 'plik', 'pliki', 'plikow')).toBe('plikow');
    expect(pluralPL(12, 'plik', 'pliki', 'plikow')).toBe('plikow');
    expect(pluralPL(22, 'plik', 'pliki', 'plikow')).toBe('pliki');
  });
});
