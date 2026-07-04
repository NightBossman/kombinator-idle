import { useState, useEffect, useCallback, useRef } from 'react';
import { HELPERS, BUSINESSES, GPW_STOCKS, NOMENKLATURA_COMPANIES, OFFSHORE_DEPOSITS, COCOM_PERSONNEL } from '../game/items';
import type { EuroBond } from '../game/items';
// [Claude] KIERUNEK 1.3: symulacja offline liczy mnozniki tym samym wzorem co silnik
// (bez opcji zZdarzeniami - zdarzenia historyczne celowo nie dzialaja offline, jak dotad)
import { helperSpeedMult, businessProductionMult } from '../game/formulas';
import type { AuctionState } from '../game/items';

// [Claude] KIERUNEK 2: wersja formatu zapisu. Podbij TYLKO, gdy zmienia sie ZNACZENIE
// istniejacego pola (i dopisz migracje w mergeSavedState). Samo dodanie nowego pola
// nie wymaga niczego - glebokie scalenie z INITIAL_STATE uzupelni je automatycznie.
export const SAVE_VERSION = 1;

export interface BlackMarketOffer {
  id: string;
  name: string;
  itemId: string;
  amount: number;
  costPln?: number;
  costTalony?: number;
  costRuble?: number;
}

const OFFER_TEMPLATES = [
  { name: 'Hurtowy Cukier (x10)', itemId: 'cukier', amount: 10, costPln: 90 },
  { name: 'Zapas Mydła (x10)', itemId: 'mydlo', amount: 10, costPln: 30 },
  { name: 'Kawa spod lady (x5)', itemId: 'kawa', amount: 5, costPln: 120 },
  { name: 'Okazyjny Spirytus (x5)', itemId: 'spirytus', amount: 5, costPln: 250 },
  { name: 'Paczka Dżinsów "Odra" (x3)', itemId: 'dzinsy', amount: 3, costPln: 200 },
  { name: 'Tanie Buty Relaks (x2)', itemId: 'relaks', amount: 2, costPln: 350 },
  { name: 'Odkurzacz Predom ze zwrotu', itemId: 'predom', amount: 1, costPln: 450 },
  { name: 'Radio Kasprzak z fabryki', itemId: 'kasprzak', amount: 1, costPln: 600 },
  { name: 'Pralka Frania lekko obita', itemId: 'frania', amount: 1, costPln: 1100 },
  { name: 'Aparat Zorki spod lodu', itemId: 'zorki', amount: 1, costPln: 4500 },
  
  // Oferty za talony
  { name: 'Cukier za bony (x20)', itemId: 'cukier', amount: 20, costTalony: 4 },
  { name: 'Dżinsy Odra za bony (x3)', itemId: 'dzinsy', amount: 3, costTalony: 3 },
  { name: 'Syrena 105 z demobilu za bony', itemId: 'syrena', amount: 1, costTalony: 20 },
  
  // Oferty za ruble
  { name: 'Sowiecki Aparat Zorki (x2)', itemId: 'zorki', amount: 2, costRuble: 15 },
  { name: 'Radio Kasprzak (ZSRR import)', itemId: 'kasprzak', amount: 1, costRuble: 8 },
  { name: 'Skuter Osa (sowiecka licencja)', itemId: 'osa', amount: 1, costRuble: 30 }
];

