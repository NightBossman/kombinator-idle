// [Claude] NOWY PLIK (KIERUNEK.md pkt 1.3): wspólne wzory mnożników w jednym miejscu.
// Powód: te same wzory były skopiowane w 3-4 miejscach (pętla gry w engine.ts, symulacja
// offline w useGameState.ts, panel Casio i bazar w App.tsx) i ZDĄŻYŁY się rozjechać:
//  - Casio nie uwzględniał Magnetofonu Grundig (+40% pomocników), Prywatnego Importu ani
//    Ustawy Wilczka - pokazywał zaniżone tempo produkcji;
//  - kurs cinkciarza w Casio nie uwzględniał inflacji ani Czarnego Wtorku;
//  - bazar w dolarach OBIECYWAŁ na przycisku bonus z Uwolnienia Cen, którego mechanika
//    (sellItemDollars) nigdy nie wypłacała.
// Teraz każdy wzór ma jedno źródło prawdy, a wyświetlane wartości = faktyczna mechanika.
//
// Konwencja: opcja { zZdarzeniami: true } dolicza bonusy aktywnych zdarzeń historycznych
// (np. Ustawa Wilczka). Pętla gry i UI podają true; symulacja offline NIE podaje
// (zdarzenia celowo nie działają, gdy gra jest wyłączona - tak było od zawsze).

import type { GameState } from '../hooks/useGameState';
import { LUXURY_ITEMS, VAT_GOODS, JDG_TAX_LEVELS } from './items';

export interface FormulaOpts {
  zZdarzeniami?: boolean;
}

/** Mnożnik ogólnej produkcji: prestiż NRF (+10%/DM) x Nowa Gra+ (od 5. pętli +5%/pętlę). */
export const generalProductionMult = (s: GameState): number => {
  const nrfMult = (s.activeDestination === 'nrf' || s.activeDestination === null)
    ? (1 + (s.prestigePoints * 0.10))
    : 1.0;
  const ngPlusCount = s.prestigeCount || 0;
  const ngPlusMult = ngPlusCount >= 5 ? 1 + (ngPlusCount - 4) * 0.05 : 1.0;
  return nrfMult * ngPlusMult;
};

/** Tempo pomocników: Lego, Sanyo, Grundig, produkcja ogólna, ruble, odznaczenia,
 *  Solidarność >= 9000, opcjonalnie Ustawa Wilczka. */
export const helperSpeedMult = (s: GameState, opts: FormulaOpts = {}): number => {
  const rubleMult = 1 + (s.ruble * 0.005);
  const helperSpeedAchMult = (s.unlockedAchievements?.['pres_points'] ? 1.10 : 1)
    * (s.unlockedAchievements?.['pol_rank_4'] ? 1.25 : 1);
  const baltonaGrundigMult = s.baltonaUpgrades?.['grundig'] ? 1.4 : 1.0;
  const solidarityMult = s.solidarnos >= 9000 ? 1.25 : 1.0;
  const wilczekMult = (opts.zZdarzeniami && s.activeEvent === 'reforma_wilczka') ? 1.5 : 1.0;
  return (s.pewexItems['lego'] ? 1.3 : 1)
    * (s.pewexItems['sanyo'] ? 1.5 : 1)
    * baltonaGrundigMult
    * generalProductionMult(s)
    * rubleMult
    * helperSpeedAchMult
    * solidarityMult
    * wilczekMult;
};

/** Tempo biznesów (szklarnia/warsztat/kombinat): Rubin, Biuro Polityczne, odznaczenie
 *  walutowe, Transformacja, produkcja ogólna, Prywatny Import (tylko PLN/USD),
 *  opcjonalnie Ustawa Wilczka. */
export const businessProductionMult = (s: GameState, generateType: string, opts: FormulaOpts = {}): number => {
  const rubinMult = s.pewexItems['rubin'] ? 2.0 : 1.0;
  const biuroMult = s.partyRank === 'biuro' ? 3.0 : 1.0;
  const businessAchMult = s.unlockedAchievements?.['eco_usd_1'] ? 1.10 : 1;
  const transformMult = s.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
  const importMult = (s.baltonaUpgrades?.['import'] && (generateType === 'pln' || generateType === 'dollars')) ? 1.35 : 1.0;
  const wilczekMult = (opts.zZdarzeniami && s.activeEvent === 'reforma_wilczka') ? 1.5 : 1.0;
  return rubinMult * biuroMult * businessAchMult * transformMult * generalProductionMult(s) * importMult * wilczekMult;
};

/** Czas stania w kolejce po modyfikatorach: Toblerone, Kożuch, Cola, Maluch, Kawa Jacobs,
 *  Kryzys Paliwowy, Austria, Solidarność-Łącznik, odznaczenia kolejkowe. */
