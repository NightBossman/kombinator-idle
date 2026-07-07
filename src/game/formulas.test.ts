// [Claude] testy wspólnych wzorów (KIERUNEK 1.3) - pilnują, żeby mnożniki
// nie rozjechały się ponownie między silnikiem, symulacją offline i UI.
import { describe, it, expect } from 'vitest';
import { helperSpeedMult, businessProductionMult, queueTimeMs, cinkciarzRate, bazarPlnUnitPrice, bazarUsdUnitPrice, generalProductionMult, chfInstallmentPerSec, vatCarouselRefundPerSec, vatCarouselRiskGainPerSec, mordorIncomePerSec, mordorMoraleDecayPerSec, mordorEmployeeUpkeepPerSec, jdgRiskGainPerSec, seaSmuggleTime, seaSmuggleRisk, cryptoMiningYield, cryptoPowerUpkeepPln, aiTrainSpeed, knfRiskGrowthRate, wiborInstallmentPerSec, polishDealTaxPerSec, usRiskGrowthRate, energyPowerUpkeepPln, nbpInterestRateAffectingWibor, coiBondYieldPerSec, edoBondYieldPerSec, aiSaaSProfitUsdPerSec, aiSaaSProfitEurPerSec, milicjaBribeCost } from './formulas';
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

  it('milicjaBribeCost: zniżka Członka PZPR NIE znika po awansie na wyższą rangę', () => {
    const brak = freshState({ partyRank: null });
    const czlonek = freshState({ partyRank: 'czlonek' });
    const sekretarz = freshState({ partyRank: 'sekretarz' });
    const minister = freshState({ partyRank: 'minister' });
    expect(milicjaBribeCost(brak)).toBe(1000);      // bez partii - pełna cena
    expect(milicjaBribeCost(czlonek)).toBe(900);    // -10%
    expect(milicjaBribeCost(sekretarz)).toBe(900);  // nadal -10% (rangi kumulatywne) - to był bug
    expect(milicjaBribeCost(minister)).toBe(900);
  });

  it('milicjaBribeCost: zniżki się kumulują (ranga + odznaczenia + Solidarność)', () => {
    const s = freshState({ partyRank: 'czlonek', solidarnos: 6500, unlockedAchievements: { pol_bribe_1: true, pol_bribe_2: true } });
    // 1000 * 0.9 * 0.9 * 0.75 * 0.85 = 516.375 -> floor 516
    expect(milicjaBribeCost(s)).toBe(516);
  });

  it('jdgRiskGainPerSec: Przemówienie Draghi halves the Mordor risk gain', () => {
    const base = freshState({ fazaWUnlocked: true, jdgContracts: 5, jdgTaxOptimizationLevel: 2 });
    const draghi = freshState({ fazaWUnlocked: true, jdgContracts: 5, jdgTaxOptimizationLevel: 2, activeEvent: 'draghi_speech' });
    expect(jdgRiskGainPerSec(draghi)).toBeCloseTo(jdgRiskGainPerSec(base) * 0.5, 6);
  });

  it('seaSmuggleTime: calculates smuggling time with weather and upgrades', () => {
    const s1 = freshState({ seaState: 'storm' });
    expect(seaSmuggleTime(1000, s1)).toBe(1500);

    const s2 = freshState({ seaState: 'sailor_day', baltonaUpgrades: { marlboro: true } });
    expect(seaSmuggleTime(1000, s2)).toBe(1000 * 0.7 * 0.8);
  });

  it('seaSmuggleRisk: calculates smuggling risk with weather and upgrades', () => {
    const s1 = freshState({ seaState: 'lockdown', seaUpgrades: { zlom: true, celnicy: true } });
    // 20 + 40 - 5 - 15 = 40
    expect(seaSmuggleRisk(20, s1)).toBe(40);

    const s2 = freshState({ seaState: 'sailor_day', seaUpgrades: { celnicy: true } });
    // 20 - 10 - 15 = -5 => clamped to 0
    expect(seaSmuggleRisk(20, s2)).toBe(0);
  });

  it('cryptoMiningYield: calculates BTC mined correctly', () => {
    const s = freshState({ fazaXUnlocked: true, cryptoRigs: { rtx4090: 2, asic: 1 } });
    // 2 * 0.00005 + 1 * 0.00025 = 0.00035
    expect(cryptoMiningYield(s)).toBeCloseTo(0.00035, 6);
  });

  it('cryptoPowerUpkeepPln: calculates power cost with photovoltiac discount', () => {
    const s = freshState({ fazaXUnlocked: true, cryptoRigs: { rtx4090: 2, asic: 1 } });
    // (2 * 0.45 + 1 * 3.0) * 5 = 3.9 * 5 = 19.5 PLN/s
    expect(cryptoPowerUpkeepPln(s)).toBeCloseTo(19.5, 4);

    const sDiscount = freshState({ fazaXUnlocked: true, cryptoRigs: { rtx4090: 2, asic: 1 }, aiUpgrades: { fotowoltaika: true } });
    // 19.5 * 0.6 = 11.7 PLN/s
    expect(cryptoPowerUpkeepPln(sDiscount)).toBeCloseTo(11.7, 4);
  });

  it('aiTrainSpeed: calculates speed depending on PCs, prompt engineers, and framework', () => {
    const s = freshState({ fazaXUnlocked: true, isTrainingAi: true, aiComputers: 2, aiPromptEngineers: 3 });
    // 0.5 + 2 * 0.5 + 3 * 0.2 = 2.1%/s
    expect(aiTrainSpeed(s)).toBeCloseTo(2.1, 4);

    const sDiscount = freshState({ fazaXUnlocked: true, isTrainingAi: true, aiComputers: 2, aiPromptEngineers: 3, aiUpgrades: { nocod_framework: true } });
    // 2.1 * 1.5 = 3.15%/s
    expect(aiTrainSpeed(sDiscount)).toBeCloseTo(3.15, 4);
  });

  it('knfRiskGrowthRate: calculates KNF risk growth rate', () => {
    const s = freshState({ fazaXUnlocked: true, kmbTokensOwned: 1000 });
    expect(knfRiskGrowthRate(s)).toBeCloseTo(0.2, 4);

    const sDiscount = freshState({ fazaXUnlocked: true, kmbTokensOwned: 1000, aiUpgrades: { dubaj_shell: true } });
    expect(knfRiskGrowthRate(sDiscount)).toBeCloseTo(0.1, 4);
  });

  it('wiborInstallmentPerSec: calculates interest installment with holidays', () => {
    const s = freshState({ fazaYUnlocked: true, plnDebt: 10000000, wiborRate: 6.5, creditHolidaysTimer: 0 });
    // 10,000,000 * 0.085 * 0.0001 = 85 PLN/s
    expect(wiborInstallmentPerSec(s)).toBeCloseTo(85, 4);

    const sHols = freshState({ fazaYUnlocked: true, plnDebt: 10000000, wiborRate: 6.5, creditHolidaysTimer: 10 });
    expect(wiborInstallmentPerSec(sHols)).toBe(0);
  });

  it('polishDealTaxPerSec: calculates taxes depending on taxForm', () => {
    const sRyczalt = freshState({ fazaYUnlocked: true, taxForm: 'ryczalt' });
    expect(polishDealTaxPerSec(sRyczalt, 10000)).toBe(1200);

    const sLiniowy = freshState({ fazaYUnlocked: true, taxForm: 'liniowy' });
    expect(polishDealTaxPerSec(sLiniowy, 10000)).toBe(1900);

    const sSkalaLow = freshState({ fazaYUnlocked: true, taxForm: 'skala' });
    expect(polishDealTaxPerSec(sSkalaLow, 100000)).toBe(12000);

    const sSkalaHigh = freshState({ fazaYUnlocked: true, taxForm: 'skala' });
    // 120,000 * 0.12 + 30,000 * 0.32 = 14,400 + 9,600 = 24,000
    expect(polishDealTaxPerSec(sSkalaHigh, 150000)).toBe(24000);
  });

  it('usRiskGrowthRate: calculates US audit risk growth with accountants', () => {
    const s = freshState({ fazaYUnlocked: true, taxForm: 'skala', accountingOffices: 0 });
    expect(usRiskGrowthRate(s, 100000)).toBeCloseTo(100000 * 0.000001 * 1.5, 6);

    const sAcc = freshState({ fazaYUnlocked: true, taxForm: 'skala', accountingOffices: 2 });
    // 0.15 * 0.7 = 0.105
    expect(usRiskGrowthRate(sAcc, 100000)).toBeCloseTo(100000 * 0.000001 * 1.5 * 0.70, 6);
  });

  it('energyPowerUpkeepPln: calculates energy costs during crisis and with wind turbines', () => {
    const sBase = freshState({ fazaYUnlocked: true, fazaXUnlocked: true, fazaWUnlocked: true, cryptoRigs: { rtx4090: 2 }, mordorEmployees: 10, energyCrisisActive: false, windTurbines: 0 });
    // crypto cost = (2 * 0.45) * 5 = 4.5
    // office cost = 10 * 15 = 150
    // total = 154.5
    expect(energyPowerUpkeepPln(sBase)).toBeCloseTo(154.5, 4);

    const sCrisis = freshState({ fazaYUnlocked: true, fazaXUnlocked: true, fazaWUnlocked: true, cryptoRigs: { rtx4090: 2 }, mordorEmployees: 10, energyCrisisActive: true, windTurbines: 0 });
    // 154.5 * 3 = 463.5
    expect(energyPowerUpkeepPln(sCrisis)).toBeCloseTo(463.5, 4);

    const sTurbine = freshState({ fazaYUnlocked: true, fazaXUnlocked: true, fazaWUnlocked: true, cryptoRigs: { rtx4090: 2 }, mordorEmployees: 10, energyCrisisActive: true, windTurbines: 2 });
    // 463.5 * 0.75 * 0.75 = 260.71875
    expect(energyPowerUpkeepPln(sTurbine)).toBeCloseTo(260.71875, 4);
  });

  it('nbpInterestRateAffectingWibor: adds 1.5% margin to NBP rate', () => {
    expect(nbpInterestRateAffectingWibor(5.75)).toBeCloseTo(7.25, 4);
  });

  it('coiBondYieldPerSec & edoBondYieldPerSec: calculates yield based on inflation', () => {
    const s = freshState({ fazaZUnlocked: true, inflationPercent: 10, coiBondsPLN: 1000000, edoBondsPLN: 2000000 });
    
    // COI = 1,000,000 * ((10 + 1.5) / 100) / 60
    // 1M * 0.115 / 60 = 1916.666
    expect(coiBondYieldPerSec(s)).toBeCloseTo(1916.666, 2);
    
    // EDO = 2,000,000 * ((10 + 2.0) / 100) / 60
    // 2M * 0.12 / 60 = 4000
    expect(edoBondYieldPerSec(s)).toBeCloseTo(4000, 2);
    
    // deflation should clamp to 0 inflation base
    const sDeflation = freshState({ fazaZUnlocked: true, inflationPercent: -5, coiBondsPLN: 1000000, edoBondsPLN: 2000000 });
    // COI = 1M * (0 + 1.5)/100 / 60 = 250
    expect(coiBondYieldPerSec(sDeflation)).toBeCloseTo(250, 2);
  });

  it('aiSaaSProfitUsdPerSec & aiSaaSProfitEurPerSec: calculates SaaS profits', () => {
    const s = freshState({ fazaZUnlocked: true, aiSaaSActive: true, gpuClusters: 3 });
    expect(aiSaaSProfitUsdPerSec(s)).toBe(3000);
    expect(aiSaaSProfitEurPerSec(s)).toBe(1500);
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