export function generateBlackMarketOffers(): BlackMarketOffer[] {
  const shuffled = [...OFFER_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((template, idx) => ({
    id: `offer_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
    name: template.name,
    itemId: template.itemId,
    amount: template.amount,
    costPln: template.costPln,
    costTalony: template.costTalony,
    costRuble: template.costRuble
  }));
}

export interface GameStats {
  totalPlnEarned: number;
  totalDollarsEarned: number;
  totalItemsSold: number;
  totalTimeQueued: number;
  totalCinkciarzExchanges: number;
  totalMoscowRuns?: number;
  totalInterestEarned?: number;
  totalDividendsEarned?: number;
  totalBazarPlnEarned: number;
  totalBribesPaidPln: number;
  totalConfiscations: number;
  totalCleCatches: number;
  totalSmugglesCompleted: number;
  totalBlackMarketPurchases: number;
  totalTimePlayed: number;
  maxPlnHeld: number;
  totalSbRaids?: number;
  totalSeaSmugglesCompleted?: number;
  totalBonyEarned?: number;
  totalGpwProfit?: number;
  totalNomenklaturaEarned?: number;
  totalOffshoreTransfersPln?: number;
  totalCocomItemsSold?: number;
  totalCocomRevenuePln?: number;
  totalCocomAutoExports?: number;
}

export interface ShellCompany {
  id: string;
  name: string;
  goodsType: 'electronics' | 'steel' | 'fuel';
  capital: number;
  isActive: boolean;
  status: 'idle' | 'trading' | 'inspected';
}

export interface GameState {
  saveVersion: number; // [Claude] KIERUNEK 2 - patrz SAVE_VERSION i mergeSavedState
  pln: number;
  dollars: number;
  exchangeRate: number;
  prestigePoints: number;
  suspicion: number;
  kartki: number;
  partyRank: string | null;
  inventory: Record<string, number>;
  helpers: Record<string, number>;
  businesses: Record<string, number>;
  pewexItems: Record<string, boolean>;
  plnUpgrades: Record<string, boolean>;
  zeszytDidRequeue: boolean;
  zeszyt2DidRequeue: boolean;
  lastSave: number;
  
  // Faza B: Nowe waluty i Czarny Rynek
  talony: number;
  ruble: number;
  czarnyRynekUnlocked: boolean;
  blackMarketOffers: BlackMarketOffer[];
  lastMarketRefresh: number;

  // Faza C: Losowe zdarzenia historyczne
  offlineReport: { timeSec: number; earnedPln: number; earnedDollars: number; earnedItems: Record<string, number>; dividends: number; interest: number } | null;
  activeEvent: string | null;
  eventTimeLeft: number;
  nextEventIn: number;

  // Faza D: Statystyki i Osiągnięcia
  stats: GameStats;
  unlockedAchievements: Record<string, boolean>;

  // Faza E: Solidarność
  solidarnos: number; // 0–10000
  okraglyStolKartki: number; // postęp do Okrągłego Stołu (wymagane 1000)
  okraglyStolPln: number;    // postęp do Okrągłego Stołu (wymagane 100000)
  okraglyStolStartDay: number; // stats.totalTimePlayed przy starcie (wymagane +7776000s = 90 dni)
  okraglyStolVictory: boolean;
  
  // Faza F: Prestiż i Speedrun
  prestigeCount: number;
  activeDestination: 'nrf' | 'austria' | 'usa' | 'kanada' | 'australia' | null;
  timeInCurrentLoop: number;
  speedrunActive: boolean;
  speedrunTime: number;
  speedrunHistory: number[];

  // Faza A (Rozszerzenie): Ulepszenia pomocników
  helperUpgrades: Record<string, number>;

  // Faza B: Licytacje i Towary Luksusowe
  ownedLuxuryItems: Record<string, boolean>;
  auction: AuctionState | null;
  nextAuctionIn: number;

  // Faza C: Drugi Obieg i Cenzura
  bibulaPaper: number;
  bibulaInk: number;
  bibulaPisma: number;
  bibulaLockdownRemaining: number;
  isPrinting: boolean;
  printProgress: number;

  // Faza D: Port Gdynia i Baltona
  bonyBaltona: number;
  activeSeaSmuggle: string | null;
  seaSmuggleProgress: number;
  baltonaUpgrades: Record<string, boolean>;

  // Faza E: Służba Bezpieczeństwa (SB) i TW
  sbTwList: Record<string, boolean>;
  sbTwRevealed: Record<string, boolean>;
  sbTwBlackmailed: Record<string, boolean>;
  sbCounterIntelTimeLeft: number;

  // Faza F (Hiperinflacja)
  inflationPercent: number;
  zloto: number;
  srebro: number;
  bonyPewex: number;
  bondPrlCount: number;
  bondSolCount: number;
  bondSolValue: number;
  inflationUpgrades: Record<string, boolean>;

  // Faza G: Giełda i Prywatyzacja (GPW)
  gpwUnlocked: boolean;
  sharesOwned: Record<string, number>;
  sharesAvgCost: Record<string, number>;
  stockPrices: Record<string, number>;
  stockPriceHistories: Record<string, number[]>;
  gpwActiveEvent: string | null;
  gpwEventTimeLeft: number;
  gpwInsiderTip: { stockId: string; effect: 'up' | 'down'; ticksLeft: number } | null;

  // Faza H: Spółki Nomenklaturowe i Korporacje
  nomenklaturaUnlocked: boolean;
  sbSuspicion: number;
  sbLockdownTimeLeft: number;
  nomenklaturaCompanies: Record<string, { registered: boolean; assetLevel: number; directorCount: number; twAssigned: boolean }>;

  // Faza I: Konta Zagraniczne (Szwajcaria i Liechtenstein)
  swissAccountUnlocked: boolean;
  swissBalancePln: number;
  swissBalanceUsd: number;
  interpolSuspicion: number;
  interpolLockdownTimeLeft: number;
  hasLiechtensteinTrust: boolean;
  swissAccountNumber: string;
  activeOffshoreDeposits: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number; depositTypeId: string }[];
  activeWireTransfers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[];
  activeCouriers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[];
  offshoreCreditTaken: number;
  offshoreCreditTimeLeft: number;

  // Faza J: Syndykat Eksportowy i Szmugiel Technologii COCOM
  syndicateUnlocked: boolean;
  cocomInventory: Record<string, number>;
  cocomProceedsPln: number;
  unlockedContacts: Record<string, boolean>;
  syndicateUpgrades: Record<string, boolean>;
  activeCocomShipments: { id: string; itemId: string; contactId: string; route: string; amount: number; timeLeft: number }[];
  activeGeoEvent: string | null;
  geoEventTimeLeft: number;
  autoExportEnabled: boolean;
  autoExportCooldown: number;
  embassyImmunityCooldown: number;

  // Faza K: Wybory 4 Czerwca
  electionsUnlocked: boolean;
  electionFundsPln: number;
  electionFundsUsd: number;
  paperStocks: number;
  inkStocks: number;
  campaignMaterials: Record<string, number>;
  regionalCommittees: Record<string, boolean>;
  regionalVotes: Record<string, number>;
  electionUpgrades: Record<string, boolean>;
  activeRallies: { regionId: string; leaderId: string; timeLeft: number }[];
  leaderCooldowns: Record<string, number>;
  regimePropaganda: number;
  churchSupport: number;
  debateCompleted: boolean;
  debateRound: number;
  debateScore: number;
  rweActive: boolean;
  electionsPhase: 'not_started' | 'campaign' | 'first_round' | 'second_round' | 'negotiations' | 'completed';
  sejmSeatsWon: number;
  senateSeatsWon: number;
  campaignTimePlayed: number;

  // Faza L: Globalne Imperium Przemytnicze
  // [Claude] usunięto pole unlockedCocomNodes - nigdy nie było czytane (mapa węzłów nie powstała)
  cocomVehicles: Record<string, number>;
  cocomPersonnel: Record<string, number>;
  activeCocomSmugglingRuns: { 
    id: string; 
    routeId: string; 
    vehicleId: string; 
    personnelId: string; 
    itemIds: string[]; 
    timeLeft: number; 
    riskPercent: number; 
    potentialPayoutPln: number;
  }[];
  borderShiftTimeLeft: number;
  borderShiftStatus: Record<string, 'standard' | 'relaxed' | 'strict'>;
  borderShiftTimer: number;

  // Faza M: Dziki Kapitalizm
  fazaMUnlocked: boolean;
  nfiVouchers: number;
  nfiCompanies: Record<string, boolean>;
  nfiCompanyStatus: Record<string, { employment: number; infrastructure: number; morale: number; unionStrength: number; strikeActive: boolean }>;
  mafiaProtectionId: string | null;
  mafiaThreatLevel: number;
  bazarInventory: Record<string, number>;
  isDenominated: boolean;
  plzInflationMult: number;

  // Faza P: Imperium Logistyczne
  bazarWarehouseCapacity: number;
  bazarMarketSaturation: Record<string, number>;
  activeBazarTransports: Array<{ id: string; routeId: string; timeLeft: number }>;
  bazarWarehouseUpgradeId: string | null;

  // Faza R: Wolne Media
  mediaUnlocked: boolean;
  mediaStations: Record<string, boolean>;
  mediaPrograms: Record<string, boolean>;
  activeMediaPrograms: Record<string, Record<string, string | null>>;
  mediaAntennas: Record<string, number>;
  mediaTrust: Record<string, number>;
  mediaKrritBribeDiscount: number;

  // Faza N: Wojny Gangów
  fazaNUnlocked: boolean;
  gangRespect: number;
  gangUnits: Record<string, number>;
  gangWeapons: Record<string, number>;
  districtControl: Record<string, { player: number, pruszkow: number, wolomin: number }>;

  // Faza S: Lata 2000.
  fazaSUnlocked: boolean;
  activeEuProjects: { id: string; projectId: string; timeLeft: number; funded: boolean }[];
  dotcomUsers: number;
  dotcomServerCapacity: number;
  dotcomUpgrades: Record<string, boolean>;
  chfDebt: number;
  chfExchangeRate: number;
  realEstateOwned: Record<string, number>;
  realEstateUnderConstruction: { id: string; timeLeft: number; financedWithChf: boolean; uuid: string }[];
  zmywakWorkers: number;
  euAuditRisk: number;

  // Faza T: Wielka Recesja 2008
  recessionActive: boolean;
  recessionTimer: number;
  recessionTriggered: boolean;
  currencyOptions: { id: string; type: 'call' | 'put' | 'toxic'; strikeRate: number; amountChf: number; durationSec: number; timeLeft: number; premiumPln: number }[];
  crisisRealEstateOwned: Record<string, number>;
  bankAdvisors: number;
  devStateBackup: GameState | null; // [Claude] typ zamiast any - backup to pełna migawka stanu
  
  // Faza U: Polityka 2.0
  lobbyActiveBills: Record<string, boolean>;
  lobbyCorruption: number;
  commissionActive: boolean;
  commissionAggression: number;
  commissionEvidence: number;
  commissionQuestionIndex: number;
  teczkiCount: number;
  prisonSentenceRemaining: number;
  
  // Faza V: Raje Podatkowe i Karuzela VAT
  vatCompanies: ShellCompany[];
  vatCarouselActive: boolean;
  vatRefundClaimed: number;
  vatRefundStatus: 'none' | 'pending' | 'approved' | 'rejected';
  vatRefundTimer: number;
  vatRefundPendingAmount: number;
  vatAuditRisk: number;
  vatUpgrades: Record<string, boolean>;
  offshoreCyprusBalance: number;
  // [Claude] usunięto devFreezeVatRisk - flaga była czytana w pętli gry, ale ŻADEN kod jej nie ustawiał

  // Faza W: Mordor na Domaniewskiej (Lata 2010.)
  fazaWUnlocked: boolean;
  jdgContracts: number;
  jdgRiskLevel: number;
  jdgTaxOptimizationLevel: number;
  pipInspectionTimer: number;
  mordorFloors: number;
  mordorEmployees: number;
  mordorMorale: number;
  mordorUpgrades: Record<string, boolean>;
  euroBonds: EuroBond[];
  euroBondEvents: string[];
  euros: number;
  euroExchangeRate: number;
  eventsUnlocked: boolean;
  timeWithHighPlnSec: number;
}

export const INITIAL_STATE: GameState = {
  saveVersion: SAVE_VERSION,
  pln: 5,
  dollars: 0,
  exchangeRate: 100,
  prestigePoints: 0,
  suspicion: 0,
  kartki: 0,
  partyRank: null,
  inventory: { 
    papier: 0, mydlo: 0, cukier: 0, maka: 0, kawa: 0, spirytus: 0, dzinsy: 0, relaks: 0, 
    predom: 0, kasprzak: 0, frania: 0, kowalski: 0, zorki: 0, neptun: 0, osa: 0, wsk: 0, 
    syrena: 0, fiat125: 0, ursus: 0, zis: 0,
    gozdziki: 0, czesci: 0, wyroby_hutnicze: 0
  },
  helpers: { 
    wladyslaw: 0, kolega: 0, halinka: 0, basia: 0, spekulant: 0, 
    staszek: 0, zygmunt: 0, cinkciarz: 0, widmo: 0, konspiracja: 0 
  },
  businesses: { szklarnia: 0, warsztat: 0, kombinat: 0 },
  pewexItems: { 
    donald: false, toblerone: false, lego: false, krakus: false, wrangler: false, 
    cola: false, sanyo: false, c64: false, walkman: false, rubin: false, 
    polaroid: false, casio: false, maluch: false, vhs: false, m3: false, 
    willa: false, szwajcaria: false, transformacja: false 
  },
  plnUpgrades: { torba: false, wozek: false, zeszyt: false, kozuch: false, znajomosci: false },
  zeszytDidRequeue: false,
  zeszyt2DidRequeue: false,
  lastSave: Date.now(),
  
  talony: 0,
  ruble: 0,
  czarnyRynekUnlocked: false,
  blackMarketOffers: [],
  lastMarketRefresh: 0,

  offlineReport: null,
  activeEvent: null,
  eventTimeLeft: 0,
  nextEventIn: 120,

  stats: {
    totalPlnEarned: 5,
    totalDollarsEarned: 0,
    totalItemsSold: 0,
    totalTimeQueued: 0,
    totalCinkciarzExchanges: 0,
    totalBazarPlnEarned: 0,
    totalBribesPaidPln: 0,
    totalConfiscations: 0,
    totalCleCatches: 0,
    totalSmugglesCompleted: 0,
    totalBlackMarketPurchases: 0,
    totalTimePlayed: 0,
    maxPlnHeld: 5,
    totalSbRaids: 0,
    totalSeaSmugglesCompleted: 0,
    totalBonyEarned: 0,
    totalGpwProfit: 0
  },
  unlockedAchievements: {},

  // Faza E
  solidarnos: 0,
  okraglyStolKartki: 0,
  okraglyStolPln: 0,
  okraglyStolStartDay: -1,
  okraglyStolVictory: false,

  // Faza F
  prestigeCount: 0,
  activeDestination: null,
  timeInCurrentLoop: 0,
  speedrunActive: false,
  speedrunTime: 0,
  speedrunHistory: [],

  // Faza A (Rozszerzenie)
  helperUpgrades: {},

  // Faza B: Licytacje i Towary Luksusowe
  ownedLuxuryItems: {},
  auction: null,
  nextAuctionIn: 600,

  // Faza C: Drugi Obieg i Cenzura
  bibulaPaper: 0,
  bibulaInk: 0,
  bibulaPisma: 0,
  bibulaLockdownRemaining: 0,
  isPrinting: false,
  printProgress: 0,

  // Faza D: Port Gdynia i Baltona
  bonyBaltona: 0,
  activeSeaSmuggle: null,
  seaSmuggleProgress: 0,
  baltonaUpgrades: {},

  // Faza E: Służba Bezpieczeństwa (SB) i TW
  sbTwList: {},
  sbTwRevealed: {},
  sbTwBlackmailed: {},
  sbCounterIntelTimeLeft: 0,

  // Faza F (Hiperinflacja)
  inflationPercent: 0,
  zloto: 0,
  srebro: 0,
  bonyPewex: 0,
  bondPrlCount: 0,
  bondSolCount: 0,
  bondSolValue: 0,
  inflationUpgrades: {},

  // Faza G: Giełda i Prywatyzacja (GPW)
  gpwUnlocked: false,
  sharesOwned: {},
  sharesAvgCost: {},
  stockPrices: {},
  stockPriceHistories: {},
  gpwActiveEvent: null,
  gpwEventTimeLeft: 0,
  gpwInsiderTip: null,

  // Faza H: Spółki Nomenklaturowe i Korporacje
  nomenklaturaUnlocked: false,
  sbSuspicion: 0,
  sbLockdownTimeLeft: 0,
  nomenklaturaCompanies: {},

  // Faza I: Konta Zagraniczne (Szwajcaria i Liechtenstein)
  swissAccountUnlocked: false,
  swissBalancePln: 0,
  swissBalanceUsd: 0,
  interpolSuspicion: 0,
  interpolLockdownTimeLeft: 0,
  hasLiechtensteinTrust: false,
  swissAccountNumber: '',
  activeOffshoreDeposits: [],
  activeWireTransfers: [],
  activeCouriers: [],
  offshoreCreditTaken: 0,
  offshoreCreditTimeLeft: 0,

  // Faza J
  syndicateUnlocked: false,
  cocomInventory: {},
  cocomProceedsPln: 0,
  unlockedContacts: { moscow_bureau: true },
  syndicateUpgrades: {},
  activeCocomShipments: [],
  activeGeoEvent: null,
  geoEventTimeLeft: 0,
  autoExportEnabled: false,
  autoExportCooldown: 0,
  embassyImmunityCooldown: 0,

  // Faza K
  electionsUnlocked: false,
  electionFundsPln: 0,
  electionFundsUsd: 0,
  paperStocks: 0,
  inkStocks: 0,
  campaignMaterials: {},
  regionalCommittees: {},
  regionalVotes: {},
  electionUpgrades: {},
  activeRallies: [],
  leaderCooldowns: {},
  regimePropaganda: 80,
  churchSupport: 0,
  debateCompleted: false,
  debateRound: 0,
  debateScore: 0,
  rweActive: false,
  electionsPhase: 'not_started' as const,
  sejmSeatsWon: 0,
  senateSeatsWon: 0,
  campaignTimePlayed: 0,

  // Faza L: Globalne Imperium Przemytnicze
  cocomVehicles: {},
  cocomPersonnel: {},
  activeCocomSmugglingRuns: [],
  borderShiftTimeLeft: 60,
  borderShiftStatus: {
    'Świecko (Drogowe)': 'standard',
    'Cieszyn (Drogowe)': 'standard',
    'Szwajcarska Straż Graniczna': 'standard',
    'Terespol (Kolejowe)': 'standard',
    'Okęcie (Kontrola Lotnicza)': 'standard'
  },
  borderShiftTimer: 60,

  // Faza M: Dziki Kapitalizm
  fazaMUnlocked: false,
  nfiVouchers: 0,
  nfiCompanies: {},
  nfiCompanyStatus: {
    'fso': { employment: 12000, infrastructure: 40, morale: 100, unionStrength: 50, strikeActive: false },
    'ursus': { employment: 18000, infrastructure: 30, morale: 100, unionStrength: 75, strikeActive: false },
    'huta_katowice': { employment: 25000, infrastructure: 25, morale: 100, unionStrength: 90, strikeActive: false }
  },
  mafiaProtectionId: null,
  mafiaThreatLevel: 0,
  bazarInventory: {},
  isDenominated: false,
  plzInflationMult: 1,

  // Faza P: Imperium Logistyczne
  bazarWarehouseCapacity: 50,
  bazarMarketSaturation: { 'vhs_tapes': 0, 'turkey_sweaters': 0, 'taiwan_electronics': 0 },
  activeBazarTransports: [],
  bazarWarehouseUpgradeId: null,

  // Faza R: Wolne Media
  mediaUnlocked: false,
  mediaStations: {},
  mediaPrograms: {},
  activeMediaPrograms: {
    'gazeta_bazarowa': { 'rano': null, 'poludnie': null, 'wieczor': null },
    'radio_szum': { 'rano': null, 'poludnie': null, 'wieczor': null },
    'tv_kombinator': { 'rano': null, 'poludnie': null, 'wieczor': null }
  },
  mediaAntennas: {},
  mediaTrust: { 'gazeta_bazarowa': 100, 'radio_szum': 100, 'tv_kombinator': 100 },
  mediaKrritBribeDiscount: 1.0,

  // Faza N: Wojny Gangów
  fazaNUnlocked: false,
  gangRespect: 0,
  gangUnits: {},
  gangWeapons: {},
  districtControl: {
    'praga': { player: 0, pruszkow: 0, wolomin: 100 },
    'wola': { player: 0, pruszkow: 100, wolomin: 0 },
    'srodmiescie': { player: 0, pruszkow: 100, wolomin: 0 },
    'mokotow': { player: 100, pruszkow: 0, wolomin: 0 },
    'ursynow': { player: 0, pruszkow: 0, wolomin: 100 }
  },

  // Faza S: Lata 2000.
  fazaSUnlocked: false,
  activeEuProjects: [],
  dotcomUsers: 0,
  dotcomServerCapacity: 1000,
  dotcomUpgrades: {},
  chfDebt: 0,
  chfExchangeRate: 2.50,
  realEstateOwned: {},
  realEstateUnderConstruction: [],
  zmywakWorkers: 0,
  euAuditRisk: 0,

  // Faza T: Wielka Recesja 2008
  recessionActive: false,
  recessionTimer: 0,
  recessionTriggered: false,
  currencyOptions: [],
  crisisRealEstateOwned: {},
  bankAdvisors: 0,
  devStateBackup: null,
  
  // Faza U: Polityka 2.0
  lobbyActiveBills: {},
  lobbyCorruption: 0,
  commissionActive: false,
  commissionAggression: 0,
  commissionEvidence: 0,
  commissionQuestionIndex: 0,
  teczkiCount: 0,
  prisonSentenceRemaining: 0,
  
  // Faza V: Raje Podatkowe i Karuzela VAT
  vatCompanies: [],
  vatCarouselActive: false,
  vatRefundClaimed: 0,
  vatRefundStatus: 'none',
  vatRefundTimer: 0,
  vatRefundPendingAmount: 0,
  vatAuditRisk: 0,
  offshoreCyprusBalance: 0,
  vatUpgrades: {},

  // Faza W: Mordor na Domaniewskiej (Lata 2010.)
  fazaWUnlocked: false,
  jdgContracts: 0,
  jdgRiskLevel: 0,
  jdgTaxOptimizationLevel: 0,
  pipInspectionTimer: 0,
  mordorFloors: 0,
  mordorEmployees: 0,
  mordorMorale: 100,
  mordorUpgrades: {},
  euroBonds: [],
  euroBondEvents: [],
  euros: 0,
  euroExchangeRate: 4.20,
  eventsUnlocked: false,
  timeWithHighPlnSec: 0
};

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v);

// [Claude] KIERUNEK 2: to zastepuje ~180 recznych linii "backward compat" (osobna linijka
// na kazde pole - przy kazdej nowej fazie latwo bylo ktoras pominac). Reguly scalania:
//  - poziom najwyzszy: TYLKO pola znane w INITIAL_STATE (martwe pola starych zapisow wypadaja),
//  - poziomy nizsze: klucze z zapisu zostaja (dynamiczne id: ekwipunek, spolki, akcje...),
//    a brakujace wartosci domyslne sa dokladane,
//  - tablice i prymitywy: wartosc z zapisu wygrywa, jesli istnieje,
//  - domyslne sa KLONOWANE, zeby rozgrywka nigdy nie mutowala INITIAL_STATE.
export function mergeSavedState(parsed: unknown): GameState {
  if (!isPlainObject(parsed)) return structuredClone(INITIAL_STATE);

  const loadedVersion = typeof parsed.saveVersion === 'number' ? parsed.saveVersion : 0;
  // Miejsce na przyszle migracje, np.:
  // if (loadedVersion < 2) { parsed.polePoNowemu = przeksztalc(parsed.polePoStaremu); }
  void loadedVersion;

  const merge = (defaults: unknown, savedVal: unknown, topLevel: boolean): unknown => {
    if (isPlainObject(defaults)) {
      if (!isPlainObject(savedVal)) return structuredClone(defaults);
      const out: Record<string, unknown> = topLevel ? {} : { ...savedVal };
      for (const key of Object.keys(defaults)) {
        out[key] = merge(defaults[key], savedVal[key], false);
      }
      return out;
    }
    return savedVal === undefined ? structuredClone(defaults) : savedVal;
  };

  const merged = merge(INITIAL_STATE, parsed, true) as GameState;
  merged.saveVersion = SAVE_VERSION;

  // Auto-unlock events for late-game players loading their saves
  if (merged.fazaMUnlocked || merged.fazaSUnlocked || merged.fazaWUnlocked || merged.activeDestination === 'usa' || merged.activeDestination === 'australia' || merged.pln >= 100000) {
    merged.eventsUnlocked = true;
  }

  return merged;
}

export function useGameState(isPaused: boolean = false) {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('kombinator-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = mergeSavedState(parsed);
        
        // Wygenerowanie ofert na start, jeśli puste
        if (merged.blackMarketOffers.length === 0) {
          merged.blackMarketOffers = generateBlackMarketOffers();
          merged.lastMarketRefresh = Date.now();
        }
        
        // Zaawansowana symulacja produkcji offline (dostępna domyślnie, zyskuje na wydajności dzięki M3 i Willi)
        const hasM3 = merged.pewexItems.m3;
        const hasWilla = merged.pewexItems.willa;
        const efficiency = hasWilla ? 1.0 : (hasM3 ? 0.5 : 0.25);
        const timeDiffSec = (Date.now() - merged.lastSave) / 1000;
        // Pokaż raport offline tylko jeśli gracz ma już czas gry (nie przy pierwszym uruchomieniu)
        const hasPlayTime = (merged.stats?.totalTimePlayed || 0) > 30;
        if (timeDiffSec > 10 && hasPlayTime) {
              const offlineSec = Math.min(86400, timeDiffSec); // Limit 24h
              
              const offlineRep = {
                timeSec: offlineSec,
                earnedPln: 0,
                earnedDollars: 0,
                earnedItems: {} as Record<string, number>,
                dividends: 0,
                interest: 0
              };

              // 1. Mnozniki - wspolny wzor z formulas.ts (KIERUNEK 1.3)
              const helperMult = helperSpeedMult(merged);
                               
              // 2. Pomocnicy
              HELPERS.forEach(h => {
                const count = merged.helpers[h.id] || 0;
                if (count > 0) {
                  const level = merged.helperUpgrades?.[h.id] || 0;
                  const upgradeMult = 1 + level * 0.5;
                  const amount = count * h.ratePerTick * offlineSec * helperMult * upgradeMult * efficiency;
                  
                  if (h.id === 'cinkciarz') {
                    // Pomijamy wymianę walut offline w celu uniknięcia debetu PLN
                  } else if (h.id === 'widmo') {
                    merged.dollars += amount;
                    merged.stats.totalDollarsEarned = (merged.stats.totalDollarsEarned || 0) + amount;
                    offlineRep.earnedDollars += amount;
                  } else if (h.id === 'staszek') {
                    merged.inventory['predom'] = (merged.inventory['predom'] || 0) + amount * 0.5;
                    merged.inventory['kasprzak'] = (merged.inventory['kasprzak'] || 0) + amount * 0.5;
                    offlineRep.earnedItems['predom'] = (offlineRep.earnedItems['predom'] || 0) + amount * 0.5;
                    offlineRep.earnedItems['kasprzak'] = (offlineRep.earnedItems['kasprzak'] || 0) + amount * 0.5;
                  } else if (h.id === 'konspiracja') {
                    merged.kartki = (merged.kartki || 0) + amount;
                    offlineRep.earnedItems['kartki'] = (offlineRep.earnedItems['kartki'] || 0) + amount;
                  } else {
                    merged.inventory[h.generateId] = (merged.inventory[h.generateId] || 0) + amount;
                    offlineRep.earnedItems[h.generateId] = (offlineRep.earnedItems[h.generateId] || 0) + amount;
                  }
                }
              });
              
              // 3. Biznesy
              BUSINESSES.forEach(b => {
                const count = merged.businesses[b.id] || 0;
                if (count > 0) {
                  const amount = count * b.ratePerTick * offlineSec * efficiency * businessProductionMult(merged, b.generateType);
                  
                  if (b.generateType === 'pln') {
                     merged.pln += amount;
                     merged.stats.totalPlnEarned = (merged.stats.totalPlnEarned || 0) + amount;
                     offlineRep.earnedPln += amount;
                  } else if (b.generateType === 'dollars') {
                     merged.dollars += amount;
                     merged.stats.totalDollarsEarned = (merged.stats.totalDollarsEarned || 0) + amount;
                     offlineRep.earnedDollars += amount;
                  } else {
                     merged.inventory[b.generateType] = (merged.inventory[b.generateType] || 0) + amount;
                     offlineRep.earnedItems[b.generateType] = (offlineRep.earnedItems[b.generateType] || 0) + amount;
                  }
                }
              });

              // 4. Faza F (Hiperinflacja) offline mechanics
              if (merged.activeDestination === 'usa') {
                 let baseInflationSec = 0.2;
                 if (merged.partyRank === 'biuro') baseInflationSec = 0.3;
                 else if (merged.partyRank === 'minister') baseInflationSec = 0.14;

                 const polisaMult = merged.inflationUpgrades?.['polisaAsekuracyjna'] ? 0.75 : 1.0;
                 const inflationGained = (baseInflationSec * polisaMult) * offlineSec;
                 
                 const startInflation = merged.inflationPercent || 0;
                 const endInflation = startInflation + inflationGained;
                 merged.inflationPercent = endInflation;

                 const pkoDivider = merged.inflationUpgrades?.['kontoPKO'] ? 50000 : 20000;
                 const avgInflation = (startInflation + endInflation) / 2;
                 const decayFactor = Math.pow(1 - (avgInflation / pkoDivider), offlineSec);
                 
                 const finalDecayFactor = Math.max(0.05, decayFactor);
                 merged.pln = Math.floor(merged.pln * finalDecayFactor);

                 if (merged.inflationUpgrades?.['ksiazeczkaMieszkaniowa']) {
                    merged.solidarnos = (merged.solidarnos || 0) + 0.05 * offlineSec;
                 }

                 if (merged.bondPrlCount > 0) {
                    const passivePln = merged.bondPrlCount * 2000 * offlineSec;
                    merged.pln += passivePln;
                    merged.stats.totalPlnEarned = (merged.stats.totalPlnEarned || 0) + passivePln;
                    offlineRep.earnedPln += passivePln;
                    offlineRep.interest += passivePln;
                 }

                 if (merged.bondSolCount > 0) {
                    const avgInterestRate = (avgInflation + 5) / 100;
                    merged.bondSolValue = (merged.bondSolValue || 0) * Math.pow(1 + (avgInterestRate / 100), offlineSec);
                 }
              }

              // 5. Dywidendy offline z GPW
              const dividendTicks = Math.floor(offlineSec / 30);
              if (dividendTicks > 0) {
                 let totalDividends = 0;
                 const hasGpwInvestor = merged.unlockedAchievements?.['gpw_investor'];
                 const dividendMultiplier = hasGpwInvestor ? 1.2 : 1.0;
                 
                 GPW_STOCKS.forEach(stock => {
                   const owned = merged.sharesOwned[stock.id] || 0;
                   if (owned > 0) {
                     const price = merged.stockPrices[stock.id] || stock.basePrice;
                     const divAmount = owned * price * stock.dividendRate * dividendMultiplier * dividendTicks;
                     totalDividends += Math.floor(divAmount);
                   }
                 });
                                  if (totalDividends > 0) {
                    merged.pln += totalDividends;
                    merged.stats.totalPlnEarned = (merged.stats.totalPlnEarned || 0) + totalDividends;
                    offlineRep.earnedPln += totalDividends;
                    offlineRep.dividends += totalDividends;
                  }
               }

              // 6. Spółki Nomenklaturowe offline
              const locktimeLeft = merged.sbLockdownTimeLeft || 0;
              const activeOfflineSec = Math.max(0, offlineSec - locktimeLeft);
              merged.sbLockdownTimeLeft = Math.max(0, locktimeLeft - offlineSec);

              if (activeOfflineSec > 0) {
                let suspAccrued = 0;
                const hasCorruptionAch = merged.unlockedAchievements?.['nom_corruption'];
                const achSuspMult = hasCorruptionAch ? 0.70 : 1.0;
                let totalNomenklaturaEarnedThisSession = 0;

                NOMENKLATURA_COMPANIES.forEach(comp => {
                  const companyState = merged.nomenklaturaCompanies?.[comp.id];
                  if (companyState && companyState.registered) {
                    const assetMultiplier = 1 + (companyState.assetLevel || 0);
                    const directorMultiplier = 1 + (companyState.directorCount || 0) * 0.5;
                    const rateMult = assetMultiplier * directorMultiplier;
                    
                    const twMult = companyState.twAssigned ? 0.40 : 1.0;
                    suspAccrued += 0.02 * twMult * achSuspMult * activeOfflineSec;

                    if (comp.generateType === 'pln') {
                      const inflationFactor = 1 + ((merged.inflationPercent || 0) / 100);
                      const amount = Math.floor(comp.baseRate * rateMult * activeOfflineSec * inflationFactor);
                      merged.pln += amount;
                      merged.stats.totalPlnEarned = (merged.stats.totalPlnEarned || 0) + amount;
                      totalNomenklaturaEarnedThisSession += amount;
                      offlineRep.earnedPln += amount;
                    } else if (comp.generateType === 'dollars') {
                      const amount = Math.floor(comp.baseRate * rateMult * activeOfflineSec);
                      merged.dollars += amount;
                      merged.stats.totalDollarsEarned = (merged.stats.totalDollarsEarned || 0) + amount;
                      offlineRep.earnedDollars += amount;
                    } else if (comp.generateType === 'autos') {
                      const autosEarned = Math.floor((comp.baseRate * rateMult * activeOfflineSec) / 60);
                      if (autosEarned > 0) {
                        for (let i = 0; i < autosEarned; i++) {
                          const isFiat = Math.random() < 0.5;
                          const carId = isFiat ? 'fiat125' : 'polonez';
                          merged.inventory[carId] = (merged.inventory[carId] || 0) + 1;
                          offlineRep.earnedItems[carId] = (offlineRep.earnedItems[carId] || 0) + 1;
                        }
                      }
                    } else if (comp.generateType === 'special') {
                      const rubleAmount = Math.floor(comp.baseRate * rateMult * activeOfflineSec);
                      const bonyAmount = Math.floor(2 * rateMult * activeOfflineSec);
                      merged.ruble = (merged.ruble || 0) + rubleAmount;
                      merged.bonyBaltona = (merged.bonyBaltona || 0) + bonyAmount;
                      offlineRep.earnedItems['ruble'] = (offlineRep.earnedItems['ruble'] || 0) + rubleAmount;
                      offlineRep.earnedItems['bonyBaltona'] = (offlineRep.earnedItems['bonyBaltona'] || 0) + bonyAmount;
                      merged.stats.totalBonyEarned = (merged.stats.totalBonyEarned || 0) + bonyAmount;
                    }
                  }
                });

                if (totalNomenklaturaEarnedThisSession > 0) {
                  merged.stats.totalNomenklaturaEarned = (merged.stats.totalNomenklaturaEarned || 0) + totalNomenklaturaEarnedThisSession;
                }

                if (suspAccrued > 0) {
                  merged.sbSuspicion = Math.min(100, (merged.sbSuspicion || 0) + suspAccrued);
                }
              }

              // 7. Faza I: Konta Zagraniczne offline progress
              if (merged.swissAccountUnlocked) {
                const hasLaundryAch = merged.unlockedAchievements?.['offshore_laundry'];
                const depositInterestMult = hasLaundryAch ? 1.20 : 1.00;
                const hasZurichAch = merged.unlockedAchievements?.['offshore_zurich'];
                const baseInterestRateMin = hasZurichAch ? 0.0015 : 0.0010;

                const remainingTransfers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[] = [];
                let transferredPln = 0;
                let transferredUsd = 0;

                (merged.activeWireTransfers || []).forEach((transfer: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }) => {
                  const tLeft = transfer.timeLeft - offlineSec;
                  if (tLeft <= 0) {
                    if (transfer.currency === 'pln') transferredPln += transfer.amount;
                    else transferredUsd += transfer.amount;
                  } else {
                    remainingTransfers.push({ ...transfer, timeLeft: tLeft });
                  }
                });
                merged.activeWireTransfers = remainingTransfers;

                const remainingCouriers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[] = [];
                (merged.activeCouriers || []).forEach((courier: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }) => {
                  const tLeft = courier.timeLeft - offlineSec;
                  if (tLeft <= 0) {
                    const fail = Math.random() < 0.10;
                    if (fail) {
                      merged.suspicion = Math.min(100, (merged.suspicion || 0) + 30);
                    } else {
                      if (courier.currency === 'pln') transferredPln += courier.amount;
                      else transferredUsd += courier.amount;
                    }
                  } else {
                    remainingCouriers.push({ ...courier, timeLeft: tLeft });
                  }
                });
                merged.activeCouriers = remainingCouriers;

                merged.swissBalancePln = (merged.swissBalancePln || 0) + transferredPln;
                merged.swissBalanceUsd = (merged.swissBalanceUsd || 0) + transferredUsd;

                const remainingDeposits: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number; depositTypeId: string }[] = [];
                let returnedPln = 0;
                let returnedUsd = 0;

                (merged.activeOffshoreDeposits || []).forEach((dep: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number; depositTypeId: string }) => {
                  const tLeft = dep.timeLeft - offlineSec;
                  if (tLeft <= 0) {
                    const depType = OFFSHORE_DEPOSITS.find(d => d.id === dep.depositTypeId);
                    const rate = depType ? (depType.interestRate * depositInterestMult) : 0;
                    const finalAmount = Math.floor(dep.amount * (1 + rate));
                    if (dep.currency === 'pln') { returnedPln += finalAmount; offlineRep.interest += (finalAmount - dep.amount); }
                    else { returnedUsd += finalAmount; offlineRep.interest += (finalAmount - dep.amount); }
                  } else {
                    remainingDeposits.push({ ...dep, timeLeft: tLeft });
                  }
                });
                merged.activeOffshoreDeposits = remainingDeposits;
                merged.swissBalancePln = (merged.swissBalancePln || 0) + returnedPln;
                merged.swissBalanceUsd = (merged.swissBalanceUsd || 0) + returnedUsd;

                const minutes = Math.floor(offlineSec / 60);
                if (minutes > 0) {
                  const interestMultiplier = Math.pow(1 + baseInterestRateMin, minutes);
                  merged.swissBalancePln = Math.floor((merged.swissBalancePln || 0) * interestMultiplier);
                  merged.swissBalanceUsd = Math.floor((merged.swissBalanceUsd || 0) * interestMultiplier);
                }

                if (merged.offshoreCreditTaken > 0) {
                  merged.offshoreCreditTimeLeft = Math.max(0, merged.offshoreCreditTimeLeft - offlineSec);
                  if (merged.offshoreCreditTimeLeft <= 0) {
                    if (merged.nomenklaturaCompanies) {
                      Object.keys(merged.nomenklaturaCompanies).forEach(cId => {
                        const company = merged.nomenklaturaCompanies[cId];
                        if (company && company.registered) {
                          company.assetLevel = Math.max(0, company.assetLevel - 2);
                        }
                      });
                    }
                    merged.offshoreCreditTaken = 0;
                    merged.offshoreCreditTimeLeft = 0;
                  }
                }
              }
              // Faza J: Syndykat COCOM offline
              if (merged.syndicateUnlocked) {
              // Resolve COCOM shipments
              const remainingShipments: { id: string; itemId: string; contactId: string; route: string; amount: number; timeLeft: number }[] = [];
              (merged.activeCocomShipments || []).forEach((ship: { id: string; itemId: string; contactId: string; route: string; amount: number; timeLeft: number }) => {
                const tLeft = ship.timeLeft - offlineSec;
                if (tLeft <= 0) {
                  // Simplified offline — success for all shipments
                  merged.cocomProceedsPln = (merged.cocomProceedsPln || 0) + ship.amount;
                  merged.stats.totalCocomItemsSold = (merged.stats.totalCocomItemsSold || 0) + 1;
                  merged.stats.totalCocomRevenuePln = (merged.stats.totalCocomRevenuePln || 0) + ship.amount;
                  offlineRep.earnedPln += ship.amount;
                } else {
                  remainingShipments.push({ ...ship, timeLeft: tLeft });
                }
              });
              merged.activeCocomShipments = remainingShipments;

              // Expire geo events
              if (merged.geoEventTimeLeft > 0) {
                merged.geoEventTimeLeft = Math.max(0, merged.geoEventTimeLeft - offlineSec);
                if (merged.geoEventTimeLeft <= 0) {
                  merged.activeGeoEvent = null;
                }
              }

              // Faza L: Globalne Imperium Przemytnicze offline
              const remainingSmugglingRuns: GameState['activeCocomSmugglingRuns'] = [];
              (merged.activeCocomSmugglingRuns || []).forEach((run: GameState['activeCocomSmugglingRuns'][number]) => {
                const tLeft = run.timeLeft - offlineSec;
                if (tLeft <= 0) {
                  // Wypłata zysków w offline (uproszczony sukces)
                  merged.cocomProceedsPln = (merged.cocomProceedsPln || 0) + run.potentialPayoutPln;
                  merged.stats.totalCocomItemsSold = (merged.stats.totalCocomItemsSold || 0) + run.itemIds.length;
                  merged.stats.totalCocomRevenuePln = (merged.stats.totalCocomRevenuePln || 0) + run.potentialPayoutPln;
                  offlineRep.earnedPln += run.potentialPayoutPln;
                  
                  // Wypłata pensji kurierowi
                  const salary = run.personnelId ? (COCOM_PERSONNEL.find(person => person.id === run.personnelId)?.salaryPerRunPln || 0) : 0;
                  merged.pln = Math.max(0, merged.pln - salary);
                } else {
                  remainingSmugglingRuns.push({ ...run, timeLeft: tLeft });
                }
              });
              merged.activeCocomSmugglingRuns = remainingSmugglingRuns;
            } // end if (merged.syndicateUnlocked)
            
            merged.offlineReport = offlineRep;
          } // end if (timeDiffSec > 10)
        // Inicjalizacja giełdy w załadowanym stanie, jeśli pusta
        GPW_STOCKS.forEach(stock => {
          if (!merged.stockPrices[stock.id]) {
            merged.stockPrices[stock.id] = stock.basePrice;
          }
          if (!merged.stockPriceHistories[stock.id] || merged.stockPriceHistories[stock.id].length === 0) {
            merged.stockPriceHistories[stock.id] = [stock.basePrice];
          }
        });

        return merged;
      } catch {
        return structuredClone(INITIAL_STATE);
      }
    }
    // [Claude] klon zamiast wspoldzielenia: petla gry mutuje zagniezdzone obiekty stanu,
    // a INITIAL_STATE musi zostac nietkniety (korzysta z niego reset i scalanie zapisu)
    return structuredClone(INITIAL_STATE);
  });

  // Autozapis gry
  // [Claude] co 60 s (na zyczenie wlasciciela; wczesniej 5 s) - serializacja calego stanu
  // do localStorage to najdrozsza cykliczna operacja poza renderem. Nic nie ginie przy
  // zamknieciu gry: efekt nizej zapisuje natychmiast przy beforeunload/ukryciu karty.
  // podczas gdy pętla gry w App.tsx ma WŁASNE wahania kursu co 10 s (±5%, widełki 80-150,
  // z bonusem polisy asekuracyjnej). Dwa systemy walczyły ze sobą - kurs skakał chaotycznie
  // i uciekał poza widełki nowszego systemu. Zostaje wyłącznie system z pętli gry,
  // a tu zostaje sam autozapis (rzadszy: co 5 s zamiast 2 s, bo serializacja całego stanu
  // do localStorage to najdroższa cykliczna operacja poza renderem).
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setState(s => {
        const newState = { ...s, lastSave: Date.now() };
        if (newState.partyRank === 'minister' || newState.partyRank === 'biuro') {
          newState.suspicion = 0;
        }
        localStorage.setItem('kombinator-save', JSON.stringify(newState));
        return newState;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // [Claude] KIERUNEK 2 (uzupelnienie autosave 60 s): zapis "na wyjscie" - przy zamykaniu
  // strony i przy ukryciu karty (przelaczenie okna, telefon). Ref jest odswiezany w efekcie
  // po kazdym renderze (zapis do refa w trakcie renderu lamalby react-hooks/refs).
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    const saveNow = () => {
      try {
        localStorage.setItem('kombinator-save', JSON.stringify({ ...stateRef.current, lastSave: Date.now() }));
      } catch {
        // np. pelny magazyn - okresowy autozapis sprobuje ponownie
      }
    };
    window.addEventListener('beforeunload', saveNow);
    const onVisibility = () => { if (document.visibilityState === 'hidden') saveNow(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const updateState = useCallback((updates: Partial<GameState> | ((s: GameState) => GameState)) => {
    setState(s => {
      const next = typeof updates === 'function' ? updates(s) : { ...s, ...updates };
      // Koniak Napoleon: obniża podejrzenie milicji ze wszystkich źródeł o 25%
      if (next.suspicion > s.suspicion) {
        const addedSusp = next.suspicion - s.suspicion;
        const koniakMult = next.baltonaUpgrades?.['koniak'] ? 0.75 : 1.0;
        next.suspicion = s.suspicion + (addedSusp * koniakMult);
      }
      // Minister i wyższe rangi: brak podejrzenia
      if ((next.partyRank === 'minister' || next.partyRank === 'biuro') && next.suspicion !== 0) {
        next.suspicion = 0;
      }
      if (next.pln > next.stats.maxPlnHeld) {
        next.stats = { ...next.stats, maxPlnHeld: Math.floor(next.pln) };
      }
      return next;
    });
  }, []);

  const resetGame = useCallback((
    prestigeToEarn: number = 0, 
    destination: 'nrf' | 'austria' | 'usa' | 'kanada' | 'australia' | null = null,
    startSpeedrun: boolean = false
  ) => {
    setState(s => {
      const nextPrestigeCount = (s.prestigeCount || 0) + 1;
      const nextState = {
        ...structuredClone(INITIAL_STATE), 
        prestigePoints: s.prestigePoints + prestigeToEarn,
        prestigeCount: nextPrestigeCount,
        activeDestination: destination,
        speedrunActive: startSpeedrun,
        speedrunTime: 0,
        speedrunHistory: s.speedrunHistory || [],
        unlockedAchievements: s.unlockedAchievements || {},
        stats: {
          ...INITIAL_STATE.stats,
          totalTimePlayed: s.stats.totalTimePlayed,
          totalPlnEarned: s.stats.totalPlnEarned,
          totalDollarsEarned: s.stats.totalDollarsEarned,
          totalItemsSold: s.stats.totalItemsSold,
          totalTimeQueued: s.stats.totalTimeQueued,
          totalCinkciarzExchanges: s.stats.totalCinkciarzExchanges,
          totalBribesPaidPln: s.stats.totalBribesPaidPln,
          totalConfiscations: s.stats.totalConfiscations,
          totalCleCatches: s.stats.totalCleCatches,
          totalSmugglesCompleted: s.stats.totalSmugglesCompleted,
          totalBlackMarketPurchases: s.stats.totalBlackMarketPurchases,
          maxPlnHeld: s.stats.maxPlnHeld,
          totalSbRaids: s.stats.totalSbRaids || 0,
          totalSeaSmugglesCompleted: s.stats.totalSeaSmugglesCompleted || 0,
          totalBonyEarned: s.stats.totalBonyEarned || 0,
          totalGpwProfit: s.stats.totalGpwProfit || 0,
          totalNomenklaturaEarned: s.stats.totalNomenklaturaEarned || 0,
          totalOffshoreTransfersPln: s.stats.totalOffshoreTransfersPln || 0
        },
        nomenklaturaUnlocked: s.nomenklaturaUnlocked || false,
        swissAccountUnlocked: s.swissAccountUnlocked || false,
        swissAccountNumber: s.swissAccountNumber || '',
        syndicateUnlocked: s.syndicateUnlocked || false,
        unlockedContacts: s.unlockedContacts || { moscow_bureau: true },
        syndicateUpgrades: s.syndicateUpgrades || {},
        fazaMUnlocked: s.fazaMUnlocked || false,
        nfiCompanies: s.nfiCompanies || {},
        nfiCompanyStatus: s.nfiCompanyStatus || INITIAL_STATE.nfiCompanyStatus,
        bazarInventory: s.bazarInventory || {},
        bazarMarketSaturation: s.bazarMarketSaturation || INITIAL_STATE.bazarMarketSaturation,
        activeBazarTransports: s.activeBazarTransports || [],
        bazarWarehouseUpgradeId: s.bazarWarehouseUpgradeId || null,
        bazarWarehouseCapacity: s.bazarWarehouseCapacity || 50,
        mediaUnlocked: s.mediaUnlocked || false,
        mediaStations: s.mediaStations || {},
        mediaPrograms: s.mediaPrograms || {},
        activeMediaPrograms: s.activeMediaPrograms || {
          'gazeta_bazarowa': { 'rano': null, 'poludnie': null, 'wieczor': null },
          'radio_szum': { 'rano': null, 'poludnie': null, 'wieczor': null },
          'tv_kombinator': { 'rano': null, 'poludnie': null, 'wieczor': null }
        },
        mediaAntennas: s.mediaAntennas || {},
        mediaTrust: s.mediaTrust || { 'gazeta_bazarowa': 100, 'radio_szum': 100, 'tv_kombinator': 100 },
        mediaKrritBribeDiscount: s.mediaKrritBribeDiscount || 1.0,
        fazaNUnlocked: s.fazaNUnlocked || false,
        districtControl: s.districtControl || INITIAL_STATE.districtControl,
      };
      
      nextState.unlockedAchievements['pres_escape_1'] = true;
      if (nextState.prestigePoints >= 5) {
        nextState.unlockedAchievements['pres_escape_2'] = true;
      }
      if (nextState.prestigePoints >= 50) {
        nextState.unlockedAchievements['pres_points'] = true;
      }
      
      // Milestone 3: Zeszyt komitetu aktywny od startu
      if (nextPrestigeCount >= 3) {
        nextState.plnUpgrades.zeszyt = true;
      }
      
      // Ustalanie startowej gotówki (Milestone 1: 50 PLN zamiast 5)
      let startPln = 5;
      if (nextPrestigeCount >= 1) {
        startPln = 50;
      }
      if (nextState.unlockedAchievements['pres_escape_2']) {
        startPln += 200;
      }
      
      nextState.pln = startPln;
      nextState.stats.totalPlnEarned = startPln;
      
      // Bonus USA ($10 na start)
      if (destination === 'usa') {
        nextState.dollars = 10;
        nextState.stats.totalDollarsEarned = 10;
      }

      // Inicjalizacja giełdy w nowej pętli
      GPW_STOCKS.forEach(stock => {
        nextState.stockPrices[stock.id] = stock.basePrice;
        nextState.stockPriceHistories[stock.id] = [stock.basePrice];
      });
      
      localStorage.setItem('kombinator-save', JSON.stringify(nextState));
      return nextState;
    });
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  return { state, updateState, resetGame, getState };
}