export const queueTimeMs = (baseMs: number, s: GameState): number => {
  let t = baseMs;
  if (s.pewexItems['toblerone']) t *= 0.85;
  if (s.plnUpgrades['kozuch']) t *= 0.90;
  if (s.pewexItems['cola']) t *= 0.8;
  if (s.pewexItems['maluch']) t *= 0.6;
  if (s.baltonaUpgrades?.['jacobs']) t *= 0.90;
  if (s.activeEvent === 'kryzys') t *= 1.20;          // Kryzys Paliwowy: +20% czasu
  if (s.activeDestination === 'austria') t *= 0.90;   // Austria: -10% czasu
  if (s.solidarnos >= 2000) t *= 0.95;                // Łącznik: -5% czasu
  const achMult = (s.unlockedAchievements?.['eco_queue_1'] ? 0.95 : 1)
    * (s.unlockedAchievements?.['eco_queue_2'] ? 0.85 : 1);
  return t * achMult;
};

/** Kurs cinkciarza (zł za 1$): Drożyzna +30%, odznaczenia i Sympatyk Solidarności obniżają,
 *  inflacja podbija, Czarny Wtorek podwaja. inflationPercent można nadpisać (silnik podaje
 *  wartość z bieżącego ticku). */
export const cinkciarzRate = (s: GameState, inflationPercent: number = s.inflationPercent): number => {
  const baseRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
  const solidarityBonus = s.solidarnos >= 1000 ? 0.95 : 1.0;
  const achRateMult = (s.unlockedAchievements?.['eco_cinkciarz_1'] ? 0.98 : 1)
    * (s.unlockedAchievements?.['eco_cinkciarz_2'] ? 0.95 : 1)
    * solidarityBonus;
  let inflationMult = 1 + ((inflationPercent || 0) / 100);
  if (s.activeEvent === 'czarny_wtorek') inflationMult *= 2;
  return Math.floor(baseRate * achRateMult * inflationMult);
};

// Wspólna część mnożnika bazarowego (Pewex + zdarzenia obniżające)
const bazarBaseMult = (s: GameState): number => {
  let m = 1;
  if (s.pewexItems['donald']) m *= 1.15;
  if (s.pewexItems['wrangler']) m *= 1.5;
  if (s.pewexItems['rubin']) m *= 2.0;
  if (s.activeEvent === 'czarnobyl') m *= 0.7; // Czarnobyl: -30% wartości sprzedaży
  return m;
};

const peklimaxMult = (s: GameState, itemId: string): number =>
  (s.baltonaUpgrades?.['peklimax'] && (itemId === 'gozdziki' || itemId === 'czesci' || itemId === 'wyroby_hutnicze')) ? 1.40 : 1.0;

/** Cena JEDNEJ sztuki na Bazarze w złotówkach (zaokrąglona w dół) - to, co widnieje na
 *  przycisku i DOKŁADNIE to, co wypłaca sprzedaż (x1/x10/x100 = wielokrotność ceny sztuki). */
export const bazarPlnUnitPrice = (basePricePln: number, itemId: string, s: GameState): number => {
  let multiplier = bazarBaseMult(s);
  if (s.activeEvent === 'uwolnienie_cen') multiplier *= 2.5; // Uwolnienie Cen: +150% na Bazarze
  const ecoPlnMult = 1 + (s.unlockedAchievements?.['eco_pln_1'] ? 0.05 : 0)
    + (s.unlockedAchievements?.['eco_pln_2'] ? 0.10 : 0)
    + (s.unlockedAchievements?.['eco_pln_3'] ? 0.20 : 0);
  const presTimeMult = 1 + (s.unlockedAchievements?.['pres_time_1'] ? 0.10 : 0)
    + (s.unlockedAchievements?.['pres_time_2'] ? 0.25 : 0);
  const transformMult = s.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
  const solidarityBazarMult = s.solidarnos >= 500 ? 1.05 : 1.0;
  const importMult = s.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
  const inflationFactor = 1 + (s.inflationPercent / 100);
  return Math.floor(basePricePln * multiplier * ecoPlnMult * presTimeMult * transformMult
    * solidarityBazarMult * importMult * peklimaxMult(s, itemId) * inflationFactor);
};

/** Cena JEDNEJ sztuki na Bazarze w dolarach (zaokrąglona w dół). Celowo BEZ bonusu
 *  Uwolnienia Cen - mechanika sprzedaży USD nigdy go nie wypłacała, a stary przycisk
 *  błędnie go obiecywał. */
export const bazarUsdUnitPrice = (basePriceUsd: number, itemId: string, s: GameState): number => {
  const importMult = s.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
  return Math.floor(basePriceUsd * bazarBaseMult(s) * importMult * peklimaxMult(s, itemId));
};

/** Suma premii prestizu (DM) z posiadanych towarow luksusowych. Przeniesione z App.tsx
 *  (KIERUNEK 1.2), zeby komponenty zakladek mogly importowac bez cyklu. */
export const calculateLuxuryPrestigeBonus = (ownedLuxuryItems: Record<string, boolean> | undefined): number => {
  let bonus = 0;
  LUXURY_ITEMS.forEach(item => {
    if (ownedLuxuryItems?.[item.id]) {
      bonus += item.prestigeMult;
    }
  });
  return bonus;
};


/** Koszt deweloperki: rośnie o 15% z każdą kolejną inwestycją tego samego typu. */
export const realEstateCostPln = (baseCost: number, count: number): number => baseCost * Math.pow(1.15, count);

/** Czas budowy deweloperki: rośnie o 10% z każdą kolejną inwestycją tego samego typu. */
export const realEstateBuildTimeSec = (baseTime: number, count: number): number => baseTime * Math.pow(1.10, count);

/** Rata kredytu w CHF na sekundę: 0.05% długu na sekundę * zniżka doradców. */
export const chfInstallmentPerSec = (s: GameState): number => {
  if (s.chfDebt <= 0) return 0;
  const advisorDiscount = 1 - (s.bankAdvisors || 0) * 0.15;
  return s.chfDebt * 0.0005 * advisorDiscount;
};

/** Przychód z karuzeli VAT (zwrot VAT) na sekundę. */
export const vatCarouselRefundPerSec = (s: GameState): number => {
  if (!s.vatCarouselActive || s.prisonSentenceRemaining > 0) return 0;
  let totalTurnover = 0;
  (s.vatCompanies || []).forEach(comp => {
    if (comp.isActive && comp.status === 'trading') {
      const goods = VAT_GOODS.find(g => g.type === comp.goodsType);
      if (goods) {
        totalTurnover += comp.capital * goods.turnoverMult;
      }
    }
  });
  return totalTurnover * 0.22;
};

/** Przyrost ryzyka kontroli skarbowej w karuzeli VAT na sekundę. Scales with turnover. */
export const vatCarouselRiskGainPerSec = (s: GameState): number => {
  if (!s.vatCarouselActive || s.prisonSentenceRemaining > 0) return 0;
  let totalTurnover = 0;
  let totalRisk = 0;
  (s.vatCompanies || []).forEach(comp => {
    if (comp.isActive && comp.status === 'trading') {
      const goods = VAT_GOODS.find(g => g.type === comp.goodsType);
      if (goods) {
        totalTurnover += comp.capital * goods.turnoverMult;
        totalRisk += goods.riskPerSec;
      }
    }
  });

  if (totalRisk <= 0) return 0;

  let riskMult = 1.0;
  if (s.vatUpgrades?.['slup_podlasie']) riskMult *= 0.7;
  if (s.vatUpgrades?.['naczelnik_us']) riskMult *= 0.7;

  // Skalowanie: każdy milion obrotu na sekundę zwiększa tempo ryzyka o 100%
  const turnoverScaling = 1 + (totalTurnover / 1000000);

  return totalRisk * riskMult * turnoverScaling;
};

/** Przychód z Mordoru w EUR na sekundę: 25 EUR/s za pracownika * morale. */
export const mordorIncomePerSec = (s: GameState): number => {
  if (!s.fazaWUnlocked) return 0;
  return s.mordorEmployees * 25 * (s.mordorMorale / 100);
};

/** Spadek morale w Mordorze na sekundę (bazowo 0.5%/s, redukowane przez ulepszenia). */
export const mordorMoraleDecayPerSec = (s: GameState): number => {
  if (!s.fazaWUnlocked || s.mordorEmployees <= 0) return 0;
  let decay = 0.5;
  if (s.mordorUpgrades?.['owocowe_czwartki']) decay *= 0.70;
  if (s.mordorUpgrades?.['multisport']) decay *= 0.80;
  if (s.mordorUpgrades?.['pingpong']) decay *= 0.85;
  if (s.mordorUpgrades?.['chillout_room']) decay *= 0.75;
  return decay;
};

/** Koszt utrzymania pracowników Mordoru w PLN na sekundę (bazowo 200 PLN/s za pracownika, redukowane przez JDG). */
export const mordorEmployeeUpkeepPerSec = (s: GameState): number => {
  if (!s.fazaWUnlocked) return 0;
  const level = s.jdgTaxOptimizationLevel || 0;
  const taxLevel = JDG_TAX_LEVELS.find(l => l.level === level) || JDG_TAX_LEVELS[0];
  return s.mordorEmployees * 200 * taxLevel.upkeepReduction;
};

/** Przyrost ryzyka kontroli PIP na sekundę. Zależy od liczby kontraktów B2B i poziomu optymalizacji. */
export const jdgRiskGainPerSec = (s: GameState): number => {
  if (!s.fazaWUnlocked || s.jdgContracts <= 0) return 0;
  const level = s.jdgTaxOptimizationLevel || 0;
  const taxLevel = JDG_TAX_LEVELS.find(l => l.level === level) || JDG_TAX_LEVELS[0];
  return s.jdgContracts * 0.05 * taxLevel.riskFactor;
};

/** 
 * Wydobycie krypto (BTC/s) na podstawie posiadanych koparek.
 */
export const cryptoMiningYield = (s: GameState): number => {
  if (!s.fazaXUnlocked) return 0;
  let yieldBtc = 0;
  const rtxCount = s.cryptoRigs?.['rtx4090'] || 0;
  const asicCount = s.cryptoRigs?.['asic'] || 0;
  yieldBtc += rtxCount * 0.00005;
  yieldBtc += asicCount * 0.00025;
  return yieldBtc;
};

/**
 * Koszt prądu (PLN/s) z kopalni kryptowalut.
 * Z ulepszeniem fotowoltaiki koszt spada o 40%.
 */
export const cryptoPowerUpkeepPln = (s: GameState): number => {
  if (!s.fazaXUnlocked) return 0;
  const rtxCount = s.cryptoRigs?.['rtx4090'] || 0;
  const asicCount = s.cryptoRigs?.['asic'] || 0;
  const totalKw = (rtxCount * 0.45) + (asicCount * 3.0);
  let cost = totalKw * 5;
  if (s.aiUpgrades?.['fotowoltaika']) cost *= 0.6;
  return cost;
};

/**
 * Postęp trenowania modeli AI (%/s).
 * Bazowo 0.5% na sekundę. Każdy komputer H100 zwiększa o +0.5%/s, a Prompt Engineer o +0.2%/s.
 * Low-Code framework ulepszenie zwiększa prędkość o 50%.
 */
export const aiTrainSpeed = (s: GameState): number => {
  if (!s.fazaXUnlocked || !s.isTrainingAi) return 0;
  let speed = 0.5 + (s.aiComputers * 0.5) + (s.aiPromptEngineers * 0.2);
  if (s.aiUpgrades?.['nocod_framework']) speed *= 1.5;
  return speed;
};

/**
 * Przyrost ryzyka KNF przy emisji KombinatorCoin (%/s).
 * Pasywnie rośnie o 0.2%/s za posiadanie tokenów.
 * Słup w Dubaju zmniejsza przyrost o 50%.
 */
export const knfRiskGrowthRate = (s: GameState): number => {
  if (!s.fazaXUnlocked) return 0;
  let risk = (s.kmbTokensOwned || 0) > 0 ? 0.2 : 0;
  if (s.aiUpgrades?.['dubaj_shell']) risk *= 0.5;
  return risk;
};

/** 
 * Oblicza ostateczny czas trwania szmuglu morskiego.
 * - Sztorm: +50% czasu
 * - Dzień Marynarza: -30% czasu
 * - Szmugler Lądowy (Marlboro): -20%
 */
export const seaSmuggleTime = (baseMs: number, s: GameState): number => {
  let t = baseMs;
  if (s.seaState === 'storm') t *= 1.5;
  if (s.seaState === 'sailor_day') t *= 0.7;
  if (s.baltonaUpgrades?.['marlboro']) t *= 0.8;
  return t;
};

/**
 * Oblicza ryzyko wpadki (w procentach, 0-100) dla szmuglu morskiego.
 * - Stan morza "Lockdown Gdyni": +40 punktów proc.
 * - Stan morza "Patrole WOP": +20 punktów proc.
 * - Dzień Marynarza: -10 punktów proc.
 * - Ulepszenie "Złom na pokładzie": -5 punktów proc.
 * - Ulepszenie "Przekupieni Celni": -15 punktów proc.
 */
export const seaSmuggleRisk = (baseRisk: number, s: GameState): number => {
  let risk = baseRisk;
  if (s.seaState === 'lockdown') risk += 40;
  if (s.seaState === 'patrols') risk += 20;
  if (s.seaState === 'sailor_day') risk -= 10;
  
  if (s.seaUpgrades?.['zlom']) risk -= 5;
  if (s.seaUpgrades?.['celnicy']) risk -= 15;
  
  return Math.max(0, Math.min(100, risk));
};

