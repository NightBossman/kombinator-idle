import { useState, useEffect, useRef } from 'react';
import { useGameState, generateBlackMarketOffers } from './hooks/useGameState';
import { QUEUE_ITEMS, HELPERS, PEWEX_ITEMS, PARTY_RANKS, PLN_UPGRADES, BUSINESSES, SMUGGLING_ROUTES, HISTORY_EVENTS, ACHIEVEMENTS, SOLIDARITY_LEVELS, PRODUCED_ITEMS, LUXURY_ITEMS, SEA_SMUGGLING_ROUTES, BALTONA_ITEMS, GPW_STOCKS, GPW_EVENTS, NOMENKLATURA_COMPANIES, OFFSHORE_DEPOSITS, COCOM_ITEMS, EXPORT_CONTACTS, SYNDICATE_UPGRADES, GEOPOLITICAL_EVENTS, ELECTION_REGIONS, CAMPAIGN_MATERIALS, CAMPAIGN_LEADERS, DEBATE_OPTIONS, ELECTION_UPGRADES, COCOM_SMUGGLING_ROUTES, COCOM_VEHICLES, COCOM_PERSONNEL, BAZAR_ITEMS, NFI_COMPANIES, MAFIA_PROTECTIONS, WARSAW_DISTRICTS, GANGSTER_UNITS, BLACK_MARKET_WEAPONS, BAZAR_LOGISTICS_ROUTES, WAREHOUSE_UPGRADES, MEDIA_STATIONS, MEDIA_PROGRAMS, MEDIA_ANTENNA_REGIONS , EU_PROJECTS, DOTCOM_UPGRADES, REAL_ESTATE_PROJECTS, CRISIS_REAL_ESTATE, CURRENCY_OPTION_PRESETS } from './game/items';
import { playClick, playSuccess, playError, playAlert, isSoundEnabled, setSoundEnabled } from './utils/audio';
void DEBATE_OPTIONS; void ELECTION_UPGRADES; // Used in Phase K UI tab (added later)

type TabId = 'praca' | 'bazar' | 'przemyt' | 'partia' | 'czarnyRynek' | 'odznaczenia' | 'gpw' | 'offshore' | 'syndykat' | 'wybory' | 'lata90' | 'miasto' | 'lata2000';

const HELPER_UPGRADE_COSTS: Record<string, { resource: string; label: string }> = {
  wladyslaw: { resource: 'gozdziki', label: 'Goździki' },
  kolega: { resource: 'czesci', label: 'Części' },
  halinka: { resource: 'gozdziki', label: 'Goździki' },
  basia: { resource: 'czesci', label: 'Części' },
  spekulant: { resource: 'gozdziki', label: 'Goździki' },
  staszek: { resource: 'czesci', label: 'Części' },
  zygmunt: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  cinkciarz: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  widmo: { resource: 'wyroby_hutnicze', label: 'Wyroby Hutnicze' },
  konspiracja: { resource: 'czesci', label: 'Części' },
};

const calculateLuxurySuspicionReduction = (ownedLuxuryItems: Record<string, boolean> | undefined) => {
  let reduction = 0;
  LUXURY_ITEMS.forEach(item => {
    if (ownedLuxuryItems?.[item.id]) {
      reduction += item.suspicionReduction;
    }
  });
  return Math.min(0.9, reduction);
};

const calculateLuxuryPrestigeBonus = (ownedLuxuryItems: Record<string, boolean> | undefined) => {
  let bonus = 0;
  LUXURY_ITEMS.forEach(item => {
    if (ownedLuxuryItems?.[item.id]) {
      bonus += item.prestigeMult;
    }
  });
  return bonus;
};

function App() {
  const { state, updateState, resetGame: originalResetGame } = useGameState();
  const resetGame = (prestigeToEarn: number, destination: 'nrf' | 'austria' | 'usa' | 'kanada' | 'australia' | null, startSpeedrun: boolean = false) => {
    setActiveQueue(null);
    setQueueProgress(0);
    setActiveQueue2(null);
    setQueueProgress2(0);
    setActiveSmuggle(null);
    setSmuggleProgress(0);
    originalResetGame(prestigeToEarn, destination, startSpeedrun);
  };

  const bidInAuction = () => {
    if (!state.auction) return;
    const currentBid = state.auction.currentBid;
    const increment = state.auction.currency === 'dollars' ? 50 : 1000;
    const newBid = currentBid + increment;
    
    const hasEnough = state.auction.currency === 'dollars' 
      ? state.dollars >= newBid 
      : state.pln >= newBid;
      
    if (!hasEnough) {
      playError();
      return;
    }
    
    playClick();
    updateState(s => {
      if (!s.auction) return s;
      const logMsg = `[${Math.floor(s.auction.timeLeft)}s] Gracz licytuje ${newBid} ${s.auction.currency === 'dollars' ? '$' : 'zł'}`;
      const newLog = [...(s.auction.biddingLog || []), logMsg];
      if (newLog.length > 5) newLog.shift();
      
      return {
        ...s,
        auction: {
          ...s.auction,
          currentBid: newBid,
          highestBidder: 'Gracz',
          biddingLog: newLog
        }
      };
    });
  };
  
  const [activeQueue, setActiveQueue] = useState<string | null>(null);
  const [queueProgress, setQueueProgress] = useState(0);
  const [activeQueue2, setActiveQueue2] = useState<string | null>(null);
  const [queueProgress2, setQueueProgress2] = useState(0);
  
  const [activeSmuggle, setActiveSmuggle] = useState<string | null>(null);
  const [smuggleProgress, setSmuggleProgress] = useState(0);
  const [przemytSubTab, setPrzemytSubTab] = useState<'land' | 'sea' | 'nomenklatura'>('land');
  
  const [currentTab, setCurrentTab] = useState<TabId>('praca');
  const [lata90SubTab, setLata90SubTab] = useState<'bazar' | 'nfi' | 'media' | 'mafia'>('bazar');
  const [lata2000SubTab, setLata2000SubTab] = useState<'ue' | 'dotcom' | 'deweloperka' | 'zmywak'>('ue');
  const [selectedStockId, setSelectedStockId] = useState<string>('kghm');
  const [toasts, setToasts] = useState<{ id: string; title: string; desc: string }[]>([]);
  const [casioMode, setCasioMode] = useState<'bilans' | 'statystyki' | 'szczegoly'>('bilans');
  const [speedrunChecked, setSpeedrunChecked] = useState(false);
  const [offshoreTransferAmount, setOffshoreTransferAmount] = useState<string>('');
  const [offshoreExchangeAmount, setOffshoreExchangeAmount] = useState<string>('');
  const [offshoreDepositAmount, setOffshoreDepositAmount] = useState<string>('');
  const [offshoreWashAmount, setOffshoreWashAmount] = useState<string>('');
  const [wholesalePrices, setWholesalePrices] = useState<Record<string, { pln: number, usd: number }>>({
    kawa: { pln: 300, usd: 3 },
    spirytus: { pln: 600, usd: 6 },
    dzinsy: { pln: 800, usd: 8 },
    kasprzak: { pln: 3000, usd: 30 }
  });
  const [realTime, setRealTime] = useState(new Date());
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const toggleSound = () => {
    const newState = !soundOn;
    setSoundEnabled(newState);
    setSoundOn(newState);
    if (newState) {
      setTimeout(() => playClick(), 10);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setRealTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWholesalePrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          const basePln = key === 'kawa' ? 300 : key === 'spirytus' ? 600 : key === 'dzinsy' ? 800 : 3000;
          const baseUsd = key === 'kawa' ? 3 : key === 'spirytus' ? 6 : key === 'dzinsy' ? 8 : 30;
          
          const plnChange = 1 + (Math.random() * 0.30 - 0.15); // ±15%
          const usdChange = 1 + (Math.random() * 0.30 - 0.15); // ±15%
          
          next[key] = {
            pln: Math.round(basePln * plnChange),
            usd: Math.round(baseUsd * usdChange)
          };
        });
        return next;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);
  
  interface GameModal {
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success' | 'raid' | 'pap';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }
  const [activeModal, setActiveModal] = useState<GameModal | null>(null);

  const showAlert = (message: string, title = 'KOMUNIKAT URZĘDOWY', type: 'info' | 'error' | 'success' | 'raid' | 'pap' = 'info') => {
    setActiveModal({
      title,
      message,
      type,
      confirmText: 'ZROZUMIANO',
      onConfirm: () => setActiveModal(null)
    });
  };

  const showConfirm = (message: string, onConfirm: () => void, title = 'DECYZJA') => {
    setActiveModal({
      title,
      message,
      confirmText: 'TAK',
      cancelText: 'NIE',
      onConfirm: () => {
        onConfirm();
        setActiveModal(null);
      },
      onCancel: () => setActiveModal(null)
    });
  };
  
  const isKartkiRequired = (item: { kartkiCost?: number }) => {
    if (!item.kartkiCost) return false;
    if (state.activeDestination === 'australia' && (state.timeInCurrentLoop || 0) < 300) {
      return false;
    }
    return true;
  };

  const addToast = (title: string, desc: string) => {
    const id = Math.random().toString();
    setToasts(prev => [...prev, { id, title, desc }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };
  
  const formatSpeedrunTime = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Check for victory and handle speedrun recording
  useEffect(() => {
    if ((state.pewexItems.transformacja || state.okraglyStolVictory) && state.speedrunActive) {
      const finalTime = state.speedrunTime;
      const history = [...(state.speedrunHistory || [])];
      history.push(finalTime);
      history.sort((a, b) => a - b);
      const topFive = history.slice(0, 5);

      updateState(s => ({
        ...s,
        speedrunActive: false,
        speedrunHistory: topFive
      }));

      // Show retro congratulations telex modal
      const historyStr = topFive.map((t, idx) => `  ${idx + 1}. ${formatSpeedrunTime(t)}`).join('\n');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      showAlert(
        `*** TELEGRAM PILNY ***\n\n` +
        `GRATULACJE! OBALIŁEŚ SYSTEM W TRYBIE SPEEDRUN!\n` +
        `TWÓJ CZAS: ${formatSpeedrunTime(finalTime)}\n\n` +
        `LUDOWA TABELA REKORDÓW (TOP 5):\n${historyStr}\n\n` +
        `Zapisano w rejestrze Kombinatorów.`,
        `TELEGRAM: SUKCES SPEEDRUNU`,
        `success`
      );
    }
  }, [state.pewexItems.transformacja, state.okraglyStolVictory, state.speedrunActive, state.speedrunHistory, state.speedrunTime, updateState]);

  // eslint-disable-next-line react-hooks/purity
  const lastTickRef = useRef(Date.now());
  
  // Game Loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;
      const deltaSec = deltaMs / 1000;
      
      if (settingsOpen) {
        return; // Pauza
      }
      
      updateState(s => {
        const nextState = { 
          ...s, 
          inventory: { ...s.inventory },
          stats: { ...s.stats },
          unlockedAchievements: { ...s.unlockedAchievements }
        };
        
        nextState.timeInCurrentLoop = (s.timeInCurrentLoop || 0) + deltaSec;
        if (s.speedrunActive) {
          nextState.speedrunTime = (s.speedrunTime || 0) + deltaSec;
        }
        if (s.bibulaLockdownRemaining > 0) {
          nextState.bibulaLockdownRemaining = Math.max(0, s.bibulaLockdownRemaining - deltaSec);
        }

        // Faza F (Hiperinflacja): przyrost inflacji co sekundę (zamrożone po denominacji)
        if (!s.isDenominated) {
          let inflationInc = 0.2;
          if (s.partyRank === 'biuro') inflationInc = 0.3;
          else if (s.partyRank === 'minister') inflationInc = 0.14;

          if (s.activeEvent === 'uwolnienie_cen') {
            inflationInc += 0.8;
          }
          const polisaMult = s.inflationUpgrades?.['polisaAsekuracyjna'] ? 0.75 : 1.0;
          nextState.inflationPercent = (s.inflationPercent || 0) + (inflationInc * polisaMult) * deltaSec;
        } else {
          nextState.inflationPercent = 0;
        }

        // Pasywna dewaluacja PLN gotówki (wyłączona po denominacji)
        if (!s.isDenominated && s.activeEvent !== 'reforma_wilczka') {
          const pkoDivider = s.inflationUpgrades?.['kontoPKO'] ? 50000 : 20000;
          const decayMult = 1 - ((nextState.inflationPercent / pkoDivider) * deltaSec);
          if (decayMult > 0 && decayMult < 1) {
            nextState.pln = Math.max(0, nextState.pln * decayMult);
          }
        }

        // Książeczka mieszkaniowa poparcie Solidarności
        if (s.inflationUpgrades?.['ksiazeczkaMieszkaniowa']) {
          nextState.solidarnos = Math.min(10000, (s.solidarnos || 0) + 0.05 * deltaSec);
        }
        
        // Faza C: Zdarzenia historyczne
        let activeEvent = s.activeEvent;
        let eventTimeLeft = s.eventTimeLeft;
        let nextEventIn = s.nextEventIn;

        if (activeEvent) {
          eventTimeLeft -= deltaSec;
          if (eventTimeLeft <= 0) {
            activeEvent = null;
            eventTimeLeft = 0;
          }
        } else {
          nextEventIn -= deltaSec;
          if (nextEventIn <= 0) {
            const availableEvents = HISTORY_EVENTS.filter(e => !e.era || (e.era === 'lata2000' && s.fazaSUnlocked));
            const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];
            activeEvent = randomEvent.id;
            eventTimeLeft = randomEvent.durationSec;
            nextEventIn = Math.floor(Math.random() * 181) + 120; // 2 do 5 minut (120 do 300 sekund)
            
            // Efekty natychmiastowe (Immediate effects)
            if (randomEvent.id === 'papiez') {
              nextState.suspicion = Math.max(0, nextState.suspicion - 20);
              nextState.pln += 500;
              nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + 500;
            } else if (randomEvent.id === 'samochod') {
              const isFiat = Math.random() < 0.5;
              const carId = isFiat ? 'fiat125' : 'syrena';
              nextState.inventory[carId] = (nextState.inventory[carId] || 0) + 1;
            } else if (randomEvent.id === 'lehman_recession') {
              nextState.recessionActive = true;
              nextState.recessionTimer = 180;
              nextState.chfExchangeRate = Math.min(7.20, nextState.chfExchangeRate + 0.50);
            } else if (randomEvent.id === 'toxic_options_scandal') {
              const penalty = Math.floor(nextState.pln * 0.15);
              nextState.pln = Math.max(0, nextState.pln - penalty);
            }
            
            setTimeout(() => {
              playAlert();
              const rewardNotice = randomEvent.id === 'samochod' 
                ? `\n\n[DARMOWY WÓZ]: Do Twojego garażu trafia nowiutki polski pojazd!`
                : randomEvent.id === 'papiez'
                ? `\n\n[DAR]: Otrzymujesz +500 zł i tracisz 20% podejrzeń!`
                : ``;
               showAlert(`--- ${randomEvent.name} ---\n\n${randomEvent.desc}${rewardNotice}`, 'TELEGRAM PAP (Wiadomości)', 'pap');
            }, 50);
          }
        }

        nextState.activeEvent = activeEvent;
        nextState.eventTimeLeft = Math.max(0, Math.floor(eventTimeLeft));
        nextState.nextEventIn = Math.max(0, Math.floor(nextEventIn));

        // Odblokowanie Czarnego Rynku
        if (!s.czarnyRynekUnlocked && s.pln >= 1000) {
          nextState.czarnyRynekUnlocked = true;
        }

        // Rotacja ofert Czarnego Rynku (co 5 minut / 300 sekund)
        const elapsedSinceRefresh = now - s.lastMarketRefresh;
        if (elapsedSinceRefresh > 300000 || s.blackMarketOffers.length === 0) {
          nextState.blackMarketOffers = generateBlackMarketOffers();
          nextState.lastMarketRefresh = now;
        }

        // Faza B: Licytacje i Towary Luksusowe
        let nextAuctionIn = s.nextAuctionIn !== undefined ? s.nextAuctionIn : 600;
        let auction = s.auction;

        if (auction) {
          const newTimeLeft = auction.timeLeft - deltaSec;
          if (newTimeLeft <= 0) {
            const winner = auction.highestBidder;
            const finalBid = auction.currentBid;
            const item = LUXURY_ITEMS.find(li => li.id === auction!.itemId);
            
            if (winner === 'Gracz') {
              if (item) {
                if (item.currency === 'dollars') {
                  nextState.dollars = Math.max(0, nextState.dollars - finalBid);
                } else {
                  nextState.pln = Math.max(0, nextState.pln - finalBid);
                }
                nextState.ownedLuxuryItems = {
                  ...(nextState.ownedLuxuryItems || {}),
                  [item.id]: true
                };
                
                setTimeout(() => {
                  playSuccess();
                  showAlert(
                    `*** REJESTRACJA POJAZDU/ZASOBÓW ***\n\n` +
                    `GRATULACJE! Wygrałeś licytację na Czarnym Rynku!\n` +
                    `Towar: ${item.name} jest teraz Twój za kwotę ${finalBid} ${item.currency === 'dollars' ? '$' : 'zł'}.\n\n` +
                    `Zasila Twoją kolekcję luksusów i daje stały bonus: ${item.desc}.`,
                    `AUKCJA ZAKOŃCZONA - SUKCES`,
                    `success`
                  );
                }, 50);
              }
            } else {
              setTimeout(() => {
                playError();
                showAlert(
                  `Licytacja dobiegła końca.\n\n` +
                  `Niestety, ${winner} zaoferował kwotę ${finalBid} ${auction!.currency === 'dollars' ? '$' : 'zł'} i wygrał licytację na ${auction!.itemName}.\n\n` +
                  `Spróbuj podbić stawkę szybciej następnym razem!`,
                  `AUKCJA ZAKOŃCZONA - PRZEGRANA`,
                  `error`
                );
              }, 50);
            }
            auction = null;
            nextAuctionIn = 600;
          } else {
            const isPlayerLeading = auction.highestBidder === 'Gracz';
            const npcBidChance = (isPlayerLeading ? 0.20 : 0.08) * deltaSec;
            
            const updatedBiddingLog = [...(auction.biddingLog || [])];
            let currentBid = auction.currentBid;
            let highestBidder = auction.highestBidder;
            
            if (Math.random() < npcBidChance) {
              const npcNames = ['Zdzichu', 'Szwagier', 'Wiesiek', 'Janusz', 'Mirek', 'Wojtek', 'Patryk'];
              const randomNpc = npcNames[Math.floor(Math.random() * npcNames.length)];
              const bidIncrement = auction.currency === 'dollars' 
                ? (Math.floor(Math.random() * 3) + 1) * 50 
                : (Math.floor(Math.random() * 4) + 1) * 1000;
              
              currentBid += bidIncrement;
              highestBidder = randomNpc;
              
              const logMsg = `[${Math.floor(newTimeLeft)}s] ${randomNpc} licytuje ${currentBid} ${auction.currency === 'dollars' ? '$' : 'zł'}`;
              updatedBiddingLog.push(logMsg);
              if (updatedBiddingLog.length > 5) {
                updatedBiddingLog.shift();
              }
              
              setTimeout(() => playClick(), 10);
            }
            
            auction = {
              ...auction,
              timeLeft: newTimeLeft,
              currentBid,
              highestBidder,
              biddingLog: updatedBiddingLog
            };
          }
        } else {
          nextAuctionIn -= deltaSec;
          if (nextAuctionIn <= 0) {
            const owned = s.ownedLuxuryItems || {};
            const availableItems = LUXURY_ITEMS.filter(item => !owned[item.id]);
            if (availableItems.length > 0) {
              const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
              
              auction = {
                itemId: selectedItem.id,
                itemName: selectedItem.name,
                currentBid: selectedItem.basePrice,
                highestBidder: 'Cena Wywoławcza',
                timeLeft: 45,
                basePrice: selectedItem.basePrice,
                currency: selectedItem.currency,
                biddingLog: [`Licytacja rozpoczęta! Cena wywoławcza: ${selectedItem.basePrice} ${selectedItem.currency === 'dollars' ? '$' : 'zł'}`]
              };
              
              setTimeout(() => {
                playAlert();
                showAlert(
                  `*** ALARM CZARNEGO RYNKU ***\n\n` +
                  `Rozpoczęła się licytacja towaru luksusowego: ${selectedItem.name}!\n` +
                  `Cena wywoławcza wynosi ${selectedItem.basePrice} ${selectedItem.currency === 'dollars' ? '$' : 'zł'}.\n\n` +
                  `Wejdź w zakładkę CZARNY RYNEK i licytuj, zanim czas dobiegnie końca (45s)!`,
                  `NOWA LICYTACJA ROZPOCZĘTA`,
                  `info`
                );
              }, 50);
            } else {
              nextAuctionIn = 999999;
            }
          }
        }

        nextState.nextAuctionIn = Math.max(0, nextAuctionIn);
        nextState.auction = auction;

        const nrfMult = (s.activeDestination === 'nrf' || s.activeDestination === null) 
          ? (1 + (s.prestigePoints * 0.10)) 
          : 1.0;
        const ngPlusCount = s.prestigeCount || 0;
        const ngPlusMult = ngPlusCount >= 5 ? 1 + (ngPlusCount - 4) * 0.05 : 1.0;
        const generalProductionMult = nrfMult * ngPlusMult;

        const rubleMult = 1 + (s.ruble * 0.005);
        const helperSpeedAchMult = (s.unlockedAchievements?.['pres_points'] ? 1.10 : 1) * (s.unlockedAchievements?.['pol_rank_4'] ? 1.25 : 1);
        const baltonaGrundigMult = s.baltonaUpgrades?.['grundig'] ? 1.4 : 1.0;
        const wilczekMult = s.activeEvent === 'reforma_wilczka' ? 1.5 : 1.0;
        const helperMult = (s.pewexItems['lego'] ? 1.3 : 1) 
                         * (s.pewexItems['sanyo'] ? 1.5 : 1) 
                         * baltonaGrundigMult
                         * generalProductionMult
                         * rubleMult
                         * helperSpeedAchMult
                         * solidarityHelperSpeedMult
                         * wilczekMult;
                          
        // Helpers processing
        HELPERS.forEach(h => {
          const count = s.helpers[h.id] || 0;
          if (count > 0) {
            const level = s.helperUpgrades?.[h.id] || 0;
            const upgradeMult = 1 + level * 0.5;
            const amount = count * h.ratePerTick * deltaSec * helperMult * upgradeMult;
            if (h.id === 'cinkciarz') {
              const baseRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
              const solidarityBonus = s.solidarnos >= 1000 ? 0.95 : 1.0;
              const cinkciarzAchRateMult = (s.unlockedAchievements?.['eco_cinkciarz_1'] ? 0.98 : 1) * (s.unlockedAchievements?.['eco_cinkciarz_2'] ? 0.95 : 1) * solidarityBonus;
              
              // Faza F (Hiperinflacja) i Czarny Wtorek
              let inflationMult = 1 + (nextState.inflationPercent / 100);
              if (s.activeEvent === 'czarny_wtorek') {
                inflationMult *= 2;
              }
              const currentRate = Math.floor(baseRate * cinkciarzAchRateMult * inflationMult);
              const cost = amount * currentRate;
              if (s.pln >= cost) {
                nextState.pln -= cost;
                nextState.dollars += amount;
                nextState.stats.totalDollarsEarned = (nextState.stats.totalDollarsEarned || 0) + amount;
                nextState.stats.totalCinkciarzExchanges = (nextState.stats.totalCinkciarzExchanges || 0) + 1;
                if (!s.pewexItems['szwajcaria'] && s.partyRank !== 'minister' && s.partyRank !== 'biuro' && s.activeEvent !== 'odwilz') {
                  const suspAchMult = (s.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (s.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
                  const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
                  nextState.suspicion += Math.max(0, amount * 1 * suspAchMult * luxurySuspMult);
                }
              }
            } else if (h.id === 'widmo') {
              nextState.dollars += amount;
              nextState.stats.totalDollarsEarned = (nextState.stats.totalDollarsEarned || 0) + amount;
            } else if (h.id === 'staszek') {
              nextState.inventory['predom'] = (nextState.inventory['predom'] || 0) + amount * 0.5;
              nextState.inventory['kasprzak'] = (nextState.inventory['kasprzak'] || 0) + amount * 0.5;
            } else if (h.id === 'konspiracja') {
              nextState.kartki = (nextState.kartki || 0) + amount;
            } else {
              nextState.inventory[h.generateId] = (nextState.inventory[h.generateId] || 0) + amount;
            }
          }
        });

        // Businesses processing
        BUSINESSES.forEach(b => {
          const count = s.businesses[b.id] || 0;
          if (count > 0) {
            const rubinMult = s.pewexItems['rubin'] ? 2.0 : 1.0;
            const biuroMult = s.partyRank === 'biuro' ? 3.0 : 1.0;
            const businessAchMult = s.unlockedAchievements?.['eco_usd_1'] ? 1.10 : 1;
            const transformMult = s.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
            const importMult = s.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
            const wilczekMult = s.activeEvent === 'reforma_wilczka' ? 1.5 : 1.0;
            const amount = count * b.ratePerTick * deltaSec * rubinMult * biuroMult * businessAchMult * transformMult * generalProductionMult * (b.generateType === 'pln' || b.generateType === 'dollars' ? importMult : 1.0) * wilczekMult;
            if (b.generateType === 'pln') {
               // Faza F (Hiperinflacja) i Automat Pewex
               const baseRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
               let inflationMult = 1 + (nextState.inflationPercent / 100);
               if (s.activeEvent === 'czarny_wtorek') inflationMult *= 2;
               const currentMarketRate = Math.floor(baseRate * inflationMult);
               
               if (s.inflationUpgrades?.['automatPewex'] && currentMarketRate > 0) {
                 const plnKept = amount * 0.75;
                 const plnExchanged = amount * 0.25;
                 const PewexBonyEarned = plnExchanged / currentMarketRate;
                 
                 nextState.pln += plnKept;
                 nextState.bonyPewex = (nextState.bonyPewex || 0) + PewexBonyEarned;
                 nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + plnKept;
               } else {
                 nextState.pln += amount;
                 nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + amount;
               }
            } else if (b.generateType === 'dollars') {
               nextState.dollars += amount;
               nextState.stats.totalDollarsEarned = (nextState.stats.totalDollarsEarned || 0) + amount;
            } else {
               nextState.inventory[b.generateType] = (nextState.inventory[b.generateType] || 0) + amount;
            }
          }
        });
        // Faza F (Hiperinflacja): Obligacje PRL pasywny zysk PLN
        if (s.bondPrlCount > 0) {
          const passivePln = s.bondPrlCount * 2000 * deltaSec;
          nextState.pln += passivePln;
          nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + passivePln;
        }

        // Faza F (Hiperinflacja): Obligacje Solidarności indeksowane inflacją
        if (s.bondSolCount > 0) {
          const interestRate = (nextState.inflationPercent + 5) / 100;
          nextState.bondSolValue = (s.bondSolValue || 0) * (1 + (interestRate / 100) * deltaSec);
        }

        // Faza H: Spółki Nomenklaturowe i Korporacje
        if (s.sbLockdownTimeLeft > 0) {
          nextState.sbLockdownTimeLeft = Math.max(0, s.sbLockdownTimeLeft - deltaSec);
        }

        const isSbLockdown = nextState.sbLockdownTimeLeft > 0;
        let totalNomenklaturaEarnedThisTick = 0;

        if (!isSbLockdown) {
          let suspAccrued = 0;
          const hasCorruptionAch = s.unlockedAchievements?.['nom_corruption'];
          const achSuspMult = hasCorruptionAch ? 0.70 : 1.0;

          NOMENKLATURA_COMPANIES.forEach(comp => {
            const companyState = s.nomenklaturaCompanies?.[comp.id];
            if (companyState && companyState.registered) {
              const assetMultiplier = 1 + (companyState.assetLevel || 0);
              const directorMultiplier = 1 + (companyState.directorCount || 0) * 0.5;
              const rateMult = assetMultiplier * directorMultiplier;
              const twMult = companyState.twAssigned ? 0.40 : 1.0;
              
              const hasCounterIntel = s.sbCounterIntelTimeLeft > 0;
              if (!hasCounterIntel) {
                suspAccrued += 0.02 * twMult * achSuspMult * deltaSec;
              }

              const baseAmount = comp.baseRate * rateMult * deltaSec;

              if (comp.generateType === 'pln') {
                const inflationFactor = 1 + (nextState.inflationPercent / 100);
                const finalAmount = Math.floor(baseAmount * inflationFactor);
                
                nextState.pln += finalAmount;
                nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + finalAmount;
                totalNomenklaturaEarnedThisTick += finalAmount;
              } else if (comp.generateType === 'dollars') {
                const finalAmount = Math.floor(baseAmount);
                nextState.dollars += finalAmount;
                nextState.stats.totalDollarsEarned = (nextState.stats.totalDollarsEarned || 0) + finalAmount;
              } else if (comp.generateType === 'autos') {
                if (Math.random() < (rateMult * deltaSec / 60)) {
                  const isFiat = Math.random() < 0.5;
                  const carId = isFiat ? 'fiat125' : 'polonez';
                  nextState.inventory[carId] = (nextState.inventory[carId] || 0) + 1;
                  setTimeout(() => {
                    playSuccess();
                    addToast("PRODUKCJA FSO", `Z linii montażowej zjechał nowy ${isFiat ? 'Fiat 125p' : 'Polonez'} i trafił do Twojego garażu!`);
                  }, 50);
                }
              } else if (comp.generateType === 'special') {
                const rubleAmount = Math.floor(baseAmount);
                const bonyAmount = Math.floor(2 * rateMult * deltaSec);
                nextState.ruble = (nextState.ruble || 0) + rubleAmount;
                nextState.bonyBaltona = (nextState.bonyBaltona || 0) + bonyAmount;
                nextState.stats.totalBonyEarned = (nextState.stats.totalBonyEarned || 0) + bonyAmount;
              }
            }
          });

          if (totalNomenklaturaEarnedThisTick > 0) {
            nextState.stats.totalNomenklaturaEarned = (nextState.stats.totalNomenklaturaEarned || 0) + totalNomenklaturaEarnedThisTick;
          }

          if (suspAccrued > 0) {
            nextState.sbSuspicion = Math.min(100, (s.sbSuspicion || 0) + suspAccrued);
          }
        }

        if (nextState.sbSuspicion >= 100) {
          nextState.sbSuspicion = 0;
          nextState.sbLockdownTimeLeft = 90;

          const hasTrust = s.hasLiechtensteinTrust;
          const hasOffshoreTrustAch = s.unlockedAchievements?.['offshore_trust'];
          const penaltyMultiplier = hasTrust ? (hasOffshoreTrustAch ? 0.05 : 0.20) : 1.00;

          const plnLost = Math.floor(nextState.pln * 0.20 * penaltyMultiplier);
          nextState.pln = Math.max(0, nextState.pln - plnLost);

          let vehicleConfiscated = '';
          const vehicles = ['fiat125', 'polonez', 'syrena'];
          for (const v of vehicles) {
            if (nextState.inventory[v] > 0) {
              nextState.inventory[v] -= 1;
              vehicleConfiscated = v === 'fiat125' ? 'Fiata 125p' : v === 'polonez' ? 'Poloneza' : 'Syrenę';
              break;
            }
          }

          setTimeout(() => {
            playAlert();
            const vehicleMsg = vehicleConfiscated 
              ? `\n\n[KONFISKATA]: Milicja zarekwirowała z Twojego garażu ${vehicleConfiscated}!` 
              : ``;
            showAlert(`Służba Bezpieczeństwa oraz NIK wykryły gigantyczny drenaż kombinatów! Wszystkie Twoje spółki nomenklaturowe zostały zablokowane na 90 sekund, a na Twoje konto nałożono karę w wysokości -20% PLN (${plnLost} zł).${vehicleMsg}`, '🚨 KONTROLA NIK I SŁUŻBY BEZPIECZEŃSTWA', 'raid');
          }, 50);
        }

        // Faza I: Konta Zagraniczne (Szwajcaria i Liechtenstein)
        if (s.swissAccountUnlocked) {
          if (s.interpolLockdownTimeLeft > 0) {
            nextState.interpolLockdownTimeLeft = Math.max(0, s.interpolLockdownTimeLeft - deltaSec);
          }

          const hasLaundryAch = s.unlockedAchievements?.['offshore_laundry'];
          const depositInterestMult = hasLaundryAch ? 1.20 : 1.00;
          const hasZurichAch = s.unlockedAchievements?.['offshore_zurich'];
          const baseInterestRateMin = hasZurichAch ? 0.0015 : 0.0010;

          const remainingTransfers: any[] = [];
          let swiftPlnEarned = 0;
          let swiftUsdEarned = 0;

          (s.activeWireTransfers || []).forEach(transfer => {
            const newTime = transfer.timeLeft - deltaSec;
            if (newTime <= 0) {
              if (transfer.currency === 'pln') swiftPlnEarned += transfer.amount;
              else swiftUsdEarned += transfer.amount;
              
              setTimeout(() => {
                playSuccess();
                addToast("PRZELEW SWIFT", `Zaksięgowano przelew na kwotę: ${transfer.currency === 'pln' ? `${transfer.amount.toLocaleString()} zł` : `$${transfer.amount} USD`}.`);
              }, 50);
            } else {
              remainingTransfers.push({ ...transfer, timeLeft: newTime });
            }
          });
          nextState.activeWireTransfers = remainingTransfers;
          nextState.swissBalancePln = (s.swissBalancePln || 0) + swiftPlnEarned;
          nextState.swissBalanceUsd = (s.swissBalanceUsd || 0) + swiftUsdEarned;

          const remainingCouriers: any[] = [];
          let courierPlnEarned = 0;
          let courierUsdEarned = 0;

          (s.activeCouriers || []).forEach(courier => {
            const newTime = courier.timeLeft - deltaSec;
            if (newTime <= 0) {
              const fail = Math.random() < 0.10;
              if (fail) {
                setTimeout(() => {
                  playError();
                  showAlert(`Twój kurier został zatrzymany na granicy! Służby celne skonfiskowały całą gotówkę (${courier.currency === 'pln' ? `${courier.amount.toLocaleString()} zł` : `$${courier.amount} USD`}) i wszczęły dochodzenie.`, '🚨 KURIER ZATRZYMANY', 'error');
                }, 50);
                nextState.suspicion = Math.min(100, (s.suspicion || 0) + 30);
              } else {
                if (courier.currency === 'pln') courierPlnEarned += courier.amount;
                else courierUsdEarned += courier.amount;
                
                setTimeout(() => {
                  playSuccess();
                  addToast("KURIER OMINĄŁ CŁO", `Kurier pomyślnie dostarczył gotówkę do banku: ${courier.currency === 'pln' ? `${courier.amount.toLocaleString()} zł` : `$${courier.amount} USD`}.`);
                }, 50);
              }
            } else {
              remainingCouriers.push({ ...courier, timeLeft: newTime });
            }
          });
          nextState.activeCouriers = remainingCouriers;
          nextState.swissBalancePln += courierPlnEarned;
          nextState.swissBalanceUsd += courierUsdEarned;

          const remainingDeposits: any[] = [];
          let depositPlnEarned = 0;
          let depositUsdEarned = 0;

          (s.activeOffshoreDeposits || []).forEach(dep => {
            const newTime = dep.timeLeft - deltaSec;
            if (newTime <= 0) {
              const depType = OFFSHORE_DEPOSITS.find(d => d.id === dep.depositTypeId);
              const rate = depType ? (depType.interestRate * depositInterestMult) : 0;
              const finalAmount = Math.floor(dep.amount * (1 + rate));
              
              if (dep.currency === 'pln') depositPlnEarned += finalAmount;
              else depositUsdEarned += finalAmount;

              setTimeout(() => {
                playSuccess();
                showAlert(`Zakończył się okres lokaty "${depType?.name || 'Lokata'}". Środki wraz z odsetkami (${dep.currency === 'pln' ? `${finalAmount.toLocaleString()} zł` : `$${finalAmount} USD`}) wróciły na Twoje konto szwajcarskie.`, '💰 LOKATA ZAKOŃCZONA', 'success');
              }, 50);
            } else {
              remainingDeposits.push({ ...dep, timeLeft: newTime });
            }
          });
          nextState.activeOffshoreDeposits = remainingDeposits;
          nextState.swissBalancePln += depositPlnEarned;
          nextState.swissBalanceUsd += depositUsdEarned;

          const prevMinutes = Math.floor(s.stats.totalTimePlayed / 60);
          const currMinutes = Math.floor(nextState.stats.totalTimePlayed / 60);
          if (currMinutes > prevMinutes) {
            nextState.swissBalancePln = Math.floor(nextState.swissBalancePln * (1 + baseInterestRateMin));
            nextState.swissBalanceUsd = Math.floor(nextState.swissBalanceUsd * (1 + baseInterestRateMin));
            setTimeout(() => {
              addToast("ODSETKI OFFSHORE", "Zaksięgowano pasywne odsetki na koncie w Zurychu.");
            }, 50);
          }

          if (s.offshoreCreditTaken > 0) {
            const newCreditTime = s.offshoreCreditTimeLeft - deltaSec;
            if (newCreditTime <= 0) {
              if (nextState.nomenklaturaCompanies) {
                Object.keys(nextState.nomenklaturaCompanies).forEach(cId => {
                  const company = nextState.nomenklaturaCompanies[cId];
                  if (company && company.registered) {
                    company.assetLevel = Math.max(0, company.assetLevel - 2);
                  }
                });
              }
              nextState.offshoreCreditTaken = 0;
              nextState.offshoreCreditTimeLeft = 0;
              setTimeout(() => {
                playError();
                showAlert("Minął termin spłaty szwajcarskiego kredytu! Bank przeprowadził windykację zastawu - leasing maszyn we wszystkich Twoich spółkach spadł o 2 poziomy.", '🚨 WINDYKACJA BANKOWA', 'error');
              }, 50);
            } else {
              nextState.offshoreCreditTimeLeft = newCreditTime;
            }
          }

          if (nextState.interpolSuspicion >= 100) {
            nextState.interpolSuspicion = 0;
            nextState.interpolLockdownTimeLeft = 180;
            const fine = Math.min(nextState.swissBalanceUsd, 5000);
            nextState.swissBalanceUsd = Math.max(0, nextState.swissBalanceUsd - fine);

            setTimeout(() => {
              playAlert();
              showAlert(`Interpol wykrył podejrzane transakcje na Twoim koncie numerycznym! Twoje szwajcarskie konto zostało zamrożone na 180 sekund, a na poczet kosztów śledztwa zajęto kwotę $${fine} USD.`, '🚨 AUDYT INTERPOLU', 'raid');
            }, 50);
          }
        }

        // Faza J: Syndykat COCOM - tick
        if (s.syndicateUnlocked) {
          // Odliczanie przesyłek COCOM
          const remainingShipments = (s.activeCocomShipments || []).map(ship => {
            const newTime = ship.timeLeft - deltaSec;
            return { ...ship, timeLeft: newTime };
          });

          const completed = remainingShipments.filter(s => s.timeLeft <= 0);
          nextState.activeCocomShipments = remainingShipments.filter(s => s.timeLeft > 0);

          completed.forEach(ship => {
            const item = COCOM_ITEMS.find(c => c.id === ship.itemId);
            if (!item) return;

            // Calculate risk
            let risk = item.riskPercent / 100;
            const contact = EXPORT_CONTACTS.find(c => c.id === ship.contactId);
            if (contact) risk += contact.riskBonus;
            if (nextState.syndicateUpgrades['safe_house']) risk *= 0.85;
            if (nextState.syndicateUpgrades['fake_docs']) risk *= 0.80;
            if (nextState.syndicateUpgrades['customs_contact']) risk *= 0.75;
            if (nextState.unlockedAchievements?.['cocom_first']) risk -= 0.05;
            if (nextState.unlockedAchievements?.['offshore_trust']) risk *= 0.65;
            if ((nextState.cocomInventory['crypto_device'] || 0) > 0) risk *= 0.70;
            if (nextState.activeGeoEvent === 'cocom_relax') risk *= 0.50;
            risk = Math.max(0.02, Math.min(0.95, risk));

            // Embassy immunity check
            let immuneUsed = false;
            if (nextState.syndicateUpgrades['embassy_cover'] && nextState.embassyImmunityCooldown <= 0 && Math.random() < risk) {
              immuneUsed = true;
              nextState.embassyImmunityCooldown = 300;
            }

            const failed = !immuneUsed && Math.random() < risk;

            if (failed) {
              if (!nextState.syndicateUpgrades['fake_docs']) {
                // towar przepada
              }
              nextState.interpolSuspicion = Math.min(100, (nextState.interpolSuspicion || 0) + 25);
              nextState.suspicion = Math.min(100, (nextState.suspicion || 0) + 15);
              setTimeout(() => {
                playError();
                showAlert(`Przesyłka towaru COCOM (${item.name}) została przechwycona! Trasa: ${ship.route}. Interpol +25%, Milicja +15%.`, '🚨 WPADKA SYNDYKATU', 'error');
              }, 50);
            } else {
              const priceMult = contact ? (1 + contact.priceBonus) : 1;
              const chzBonus = (nextState.nomenklaturaCompanies?.['chz']?.registered) ? 1.15 : 1.0;
              const magnateBonus = nextState.unlockedAchievements?.['cocom_magnate'] ? 1.25 : 1.0;
              const earned = Math.floor(item.sellPricePln * priceMult * chzBonus * magnateBonus);
              nextState.cocomProceedsPln = (nextState.cocomProceedsPln || 0) + earned;
              nextState.stats.totalCocomItemsSold = (nextState.stats.totalCocomItemsSold || 0) + 1;
              nextState.stats.totalCocomRevenuePln = (nextState.stats.totalCocomRevenuePln || 0) + earned;
              nextState.interpolSuspicion = Math.min(100, (nextState.interpolSuspicion || 0) + 2);
              if (item.id === 'crypto_device' && !nextState.unlockedAchievements?.['cocom_nsa']) {
                if (!nextState.unlockedAchievements) nextState.unlockedAchievements = {};
                nextState.unlockedAchievements['cocom_nsa'] = true;
                setTimeout(() => {
                  playSuccess();
                  addToast("ZDOBYTO ODZNACZENIE!", "Szpieg Bez Paszportu");
                }, 50);
              }
              // Okrągły Stół bonus
              nextState.okraglyStolPln = (nextState.okraglyStolPln || 0) + 0.5;
              setTimeout(() => {
                playSuccess();
                addToast("SYNDYKAT: TRANSAKCJA", `Dostarczono ${item.name} za ${earned.toLocaleString()} zł!`);
              }, 50);
            }
          });

          // Geo event timer
          if (nextState.geoEventTimeLeft > 0) {
            nextState.geoEventTimeLeft -= deltaSec;
            if (nextState.geoEventTimeLeft <= 0) {
              nextState.activeGeoEvent = null;
              nextState.geoEventTimeLeft = 0;
            }
          }

          // Random geo event trigger (every 3-8 min)
          if (!nextState.activeGeoEvent) {
            const prevGeoTick = Math.floor(s.stats.totalTimePlayed / 30);
            const currGeoTick = Math.floor(nextState.stats.totalTimePlayed / 30);
            if (currGeoTick > prevGeoTick && Math.random() < 0.08) {
              const event = GEOPOLITICAL_EVENTS[Math.floor(Math.random() * GEOPOLITICAL_EVENTS.length)];
              nextState.activeGeoEvent = event.id;
              nextState.geoEventTimeLeft = event.durationSec;

              if (event.effect === 'suspicion_up') {
                nextState.suspicion = Math.min(100, (nextState.suspicion || 0) + 50);
              }

              setTimeout(() => {
                playAlert();
                showAlert(event.desc, `🌐 ${event.name}`, 'raid');
              }, 50);
            }
          }

          // Auto-export
          if (nextState.autoExportEnabled && nextState.syndicateUpgrades['safe_house']) {
            if (nextState.autoExportCooldown > 0) {
              nextState.autoExportCooldown -= deltaSec;
            } else if (nextState.activeGeoEvent !== 'cocom_audit') {
              const inventoryItems = Object.entries(nextState.cocomInventory).filter(([, count]) => count > 0);
              if (inventoryItems.length > 0) {
                const [itemId] = inventoryItems[Math.floor(Math.random() * inventoryItems.length)];
                const item = COCOM_ITEMS.find(c => c.id === itemId);
                if (item && item.riskPercent <= 40) {
                  nextState.cocomInventory[itemId] = (nextState.cocomInventory[itemId] || 1) - 1;
                  let risk = item.riskPercent / 100;
                  if (nextState.syndicateUpgrades['safe_house']) risk *= 0.85;
                  if (nextState.syndicateUpgrades['customs_contact']) risk *= 0.75;
                  risk = Math.max(0.02, risk);

                  if (Math.random() >= risk) {
                    const magnateBonus = nextState.unlockedAchievements?.['cocom_magnate'] ? 1.25 : 1.0;
                    const chzBonus = (nextState.nomenklaturaCompanies?.['chz']?.registered) ? 1.15 : 1.0;
                    const earned = Math.floor(item.sellPricePln * magnateBonus * chzBonus);
                    nextState.cocomProceedsPln = (nextState.cocomProceedsPln || 0) + earned;
                    nextState.stats.totalCocomItemsSold = (nextState.stats.totalCocomItemsSold || 0) + 1;
                    nextState.stats.totalCocomRevenuePln = (nextState.stats.totalCocomRevenuePln || 0) + earned;
                    nextState.stats.totalCocomAutoExports = (nextState.stats.totalCocomAutoExports || 0) + 1;
                  }
                  nextState.autoExportCooldown = 60;
                }
              }
            }
          }

          // Embassy immunity cooldown
          if (nextState.embassyImmunityCooldown > 0) {
            nextState.embassyImmunityCooldown -= deltaSec;
          }
        }

        // Faza L: Globalne Imperium Przemytnicze - tick
        // (Active even if elections are unlocked - it runs parallel)
        if (s.syndicateUnlocked) {
          if (nextState.borderShiftTimeLeft > 0) {
            nextState.borderShiftTimeLeft -= deltaSec;
          }
          if (nextState.borderShiftTimeLeft <= 0) {
            nextState.borderShiftTimeLeft = 60; // 60 seconds per shift
            // Randomize statuses
            ['Świecko (Drogowe)', 'Cieszyn (Drogowe)', 'Szwajcarska Straż Graniczna', 'Terespol (Kolejowe)', 'Okęcie (Kontrola Lotnicza)'].forEach(border => {
              const r = Math.random();
              if (r < 0.1) nextState.borderShiftStatus[border] = 'relaxed';
              else if (r < 0.7) nextState.borderShiftStatus[border] = 'standard';
              else nextState.borderShiftStatus[border] = 'strict';
            });
          }

          // Odliczanie nowych przesyłek COCOM (trasy)
          const remainingSmuggling = (nextState.activeCocomSmugglingRuns || []).map(run => {
            return { ...run, timeLeft: run.timeLeft - deltaSec };
          });

          const completedSmuggling = remainingSmuggling.filter(r => r.timeLeft <= 0);
          nextState.activeCocomSmugglingRuns = remainingSmuggling.filter(r => r.timeLeft > 0);

          completedSmuggling.forEach(run => {
            const route = COCOM_SMUGGLING_ROUTES.find(r => r.id === run.routeId);
            const vehicle = COCOM_VEHICLES.find(v => v.id === run.vehicleId);
            const personnel = COCOM_PERSONNEL.find(p => p.id === run.personnelId);
            if (!route || !vehicle || !personnel) return;

            // Obliczanie sukcesu
            let risk = route.baseRiskPercent;
            risk -= vehicle.stealthBonus;
            risk -= personnel.stealthBonus;

            // Border shift mod
            const bStatus = nextState.borderShiftStatus[route.borderPatrolName];
            if (bStatus === 'relaxed') risk -= 15;
            if (bStatus === 'strict') risk += 20;

            // Synergies/Upgrades
            if (nextState.syndicateUpgrades['safe_house']) risk -= 10;
            if (nextState.syndicateUpgrades['fake_docs']) risk -= 15;
            if (nextState.syndicateUpgrades['customs_contact']) risk -= 20;
            
            risk = Math.max(2, Math.min(95, risk)); // 2% to 95% risk bounds

            const failed = Math.random() * 100 < risk;

            if (failed) {
              nextState.interpolSuspicion = Math.min(100, (nextState.interpolSuspicion || 0) + 30);
              nextState.suspicion = Math.min(100, (nextState.suspicion || 0) + 20);
              setTimeout(() => {
                playError();
                showAlert(`Transport COCOM rozbity na trasie ${route.name}! Wpadka pojazdu: ${vehicle.name}. Interpol +30%, Milicja +20%.`, '🚨 GLOBALNA WPADKA', 'error');
              }, 50);
            } else {
              // Sukces
              const earned = run.potentialPayoutPln;
              nextState.cocomProceedsPln = (nextState.cocomProceedsPln || 0) + earned;
              nextState.stats.totalCocomItemsSold = (nextState.stats.totalCocomItemsSold || 0) + run.itemIds.length;
              nextState.stats.totalCocomRevenuePln = (nextState.stats.totalCocomRevenuePln || 0) + earned;
              
              // Wypłata dla kuriera
              nextState.cocomProceedsPln -= personnel.salaryPerRunPln; // Zapłacono z zysków

              setTimeout(() => {
                playSuccess();
                addToast("GLOBALNY PRZEMYT", `Sukces na trasie ${route.name}! Zysk: ${earned.toLocaleString()} zł (odjęto pensję kuriera).`);
              }, 50);
            }
          });
        }

        // Faza K: Wybory 4 Czerwca - tick
        if (s.electionsUnlocked && s.electionsPhase === 'campaign') {
          nextState.campaignTimePlayed = (nextState.campaignTimePlayed || 0) + deltaSec;
          
          // Passive vote generation in regions with committees
          ELECTION_REGIONS.forEach(region => {
            if (!nextState.regionalCommittees[region.id]) return;
            
            let baseRate = region.baseSupportRate;
            
            // Achievements multipliers
            const hasPropagandaKiller = !!nextState.unlockedAchievements?.['propaganda_killer'];
            const hasChurchAlliance = !!nextState.unlockedAchievements?.['church_alliance'];
            const effFarmerWeight = region.farmerWeight * (hasChurchAlliance ? 1.5 : 1.0);
            
            // Material bonuses
            const totalWorkerBonus = Object.entries(nextState.campaignMaterials).reduce((sum, [matId, count]) => {
              const mat = CAMPAIGN_MATERIALS.find(m => m.id === matId);
              if (!mat || count <= 0) return sum;
              const mult = (matId === 'gazeta_wyborcza' && hasPropagandaKiller) ? 2 : 1;
              return sum + mat.workerBonus * mult * region.workerWeight * count;
            }, 0);
            const totalIntBonus = Object.entries(nextState.campaignMaterials).reduce((sum, [matId, count]) => {
              const mat = CAMPAIGN_MATERIALS.find(m => m.id === matId);
              if (!mat || count <= 0) return sum;
              const mult = (matId === 'gazeta_wyborcza' && hasPropagandaKiller) ? 2 : 1;
              return sum + mat.intellectualBonus * mult * region.intellectualWeight * count;
            }, 0);
            const totalFarmerBonus = Object.entries(nextState.campaignMaterials).reduce((sum, [matId, count]) => {
              const mat = CAMPAIGN_MATERIALS.find(m => m.id === matId);
              if (!mat || count <= 0) return sum;
              const mult = (matId === 'gazeta_wyborcza' && hasPropagandaKiller) ? 2 : 1;
              return sum + mat.farmerBonus * mult * effFarmerWeight * count;
            }, 0);
            
            let voteGain = baseRate + totalWorkerBonus + totalIntBonus + totalFarmerBonus;
            
            // Church support bonus
            if (nextState.churchSupport > 0) {
              voteGain *= (1 + (nextState.churchSupport / 100) * region.churchInfluence);
            }
            
            // Solidarity bonus
            if (nextState.solidarnos >= 5000) voteGain *= 1.2;
            
            // RWE bonus
            if (nextState.rweActive) voteGain += 1000 / ELECTION_REGIONS.length;
            
            // Propaganda penalty
            voteGain *= (1 - (nextState.regimePropaganda || 0) / 200);
            
            // Debate bonus
            if (nextState.debateCompleted) voteGain *= 1.3;
            
            nextState.regionalVotes[region.id] = (nextState.regionalVotes[region.id] || 0) + Math.floor(voteGain * deltaSec);
          });
          
          // Rally countdowns
          const remainingRallies: typeof nextState.activeRallies = [];
          (nextState.activeRallies || []).forEach(rally => {
            const newTime = rally.timeLeft - deltaSec;
            if (newTime <= 0) {
              // Rally completed — big vote boost
              const leader = CAMPAIGN_LEADERS.find(l => l.id === rally.leaderId);
              const region = ELECTION_REGIONS.find(r => r.id === rally.regionId);
              if (leader && region) {
                const isSpecial = leader.specialRegion === region.id;
                const mult = isSpecial ? leader.specialRegionMult : 1.0;
                const boost = Math.floor(5000 * leader.workerMult * region.workerWeight * mult
                  + 5000 * leader.intellectualMult * region.intellectualWeight * mult
                  + 5000 * leader.farmerMult * region.farmerWeight * mult);
                nextState.regionalVotes[region.id] = (nextState.regionalVotes[region.id] || 0) + boost;
                if (leader.id === 'mazowiecki') {
                  nextState.churchSupport = Math.min(100, (nextState.churchSupport || 0) + 5);
                }
                setTimeout(() => {
                  playSuccess();
                  addToast('WIEC ZAKOŃCZONY', `${leader.name} zdobył ${boost.toLocaleString()} głosów w ${region.name}!`);
                }, 50);
              }
            } else {
              remainingRallies.push({ ...rally, timeLeft: newTime });
            }
          });
          nextState.activeRallies = remainingRallies;
          
          // Leader cooldowns
          CAMPAIGN_LEADERS.forEach(leader => {
            if ((nextState.leaderCooldowns[leader.id] || 0) > 0) {
              nextState.leaderCooldowns[leader.id] = Math.max(0, (nextState.leaderCooldowns[leader.id] || 0) - deltaSec);
            }
          });
          
          // Propaganda decay (slow natural decrease)
          if (nextState.regimePropaganda > 0) {
            const prevPropTick = Math.floor(s.campaignTimePlayed / 30);
            const currPropTick = Math.floor(nextState.campaignTimePlayed / 30);
            if (currPropTick > prevPropTick) {
              nextState.regimePropaganda = Math.max(0, nextState.regimePropaganda - 1);
            }
          }
          
          // Church support passive growth from church_fund upgrade
          if (nextState.electionUpgrades['church_fund']) {
            const prevChurchTick = Math.floor(s.campaignTimePlayed / 60);
            const currChurchTick = Math.floor(nextState.campaignTimePlayed / 60);
            if (currChurchTick > prevChurchTick) {
              nextState.churchSupport = Math.min(100, (nextState.churchSupport || 0) + 2);
            }
          }
          
          // Random SB sabotage
          const prevSabTick = Math.floor(s.campaignTimePlayed / 20);
          const currSabTick = Math.floor(nextState.campaignTimePlayed / 20);
          if (currSabTick > prevSabTick && Math.random() < 0.12) {
            const sbChance = nextState.electionUpgrades['guard_squad'] ? 0.6 : 1.0;
            if (Math.random() < sbChance) {
              const sabotageType = Math.random();
              if (sabotageType < 0.4) {
                // Konfiskata materiałów
                const matKeys = Object.keys(nextState.campaignMaterials).filter(k => (nextState.campaignMaterials[k] || 0) > 0);
                if (matKeys.length > 0) {
                  const targetMat = matKeys[Math.floor(Math.random() * matKeys.length)];
                  const lost = Math.ceil((nextState.campaignMaterials[targetMat] || 0) * 0.3);
                  nextState.campaignMaterials[targetMat] = Math.max(0, (nextState.campaignMaterials[targetMat] || 0) - lost);
                  const matName = CAMPAIGN_MATERIALS.find(m => m.id === targetMat)?.name || targetMat;
                  setTimeout(() => {
                    playAlert();
                    showAlert(`SB przeprowadziła rewizję drukarni! Skonfiskowano ${lost} szt. materiału: ${matName}.`, '🚨 SABOTAŻ SB', 'raid');
                  }, 50);
                }
              } else if (sabotageType < 0.7) {
                // Zrywanie plakatów w regionie
                const regionKeys = Object.keys(nextState.regionalCommittees).filter(k => nextState.regionalCommittees[k]);
                if (regionKeys.length > 0) {
                  const targetRegion = regionKeys[Math.floor(Math.random() * regionKeys.length)];
                  const loss = Math.floor((nextState.regionalVotes[targetRegion] || 0) * 0.1);
                  nextState.regionalVotes[targetRegion] = Math.max(0, (nextState.regionalVotes[targetRegion] || 0) - loss);
                  const regionName = ELECTION_REGIONS.find(r => r.id === targetRegion)?.name || targetRegion;
                  setTimeout(() => {
                    playAlert();
                    showAlert(`Funkcjonariusze SB zrywają plakaty w ${regionName}! Strata: ${loss.toLocaleString()} głosów.`, '🚨 PROWOKACJA SB', 'raid');
                  }, 50);
                }
              } else {
                // Wzrost propagandy
                nextState.regimePropaganda = Math.min(100, (nextState.regimePropaganda || 0) + 10);
                setTimeout(() => {
                  playAlert();
                  showAlert('Dziennik Telewizyjny emituje paszkwil o finansowaniu opozycji z zagranicy! Propaganda rządowa +10%.', '📺 PROPAGANDA', 'raid');
                }, 50);
              }
            }
          }
        }

        // Faza M: Dziki Kapitalizm - tick
        if (s.fazaMUnlocked) {
          // Hiperinflacja pożera oszczędności PLN, jeśli nie zrobiono denominacji
          if (!s.isDenominated) {
            nextState.plzInflationMult = (nextState.plzInflationMult || 1) * (1 + 0.0005 * deltaSec); // rosnące ceny
            // Hiperinflacja zżera PLN (utrata 0.2% oszczędności co sekundę na rzecz inflacji)
            const inflationDecay = 1 - (0.002 * deltaSec); 
            nextState.pln = Math.max(0, Math.floor(nextState.pln * inflationDecay));
          }

          // Pasywne dywidendy z NFI i symulacja stanu fabryk (Faza O)
          let nfiDividend = 0;
          Object.keys(nextState.nfiCompanies || {}).forEach(compId => {
            if (nextState.nfiCompanies[compId]) {
              const comp = NFI_COMPANIES.find(c => c.id === compId);
              if (comp) {
                const status = Object.assign({ 
                  employment: comp.baseEmployment,
                  infrastructure: comp.baseInfrastructure,
                  morale: 100,
                  unionStrength: comp.baseUnionStrength,
                  strikeActive: false
                }, nextState.nfiCompanyStatus[compId] || {});

                const mult = s.isDenominated ? 1 : nextState.plzInflationMult;

                // 1. Degradacja infrastruktury (zużycie maszyn)
                status.infrastructure = Math.max(10, status.infrastructure - 0.05 * deltaSec);

                // 2. Wpływ niskiego zatrudnienia na morale (pasywny spadek morale)
                if (status.employment < comp.baseEmployment) {
                  const layoffRatio = (comp.baseEmployment - status.employment) / comp.baseEmployment;
                  status.morale = Math.max(0, status.morale - 0.15 * layoffRatio * deltaSec);
                }

                // 3. Powolny samoczynny powrót morale ku 100, jeśli zatrudnienie jest pełne
                if (status.employment >= comp.baseEmployment && status.morale < 100) {
                  status.morale = Math.min(100, status.morale + 0.1 * deltaSec);
                }

                // 4. Wzrost siły związków zawodowych przy niskim morale
                if (status.morale < 50) {
                  status.unionStrength = Math.min(100, status.unionStrength + 0.2 * deltaSec);
                }

                // 5. Szansa na strajk
                if (!status.strikeActive && status.morale < 60) {
                  const strikeThreshold = (60 - status.morale) / 100; 
                  const strikeProb = strikeThreshold * (status.unionStrength / 100) * 0.015 * deltaSec;
                  if (Math.random() < strikeProb) {
                    status.strikeActive = true;
                    setTimeout(() => {
                      playAlert();
                      showAlert(`W fabryce ${comp.name} wybuchł strajk okupacyjny! Robotnicy domagają się podwyżek i zatrzymania zwolnień. Produkcja stoi!`, '🔥 STRAJK ROBOTNICZY', 'raid');
                    }, 50);
                  }
                }

                // 6. Obliczanie zysku (0 jeśli strajk)
                let actualDividendPerSec = 0;
                if (!status.strikeActive) {
                  const baseWages = comp.baseEmployment * 5;
                  const currentWages = status.employment * 5;
                  const grossRevenue = (comp.dividendPerSecPln + baseWages) 
                    * (status.infrastructure / comp.baseInfrastructure) 
                    * (Math.min(status.employment, comp.baseEmployment * 1.2) / comp.baseEmployment);
                  
                  const netProfit = grossRevenue - currentWages;
                  actualDividendPerSec = Math.max(0, netProfit);
                }

                nfiDividend += actualDividendPerSec * mult * deltaSec;

                // Zapisujemy nowy status
                nextState.nfiCompanyStatus[compId] = status;
              }
            }
          });
          if (nfiDividend > 0) {
            nextState.pln += Math.floor(nfiDividend);
            nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + Math.floor(nfiDividend);
          }

          // Pasywne skupowanie Kuponów NFI
          if (Math.random() < 0.05 * deltaSec) {
             nextState.nfiVouchers = (nextState.nfiVouchers || 0) + 1;
          }

          // Ataki mafijne (Haracz Pruszkowa)
          const plnThreshold = s.isDenominated ? 1000 : 10000000;
          if (nextState.pln > plnThreshold && Math.random() < 0.02 * deltaSec) { 
             const threat = Math.random() * 100;
             const protection = nextState.mafiaProtectionId ? MAFIA_PROTECTIONS.find(p => p.id === nextState.mafiaProtectionId)?.protectionLevel || 0 : 0;
             
             if (threat > protection) {
               // Udany atak Mafii (10% utraty gotówki)
               const extorted = Math.floor(nextState.pln * 0.1); 
               if (extorted > 0) {
                 nextState.pln -= extorted;
                 setTimeout(() => {
                   playAlert();
                   showAlert(`Ludzie "Pershinga" pobrali haracz! Utracono ${extorted.toLocaleString()} zł!`, '🔫 MAFIA', 'raid');
                 }, 50);
               }
             } else {
               // Ochrona zadziałała
               setTimeout(() => {
                 addToast('OCHRONA SKUTECZNA', 'Twoi ochroniarze odstraszyli wysłanników mafii.');
               }, 50);
             }
          }
        }

        // ===== Faza N: Wojny Gangów i Szara Strefa - tick =====
        if (s.fazaNUnlocked) {
          // 1. Upkeep dla jednostek i siła
          let totalUpkeep = 0;
          let playerPower = 0;
          
          Object.entries(nextState.gangUnits).forEach(([unitId, count]) => {
            const unit = GANGSTER_UNITS.find(u => u.id === unitId);
            if (unit && count > 0) {
              totalUpkeep += unit.upkeepPln * count;
              playerPower += unit.combatPower * count;
            }
          });
          
          // Zastosowanie modyfikatorów z broni
          let weaponBonus = 0;
          Object.entries(nextState.gangWeapons).forEach(([weaponId, count]) => {
            const w = BLACK_MARKET_WEAPONS.find(x => x.id === weaponId);
            if (w && count > 0) {
              weaponBonus += w.powerBonus * count;
            }
          });
          playerPower = Math.floor(playerPower * (1 + weaponBonus));
          
          // Dodaj bonus z szacunku (respect)
          playerPower += nextState.gangRespect * 2;
          
          // Pobranie upkeepu
          const plnReq = Math.floor(totalUpkeep * (nextState.isDenominated ? 1 : nextState.plzInflationMult) * deltaSec);
          if (nextState.pln >= plnReq) {
             nextState.pln -= plnReq;
          } else {
             nextState.pln = 0;
             // Spadek szacunku gdy nie płacisz chłopcom
             if (Math.random() < 0.1 * deltaSec) {
               nextState.gangRespect = Math.max(0, nextState.gangRespect - 1);
               setTimeout(() => {
                 playAlert();
                 showAlert('Brak kasy na utrzymanie ludzi! Szacunek na mieście spada.', 'BUNT W GANGU', 'raid');
               }, 50);
             }
          }
          
          // 2. Przepychanie o terytoria
          const pruszkowPower = 500;
          const wolominPower = 400;
          const totalPower = playerPower + pruszkowPower + wolominPower || 1; // uniknięcie / 0
          
          let totalIncome = 0;
          
          WARSAW_DISTRICTS.forEach(dist => {
             const ctrl = nextState.districtControl[dist.id] || { player: 0, pruszkow: 0, wolomin: 100 };
             
             const targetPlayerCtrl = (playerPower / totalPower) * 100;
             const targetPruszkowCtrl = (pruszkowPower / totalPower) * 100;
             const targetWolominCtrl = (wolominPower / totalPower) * 100;
             
             // Powolne zmiany kontroli
             ctrl.player += (targetPlayerCtrl - ctrl.player) * 0.05 * deltaSec;
             ctrl.pruszkow += (targetPruszkowCtrl - ctrl.pruszkow) * 0.05 * deltaSec;
             ctrl.wolomin += (targetWolominCtrl - ctrl.wolomin) * 0.05 * deltaSec;
             
             // Normalizacja
             const sum = ctrl.player + ctrl.pruszkow + ctrl.wolomin;
             ctrl.player = (ctrl.player / sum) * 100;
             ctrl.pruszkow = (ctrl.pruszkow / sum) * 100;
             ctrl.wolomin = (ctrl.wolomin / sum) * 100;
             
             nextState.districtControl[dist.id] = ctrl;
             
             // Zarobki
             totalIncome += (dist.baseIncomePln * (ctrl.player / 100)) * deltaSec;
          });
          
          nextState.pln += Math.floor(totalIncome * (nextState.isDenominated ? 1 : nextState.plzInflationMult));
        }

        // ===== Faza P: Imperium Logistyczne "Jarmark Europa" - tick =====
        if (s.fazaMUnlocked) {
          // 1. Spadek nasycenia rynku co sekunde
          Object.keys(nextState.bazarMarketSaturation || {}).forEach(itemId => {
            const current = nextState.bazarMarketSaturation[itemId] || 0;
            nextState.bazarMarketSaturation[itemId] = Math.max(0, current - 0.4 * deltaSec);
          });

          // 2. Aktywne transporty logistyczne
          const updatedTransports: Array<{ id: string; routeId: string; timeLeft: number }> = [];
          (nextState.activeBazarTransports || []).forEach(tr => {
            const nextTime = tr.timeLeft - deltaSec;
            if (nextTime <= 0) {
              // Transport dojechal!
              const route = BAZAR_LOGISTICS_ROUTES.find(r => r.id === tr.routeId);
              if (route) {
                const capacity = nextState.bazarWarehouseCapacity || 50;
                let addedSummary = '';
                Object.entries(route.importedItems).forEach(([itemId, qty]) => {
                  const currentTotalInner = Object.values(nextState.bazarInventory || {}).reduce((sum, val) => sum + (val || 0), 0);
                  const spaceLeft = Math.max(0, capacity - currentTotalInner);
                  const toAdd = Math.min(qty, spaceLeft);
                  if (toAdd > 0) {
                    nextState.bazarInventory[itemId] = (nextState.bazarInventory[itemId] || 0) + toAdd;
                    const itemDesc = BAZAR_ITEMS.find(bi => bi.id === itemId)?.name || itemId;
                    addedSummary += toAdd + ' szt. ' + itemDesc + ', ';
                  }
                });
                setTimeout(() => {
                  playSuccess();
                  if (addedSummary) {
                    showAlert('Dostawa ze szlaku "' + route.name + '" dotarla na stadion! Rozładowano: ' + addedSummary.slice(0, -2) + '.', '📦 IMPORT ZAKOŃCZONY', 'success');
                  } else {
                    showAlert('Dostawa ze szlaku "' + route.name + '" dotarla, ale magazyn jest pelny! Towary ulegly zniszczeniu na deszczu.', '⚠️ MAGAZYN PRZEPEŁNIONY', 'raid');
                  }
                }, 50);
              }
            } else {
              updatedTransports.push({ id: tr.id, routeId: tr.routeId, timeLeft: nextTime });
            }
          });
          nextState.activeBazarTransports = updatedTransports;
        }

        // ===== Faza R: Wolne Media, Reklama i Prywatna Telewizja - tick =====
        if (s.mediaUnlocked) {
          // 1. Obliczamy mnoznik zasiegu z anten nadawczych
          let coverageMult = 1.0;
          MEDIA_ANTENNA_REGIONS.forEach(reg => {
            if (nextState.mediaAntennas[reg.id]) {
              coverageMult += reg.coverageMultiplier;
            }
          });

          // 2. Symulacja dla kazdej posiadanej stacji
          MEDIA_STATIONS.forEach(station => {
            if (!nextState.mediaStations[station.id]) return;
            
            let stationRating = station.baseRating;
            let trustChange = 0;
            let totalIncomeMult = 0;
            let activeProgramCount = 0;

            const slots = nextState.activeMediaPrograms[station.id] || { rano: null, poludnie: null, wieczor: null };
            Object.values(slots).forEach(progId => {
              if (progId) {
                const prog = MEDIA_PROGRAMS.find(p => p.id === progId);
                if (prog) {
                  stationRating += prog.ratingBonus;
                  trustChange += prog.trustImpact;
                  totalIncomeMult += prog.incomeMult;
                  activeProgramCount++;
                }
              }
            });

            // Zasieg wplywa na rating
            stationRating *= coverageMult;

            // Zaufanie wplywa na rating
            const currentTrust = nextState.mediaTrust[station.id] !== undefined ? nextState.mediaTrust[station.id] : 100;
            const trustMult = 0.5 + (currentTrust / 200);
            stationRating = Math.floor(stationRating * trustMult);

            // Pasywny spadek/wzrost zaufania
            if (activeProgramCount === 0) {
              if (currentTrust < 100) trustChange = 2;
              else if (currentTrust > 100) trustChange = -2;
            }
            
            const nextTrust = Math.max(0, Math.min(100, currentTrust + trustChange * deltaSec));
            nextState.mediaTrust[station.id] = nextTrust;

            // Dochody z reklam (8 PLN/s za punkt ratingu * mnoznik programu)
            if (activeProgramCount > 0 && stationRating > 0) {
              let revenuePerSec = stationRating * 8 * totalIncomeMult;
              const mult = nextState.isDenominated ? 1 : nextState.plzInflationMult;
              const finalRevenue = Math.floor(revenuePerSec * mult * deltaSec);
              nextState.pln += finalRevenue;
            }
          });
        }

        // ===== Faza S: Lata 2000. - Integracja i Dotacje - tick =====
        if (s.fazaSUnlocked) {
          // 1. Kurs CHF/PLN (wahania od 2.0 do 4.8)
          const prev5sTick = Math.floor((s.stats.totalTimePlayed || 0) / 5);
          const current5sTick = Math.floor(nextState.stats.totalTimePlayed / 5);
          if (current5sTick > prev5sTick) {
            let fluctuation = 1 + (Math.random() * 0.10 - 0.05); // +/- 5%
            let newRate = nextState.chfExchangeRate * fluctuation;
            // Zapobieganie ucieczce kursu w skrajności
            if (newRate < 2.0) newRate += 0.1;
            if (newRate > 4.8) newRate -= 0.1;
            // Jeśli dot-com rośnie, rynek sprzyja aprecjacji, ale frank i tak jest nieobliczalny
            nextState.chfExchangeRate = Math.max(1.8, Math.min(5.5, newRate));
          }

          // 2. Raty kredytów we frankach (CHF)
          if (nextState.chfDebt > 0) {
            // Roczna stopa ~5%, w grze powiedzmy że płacimy ułamek procenta na sekundę
            // Żeby kredyt był duszony, płacimy stałą kwotę (kapitał + odsetki)
            const advisorDiscount = 1 - (nextState.bankAdvisors || 0) * 0.15;
            const chfInstallmentPerSec = nextState.chfDebt * 0.005 * advisorDiscount; // 0.5% długu na sekundę w CHF
            const plnCost = Math.floor(chfInstallmentPerSec * nextState.chfExchangeRate * deltaSec);
            if (nextState.pln >= plnCost) {
              nextState.pln -= plnCost;
              nextState.chfDebt -= (chfInstallmentPerSec * deltaSec * 0.8); // 80% to kapitał
            } else {
              // Brak na rate - karna odsetka i komornik
              nextState.chfDebt += 1000;
              if (Math.random() < 0.05 * deltaSec) {
                setTimeout(() => {
                  playError();
                  showAlert('Nie masz środków na spłatę raty kredytu we frankach! Bank doliczył karne odsetki.', '🚨 WEZWANIE DO ZAPŁATY', 'raid');
                }, 50);
              }
            }
          }

          // 3. Dotacje Unijne
          const remainingEu: typeof nextState.activeEuProjects = [];
          nextState.activeEuProjects.forEach(proj => {
            const newTime = proj.timeLeft - deltaSec;
            if (newTime <= 0) {
              // Zakończono projekt
              const euDef = EU_PROJECTS.find(e => e.id === proj.projectId);
              if (euDef) {
                const refund = Math.floor(euDef.costPln * euDef.euGrantPercent);
                nextState.pln += refund;
                nextState.euAuditRisk = Math.min(100, nextState.euAuditRisk + 15); // Rośnie ryzyko audytu!
                setTimeout(() => {
                  playSuccess();
                  showAlert(`Zakończono rozliczanie wniosku unijnego: ${euDef.name}! Unia zwróciła Ci ${refund.toLocaleString()} PLN.`, '🇪🇺 DOTACJA WYPŁACONA', 'success');
                }, 50);
              }
            } else {
              remainingEu.push({ ...proj, timeLeft: newTime });
            }
          });
          nextState.activeEuProjects = remainingEu;

          // 4. Portal Dot-Com
          if (nextState.dotcomServerCapacity > 0) {
             let baseGrowth = 100;
             if (nextState.dotcomUpgrades['serwery_pentium']) baseGrowth += 300;
             if (nextState.dotcomUpgrades['agresywne_seo']) baseGrowth += 1000;
             if (nextState.dotcomUpgrades['lacze_swiatlowod']) baseGrowth += 2000;

             // Wzrost użytkowników
             nextState.dotcomUsers = Math.min(nextState.dotcomServerCapacity, nextState.dotcomUsers + Math.floor(baseGrowth * deltaSec));
             
             // Przychód z reklam AdSense
             let adRevenuePerUser = 0.5; // PLN per user
             if (nextState.dotcomUpgrades['agresywne_seo']) adRevenuePerUser = 0.8;
             
             const dotcomIncome = Math.floor(nextState.dotcomUsers * adRevenuePerUser * deltaSec);
             nextState.pln += dotcomIncome;
          }

          // 5. Zmywak w Londynie
          if (nextState.zmywakWorkers > 0) {
            // Powiedzmy 1 GBP = 6 PLN (sztywno na lata 2000 dla uproszczenia), zarabiają 10 GBP na sekundę, bierzemy 10%
            const gbpPerSec = nextState.zmywakWorkers * 5; 
            const commissionGbp = gbpPerSec * 0.15; // 15% prowizji agencji
            const plnEarned = Math.floor(commissionGbp * 6 * deltaSec);
            nextState.pln += plnEarned;
          }

          // 6. Audyt Unijny (Skarbówka)
          if (nextState.euAuditRisk > 50 && Math.random() < (nextState.euAuditRisk / 2000) * deltaSec) {
             // Nalot audytu!
             const penalty = Math.floor(nextState.pln * 0.3); // 30% kasy idzie na kary
             nextState.pln = Math.max(0, nextState.pln - penalty);
             nextState.euAuditRisk = 0; // Reset po nalocie
             setTimeout(() => {
               playAlert();
               showAlert(`Kontrola z OLAF i Urzędu Skarbowego wykazała nieprawidłowości w Twoich dotacjach unijnych! Skonfiskowano ${penalty.toLocaleString()} PLN tytułem zwrotu i kar.`, '🚨 KONTROLA UNIJNA', 'raid');
             }, 50);
          }
        }

        // Milicja - random check if suspicion is above threshold
        let raidThreshold = 50;
        if (s.partyRank === 'sekretarz' || s.partyRank === 'dyrektor' || s.partyRank === 'wiceminister') raidThreshold = 150;
        
        if (s.partyRank !== 'minister' && s.partyRank !== 'biuro' && nextState.suspicion > raidThreshold) {
           if (Math.random() < (nextState.suspicion / 1000)) { // rosnąca szansa
             if (s.unlockedAchievements?.['pol_raid_1'] && Math.random() < 0.10) {
                setTimeout(() => {
                  playAlert();
                  showAlert("Niezwykły zbieg okoliczności! Milicja miała przeprowadzić nalot na Twoje lokum, ale w komendzie zepsuła się nyska. Nalot odwołany!", 'SZCZĘŚLIWY TRAF', 'success');
                }, 50);
                nextState.suspicion = Math.max(0, nextState.suspicion - 15);
             } else {
                // Kolporter redukuje straty z nalotu: 10% zamiast 20%
                const lossPercent = nextState.solidarnos >= 2500 ? 0.10 : 0.20;
                const loss = Math.floor(nextState.pln * lossPercent);
                if (loss > 0) {
                  nextState.pln -= loss;
                  nextState.suspicion = 0; // reset po nalocie
                  nextState.stats.totalConfiscations = (nextState.stats.totalConfiscations || 0) + 1;
                  playAlert();
                  setTimeout(() => {
                    showAlert(`Nalot zakończony konfiskatą mienia. Tracisz ${loss} zł!${nextState.solidarnos >= 2500 ? ' \n\n(Dzięki pomocy Solidarności straty ograniczono do 10%!)' : ''}`, 'NALOT MILICJI!', 'raid');
                  }, 50);
                }
             }
           }
        }

        // C64 Auto-Clicker for queues
        if (s.pewexItems['c64'] && activeQueue) {
          setQueueProgress(prev => {
             const item = QUEUE_ITEMS.find(i => i.id === activeQueue);
             if (!item) return prev;
             let timeToBuy = item.timeToBuyMs;
             if (s.pewexItems['toblerone']) timeToBuy *= 0.85;
             if (s.plnUpgrades['kozuch']) timeToBuy *= 0.90;
             if (s.pewexItems['cola']) timeToBuy *= 0.8;
             if (s.pewexItems['maluch']) timeToBuy *= 0.6;
             if (s.baltonaUpgrades?.['jacobs']) timeToBuy *= 0.90;
             if (s.activeEvent === 'kryzys') timeToBuy *= 1.20; // Kryzys Paliwowy (+20% czasu)
             if (s.activeDestination === 'austria') timeToBuy *= 0.90; // Austria: -10% czasu
             if (s.solidarnos >= 2000) timeToBuy *= 0.95; // Łącznik: -5% czasu
             
             const queueTimeAchMult = (s.unlockedAchievements?.['eco_queue_1'] ? 0.95 : 1) * (s.unlockedAchievements?.['eco_queue_2'] ? 0.85 : 1);
             timeToBuy *= queueTimeAchMult;

             // Adds roughly 50ms worth of progress per 1 sec
             return prev + (50 / timeToBuy) * 100; 
          });
        }

        // Tick stats
        nextState.stats.totalTimePlayed = (nextState.stats.totalTimePlayed || 0) + deltaSec;
        if (activeQueue) {
          nextState.stats.totalTimeQueued = (nextState.stats.totalTimeQueued || 0) + deltaSec;
        }

        // Wahania kursu dolara co 10 sekund
        const prev10sTick = Math.floor((s.stats.totalTimePlayed || 0) / 10);
        const current10sTick = Math.floor(nextState.stats.totalTimePlayed / 10);
        if (current10sTick > prev10sTick) {
          let fluctuation = 1 + (Math.random() * 0.10 - 0.05); // ±5%
          let newRate = s.exchangeRate * fluctuation;
          
          const minRate = s.inflationUpgrades?.['polisaAsekuracyjna'] ? 110 : 80;
          if (newRate < minRate) newRate = minRate;
          if (newRate > 150) newRate = 150;
          
          nextState.exchangeRate = Math.round(newRate);

          // Faza G: Fluktuacja cen akcji na GPW co 10 sekund
          let currentGpwEvent = s.gpwActiveEvent;
          let currentGpwEventTimeLeft = s.gpwEventTimeLeft;
          
          if (currentGpwEventTimeLeft <= 0) {
            if (Math.random() < 0.20) {
              const randomEvent = GPW_EVENTS[Math.floor(Math.random() * GPW_EVENTS.length)];
              currentGpwEvent = randomEvent.id;
              currentGpwEventTimeLeft = 60; // 60 sekund trwania
              
              const isUnlocked = s.gpwUnlocked || s.okraglyStolVictory || s.pln >= 1000000 || Object.values(s.sharesOwned).some(count => count > 0);
              if (isUnlocked) {
                 setTimeout(() => {
                   playAlert();
                   addToast("GPW: Zdarzenie Rynkowe", `${randomEvent.name} - ${randomEvent.desc}`);
                 }, 50);
              }
            }
          } else {
            currentGpwEventTimeLeft = Math.max(0, currentGpwEventTimeLeft - 10);
            if (currentGpwEventTimeLeft === 0) {
              currentGpwEvent = null;
            }
          }
          nextState.gpwActiveEvent = currentGpwEvent;
          nextState.gpwEventTimeLeft = currentGpwEventTimeLeft;

          // Przeciek (insider tip) tick down
          let currentTip = s.gpwInsiderTip ? { ...s.gpwInsiderTip } : null;
          if (currentTip) {
            currentTip.ticksLeft -= 1;
            if (currentTip.ticksLeft <= 0) {
              currentTip = null;
            }
            nextState.gpwInsiderTip = currentTip;
          }

          // Aktualizacja cen spółek
          const activeGpwEventData = GPW_EVENTS.find(e => e.id === currentGpwEvent);
          
          GPW_STOCKS.forEach(stock => {
            const currentPrice = s.stockPrices[stock.id] || stock.basePrice;
            let fluc = (Math.random() * (stock.volatility * 2)) - stock.volatility;
            
            if (activeGpwEventData && activeGpwEventData.effect[stock.id] !== undefined) {
              fluc += activeGpwEventData.effect[stock.id];
            }
            
            if (currentTip && currentTip.stockId === stock.id) {
              if (currentTip.effect === 'up') {
                fluc += 0.15;
              } else {
                fluc -= 0.15;
              }
            }
            
            let newPrice = Math.round(currentPrice * (1 + fluc));
            if (s.recessionActive) {
              newPrice = Math.round(currentPrice * 0.94); // Spadek o 6% na tick w trakcie krachu
            }
            newPrice = Math.max(Math.round(stock.basePrice * 0.05), newPrice); // Spadek nawet do 5% ceny bazowej
            newPrice = Math.min(Math.round(stock.basePrice * 10), newPrice);
            
            nextState.stockPrices[stock.id] = newPrice;
            
            const history = [...(s.stockPriceHistories[stock.id] || [stock.basePrice])];
            history.push(newPrice);
            if (history.length > 15) {
              history.shift();
            }
            nextState.stockPriceHistories[stock.id] = history;
          });
        }

        // Faza G: Dywidendy co 30 sekund
        const prevTick30s = Math.floor((nextState.stats.totalTimePlayed - deltaSec) / 30);
        const currTick30s = Math.floor(nextState.stats.totalTimePlayed / 30);
        if (currTick30s > prevTick30s && !s.recessionActive) {
          let totalDividends = 0;
          const hasGpwInvestor = s.unlockedAchievements?.['gpw_investor'];
          const dividendMultiplier = hasGpwInvestor ? 1.2 : 1.0;
          
          GPW_STOCKS.forEach(stock => {
            const owned = s.sharesOwned[stock.id] || 0;
            if (owned > 0) {
              const price = nextState.stockPrices[stock.id] || stock.basePrice;
              const divAmount = owned * price * stock.dividendRate * dividendMultiplier;
              totalDividends += Math.floor(divAmount);
            }
          });
          
          if (totalDividends > 0) {
            nextState.pln += totalDividends;
            nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + totalDividends;
            setTimeout(() => {
              playSuccess();
              addToast("DYWIDENDY GPW", `Otrzymano dywidendy ze spółek: +${totalDividends} zł!`);
            }, 50);
          }
        }

        // Faza E: Wiceminister – kartki co 30 sekund (+2)
        if (s.partyRank === 'wiceminister' || s.partyRank === 'minister' || s.partyRank === 'biuro') {
          // We use totalTimePlayed modulo 30 to give kartki every 30s
          const prevTick = Math.floor((nextState.stats.totalTimePlayed - deltaSec) / 30);
          const currTick = Math.floor(nextState.stats.totalTimePlayed / 30);
          if (currTick > prevTick) {
            nextState.kartki = (nextState.kartki || 0) + 2;
          }
        }

        // Faza E: Solidarność Działacz – kartki co 30 sekund (+1, niezależnie od partii)
        if (nextState.solidarnos >= 5000) {
          const prevTick = Math.floor((nextState.stats.totalTimePlayed - deltaSec) / 30);
          const currTick = Math.floor(nextState.stats.totalTimePlayed / 30);
          if (currTick > prevTick) {
            nextState.kartki = (nextState.kartki || 0) + 1;
          }
        }

        // Faza F: Solidarność Drukarz – talony co 60 sekund (+1)
        if (nextState.solidarnos >= 4000) {
          const prevTick = Math.floor((nextState.stats.totalTimePlayed - deltaSec) / 60);
          const currTick = Math.floor(nextState.stats.totalTimePlayed / 60);
          if (currTick > prevTick) {
            nextState.talony = (nextState.talony || 0) + 1;
          }
        }

        // Faza F: Solidarność Redaktor – pasywne PLN co 30 sekund (+200 zł)
        if (nextState.solidarnos >= 4500) {
          const prevTick = Math.floor((nextState.stats.totalTimePlayed - deltaSec) / 30);
          const currTick = Math.floor(nextState.stats.totalTimePlayed / 30);
          if (currTick > prevTick) {
            nextState.pln = (nextState.pln || 0) + 200;
            nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + 200;
          }
        }

        // Faza E: Biuro Politycznego – 3x PLN z biznesów (dodatkowe 2x = 3x łącznie)
        // (już jest rubinMult=2x, więc biuro daje kolejne 3x przy biuro rangu)
        // Biuro-specific SB-threat: wzrost podejrzenia z losowych akcji
        if (s.partyRank === 'biuro' && Math.random() < 0.0005 * deltaSec) {
          nextState.suspicion = Math.min(100, nextState.suspicion + 5);
        }

        // Faza E: Służba Bezpieczeństwa (SB) i TW
        // 1. Odliczanie kontrwywiadu
        let counterIntelActive = false;
        if (s.sbCounterIntelTimeLeft > 0) {
          const newTime = Math.max(0, s.sbCounterIntelTimeLeft - deltaSec);
          nextState.sbCounterIntelTimeLeft = newTime;
          if (newTime > 0) counterIntelActive = true;
        }

        // 2. Werbunek TW
        if (!counterIntelActive && s.partyRank !== 'minister' && nextState.suspicion > 30) {
          const ownedHelpers = HELPERS.filter(h => (s.helpers[h.id] || 0) > 0);
          const availableToRecruit = ownedHelpers.filter(h => !s.sbTwList[h.id]);
          if (availableToRecruit.length > 0 && Math.random() < 0.005 * deltaSec) {
            const randomH = availableToRecruit[Math.floor(Math.random() * availableToRecruit.length)];
            nextState.sbTwList = {
              ...s.sbTwList,
              [randomH.id]: true
            };
          }
        }

        // 3. Donosicielstwo (przyrost podejrzenia)
        if (!counterIntelActive && s.partyRank !== 'minister') {
          let activeTwCount = 0;
          Object.keys(s.sbTwList).forEach(helperId => {
            const isTw = s.sbTwList[helperId];
            const isBlackmailed = s.sbTwBlackmailed[helperId];
            const count = s.helpers[helperId] || 0;
            if (isTw && !isBlackmailed && count > 0) {
              activeTwCount++;
            }
          });
          if (activeTwCount > 0) {
            const suspIncrease = activeTwCount * 1.0 * deltaSec;
            nextState.suspicion = Math.min(100, nextState.suspicion + suspIncrease);
          }
        }

        // 4. Nalot SB (SB Raid) przy 100% Podejrzenia
        if (s.partyRank !== 'minister' && nextState.suspicion >= 100) {
          const plnLoss = Math.floor(nextState.pln * 0.40);
          nextState.pln = Math.max(0, nextState.pln - plnLoss);
          
          // Konfiskata 20% towarów z ekwipunku
          const updatedInventory = { ...nextState.inventory };
          Object.keys(updatedInventory).forEach(key => {
            updatedInventory[key] = Math.floor((updatedInventory[key] || 0) * 0.80);
          });
          nextState.inventory = updatedInventory;

          // Spadek Solidarności o 500 pkt
          nextState.solidarnos = Math.max(0, nextState.solidarnos - 500);

          // Reset podejrzenia do 20%
          nextState.suspicion = 20;

          // Statystyka
          nextState.stats.totalSbRaids = (nextState.stats.totalSbRaids || 0) + 1;

          // Alert modalny
          playAlert();
          setTimeout(() => {
            showAlert(
              `Służba Bezpieczeństwa (SB) wykryła donosy Twoich tajnych współpracowników! Przeprowadzono rewizję. Tracisz ${plnLoss} zł, 20% zgromadzonych zapasów, a poparcie Solidarności spada o 500 pkt!`,
              'REWIZJA SB!',
              'raid'
            );
          }, 50);
        }

        // Check achievements
        ACHIEVEMENTS.forEach(ach => {
          if (nextState.unlockedAchievements[ach.id]) return;

          let isUnlocked = false;
          const stats = nextState.stats;
          
          if (ach.id === 'eco_pln_1') isUnlocked = stats.totalPlnEarned >= 100;
          else if (ach.id === 'eco_pln_2') isUnlocked = stats.totalPlnEarned >= 10000;
          else if (ach.id === 'eco_pln_3') isUnlocked = stats.totalPlnEarned >= 1000000;
          else if (ach.id === 'eco_sell_1') isUnlocked = stats.totalItemsSold >= 100;
          else if (ach.id === 'eco_sell_2') isUnlocked = stats.totalItemsSold >= 1000;
          else if (ach.id === 'eco_queue_1') isUnlocked = stats.totalTimeQueued >= 600;
          else if (ach.id === 'eco_queue_2') isUnlocked = stats.totalTimeQueued >= 3600;
          else if (ach.id === 'eco_usd_1') isUnlocked = nextState.dollars >= 10000;
          else if (ach.id === 'eco_cinkciarz_1') isUnlocked = stats.totalCinkciarzExchanges >= 10;
          else if (ach.id === 'eco_cinkciarz_2') isUnlocked = stats.totalCinkciarzExchanges >= 100;
          
          else if (ach.id === 'pol_rank_1') isUnlocked = nextState.partyRank !== null;
          else if (ach.id === 'pol_rank_2') isUnlocked = ['sekretarz','dyrektor','wiceminister','minister','biuro'].includes(nextState.partyRank || '');
          else if (ach.id === 'pol_rank_3') isUnlocked = ['dyrektor','wiceminister','minister','biuro'].includes(nextState.partyRank || '');
          else if (ach.id === 'pol_rank_4') isUnlocked = ['minister','biuro'].includes(nextState.partyRank || '');
          else if (ach.id === 'pol_bribe_1') isUnlocked = stats.totalBribesPaidPln > 0;
          else if (ach.id === 'pol_bribe_2') isUnlocked = stats.totalBribesPaidPln >= 10000;
          else if (ach.id === 'pol_raid_1') isUnlocked = stats.totalConfiscations >= 5;
          
          else if (ach.id === 'smug_first') isUnlocked = stats.totalSmugglesCompleted >= 5;
          else if (ach.id === 'smug_king') isUnlocked = stats.totalSmugglesCompleted >= 25;
          else if (ach.id === 'smug_safe') isUnlocked = stats.totalDollarsEarned >= 1000;
          else if (ach.id === 'smug_caught') isUnlocked = stats.totalCleCatches >= 5;
          else if (ach.id === 'black_market_1') isUnlocked = stats.totalBlackMarketPurchases >= 10;
          else if (ach.id === 'black_market_2') isUnlocked = stats.totalBlackMarketPurchases >= 50;
          else if (ach.id === 'smug_moskwa') isUnlocked = stats.totalSmugglesCompleted >= 10;
          
          else if (ach.id === 'pres_escape_1') isUnlocked = nextState.prestigePoints >= 1;
          else if (ach.id === 'pres_escape_2') isUnlocked = nextState.prestigePoints >= 5;
          else if (ach.id === 'pres_time_1') isUnlocked = stats.totalTimePlayed >= 3600;
          else if (ach.id === 'pres_time_2') isUnlocked = stats.totalTimePlayed >= 10800;
          else if (ach.id === 'pres_points') isUnlocked = nextState.prestigePoints >= 50;
          else if (ach.id === 'pres_transform') isUnlocked = nextState.pewexItems.transformacja;
          else if (ach.id === 'nom_oligarch') isUnlocked = (stats.totalNomenklaturaEarned || 0) >= 2000000;
          else if (ach.id === 'nom_director') {
            const totalDirectors = Object.values(nextState.nomenklaturaCompanies || {}).reduce((sum, c) => sum + (c.directorCount || 0), 0);
            isUnlocked = totalDirectors >= 10;
          }
          else if (ach.id === 'nom_corruption') {
            isUnlocked = NOMENKLATURA_COMPANIES.every(c => nextState.nomenklaturaCompanies?.[c.id]?.twAssigned);
          }
          else if (ach.id === 'offshore_zurich') {
            isUnlocked = nextState.swissAccountUnlocked && (nextState.swissBalanceUsd || 0) >= 100000;
          }
          else if (ach.id === 'offshore_laundry') {
            isUnlocked = (stats.totalOffshoreTransfersPln || 0) >= 1000000;
          }
          else if (ach.id === 'offshore_trust') {
            isUnlocked = nextState.hasLiechtensteinTrust;
          }
          else if (ach.id === 'cocom_first') {
            isUnlocked = (stats.totalCocomItemsSold || 0) >= 1;
          }
          else if (ach.id === 'cocom_magnate') {
            isUnlocked = (stats.totalCocomItemsSold || 0) >= 10;
          }
          // Faza K - Wybory 4 Czerwca
          else if (ach.id === 'senate_sweep') {
            isUnlocked = nextState.senateSeatsWon >= 99;
          }
          else if (ach.id === 'propaganda_killer') {
            isUnlocked = nextState.electionsUnlocked && nextState.regimePropaganda === 0;
          }
          else if (ach.id === 'church_alliance') {
            isUnlocked = nextState.churchSupport >= 100;
          }
          else if (ach.id === 'historical_victory') {
            isUnlocked = nextState.electionsPhase === 'completed' && nextState.sejmSeatsWon >= 161 && nextState.senateSeatsWon >= 90;
          }

          if (isUnlocked) {
            nextState.unlockedAchievements[ach.id] = true;
            setTimeout(() => {
              playSuccess();
              addToast("ZDOBYTO ODZNACZENIE!", ach.name);
            }, 10);
          }
        });
        
        return nextState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateState, activeQueue, settingsOpen]);

  // Queue Progression
  useEffect(() => {
    if (!activeQueue || settingsOpen) return;
    const item = QUEUE_ITEMS.find(i => i.id === activeQueue);
    if (!item) return;

    let timeToBuy = item.timeToBuyMs;
    if (state.pewexItems['toblerone']) timeToBuy *= 0.85;
    if (state.plnUpgrades['kozuch']) timeToBuy *= 0.90;
    if (state.pewexItems['cola']) timeToBuy *= 0.8;
    if (state.pewexItems['maluch']) timeToBuy *= 0.6;
    if (state.baltonaUpgrades?.['jacobs']) timeToBuy *= 0.90;
    if (state.activeEvent === 'kryzys') timeToBuy *= 1.20; // Kryzys Paliwowy (+20% czasu)
    if (state.activeDestination === 'austria') timeToBuy *= 0.90; // Austria: -10% czasu
    if (state.solidarnos >= 2000) timeToBuy *= 0.95; // Łącznik: -5% czasu

    const queueTimeAchMult = (state.unlockedAchievements?.['eco_queue_1'] ? 0.95 : 1) * (state.unlockedAchievements?.['eco_queue_2'] ? 0.85 : 1);
    timeToBuy *= queueTimeAchMult;

    const tickMs = 50;
    const interval = setInterval(() => {
      setQueueProgress(prev => {
        const next = prev + (tickMs / timeToBuy) * 100;
        if (next >= 100) {
          let restartQueue = false;
          updateState(s => {
            const doubleChance = (s.pewexItems['krakus'] ? 0.05 : 0) + (s.baltonaUpgrades?.['alpia'] ? 0.15 : 0);
            const isDouble = Math.random() < doubleChance;
            const amount = isDouble ? 2 : 1;
            
            if (isDouble) playSuccess();

            const nextState = {
              ...s,
              inventory: { ...s.inventory, [item.id]: (s.inventory[item.id] || 0) + amount }
            };
            
            // Auto-requeue logic (Podwyżki cen 1.5x, Uwolnienie cen 2x) i inflacja
            const inflationFactor = 1 + (s.inflationPercent / 100);
            let baseCost = item.costPln;
            if (s.activeEvent === 'podwyzki') baseCost = Math.floor(item.costPln * 1.5);
            else if (s.activeEvent === 'uwolnienie_cen') baseCost = item.costPln * 2;
            const currentCost = Math.floor(baseCost * inflationFactor);
            const isReq = (item.kartkiCost || 0) > 0 && !(s.activeDestination === 'australia' && (s.timeInCurrentLoop || 0) < 300);
            const reqKartki = isReq ? (item.kartkiCost || 0) : 0;
            if (s.plnUpgrades['zeszyt'] && s.pln >= currentCost && s.kartki >= reqKartki) {
                nextState.pln -= currentCost;
                if (reqKartki > 0) nextState.kartki -= reqKartki;
                restartQueue = true;
            }
            
            return nextState;
          });
          
          if (!restartQueue) {
             setActiveQueue(null);
          }
          return 0; // reset progress
        }
        return next;
      });
    }, tickMs);
    
    return () => clearInterval(interval);
  }, [activeQueue, state.pewexItems, state.plnUpgrades, state.activeEvent, state.unlockedAchievements, state.activeDestination, state.solidarnos, updateState, settingsOpen]);

  // Queue Progression 2 (Double queue upgrade)
  useEffect(() => {
    if (!activeQueue2 || settingsOpen) return;
    const item = QUEUE_ITEMS.find(i => i.id === activeQueue2);
    if (!item) return;

    let timeToBuy = item.timeToBuyMs;
    if (state.pewexItems['toblerone']) timeToBuy *= 0.85;
    if (state.plnUpgrades['kozuch']) timeToBuy *= 0.90;
    if (state.pewexItems['cola']) timeToBuy *= 0.8;
    if (state.pewexItems['maluch']) timeToBuy *= 0.6;
    if (state.baltonaUpgrades?.['jacobs']) timeToBuy *= 0.90;
    if (state.activeEvent === 'kryzys') timeToBuy *= 1.20;
    if (state.activeDestination === 'austria') timeToBuy *= 0.90;
    if (state.solidarnos >= 2000) timeToBuy *= 0.95;

    const queueTimeAchMult = (state.unlockedAchievements?.['eco_queue_1'] ? 0.95 : 1) * (state.unlockedAchievements?.['eco_queue_2'] ? 0.85 : 1);
    timeToBuy *= queueTimeAchMult;

    const tickMs = 50;
    const interval = setInterval(() => {
      setQueueProgress2(prev => {
        const next = prev + (tickMs / timeToBuy) * 100;
        if (next >= 100) {
          let restartQueue = false;
          updateState(s => {
            const doubleChance = (s.pewexItems['krakus'] ? 0.05 : 0) + (s.baltonaUpgrades?.['alpia'] ? 0.15 : 0);
            const isDouble = Math.random() < doubleChance;
            const amount = isDouble ? 2 : 1;
            
            if (isDouble) playSuccess();

            const nextState = {
              ...s,
              inventory: { ...s.inventory, [item.id]: (s.inventory[item.id] || 0) + amount }
            };
            
            const inflationFactor = 1 + (s.inflationPercent / 100);
            let baseCost = item.costPln;
            if (s.activeEvent === 'podwyzki') baseCost = Math.floor(item.costPln * 1.5);
            else if (s.activeEvent === 'uwolnienie_cen') baseCost = item.costPln * 2;
            const currentCost = Math.floor(baseCost * inflationFactor);
            const isReq = (item.kartkiCost || 0) > 0 && !(s.activeDestination === 'australia' && (s.timeInCurrentLoop || 0) < 300);
            const reqKartki = isReq ? (item.kartkiCost || 0) : 0;
            if (s.plnUpgrades['zeszyt'] && s.pln >= currentCost && s.kartki >= reqKartki) {
                nextState.pln -= currentCost;
                if (reqKartki > 0) nextState.kartki -= reqKartki;
                restartQueue = true;
            }
            
            return nextState;
          });
          
          if (!restartQueue) {
             setActiveQueue2(null);
          }
          return 0;
        }
        return next;
      });
    }, tickMs);
    
    return () => clearInterval(interval);
  }, [activeQueue2, state.pewexItems, state.plnUpgrades, state.activeEvent, state.unlockedAchievements, state.activeDestination, state.solidarnos, updateState, settingsOpen]);

  // Smuggling Progression
  useEffect(() => {
    if (!activeSmuggle || settingsOpen) return;
    const route = SMUGGLING_ROUTES.find(r => r.id === activeSmuggle);
    if (!route) return;

    const tickMs = 50;
    const interval = setInterval(() => {
      setSmuggleProgress(prev => {
        let timeMs = route.timeMs;
        if (state.solidarnos >= 3000) timeMs *= 0.85; // Kurier: -15% czasu szmugla
        if (state.baltonaUpgrades?.['marlboro']) timeMs *= 0.80; // Marlboro: -20% czasu szmugla
        const next = prev + (tickMs / timeMs) * 100;
        if (next >= 100) {
          updateState(s => {
            const polaroidDiscount = s.pewexItems['polaroid'] ? 0.75 : 1.0;
            let risk = route.riskPercent * polaroidDiscount;
            if (s.unlockedAchievements?.['smug_safe']) risk = Math.max(0, risk - 10);
            
            const isCaught = Math.random() < (risk / 100);
            if (isCaught) {
                 const suspAchMult = (s.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (s.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
                 const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
                 const suspAdd = (s.partyRank === 'minister' || s.partyRank === 'biuro' || s.activeEvent === 'odwilz') ? 0 : Math.floor(20 * suspAchMult * luxurySuspMult);
                const insuranceDollars = s.unlockedAchievements?.['smug_caught'] ? 10 : 0;
                const stats = {
                  ...s.stats,
                  totalCleCatches: (s.stats.totalCleCatches || 0) + 1,
                  totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + insuranceDollars
                };
                
                const alertMsg = insuranceDollars > 0 
                  ? `PRZEMYT ZATRZYMANY NA CLE! Straż Graniczna konfiskuje towar. Wzrost Podejrzenia!\n\nOtrzymujesz $10 z ubezpieczenia.`
                  : `PRZEMYT ZATRZYMANY NA CLE! Straż Graniczna konfiskuje towar. Wzrost Podejrzenia!`;
                setTimeout(() => showAlert(alertMsg, 'KONTROLA CELNA', 'error'), 50);
                
                return { 
                  ...s, 
                  suspicion: s.suspicion + suspAdd,
                  dollars: s.dollars + insuranceDollars,
                  stats
                };
            } else {
                let dollarsEarned = Math.floor(Math.random() * (route.maxDollarsEarned - route.minDollarsEarned + 1)) + route.minDollarsEarned;
                if (s.pewexItems['rubin']) dollarsEarned *= 2;
                
                const smugAchMult = 1 + (s.unlockedAchievements?.['smug_first'] ? 0.10 : 0) + (s.unlockedAchievements?.['smug_king'] ? 0.25 : 0);
                const transformMult = s.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
                const importMult = s.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
                dollarsEarned = Math.floor(dollarsEarned * smugAchMult * transformMult * importMult);
                
                // Solidarity Przywódca: +50% zysków z przemytu
                if (s.solidarnos >= 8000) {
                  dollarsEarned = Math.floor(dollarsEarned * 1.50);
                }
                
                let rubleEarned = 0;
                let alertMsg = `Przemyt udany! Zarobiono $${dollarsEarned}`;
                if (route.id === 'moskwa') {
                  rubleEarned = Math.floor(Math.random() * 31) + 20; // 20 - 50 Rubli
                  if (s.unlockedAchievements?.['smug_moskwa']) rubleEarned += 2;
                  alertMsg += ` oraz ${rubleEarned} Rubli`;
                }
                
                setTimeout(() => showAlert(alertMsg, 'SUKCES SZMUGLA', 'success'), 50);
                
                const stats = {
                  ...s.stats,
                  totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + dollarsEarned,
                  totalSmugglesCompleted: (s.stats.totalSmugglesCompleted || 0) + 1
                };
                
                return { 
                  ...s, 
                  dollars: s.dollars + dollarsEarned,
                  ruble: s.ruble + rubleEarned,
                  stats
                };
            }
          });
          setActiveSmuggle(null);
          return 0;
        }
        return next;
      });
    }, tickMs);
    
    return () => clearInterval(interval);
  }, [activeSmuggle, state.solidarnos, state.baltonaUpgrades, updateState, settingsOpen]);

  // Printing Progression
  useEffect(() => {
    if (!state.isPrinting || settingsOpen) return;
    const printTimeMs = 5000; // 5 seconds
    const tickMs = 50;
    const interval = setInterval(() => {
      updateState(s => {
        if (!s.isPrinting) return s;
        if (s.bibulaLockdownRemaining > 0) {
          return { ...s, isPrinting: false, printProgress: 0 };
        }
        const nextProgress = s.printProgress + (tickMs / printTimeMs) * 100;
        if (nextProgress >= 100) {
          if (s.bibulaPaper >= 1 && s.bibulaInk >= 1) {
            playSuccess();
            return {
              ...s,
              bibulaPaper: s.bibulaPaper - 1,
              bibulaInk: s.bibulaInk - 1,
              bibulaPisma: s.bibulaPisma + 10,
              printProgress: 0,
              isPrinting: false
            };
          } else {
            playError();
            return {
              ...s,
              printProgress: 0,
              isPrinting: false
            };
          }
        }
        return {
          ...s,
          printProgress: nextProgress
        };
      });
    }, tickMs);
    return () => clearInterval(interval);
  }, [state.isPrinting, updateState, settingsOpen]);

  // Sea Smuggling Progression
  useEffect(() => {
    if (!state.activeSeaSmuggle || settingsOpen) return;
    const route = SEA_SMUGGLING_ROUTES.find(r => r.id === state.activeSeaSmuggle);
    if (!route) return;

    let timeMs = route.timeMs;
    if (state.baltonaUpgrades['marlboro']) {
      timeMs *= 0.8;
    }
    if (state.solidarnos >= 3000) {
      timeMs *= 0.85;
    }

    if (state.unlockedAchievements?.['sea_smug_3']) {
      timeMs *= 0.85;
    }

    const tickMs = 100;
    const interval = setInterval(() => {
      updateState(s => {
        if (!s.activeSeaSmuggle) return s;
        const nextProgress = s.seaSmuggleProgress + (tickMs / timeMs) * 100;
        if (nextProgress >= 100) {
          const r = SEA_SMUGGLING_ROUTES.find(routeItem => routeItem.id === s.activeSeaSmuggle);
          if (!r) {
            return { ...s, activeSeaSmuggle: null, seaSmuggleProgress: 0 };
          }
          
          let finalRisk = r.riskPercent;
          if (s.pewexItems['polaroid']) {
            finalRisk *= 0.75;
          }
          
          const isCaught = Math.random() * 100 < finalRisk;
          if (isCaught) {
            playAlert();
            const hasInsurance = !!s.unlockedAchievements['smug_caught'];
            const insuranceDollars = hasInsurance ? 10 : 0;
            
            setTimeout(() => {
              showAlert(
                `Aresztowanie na morzu! Marynarz wpadł podczas kontroli celnej w porcie. Towar skonfiskowany! ${hasInsurance ? "\n\n[UBEZPIECZENIE]: Wypłacono $10 odszkodowania." : ""}`,
                "KONTROLA CELNA (WPADKA)",
                "error"
              );
            }, 50);

            return {
              ...s,
              dollars: s.dollars + insuranceDollars,
              activeSeaSmuggle: null,
              seaSmuggleProgress: 0,
              stats: {
                ...s.stats,
                totalCleCatches: (s.stats.totalCleCatches || 0) + 1,
                totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + insuranceDollars
              }
            };
          } else {
            playSuccess();
            let bonyEarned = Math.floor(Math.random() * (r.maxBony - r.minBony + 1)) + r.minBony;
            const bonus1 = s.unlockedAchievements?.['sea_smug_1'] ? 0.10 : 0;
            const bonus2 = s.unlockedAchievements?.['sea_smug_2'] ? 0.20 : 0;
            bonyEarned = Math.floor(bonyEarned * (1 + bonus1 + bonus2));
            
            setTimeout(() => {
              showAlert(
                `Statek dotarł do portu! Marynarze pomyślnie dostarczyli towar i wręczyli Ci ${bonyEarned} Bonów Towarowych Baltona.`,
                "UDANY PRZEMYT MORSKI",
                "success"
              );
            }, 50);

            const nextSeaCompleted = (s.stats.totalSeaSmugglesCompleted || 0) + 1;
            const nextBonyEarned = (s.stats.totalBonyEarned || 0) + bonyEarned;
            
            const nextAchievements = { ...s.unlockedAchievements };
            if (nextSeaCompleted >= 5 && !nextAchievements['sea_smug_1']) {
              nextAchievements['sea_smug_1'] = true;
              setTimeout(() => showAlert("Odblokowano osiągnięcie: Wilk Morski!", "OSIĄGNIĘCIE ODBLOKOWANE", "success"), 200);
            }
            if (nextSeaCompleted >= 25 && !nextAchievements['sea_smug_2']) {
              nextAchievements['sea_smug_2'] = true;
              setTimeout(() => showAlert("Odblokowano osiągnięcie: Kapitan Floty!", "OSIĄGNIĘCIE ODBLOKOWANE", "success"), 250);
            }
            if (nextBonyEarned >= 500 && !nextAchievements['sea_smug_3']) {
              nextAchievements['sea_smug_3'] = true;
              setTimeout(() => showAlert("Odblokowano osiągnięcie: Trójkąt Bermudzki!", "OSIĄGNIĘCIE ODBLOKOWANE", "success"), 300);
            }

            return {
              ...s,
              bonyBaltona: s.bonyBaltona + bonyEarned,
              activeSeaSmuggle: null,
              seaSmuggleProgress: 0,
              unlockedAchievements: nextAchievements,
              stats: {
                ...s.stats,
                totalSmugglesCompleted: (s.stats.totalSmugglesCompleted || 0) + 1,
                totalSeaSmugglesCompleted: nextSeaCompleted,
                totalBonyEarned: nextBonyEarned
              }
            };
          }
        }
        return {
          ...s,
          seaSmuggleProgress: nextProgress
        };
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [state.activeSeaSmuggle, state.baltonaUpgrades, state.solidarnos, state.pewexItems, state.unlockedAchievements, updateState, settingsOpen]);

  const startQueue = (id: string, cost: number, kartkiCost: number = 0) => {
    const hasDoubleQueue = !!state.pewexItems['podwojna_kolejka'];
    let targetSlot = 0;
    if (!activeQueue) {
      targetSlot = 1;
    } else if (hasDoubleQueue && !activeQueue2) {
      targetSlot = 2;
    } else {
      playError();
      return;
    }

    const inflationFactor = 1 + (state.inflationPercent / 100);
    let baseCost = cost;
    if (state.activeEvent === 'podwyzki') baseCost = Math.floor(cost * 1.5);
    else if (state.activeEvent === 'uwolnienie_cen') baseCost = cost * 2;
    const finalCost = Math.floor(baseCost * inflationFactor);
    if (state.pln < finalCost) { playError(); return; }
    
    const isReq = kartkiCost > 0 && !(state.activeDestination === 'australia' && (state.timeInCurrentLoop || 0) < 300);
    const actualKartkiCost = isReq ? kartkiCost : 0;
    if (state.kartki < actualKartkiCost) { playError(); return; }
    
    playClick();
    updateState(s => ({ ...s, pln: s.pln - finalCost, kartki: s.kartki - actualKartkiCost }));
    if (targetSlot === 1) {
      setQueueProgress(0);
      setActiveQueue(id);
    } else {
      setQueueProgress2(0);
      setActiveQueue2(id);
    }
  };

  const startSmuggle = (id: string, cost: number) => {
    if (activeSmuggle) { playError(); return; }
    if (state.pln < cost) { playError(); return; }
    playClick();
    updateState(s => ({ ...s, pln: s.pln - cost }));
    setSmuggleProgress(0);
    setActiveSmuggle(id);
  };

  const sellItem = (id: string, price: number, amount: number = 1) => {
    const currentAmount = Math.floor(state.inventory[id] || 0);
    if (currentAmount < amount) { playError(); return; }
    
    playClick();
    
    let multiplier = 1;
    if (state.pewexItems['donald']) multiplier *= 1.15;
    if (state.pewexItems['wrangler']) multiplier *= 1.5;
    if (state.pewexItems['rubin']) multiplier *= 2.0;
    if (state.activeEvent === 'czarnobyl') multiplier *= 0.7; // Czarnobyl (-30% wartości sprzedaży)
    
    const ecoPlnMult = 1 + (state.unlockedAchievements?.['eco_pln_1'] ? 0.05 : 0) + (state.unlockedAchievements?.['eco_pln_2'] ? 0.10 : 0) + (state.unlockedAchievements?.['eco_pln_3'] ? 0.20 : 0);
    const presTimeMult = 1 + (state.unlockedAchievements?.['pres_time_1'] ? 0.10 : 0) + (state.unlockedAchievements?.['pres_time_2'] ? 0.25 : 0);
    const transformMult = state.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
    const solidarityBazarMult = state.solidarnos >= 500 ? 1.05 : 1.0;
    const importMult = state.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
    const peklimaxMult = (state.baltonaUpgrades?.['peklimax'] && (id === 'gozdziki' || id === 'czesci' || id === 'wyroby_hutnicze')) ? 1.40 : 1.0;
    if (state.activeEvent === 'uwolnienie_cen') multiplier *= 2.5;
    multiplier = multiplier * ecoPlnMult * presTimeMult * transformMult * solidarityBazarMult * importMult;
    const inflationFactor = 1 + (state.inflationPercent / 100);
    const finalPrice = Math.floor(price * amount * multiplier * peklimaxMult * inflationFactor);
    
    updateState(s => {
      let kartkiGained = 0;
      if (s.plnUpgrades['znajomosci'] && Math.random() < 0.1) {
         kartkiGained = 1;
      }
      const stats = {
        ...s.stats,
        totalPlnEarned: (s.stats.totalPlnEarned || 0) + finalPrice,
        totalBazarPlnEarned: (s.stats.totalBazarPlnEarned || 0) + finalPrice,
        totalItemsSold: (s.stats.totalItemsSold || 0) + amount
      };
      return {
        ...s,
        pln: s.pln + finalPrice,
        kartki: s.kartki + kartkiGained,
        inventory: { ...s.inventory, [id]: s.inventory[id] - amount },
        stats
      };
    });
  };

  const sellItemDollars = (id: string, price: number, amount: number = 1) => {
    const currentAmount = Math.floor(state.inventory[id] || 0);
    if (currentAmount < amount) { playError(); return; }
    
    playClick();
    
    let multiplier = 1;
    if (state.pewexItems['donald']) multiplier *= 1.15;
    if (state.pewexItems['wrangler']) multiplier *= 1.5;
    if (state.pewexItems['rubin']) multiplier *= 2.0;
    if (state.activeEvent === 'czarnobyl') multiplier *= 0.7; // Czarnobyl (-30% wartości sprzedaży)
    
    const importMult = state.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
    const peklimaxMult = (state.baltonaUpgrades?.['peklimax'] && (id === 'gozdziki' || id === 'czesci' || id === 'wyroby_hutnicze')) ? 1.40 : 1.0;
    const finalPrice = Math.floor(price * amount * multiplier * importMult * peklimaxMult);
    
    updateState(s => {
      const stats = {
        ...s.stats,
        totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + finalPrice,
        totalItemsSold: (s.stats.totalItemsSold || 0) + amount
      };
      return {
        ...s,
        dollars: s.dollars + finalPrice,
        inventory: { ...s.inventory, [id]: s.inventory[id] - amount },
        stats
      };
    });
  };

  const pracuj = () => {
     playClick();
     updateState(s => {
        const kartkiGained = Math.random() < 0.1 ? 1 : 0;
        if (kartkiGained) playSuccess();
        let mult = 1;
        if (s.pewexItems['walkman']) mult *= 2;
        if (s.pewexItems['rubin']) mult *= 2;
        if (s.baltonaUpgrades?.['jacobs']) mult *= 1.2;
        
        const ngPlusWorkMult = s.prestigeCount >= 2 ? 2.0 : 1.0;
        const workMult = 1 + (s.unlockedAchievements?.['eco_sell_1'] ? 0.05 : 0) + (s.unlockedAchievements?.['eco_sell_2'] ? 0.15 : 0);
        const presTimeMult = 1 + (s.unlockedAchievements?.['pres_time_1'] ? 0.10 : 0) + (s.unlockedAchievements?.['pres_time_2'] ? 0.25 : 0);
        const transformMult = s.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
        const importMult = s.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
        const plnGained = 5 * mult * workMult * presTimeMult * transformMult * ngPlusWorkMult * importMult;
        const inflationFactor = 1 + (s.inflationPercent / 100);
        const finalPlnGained = Math.floor(plnGained / inflationFactor);
        
        const stats = {
          ...s.stats,
          totalPlnEarned: (s.stats.totalPlnEarned || 0) + finalPlnGained
        };
        return { 
          ...s, 
          pln: s.pln + finalPlnGained, 
          kartki: s.kartki + kartkiGained,
          stats
        };
     });
  };

  const buyHelper = (id: string, cost: number) => {
    if (state.pln < cost) return;
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      helpers: { ...s.helpers, [id]: (s.helpers[id] || 0) + 1 }
    }));
  };

  const buyInflationUpgrade = (id: string, currency: 'pln' | 'dollars', cost: number) => {
    if (state.inflationUpgrades?.[id]) return;
    
    let finalCost = cost;
    if (currency === 'pln') {
      const inflationFactor = 1 + (state.inflationPercent / 100);
      finalCost = Math.floor(cost * inflationFactor);
    }
    
    const balance = currency === 'pln' ? state.pln : state.dollars;
    if (balance < finalCost) { playError(); return; }
    
    playClick();
    updateState(s => {
      const nextUpgrades = { ...s.inflationUpgrades, [id]: true };
      return {
        ...s,
        pln: currency === 'pln' ? s.pln - finalCost : s.pln,
        dollars: currency === 'dollars' ? s.dollars - finalCost : s.dollars,
        inflationUpgrades: nextUpgrades
      };
    });
  };

  const buyShares = (stockId: string, amount: number) => {
    const stock = GPW_STOCKS.find(s => s.id === stockId);
    if (!stock) return;

    const currentPrice = state.stockPrices[stockId] || stock.basePrice;
    const crashDiscount = state.unlockedAchievements?.['gpw_crash'] ? 0.85 : 1.0;
    const finalPrice = Math.round(currentPrice * crashDiscount);
    const cost = finalPrice * amount;

    const hasWolf = state.unlockedAchievements?.['gpw_wolf'];
    const commissionRate = hasWolf ? 0.0 : 0.01;
    const commission = Math.round(cost * commissionRate);
    const totalCost = cost + commission;

    if (state.pln < totalCost) {
      playError();
      showAlert(`Brak środków w PLN! Wymagane: ${totalCost} zł (w tym prowizja: ${commission} zł).`, 'Błąd transakcji', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      const nextOwned = { ...s.sharesOwned };
      const nextAvgCost = { ...s.sharesAvgCost };

      const currentOwned = nextOwned[stockId] || 0;
      const currentAvg = nextAvgCost[stockId] || 0;

      const newOwned = currentOwned + amount;
      const newAvg = Math.round(((currentOwned * currentAvg) + (amount * finalPrice)) / newOwned);

      nextOwned[stockId] = newOwned;
      nextAvgCost[stockId] = newAvg;

      addToast("ZAKUP AKCJI", `Kupiłeś ${amount} akcji ${stock.name} za ${totalCost} zł.`);
      
      const nextAchievements = { ...s.unlockedAchievements };
      if (newOwned >= 1000 && !nextAchievements['gpw_investor']) {
        nextAchievements['gpw_investor'] = true;
        setTimeout(() => {
          playSuccess();
          addToast("ZDOBYTO ODZNACZENIE!", "Inwestor Strategiczny");
        }, 500);
      }

      return {
        ...s,
        pln: s.pln - totalCost,
        sharesOwned: nextOwned,
        sharesAvgCost: nextAvgCost,
        unlockedAchievements: nextAchievements
      };
    });
  };

  const sellShares = (stockId: string, amount: number) => {
    const stock = GPW_STOCKS.find(s => s.id === stockId);
    if (!stock) return;

    const currentOwned = state.sharesOwned[stockId] || 0;
    if (currentOwned < amount) {
      playError();
      showAlert(`Nie posiadasz tylu akcji na sprzedaż! Posiadasz: ${currentOwned}.`, 'Błąd transakcji', 'error');
      return;
    }

    const currentPrice = state.stockPrices[stockId] || stock.basePrice;
    const revenue = currentPrice * amount;

    const hasWolf = state.unlockedAchievements?.['gpw_wolf'];
    const commissionRate = hasWolf ? 0.0 : 0.01;
    const commission = Math.round(revenue * commissionRate);
    const finalRevenue = revenue - commission;

    const avgCost = state.sharesAvgCost[stockId] || 0;
    const transactionProfit = (currentPrice - avgCost) * amount;

    playSuccess();
    updateState(s => {
      const nextOwned = { ...s.sharesOwned };
      const nextAvgCost = { ...s.sharesAvgCost };

      const newOwned = currentOwned - amount;
      nextOwned[stockId] = newOwned;
      if (newOwned === 0) {
        delete nextAvgCost[stockId];
      }

      const nextStats = { ...s.stats };
      if (transactionProfit > 0) {
        nextStats.totalGpwProfit = (nextStats.totalGpwProfit || 0) + transactionProfit;
      }

      const nextAchievements = { ...s.unlockedAchievements };
      if (transactionProfit <= -50000 && !nextAchievements['gpw_crash']) {
        nextAchievements['gpw_crash'] = true;
        setTimeout(() => {
          playSuccess();
          addToast("ZDOBYTO ODZNACZENIE!", "Krach 1991");
        }, 500);
      }

      if ((nextStats.totalGpwProfit || 0) >= 500000 && !nextAchievements['gpw_wolf']) {
        nextAchievements['gpw_wolf'] = true;
        setTimeout(() => {
          playSuccess();
          addToast("ZDOBYTO ODZNACZENIE!", "Wilk z Wall Street");
        }, 500);
      }

      addToast("SPRZEDAŻ AKCJI", `Sprzedałeś ${amount} akcji ${stock.name} za ${finalRevenue} zł.`);

      return {
        ...s,
        pln: s.pln + finalRevenue,
        sharesOwned: nextOwned,
        sharesAvgCost: nextAvgCost,
        stats: nextStats,
        unlockedAchievements: nextAchievements
      };
    });
  };

  const buyGpwInsiderTip = (currency: 'pln' | 'dollars') => {
    const costPln = 50000;
    const costUsd = 1000;

    if (currency === 'pln' && state.pln < costPln) {
      playError();
      showAlert(`Brak środków! Przeciek giełdowy kosztuje ${costPln} zł.`, 'Brak gotówki', 'error');
      return;
    }
    if (currency === 'dollars' && state.dollars < costUsd) {
      playError();
      showAlert(`Brak środków! Przeciek giełdowy kosztuje $${costUsd} USD.`, 'Brak gotówki', 'error');
      return;
    }

    const randomStock = GPW_STOCKS[Math.floor(Math.random() * GPW_STOCKS.length)];
    const direction = Math.random() < 0.7 ? 'up' : 'down';

    playSuccess();
    updateState(s => {
      const nextSusp = Math.min(100, s.suspicion + 15);
      
      const tipText = direction === 'up' 
        ? `PRZECIEK UOP: Akcje ${randomStock.name} gwałtownie wzrosną w ciągu najbliższych 40 sekund!` 
        : `PRZECIEK UOP: Nadchodzi załamanie kursu ${randomStock.name}! Akcje polecą w dół!`;

      setTimeout(() => {
        showAlert(tipText, 'INFORMACJA INSIDERSKA (TAJNE)', 'info');
      }, 50);

      return {
        ...s,
        pln: currency === 'pln' ? s.pln - costPln : s.pln,
        dollars: currency === 'dollars' ? s.dollars - costUsd : s.dollars,
        suspicion: nextSusp,
        gpwInsiderTip: {
          stockId: randomStock.id,
          effect: direction,
          ticksLeft: 4
        }
      };
    });
  };

  const registerNomenklaturaCompany = (companyId: string) => {
    const comp = NOMENKLATURA_COMPANIES.find(c => c.id === companyId);
    if (!comp) return;

    if (state.pln < comp.costPln) {
      playError();
      showAlert(`Brak środków w PLN! Rejestracja spółki ${comp.name} kosztuje ${comp.costPln} zł.`, 'Błąd transakcji', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      const nextCompanies = { ...s.nomenklaturaCompanies };
      nextCompanies[companyId] = {
        registered: true,
        assetLevel: 0,
        directorCount: 0,
        twAssigned: false
      };

      addToast("REJESTRACJA SPÓŁKI", `Zarejestrowano prywatną spółkę ${comp.name}!`);

      return {
        ...s,
        pln: s.pln - comp.costPln,
        nomenklaturaUnlocked: true,
        nomenklaturaCompanies: nextCompanies
      };
    });
  };

  const upgradeLeasing = (companyId: string) => {
    const comp = NOMENKLATURA_COMPANIES.find(c => c.id === companyId);
    if (!comp) return;

    const companyState = state.nomenklaturaCompanies?.[companyId];
    if (!companyState || !companyState.registered) return;

    const currentLevel = companyState.assetLevel || 0;
    const oligarchDiscount = state.unlockedAchievements?.['nom_oligarch'] ? 0.80 : 1.0;
    const baseUpgradeCost = Math.floor(comp.costPln * 0.5);
    const cost = Math.round(baseUpgradeCost * Math.pow(2.2, currentLevel) * oligarchDiscount);

    if (state.pln < cost) {
      playError();
      showAlert(`Brak gotówki w PLN! Modernizacja leasingu maszyn kosztuje ${cost} zł.`, 'Brak gotówki', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      const nextCompanies = { ...s.nomenklaturaCompanies };
      const currentCompany = nextCompanies[companyId];
      
      const newLevel = currentCompany.assetLevel + 1;
      nextCompanies[companyId] = {
        ...currentCompany,
        assetLevel: newLevel
      };

      addToast("LEASING MASZYN", `Zwiększono poziom majątku spółki ${comp.name} do ${newLevel}!`);

      return {
        ...s,
        pln: s.pln - cost,
        nomenklaturaCompanies: nextCompanies
      };
    });
  };

  const hireRedDirector = (companyId: string) => {
    const comp = NOMENKLATURA_COMPANIES.find(c => c.id === companyId);
    if (!comp) return;

    const companyState = state.nomenklaturaCompanies?.[companyId];
    if (!companyState || !companyState.registered) return;

    const currentDirectors = companyState.directorCount || 0;
    if (currentDirectors >= 5) {
      playError();
      showAlert(`Osiągnięto limit dyrektorów! Spółka może zatrudniać maksymalnie 5 Czerwonych Dyrektorów.`, 'Błąd transakcji', 'error');
      return;
    }

    const directorDiscount = state.unlockedAchievements?.['nom_director'] ? 0.70 : 1.0;
    const cost = Math.round(1500 * (currentDirectors + 1) * directorDiscount);

    if (state.dollars < cost) {
      playError();
      showAlert(`Brak dewiz w USD! Zatrudnienie Czerwonego Dyrektora kosztuje $${cost} USD.`, 'Brak dolarów', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      const nextCompanies = { ...s.nomenklaturaCompanies };
      const currentCompany = nextCompanies[companyId];
      
      const newDirectors = currentCompany.directorCount + 1;
      nextCompanies[companyId] = {
        ...currentCompany,
        directorCount: newDirectors
      };

      const totalDirectors = Object.values(nextCompanies).reduce((sum, c) => sum + (c.directorCount || 0), 0);
      const nextAchievements = { ...s.unlockedAchievements };
      if (totalDirectors >= 10 && !nextAchievements['nom_director']) {
        nextAchievements['nom_director'] = true;
        setTimeout(() => {
          playSuccess();
          addToast("ZDOBYTO ODZNACZENIE!", "Czerwony Baron");
        }, 500);
      }

      addToast("CZERWONY DYREKTOR", `Zatrudniono dyrektora w ${comp.name}. Łącznie: ${newDirectors}/5.`);

      return {
        ...s,
        dollars: s.dollars - cost,
        nomenklaturaCompanies: nextCompanies,
        unlockedAchievements: nextAchievements
      };
    });
  };

  const recruitTwInNomenklatura = (companyId: string) => {
    const comp = NOMENKLATURA_COMPANIES.find(c => c.id === companyId);
    if (!comp) return;

    const companyState = state.nomenklaturaCompanies?.[companyId];
    if (!companyState || !companyState.registered) return;

    if (companyState.twAssigned) {
      playError();
      return;
    }

    if (state.bonyBaltona < 100) {
      playError();
      showAlert(`Brak Bonów Baltona! Zwerbowanie TW w zarządzie kosztuje 100 Bonów Baltona.`, 'Brak bonów', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      const nextCompanies = { ...s.nomenklaturaCompanies };
      const currentCompany = nextCompanies[companyId];
      
      nextCompanies[companyId] = {
        ...currentCompany,
        twAssigned: true
      };

      const nextAchievements = { ...s.unlockedAchievements };
      const allFourTw = NOMENKLATURA_COMPANIES.every(c => nextCompanies[c.id]?.twAssigned);
      if (allFourTw && !nextAchievements['nom_corruption']) {
        nextAchievements['nom_corruption'] = true;
        setTimeout(() => {
          playSuccess();
          addToast("ZDOBYTO ODZNACZENIE!", "Brak Śladów");
        }, 500);
      }

      addToast("WERBUNEK TW", `Zwerbowano Tajnego Współpracownika w spółce ${comp.name}!`);

      return {
        ...s,
        bonyBaltona: s.bonyBaltona - 100,
        nomenklaturaCompanies: nextCompanies,
        unlockedAchievements: nextAchievements
      };
    });
  };

  const bribeSbChief = () => {
    const bribeCost = 2500;

    if (state.dollars < bribeCost) {
      playError();
      showAlert(`Brak dolarów! Łapówka dla Naczelnika SB kosztuje $${bribeCost} USD.`, 'Brak dolarów', 'error');
      return;
    }

    playSuccess();
    updateState(s => {
      addToast("ŁAPÓWKA DLA SB", "Naczelnik SB przyjął kopertę. Śledztwa zostały wstrzymane.");

      return {
        ...s,
        dollars: s.dollars - bribeCost,
        sbSuspicion: 0
      };
    });
  };

  const openSwissAccount = (payWith: 'pln' | 'dollars') => {
    const costPln = 250000;
    const costUsd = 5000;

    if (payWith === 'pln' && state.pln < costPln) {
      playError();
      showAlert(`Brak środków! Otwarcie konta kosztuje ${costPln.toLocaleString()} zł.`, 'Brak gotówki', 'error');
      return;
    }
    if (payWith === 'dollars' && state.dollars < costUsd) {
      playError();
      showAlert(`Brak środków! Otwarcie konta kosztuje $${costUsd.toLocaleString()} USD.`, 'Brak gotówki', 'error');
      return;
    }

    playSuccess();
    const accNum = `CH-${Math.floor(100000 + Math.random() * 900000)}`;

    updateState(s => {
      addToast("ZAKŁADANIE KONTA", `Otwarto szwajcarskie konto numeryczne ${accNum}!`);
      return {
        ...s,
        pln: payWith === 'pln' ? s.pln - costPln : s.pln,
        dollars: payWith === 'dollars' ? s.dollars - costUsd : s.dollars,
        swissAccountUnlocked: true,
        swissAccountNumber: accNum,
        swissBalancePln: 0,
        swissBalanceUsd: 0
      };
    });
  };

  const wireTransferToSwiss = (amount: number, currency: 'pln' | 'dollars') => {
    if (currency === 'pln' && state.pln < amount) {
      playError();
      showAlert("Brak środków w PLN na krajowym koncie!", "Błąd przelewu", "error");
      return;
    }
    if (currency === 'dollars' && state.dollars < amount) {
      playError();
      showAlert("Brak dewiz w USD na krajowym koncie!", "Błąd przelewu", "error");
      return;
    }

    const hasSwiftUpgrade = state.pewexItems?.['swift'];
    const commissionRate = hasSwiftUpgrade ? 0.005 : 0.03;
    const transferTime = hasSwiftUpgrade ? 5 : 30;

    const commission = Math.round(amount * commissionRate);
    const amountToTransfer = amount - commission;

    playSuccess();
    updateState(s => {
      const newTransfers = [...(s.activeWireTransfers || [])];
      newTransfers.push({
        id: `wire_${Date.now()}_${Math.random()}`,
        amount: amountToTransfer,
        currency,
        timeLeft: transferTime
      });

      let nextInterpolSusp = s.interpolSuspicion || 0;
      if (currency === 'dollars' && amount > 2000) {
        nextInterpolSusp = Math.min(100, nextInterpolSusp + (amount * 0.0005));
      }

      addToast("ZLECONO PRZELEW SWIFT", `Wysłano ${amountToTransfer.toLocaleString()} ${currency === 'pln' ? 'zł' : 'USD'} (Prowizja: ${commission.toLocaleString()}).`);

      return {
        ...s,
        pln: currency === 'pln' ? s.pln - amount : s.pln,
        dollars: currency === 'dollars' ? s.dollars - amount : s.dollars,
        activeWireTransfers: newTransfers,
        interpolSuspicion: nextInterpolSusp
      };
    });
  };

  const zurichExchange = (amount: number, from: 'pln' | 'usd') => {
    if (from === 'pln' && state.swissBalancePln < amount) {
      playError();
      showAlert("Brak środków w PLN na koncie szwajcarskim!", "Brak środków", "error");
      return;
    }
    if (from === 'usd' && state.swissBalanceUsd < amount) {
      playError();
      showAlert("Brak środków w USD na koncie szwajcarskim!", "Brak środków", "error");
      return;
    }

    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);

    if (currentMarketRate <= 0) return;

    playSuccess();
    updateState(s => {
      let nextBalPln = s.swissBalancePln;
      let nextBalUsd = s.swissBalanceUsd;

      if (from === 'pln') {
        const spreadRate = 0.015;
        const targetUsd = Math.floor((amount / currentMarketRate) * (1 - spreadRate));
        nextBalPln -= amount;
        nextBalUsd += targetUsd;
        addToast("KANTOR ZURYCH", `Wymieniono ${amount.toLocaleString()} PLN na $${targetUsd} USD.`);
      } else {
        const spreadRate = 0.015;
        const targetPln = Math.floor((amount * currentMarketRate) * (1 - spreadRate));
        nextBalUsd -= amount;
        nextBalPln += targetPln;
        addToast("KANTOR ZURYCH", `Wymieniono $${amount} USD na ${targetPln.toLocaleString()} PLN.`);
      }

      return {
        ...s,
        swissBalancePln: nextBalPln,
        swissBalanceUsd: nextBalUsd
      };
    });
  };

  const createOffshoreDeposit = (amount: number, currency: 'pln' | 'dollars', depositTypeId: string) => {
    if (currency === 'pln' && state.swissBalancePln < amount) {
      playError();
      showAlert("Brak środków w PLN na koncie szwajcarskim!", "Brak gotówki", "error");
      return;
    }
    if (currency === 'dollars' && state.swissBalanceUsd < amount) {
      playError();
      showAlert("Brak środków w USD na koncie szwajcarskim!", "Brak gotówki", "error");
      return;
    }

    const depType = OFFSHORE_DEPOSITS.find(d => d.id === depositTypeId);
    if (!depType) return;

    playSuccess();
    updateState(s => {
      const nextDeposits = [...(s.activeOffshoreDeposits || [])];
      nextDeposits.push({
        id: `dep_${Date.now()}_${Math.random()}`,
        amount,
        currency,
        timeLeft: depType.durationSec,
        depositTypeId
      });

      return {
        ...s,
        swissBalancePln: currency === 'pln' ? s.swissBalancePln - amount : s.swissBalancePln,
        swissBalanceUsd: currency === 'dollars' ? s.swissBalanceUsd - amount : s.swissBalanceUsd,
        activeOffshoreDeposits: nextDeposits
      };
    });
  };

  const registerLiechtensteinTrust = () => {
    const costUsd = 20000;

    if (state.dollars < costUsd) {
      playError();
      showAlert(`Brak dewiz! Założenie fundacji w Vaduz kosztuje $${costUsd.toLocaleString()} USD.`, "Brak dolarów", "error");
      return;
    }

    playSuccess();
    updateState(s => {
      addToast("LIECHTENSTEIN TRUST", "Rejestracja w Vaduz ukończona. Twój majątek krajowy jest teraz chroniony tarczą offshore!");
      return {
        ...s,
        dollars: s.dollars - costUsd,
        hasLiechtensteinTrust: true
      };
    });
  };

  const washOffshoreMoney = (amount: number) => {
    if (state.swissBalancePln < amount) {
      playError();
      showAlert("Brak PLN na koncie szwajcarskim!", "Brak gotówki", "error");
      return;
    }

    playSuccess();
    updateState(s => {
      const nextPln = s.pln + amount;
      const nextSwissBal = s.swissBalancePln - amount;
      const nextSusp = Math.max(0, s.suspicion - 20);

      const nextStats = {
        ...s.stats,
        totalOffshoreTransfersPln: (s.stats.totalOffshoreTransfersPln || 0) + amount
      };

      addToast("POLISA PRALNICZA", `Legalnie przetransferowano ${amount.toLocaleString()} PLN do kraju. Krajowe Podejrzenie Milicji spadło!`);

      return {
        ...s,
        pln: nextPln,
        swissBalancePln: nextSwissBal,
        suspicion: nextSusp,
        stats: nextStats
      };
    });
  };

  const sendOffshoreCourier = (amount: number, currency: 'pln' | 'dollars') => {
    if (currency === 'pln' && state.pln < amount) {
      playError();
      showAlert("Brak środków w PLN na koncie krajowym!", "Brak środków", "error");
      return;
    }
    if (currency === 'dollars' && state.dollars < amount) {
      playError();
      showAlert("Brak dewiz w USD na koncie krajowym!", "Brak gotówki", "error");
      return;
    }

    playSuccess();
    updateState(s => {
      const nextCouriers = [...(s.activeCouriers || [])];
      nextCouriers.push({
        id: `courier_${Date.now()}_${Math.random()}`,
        amount,
        currency,
        timeLeft: 120
      });

      addToast("KURIER WYRUSZYŁ", `Kurier wyruszył z kwotą ${amount.toLocaleString()} ${currency === 'pln' ? 'zł' : 'USD'} w walizce.`);

      return {
        ...s,
        pln: currency === 'pln' ? s.pln - amount : s.pln,
        dollars: currency === 'dollars' ? s.dollars - amount : s.dollars,
        activeCouriers: nextCouriers
      };
    });
  };

  const takeOffshoreCredit = () => {
    if (state.offshoreCreditTaken > 0) {
      playError();
      showAlert("Posiadasz już aktywny kredyt offshore! Spłać obecne zobowiązanie najpierw.", "Aktywny kredyt", "error");
      return;
    }

    let totalAssetValue = 0;
    NOMENKLATURA_COMPANIES.forEach(comp => {
      const companyState = state.nomenklaturaCompanies?.[comp.id];
      if (companyState && companyState.registered) {
        totalAssetValue += comp.costPln;
        const assetLevel = companyState.assetLevel || 0;
        const baseUpgradeCost = Math.floor(comp.costPln * 0.5);
        for (let i = 0; i < assetLevel; i++) {
          totalAssetValue += Math.round(baseUpgradeCost * Math.pow(2.2, i));
        }
      }
    });

    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);

    if (totalAssetValue === 0) {
      playError();
      showAlert("Nie posiadasz żadnego majątku krajowego pod zastaw kredytu! Zarejestruj najpierw spółki nomenklaturowe.", "Brak zastawu", "error");
      return;
    }

    const maxUsdCredit = Math.floor((totalAssetValue * 0.5) / currentMarketRate);
    if (maxUsdCredit < 100) {
      playError();
      showAlert("Twój zastaw jest za mały do zaciągnięcia kredytu dewizowego.", "Brak zastawu", "error");
      return;
    }

    playSuccess();
    updateState(s => {
      addToast("KREDYT DEWIZOWY", `Zaciągnięto pożyczkę na kwotę $${maxUsdCredit.toLocaleString()} USD. Czas na spłatę: 5 minut.`);
      return {
        ...s,
        swissBalanceUsd: (s.swissBalanceUsd || 0) + maxUsdCredit,
        offshoreCreditTaken: maxUsdCredit,
        offshoreCreditTimeLeft: 300
      };
    });
  };

  const payOffshoreCredit = () => {
    if (state.offshoreCreditTaken <= 0) return;

    const cost = Math.round(state.offshoreCreditTaken * 1.10);

    if (state.swissBalanceUsd < cost) {
      playError();
      showAlert(`Brak dolarów na koncie szwajcarskim! Spłata kredytu wraz z odsetkami kosztuje $${cost.toLocaleString()} USD.`, "Brak środków", "error");
      return;
    }

    playSuccess();
    updateState(s => {
      addToast("SPŁATA KREDYTU", "Kredyt offshore został w całości uregulowany. Zastaw zwolniony.");
      return {
        ...s,
        swissBalanceUsd: s.swissBalanceUsd - cost,
        offshoreCreditTaken: 0,
        offshoreCreditTimeLeft: 0
      };
    });
  };

  // ===== Faza J: Syndykat Eksportowy - Funkcje Transakcyjne =====

  const unlockSyndicate = () => {
    if (state.syndicateUnlocked) { playError(); return; }
    updateState(s => ({
      ...s,
      syndicateUnlocked: true
    }));
    playSuccess();
    showAlert('Syndykat Eksportowy został założony! Możesz teraz handlować technologiami objętymi embargiem COCOM.', '🕶️ SYNDYKAT AKTYWNY', 'success');
  };

  const buyCOCOMItem = (itemId: string) => {
    const item = COCOM_ITEMS.find(c => c.id === itemId);
    if (!item) { playError(); return; }

    if (item.requiredPartyRank && !state.syndicateUpgrades['nuclear_clearance']) {
      const ranks = ['czlonek', 'sekretarz', 'dyrektor', 'wiceminister', 'minister', 'biuro'];
      const requiredIdx = ranks.indexOf(item.requiredPartyRank);
      const currentIdx = ranks.indexOf(state.partyRank || '');
      if (currentIdx < requiredIdx) { playError(); showAlert(`Ten towar wymaga rangi ${item.requiredPartyRank} lub ulepszenia "Dostęp do towarów klasy A".`, 'BRAK DOSTĘPU', 'error'); return; }
    }

    if ((state.swissBalanceUsd || 0) < item.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      swissBalanceUsd: s.swissBalanceUsd - item.costUsd,
      cocomInventory: { ...s.cocomInventory, [itemId]: (s.cocomInventory[itemId] || 0) + 1 },
      interpolSuspicion: Math.min(100, (s.interpolSuspicion || 0) + (item.riskPercent * 0.15))
    }));
    playSuccess();
    addToast("SYNDYKAT: ZAKUP", `Zakupiono ${item.name} za $${item.costUsd.toLocaleString()}`);
  };

  const sendCocomShipment = (itemId: string, contactId: string, route: 'lad_road' | 'sea_route' | 'air_cargo') => {
    const item = COCOM_ITEMS.find(c => c.id === itemId);
    if (!item) { playError(); return; }
    if ((state.cocomInventory[itemId] || 0) <= 0) { playError(); return; }
    if (state.activeGeoEvent === 'cocom_audit') { playError(); showAlert('Inspekcja CoCom w toku! Wszystkie przesyłki zablokowane.', '⛔ BLOKADA', 'error'); return; }

    const contact = EXPORT_CONTACTS.find(c => c.id === contactId);
    if (!contact) { playError(); return; }

    // Check contact blocked by geo event
    if (state.activeGeoEvent === 'stasi_block' && contactId === 'stasi_net') { playError(); return; }
    if (state.activeGeoEvent === 'vienna_block' && contactId === 'vienna_contact') { playError(); return; }

    const routeTimes: Record<string, number> = { lad_road: 90, sea_route: 60, air_cargo: 20 };
    const routeLabels: Record<string, string> = { lad_road: 'Kolej lądowa', sea_route: 'Rejs morski', air_cargo: 'Cargo LOT' };
    const priceMult = contact ? (1 + contact.priceBonus) : 1;
    const routeMult: Record<string, number> = { lad_road: 1.0, sea_route: 1.10, air_cargo: 1.25 };

    const shipment = {
      id: Date.now().toString(),
      itemId,
      contactId,
      route: routeLabels[route] || route,
      amount: Math.floor(item.sellPricePln * priceMult * (routeMult[route] || 1)),
      timeLeft: routeTimes[route] || 90
    };

    updateState(s => ({
      ...s,
      cocomInventory: { ...s.cocomInventory, [itemId]: (s.cocomInventory[itemId] || 0) - 1 },
      activeCocomShipments: [...(s.activeCocomShipments || []), shipment]
    }));
    playClick();
    addToast("SYNDYKAT: WYSYŁKA", `Wysłano ${item.name} przez ${routeLabels[route]}`);
  };

  const buyCocomVehicle = (vehicleId: string) => {
    const vehicle = COCOM_VEHICLES.find(v => v.id === vehicleId);
    if (!vehicle) { playError(); return; }
    if ((state.cocomVehicles[vehicleId] || 0) >= 5) { playError(); showAlert('Maksymalnie 5 pojazdów tego typu.', 'LIMIT FLOTY', 'error'); return; }
    if (state.pln < vehicle.costPln || (state.swissBalanceUsd || 0) < vehicle.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - vehicle.costPln,
      swissBalanceUsd: s.swissBalanceUsd - vehicle.costUsd,
      cocomVehicles: { ...s.cocomVehicles, [vehicleId]: (s.cocomVehicles[vehicleId] || 0) + 1 }
    }));
    playSuccess();
    addToast("GARAŻ COCOM", `Kupiono pojazd: ${vehicle.name}`);
  };

  const hireCocomPersonnel = (personnelId: string) => {
    const person = COCOM_PERSONNEL.find(p => p.id === personnelId);
    if (!person) { playError(); return; }
    if ((state.cocomPersonnel[personnelId] || 0) >= 10) { playError(); showAlert('Maksymalnie 10 takich kurierów.', 'LIMIT KADR', 'error'); return; }
    if (state.pln < person.costPln || (state.swissBalanceUsd || 0) < person.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - person.costPln,
      swissBalanceUsd: s.swissBalanceUsd - person.costUsd,
      cocomPersonnel: { ...s.cocomPersonnel, [personnelId]: (s.cocomPersonnel[personnelId] || 0) + 1 }
    }));
    playSuccess();
    addToast("KADRY COCOM", `Zatrudniono: ${person.name}`);
  };

  const startCocomSmugglingRun = (routeId: string, vehicleId: string, personnelId: string, itemIds: string[]) => {
    const route = COCOM_SMUGGLING_ROUTES.find(r => r.id === routeId);
    const vehicle = COCOM_VEHICLES.find(v => v.id === vehicleId);
    const person = COCOM_PERSONNEL.find(p => p.id === personnelId);
    
    if (!route || !vehicle || !person || itemIds.length === 0) { playError(); return; }
    if (itemIds.length > vehicle.capacity) { playError(); showAlert('Pojazd ma za małą pojemność na te towary.', 'ZBYT DUŻY ŁADUNEK', 'error'); return; }

    // Check availability (count vs active runs)
    const activeVehicles = (state.activeCocomSmugglingRuns || []).filter(r => r.vehicleId === vehicleId).length;
    if ((state.cocomVehicles[vehicleId] || 0) <= activeVehicles) { playError(); showAlert('Brak wolnych pojazdów tego typu.', 'GARAŻ PUSTY', 'error'); return; }
    
    const activePersonnel = (state.activeCocomSmugglingRuns || []).filter(r => r.personnelId === personnelId).length;
    if ((state.cocomPersonnel[personnelId] || 0) <= activePersonnel) { playError(); showAlert('Brak wolnych kurierów tego typu.', 'BRAK KADR', 'error'); return; }

    // Inventory check
    const itemsCount: Record<string, number> = {};
    for (const id of itemIds) { itemsCount[id] = (itemsCount[id] || 0) + 1; }
    for (const [id, count] of Object.entries(itemsCount)) {
      if ((state.cocomInventory[id] || 0) < count) { playError(); showAlert('Brak wystarczającej ilości towaru w magazynie.', 'BRAK TOWARU', 'error'); return; }
    }

    // Calculate time and potential payout
    let totalTime = route.baseTravelTimeSec;
    totalTime *= vehicle.speedMult;
    totalTime *= (1.0 + person.speedBonus);
    if (totalTime < 5) totalTime = 5;

    let payout = 0;
    itemIds.forEach(id => {
      const it = COCOM_ITEMS.find(c => c.id === id);
      if (it) payout += it.sellPricePln * route.payoutMultiplier;
    });

    const run = {
      id: Date.now().toString(),
      routeId,
      vehicleId,
      personnelId,
      itemIds,
      timeLeft: totalTime,
      riskPercent: Math.max(2, route.baseRiskPercent - vehicle.stealthBonus - person.stealthBonus),
      potentialPayoutPln: Math.floor(payout)
    };

    updateState(s => {
      const nextInv = { ...s.cocomInventory };
      itemIds.forEach(id => { nextInv[id] -= 1; });
      return {
        ...s,
        cocomInventory: nextInv,
        activeCocomSmugglingRuns: [...(s.activeCocomSmugglingRuns || []), run]
      };
    });

    playClick();
    addToast("SZLAK PRZEMYTNICZY", `Wyruszono na trasę: ${route.name}`);
  };

  const autoStartRun = (routeId: string) => {
    const activeVehiclesCount = (state.activeCocomSmugglingRuns || []).reduce((acc, r) => { acc[r.vehicleId] = (acc[r.vehicleId] || 0) + 1; return acc; }, {} as Record<string, number>);
    const availableVehicle = COCOM_VEHICLES.find(v => (state.cocomVehicles[v.id] || 0) > (activeVehiclesCount[v.id] || 0));
    
    if (!availableVehicle) { playError(); showAlert('Brak wolnych pojazdów.', 'GARAŻ PUSTY', 'error'); return; }

    const activePersonnelCount = (state.activeCocomSmugglingRuns || []).reduce((acc, r) => { acc[r.personnelId] = (acc[r.personnelId] || 0) + 1; return acc; }, {} as Record<string, number>);
    const availablePersonnel = COCOM_PERSONNEL.find(p => (state.cocomPersonnel[p.id] || 0) > (activePersonnelCount[p.id] || 0));
    
    if (!availablePersonnel) { playError(); showAlert('Brak wolnych kurierów.', 'BRAK KADR', 'error'); return; }

    const availableItems = [];
    for (const [id, count] of Object.entries(state.cocomInventory)) {
      for (let i = 0; i < count; i++) { availableItems.push(id); }
    }
    
    availableItems.sort((a, b) => {
       const pA = COCOM_ITEMS.find(i => i.id === a)?.sellPricePln || 0;
       const pB = COCOM_ITEMS.find(i => i.id === b)?.sellPricePln || 0;
       return pB - pA;
    });

    if (availableItems.length === 0) { playError(); showAlert('Brak towaru w magazynie.', 'BRAK TOWARU', 'error'); return; }

    const itemsToTake = availableItems.slice(0, availableVehicle.capacity);
    startCocomSmugglingRun(routeId, availableVehicle.id, availablePersonnel.id, itemsToTake);
  };

  const unlockExportContact = (contactId: string) => {
    const contact = EXPORT_CONTACTS.find(c => c.id === contactId);
    if (!contact) { playError(); return; }
    if (state.unlockedContacts[contactId]) { playError(); return; }
    if ((state.swissBalanceUsd || 0) < contact.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      swissBalanceUsd: s.swissBalanceUsd - contact.costUsd,
      unlockedContacts: { ...s.unlockedContacts, [contactId]: true }
    }));
    playSuccess();
    showAlert(`Odblokowano kontrahenta: ${contact.name} (${contact.country}). Premia cenowa: +${Math.round(contact.priceBonus * 100)}%.`, '🤝 NOWY KONTRAHENT', 'success');
  };

  const buySyndicateUpgrade = (upgradeId: string) => {
    const upgrade = SYNDICATE_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) { playError(); return; }
    if (state.syndicateUpgrades[upgradeId]) { playError(); return; }
    if ((state.swissBalanceUsd || 0) < upgrade.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      swissBalanceUsd: s.swissBalanceUsd - upgrade.costUsd,
      syndicateUpgrades: { ...s.syndicateUpgrades, [upgradeId]: true }
    }));
    playSuccess();
    showAlert(`Ulepszono syndykat: ${upgrade.name}. ${upgrade.effect}`, '🔧 ULEPSZENIE SYNDYKATU', 'success');
  };

  const launderCocomProceeds = (amount: number, target: 'pln' | 'usd' = 'pln') => {
    if (amount <= 0 || (state.cocomProceedsPln || 0) < amount) { playError(); return; }
    const maxAmount = state.syndicateUpgrades['embassy_cover'] ? 5000000 : 1000000;
    const clampedAmount = Math.min(amount, maxAmount);
    
    if (target === 'pln') {
      const commissionRate = state.syndicateUpgrades['fake_docs'] ? 0.10 : 0.15;
      const netAmount = Math.floor(clampedAmount * (1 - commissionRate));

      updateState(s => ({
        ...s,
        cocomProceedsPln: (s.cocomProceedsPln || 0) - clampedAmount,
        pln: s.pln + netAmount,
        sbSuspicion: Math.max(0, (s.sbSuspicion || 0) - 10),
        stats: { ...s.stats, totalOffshoreTransfersPln: (s.stats.totalOffshoreTransfersPln || 0) + clampedAmount }
      }));
      playSuccess();
      addToast("PRANIE ZYSKÓW", `Wyprany kapitał: ${netAmount.toLocaleString()} zł (prowizja ${Math.round(commissionRate * 100)}%)`);
    } else {
      const commissionRate = state.syndicateUpgrades['fake_docs'] ? 0.40 : 0.50; // Bardzo wysoka prowizja za USD
      const netAmountPln = Math.floor(clampedAmount * (1 - commissionRate));
      const baseRate = 1200;
      const currentMarketRate = Math.floor(baseRate * (1 + (state.inflationPercent / 100)) * 1.5);
      const usdEarned = Math.floor(netAmountPln / currentMarketRate);
      
      updateState(s => ({
        ...s,
        cocomProceedsPln: (s.cocomProceedsPln || 0) - clampedAmount,
        swissBalanceUsd: (s.swissBalanceUsd || 0) + usdEarned,
        interpolSuspicion: Math.min(100, (s.interpolSuspicion || 0) + 5), // Pranie na USD zwraca uwagę Interpolu
        stats: { ...s.stats, totalOffshoreTransfersPln: (s.stats.totalOffshoreTransfersPln || 0) + clampedAmount }
      }));
      playSuccess();
      addToast("ZAGRANICZNE KONTA", `Wyprano kapitał na kwotę $${usdEarned.toLocaleString()} (ogromna prowizja operacyjna)`);
    }
  };

  // ===== Faza N: Wojny Gangów i Szara Strefa - Funkcje Transakcyjne =====

  const unlockFazaN = () => {
    if (state.fazaNUnlocked) { playError(); return; }
    const cost = state.isDenominated ? 10000 : 100000000;
    if (state.pln < cost) { playError(); return; }
    
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      fazaNUnlocked: true,
      gangRespect: 10
    }));
    playSuccess();
    showAlert('Witaj w Mieście', 'Zapłaciłeś "wkupne" starym rezydentom. Masz zielone światło na budowę własnej grupy zorganizowanej.', 'success');
  };

  const buyGangUnit = (unitId: string, qty: number = 1) => {
    const unit = GANGSTER_UNITS.find(u => u.id === unitId);
    if (!unit) return;
    const cost = Math.floor(unit.costPln * (state.isDenominated ? 1 : state.plzInflationMult)) * qty;
    if (state.pln < cost) { playError(); return; }
    
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      gangUnits: { ...s.gangUnits, [unitId]: (s.gangUnits[unitId] || 0) + qty },
      gangRespect: s.gangRespect + (1 * qty)
    }));
    playSuccess();
  };

  const buyBlackMarketWeapon = (weaponId: string, qty: number = 1) => {
    const weapon = BLACK_MARKET_WEAPONS.find(w => w.id === weaponId);
    if (!weapon) return;
    const costPln = Math.floor(weapon.costPln * (state.isDenominated ? 1 : state.plzInflationMult)) * qty;
    const costUsd = weapon.costUsd * qty;
    
    if (state.pln < costPln || state.dollars < costUsd) { playError(); return; }
    
    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      dollars: s.dollars - costUsd,
      gangWeapons: { ...s.gangWeapons, [weaponId]: (s.gangWeapons[weaponId] || 0) + qty },
      gangRespect: s.gangRespect + (5 * qty)
    }));
    playSuccess();
  };

  // ===== Faza M: Dziki Kapitalizm - Funkcje Transakcyjne =====
  
  const unlockFazaM = () => {
    if (state.fazaMUnlocked) { playError(); return; }
    if (state.pln < 10000000) { playError(); return; }
    updateState(s => ({
      ...s,
      pln: s.pln - 10000000,
      fazaMUnlocked: true
    }));
    playSuccess();
    showAlert('Obalono dawną komunę gospodarczą! Ustawa Wilczka weszła w życie: "Co nie jest zabronione, jest dozwolone". Możesz teraz handlować z łóżka polowego i brać udział w prywatyzacji!', '📜 USTAWA WILCZKA', 'success');
  };

  const buyBazarItem = (itemId: string, amount: number) => {
    const item = BAZAR_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    const cost = Math.floor(item.buyPricePln * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    const totalCost = cost * amount;
    
    if (state.pln < totalCost) { playError(); return; }
    
    updateState(s => ({
      ...s,
      pln: s.pln - totalCost,
      bazarInventory: {
        ...s.bazarInventory,
        [itemId]: (s.bazarInventory[itemId] || 0) + amount
      }
    }));
    playClick();
  };

  const sellBazarItem = (itemId: string, amount: number) => {
    const qty = state.bazarInventory[itemId] || 0;
    if (qty < amount) { playError(); return; }
    const item = BAZAR_ITEMS.find(i => i.id === itemId);
    if (!item) return;
    
    const currentSat = state.bazarMarketSaturation[itemId] || 0;
    const priceMult = Math.max(0.2, 1 - (currentSat / 150));
    const baseSellPrice = Math.floor(item.sellPricePln * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    const sellPrice = Math.floor(baseSellPrice * priceMult);
    const revenue = sellPrice * amount;

    updateState(s => ({
      ...s,
      pln: s.pln + revenue,
      bazarInventory: {
        ...s.bazarInventory,
        [itemId]: qty - amount
      },
      bazarMarketSaturation: {
        ...s.bazarMarketSaturation,
        [itemId]: Math.min(100, (s.bazarMarketSaturation[itemId] || 0) + amount * 1.5)
      },
      stats: { ...s.stats, totalPlnEarned: (s.stats.totalPlnEarned || 0) + revenue }
    }));
    playClick();
  };

  const dispatchBazarTransport = (routeId: string) => {
    const route = BAZAR_LOGISTICS_ROUTES.find(r => r.id === routeId);
    if (!route) return;
    const costPln = Math.floor(route.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
    const costUsd = route.costUsd;
    if (state.pln < costPln || state.dollars < costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      dollars: s.dollars - costUsd,
      activeBazarTransports: [
        ...(s.activeBazarTransports || []),
        { id: Math.random().toString(), routeId, timeLeft: route.durationSec }
      ]
    }));
    playSuccess();
    addToast('LOGISTYKA', `Wysłano transport na szlaku: ${route.name}. Czas podróży: ${route.durationSec}s.`);
  };

  const upgradeBazarWarehouse = (upgradeId: string) => {
    const upgrade = WAREHOUSE_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;
    const costPln = Math.floor(upgrade.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      bazarWarehouseUpgradeId: upgrade.id,
      bazarWarehouseCapacity: upgrade.capacity
    }));
    playSuccess();
    showAlert(`Zakupiono ulepszenie magazynu: ${upgrade.name}. Pojemność wynosi teraz ${upgrade.capacity} sztuk.`, '📦 ULEPSZENIE MAGAZYNU', 'success');
  };

  const bribeBazarCustoms = () => {
    if ((state.activeBazarTransports || []).length === 0) { playError(); return; }
    const costPln = Math.floor(2000000 * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      activeBazarTransports: (s.activeBazarTransports || []).map(t => ({
        ...t,
        timeLeft: Math.max(1, t.timeLeft - 15)
      }))
    }));
    playSuccess();
    addToast('CŁO', 'Opłacono łapówkę celnikom na granicy! Wszystkie transporty przyspieszyły o 15 sekund.');
  };

  const buyMediaStation = (stationId: string) => {
    const station = MEDIA_STATIONS.find(s => s.id === stationId);
    if (!station) return;
    const discount = state.mediaKrritBribeDiscount || 1.0;
    const costPln = Math.floor(station.costPln * discount * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln || state.mediaStations[stationId]) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      mediaStations: { ...s.mediaStations, [stationId]: true },
      mediaTrust: { ...s.mediaTrust, [stationId]: 100 },
      activeMediaPrograms: {
        ...s.activeMediaPrograms,
        [stationId]: s.activeMediaPrograms[stationId] || { rano: null, poludnie: null, wieczor: null }
      }
    }));
    playSuccess();
    showAlert(`Otrzymano oficjalną koncesję KRRiT na nadawanie: ${station.name}!`, '📡 NOWA STACJA', 'success');
  };

  const bribeKrrit = () => {
    const costPln = Math.floor(5000000 * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln || (state.mediaKrritBribeDiscount || 1.0) <= 0.6) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      mediaKrritBribeDiscount: Math.max(0.6, (s.mediaKrritBribeDiscount || 1.0) - 0.1)
    }));
    playSuccess();
    addToast('KRRiT', 'Wręczono "kopertę" członkom KRRiT. Koszt koncesji dla kolejnych stacji spada o 10%!');
  };

  const buyProgramLicense = (programId: string) => {
    const prog = MEDIA_PROGRAMS.find(p => p.id === programId);
    if (!prog || state.mediaPrograms[programId]) return;
    const costPln = Math.floor(prog.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      mediaPrograms: { ...s.mediaPrograms, [programId]: true }
    }));
    playSuccess();
    addToast('LICENCJA', `Zakupiono licencję na program: ${prog.name}.`);
  };

  const setMediaSlot = (stationId: string, slotId: string, programId: string | null) => {
    if (programId && !state.mediaPrograms[programId]) return;
    updateState(s => {
      const stationSlots = s.activeMediaPrograms[stationId] || { rano: null, poludnie: null, wieczor: null };
      return {
        ...s,
        activeMediaPrograms: {
          ...s.activeMediaPrograms,
          [stationId]: {
            ...stationSlots,
            [slotId]: programId
          }
        }
      };
    });
    playClick();
  };

  const buyMediaAntenna = (antennaId: string) => {
    const antenna = MEDIA_ANTENNA_REGIONS.find(a => a.id === antennaId);
    if (!antenna || state.mediaAntennas[antennaId]) return;
    const costPln = Math.floor(antenna.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costPln,
      mediaAntennas: { ...s.mediaAntennas, [antennaId]: 1 }
    }));
    playSuccess();
    showAlert(`Wybudowano maszt nadawczy: ${antenna.name}. Zasięg stacji wzrósł o +${(antenna.coverageMultiplier * 100).toFixed(0)}%!`, '📡 MASZT NADAWCZY', 'success');
  };

  const claimMediaSponsorshipContract = (stationId: string) => {
    const currentTrust = state.mediaTrust[stationId] || 0;
    if (currentTrust < 75) { playError(); return; }
    
    const payout = Math.floor(10000000 * (state.isDenominated ? 1 : state.plzInflationMult));
    
    updateState(s => ({
      ...s,
      pln: s.pln + payout,
      mediaTrust: {
        ...s.mediaTrust,
        [stationId]: Math.max(0, currentTrust - 15)
      }
    }));
    playSuccess();
    showAlert(`Podpisano kontrakt sponsorski z marką Pollena 2000! Otrzymano ${payout.toLocaleString()} zł. Widzowie są lekko zirytowani komercjalizacją (Zaufanie -15).`, '🧴 KONTRAKT SPONSORSKI', 'success');
  };

  const broadcastPoliticalSpot = (stationId: string, alignment: 'government' | 'solidarity') => {
    const currentTrust = state.mediaTrust[stationId] || 0;
    if (currentTrust < 50) { playError(); return; }

    updateState(s => {
      const nextTrust = Math.max(0, currentTrust - 15);
      if (alignment === 'government') {
        return {
          ...s,
          suspicion: Math.max(0, s.suspicion - 25),
          mediaTrust: { ...s.mediaTrust, [stationId]: nextTrust }
        };
      } else {
        return {
          ...s,
          solidarnos: (s.solidarnos || 0) + 300,
          suspicion: s.suspicion + 15,
          mediaTrust: { ...s.mediaTrust, [stationId]: nextTrust }
        };
      }
    });
    playSuccess();
    if (alignment === 'government') {
      addToast('PROPAGANDA', 'Wyemitowano orędzie rządowe. Podejrzliwość władz spadła o 25 pkt.');
    } else {
      addToast('WOLNE SŁOWO', 'Wyemitowano audycję Solidarności. Poparcie związku wzrosło o +300.');
    }
  };

  const runTabloidInvestigation = (stationId: string) => {
    const costPln = Math.floor(1000000 * (state.isDenominated ? 1 : state.plzInflationMult));
    if (state.pln < costPln) { playError(); return; }

    const success = Math.random() > 0.25;
    if (success) {
      const profit = Math.floor(8000000 * (state.isDenominated ? 1 : state.plzInflationMult));
      updateState(s => ({
        ...s,
        pln: s.pln - costPln + profit,
        mediaTrust: {
          ...s.mediaTrust,
          [stationId]: Math.max(0, (s.mediaTrust[stationId] || 100) - 10)
        }
      }));
      playSuccess();
      showAlert(`Afera na pierwszej stronie! Ujawniono romanse elit giełdowych. Sprzedaż poszybowała w górę! Zarobiono netto: ${(profit - costPln).toLocaleString()} zł (Zaufanie -10).`, '📸 PAPARAZZI', 'success');
    } else {
      const penalty = Math.floor(12000000 * (state.isDenominated ? 1 : state.plzInflationMult));
      updateState(s => ({
        ...s,
        pln: Math.max(0, s.pln - costPln - penalty),
        mediaTrust: {
          ...s.mediaTrust,
          [stationId]: Math.max(0, (s.mediaTrust[stationId] || 100) - 25)
        }
      }));
      playAlert();
      showAlert(`Przegrany proces sądowy o naruszenie dóbr osobistych! Musisz opłacić odszkodowanie w wysokości ${penalty.toLocaleString()} zł (Zaufanie -25).`, '⚖️ POZEW SĄDOWY', 'raid');
    }
  };

  const buyNfiCompany = (compId: string) => {
    if (state.nfiCompanies[compId]) { playError(); return; }
    const comp = NFI_COMPANIES.find(c => c.id === compId);
    if (!comp) return;
    if ((state.nfiVouchers || 0) < comp.vouchersRequired) { playError(); return; }

    updateState(s => ({
      ...s,
      nfiVouchers: (s.nfiVouchers || 0) - comp.vouchersRequired,
      nfiCompanies: { ...s.nfiCompanies, [compId]: true }
    }));
    playSuccess();
    showAlert(`Sukces wrogiego przejęcia! Pakiet kontrolny przedsiębiorstwa ${comp.name} należy do Ciebie. Fabryka zaczyna generować zyski.`, '🏭 PRYWATYZACJA', 'success');
  };

  const fireNfiEmployees = (compId: string, amount: number) => {
    if (!state.nfiCompanies[compId]) { playError(); return; }
    const status = state.nfiCompanyStatus[compId];
    if (!status) return;
    if (status.employment <= amount) { playError(); return; }
    if (status.strikeActive) { playError(); return; }

    updateState(s => {
      const current = s.nfiCompanyStatus[compId];
      const newEmp = Math.max(10, current.employment - amount);
      const layoffRatio = amount / current.employment;
      const newMorale = Math.max(0, current.morale - Math.floor(layoffRatio * 60));
      const newUnion = Math.min(100, current.unionStrength + Math.floor(layoffRatio * 20));

      return {
        ...s,
        nfiCompanyStatus: {
          ...s.nfiCompanyStatus,
          [compId]: {
            ...current,
            employment: newEmp,
            morale: newMorale,
            unionStrength: newUnion
          }
        }
      };
    });
    playClick();
    addToast('RESTRUKTURYZACJA', `Zwolniono ${amount.toLocaleString()} pracowników. Koszty żołdu spadły, morale osłabło.`);
  };

  const hireNfiEmployees = (compId: string, amount: number) => {
    if (!state.nfiCompanies[compId]) { playError(); return; }
    const status = state.nfiCompanyStatus[compId];
    if (!status) return;
    const comp = NFI_COMPANIES.find(c => c.id === compId);
    if (!comp) return;
    if (status.strikeActive) { playError(); return; }

    updateState(s => {
      const current = s.nfiCompanyStatus[compId];
      const newEmp = Math.min(comp.baseEmployment * 1.5, current.employment + amount);
      const hireRatio = amount / comp.baseEmployment;
      const newMorale = Math.min(100, current.morale + Math.floor(hireRatio * 30));

      return {
        ...s,
        nfiCompanyStatus: {
          ...s.nfiCompanyStatus,
          [compId]: {
            ...current,
            employment: newEmp,
            morale: newMorale
          }
        }
      };
    });
    playClick();
    addToast('ZATRUDNIENIE', `Zatrudniono dodatkowe ${amount.toLocaleString()} osób. Wzrost potencjału produkcyjnego.`);
  };

  const modernizeNfiInfrastructure = (compId: string) => {
    if (!state.nfiCompanies[compId]) { playError(); return; }
    const status = state.nfiCompanyStatus[compId];
    if (!status) return;
    if (status.strikeActive) { playError(); return; }

    const costPln = Math.floor(10000000 * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => {
      const current = s.nfiCompanyStatus[compId];
      return {
        ...s,
        pln: s.pln - costPln,
        nfiCompanyStatus: {
          ...s.nfiCompanyStatus,
          [compId]: {
            ...current,
            infrastructure: Math.min(100, current.infrastructure + 20)
          }
        }
      };
    });
    playSuccess();
    addToast('MODERNIZACJA', 'Zakupiono nowe maszyny. Wydajność fabryki wzrosła.');
  };

  const negotiateNfiUnions = (compId: string) => {
    if (!state.nfiCompanies[compId]) { playError(); return; }
    const status = state.nfiCompanyStatus[compId];
    if (!status) return;

    const costPln = Math.floor(5000000 * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => {
      const current = s.nfiCompanyStatus[compId];
      return {
        ...s,
        pln: s.pln - costPln,
        nfiCompanyStatus: {
          ...s.nfiCompanyStatus,
          [compId]: {
            ...current,
            morale: Math.min(100, current.morale + 30),
            unionStrength: Math.min(100, current.unionStrength + 10),
            strikeActive: false
          }
        }
      };
    });
    playSuccess();
    addToast('NEGOCJACJE', 'Zaoferowano podwyżki i premie. Strajk zakończony, ale związki zyskały na sile.');
  };

  const pacifyNfiStrike = (compId: string) => {
    if (!state.nfiCompanies[compId]) { playError(); return; }
    const status = state.nfiCompanyStatus[compId];
    if (!status) return;
    if (!status.strikeActive) { playError(); return; }

    const costPln = Math.floor(3000000 * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    if (state.pln < costPln) { playError(); return; }

    updateState(s => {
      const current = s.nfiCompanyStatus[compId];
      return {
        ...s,
        pln: s.pln - costPln,
        nfiCompanyStatus: {
          ...s.nfiCompanyStatus,
          [compId]: {
            ...current,
            strikeActive: false,
            morale: Math.max(5, current.morale - 40),
            unionStrength: Math.max(10, current.unionStrength - 25)
          }
        }
      };
    });
    playAlert();
    showAlert('Strajk został brutalnie spacyfikowany przez opłaconą agencję ochrony! Związki zawodowe osłabły, ale morale załogi sięgnęło dna.', '🛡️ PACYFIKACJA', 'raid');
  };

  const hireMafiaProtection = (protId: string) => {
    const prot = MAFIA_PROTECTIONS.find(p => p.id === protId);
    if (!prot) return;
    const cost = Math.floor(prot.costPln * (state.isDenominated ? 1 : (state.plzInflationMult || 1)));
    if (state.pln < cost) { playError(); return; }
    
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      mafiaProtectionId: prot.id
    }));
    playSuccess();
    addToast('AGENCJA OCHRONY', `Podpisano kontrakt na usługi ochrony: ${prot.name}. Zmniejsza ryzyko haraczu Pruszkowa.`);
  };

  const denominatePln = () => {
    if (state.isDenominated) { playError(); return; }
    // Koszt stabilizacji: 10 Miliardów PLZ
    const cost = 10000000000;
    if (state.pln < cost) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: Math.floor((s.pln - cost) / 10000), // obcina 4 zera
      isDenominated: true,
      plzInflationMult: 1, 
      stats: { ...s.stats, maxPlnHeld: 0 } // Reset statystyki
    }));
    playSuccess();
    showAlert('Z dniem dzisiejszym wprowadzono nowe banknoty! Skreślamy zera (10 000 PLZ -> 1 PLN). Koniec galopującej hiperinflacji! Osiągnąłeś pełną dominację nad Dzikim Kapitalizmem.', '💸 DENOMINACJA ZŁOTEGO', 'success');
  };


  // ===== Faza S: Lata 2000. - Funkcje Transakcyjne =====

  const unlockFazaS = () => {
    if (state.fazaSUnlocked) { playError(); return; }
    const cost = 50000000;
    if (!state.isDenominated || state.pln < cost) { playError(); return; }
    
    updateState(s => ({ ...s, pln: s.pln - cost, fazaSUnlocked: true }));
    playSuccess();
    showAlert('Wkraczasz w lata 2000.! Polska zbliża się do Unii Europejskiej, rodzi się nowa klasa deweloperów, a inwestorzy szaleją na punkcie startupów dot-com.', '🌐 NOWA ERA: LATA 2000.', 'success');
  };

  const startEuProject = (projectId: string) => {
    const proj = EU_PROJECTS.find(p => p.id === projectId);
    if (!proj) return;
    
    const active = state.activeEuProjects.find(p => p.projectId === projectId);
    if (active) { playError(); return; }

    const costOwn = Math.floor(proj.costPln * (1 - proj.euGrantPercent));
    if (state.pln < costOwn) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - costOwn,
      activeEuProjects: [...s.activeEuProjects, { id: Math.random().toString(), projectId, timeLeft: proj.durationSec, funded: false }]
    }));
    playSuccess();
    addToast('WNIOSEK UNIJNY', `Rozpoczęto realizację projektu: ${proj.name}.`);
  };

  const buyDotcomUpgrade = (upgradeId: string) => {
    if (state.dotcomUpgrades[upgradeId]) { playError(); return; }
    const upg = DOTCOM_UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return;
    if (state.pln < upg.costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - upg.costPln,
      dotcomServerCapacity: s.dotcomServerCapacity + upg.userCapacityBonus,
      dotcomUpgrades: { ...s.dotcomUpgrades, [upgradeId]: true }
    }));
    playSuccess();
    addToast('PORTAL ROZBUDOWANY', `Kupiono: ${upg.name}`);
  };

  const takeChfMortgage = (amountChf: number) => {
    const plnReceived = Math.floor(amountChf * state.chfExchangeRate * 0.95);
    updateState(s => ({
      ...s,
      chfDebt: s.chfDebt + amountChf,
      pln: s.pln + plnReceived
    }));
    playSuccess();
    showAlert(`Otrzymałeś kredyt we frankach szwajcarskich! Do spłaty: ${amountChf.toLocaleString()} CHF. Otrzymano po potrąceniu prowizji: ${plnReceived.toLocaleString()} PLN.`, '🏦 KREDYT CHF UZYSKANY', 'success');
  };

  const buyRealEstate = (projectId: string, useChf: boolean) => {
    const proj = REAL_ESTATE_PROJECTS.find(p => p.id === projectId);
    if (!proj) return;
    
    if (useChf) {
      if (state.chfDebt > 0 && state.pln < 1000000) { playError(); return; }
      const neededChf = Math.ceil(proj.costPln / state.chfExchangeRate);
      updateState(s => ({
        ...s,
        chfDebt: s.chfDebt + neededChf,
        realEstateOwned: { ...s.realEstateOwned, [projectId]: (s.realEstateOwned[projectId] || 0) + 1 }
      }));
      playSuccess();
      addToast('DEWELOPERKA', `Sfinansowano "${proj.name}" kredytem CHF.`);
    } else {
      if (state.pln < proj.costPln) { playError(); return; }
      updateState(s => ({
        ...s,
        pln: s.pln - proj.costPln,
        realEstateOwned: { ...s.realEstateOwned, [projectId]: (s.realEstateOwned[projectId] || 0) + 1 }
      }));
      playSuccess();
      addToast('DEWELOPERKA', `Zakupiono "${proj.name}" za gotówkę.`);
    }
  };

  const sellRealEstate = (projectId: string) => {
    const qty = state.realEstateOwned[projectId] || 0;
    if (qty <= 0) { playError(); return; }
    const proj = REAL_ESTATE_PROJECTS.find(p => p.id === projectId);
    if (!proj) return;

    updateState(s => ({
      ...s,
      pln: s.pln + proj.sellRevenuePln,
      realEstateOwned: { ...s.realEstateOwned, [projectId]: s.realEstateOwned[projectId] - 1 }
    }));
    playSuccess();
    addToast('SPRZEDAŻ NIERUCHOMOŚCI', `Sprzedano: ${proj.name} za ${proj.sellRevenuePln.toLocaleString()} PLN.`);
  };

  const sendWorkerToZmywak = (count: number) => {
    const costPerWorker = 2000;
    const totalCost = costPerWorker * count;
    if (state.pln < totalCost) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - totalCost,
      zmywakWorkers: s.zmywakWorkers + count
    }));
    playSuccess();
    addToast('AGENCJA PRACY', `Wysłano ${count} osób na zmywak do UK.`);
  };

  const bribeEuAuditor = () => {
    const bribeCost = 500000;
    if (state.pln < bribeCost || state.euAuditRisk <= 0) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - bribeCost,
      euAuditRisk: Math.max(0, s.euAuditRisk - 30)
    }));
    playAlert();
    addToast('KOPERTA DLA AUDYTORA', 'Ryzyko kontroli z OLAF spadło o 30%.');
  };

  // ===== Faza T: Wielka Recesja 2008 - Funkcje Transakcyjne =====

  const buyCurrencyOption = (presetId: string) => {
    const preset = CURRENCY_OPTION_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    if (state.pln < preset.premiumPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - preset.premiumPln,
      currencyOptions: [
        ...s.currencyOptions,
        {
          id: Math.random().toString(),
          type: preset.type,
          strikeRate: preset.strikeRate,
          amountChf: preset.amountChf,
          durationSec: preset.durationSec,
          timeLeft: preset.durationSec,
          premiumPln: preset.premiumPln
        }
      ]
    }));
    playSuccess();
    addToast('KONTRAKT SPEKULACYJNY', `Nabyto opcję ${preset.type.toUpperCase()} na sumę ${preset.amountChf.toLocaleString()} CHF.`);
  };

  const buyCrisisRealEstate = (projectId: string) => {
    if (!state.recessionActive) { playError(); return; }
    const proj = CRISIS_REAL_ESTATE.find(p => p.id === projectId);
    if (!proj) return;

    if (state.pln < proj.buyCostPln) { playError(); return; }

    updateState(s => {
      const unfinishedKey = `${projectId}_unfinished`;
      const currentCount = s.crisisRealEstateOwned[unfinishedKey] || 0;
      return {
        ...s,
        pln: s.pln - proj.buyCostPln,
        crisisRealEstateOwned: {
          ...s.crisisRealEstateOwned,
          [unfinishedKey]: currentCount + 1
        }
      };
    });
    playSuccess();
    addToast('MAJĄTEK SYNDYKA', `Odkupiono ${proj.name} od syndyka.`);
  };

  const finishCrisisRealEstate = (projectId: string) => {
    const unfinishedKey = `${projectId}_unfinished`;
    const finishedKey = `${projectId}_finished`;
    const unfinishedCount = state.crisisRealEstateOwned[unfinishedKey] || 0;
    if (unfinishedCount <= 0) { playError(); return; }

    const proj = CRISIS_REAL_ESTATE.find(p => p.id === projectId);
    if (!proj) return;

    if (state.pln < proj.finishCostPln) { playError(); return; }

    updateState(s => {
      const currentUnfinished = s.crisisRealEstateOwned[unfinishedKey] || 0;
      const currentFinished = s.crisisRealEstateOwned[finishedKey] || 0;
      return {
        ...s,
        pln: s.pln - proj.finishCostPln,
        crisisRealEstateOwned: {
          ...s.crisisRealEstateOwned,
          [unfinishedKey]: Math.max(0, currentUnfinished - 1),
          [finishedKey]: currentFinished + 1
        }
      };
    });
    playSuccess();
    addToast('BUDOWA UKOŃCZONA', `Wykończono inwestycję: ${proj.name}.`);
  };

  const sellCrisisRealEstate = (projectId: string) => {
    if (state.recessionActive) {
      playError();
      showAlert('Nie możesz sprzedać nieruchomości w trakcie recesji! Ceny są zbyt niskie, a rynek zamrożony. Poczekaj na koniec kryzysu.', 'RYNEK ZAMROŻONY', 'error');
      return;
    }

    const finishedKey = `${projectId}_finished`;
    const finishedCount = state.crisisRealEstateOwned[finishedKey] || 0;
    if (finishedCount <= 0) { playError(); return; }

    const proj = CRISIS_REAL_ESTATE.find(p => p.id === projectId);
    if (!proj) return;

    updateState(s => {
      const currentFinished = s.crisisRealEstateOwned[finishedKey] || 0;
      return {
        ...s,
        pln: s.pln + proj.sellRevenuePln,
        crisisRealEstateOwned: {
          ...s.crisisRealEstateOwned,
          [finishedKey]: Math.max(0, currentFinished - 1)
        }
      };
    });
    playSuccess();
    addToast('KAPITAŁ ODZYSKANY', `Sprzedano inwestycję: ${proj.name} za ${proj.sellRevenuePln.toLocaleString()} PLN!`);
  };

  const hireBankAdvisor = () => {
    const advisorCost = 200000;
    if (state.pln < advisorCost) { playError(); return; }
    if ((state.bankAdvisors || 0) >= 3) {
      playError();
      showAlert('Zatrudniłeś już maksymalną liczbę doradców finansowych (3).', 'LIMIT DORADCÓW', 'error');
      return;
    }

    updateState(s => ({
      ...s,
      pln: s.pln - advisorCost,
      bankAdvisors: (s.bankAdvisors || 0) + 1
    }));
    playSuccess();
    addToast('DORADCA ZATRUDNIONY', 'Zatrudniono doradcę finansowego ds. restrukturyzacji kredytów CHF.');
  };

  const restructureChfDebt = () => {
    const restructureAmountChf = 500000;
    if (state.chfDebt < restructureAmountChf) { playError(); return; }

    // Koszt spłaty 500k CHF po kursie spot + penalty rate 15%
    const penaltyRate = state.chfExchangeRate * 1.15;
    const plnCost = Math.floor(restructureAmountChf * penaltyRate);

    if (state.pln < plnCost) {
      playError();
      showAlert(`Brak gotówki! Restrukturyzacja 500 000 CHF wymaga spłaty po karnym kursie stabilizującym ${penaltyRate.toFixed(2)} PLN/CHF. Wymagane: ${plnCost.toLocaleString()} PLN.`, 'BRAK ŚRODKÓW', 'error');
      return;
    }

    updateState(s => ({
      ...s,
      pln: s.pln - plnCost,
      chfDebt: Math.max(0, s.chfDebt - restructureAmountChf)
    }));
    playSuccess();
    showAlert(`Pomyślnie spłacono i zamknięto 500 000 CHF długu walutowego za kwotę ${plnCost.toLocaleString()} PLN. Ograniczyłeś ryzyko kursowe!`, '🏦 RESTRUKTURYZACJA CHF', 'success');
  };

  const devUnlockEverything = () => {
    if (state.devStateBackup) {
      // Zablokuj grę: przywróć backup
      updateState(s => {
        const backup = s.devStateBackup;
        if (!backup) return s;
        return {
          ...backup,
          devStateBackup: null
        };
      });
      playSuccess();
      addToast("DEV CHEAT", "Zablokowano grę i przywrócono stan sprzed odblokowania!");
      setSettingsOpen(false);
    } else {
      // Odblokuj grę: stwórz backup i daj zasoby
      updateState(s => {
        const backup = { ...s };
        backup.devStateBackup = null; // unikaj zapętlenia
        return {
          ...s,
          pln: 150000000,
          dollars: 500000,
          solidarnos: 10000,
          electionsUnlocked: true,
          electionsPhase: 'completed',
          isDenominated: true,
          fazaNUnlocked: true,
          fazaSUnlocked: true,
          mediaUnlocked: true,
          gpwUnlocked: true,
          pewexItems: { ...s.pewexItems, casio: true },
          chfDebt: 2500000,
          chfExchangeRate: 3.50,
          zmywakWorkers: 150,
          dotcomUsers: 800,
          dotcomServerCapacity: 10000,
          realEstateOwned: { ...s.realEstateOwned, mikro_wola: 1 },
          devStateBackup: backup
        };
      });
      playSuccess();
      addToast("DEV CHEAT", "Odblokowano wszystkie fazy gry, kalkulator Casio, gotówkę i kredyt CHF!");
      setSettingsOpen(false);
    }
  };

  const devClearDebt = () => {
    updateState(s => ({
      ...s,
      chfDebt: 0
    }));
    playSuccess();
    addToast("DEV CHEAT", "Wyczyszczono dług we frankach szwajcarskich!");
    setSettingsOpen(false);
  };

  const hardReset = () => {
    playAlert();
    const finalConfirm = window.prompt("🚨 OSTRZEŻENIE OSTATECZNE! 🚨\n\nTa operacja całkowicie wyczyści Twój zapis gry, cofając wszystkie postępy, pieniądze i odblokowane ery.\n\nAby potwierdzić, wpisz drukowanymi literami słowo:\n\nRESETUJ");
    if (finalConfirm === "RESETUJ") {
      localStorage.removeItem('kombinator-save');
      window.location.reload();
    } else {
      addToast("RESET ODWOŁANY", "Nie wpisałeś poprawnego hasła potwierdzającego.");
    }
  };


  // ===== Faza K: Wybory 4 Czerwca - Funkcje Transakcyjne =====

  const unlockElections = () => {
    if (state.electionsUnlocked) { playError(); return; }
    const cost = 5000000;
    if (state.solidarnos >= 10000) {
      // Free unlock via Solidarity
    } else if (state.pln < cost) {
      playError(); return;
    } else {
      updateState(s => ({ ...s, pln: s.pln - cost }));
    }
    updateState(s => ({
      ...s,
      electionsUnlocked: true,
      electionsPhase: 'campaign' as const,
      regimePropaganda: 80
    }));
    playSuccess();
    showAlert('Kampania Wyborcza KO „Solidarność" została uruchomiona! Otwieraj komitety, drukuj materiały i zdobywaj głosy przed 4 czerwca!', '🗳️ KAMPANIA WYBORCZA', 'success');
  };

  const transferToCampaign = (amount: number, currency: 'pln' | 'usd') => {
    if (amount <= 0) { playError(); return; }
    if (currency === 'pln') {
      if (state.pln < amount) { playError(); return; }
      updateState(s => ({ ...s, pln: s.pln - amount, electionFundsPln: s.electionFundsPln + amount }));
    } else {
      if ((state.swissBalanceUsd || 0) < amount) { playError(); return; }
      const bonusRate = 1.25; // 25% bonus from Polonia support
      updateState(s => ({
        ...s,
        swissBalanceUsd: s.swissBalanceUsd - amount,
        electionFundsUsd: s.electionFundsUsd + Math.floor(amount * bonusRate)
      }));
    }
    playClick();
    addToast("TRANSFER NA KAMPANIĘ", `Przekazano ${amount.toLocaleString()} ${currency === 'pln' ? 'zł' : 'USD'} na fundusz wyborczy.`);
  };

  const buyPrintingSupplies = (type: 'paper' | 'ink', payWith: 'pln' | 'usd') => {
    const paperPricePln = 5000;
    const inkPricePln = 8000;
    const paperPriceUsd = 50;
    const inkPriceUsd = 80;

    if (type === 'paper') {
      if (payWith === 'pln') {
        if (state.electionFundsPln < paperPricePln) { playError(); return; }
        updateState(s => ({ ...s, electionFundsPln: s.electionFundsPln - paperPricePln, paperStocks: s.paperStocks + 10 }));
      } else {
        if (state.electionFundsUsd < paperPriceUsd) { playError(); return; }
        updateState(s => ({ ...s, electionFundsUsd: s.electionFundsUsd - paperPriceUsd, paperStocks: s.paperStocks + 15 }));
      }
    } else {
      if (payWith === 'pln') {
        if (state.electionFundsPln < inkPricePln) { playError(); return; }
        updateState(s => ({ ...s, electionFundsPln: s.electionFundsPln - inkPricePln, inkStocks: s.inkStocks + 5 }));
      } else {
        if (state.electionFundsUsd < inkPriceUsd) { playError(); return; }
        updateState(s => ({ ...s, electionFundsUsd: s.electionFundsUsd - inkPriceUsd, inkStocks: s.inkStocks + 8 }));
      }
    }
    playClick();
    addToast("ZAOPATRZENIE", `Zakupiono ${type === 'paper' ? 'papier (ryzy)' : 'tusz (litry)'}`);
  };

  const printCampaignMaterial = (materialId: string) => {
    const mat = CAMPAIGN_MATERIALS.find(m => m.id === materialId);
    if (!mat) { playError(); return; }
    if (state.electionFundsPln < mat.costPln) { playError(); return; }
    if (state.paperStocks < mat.paperCost) { playError(); showAlert('Brak papieru! Kup ryzy papieru w panelu logistyki.', 'BRAK SUROWCA', 'error'); return; }
    if (state.inkStocks < mat.inkCost) { playError(); showAlert('Brak tuszu! Kup tusz w panelu logistyki.', 'BRAK SUROWCA', 'error'); return; }

    const printMult = state.electionUpgrades['printing_press'] ? 2 : 1;

    // SB risk check
    if (Math.random() * 100 < mat.sbRiskPercent) {
      const guardMod = state.electionUpgrades['guard_squad'] ? 0.6 : 1.0;
      if (Math.random() < guardMod) {
        updateState(s => ({
          ...s,
          electionFundsPln: s.electionFundsPln - mat.costPln,
          paperStocks: s.paperStocks - mat.paperCost,
          inkStocks: s.inkStocks - mat.inkCost,
          suspicion: Math.min(100, (s.suspicion || 0) + 5)
        }));
        playError();
        showAlert(`SB nakryła drukarnię podczas druku „${mat.name}"! Materiały skonfiskowane.`, '🚨 WPADKA DRUKARNI', 'error');
        return;
      }
    }

    updateState(s => ({
      ...s,
      electionFundsPln: s.electionFundsPln - mat.costPln,
      paperStocks: s.paperStocks - mat.paperCost,
      inkStocks: s.inkStocks - mat.inkCost,
      campaignMaterials: { ...s.campaignMaterials, [materialId]: (s.campaignMaterials[materialId] || 0) + (1 * printMult) }
    }));
    playSuccess();
    addToast("DRUKARNIA KO", `Wydrukowano: ${mat.name} (x${printMult})`);
  };

  const openRegionalCommittee = (regionId: string) => {
    const region = ELECTION_REGIONS.find(r => r.id === regionId);
    if (!region) { playError(); return; }
    if (state.regionalCommittees[regionId]) { playError(); return; }
    if (state.electionFundsPln < region.committeeCostPln) { playError(); return; }

    updateState(s => ({
      ...s,
      electionFundsPln: s.electionFundsPln - region.committeeCostPln,
      regionalCommittees: { ...s.regionalCommittees, [regionId]: true },
      regionalVotes: { ...s.regionalVotes, [regionId]: s.regionalVotes[regionId] || 0 }
    }));
    playSuccess();
    showAlert(`Otwarto Komitet Obywatelski w regionie: ${region.name}. Głosy zaczną napływać automatycznie!`, '🏛️ KOMITET KO', 'success');
  };

  const launchRally = (regionId: string, leaderId: string) => {
    const leader = CAMPAIGN_LEADERS.find(l => l.id === leaderId);
    const region = ELECTION_REGIONS.find(r => r.id === regionId);
    if (!leader || !region) { playError(); return; }
    if (!state.regionalCommittees[regionId]) { playError(); showAlert('Najpierw otwórz Komitet Obywatelski w tym regionie!', 'BRAK KOMITETU', 'error'); return; }
    if ((state.leaderCooldowns[leaderId] || 0) > 0) { playError(); return; }
    if (state.electionFundsPln < leader.costPln) { playError(); return; }
    if (leader.costUsd > 0 && state.electionFundsUsd < leader.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      electionFundsPln: s.electionFundsPln - leader.costPln,
      electionFundsUsd: s.electionFundsUsd - leader.costUsd,
      activeRallies: [...(s.activeRallies || []), { regionId, leaderId, timeLeft: leader.durationSec }],
      leaderCooldowns: { ...s.leaderCooldowns, [leaderId]: leader.cooldownSec }
    }));
    playClick();
    addToast("WIEC WYBORCZY", `${leader.name} wyrusza na wiec do ${region.name}!`);
  };

  const buyElectionUpgrade = (upgradeId: string) => {
    const upgrade = ELECTION_UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) { playError(); return; }
    if (state.electionUpgrades[upgradeId]) { playError(); return; }
    if (upgrade.costPln > 0 && state.electionFundsPln < upgrade.costPln) { playError(); return; }
    if (upgrade.costUsd > 0 && state.electionFundsUsd < upgrade.costUsd) { playError(); return; }

    updateState(s => ({
      ...s,
      electionFundsPln: s.electionFundsPln - upgrade.costPln,
      electionFundsUsd: s.electionFundsUsd - upgrade.costUsd,
      electionUpgrades: { ...s.electionUpgrades, [upgradeId]: true },
      rweActive: upgradeId === 'rwe_antenna' ? true : s.rweActive
    }));
    playSuccess();
    showAlert(`Zakupiono: ${upgrade.name}. ${upgrade.effect}`, '🔧 INFRASTRUKTURA KO', 'success');
  };

  const interactDebate = (optionId: string) => {
    const option = DEBATE_OPTIONS.find(o => o.id === optionId);
    if (!option) { playError(); return; }
    if (state.debateRound >= 4) { playError(); return; }

    // Apply effects to all regions
    updateState(s => {
      const newVotes = { ...s.regionalVotes };
      ELECTION_REGIONS.forEach(region => {
        if (!s.regionalCommittees[region.id]) return;
        const boost = Math.floor(
          option.workerEffect * region.workerWeight +
          option.intellectualEffect * region.intellectualWeight +
          option.farmerEffect * region.farmerWeight
        );
        newVotes[region.id] = (newVotes[region.id] || 0) + boost;
      });

      const newRound = s.debateRound + 1;
      const newScore = s.debateScore + option.workerEffect + option.intellectualEffect + option.farmerEffect;
      
      return {
        ...s,
        regionalVotes: newVotes,
        debateRound: newRound,
        debateScore: newScore,
        debateCompleted: newRound >= 4,
        regimePropaganda: Math.max(0, s.regimePropaganda - option.propagandaReduction),
        suspicion: Math.min(100, (s.suspicion || 0) + option.sbRisk * 0.2)
      };
    });
    playSuccess();
    if (state.debateRound + 1 >= 4) {
      showAlert('Debata zakończona! Wałęsa pokonał Miodowicza w oczach milionów telewidzów! Poparcie rośnie we wszystkich regionach.', '📺 DEBATA WYGRANA!', 'success');
    } else {
      addToast("DEBATA TV", `Runda ${state.debateRound + 1} zakończona. Następna runda...`);
    }
  };

  const runElectionsFirstRound = () => {
    if (state.electionsPhase !== 'campaign') { playError(); return; }
    const totalVotes = Object.values(state.regionalVotes).reduce((a, b) => a + b, 0);
    if (totalVotes < 5000000) { playError(); showAlert(`Potrzebujesz minimum 5 000 000 głosów poparcia! Masz: ${totalVotes.toLocaleString()}.`, '⛔ ZA MAŁO GŁOSÓW', 'error'); return; }
    if (state.campaignTimePlayed < 600) { playError(); showAlert('Kampania musi trwać minimum 10 minut przed wyborami!', '⛔ ZA WCZEŚNIE', 'error'); return; }

    // Calculate seats
    let sejmTotal = 0;
    let senateTotal = 0;

    ELECTION_REGIONS.forEach(region => {
      const votes = state.regionalVotes[region.id] || 0;
      // Sejm: KO gets proportion of their 35% pool based on votes
      const voteStrength = Math.min(1.0, votes / 2000000);
      const sejmWon = Math.round(region.sejmSeats * voteStrength);
      sejmTotal += sejmWon;

      // Senate: need >50% to win in first round
      const senateStrength = Math.min(1.0, votes / 1500000);
      const senateWon = Math.round(region.senateSeats * senateStrength * 0.85);
      senateTotal += senateWon;
    });

    sejmTotal = Math.min(161, sejmTotal);
    senateTotal = Math.min(99, senateTotal);

    updateState(s => ({
      ...s,
      electionsPhase: 'second_round' as const,
      sejmSeatsWon: sejmTotal,
      senateSeatsWon: senateTotal
    }));
    playAlert();
    showAlert(`I Tura Wyborów zakończona! Sejm: ${sejmTotal}/161 mandatów KO. Senat: ${senateTotal}/100 (II tura o pozostałe). Prowadź ostatnią kampanię!`, '🗳️ WYNIKI I TURY', 'success');
  };

  const runElectionsSecondRound = () => {
    if (state.electionsPhase !== 'second_round') { playError(); return; }

    // Second round: gain remaining senate seats based on continued momentum
    const remainingSeats = 100 - state.senateSeatsWon;
    const totalVotes = Object.values(state.regionalVotes).reduce((a, b) => a + b, 0);
    const momentum = Math.min(1.0, totalVotes / 10000000);
    const extraSeats = Math.round(remainingSeats * momentum * 0.9);

    const finalSenate = Math.min(100, state.senateSeatsWon + extraSeats);

    updateState(s => ({
      ...s,
      electionsPhase: 'negotiations' as const,
      senateSeatsWon: finalSenate
    }));
    playAlert();
    showAlert(`II Tura zakończona! Senat: ${finalSenate}/100 mandatów. Czas na negocjacje rządowe!`, '🗳️ WYNIKI II TURY', 'success');
  };

  const concludeNegotiations = () => {
    if (state.electionsPhase !== 'negotiations') { playError(); return; }

    const bonusMult = state.sejmSeatsWon >= 161 && state.senateSeatsWon >= 90 ? 2.0 : (1.0 + state.senateSeatsWon / 200);

    updateState(s => ({
      ...s,
      electionsPhase: 'completed' as const,
      pln: Math.floor(s.pln * bonusMult)
    }));
    playSuccess();
    if (state.sejmSeatsWon >= 161 && state.senateSeatsWon >= 90) {
      showAlert(`Rząd Tadeusza Mazowieckiego sformowany z pełną przewagą parlamentarną! „Wasz Prezydent, Nasz Premier" — wolna Polska stała się faktem. Twoje finanse otrzymują x${bonusMult} bonus!`, '🇵🇱 RZĄD MAZOWIECKIEGO', 'success');
    } else {
      showAlert(`Rząd koalicyjny sformowany z bonusem x${bonusMult.toFixed(1)}. Transformacja w III RP rozpoczyna się!`, '🇵🇱 RZĄD KOALICYJNY', 'success');
    }
  };


  const buyAsset = (assetType: 'srebro' | 'krugerrand' | 'sztabkaZlota', payWith: 'pln' | 'dollars') => {
    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);

    let usdCost = 0;
    let plnCost = 0;

    if (assetType === 'srebro') {
      plnCost = 10000;
      if (payWith === 'dollars') {
        if (currentMarketRate > 0) usdCost = 10000 / currentMarketRate;
      }
    } else if (assetType === 'krugerrand') {
      usdCost = 400;
      plnCost = 400 * currentMarketRate;
    } else if (assetType === 'sztabkaZlota') {
      usdCost = 2000;
      plnCost = 2000 * currentMarketRate;
    }

    if (payWith === 'pln') {
      if (state.pln < plnCost) { playError(); return; }
      playClick();
      updateState(s => ({
        ...s,
        pln: s.pln - plnCost,
        [assetType === 'srebro' ? 'srebro' : 'zloto']: (s[assetType === 'srebro' ? 'srebro' : 'zloto'] || 0) + (assetType === 'sztabkaZlota' ? 5 : 1)
      }));
    } else {
      if (state.dollars < usdCost) { playError(); return; }
      playClick();
      updateState(s => ({
        ...s,
        dollars: s.dollars - usdCost,
        [assetType === 'srebro' ? 'srebro' : 'zloto']: (s[assetType === 'srebro' ? 'srebro' : 'zloto'] || 0) + (assetType === 'sztabkaZlota' ? 5 : 1)
      }));
    }
  };

  const sellAsset = (assetType: 'srebro' | 'krugerrand' | 'sztabkaZlota', receiveIn: 'pln' | 'dollars') => {
    const count = assetType === 'srebro' ? state.srebro : state.zloto;
    const reqCount = assetType === 'sztabkaZlota' ? 5 : 1;
    if (count < reqCount) { playError(); return; }

    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);

    const hasLicencja = !!state.inflationUpgrades?.['licencjaDewizowa'];
    let usdValue = 0;
    let plnValue = 0;

    if (assetType === 'srebro') {
      usdValue = 2.5;
      plnValue = 2.5 * currentMarketRate;
    } else if (assetType === 'krugerrand') {
      const spreadRed = hasLicencja ? 10 : 0;
      usdValue = 380 + spreadRed;
      plnValue = usdValue * currentMarketRate;
    } else if (assetType === 'sztabkaZlota') {
      const spreadRed = hasLicencja ? 25 : 0;
      usdValue = 1950 + spreadRed;
      plnValue = usdValue * currentMarketRate;
    }

    playClick();
    updateState(s => {
      const stats = { ...s.stats };
      if (receiveIn === 'pln') {
        stats.totalPlnEarned = (s.stats.totalPlnEarned || 0) + plnValue;
      } else {
        stats.totalDollarsEarned = (s.stats.totalDollarsEarned || 0) + usdValue;
      }
      return {
        ...s,
        [assetType === 'srebro' ? 'srebro' : 'zloto']: s[assetType === 'srebro' ? 'srebro' : 'zloto'] - reqCount,
        pln: receiveIn === 'pln' ? s.pln + plnValue : s.pln,
        dollars: receiveIn === 'dollars' ? s.dollars + usdValue : s.dollars,
        stats
      };
    });
  };

  const buyBonyPewex = (amount: number) => {
    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);
    const cost = amount * currentMarketRate;

    if (state.pln < cost) { playError(); return; }
    playClick();
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      bonyPewex: (s.bonyPewex || 0) + amount
    }));
  };

  const sellBonyPewex = (amount: number) => {
    if ((state.bonyPewex || 0) < amount) { playError(); return; }
    
    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);
    const payout = Math.floor(amount * currentMarketRate * 0.95);

    playClick();
    updateState(s => {
      const stats = {
        ...s.stats,
        totalPlnEarned: (s.stats.totalPlnEarned || 0) + payout
      };
      return {
        ...s,
        bonyPewex: s.bonyPewex - amount,
        pln: s.pln + payout,
        stats
      };
    });
  };

  const buyWholesale = (itemId: string, payWith: 'pln' | 'dollars') => {
    const prices = wholesalePrices[itemId];
    if (!prices) return;

    let finalCost = payWith === 'pln' ? prices.pln : prices.usd;
    
    if (payWith === 'pln') {
      const inflationFactor = 1 + (state.inflationPercent / 100);
      finalCost = Math.floor(finalCost * inflationFactor);
    }

    const balance = payWith === 'pln' ? state.pln : state.dollars;
    if (balance < finalCost) { playError(); return; }

    const amountGained = itemId === 'kasprzak' ? 5 : 10;

    playSuccess();
    updateState(s => ({
      ...s,
      pln: payWith === 'pln' ? s.pln - finalCost : s.pln,
      dollars: payWith === 'dollars' ? s.dollars - finalCost : s.dollars,
      inventory: {
        ...s.inventory,
        [itemId]: (s.inventory[itemId] || 0) + amountGained
      }
    }));
  };

  const buyBondPRL = () => {
    const inflationFactor = 1 + (state.inflationPercent / 100);
    const cost = Math.floor(50000 * inflationFactor);
    if (state.pln < cost) { playError(); return; }

    playClick();
    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      bondPrlCount: (s.bondPrlCount || 0) + 1
    }));
  };

  const buyBondSolidarnos = (payWith: 'pln' | 'dollars') => {
    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    let inflationMult = 1 + (state.inflationPercent / 100);
    if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
    const currentMarketRate = Math.floor(baseRate * inflationMult);

    const plnCost = 100 * currentMarketRate;
    const usdCost = 100;

    if (payWith === 'pln') {
      if (state.pln < plnCost) { playError(); return; }
      playClick();
      updateState(s => ({
        ...s,
        pln: s.pln - plnCost,
        bondSolCount: (s.bondSolCount || 0) + 1,
        bondSolValue: (s.bondSolValue || 0) + plnCost
      }));
    } else {
      if (state.dollars < usdCost) { playError(); return; }
      playClick();
      updateState(s => ({
        ...s,
        dollars: s.dollars - usdCost,
        bondSolCount: (s.bondSolCount || 0) + 1,
        bondSolValue: (s.bondSolValue || 0) + plnCost
      }));
    }
  };

  const redeemSolidarnosBonds = () => {
    if ((state.bondSolCount || 0) === 0) { playError(); return; }
    const payout = Math.floor(state.bondSolValue || 0);

    playSuccess();
    updateState(s => {
      const stats = {
        ...s.stats,
        totalPlnEarned: (s.stats.totalPlnEarned || 0) + payout
      };
      return {
        ...s,
        pln: s.pln + payout,
        bondSolCount: 0,
        bondSolValue: 0,
        stats
      };
    });
  };

  const upgradeHelper = (helperId: string) => {
    const upgradeInfo = HELPER_UPGRADE_COSTS[helperId];
    if (!upgradeInfo) return;
    const currentLevel = state.helperUpgrades?.[helperId] || 0;
    const cost = 10 * (currentLevel + 1);
    if ((state.inventory[upgradeInfo.resource] || 0) < cost) {
      playError();
      return;
    }
    playSuccess();
    updateState(s => {
      const newInventory = { ...s.inventory };
      newInventory[upgradeInfo.resource] = (newInventory[upgradeInfo.resource] || 0) - cost;
      
      const newUpgrades = { ...s.helperUpgrades };
      newUpgrades[helperId] = (newUpgrades[helperId] || 0) + 1;
      
      return {
        ...s,
        inventory: newInventory,
        helperUpgrades: newUpgrades
      };
    });
  };
  
  const buyBusiness = (id: string, costDollars: number) => {
    if (state.dollars < costDollars) return;
    updateState(s => ({
      ...s,
      dollars: s.dollars - costDollars,
      businesses: { ...s.businesses, [id]: (s.businesses[id] || 0) + 1 }
    }));
  };

  const deliverForTalony = (itemId: string, amountRequired: number, talonyReward: number) => {
    const owned = Math.floor(state.inventory[itemId] || 0);
    if (owned < amountRequired) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      talony: s.talony + talonyReward,
      inventory: { ...s.inventory, [itemId]: s.inventory[itemId] - amountRequired }
    }));
  };

  const deliverForRuble = (itemId: string, amountRequired: number, rubleReward: number) => {
    const owned = Math.floor(state.inventory[itemId] || 0);
    if (owned < amountRequired) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      ruble: s.ruble + rubleReward,
      inventory: { ...s.inventory, [itemId]: s.inventory[itemId] - amountRequired }
    }));
  };

  const buyInstantCzarnyRynek = (itemId: string) => {
    const originalItem = QUEUE_ITEMS.find(i => i.id === itemId);
    if (!originalItem) return;
    
    const bmAchMult = (state.unlockedAchievements?.['black_market_1'] ? 0.90 : 1) * (state.unlockedAchievements?.['black_market_2'] ? 0.80 : 1);
    const inflationFactor = 1 + (state.inflationPercent / 100);
    const baseCost = originalItem.costPln === 0 ? 25 : Math.floor(originalItem.costPln * 2.5);
    const cost = Math.floor(baseCost * inflationFactor);
    const finalCost = Math.floor(cost * bmAchMult);
    if (state.pln < finalCost) { playError(); return; }
    
    playSuccess();
    updateState(s => {
       const suspAchMult = (s.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (s.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
       const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
       const suspicionAdd = s.partyRank === 'minister' || s.activeEvent === 'odwilz' ? 0 : Math.max(1, Math.floor(Math.floor(originalItem.costPln / 50) * suspAchMult * luxurySuspMult));
       const stats = {
         ...s.stats,
         totalBlackMarketPurchases: (s.stats.totalBlackMarketPurchases || 0) + 1
       };
       return {
         ...s,
         pln: s.pln - finalCost,
         suspicion: s.suspicion + suspicionAdd,
         inventory: { ...s.inventory, [itemId]: (s.inventory[itemId] || 0) + 1 },
         stats
       };
     });
  };

  const exchangeTalonyForKartki = () => {
    const cost = state.activeEvent === 'stocznia' ? 1 : 2;
    if (state.talony < cost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      talony: s.talony - cost,
      kartki: s.kartki + 3
    }));
  };

  const buyDollarPremium = () => {
    const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
    const rate = Math.floor(baseRate * 1.30);
    if (state.pln < rate) { playError(); return; }
    playSuccess();
    updateState(s => {
      const currentBaseRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
      const currentRate = Math.floor(currentBaseRate * 1.30);
      const stats = {
        ...s.stats,
        totalCinkciarzExchanges: (s.stats.totalCinkciarzExchanges || 0) + 1,
        totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + 1,
        totalBlackMarketPurchases: (s.stats.totalBlackMarketPurchases || 0) + 1
      };
      return {
        ...s,
        pln: s.pln - currentRate,
        dollars: s.dollars + 1,
        stats
      };
    });
  };

  const exchangeRubleForDollars = () => {
    if (state.ruble < 10) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      ruble: s.ruble - 10,
      dollars: s.dollars + 1,
      stats: {
        ...s.stats,
        totalDollarsEarned: (s.stats.totalDollarsEarned || 0) + 1
      }
    }));
  };

  const buyPaper = () => {
    if (state.bibulaLockdownRemaining > 0) { playError(); return; }
    if (state.pln < 50) {
      playError();
      showAlert("Brak pieniędzy! Ryza papieru kosztuje 50 zł.", "BRAK ŚRODKÓW", "error");
      return;
    }
    playClick();
    updateState(s => ({
      ...s,
      pln: s.pln - 50,
      bibulaPaper: s.bibulaPaper + 1
    }));
  };

  const buyInk = () => {
    if (state.bibulaLockdownRemaining > 0) { playError(); return; }
    if (state.pln < 100) {
      playError();
      showAlert("Brak pieniędzy! Flakon tuszu kosztuje 100 zł.", "BRAK ŚRODKÓW", "error");
      return;
    }
    playClick();
    updateState(s => ({
      ...s,
      pln: s.pln - 100,
      bibulaInk: s.bibulaInk + 1
    }));
  };

  const startPrinting = () => {
    if (state.bibulaLockdownRemaining > 0) { playError(); return; }
    if (state.isPrinting) { playError(); return; }
    if (state.bibulaPaper < 1 || state.bibulaInk < 1) {
      playError();
      showAlert("Brak materiałów! Potrzebujesz przynajmniej 1 ryzy papieru i 1 flakonu tuszu, aby drukować.", "BRAK MATERIAŁÓW", "error");
      return;
    }
    playClick();
    updateState({ isPrinting: true, printProgress: 0 });
  };

  const distributePisma = (amount: number) => {
    if (state.bibulaLockdownRemaining > 0) { playError(); return; }
    if (state.bibulaPisma < amount) {
      playError();
      showAlert(`Brak pism! Chcesz rozprowadzić ${amount} szt., a masz tylko ${state.bibulaPisma} szt.`, "BRAK BIBUŁY", "error");
      return;
    }

    playClick();
    const risk = Math.min(90, amount * 0.1);
    const isCaught = Math.random() * 100 < risk;

    if (isCaught) {
      playAlert();
      const loss = Math.floor(state.bibulaPisma * 0.5);
      updateState(s => {
        const nextSusp = Math.min(100, s.suspicion + 30);
        return {
          ...s,
          bibulaPisma: s.bibulaPisma - loss,
          bibulaLockdownRemaining: 120,
          suspicion: nextSusp,
          isPrinting: false,
          printProgress: 0
        };
      });
      showAlert(
        `WSKAZÓWKA! SB wykryło kolportaż! Konfiskata: straciłeś ${loss} szt. bibuły. \n\nTajna drukarnia została zaplombowana na 120s! Podejrzenie Milicji wzrosło o +30%.`,
        "WSKAZÓWKA SB / ARESZTOWANIE",
        "error"
      );
    } else {
      playSuccess();
      const solEarned = amount * 2;
      updateState(s => {
        const nextSol = Math.min(10000, s.solidarnos + solEarned);
        return {
          ...s,
          bibulaPisma: s.bibulaPisma - amount,
          solidarnos: nextSol
        };
      });
      showAlert(
        `Kolportaż udany! Rozprowadzono ${amount} szt. bibuły podziemnej. Zdobyłeś +${solEarned} pkt poparcia Solidarności.`,
        "SUKCES KOLPORTAŻU",
        "success"
      );
    }
  };

  const buyBlackMarketOffer = (offerId: string) => {
    const offer = state.blackMarketOffers.find(o => o.id === offerId);
    if (!offer) return;
    
    if (offer.costPln !== undefined && state.pln < offer.costPln) { playError(); return; }
    if (offer.costTalony !== undefined && state.talony < offer.costTalony) { playError(); return; }
    if (offer.costRuble !== undefined && state.ruble < offer.costRuble) { playError(); return; }
    
    playSuccess();
    updateState(s => {
      const stats = {
        ...s.stats,
        totalBlackMarketPurchases: (s.stats.totalBlackMarketPurchases || 0) + 1
      };
      const next = { ...s, inventory: { ...s.inventory }, stats };
      if (offer.costPln !== undefined) next.pln -= offer.costPln;
      if (offer.costTalony !== undefined) next.talony -= offer.costTalony;
      if (offer.costRuble !== undefined) next.ruble -= offer.costRuble;
      
      next.inventory[offer.itemId] = (next.inventory[offer.itemId] || 0) + offer.amount;
      next.blackMarketOffers = next.blackMarketOffers.filter(o => o.id !== offerId);
      return next;
    });
  };

  const startSeaSmuggle = (routeId: string) => {
    if (state.activeSeaSmuggle) { playError(); return; }
    const route = SEA_SMUGGLING_ROUTES.find(r => r.id === routeId);
    if (!route) return;

    if (state.pln < route.costPln) {
      playError();
      showAlert("Brak środków w PLN na pokrycie kosztów wyprawy!", "BRAK PLN", "error");
      return;
    }

    playClick();
    updateState(s => ({
      ...s,
      pln: s.pln - route.costPln,
      activeSeaSmuggle: routeId,
      seaSmuggleProgress: 0
    }));
  };

  const exchangeGoodsForBaltona = (itemId: string, amount: number, rewardBony: number) => {
    const currentAmount = Math.floor(state.inventory[itemId] || 0);
    if (currentAmount < amount) {
      playError();
      showAlert(`Niewystarczająca ilość towaru! Potrzebujesz ${amount} szt.`, "BRAK TOWARU", "error");
      return;
    }

    playSuccess();
    updateState(s => ({
      ...s,
      inventory: {
        ...s.inventory,
        [itemId]: currentAmount - amount
      },
      bonyBaltona: s.bonyBaltona + rewardBony
    }));
  };

  const buyBaltonaUpgrade = (upgradeId: string) => {
    if (state.baltonaUpgrades[upgradeId]) { playError(); return; }
    const item = BALTONA_ITEMS.find(u => u.id === upgradeId);
    if (!item) return;

    if (state.bonyBaltona < item.costBony) {
      playError();
      showAlert(`Brak bonów Baltona! Wymagane: ${item.costBony} bonów.`, "BRAK BONÓW", "error");
      return;
    }

    playSuccess();
    updateState(s => ({
      ...s,
      bonyBaltona: s.bonyBaltona - item.costBony,
      baltonaUpgrades: {
        ...s.baltonaUpgrades,
        [upgradeId]: true
      }
    }));
  };

  const buyCounterIntel = () => {
    if (state.pln < 5000) {
      playError();
      showAlert("Nie masz wystarczająco dużo pieniędzy! Wymagane: 5 000 zł.", "BRAK ŚRODKÓW", "error");
      return;
    }
    playSuccess();
    updateState(s => ({
      ...s,
      pln: s.pln - 5000,
      sbCounterIntelTimeLeft: (s.sbCounterIntelTimeLeft || 0) + 300
    }));
    showAlert("Opłacono kontrwywiad podziemia. SB nie zwerbuje nowych wtyczek, a obecne wtyczki są kontrolowane i dezinformowane (zawieszono donosicielstwo) przez najbliższe 5 minut!", "KONTRWYWIAD OPŁACONY", "success");
  };

  const runInvestigation = () => {
    if (state.pln < 3000) {
      playError();
      showAlert("Nie masz wystarczająco dużo pieniędzy! Wymagane: 3 000 zł.", "BRAK ŚRODKÓW", "error");
      return;
    }
    playClick();
    
    const twIds = Object.keys(state.sbTwList).filter(id => state.sbTwList[id]);
    
    updateState(s => {
      const newRevealed = { ...s.sbTwRevealed };
      twIds.forEach(id => {
        newRevealed[id] = true;
      });
      return {
        ...s,
        pln: s.pln - 3000,
        sbTwRevealed: newRevealed
      };
    });

    if (twIds.length > 0) {
      playAlert();
      const names = twIds.map(id => {
        const h = HELPERS.find(helper => helper.id === id);
        return h ? h.name : id;
      }).join(", ");
      showAlert(`Wyniki śledztwa: W Twoich strukturach ujawniono wtyczki SB! Podejrzani agenci: ${names}. Podejmij natychmiastowe kroki zaradcze!`, "ŚLEDZTWO ZAKOŃCZONE", "error");
    } else {
      playSuccess();
      showAlert("Wyniki śledztwa: Wszystko wskazuje na to, że w Twoim zespole pomocników nie ma żadnych aktywnych agentów SB.", "ŚLEDZTWO ZAKOŃCZONE", "success");
    }
  };

  const dismissHelperTW = (helperId: string) => {
    const count = state.helpers[helperId] || 0;
    if (count <= 0) {
      playError();
      return;
    }
    playClick();
    updateState(s => {
      const newHelpers = { ...s.helpers, [helperId]: count - 1 };
      const newTwList = { ...s.sbTwList };
      const newRevealed = { ...s.sbTwRevealed };
      const newBlackmailed = { ...s.sbTwBlackmailed };
      
      delete newTwList[helperId];
      delete newRevealed[helperId];
      delete newBlackmailed[helperId];
      
      return {
        ...s,
        helpers: newHelpers,
        sbTwList: newTwList,
        sbTwRevealed: newRevealed,
        sbTwBlackmailed: newBlackmailed
      };
    });
    const h = HELPERS.find(helper => helper.id === helperId);
    showAlert(`Odsunięto pomocnika (${h ? h.name : helperId}) od działań grupy. Wtyczka SB została wyeliminowana z zespołu, ale straciłeś 1 poziom tego pomocnika.`, "POMOCNIK ODSUNIĘTY", "success");
  };

  const blackmailHelperTW = (helperId: string) => {
    const currentPisma = state.bibulaPisma || 0;
    if (currentPisma < 20) {
      playError();
      showAlert("Nie masz wystarczająco dużo bibuły (pism podziemnych)! Wymagane: 20 szt.", "BRAK BIBUŁY", "error");
      return;
    }
    playSuccess();
    updateState(s => ({
      ...s,
      bibulaPisma: currentPisma - 20,
      sbTwBlackmailed: {
        ...s.sbTwBlackmailed,
        [helperId]: true
      }
    }));
    const h = HELPERS.find(helper => helper.id === helperId);
    showAlert(`Zaszantażowano pomocnika (${h ? h.name : helperId}) kompromitującymi materiałami. Pomocnik od teraz działa jako podwójny agent pod kontrolą podziemia: kontynuuje produkcję surowców, a donoszenie do SB zostało trwale zablokowane!`, "WTYCZKA ZASZANTAŻOWANA", "success");
  };

  const bribeSBHandler = (helperId: string) => {
    if (state.dollars < 50) {
      playError();
      showAlert("Nie masz wystarczająco dużo dolarów! Wymagane: $50.", "BRAK DOLARÓW", "error");
      return;
    }
    playSuccess();
    updateState(s => {
      const newTwList = { ...s.sbTwList };
      const newRevealed = { ...s.sbTwRevealed };
      const newBlackmailed = { ...s.sbTwBlackmailed };
      
      delete newTwList[helperId];
      delete newRevealed[helperId];
      delete newBlackmailed[helperId];
      
      return {
        ...s,
        dollars: s.dollars - 50,
        sbTwList: newTwList,
        sbTwRevealed: newRevealed,
        sbTwBlackmailed: newBlackmailed
      };
    });
    const h = HELPERS.find(helper => helper.id === helperId);
    showAlert(`Wręczono łapówkę ($50) oficerowi prowadzącemu SB. Teczka personalna pomocnika (${h ? h.name : helperId}) została zniszczona, a sam pomocnik jest trwale czysty!`, "ŁAPÓWKA WRĘCZONA", "success");
  };
  
  const bribe = () => {
    const solidarityBribeMult = state.solidarnos >= 6500 ? 0.85 : 1.0;
    const bribeAchMult = (state.unlockedAchievements?.['pol_bribe_1'] ? 0.90 : 1) 
                       * (state.unlockedAchievements?.['pol_bribe_2'] ? 0.75 : 1)
                       * solidarityBribeMult;
    const cost = Math.floor((state.partyRank === 'czlonek' ? 900 : 1000) * bribeAchMult);
    if (state.pln >= cost) {
      updateState(s => ({
        ...s,
        pln: s.pln - cost,
        suspicion: 0,
        stats: {
          ...s.stats,
          totalBribesPaidPln: (s.stats.totalBribesPaidPln || 0) + cost
        }
      }));
    }
  };

  // Faza E: Fundowanie Solidarności
  const fundSolidarnoscPln = (amount: number, plnCost: number) => {
    if (state.pln < plnCost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      pln: s.pln - plnCost,
      solidarnos: Math.min(10000, s.solidarnos + amount),
    }));
  };

  const fundSolidarnoscKartki = (amount: number, kartkiCost: number) => {
    if (state.kartki < kartkiCost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      kartki: s.kartki - kartkiCost,
      solidarnos: Math.min(10000, s.solidarnos + amount),
    }));
  };

  const fundSolidarnoscDollars = (amount: number, dollarCost: number) => {
    if (state.dollars < dollarCost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      dollars: s.dollars - dollarCost,
      solidarnos: Math.min(10000, s.solidarnos + amount),
    }));
  };

  const fundSolidarnoscTalony = (amount: number, talonyCost: number) => {
    if (state.talony < talonyCost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      talony: s.talony - talonyCost,
      solidarnos: Math.min(10000, s.solidarnos + amount),
    }));
  };

  const fundSolidarnoscRuble = (amount: number, rubleCost: number) => {
    if (state.ruble < rubleCost) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      ruble: s.ruble - rubleCost,
      solidarnos: Math.min(10000, s.solidarnos + amount),
    }));
  };

  const startOkraglyStol = () => {
    if (state.solidarnos < 10000) { playError(); return; }
    if (state.kartki < 1000) { playError(); return; }
    if (state.pln < 100000) { playError(); return; }
    playSuccess();
    updateState(s => ({
      ...s,
      kartki: s.kartki - 1000,
      pln: s.pln - 100000,
      okraglyStolKartki: s.okraglyStolKartki + 1000,
      okraglyStolPln: s.okraglyStolPln + 100000,
      okraglyStolStartDay: s.okraglyStolStartDay < 0 ? s.stats.totalTimePlayed : s.okraglyStolStartDay,
      okraglyStolVictory: true,
    }));
  };

  // Determine current party rank index
  const currentRankIndex = PARTY_RANKS.findIndex(r => r.id === state.partyRank);

  // Obliczenia dla Kalkulatora Casio
  const nrfMult = (state.activeDestination === 'nrf' || state.activeDestination === null) 
    ? (1 + (state.prestigePoints * 0.10)) 
    : 1.0;
  const ngPlusCount = state.prestigeCount || 0;
  const ngPlusMult = ngPlusCount >= 5 ? 1 + (ngPlusCount - 4) * 0.05 : 1.0;
  const generalProductionMult = nrfMult * ngPlusMult;

  const rubleMult = 1 + (state.ruble * 0.005);
  const helperSpeedAchMult = (state.unlockedAchievements?.['pres_points'] ? 1.10 : 1) * (state.unlockedAchievements?.['pol_rank_4'] ? 1.25 : 1);
  const solidarityHelperSpeedMult = state.solidarnos >= 9000 ? 1.25 : 1.0;
  const helperMult = (state.pewexItems['lego'] ? 1.3 : 1) 
                   * (state.pewexItems['sanyo'] ? 1.5 : 1) 
                   * generalProductionMult
                   * rubleMult
                   * helperSpeedAchMult
                   * solidarityHelperSpeedMult;
  
  const rubinMult = state.pewexItems['rubin'] ? 2.0 : 1.0;
  // Solidarność Sympatyk: 5% lepszy kurs cinkciarza
  const solidarnoscCinkciarzBonus = state.solidarnos >= 1000 ? 0.95 : 1.0;
  const cinkciarzAchRateMult = (state.unlockedAchievements?.['eco_cinkciarz_1'] ? 0.98 : 1) * (state.unlockedAchievements?.['eco_cinkciarz_2'] ? 0.95 : 1) * solidarnoscCinkciarzBonus;
  const effectiveExchangeRate = Math.floor((state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate) * cinkciarzAchRateMult);
  
  let cinkciarzPlnRate = 0;
  let cinkciarzUsdRate = 0;
  let widmoUsdRate = 0;
  let kartkiRate = 0;
  const itemRates: Record<string, number> = {};
  
  QUEUE_ITEMS.forEach(i => {
    itemRates[i.id] = 0;
  });
  
  HELPERS.forEach(h => {
    const count = state.helpers[h.id] || 0;
    if (count > 0) {
      const level = state.helperUpgrades?.[h.id] || 0;
      const upgradeMult = 1 + level * 0.5;
      const amount = count * h.ratePerTick * helperMult * upgradeMult;
      if (h.id === 'cinkciarz') {
        cinkciarzUsdRate += amount;
        cinkciarzPlnRate -= amount * effectiveExchangeRate;
      } else if (h.id === 'widmo') {
        widmoUsdRate += amount;
      } else if (h.id === 'staszek') {
        itemRates['predom'] = (itemRates['predom'] || 0) + amount * 0.5;
        itemRates['kasprzak'] = (itemRates['kasprzak'] || 0) + amount * 0.5;
      } else if (h.id === 'konspiracja') {
        kartkiRate += amount;
      } else {
        itemRates[h.generateId] = (itemRates[h.generateId] || 0) + amount;
      }
    }
  });
  
  let businessPlnRate = 0;
  let businessUsdRate = 0;
  const businessAchMult = state.unlockedAchievements?.['eco_usd_1'] ? 1.10 : 1;
  const transformMult = state.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
  BUSINESSES.forEach(b => {
    const count = state.businesses[b.id] || 0;
    if (count > 0) {
      const biuroMult = state.partyRank === 'biuro' ? 3.0 : 1.0;
      const amount = count * b.ratePerTick * rubinMult * biuroMult * businessAchMult * transformMult * generalProductionMult;
      if (b.generateType === 'pln') {
        businessPlnRate += amount;
      } else {
        businessUsdRate += amount;
      }
    }
  });
  
  // Faza S / R / N / M - Live financial stats breakdown
  let mediaPlnRate = 0;
  if (state.mediaUnlocked) {
    let coverageMult = 1.0;
    MEDIA_ANTENNA_REGIONS.forEach(reg => {
      if (state.mediaAntennas[reg.id]) {
        coverageMult += reg.coverageMultiplier;
      }
    });

    MEDIA_STATIONS.forEach(station => {
      if (!state.mediaStations[station.id]) return;
      let stationRating = station.baseRating;
      let totalIncomeMult = 0;
      let activeProgramCount = 0;

      const slots = state.activeMediaPrograms[station.id] || { rano: null, poludnie: null, wieczor: null };
      Object.values(slots).forEach(progId => {
        if (progId) {
          const prog = MEDIA_PROGRAMS.find(p => p.id === progId);
          if (prog) {
            stationRating += prog.ratingBonus;
            totalIncomeMult += prog.incomeMult;
            activeProgramCount++;
          }
        }
      });

      stationRating *= coverageMult;
      const currentTrust = state.mediaTrust[station.id] !== undefined ? state.mediaTrust[station.id] : 100;
      const trustMult = 0.5 + (currentTrust / 200);
      stationRating = Math.floor(stationRating * trustMult);

      if (activeProgramCount > 0 && stationRating > 0) {
        let revenuePerSec = stationRating * 8 * totalIncomeMult;
        const mult = state.isDenominated ? 1 : state.plzInflationMult;
        mediaPlnRate += Math.floor(revenuePerSec * mult);
      }
    });
  }

  let dotcomPlnRate = 0;
  if (state.fazaSUnlocked && state.dotcomServerCapacity > 0) {
    let adRevenuePerUser = 0.5;
    if (state.dotcomUpgrades['agresywne_seo']) adRevenuePerUser = 0.8;
    dotcomPlnRate = Math.floor(state.dotcomUsers * adRevenuePerUser);
  }

  let zmywakPlnRate = 0;
  if (state.fazaSUnlocked && state.zmywakWorkers > 0) {
    const gbpPerSec = state.zmywakWorkers * 5;
    const commissionGbp = gbpPerSec * 0.15;
    zmywakPlnRate = Math.floor(commissionGbp * 6);
  }

  let nfiPlnRate = 0;
  if (state.fazaMUnlocked) {
    Object.keys(state.nfiCompanies || {}).forEach(compId => {
      if (state.nfiCompanies[compId]) {
        const comp = NFI_COMPANIES.find(c => c.id === compId);
        if (comp) {
          const status = Object.assign({
            employment: comp.baseEmployment,
            infrastructure: comp.baseInfrastructure,
            morale: 100,
            unionStrength: comp.baseUnionStrength,
            strikeActive: false
          }, state.nfiCompanyStatus[compId] || {});

          const mult = state.isDenominated ? 1 : state.plzInflationMult;
          if (!status.strikeActive) {
            const baseWages = comp.baseEmployment * 5;
            const currentWages = status.employment * 5;
            const grossRevenue = (comp.dividendPerSecPln + baseWages)
              * (status.infrastructure / comp.baseInfrastructure)
              * (Math.min(status.employment, comp.baseEmployment * 1.2) / comp.baseEmployment);
            const netProfit = grossRevenue - currentWages;
            nfiPlnRate += Math.max(0, Math.floor(netProfit * mult));
          }
        }
      }
    });
  }

  let gpwPlnRate = 0;
  if (state.gpwUnlocked) {
    const hasGpwInvestor = state.unlockedAchievements?.['gpw_investor'];
    const dividendMultiplier = hasGpwInvestor ? 1.2 : 1.0;
    let divAmountPer30s = 0;
    GPW_STOCKS.forEach(stock => {
      const owned = state.sharesOwned[stock.id] || 0;
      if (owned > 0) {
        const price = state.stockPrices[stock.id] || stock.basePrice;
        divAmountPer30s += owned * price * stock.dividendRate * dividendMultiplier;
      }
    });
    gpwPlnRate = Math.floor(divAmountPer30s / 30);
  }

  let gangPlnCost = 0;
  if (state.fazaNUnlocked) {
    let totalUpkeep = 0;
    Object.entries(state.gangUnits).forEach(([unitId, count]) => {
      const unit = GANGSTER_UNITS.find(u => u.id === unitId);
      if (unit && count > 0) {
        totalUpkeep += unit.upkeepPln * count;
      }
    });
    gangPlnCost = Math.floor(totalUpkeep * (state.isDenominated ? 1 : state.plzInflationMult));
  }

  let chfPlnCost = 0;
  if (state.fazaSUnlocked && state.chfDebt > 0) {
    const advisorDiscount = 1 - (state.bankAdvisors || 0) * 0.15;
    const chfInstallmentPerSec = state.chfDebt * 0.005 * advisorDiscount;
    chfPlnCost = Math.floor(chfInstallmentPerSec * state.chfExchangeRate);
  }

  const totalPassiveIncome = businessPlnRate + mediaPlnRate + dotcomPlnRate + zmywakPlnRate + nfiPlnRate + gpwPlnRate;
  const totalPassiveExpenses = Math.abs(cinkciarzPlnRate) + gangPlnCost + chfPlnCost;
  const plnRate = totalPassiveIncome - totalPassiveExpenses;
  const dollarsRate = businessUsdRate + cinkciarzUsdRate + widmoUsdRate;

  const currentEventData = HISTORY_EVENTS.find(e => e.id === state.activeEvent);

  return (
    <div className="crt-screen">
      <div style={{ position: 'absolute', top: '15px', right: '20px', display: 'flex', alignItems: 'center', gap: '15px', fontFamily: 'monospace', color: 'var(--crt-text)', fontSize: '1.2rem', textShadow: '0 0 5px var(--crt-text)' }}>
        <button 
          onClick={() => { playClick(); setSettingsOpen(!settingsOpen); }}
          style={{
            background: settingsOpen ? 'var(--crt-text)' : 'transparent',
            border: '1px solid var(--crt-text)',
            color: settingsOpen ? '#000' : 'var(--crt-text)',
            padding: '2px 8px',
            fontSize: '0.85rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textShadow: settingsOpen ? 'none' : 'inherit',
            boxShadow: '0 0 3px var(--crt-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          ⚙️ USTAWIENIA
        </button>

        {settingsOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            cursor: 'default',
            textShadow: 'none'
          }} onClick={() => setSettingsOpen(false)}>
            <div style={{
              width: '320px',
              backgroundColor: '#111111',
              border: '3px solid var(--crt-text)',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 0 25px rgba(0, 255, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '15px',
              fontFamily: 'monospace',
              color: 'var(--crt-text)'
            }} onClick={(e) => e.stopPropagation()}>
              
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--crt-text)', paddingBottom: '8px', marginBottom: '5px' }}>
                <strong style={{ fontSize: '1.2em' }}>⚙️ USTAWIENIA</strong>
                <button onClick={() => { playClick(); setSettingsOpen(false); }} style={{ background: 'transparent', border: 'none', color: '#ff3333', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.4rem', lineHeight: '1' }}>×</button>
              </div>

              {/* Status: Gra Zapauzowana */}
              <div style={{ textAlign: 'center', color: '#e74c3c', fontWeight: 'bold', fontSize: '0.9em', border: '1px dashed #e74c3c', padding: '5px', borderRadius: '4px', letterSpacing: '1px', textShadow: '0 0 3px #e74c3c' }}>
                ⏸️ GRA ZAPAUZOWANA
              </div>

              {/* Dźwięk */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Dźwięk systemowy:</span>
                <button 
                  onClick={toggleSound}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--crt-text)',
                    color: 'var(--crt-text)',
                    padding: '4px 12px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 0 3px var(--crt-text)'
                  }}
                >
                  {soundOn ? '🔊 WŁĄCZONY' : '🔇 WYŁĄCZONY'}
                </button>
              </div>

              {/* Dev Opcje */}
              <div style={{ borderTop: '1px dashed #444', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: 'var(--prl-yellow)', fontSize: '0.85rem', fontWeight: 'bold' }}>Narzędzia Deweloperskie:</span>
                <button 
                  onClick={devUnlockEverything}
                  style={{
                    width: '100%',
                    background: state.devStateBackup ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)',
                    border: state.devStateBackup ? '1px solid #2ecc71' : '1px solid #e74c3c',
                    color: state.devStateBackup ? '#2ecc71' : '#e74c3c',
                    padding: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: state.devStateBackup ? '0 0 3px #2ecc71' : '0 0 3px #e74c3c'
                  }}
                >
                  {state.devStateBackup ? '🔧 DEV: ZABLOKUJ GRĘ' : '🔧 DEV: ODBLOKUJ GRĘ'}
                </button>
                <button 
                  onClick={devClearDebt}
                  style={{
                    width: '100%',
                    background: 'rgba(52, 152, 219, 0.2)',
                    border: '1px solid #3498db',
                    color: '#3498db',
                    padding: '8px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #3498db'
                  }}
                >
                  🔧 DEV: ZERUJ DŁUG CHF
                </button>
              </div>

              {/* Hard Reset */}
              <div style={{ borderTop: '1px dashed #444', paddingTop: '12px' }}>
                <button 
                  onClick={hardReset}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 0, 0, 0.3)',
                    border: '1px solid #ff3333',
                    color: '#ff3333',
                    padding: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 4px #ff3333'
                  }}
                >
                  🚨 USUŃ ZAPIS (HARD RESET)
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          {realTime.toLocaleTimeString('pl-PL')}
        </div>
      </div>
      <h1 className="title">KOMBINATOR 4.0: DROGA DO WOLNOŚCI</h1>

      {/* PAP NEWS TICKER */}
      {state.activeEvent && currentEventData ? (
        <div className="pap-ticker active">
          <div className="pap-badge">TELEGRAM PAP</div>
          <div className="pap-text">
            <strong>{currentEventData.name}:</strong> {currentEventData.desc}
          </div>
          <div className="pap-time">
            (KOMUNIKAT: {state.eventTimeLeft}s)
          </div>
        </div>
      ) : (
        <div className="pap-ticker" style={{borderColor: 'var(--prl-dark-gray)', background: 'rgba(0,0,0,0.2)', color: 'var(--prl-gray)'}}>
          <div className="pap-badge" style={{background: 'var(--prl-dark-gray)', color: 'var(--prl-gray)'}}>TELEGRAM PAP</div>
          <div className="pap-text" style={{fontSize: '0.95rem'}}>
            Aktualnie brak komunikatów nadzwyczajnych PAP. Następny biuletyn za: {state.nextEventIn}s.
          </div>
        </div>
      )}
      
      {state.pewexItems['transformacja'] && (
        <div style={{background: 'var(--dollar-green)', color: '#000', padding: '10px', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold'}}>
          GRATULACJE! WPROWADZIŁEŚ WOLNY RYNEK I OBALIŁEŚ KOMUNIZM! ZWYCIĘSTWO!
        </div>
      )}
      {state.okraglyStolVictory && (
        <div style={{background: 'linear-gradient(135deg, #cc0000, #ffffff, #cc0000)', color: '#000', padding: '10px', textAlign: 'center', marginBottom: '20px', fontWeight: 'bold', border: '2px solid #cc0000'}}>
          ★ SOLIDARNOŚĆ ZWYCIĘŻYŁA! OKRĄGŁY STÓŁ PODPISANY! DROGA DO WOLNYCH WYBORÓW OTWARTA! ★
        </div>
      )}

      {/* GLOBAL HUD */}
      <div className="panel" style={{marginBottom: '20px', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
        {state.activeDestination === 'usa' && (
          <div className="flex-col animate-pulse" style={{color: 'var(--prl-red)'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>INFLACJA</span>
             <span style={{fontSize: '1.2rem'}}>{state.inflationPercent.toFixed(1)}%</span>
          </div>
        )}
        <div className="flex-col">
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>ZŁOTÓWKI</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.pln).toLocaleString()} zł</span>
        </div>
        <div className="flex-col text-dollar">
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>DOLARY</span>
           <span style={{fontSize: '1.2rem'}}>${Math.floor(state.dollars).toLocaleString()}</span>
        </div>
        {(state.activeDestination === 'usa' || (state.bonyPewex || 0) > 0) && (
          <div className="flex-col" style={{color: 'var(--dollar-green)'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>BONY PEWEX</span>
             <span style={{fontSize: '1.2rem'}}>{Math.floor(state.bonyPewex || 0)} bon.</span>
          </div>
        )}
        {(state.activeDestination === 'usa' || (state.zloto || 0) > 0) && (
          <div className="flex-col" style={{color: '#ffd700'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>ZŁOTO (KRUSZEC)</span>
             <span style={{fontSize: '1.2rem'}}>{Math.floor(state.zloto || 0)} oz</span>
          </div>
        )}
        {(state.activeDestination === 'usa' || (state.srebro || 0) > 0) && (
          <div className="flex-col" style={{color: '#c0c0c0'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>SREBRO (KRUSZEC)</span>
             <span style={{fontSize: '1.2rem'}}>{Math.floor(state.srebro || 0)} oz</span>
          </div>
        )}
        <div className="flex-col" style={{color: 'var(--prl-yellow)'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>KARTKI</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.kartki)} szt.</span>
        </div>
        <div className="flex-col" style={{color: '#5bc0de'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>TALONY</span>
           <span style={{fontSize: '1.2rem'}}>{state.talony} szt.</span>
        </div>
        <div className="flex-col" style={{color: '#ff4500'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>RUBLE</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.ruble)} Rub</span>
        </div>
        <div className="flex-col" style={{color: 'var(--prl-yellow)'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>BONY BALTONA</span>
           <span style={{fontSize: '1.2rem'}}>{state.bonyBaltona} bon.</span>
        </div>
        <div className="flex-col" style={{color: state.suspicion > 50 ? 'var(--prl-red)' : 'var(--crt-text)'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>MILICJA</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.suspicion)}%</span>
        </div>
        <div className="flex-col" style={{color: '#e63946'}}>
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>SOLIDARNOŚĆ</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.solidarnos)}/10000</span>
        </div>
        {state.speedrunActive && (
          <div className="flex-col" style={{color: 'var(--prl-yellow)'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>⏱️ SPEEDRUN</span>
             <span style={{fontSize: '1.2rem', fontFamily: 'monospace'}}>{formatSpeedrunTime(state.speedrunTime)}</span>
          </div>
        )}
      </div>

      {/* CASIO CALCULATOR STATS PANEL */}
      {state.pewexItems['casio'] && (
        <div className="panel" style={{marginBottom: '20px', fontFamily: 'monospace', borderColor: 'var(--prl-yellow)'}}>
          <h3 style={{color: 'var(--prl-yellow)', marginTop: 0, fontSize: '1rem', borderBottom: '1px solid var(--prl-yellow)', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>KALKULATOR CASIO fx-3600P</span>
            <div style={{display: 'flex', gap: '5px'}}>
               <button 
                  onClick={() => { playClick(); setCasioMode('bilans'); }} 
                  style={{padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: casioMode === 'bilans' ? 'rgba(255,204,0,0.2)' : 'transparent'}}
               >
                  BILANS
               </button>
               <button 
                  onClick={() => { playClick(); setCasioMode('szczegoly'); }} 
                  style={{padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: casioMode === 'szczegoly' ? 'rgba(255,204,0,0.2)' : 'transparent'}}
               >
                  SZCZEGÓŁY
               </button>
               <button 
                  onClick={() => { playClick(); setCasioMode('statystyki'); }} 
                  style={{padding: '2px 8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: casioMode === 'statystyki' ? 'rgba(255,204,0,0.2)' : 'transparent'}}
               >
                  STATYSTYKI
               </button>
            </div>
          </h3>
          {casioMode === 'bilans' ? (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', fontSize: '0.9rem', color: '#33ff33'}}>
              <div>
                <strong style={{color: 'var(--crt-text)'}}>WALUTY I KARTKI (netto/s):</strong>
                <div style={{marginTop: '5px'}}>Złotówki: <span style={{color: plnRate >= 0 ? '#33ff33' : 'var(--prl-red)'}}>{plnRate >= 0 ? '+' : ''}{plnRate.toFixed(2)} zł/s</span></div>
                <div>Dolary: <span style={{color: 'var(--dollar-green)'}}>+{dollarsRate.toFixed(3)} $/s</span></div>
                <div>Kartki: <span style={{color: 'var(--prl-yellow)'}}>+{kartkiRate.toFixed(3)} szt/s</span></div>
              </div>
              <div>
                <strong style={{color: 'var(--crt-text)'}}>TOWARY (szt./sek):</strong>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 15px', marginTop: '5px', maxHeight: '250px', overflowY: 'auto'}}>
                  {Object.entries(itemRates).map(([itemId, rate]) => {
                    if (rate === 0) return null;
                    const name = QUEUE_ITEMS.find(i => i.id === itemId)?.name || itemId;
                    const shortName = name.replace(/ \(.*\)/, '').replace(/"/g, '');
                    return (
                      <div key={itemId} style={{fontSize: '0.8rem'}}>
                        {shortName}: +{rate.toFixed(4)}
                      </div>
                    );
                  })}
                  {Object.values(itemRates).every(r => r === 0) && (
                    <div style={{gridColumn: 'span 2', color: 'var(--prl-gray)'}}>Brak pasywnej produkcji towarów</div>
                  )}
                 </div>
               </div>
             </div>
          ) : casioMode === 'szczegoly' ? (
             <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', fontSize: '0.9rem', color: '#33ff33'}}>
               <div>
                 <strong style={{color: 'var(--crt-text)'}}>PASYWNY PRZYCHÓD (PLN/s):</strong>
                 <div style={{marginTop: '5px'}}>Biznesy (Szklarnie itp.): <span style={{color: '#33ff33'}}>+{businessPlnRate.toFixed(2)} zł/s</span></div>
                 {state.mediaUnlocked && (
                   <div>Wolne Media (Reklamy): <span style={{color: '#33ff33'}}>+{mediaPlnRate.toFixed(2)} zł/s</span></div>
                 )}
                 {state.fazaSUnlocked && (
                   <>
                     <div>Portal Dot-Com (AdSense): <span style={{color: '#33ff33'}}>+{dotcomPlnRate.toFixed(2)} zł/s</span></div>
                     <div>Emigracja (Zmywak UK): <span style={{color: '#33ff33'}}>+{zmywakPlnRate.toFixed(2)} zł/s</span></div>
                   </>
                 )}
                 {state.fazaMUnlocked && (
                   <div>Dywidendy NFI: <span style={{color: '#33ff33'}}>+{nfiPlnRate.toFixed(2)} zł/s</span></div>
                 )}
                 {state.gpwUnlocked && (
                   <div>Dywidendy GPW (śr): <span style={{color: '#33ff33'}}>+{gpwPlnRate.toFixed(2)} zł/s</span></div>
                 )}
                 <div style={{borderTop: '1px dashed #33ff33', marginTop: '8px', paddingTop: '5px'}}>Suma Przychodów: <strong>+{totalPassiveIncome.toFixed(2)} zł/s</strong></div>
               </div>
               <div>
                 <strong style={{color: 'var(--prl-red)'}}>PASYWNE KOSZTY (PLN/s):</strong>
                 <div style={{marginTop: '5px', color: '#ff6666'}}>Prowizje cinkciarza: <span>-{Math.abs(cinkciarzPlnRate).toFixed(2)} zł/s</span></div>
                 {state.fazaNUnlocked && (
                   <div style={{color: '#ff6666'}}>Utrzymanie gangu: <span>-{gangPlnCost.toFixed(2)} zł/s</span></div>
                 )}
                 {state.fazaSUnlocked && chfPlnCost > 0 && (
                   <div style={{color: '#ff6666'}}>Spłata kredytów CHF: <span>-{chfPlnCost.toFixed(2)} zł/s</span></div>
                 )}
                 <div style={{borderTop: '1px dashed var(--prl-red)', marginTop: '8px', paddingTop: '5px', color: 'var(--prl-red)'}}>Suma Kosztów: <strong>-{totalPassiveExpenses.toFixed(2)} zł/s</strong></div>
               </div>
               <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: '1px dashed var(--prl-yellow)', paddingLeft: '15px'}}>
                 <strong style={{color: 'var(--prl-yellow)'}}>BILANS NETTO:</strong>
                 <div style={{fontSize: '1.4rem', color: plnRate >= 0 ? '#33ff33' : 'var(--prl-red)', fontWeight: 'bold', marginTop: '10px'}}>
                   {plnRate >= 0 ? '+' : ''}{plnRate.toFixed(2)} zł/s
                 </div>
                 {plnRate < 0 && (
                   <div style={{fontSize: '0.75rem', color: 'var(--prl-red)', marginTop: '8px', textAlign: 'center', lineHeight: '1.3'}}>
                     ⚠️ Tracisz gotówkę! Zredukuj wydatki (zmniejsz wojsko/spłać CHF) lub zwiększ wpływy (Dot-Com/Media).
                   </div>
                 )}
               </div>
             </div>
          ) : (
             <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 25px', fontSize: '0.9rem', color: '#33ff33'}}>
                <div>
                   <div>Łączne PLN: <span style={{color: 'var(--crt-text)'}}>{Math.floor(state.stats.totalPlnEarned).toLocaleString()} zł</span></div>
                   <div>Łączne Dolary: <span style={{color: 'var(--dollar-green)'}}>${Math.floor(state.stats.totalDollarsEarned).toLocaleString()}</span></div>
                   <div>Max PLN w ręku: <span style={{color: 'var(--crt-text)'}}>{Math.floor(state.stats.maxPlnHeld).toLocaleString()} zł</span></div>
                   <div>Czas w kolejce: <span style={{color: 'var(--prl-yellow)'}}>{Math.floor(state.stats.totalTimeQueued).toLocaleString()} s</span></div>
                </div>
                <div>
                   <div>Sprzedane towary: <span style={{color: 'var(--crt-text)'}}>{state.stats.totalItemsSold.toLocaleString()} szt.</span></div>
                   <div>Wymiany u Cinkciarza: <span style={{color: 'var(--crt-text)'}}>{state.stats.totalCinkciarzExchanges}</span></div>
                   <div>Wydatki na łapówki: <span style={{color: 'var(--prl-red)'}}>{state.stats.totalBribesPaidPln.toLocaleString()} zł</span></div>
                   <div>Naloty Milicji: <span style={{color: 'var(--prl-red)'}}>{state.stats.totalConfiscations}</span></div>
                </div>
                <div>
                   <div>Wpadki na cle: <span style={{color: 'var(--prl-red)'}}>{state.stats.totalCleCatches}</span></div>
                   <div>Udany przemyt: <span style={{color: 'var(--dollar-green)'}}>{state.stats.totalSmugglesCompleted}</span></div>
                   <div>Zakupy na Czarnym Rynku: <span style={{color: 'var(--pewex-blue)'}}>{state.stats.totalBlackMarketPurchases}</span></div>
                   <div>Czas gry (dni PRL): <span style={{color: 'var(--crt-text)'}}>{Math.floor(state.stats.totalTimePlayed / 60)} dni</span></div>
                </div>
             </div>
          )}
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
         <button onClick={() => { playClick(); setCurrentTab('praca'); }} style={{flex: 1, backgroundColor: currentTab === 'praca' ? 'var(--crt-text)' : 'transparent', color: currentTab === 'praca' ? '#000' : 'var(--crt-text)'}}>PRACA / KOLEJKA</button>
         <button onClick={() => { playClick(); setCurrentTab('bazar'); }} style={{flex: 1, backgroundColor: currentTab === 'bazar' ? 'var(--crt-text)' : 'transparent', color: currentTab === 'bazar' ? '#000' : 'var(--crt-text)'}}>BAZAR / CINKCIARZ</button>
         {state.czarnyRynekUnlocked && (
            <button onClick={() => { playClick(); setCurrentTab('czarnyRynek'); }} style={{flex: 1, backgroundColor: currentTab === 'czarnyRynek' ? '#ff33ff' : 'transparent', color: currentTab === 'czarnyRynek' ? '#000' : '#ff33ff', borderColor: '#ff33ff'}}>CZARNY RYNEK</button>
         )}
         <button onClick={() => { playClick(); setCurrentTab('przemyt'); }} style={{flex: 1, backgroundColor: currentTab === 'przemyt' ? 'var(--crt-text)' : 'transparent', color: currentTab === 'przemyt' ? '#000' : 'var(--crt-text)'}}>PRZEMYT / BIZNES</button>
         <button onClick={() => { playClick(); setCurrentTab('partia'); }} style={{flex: 1, backgroundColor: currentTab === 'partia' ? 'var(--crt-text)' : 'transparent', color: currentTab === 'partia' ? '#000' : 'var(--crt-text)'}}>PARTIA / OPOZYCJA</button>
         <button onClick={() => { playClick(); setCurrentTab('odznaczenia'); }} style={{flex: 1, backgroundColor: currentTab === 'odznaczenia' ? 'var(--prl-yellow)' : 'transparent', color: currentTab === 'odznaczenia' ? '#000' : 'var(--prl-yellow)', borderColor: 'var(--prl-yellow)'}}>ODZNACZENIA</button>
         <button onClick={() => { playClick(); setCurrentTab('gpw'); }} style={{flex: 1, backgroundColor: currentTab === 'gpw' ? '#39ff14' : 'transparent', color: currentTab === 'gpw' ? '#000' : '#39ff14', borderColor: '#39ff14'}}>GIEŁDA (GPW)</button>
         {(state.partyRank === 'sekretarz' || state.partyRank === 'dyrektor' || state.partyRank === 'wiceminister' || state.partyRank === 'minister' || state.partyRank === 'biuro' || state.nomenklaturaUnlocked || state.swissAccountUnlocked) && (
            <button onClick={() => { playClick(); setCurrentTab('offshore'); }} style={{flex: 1, backgroundColor: currentTab === 'offshore' ? '#00e1d9' : 'transparent', color: currentTab === 'offshore' ? '#000' : '#00e1d9', borderColor: '#00e1d9'}}>KONTA ZAGRANICZNE</button>
          )}
          {(state.nomenklaturaUnlocked || state.swissAccountUnlocked) && (
            <button onClick={() => { playClick(); setCurrentTab('syndykat'); }} style={{flex: 1, backgroundColor: currentTab === 'syndykat' ? '#c0392b' : 'transparent', color: currentTab === 'syndykat' ? '#fff' : '#c0392b', borderColor: '#c0392b'}}>SYNDYKAT EKSPORTOWY</button>
          )}
          {(state.electionsUnlocked || state.solidarnos >= 10000) && (
            <button onClick={() => { playClick(); setCurrentTab('wybory'); }} style={{flex: 1, backgroundColor: currentTab === 'wybory' ? '#ffffff' : 'transparent', color: currentTab === 'wybory' ? '#d63031' : '#ffffff', borderColor: '#d63031'}}>WYBORY 4 CZERWCA</button>
          )}
          {(state.fazaMUnlocked || state.electionsPhase === 'completed') && (
            <button onClick={() => { playClick(); setCurrentTab('lata90'); }} style={{flex: 1, backgroundColor: currentTab === 'lata90' ? '#f1c40f' : 'transparent', color: currentTab === 'lata90' ? '#000' : '#f1c40f', borderColor: '#f1c40f'}}>LATA 90.</button>
          )}
          {(state.fazaMUnlocked || state.fazaNUnlocked) && (
            <button onClick={() => { playClick(); setCurrentTab('miasto'); }} style={{flex: 1, backgroundColor: currentTab === 'miasto' ? '#8e44ad' : 'transparent', color: currentTab === 'miasto' ? '#fff' : '#8e44ad', borderColor: '#8e44ad'}}>MIASTO (GANGI)</button>
          )}
          {state.fazaSUnlocked && (
            <button onClick={() => { playClick(); setCurrentTab('lata2000'); }} style={{flex: 1, backgroundColor: currentTab === 'lata2000' ? '#ffffff' : 'transparent', color: currentTab === 'lata2000' ? '#3498db' : '#ffffff', borderColor: '#3498db'}}>LATA 2000.</button>
          )}
      </div>

      <div className="game-grid" style={{gridTemplateColumns: '1fr'}}>
        
        {/* TAB: PRACA / KOLEJKA */}

        {currentTab === 'lata2000' && (() => {
          return (
            <div style={{ padding: '15px', backgroundColor: '#2c3e50', color: '#ecf0f1', fontFamily: '"Tahoma", sans-serif', borderRadius: '4px' }}>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#34495e', padding: '15px', borderRadius: '4px', border: '1px solid #3498db', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '2.5em', marginBottom: '10px' }}>🇪🇺</div>
                  <h2 style={{ margin: 0, color: '#3498db', textAlign: 'center' }}>LATA 2000.</h2>
                  <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#bdc3c7', textAlign: 'center' }}>Unia Europejska, Dot-comy, Deweloperka i Zmywak.</div>
                </div>

                <div style={{ flex: 2, minWidth: '300px', backgroundColor: '#34495e', padding: '15px', borderRadius: '4px', border: '1px solid #7f8c8d', display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Kurs CHF/PLN:</span>
                    <strong style={{ fontSize: '1.2em', color: state.chfExchangeRate > 3.0 ? '#e74c3c' : '#2ecc71' }}>{state.chfExchangeRate.toFixed(2)} PLN</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Dług w CHF:</span>
                    <strong style={{ fontSize: '1.2em', color: '#e74c3c' }}>{state.chfDebt.toLocaleString()} CHF</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Gotówka:</span>
                    <strong style={{ fontSize: '1.2em', color: '#2ecc71' }}>{state.pln.toLocaleString()} PLN</strong>
                  </div>
                </div>
              </div>

              {/* SUB-TAB NAV */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
                <button onClick={() => { playClick(); setLata2000SubTab('ue'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'ue' ? '#3498db' : '#2c3e50', color: lata2000SubTab === 'ue' ? '#fff' : '#bdc3c7' }}>
                  🇪🇺 DOTACJE UE & SKARBÓWKA
                </button>
                <button onClick={() => { playClick(); setLata2000SubTab('dotcom'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'dotcom' ? '#3498db' : '#2c3e50', color: lata2000SubTab === 'dotcom' ? '#fff' : '#bdc3c7' }}>
                  🌐 PORTAL DOT-COM
                </button>
                <button onClick={() => { playClick(); setLata2000SubTab('deweloperka'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'deweloperka' ? '#3498db' : '#2c3e50', color: lata2000SubTab === 'deweloperka' ? '#fff' : '#bdc3c7' }}>
                  🏗️ DEWELOPERKA & CHF
                </button>
                <button onClick={() => { playClick(); setLata2000SubTab('zmywak'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'zmywak' ? '#3498db' : '#2c3e50', color: lata2000SubTab === 'zmywak' ? '#fff' : '#bdc3c7' }}>
                  ✈️ EMIGRACJA (ZMYWAK)
                </button>
              </div>

              {/* SUB-TABS CONTENT */}
              {lata2000SubTab === 'ue' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #3498db', paddingBottom: '5px', color: '#3498db' }}>Wnioski o Dotacje Unijne</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {EU_PROJECTS.map(proj => {
                        const active = state.activeEuProjects.find(p => p.projectId === proj.id);
                        const costOwn = Math.floor(proj.costPln * (1 - proj.euGrantPercent));
                        const canBuy = state.pln >= costOwn && !active;
                        
                        return (
                          <div key={proj.id} style={{ padding: '15px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '1.1em', color: '#fff' }}>{proj.name}</strong>
                              <span style={{ fontSize: '0.85em', color: '#f1c40f', fontWeight: 'bold' }}>Zwrot: {(proj.euGrantPercent * 100).toFixed(0)}%</span>
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '8px 0' }}>{proj.desc}</div>
                            
                            {!active ? (
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                <span style={{ fontSize: '0.85em', color: '#ecf0f1' }}>Wkład własny: <strong>{costOwn.toLocaleString()} PLN</strong></span>
                                <button onClick={() => startEuProject(proj.id)} disabled={!canBuy} style={{ padding: '6px 12px', fontSize: '0.85em', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                  Wyślij Wniosek ({proj.durationSec}s)
                                </button>
                              </div>
                            ) : (
                              <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#34495e', borderRadius: '4px', borderLeft: '4px solid #f1c40f' }}>
                                <div style={{ fontSize: '0.85em', color: '#fff', marginBottom: '5px' }}>⏳ Projekt w realizacji...</div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: '#2c3e50', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.max(0, 100 - (active.timeLeft / proj.durationSec) * 100)}%`, height: '100%', backgroundColor: '#f1c40f' }} />
                                </div>
                                <div style={{ fontSize: '0.75em', color: '#bdc3c7', marginTop: '3px', textAlign: 'right' }}>{active.timeLeft.toFixed(1)}s</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e74c3c', paddingBottom: '5px', color: '#e74c3c' }}>Urząd Skarbowy & OLAF</h3>
                    <p style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Każda rozliczona dotacja zwiększa ryzyko audytu i kontroli. Przekroczenie 50% ryzyka grozi gigantyczną karą (konfiskata 30% środków).</p>
                    
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Ryzyko Kontroli:</span>
                        <strong style={{ color: state.euAuditRisk > 50 ? '#e74c3c' : '#f1c40f' }}>{state.euAuditRisk.toFixed(0)}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '10px', backgroundColor: '#34495e', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${state.euAuditRisk}%`, height: '100%', backgroundColor: state.euAuditRisk > 50 ? '#e74c3c' : '#f1c40f' }} />
                      </div>
                      
                      <button onClick={bribeEuAuditor} disabled={state.pln < 500000 || state.euAuditRisk <= 0} style={{ width: '100%', marginTop: '15px', padding: '10px', fontSize: '0.9em', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 500000 && state.euAuditRisk > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                        Wręcz Kopertę Audytorowi (-500 000 PLN)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {lata2000SubTab === 'dotcom' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #2ecc71', paddingBottom: '5px', color: '#2ecc71' }}>Twój Portal Internetowy</h3>
                    
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#bdc3c7' }}>Aktywni Użytkownicy:</span>
                        <strong style={{ color: '#2ecc71', fontSize: '1.2em' }}>{state.dotcomUsers.toLocaleString()}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#bdc3c7' }}>Pojemność Serwerów:</span>
                        <strong style={{ color: '#fff' }}>{state.dotcomServerCapacity.toLocaleString()}</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: '#34495e', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, (state.dotcomUsers / state.dotcomServerCapacity) * 100)}%`, height: '100%', backgroundColor: state.dotcomUsers >= state.dotcomServerCapacity ? '#e74c3c' : '#2ecc71' }} />
                      </div>
                    </div>

                    <h4 style={{ color: '#bdc3c7', borderBottom: '1px solid #465c71', paddingBottom: '5px' }}>Ulepszenia i Infrastruktura</h4>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {DOTCOM_UPGRADES.map(upg => {
                        const isOwned = state.dotcomUpgrades[upg.id];
                        const canBuy = state.pln >= upg.costPln && !isOwned;
                        return (
                          <div key={upg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', borderRadius: '6px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71') }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#fff' }}>{upg.name}</div>
                              <div style={{ fontSize: '0.75em', color: '#bdc3c7' }}>{upg.desc}</div>
                            </div>
                            {isOwned ? (
                              <span style={{ fontSize: '0.8em', color: '#2ecc71', fontWeight: 'bold' }}>POSIADASZ</span>
                            ) : (
                              <button onClick={() => buyDotcomUpgrade(upg.id)} disabled={!canBuy} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                Kup ({upg.costPln.toLocaleString()} PLN)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {lata2000SubTab === 'deweloperka' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e67e22', paddingBottom: '5px', color: '#e67e22' }}>Inwestycje Deweloperskie</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {REAL_ESTATE_PROJECTS.map(proj => {
                        const owned = state.realEstateOwned[proj.id] || 0;
                        const canBuyCash = state.pln >= proj.costPln;
                        const neededChf = Math.ceil(proj.costPln / state.chfExchangeRate);
                        // Kredyt bierzemy "w ciemno"
                        
                        return (
                          <div key={proj.id} style={{ padding: '15px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '1.1em', color: '#fff' }}>{proj.name}</strong>
                              <span style={{ fontSize: '0.85em', color: '#2ecc71', fontWeight: 'bold' }}>Sprzedaż: {proj.sellRevenuePln.toLocaleString()} PLN</span>
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '8px 0' }}>{proj.desc}</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                              <span style={{ fontSize: '0.85em', color: '#ecf0f1' }}>Posiadasz: <strong>{owned} szt.</strong></span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => buyRealEstate(proj.id, false)} disabled={!canBuyCash} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuyCash ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                  Kup ({proj.costPln.toLocaleString()} PLN)
                                </button>
                                <button onClick={() => buyRealEstate(proj.id, true)} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} title={`Pobierze ${neededChf.toLocaleString()} CHF kredytu`}>
                                  Kredyt CHF
                                </button>
                                <button onClick={() => sellRealEstate(proj.id)} disabled={owned <= 0} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: owned > 0 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                  Sprzedaj
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 10px 0', borderBottom: '2px solid #e74c3c', paddingBottom: '5px', color: '#e74c3c' }}>Zadłużenie CHF & Bank</h3>
                      <p style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '0 0 10px 0' }}>Bierz kredyty, spłacaj zadłużenie po kursie restrukturyzacyjnym lub wynajmuj doradców finansowych redukujących raty.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button onClick={() => takeChfMortgage(1000000)} style={{ padding: '10px', fontSize: '0.9em', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Zaciągnij 1 000 000 CHF
                        </button>
                        <button onClick={() => takeChfMortgage(5000000)} style={{ padding: '10px', fontSize: '0.9em', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                          Zaciągnij 5 000 000 CHF
                        </button>
                        <button onClick={restructureChfDebt} disabled={state.chfDebt < 500000} style={{ padding: '10px', fontSize: '0.9em', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.chfDebt >= 500000 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                          Przewalutuj 500k CHF (karny kurs)
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #465c71', paddingTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.9em', color: '#fff' }}>Doradcy Bankowi:</span>
                        <strong style={{ color: '#f1c40f' }}>{state.bankAdvisors || 0} / 3</strong>
                      </div>
                      <div style={{ fontSize: '0.8em', color: '#bdc3c7', marginBottom: '10px' }}>Zatrudnienie doradcy zmniejsza raty CHF o 15% (max -45%).</div>
                      <button onClick={hireBankAdvisor} disabled={state.pln < 200000 || (state.bankAdvisors || 0) >= 3} style={{ width: '100%', padding: '8px', fontSize: '0.85em', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: (state.pln >= 200000 && (state.bankAdvisors || 0) < 3) ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                        Zatrudnij doradcę (200k PLN)
                      </button>
                    </div>
                  </div>

                  {/* SPEKULACJA OPCJAMI (T8) */}
                  <div style={{ flex: 1.2, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #9b59b6', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #9b59b6', paddingBottom: '5px', color: '#9b59b6' }}>Opcje Walutowe (Hedge)</h3>
                    <p style={{ fontSize: '0.85em', color: '#bdc3c7', marginBottom: '15px' }}>Kupuj opcje spekulacyjne zabezpieczające przed wzrostami franka. Rozliczają się automatycznie.</p>
                    
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                      {CURRENCY_OPTION_PRESETS.map(opt => {
                        const canBuy = state.pln >= opt.premiumPln;
                        return (
                          <div key={opt.id} style={{ padding: '10px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '0.9em', color: '#fff' }}>{opt.name}</strong>
                              <span style={{ fontSize: '0.8em', color: '#9b59b6', fontWeight: 'bold' }}>{opt.amountChf / 1000000}M CHF</span>
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#bdc3c7', margin: '4px 0' }}>{opt.desc}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                              <span style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Premia: <strong>{opt.premiumPln === 0 ? 'DARMOWA*' : `${opt.premiumPln.toLocaleString()} PLN`}</strong></span>
                              <button onClick={() => buyCurrencyOption(opt.id)} disabled={!canBuy} style={{ padding: '4px 10px', fontSize: '0.75em', backgroundColor: '#9b59b6', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                Kup ({opt.durationSec}s)
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {state.currencyOptions.length > 0 && (
                      <div style={{ borderTop: '1px solid #465c71', paddingTop: '10px' }}>
                        <strong style={{ fontSize: '0.85em', color: '#fff' }}>Aktywne Kontrakty:</strong>
                        <div style={{ display: 'grid', gap: '5px', marginTop: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                          {state.currencyOptions.map(opt => (
                            <div key={opt.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '6px', borderRadius: '4px', borderLeft: '3px solid #9b59b6', fontSize: '0.8em' }}>
                              <span>{opt.type.toUpperCase()} ({opt.amountChf.toLocaleString()} CHF @ {opt.strikeRate.toFixed(2)})</span>
                              <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{opt.timeLeft.toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* OKAZJE KRYZYSOWE (T9) */}
                  {(state.recessionActive || Object.values(state.crisisRealEstateOwned).some(count => count > 0)) && (
                    <div style={{ flex: 1.5, minWidth: '340px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #e67e22', borderRadius: '6px' }}>
                      <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e67e22', paddingBottom: '5px', color: '#e67e22' }}>Okazje Kryzysowe (Licytacje)</h3>
                      
                      {state.recessionActive ? (
                        <div style={{ marginBottom: '15px' }}>
                          <p style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '0 0 10px 0' }}>Deweloperzy tracą płynność finansową. Odkup niedokończone budowy od syndyka za bezcen. Wykończ i sprzedaj z zyskiem po recesji!</p>
                          <div style={{ display: 'grid', gap: '10px' }}>
                            {CRISIS_REAL_ESTATE.map(proj => {
                              const unfinishedCount = state.crisisRealEstateOwned[`${proj.id}_unfinished`] || 0;
                              const finishedCount = state.crisisRealEstateOwned[`${proj.id}_finished`] || 0;
                              const canBuy = state.pln >= proj.buyCostPln;
                              return (
                                <div key={proj.id} style={{ padding: '10px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <strong style={{ fontSize: '0.9em', color: '#fff' }}>{proj.name}</strong>
                                    <span style={{ fontSize: '0.8em', color: '#e67e22', fontWeight: 'bold' }}>Syndyk: {proj.buyCostPln.toLocaleString()} PLN</span>
                                  </div>
                                  <div style={{ fontSize: '0.75em', color: '#bdc3c7', margin: '4px 0' }}>{proj.desc}</div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                    <span style={{ fontSize: '0.75em', color: '#fff' }}>Posiadasz: {unfinishedCount} rozgrz. / {finishedCount} got.</span>
                                    <button onClick={() => buyCrisisRealEstate(proj.id)} disabled={!canBuy} style={{ padding: '4px 10px', fontSize: '0.75em', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                      Licytuj
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '10px', backgroundColor: '#2c3e50', borderRadius: '6px', borderLeft: '4px solid #2ecc71', color: '#bdc3c7', fontSize: '0.85em', marginBottom: '15px' }}>
                          Rynek się stabilizuje. Nowe oferty syndyka pojawią się podczas kolejnego krachu. Możesz wykończyć posiadane budowy lub je sprzedać.
                        </div>
                      )}

                      {/* Zarządzanie posiadanymi nieruchomościami kryzysowymi */}
                      {Object.entries(state.crisisRealEstateOwned).some(([_, count]) => count > 0) && (
                        <div style={{ borderTop: '1px solid #465c71', paddingTop: '10px' }}>
                          <strong style={{ fontSize: '0.85em', color: '#fff' }}>Zarządzaj budowami kryzysowymi:</strong>
                          <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
                            {CRISIS_REAL_ESTATE.map(proj => {
                              const unfinished = state.crisisRealEstateOwned[`${proj.id}_unfinished`] || 0;
                              const finished = state.crisisRealEstateOwned[`${proj.id}_finished`] || 0;
                              if (unfinished === 0 && finished === 0) return null;
                              return (
                                <div key={proj.id} style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #465c71' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em', color: '#fff', fontWeight: 'bold' }}>
                                    <span>{proj.name}</span>
                                    <span style={{ color: '#e67e22' }}>{unfinished} rozgrz. / {finished} ukończ.</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'flex-end' }}>
                                    {unfinished > 0 && (
                                      <button onClick={() => finishCrisisRealEstate(proj.id)} disabled={state.pln < proj.finishCostPln} style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= proj.finishCostPln ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                        Dokończ ({(proj.finishCostPln/1000000).toFixed(0)}M PLN)
                                      </button>
                                    )}
                                    {finished > 0 && (
                                      <button onClick={() => sellCrisisRealEstate(proj.id)} disabled={state.recessionActive} style={{ padding: '4px 8px', fontSize: '0.75rem', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: !state.recessionActive ? 'pointer' : 'not-allowed', fontWeight: 'bold' }} title={state.recessionActive ? 'Rynek zamrożony w trakcie krachu!' : 'Sprzedaj za gotówkę'}>
                                        Sprzedaj ({(proj.sellRevenuePln/1000000).toFixed(0)}M PLN)
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {lata2000SubTab === 'zmywak' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#f1c40f' }}>Agencja Pracy: Bilet do Londynu</h3>
                    <p style={{ color: '#bdc3c7', fontSize: '1.05em' }}>Polska w UE to otwarte granice! Wyślij rodaków do pracy w UK lub Irlandii. Pobierasz drobną prowizję od ich zarobków w funtach (GBP).</p>
                    <div style={{ margin: '20px 0', fontSize: '1.2em', color: '#ecf0f1' }}>
                      Wysłanych pracowników: <strong style={{ color: '#f1c40f', fontSize: '1.5em' }}>{state.zmywakWorkers.toLocaleString()}</strong>
                    </div>
                    <div style={{ marginBottom: '20px', fontSize: '0.9em', color: '#2ecc71' }}>
                      Pasywny przychód: <strong>+{Math.floor(state.zmywakWorkers * 5 * 0.15 * 6).toLocaleString()} PLN/s</strong>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => sendWorkerToZmywak(1)} disabled={state.pln < 2000} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 2000 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Wyslij 1 osobę (2 000 PLN)</button>
                      <button onClick={() => sendWorkerToZmywak(100)} disabled={state.pln < 200000} style={{ padding: '10px 20px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 200000 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Wyślij 100 osób (200 tys. PLN)</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })()}
        {currentTab === 'praca' && (
           <div className="flex-col gap-4">
              <div className="panel">
                 <h2>PRACA PAŃSTWOWA</h2>
                 <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Klikaj, aby zarobić na start i zdobyć kartki!</p>
                 <button onClick={pracuj} style={{padding: '15px', fontSize: '1.1rem', width: '100%'}}>
                    Idź do pracy (+5 zł, 10% szans na Kartkę)
                 </button>
              </div>

              <div className="panel">
                 <h2>ULEPSZENIA ZA ZŁOTÓWKI</h2>
                 <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                   {PLN_UPGRADES.map(u => {
                      const owned = state.plnUpgrades[u.id];
                      const inflationMult = 1 + (state.inflationPercent / 100);
                      const realCost = Math.floor(u.costPln * inflationMult);
                      return (
                         <div key={u.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                            <div className="flex-col">
                               <span>{u.name}</span>
                               <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{u.desc}</span>
                            </div>
                            <button 
                               disabled={owned || state.pln < realCost}
                               onClick={() => {
                                  playClick();
                                  updateState(s => ({
                                     ...s,
                                     pln: s.pln - realCost,
                                     plnUpgrades: { ...s.plnUpgrades, [u.id]: true }
                                  }));
                               }}
                            >
                               {owned ? "KUPIONE" : `${realCost} zł`}
                            </button>
                         </div>
                      );
                   })}
                 </div>
              </div>

              <div className="panel">
                <h2>STACZ W KOLEJCE</h2>
                <p className="text-red" style={{fontSize: '0.9rem', marginBottom: '10px'}}>
                  {(activeQueue && activeQueue2) ? "Aktualnie stoisz w dwóch kolejkach..." : (activeQueue || activeQueue2) ? "Aktualnie stoisz w kolejce..." : "Wybierz towar:"}
                </p>
                
                <div style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '10px'}}>
                  {QUEUE_ITEMS.map(item => {
                    const inflationMult = 1 + (state.inflationPercent / 100);
                    let baseCost = item.costPln;
                    if (state.activeEvent === 'podwyzki') baseCost = Math.floor(item.costPln * 1.5);
                    else if (state.activeEvent === 'uwolnienie_cen') baseCost = item.costPln * 2;
                    const cost = Math.floor(baseCost * inflationMult);
                    return (
                      <div key={item.id} className="flex-col gap-2" style={{marginBottom: '15px', borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                        <div className="flex justify-between items-center">
                          <div>
                             <span>{item.name}</span>
                             <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>
                                Koszt: {cost} zł {item.kartkiCost ? `+ ${isKartkiRequired(item) ? item.kartkiCost : 0} kartek` : ''}
                                {!isKartkiRequired(item) && item.kartkiCost && <span style={{color: 'var(--dollar-green)', marginLeft: '5px'}}>(BEZ KARTKI!)</span>}
                                {state.activeEvent === 'podwyzki' && <span style={{color: 'var(--prl-red)', marginLeft: '5px'}}>(PODWYŻKA!)</span>}
                             </div>
                          </div>
                          <button 
                            disabled={
                              (!state.pewexItems['podwojna_kolejka'] && !!activeQueue) || 
                              (!!activeQueue && !!activeQueue2) || 
                              state.pln < cost || 
                              (isKartkiRequired(item) && state.kartki < (item.kartkiCost || 0))
                            } 
                            onClick={() => startQueue(item.id, item.costPln, item.kartkiCost || 0)}
                          >
                            Stój
                          </button>
                        </div>
                        {activeQueue === item.id && (
                          <div style={{width: '100%', height: '10px', background: '#222', marginTop: '5px'}}>
                            <div style={{width: `${queueProgress}%`, height: '100%', background: '#33ff33'}} />
                          </div>
                        )}
                        {activeQueue2 === item.id && (
                          <div style={{width: '100%', height: '10px', background: '#222', marginTop: '5px'}}>
                            <div style={{width: `${queueProgress2}%`, height: '100%', background: '#ff33ff'}} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
           </div>
        )}

        {/* TAB: BAZAR / CINKCIARZ */}
        {currentTab === 'bazar' && (
           <div className="flex-col gap-4">
              <div className="panel">
                <h2>BAZAR (SPRZEDAŻ)</h2>
                <div style={{maxHeight: '500px', overflowY: 'auto', paddingRight: '10px'}}>
                  {QUEUE_ITEMS.map(item => {
                    const amount = Math.floor(state.inventory[item.id] || 0);
                    if (amount === 0) return null;
                    
                    let multiplier = 1;
                    if (state.pewexItems['donald']) multiplier *= 1.15;
                    if (state.pewexItems['wrangler']) multiplier *= 1.5;
                    if (state.pewexItems['rubin']) multiplier *= 2.0;
                    if (state.activeEvent === 'czarnobyl') multiplier *= 0.7; // Czarnobyl (-30% wartości)
                    
                    const ecoPlnMult = 1 + (state.unlockedAchievements?.['eco_pln_1'] ? 0.05 : 0) + (state.unlockedAchievements?.['eco_pln_2'] ? 0.10 : 0) + (state.unlockedAchievements?.['eco_pln_3'] ? 0.20 : 0);
                    const presTimeMult = 1 + (state.unlockedAchievements?.['pres_time_1'] ? 0.10 : 0) + (state.unlockedAchievements?.['pres_time_2'] ? 0.25 : 0);
                    const transformMult = state.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
                    const solidarityBazarMult = state.solidarnos >= 500 ? 1.05 : 1.0;
                    const importMult = state.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
                    
                    if (state.activeEvent === 'uwolnienie_cen') multiplier *= 2.5;
                    const inflationFactor = 1 + (state.inflationPercent / 100);
                    multiplier = multiplier * ecoPlnMult * presTimeMult * transformMult * solidarityBazarMult * importMult;
                    const sellP = Math.floor(item.sellPricePln * multiplier * inflationFactor);
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                        <span>{item.name} (Masz: {amount})</span>
                        <div className="flex gap-2">
                           <button onClick={() => sellItem(item.id, item.sellPricePln, 1)}>x1 (+{sellP} zł)</button>
                           {state.plnUpgrades['wozek'] && amount >= 10 && (
                              <button onClick={() => sellItem(item.id, item.sellPricePln, 10)}>x10 (+{sellP*10} zł)</button>
                           )}
                           {state.plnUpgrades['torba'] && amount >= 100 && (
                              <button onClick={() => sellItem(item.id, item.sellPricePln, 100)}>x100 (+{sellP*100} zł)</button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {PRODUCED_ITEMS.map(item => {
                    const amount = Math.floor(state.inventory[item.id] || 0);
                    if (amount === 0) return null;
                    
                    let multiplier = 1;
                    if (state.pewexItems['donald']) multiplier *= 1.15;
                    if (state.pewexItems['wrangler']) multiplier *= 1.5;
                    if (state.pewexItems['rubin']) multiplier *= 2.0;
                    if (state.activeEvent === 'czarnobyl') multiplier *= 0.7;
                    
                    const ecoPlnMult = 1 + (state.unlockedAchievements?.['eco_pln_1'] ? 0.05 : 0) + (state.unlockedAchievements?.['eco_pln_2'] ? 0.10 : 0) + (state.unlockedAchievements?.['eco_pln_3'] ? 0.20 : 0);
                    const presTimeMult = 1 + (state.unlockedAchievements?.['pres_time_1'] ? 0.10 : 0) + (state.unlockedAchievements?.['pres_time_2'] ? 0.25 : 0);
                    const transformMult = state.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
                    const solidarityBazarMult = state.solidarnos >= 500 ? 1.05 : 1.0;
                    const importMult = state.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
                    const peklimaxMult = (state.baltonaUpgrades?.['peklimax'] && (item.id === 'gozdziki' || item.id === 'czesci' || item.id === 'wyroby_hutnicze')) ? 1.40 : 1.0;
                    
                    if (state.activeEvent === 'uwolnienie_cen') multiplier *= 2.5;
                    const inflationFactor = 1 + (state.inflationPercent / 100);
                    const plnMultiplier = multiplier * ecoPlnMult * presTimeMult * transformMult * solidarityBazarMult * importMult * peklimaxMult;
                    const usdMultiplier = multiplier * importMult * peklimaxMult;
                    
                    const sellP = item.sellPricePln ? Math.floor(item.sellPricePln * plnMultiplier * inflationFactor) : 0;
                    const sellD = item.sellPriceDollars ? Math.floor(item.sellPriceDollars * usdMultiplier) : 0;
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px', borderColor: 'var(--dollar-green)'}}>
                        <span style={{color: 'var(--dollar-green)'}}>{item.name} (Masz: {amount})</span>
                        <div className="flex gap-2">
                           {item.sellPricePln ? (
                             <>
                               <button onClick={() => sellItem(item.id, item.sellPricePln!, 1)}>x1 (+{sellP} zł)</button>
                               {state.plnUpgrades['wozek'] && amount >= 10 && (
                                  <button onClick={() => sellItem(item.id, item.sellPricePln!, 10)}>x10 (+{sellP*10} zł)</button>
                               )}
                               {state.plnUpgrades['torba'] && amount >= 100 && (
                                  <button onClick={() => sellItem(item.id, item.sellPricePln!, 100)}>x100 (+{sellP*100} zł)</button>
                               )}
                             </>
                           ) : (
                             <>
                               <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 1)}>x1 (+${sellD})</button>
                               {state.plnUpgrades['wozek'] && amount >= 10 && (
                                  <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 10)}>x10 (+${sellD*10})</button>
                               )}
                               {state.plnUpgrades['torba'] && amount >= 100 && (
                                  <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 100)}>x100 (+${sellD*100})</button>
                               )}
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(state.inventory).every(v => v < 1) && (
                     <p style={{color: 'var(--prl-gray)'}}>Nie masz nic na sprzedaż. Idź postać w kolejce.</p>
                  )}
                </div>
              </div>

              <div className="panel">
                <h2>CINKCIARZ (KANTOR)</h2>
                <div className="flex justify-between items-center text-dollar" style={{marginBottom: '10px'}}>
                  <span>Aktualny kurs:</span>
                  <span>
                    1$ = {state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : Math.floor(state.exchangeRate)} zł
                    {state.activeEvent === 'drozyzna' && <span style={{color: 'var(--prl-red)', marginLeft: '5px'}}>(INFLACJA!)</span>}
                  </span>
                </div>
                <button 
                  disabled={state.pln < (state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate)}
                  onClick={() => {
                    updateState(s => {
                      const currentRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
                      if (s.pln >= currentRate) {
                        const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
                        const suspAdd = s.partyRank === 'minister' || s.activeEvent === 'odwilz' ? 0 : Math.max(0, Math.floor(2 * luxurySuspMult));
                        return { ...s, pln: s.pln - currentRate, dollars: s.dollars + 1, suspicion: s.suspicion + suspAdd };
                      }
                      return s;
                    });
                  }}
                  style={{width: '100%'}}
                >
                  Kup 1$ (-{state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : Math.floor(state.exchangeRate)} zł)
                </button>
              </div>

              <div className="panel">
                <h2>SKLEP REJONOWY / SKUP W WALUCIE</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>
                  Sprzedawaj towary państwu w zamian za bony towarowe (Talony) lub wymieniaj towary z ZSRR na Ruble.
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px'}}>
                  <div>
                    <h3 style={{fontSize: '0.9rem', color: '#5bc0de', marginTop: 0}}>Dostawy do Sklepu Rejonowego</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>10x Papier Toaletowy</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['papier'] || 0) < 10} onClick={() => deliverForTalony('papier', 10, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>5x Mydło "Biały Jeleń"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['mydlo'] || 0) < 5} onClick={() => deliverForTalony('mydlo', 5, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>3x Cukier (1kg)</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['cukier'] || 0) < 3} onClick={() => deliverForTalony('cukier', 3, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Dżinsy "Odra"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['dzinsy'] || 0) < 1} onClick={() => deliverForTalony('dzinsy', 1, 2)}>+2 Talony</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Radio "Kasprzak"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['kasprzak'] || 0) < 1} onClick={() => deliverForTalony('kasprzak', 1, 5)}>+5 Talonów</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x TV "Neptun"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['neptun'] || 0) < 1} onClick={() => deliverForTalony('neptun', 1, 10)}>+10 Talonów</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style={{fontSize: '0.9rem', color: '#ff4500', marginTop: 0}}>Wymiana z ZSRR</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Spirytus (0.5l)</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['spirytus'] || 0) < 1} onClick={() => deliverForRuble('spirytus', 1, 5)}>+5 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Buty "Relaks"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['relaks'] || 0) < 1} onClick={() => deliverForRuble('relaks', 1, 10)}>+10 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Radio "Kasprzak"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['kasprzak'] || 0) < 1} onClick={() => deliverForRuble('kasprzak', 1, 25)}>+25 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Aparat "Zorki"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['zorki'] || 0) < 1} onClick={() => deliverForRuble('zorki', 1, 40)}>+40 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Pralka "Frania"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['frania'] || 0) < 1} onClick={() => deliverForRuble('frania', 1, 60)}>+60 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Skuter "Osa"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['osa'] || 0) < 1} onClick={() => deliverForRuble('osa', 1, 100)}>+100 Rubli</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
           </div>
        )}

        {/* TAB: CZARNY RYNEK */}
        {currentTab === 'czarnyRynek' && (
           <div className="flex-col gap-4">
              {/* NOWY PANEL KANTOR & SPEKULACJA (1989) */}
              {state.activeDestination === 'usa' ? (
                <div className="panel" style={{borderColor: 'var(--dollar-green)', marginBottom: '20px'}}>
                  <h2 style={{color: 'var(--dollar-green)'}}>KANTOR, SPEKULACJA & OBLIGACJE (1989)</h2>
                  <p style={{fontSize: '0.85rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                    Hiperinflacja niszczy wartość złotówki! Wymieniaj dewizy, spekuluj hurtowym towarem i kupuj obligacje indeksowane, by ratować majątek przed dewaluacją.
                  </p>

                  <div className="game-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', border: 'none', background: 'transparent', padding: 0}}>
                    {/* SEKCJA 1: DYNAMICZNY KANTOR WALUTOWY */}
                    <div className="panel" style={{borderColor: '#85bb65', padding: '10px'}}>
                      <h3 style={{color: '#85bb65', fontSize: '1rem', marginTop: 0}}>CINKCIARZ 2.0 (KURS: {Math.floor(state.exchangeRate * (1 + state.inflationPercent/100))} zł)</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Dolar ($):</span>
                          <span>Sprzedaż: {Math.floor(state.exchangeRate * (1 + state.inflationPercent/100) * 0.95)} zł</span>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Bon Pewex (1$):</span>
                          <div className="flex gap-1">
                            <button onClick={() => buyBonyPewex(1)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (1 bon)</button>
                            <button onClick={() => sellBonyPewex(1)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Sprzedaj</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Srebro (1 oz):</span>
                          <div className="flex gap-1">
                            <button onClick={() => buyAsset('srebro', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (10k zł)</button>
                            <button onClick={() => sellAsset('srebro', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Wycofaj (2.5$)</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Krugerrand (1 oz):</span>
                          <div className="flex-col gap-1">
                            <div className="flex gap-1">
                              <button onClick={() => buyAsset('krugerrand', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (PLN)</button>
                              <button onClick={() => buyAsset('krugerrand', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (400$)</button>
                            </div>
                            <button onClick={() => sellAsset('krugerrand', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem', marginTop: '2px', width: '100%'}}>Sprzedaj ({state.inflationUpgrades?.['licencjaDewizowa'] ? 390 : 380}$)</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Sztabka Złota (5 oz):</span>
                          <div className="flex-col gap-1">
                            <div className="flex gap-1">
                              <button onClick={() => buyAsset('sztabkaZlota', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (PLN)</button>
                              <button onClick={() => buyAsset('sztabkaZlota', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (2000$)</button>
                            </div>
                            <button onClick={() => sellAsset('sztabkaZlota', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem', marginTop: '2px', width: '100%'}}>Sprzedaj ({state.inflationUpgrades?.['licencjaDewizowa'] ? 1975 : 1950}$)</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEKCJA 2: OBLIGACJE INFLACYJNE */}
                    <div className="panel" style={{borderColor: '#ffd700', padding: '10px'}}>
                      <h3 style={{color: '#ffd700', fontSize: '1rem', marginTop: 0}}>PAPIERY WARTOŚCIOWE</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        <div className="flex-col" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <div className="flex justify-between items-center">
                            <strong>Obligacje PRL (Nominalne)</strong>
                            <button onClick={buyBondPRL} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(50000 * (1 + state.inflationPercent/100))} zł)</button>
                          </div>
                          <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Masz: {state.bondPrlCount || 0} szt. | Zysk: +{((state.bondPrlCount || 0) * 2000).toLocaleString()} zł/s</span>
                        </div>
                        <div className="flex-col">
                          <div className="flex justify-between items-center">
                            <strong>Obligacje Solidarności (Indeksowane)</strong>
                            <div className="flex gap-1">
                              <button onClick={() => buyBondSolidarnos('pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>PLN</button>
                              <button onClick={() => buyBondSolidarnos('dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>100$</button>
                            </div>
                          </div>
                          <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Masz: {state.bondSolCount || 0} szt. | Oprocentowanie: +{(state.inflationPercent + 5).toFixed(1)}%/s</span>
                          {state.bondSolCount > 0 && (
                            <div className="flex justify-between items-center style-button" style={{marginTop: '5px', background: 'rgba(255, 215, 0, 0.1)', padding: '5px'}}>
                              <span>Wartość: {Math.floor(state.bondSolValue || 0).toLocaleString()} zł</span>
                              <button onClick={redeemSolidarnosBonds} style={{padding: '2px 5px', fontSize: '0.75rem', borderColor: '#ffd700', color: '#ffd700'}}>Wykup</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SEKCJA 3: SPEKULACJA TOWAROWA */}
                    <div className="panel" style={{borderColor: '#ff33ff', padding: '10px'}}>
                      <h3 style={{color: '#ff33ff', fontSize: '1rem', marginTop: 0}}>HURTOWNIA SPEKULACYJNA (±15% co 15s)</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        {Object.entries(wholesalePrices).map(([key, price]) => {
                          const name = key === 'kawa' ? 'Kawa (10 szt.)' : key === 'spirytus' ? 'Spirytus (10 szt.)' : key === 'dzinsy' ? 'Dżinsy (10 szt.)' : 'Kasprzak (5 szt.)';
                          const plnCost = Math.floor(price.pln * (1 + state.inflationPercent/100));
                          const usdCost = price.usd;
                          return (
                            <div key={key} className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                              <div className="flex-col">
                                <span>{name}</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>{plnCost} zł / {usdCost}$</span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => buyWholesale(key, 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>PLN</button>
                                <button onClick={() => buyWholesale(key, 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>USD</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SEKCJA 4: ULEPSZENIA OSŁONOWE */}
                    <div className="panel" style={{borderColor: '#00ffff', padding: '10px', gridColumn: 'span 1'}}>
                      <h3 style={{color: '#00ffff', fontSize: '1rem', marginTop: 0}}>KAPITAŁ OCHRONNY</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem', maxHeight: '350px', overflowY: 'auto'}}>
                        {/* Konto PKO */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Konto PKO (PLN)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-60% dewaluacji PLN</span>
                          </div>
                          {state.inflationUpgrades?.['kontoPKO'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('kontoPKO', 'pln', 100000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(100000 * (1 + state.inflationPercent/100))} zł)</button>
                          )}
                        </div>
                        {/* Automat Pewex */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Automat Pewex (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>25% zysków PLN na Bony Pewex</span>
                          </div>
                          {state.inflationUpgrades?.['automatPewex'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('automatPewex', 'dollars', 500)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (500$)</button>
                          )}
                        </div>
                        {/* Książeczka Mieszkaniowa */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Książeczka (PLN)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+0.05 Solidarność / s</span>
                          </div>
                          {state.inflationUpgrades?.['ksiazeczkaMieszkaniowa'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('ksiazeczkaMieszkaniowa', 'pln', 250000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(250000 * (1 + state.inflationPercent/100))} zł)</button>
                          )}
                        </div>
                        {/* Licencja Dewizowa */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Licencja Dewizowa (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-50% spreadu na złocie</span>
                          </div>
                          {state.inflationUpgrades?.['licencjaDewizowa'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('licencjaDewizowa', 'dollars', 1000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (1000$)</button>
                          )}
                        </div>
                        {/* Polisa Asekuracyjna */}
                        <div className="flex justify-between items-center">
                          <div className="flex-col">
                            <span>Polisa (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-25% wzrostu inflacji</span>
                          </div>
                          {state.inflationUpgrades?.['polisaAsekuracyjna'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('polisaAsekuracyjna', 'dollars', 2500)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (2500$)</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel" style={{borderColor: 'var(--prl-dark-gray)', color: 'var(--prl-gray)', marginBottom: '20px', textAlign: 'center', padding: '15px'}}>
                  <h3 style={{color: 'var(--prl-gray)', fontSize: '1rem', marginTop: 0}}>KANTOR I SPEKULACJA (BLOKADA)</h3>
                  <p style={{fontSize: '0.85rem', margin: 0}}>Te opcje handlu walutowego i spekulacji staną się dostępne po emigracji do Stanów Zjednoczonych w 1989 roku (Faza F).</p>
                </div>
              )}
              {/* PANEL AUKCJI TOWARÓW LUKSUSOWYCH */}
              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>LICYTACJA TOWARÓW LUKSUSOWYCH</h2>
                {state.auction ? (
                  <div className="flex-col gap-3" style={{padding: '10px', background: 'rgba(50, 0, 50, 0.3)', border: '1px dashed #ff33ff'}}>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong style={{color: '#ff33ff', fontSize: '1.2rem'}}>{state.auction.itemName}</strong>
                        <div style={{fontSize: '0.85rem', color: 'var(--prl-gray)', marginTop: '2px'}}>
                          Status: {state.auction.highestBidder === 'Gracz' ? (
                            <span style={{color: 'var(--dollar-green)'}}>PROWADZISZ!</span>
                          ) : state.auction.highestBidder === 'Cena Wywoławcza' ? (
                            <span style={{color: 'var(--prl-yellow)'}}>Czekamy na pierwszą ofertę</span>
                          ) : (
                            <span style={{color: 'var(--prl-red)'}}>Przelicytowany przez {state.auction.highestBidder}!</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-col text-right">
                        <span style={{fontSize: '1.1rem', color: 'var(--prl-yellow)'}}>
                          Oferta: {state.auction.currentBid} {state.auction.currency === 'dollars' ? '$' : 'zł'}
                        </span>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>
                          Lider: {state.auction.highestBidder}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar / Time left */}
                    <div style={{marginTop: '5px'}}>
                      <div style={{fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '3px'}}>
                        <span>Pozostały czas: {Math.max(0, Math.floor(state.auction.timeLeft))} sek.</span>
                        <span style={{color: '#ff33ff'}}>{Math.floor((state.auction.timeLeft / 45) * 100)}%</span>
                      </div>
                      <div style={{width: '100%', height: '12px', background: '#222', border: '1px solid #ff33ff', padding: '1px', boxSizing: 'border-box'}}>
                        <div style={{width: `${Math.max(0, Math.min(100, (state.auction.timeLeft / 45) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #880088, #ff33ff)'}} />
                      </div>
                    </div>

                    {/* Licytuj button & Increment */}
                    {(() => {
                      const increment = state.auction.currency === 'dollars' ? 50 : 1000;
                      const nextBid = state.auction.currentBid + increment;
                      const hasEnough = state.auction.currency === 'dollars' ? state.dollars >= nextBid : state.pln >= nextBid;
                      const isLeading = state.auction.highestBidder === 'Gracz';
                      
                      return (
                        <div className="flex gap-4 items-center mt-2">
                          <button 
                            onClick={bidInAuction}
                            disabled={isLeading || !hasEnough}
                            style={{
                              flex: 1, 
                              borderColor: isLeading ? 'var(--dollar-green)' : '#ff33ff', 
                              color: isLeading ? 'var(--dollar-green)' : '#ff33ff',
                              backgroundColor: isLeading ? 'rgba(0, 100, 0, 0.1)' : 'transparent',
                              fontSize: '1.2rem',
                              padding: '8px'
                            }}
                          >
                            {isLeading ? 'JESTEŚ LIDEREM' : `LICYTUJ (+${increment} ${state.auction.currency === 'dollars' ? '$' : 'zł'})`}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Log licytacji */}
                    <div style={{marginTop: '10px', padding: '5px', background: 'rgba(0,0,0,0.4)', border: '1px solid #444'}}>
                      <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)', borderBottom: '1px solid #333', paddingBottom: '3px', marginBottom: '5px'}}>Przebieg licytacji:</div>
                      <div style={{fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '220px', overflowY: 'auto'}}>
                        {(state.auction.biddingLog || []).slice(-4).map((log, i) => (
                          <div key={i} style={{color: log.includes('Gracz') ? 'var(--dollar-green)' : 'var(--prl-gray)'}}>{log}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{padding: '15px', textAlign: 'center', color: 'var(--prl-gray)'}}>
                    {LUXURY_ITEMS.filter(li => !state.ownedLuxuryItems?.[li.id]).length > 0 ? (
                      <p>Kolejna licytacja towaru luksusowego rozpocznie się za: <strong style={{color: '#ff33ff'}}>{Math.max(0, Math.floor(state.nextAuctionIn))}</strong> sek.</p>
                    ) : (
                      <p style={{color: 'var(--dollar-green)'}}>★ Posiadasz wszystkie dostępne towary luksusowe! Jesteś prawdziwym Królem Czerwonego Salonu! ★</p>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL POSIADANYCH TOWARÓW LUKSUSOWYCH */}
              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>TWÓJ SALON DOBROBYTU (AKTYWNE TOWARY LUKSUSOWYCH)</h2>
                <div style={{display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '0.9rem', flexWrap: 'wrap'}}>
                  <div>
                    Skumulowana redukcja podejrzeń: <strong style={{color: 'var(--prl-yellow)'}}>-{Math.floor(calculateLuxurySuspicionReduction(state.ownedLuxuryItems) * 100)}%</strong>
                  </div>
                  <div>
                    Premia prestiżu przy ucieczce: <strong style={{color: 'var(--dollar-green)'}}>+{Math.floor(calculateLuxuryPrestigeBonus(state.ownedLuxuryItems) * 100)}% DM</strong>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '10px'}}>
                  {LUXURY_ITEMS.map(item => {
                    const owned = !!state.ownedLuxuryItems?.[item.id];
                    return (
                      <div 
                        key={item.id} 
                        className="panel" 
                        style={{
                          margin: 0, 
                          padding: '10px', 
                          borderColor: owned ? '#ff33ff' : '#444', 
                          background: owned ? 'rgba(100, 0, 100, 0.1)' : 'rgba(0,0,0,0.3)',
                          opacity: owned ? 1.0 : 0.4
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <strong style={{color: owned ? '#ff33ff' : 'var(--prl-gray)'}}>{item.name}</strong>
                          <span style={{fontSize: '0.8rem', color: owned ? 'var(--dollar-green)' : 'var(--prl-red)'}}>
                            {owned ? '✓ POSIADASZ' : '○ BRAK'}
                          </span>
                        </div>
                        <p style={{fontSize: '0.8rem', margin: '5px 0 0 0', color: 'var(--prl-gray)'}}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>TAJNE OFERTY SPECJALNE (ROTACYJNE)</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                   Pojawiają się z tajnych transportów kolejowych co 5 minut. Każda oferta może być zakupiona tylko raz!
                   {/* eslint-disable-next-line react-hooks/purity */}
                   Oferty wygasają za: {Math.max(0, Math.floor((300000 - (Date.now() - state.lastMarketRefresh)) / 1000))} sek.
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px'}}>
                   {state.blackMarketOffers.map(offer => {
                      const costDesc = offer.costPln !== undefined ? `${offer.costPln} zł` :
                                       offer.costTalony !== undefined ? `${offer.costTalony} Talonów` :
                                       `${offer.costRuble} Rubli`;
                                       
                      const isAffordable = offer.costPln !== undefined ? state.pln >= offer.costPln :
                                           offer.costTalony !== undefined ? state.talony >= offer.costTalony :
                                           state.ruble >= (offer.costRuble || 0);
                                           
                      return (
                         <div key={offer.id} className="panel" style={{margin: 0, padding: '10px', borderColor: '#880088', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                            <div>
                               <strong style={{color: '#ff33ff', fontSize: '0.9rem'}}>{offer.name}</strong>
                               <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginTop: '5px'}}>
                                  Dostajesz: {offer.amount} szt.
                               </div>
                            </div>
                            <button 
                               style={{marginTop: '10px', width: '100%', borderColor: '#ff33ff', color: '#ff33ff'}}
                               disabled={!isAffordable}
                               onClick={() => buyBlackMarketOffer(offer.id)}
                            >
                               Kup za {costDesc}
                            </button>
                         </div>
                      );
                   })}
                   {state.blackMarketOffers.length === 0 && (
                      <p style={{gridColumn: 'span 3', color: 'var(--prl-gray)'}}>Brak ofert specjalnych w tym momencie. Poczekaj na dostawę!</p>
                   )}
                </div>
              </div>

              <div className="game-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: 0, border: 'none', background: 'transparent'}}>
                 {/* ZAKUPY BEZ KOLEJKI */}
                 <div className="panel" style={{borderColor: '#ff33ff'}}>
                    <h2 style={{color: '#ff33ff'}}>ZAKUPY BEZ KOLEJKI (INSTANT)</h2>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                       Kupuj towary od ręki od paserów. Kosztują 2.5x więcej i generują Podejrzenie Milicji!
                    </p>
                    <div style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '10px'}}>
                       {QUEUE_ITEMS.map(item => {
                          const bmAchMult = (state.unlockedAchievements?.['black_market_1'] ? 0.90 : 1) * (state.unlockedAchievements?.['black_market_2'] ? 0.80 : 1);
                          const cost = item.costPln === 0 ? 25 : Math.floor(item.costPln * 2.5);
                          const finalCost = Math.floor(cost * bmAchMult);
                          const suspAchMult = (state.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (state.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
                          const suspicionAdd = Math.max(1, Math.floor(Math.floor(item.costPln / 50) * suspAchMult));
                          return (
                             <div key={item.id} className="flex justify-between items-center mt-3" style={{borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '0.85rem'}}>
                                <div className="flex-col">
                                   <span>{item.name}</span>
                                   {state.partyRank !== 'minister' && (
                                      <span style={{fontSize: '0.75rem', color: 'var(--prl-red)'}}>
                                         +{suspicionAdd}% Podejrzenia
                                      </span>
                                   )}
                                </div>
                                <button 
                                   style={{borderColor: '#ff33ff', color: '#ff33ff', padding: '3px 10px', fontSize: '0.8rem'}}
                                   disabled={state.pln < finalCost}
                                   onClick={() => buyInstantCzarnyRynek(item.id)}
                                >
                                   Kup ({finalCost} zł)
                                </button>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 {/* CINKCIARZ PREMIUM I INNA WYMIANA */}
                 <div className="flex-col gap-4">
                    <div className="panel" style={{borderColor: '#ff33ff'}}>
                        <h2 style={{color: '#ff33ff'}}>CINKCIARZ PREMIUM</h2>
                        <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                           Kupuj dolary bez ryzyka wpadki. Kurs jest o 30% wyższy, ale Milicja nie ma się do czego przyczepić.
                        </p>
                        {(() => {
                           const currentBaseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
                           const premiumRate = Math.floor(currentBaseRate * 1.30);
                           return (
                              <>
                                 <div className="flex justify-between items-center text-dollar" style={{marginBottom: '10px', fontSize: '0.9rem'}}>
                                   <span>Kurs premium:</span>
                                   <span style={{color: '#ff33ff'}}>1$ = {premiumRate} zł</span>
                                 </div>
                                 <button 
                                   style={{borderColor: '#ff33ff', color: '#ff33ff', width: '100%'}}
                                   disabled={state.pln < premiumRate}
                                   onClick={buyDollarPremium}
                                 >
                                   Kup 1$ bez Podejrzenia (-{premiumRate} zł)
                                 </button>
                              </>
                           );
                        })()}
                     </div>

                    <div className="panel" style={{borderColor: '#ff33ff'}}>
                       <h2 style={{color: '#ff33ff'}}>KANTOR TALONÓW I RUBLI</h2>
                       <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                          Wymieniaj alternatywne waluty na niezbędne zasoby.
                       </p>
                       <div className="flex-col gap-3">
                          <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                             <div className="flex-col">
                                <span>Wymień Talony na Kartki</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>
                                  Koszt: {state.activeEvent === 'stocznia' ? '1 Talon' : '2 Talony'} = Otrzymasz: 3 Kartki
                                  {state.activeEvent === 'stocznia' && <span style={{color: 'var(--pewex-blue)', marginLeft: '5px'}}>(STRAJK - TANIEJ!)</span>}
                                </span>
                             </div>
                             <button 
                                disabled={state.talony < (state.activeEvent === 'stocznia' ? 1 : 2)} 
                                onClick={exchangeTalonyForKartki}
                                style={{borderColor: '#5bc0de', color: '#5bc0de'}}
                             >
                                Wymień
                             </button>
                          </div>
                          
                          <div className="flex justify-between items-center" style={{paddingTop: '5px'}}>
                             <div className="flex-col">
                                <span>Wymień Ruble na Dolary</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Koszt: 10 Rubli = Otrzymasz: $1</span>
                             </div>
<button 
                                disabled={state.ruble < 10} 
                                onClick={exchangeRubleForDollars}
                                style={{borderColor: '#ff4500', color: '#ff4500'}}
                             >
                                Wymień
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
           </div>
        )}

        {/* TAB: PRZEMYT / BIZNES */}
        {currentTab === 'przemyt' && (
           <div className="flex-col gap-4">
              {/* Sub-tab switcher */}
              <div style={{display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap'}}>
                <button 
                  onClick={() => { playClick(); setPrzemytSubTab('land'); }} 
                  style={{
                    flex: 1, 
                    backgroundColor: przemytSubTab === 'land' ? 'var(--crt-text)' : 'transparent', 
                    color: przemytSubTab === 'land' ? '#000' : 'var(--crt-text)',
                    border: '1px solid var(--crt-text)',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Szmugiel Lądowy & Biznesy
                </button>
                <button 
                  onClick={() => { playClick(); setPrzemytSubTab('sea'); }} 
                  style={{
                    flex: 1, 
                    backgroundColor: przemytSubTab === 'sea' ? 'var(--prl-yellow)' : 'transparent', 
                    color: przemytSubTab === 'sea' ? '#000' : 'var(--prl-yellow)',
                    border: '1px solid var(--prl-yellow)',
                    padding: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Port Gdynia & Baltona
                </button>
                {(state.partyRank === 'biuro' || state.nomenklaturaUnlocked) && (
                  <button 
                    onClick={() => { playClick(); setPrzemytSubTab('nomenklatura'); }} 
                    style={{
                      flex: 1, 
                      backgroundColor: przemytSubTab === 'nomenklatura' ? '#ff3300' : 'transparent', 
                      color: przemytSubTab === 'nomenklatura' ? '#000' : '#ff3300',
                      border: '1px solid #ff3300',
                      padding: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Prywatne Spółki (Nomenklatura)
                  </button>
                )}
              </div>

              {przemytSubTab === 'land' && (
                <>
                  <div className="panel" style={{borderColor: 'var(--dollar-green)'}}>
                    <h2 className="text-dollar">WYPRAWY PRZEMYTNICZE</h2>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Wysyłaj transporty za granicę, aby zdobyć dolary. Uwaga na Urząd Celny!</p>
                    <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                      {SMUGGLING_ROUTES.map(r => {
                        if (r.id === 'vhs_route' && !state.pewexItems['vhs']) return null;
                        if (r.id === 'moskwa' && state.ruble <= 0) return null;
                        
                        const polaroidDiscount = state.pewexItems['polaroid'] ? 0.75 : 1.0;
                        let risk = r.riskPercent * polaroidDiscount;
                        if (state.unlockedAchievements?.['smug_safe']) risk = Math.max(0, risk - 10);
                        const displayRisk = Math.round(risk);
                        
                        let minD = r.minDollarsEarned;
                        let maxD = r.maxDollarsEarned;
                        if (state.pewexItems['rubin']) { minD *= 2; maxD *= 2; }
                        
                        const smugAchMult = 1 + (state.unlockedAchievements?.['smug_first'] ? 0.10 : 0) + (state.unlockedAchievements?.['smug_king'] ? 0.25 : 0);
                        const transformMult = state.unlockedAchievements?.['pres_transform'] ? 1.50 : 1.0;
                        const importMult = state.baltonaUpgrades?.['import'] ? 1.35 : 1.0;
                        minD = Math.floor(minD * smugAchMult * transformMult * importMult);
                        maxD = Math.floor(maxD * smugAchMult * transformMult * importMult);
                        
                        let rewardMsg = `Handel ciuchami ($${minD} - $${maxD})`;
                        if (r.id === 'jugoslawia') rewardMsg = `Przemyt elektroniki ($${minD} - $${maxD})`;
                        if (r.id === 'vhs_route') rewardMsg = `Kasety z filmami ($${minD} - $${maxD})`;
                        if (r.id === 'moskwa') {
                          let rubBonus = "";
                          if (state.unlockedAchievements?.['smug_moskwa']) rubBonus = " (+2 Rub)";
                          rewardMsg = `Szary import ($${minD} - $${maxD} + 20-50${rubBonus} Rub)`;
                        }

                        return (
                          <div key={r.id} className="flex-col gap-2 mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                            <div className="flex justify-between items-center">
                              <div>
                                 <span>{r.name}</span>
                                 <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>Ryzyko: {displayRisk}% | Nagroda: {rewardMsg}</div>
                              </div>
                              <button 
                                disabled={!!activeSmuggle || state.pln < r.costPln} 
                                onClick={() => startSmuggle(r.id, r.costPln)}
                              >
                                Wyślij (-{r.costPln} zł)
                              </button>
                            </div>
                            {activeSmuggle === r.id && (
                              <div style={{width: '100%', height: '10px', background: '#222', marginTop: '5px'}}>
                                <div style={{width: `${smuggleProgress}%`, height: '100%', background: 'var(--dollar-green)'}} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel">
                    <h2>POMOCNICY (AUTOMATYZACJA)</h2>
                    <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                      {HELPERS.map(h => {
                        const count = state.helpers[h.id] || 0;
                        const discount = state.partyRank === 'dyrektor' || state.partyRank === 'minister' ? 0.5 : 1;
                        const achDiscount = state.unlockedAchievements?.['pol_rank_3'] ? 0.90 : 1.0;
                        const canadaDiscount = state.activeDestination === 'kanada' ? 0.70 : 1.0;
                        
                        let passiveGen = 0;
                        if (state.solidarnos >= 9000) passiveGen = 0.10; // Solidarność: +10% dochodu PLN z pomocników

                        const inflationMult = 1 + (state.inflationPercent / 100);
                        let nextCost = Math.floor((h.costPln * Math.pow(1.30, count)) * discount * achDiscount * canadaDiscount * inflationMult);
                        if (h.id === 'wladyslaw' && count === 0 && (state.prestigeCount || 0) >= 4) {
                          nextCost = 0;
                        }
                        const currentLevel = state.helperUpgrades?.[h.id] || 0;
                        const upgradeMult = 1 + currentLevel * 0.5;
                        const upgradeInfo = HELPER_UPGRADE_COSTS[h.id];
                        const upgradeCost = upgradeInfo ? 10 * (currentLevel + 1) : 0;
                        const playerHasResource = upgradeInfo ? (state.inventory[upgradeInfo.resource] || 0) >= upgradeCost : false;

                        return (
                          <div key={h.id} className="flex-col gap-2 mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                            <div className="flex justify-between">
                               <span>
                                 {h.name} (Masz: {count})
                                 {state.sbTwRevealed[h.id] && (
                                   <span style={{
                                     marginLeft: '10px',
                                     padding: '2px 6px',
                                     fontSize: '0.75rem',
                                     fontWeight: 'bold',
                                     borderRadius: '2px',
                                     backgroundColor: state.sbTwBlackmailed[h.id] ? 'rgba(51, 255, 51, 0.2)' : 'rgba(204, 0, 0, 0.2)',
                                     color: state.sbTwBlackmailed[h.id] ? 'var(--dollar-green)' : 'var(--prl-red)',
                                     border: '1px solid ' + (state.sbTwBlackmailed[h.id] ? 'var(--dollar-green)' : 'var(--prl-red)')
                                   }}>
                                     {state.sbTwBlackmailed[h.id] ? 'PODWÓJNY AGENT' : 'AGENT SB'}
                                   </span>
                                 )}
                               </span>
                              <button disabled={state.pln < nextCost} onClick={() => buyHelper(h.id, nextCost)}>
                                Kup ({nextCost} zł)
                              </button>
                            </div>
                            <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>
                              {h.desc} ({parseFloat((h.ratePerTick * helperMult * upgradeMult * (1 + passiveGen)).toFixed(4))}/sek)
                            </span>
                            {count > 0 && upgradeInfo && (
                              <div className="flex justify-between items-center mt-1" style={{paddingLeft: '10px'}}>
                                <span style={{fontSize: '0.85rem', color: 'var(--prl-yellow)'}}>
                                  Ulepszenie: Poz. {currentLevel} (+{currentLevel * 50}% wydajności)
                                </span >
                                <button 
                                  disabled={!playerHasResource} 
                                  onClick={() => upgradeHelper(h.id)}
                                  style={{
                                    padding: '2px 8px', 
                                    fontSize: '0.75rem', 
                                    backgroundColor: playerHasResource ? 'var(--prl-yellow)' : 'transparent',
                                    color: playerHasResource ? '#000' : 'var(--prl-gray)',
                                    border: '1px solid var(--prl-yellow)'
                                  }}
                                >
                                  Ulepsz ({upgradeCost} {upgradeInfo.label})
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel">
                    <h2 className="text-dollar">SPÓŁKI POLONIJNE I BIZNES (LATE GAME)</h2>
                    <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                      {BUSINESSES.map(b => {
                        const count = state.businesses[b.id] || 0;
                        const nextCost = Math.floor((b.costDollars * Math.pow(1.30, count)));
                        return (
                          <div key={b.id} className="flex-col gap-2 mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                            <div className="flex justify-between">
                              <span>{b.name} (Masz: {count})</span>
                              <button disabled={state.dollars < nextCost} onClick={() => buyBusiness(b.id, nextCost)}>
                                Kup (${nextCost})
                              </button>
                            </div>
                            <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{b.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel">
                    <h2 className="text-pewex">SKLEP PEWEX</h2>
                    <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                      {PEWEX_ITEMS.map(item => {
                        const owned = state.pewexItems[item.id];
                        return (
                          <div key={item.id} className="flex justify-between items-center mt-4">
                            <div className="flex-col">
                              <span className={item.id === 'transformacja' ? 'text-red' : 'text-pewex'}>{item.name}</span>
                              <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{item.desc}</span>
                            </div>
                            <button 
                              disabled={owned || (state.dollars + (state.bonyPewex || 0) < item.costDollars)}
                              onClick={() => {
                                playClick();
                                updateState(s => {
                                  const cost = item.costDollars;
                                  let nextBony = s.bonyPewex || 0;
                                  let nextDollars = s.dollars;
                                  
                                  if (nextBony >= cost) {
                                    nextBony -= cost;
                                  } else {
                                    const remaining = cost - nextBony;
                                    nextBony = 0;
                                    nextDollars -= remaining;
                                  }
                                  
                                  return {
                                    ...s,
                                    bonyPewex: nextBony,
                                    dollars: nextDollars,
                                    pewexItems: { ...s.pewexItems, [item.id]: true }
                                  };
                                });
                              }}
                            >
                              {owned ? "KUPIONE" : `$${item.costDollars}`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {przemytSubTab === 'sea' && (
                <>
                  <div className="panel" style={{borderColor: 'var(--prl-yellow)'}}>
                    <h2 style={{color: 'var(--prl-yellow)'}}>PORT GDYNIA: SZMUGLE MORSKIE</h2>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Wysyłaj statki handlowe za granicę przez zaufanych marynarzy, aby zdobyć Bony Baltona. Uwaga na rewizje celne w porcie!</p>
                    <div style={{maxHeight: '450px', overflowY: 'auto', paddingRight: '10px'}}>
                      {SEA_SMUGGLING_ROUTES.map(r => {
                        const polaroidDiscount = state.pewexItems['polaroid'] ? 0.75 : 1.0;
                        let risk = r.riskPercent * polaroidDiscount;
                        if (state.unlockedAchievements?.['smug_safe']) risk = Math.max(0, risk - 10);
                        const displayRisk = Math.round(risk);
                        
                        let timeSec = r.timeMs / 1000;
                        if (state.baltonaUpgrades?.['marlboro']) timeSec *= 0.8;
                        if (state.solidarnos >= 3000) timeSec *= 0.85;
                        
                        const rewardMsg = `Bony Towarowe Baltona (${r.minBony} - ${r.maxBony})`;

                        return (
                          <div key={r.id} className="flex-col gap-2 mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                            <div className="flex justify-between items-center">
                              <div>
                                 <span>{r.name} ({Math.round(timeSec)}s)</span>
                                 <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>Ryzyko: {displayRisk}% | Nagroda: {rewardMsg}</div>
                              </div>
                              <button 
                                disabled={!!state.activeSeaSmuggle || state.pln < r.costPln} 
                                onClick={() => startSeaSmuggle(r.id)}
                                style={{borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)'}}
                              >
                                Wypłyń (-{r.costPln} zł)
                              </button>
                            </div>
                            {state.activeSeaSmuggle === r.id && (
                              <div style={{width: '100%', height: '10px', background: '#222', marginTop: '5px'}}>
                                <div style={{width: `${state.seaSmuggleProgress}%`, height: '100%', background: 'var(--prl-yellow)'}} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel" style={{borderColor: 'var(--prl-yellow)'}}>
                    <h2 style={{color: 'var(--prl-yellow)'}}>KONTRAKTY Z MARYNARZAMI</h2>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Wymień towary krajowe na Bony Towarowe Baltona. Marynarze chętnie wezmą deficytowe produkty za dewizy!</p>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                      {[
                        { id: 'cukier', name: 'Cukier (1kg)', amount: 50, reward: 10 },
                        { id: 'dzinsy', name: 'Dżinsy "Odra"', amount: 20, reward: 15 },
                        { id: 'kasprzak', name: 'Radio "Kasprzak"', amount: 10, reward: 25 },
                        { id: 'wyroby_hutnicze', name: 'Wyroby Hutnicze', amount: 1, reward: 20 }
                      ].map(contract => {
                        const currentInv = Math.floor(state.inventory[contract.id] || 0);
                        const canAfford = currentInv >= contract.amount;
                        return (
                          <div key={contract.id} className="flex justify-between items-center mt-2" style={{borderBottom: '1px solid #333', paddingBottom: '8px'}}>
                            <div className="flex-col">
                              <span>{contract.name} (Masz: {currentInv}/{contract.amount})</span>
                              <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>Nagroda: +{contract.reward} Bonów Baltona</span>
                            </div>
                            <button 
                              disabled={!canAfford} 
                              onClick={() => exchangeGoodsForBaltona(contract.id, contract.amount, contract.reward)}
                              style={{borderColor: canAfford ? 'var(--prl-yellow)' : 'var(--prl-gray)', color: canAfford ? 'var(--prl-yellow)' : 'var(--prl-gray)'}}
                            >
                              Wymień
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="panel" style={{borderColor: 'var(--prl-yellow)'}}>
                    <h2 style={{color: 'var(--prl-yellow)'}}>SKLEP BALTONA</h2>
                    <div style={{marginBottom: '10px', fontSize: '0.95rem'}}>
                      Twoje Bony Baltona: <strong style={{color: 'var(--prl-yellow)'}}>{state.bonyBaltona} bonów</strong>
                    </div>
                    <div style={{maxHeight: '250px', overflowY: 'auto', paddingRight: '10px'}}>
                      {BALTONA_ITEMS.map(item => {
                        const owned = state.baltonaUpgrades[item.id];
                        const canAfford = state.bonyBaltona >= item.costBony;
                        return (
                          <div key={item.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #222', paddingBottom: '10px'}}>
                            <div className="flex-col">
                              <span style={{color: 'var(--prl-yellow)', fontWeight: 'bold'}}>{item.name}</span>
                              <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{item.desc}</span>
                            </div>
                            <button 
                              disabled={owned || !canAfford}
                              onClick={() => buyBaltonaUpgrade(item.id)}
                              style={{
                                borderColor: owned ? 'var(--prl-gray)' : 'var(--prl-yellow)',
                                color: owned ? 'var(--prl-gray)' : 'var(--prl-yellow)',
                                backgroundColor: 'transparent'
                              }}
                            >
                              {owned ? "KUPIONE" : `${item.costBony} bonów`}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {przemytSubTab === 'nomenklatura' && (state.partyRank === 'biuro' || state.nomenklaturaUnlocked) && (() => {
                 const isSbLockdown = state.sbLockdownTimeLeft > 0;
                 return (
                   <div className="flex-col gap-4">
                     {/* SB Intrusion Status Header */}
                     <div className="panel" style={{borderColor: 'var(--prl-red)', padding: '15px'}}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'}}>
                         <div>
                           <h3 style={{color: 'var(--prl-red)', margin: 0, fontSize: '1.2rem'}}>INWIGILACJA SŁUŻBY BEZPIECZEŃSTWA (SB)</h3>
                           <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', margin: '5px 0 0 0'}}>
                             Drenowanie państwowych kombinatów zwraca uwagę bezpieki. Osiągnięcie 100% wywołuje Kontrolę NIK i SB (grzywna, konfiskata aut i 90s blokady).
                           </p>
                         </div>
                         <div style={{textAlign: 'right', display: 'flex', gap: '15px', alignItems: 'center'}}>
                           <div className="flex-col">
                             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>PODEJRZENIE SB:</span>
                             <span style={{fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--prl-red)', textShadow: '0 0 5px rgba(255,0,0,0.5)'}}>
                               {(state.sbSuspicion || 0).toFixed(1)}%
                             </span>
                           </div>
                           <button 
                             onClick={bribeSbChief}
                             disabled={state.dollars < 2500}
                             style={{
                               borderColor: 'var(--dollar-green)', 
                               color: state.dollars >= 2500 ? 'var(--dollar-green)' : 'var(--prl-gray)',
                               padding: '10px 15px',
                               backgroundColor: 'transparent'
                             }}
                           >
                             Wręcz łapówkę ($2 500 USD)
                           </button>
                         </div>
                       </div>

                       {/* Progress bar */}
                       <div style={{background: '#111', border: '1px solid var(--prl-red)', height: '15px', borderRadius: '3px', overflow: 'hidden', marginTop: '10px'}}>
                         <div style={{
                           background: 'repeating-linear-gradient(45deg, #ff0000, #ff0000 10px, #cc0000 10px, #cc0000 20px)',
                           width: `${state.sbSuspicion || 0}%`,
                           height: '100%',
                           transition: 'width 0.2s ease'
                         }}></div>
                       </div>
                     </div>

                     {/* SB Lockdown Active Status */}
                     {isSbLockdown && (
                       <div className="panel" style={{borderColor: 'var(--prl-red)', textAlign: 'center', padding: '20px', animation: 'pulse 1.5s infinite'}}>
                         <h3 style={{color: 'var(--prl-red)', fontSize: '1.4rem', margin: '0 0 10px 0'}}>⚠️ SPÓŁKI ZABLOKOWANE PRZEZ NIK I SB</h3>
                         <p style={{margin: 0, fontSize: '0.95rem'}}>
                           Wszystkie operacje drenażowe zostały tymczasowo zawieszone na czas trwania śledztwa bezpieki.<br/>
                           Pozostało: <strong style={{fontSize: '1.1rem'}}>{Math.round(state.sbLockdownTimeLeft)} sekund</strong>.
                         </p>
                       </div>
                     )}

                     {/* Companies grid */}
                     <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                       {NOMENKLATURA_COMPANIES.map(comp => {
                         const compState = state.nomenklaturaCompanies?.[comp.id];
                         const isRegistered = compState?.registered;
                         
                         if (!isRegistered) {
                           return (
                             <div key={comp.id} className="panel flex-col justify-between" style={{borderColor: 'var(--prl-gray)', minHeight: '220px', padding: '20px'}}>
                               <div className="flex-col">
                                 <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{comp.combinationName}</span>
                                 <h3 style={{margin: '5px 0 10px 0', color: 'var(--prl-gray)'}}>{comp.name}</h3>
                                 <p style={{fontSize: '0.85rem', color: 'var(--prl-gray)', lineHeight: '1.4'}}>{comp.desc}</p>
                               </div>
                               <button 
                                 onClick={() => registerNomenklaturaCompany(comp.id)}
                                 disabled={state.pln < comp.costPln}
                                 style={{
                                   width: '100%', 
                                   padding: '12px',
                                   borderColor: state.pln >= comp.costPln ? 'var(--crt-text)' : 'var(--prl-gray)',
                                   color: state.pln >= comp.costPln ? 'var(--crt-text)' : 'var(--prl-gray)',
                                   backgroundColor: 'transparent',
                                   fontSize: '0.95rem',
                                   marginTop: '15px'
                                 }}
                               >
                                 Załóż spółkę (Zarejestruj: {comp.costPln.toLocaleString()} zł)
                               </button>
                             </div>
                           );
                         }

                         // Detale dla zarejestrowanej spółki
                         const assetLevel = compState.assetLevel || 0;
                         const directors = compState.directorCount || 0;
                         const twAssigned = compState.twAssigned;

                         // Obliczanie aktualnych kosztów ulepszeń
                         const oligarchDiscount = state.unlockedAchievements?.['nom_oligarch'] ? 0.80 : 1.0;
                         const baseUpgradeCost = Math.floor(comp.costPln * 0.5);
                         const nextLeasingCost = Math.round(baseUpgradeCost * Math.pow(2.2, assetLevel) * oligarchDiscount);

                         const directorDiscount = state.unlockedAchievements?.['nom_director'] ? 0.70 : 1.0;
                         const nextDirectorCost = Math.round(1500 * (directors + 1) * directorDiscount);

                         // Wyświetlanie przychodu
                         let revenueDisplay = '';
                         const assetMultiplier = 1 + assetLevel;
                         const directorMultiplier = 1 + directors * 0.5;
                         const rateMult = assetMultiplier * directorMultiplier;

                         if (comp.generateType === 'pln') {
                           const inflationFactor = 1 + (state.inflationPercent / 100);
                           const plnAmount = Math.floor(comp.baseRate * rateMult * inflationFactor);
                           revenueDisplay = `+${plnAmount.toLocaleString()} zł/s`;
                         } else if (comp.generateType === 'dollars') {
                           revenueDisplay = `+$${Math.floor(comp.baseRate * rateMult)} USD/s`;
                         } else if (comp.generateType === 'autos') {
                           revenueDisplay = `Montaż aut: poz. ${rateMult.toFixed(1)} (czas śr: ${Math.round(60/rateMult)}s)`;
                         } else if (comp.generateType === 'special') {
                           revenueDisplay = `+${Math.floor(comp.baseRate * rateMult)} rubli/s, +${Math.floor(2 * rateMult)} bonów/s`;
                         }

                         return (
                           <div key={comp.id} className="panel flex-col gap-4" style={{borderColor: '#ff3300', opacity: isSbLockdown ? 0.7 : 1}}>
                             <div className="flex justify-between items-start" style={{borderBottom: '1px solid #333', paddingBottom: '8px'}}>
                               <div className="flex-col">
                                 <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{comp.combinationName}</span>
                                 <h3 style={{margin: '2px 0 0 0', color: '#ff3300', fontSize: '1.25rem'}}>{comp.name}</h3>
                               </div>
                               <span style={{background: 'rgba(255, 51, 0, 0.1)', color: '#ff3300', padding: '3px 8px', borderRadius: '3px', fontSize: '0.75rem', fontWeight: 'bold'}}>
                                 DRENAŻ AKTYWNY
                               </span>
                             </div>

                             <div className="flex-col" style={{background: 'rgba(255, 51, 0, 0.03)', border: '1px dashed rgba(255, 51, 0, 0.2)', padding: '10px', borderRadius: '4px'}}>
                               <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>PRZYCHÓD SPÓŁKI:</span>
                               <span style={{fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--crt-text)'}}>{revenueDisplay}</span>
                             </div>

                             {/* Upgrades List */}
                             <div className="flex-col gap-2">
                               {/* Leasing maszyn kombinatu */}
                               <div className="flex justify-between items-center" style={{fontSize: '0.85rem'}}>
                                 <div className="flex-col">
                                   <span>Leasing maszyn (Poz. {assetLevel})</span>
                                   <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Mnożnik: x{assetMultiplier}</span>
                                 </div>
                                 <button 
                                   disabled={state.pln < nextLeasingCost || isSbLockdown}
                                   onClick={() => upgradeLeasing(comp.id)}
                                   style={{
                                     padding: '4px 8px', 
                                     fontSize: '0.75rem',
                                     borderColor: state.pln >= nextLeasingCost && !isSbLockdown ? 'var(--crt-text)' : 'var(--prl-gray)',
                                     color: state.pln >= nextLeasingCost && !isSbLockdown ? 'var(--crt-text)' : 'var(--prl-gray)',
                                     backgroundColor: 'transparent'
                                   }}
                                 >
                                   Kup ({nextLeasingCost.toLocaleString()} zł)
                                 </button>
                               </div>

                               {/* Czerwoni Dyrektorzy */}
                               <div className="flex justify-between items-center mt-2" style={{fontSize: '0.85rem'}}>
                                 <div className="flex-col">
                                   <span>Czerwoni Dyrektorzy ({directors}/5)</span>
                                   <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Mnożnik kadr: x{directorMultiplier}</span>
                                 </div>
                                 <button 
                                   disabled={state.dollars < nextDirectorCost || directors >= 5 || isSbLockdown}
                                   onClick={() => hireRedDirector(comp.id)}
                                   style={{
                                     padding: '4px 8px', 
                                     fontSize: '0.75rem',
                                     borderColor: state.dollars >= nextDirectorCost && directors < 5 && !isSbLockdown ? 'var(--pewex-blue)' : 'var(--prl-gray)',
                                     color: state.dollars >= nextDirectorCost && directors < 5 && !isSbLockdown ? 'var(--pewex-blue)' : 'var(--prl-gray)',
                                     backgroundColor: 'transparent'
                                   }}
                                 >
                                   {directors >= 5 ? "MAX" : `Zatrudnij ($${nextDirectorCost})`}
                                 </button>
                               </div>

                               {/* Tajny Współpracownik */}
                               <div className="flex justify-between items-center mt-2" style={{fontSize: '0.85rem'}}>
                                 <div className="flex-col">
                                   <span>Tajny Współpracownik (SB)</span>
                                   <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>
                                     {twAssigned ? "🛡️ Zabezpieczony (Inwigilacja -60%)" : "❌ Brak ochrony (TW w radzie)"}
                                   </span>
                                 </div>
                                 <button 
                                   disabled={twAssigned || state.bonyBaltona < 100 || isSbLockdown}
                                   onClick={() => recruitTwInNomenklatura(comp.id)}
                                   style={{
                                     padding: '4px 8px', 
                                     fontSize: '0.75rem',
                                     borderColor: !twAssigned && state.bonyBaltona >= 100 && !isSbLockdown ? 'var(--prl-yellow)' : 'var(--prl-gray)',
                                     color: !twAssigned && state.bonyBaltona >= 100 && !isSbLockdown ? 'var(--prl-yellow)' : 'var(--prl-gray)',
                                     backgroundColor: 'transparent'
                                   }}
                                 >
                                   {twAssigned ? "ZWERBOWANY" : "Werbuj (100 bonów)"}
                                 </button>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>
                 );
              })()}
           </div>
        )}

        {/* TAB: PARTIA / OPOZYCJA */}
        {currentTab === 'partia' && (
           <div className="flex-col gap-4">
              <div className="panel" style={{borderColor: state.suspicion > 50 ? 'var(--prl-red)' : 'var(--crt-border)'}}>
                <h2 className={state.suspicion > 50 ? 'text-red' : ''}>MILICJA OBYWATELSKA</h2>
                <div className="flex justify-between items-center">
                  {(() => {
                    const solidarityBribeMult = state.solidarnos >= 6500 ? 0.85 : 1.0;
                    const bribeAchMult = (state.unlockedAchievements?.['pol_bribe_1'] ? 0.90 : 1) 
                                       * (state.unlockedAchievements?.['pol_bribe_2'] ? 0.75 : 1)
                                       * solidarityBribeMult;
                    const cost = Math.floor((state.partyRank === 'czlonek' ? 900 : 1000) * bribeAchMult);
                    return (
                      <>
                        <span>Podejrzenie: {Math.floor(state.suspicion)}%</span>
                        <button disabled={state.pln < cost} onClick={bribe}>
                          Daj w łapę ({cost} zł)
                        </button>
                      </>
                    );
                  })()}
                </div>
                {state.suspicion > 50 && <p className="text-red" style={{fontSize: '0.8rem', marginTop: '10px'}}>Uwaga! Ryzyko nalotu i konfiskaty 20% oszczędności!</p>}
              </div>

              <div className="panel">
                <h2>KARIERA PARTYJNA</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Kupuj awanse by zyskać potężne przywileje!</p>
                {PARTY_RANKS.map((rank, idx) => {
                  const isBought = currentRankIndex >= idx;
                  const isNext = currentRankIndex === idx - 1 || (currentRankIndex === -1 && idx === 0);
                  return (
                    <div key={rank.id} className="flex justify-between items-center mt-4">
                      <div className="flex-col">
                        <span style={{color: isBought ? 'var(--crt-text)' : 'var(--prl-gray)'}}>{rank.name}</span>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{rank.desc}</span>
                      </div>
                      {!isBought && isNext && (() => {
                        const inflationMult = 1 + (state.inflationPercent / 100);
                        const realCost = Math.floor(rank.costPln * inflationMult);
                        return (
                          <button disabled={state.pln < realCost} onClick={() => { playClick(); updateState(s => ({ ...s, pln: s.pln - realCost, partyRank: rank.id })); }}>
                            Awans ({realCost} zł)
                          </button>
                        );
                      })()}
                      {isBought && <span>ZDOBYTE</span>}
                    </div>
                  );
                })}
              </div>

              <div className="panel">
                <h2>BIURO PASZPORTOWE – EMIGRACJA (PRESTIŻ)</h2>
                <div style={{marginBottom: '15px', fontSize: '0.9rem'}}>
                  <div>Posiadane marki (DM): <strong style={{color: 'var(--prl-yellow)'}}>{state.prestigePoints} DM</strong></div>
                  {(() => {
                    const currentRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
                    const totalValue = state.pln + (state.dollars * currentRate);
                    let prestigeBonus = 1 + calculateLuxuryPrestigeBonus(state.ownedLuxuryItems);
                    if (state.solidarnos >= 7500) {
                      prestigeBonus += 0.15; // Opozycjonista: +15% DM
                    }
                    if (state.baltonaUpgrades?.['sygnat']) {
                      prestigeBonus += 0.25; // Złoty Sygnet: +25% DM
                    }
                    const marksEarned = Math.floor((Math.sqrt(totalValue) / 500) * prestigeBonus);
                    const totalDmAvailable = state.prestigePoints + marksEarned;
                    return (
                      <>
                        <div style={{marginTop: '5px'}}>Majątek z tej pętli da: <strong style={{color: 'var(--dollar-green)'}}>+{marksEarned} DM</strong></div>
                        <div style={{marginTop: '5px', borderBottom: '1px solid #333', paddingBottom: '10px'}}>Łącznie po wyjeździe: <strong>{totalDmAvailable} DM</strong></div>
                        
                        <h3 style={{fontSize: '1rem', marginTop: '15px', marginBottom: '10px'}}>Wybierz kraj docelowy:</h3>
                        
                        <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                          {[
                            { id: 'nrf', name: 'NRF (Niemiecka Republika Federalna)', req: 0, desc: 'Pasywny bonus: +10% do zysków pomocników i biznesów za każdy posiadany punkt DM.' },
                            { id: 'austria', name: 'Austria', req: 50, desc: 'Pasywny bonus: Skrócenie czasu w kolejkach (manualnych i C64) o 10%.' },
                            { id: 'usa', name: 'USA (Stany Zjednoczone)', req: 200, desc: 'Pasywny bonus: Rozpoczynasz każdą nową pętlę z $10 w kieszeni.' },
                            { id: 'kanada', name: 'Kanada', req: 500, desc: 'Pasywny bonus: Obniża bazowe koszty zakupu pomocników w PLN o 30%.' },
                            { id: 'australia', name: 'Australia', req: 1000, desc: 'Pasywny bonus: Przez pierwsze 5 minut gry (300s) zakupy nie wymagają kartek.' }
                          ].map(dest => {
                            const isUnlocked = totalDmAvailable >= dest.req;
                            const isActive = state.activeDestination === dest.id;
                            return (
                              <div 
                                key={dest.id} 
                                style={{
                                  border: isActive ? '1px solid var(--prl-yellow)' : '1px solid #333',
                                  padding: '10px',
                                  background: isActive ? 'rgba(255, 215, 0, 0.05)' : 'transparent',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}
                              >
                                <div style={{flex: 1}}>
                                  <div style={{fontWeight: 'bold', color: isUnlocked ? 'var(--crt-text)' : 'var(--prl-gray)'}}>
                                    {dest.name} {isActive && <span style={{color: 'var(--prl-yellow)', fontSize: '0.8rem'}}>(OBECNY DOM)</span>}
                                  </div>
                                  <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginTop: '2px'}}>{dest.desc}</div>
                                  <div style={{fontSize: '0.75rem', color: isUnlocked ? 'var(--dollar-green)' : 'var(--prl-red)', marginTop: '4px'}}>
                                    Wymagane: {dest.req} DM {!isUnlocked && `(brakuje ${(dest.req - totalDmAvailable)} DM)`}
                                  </div>
                                </div>
                                <button
                                  disabled={!isUnlocked}
                                  style={{
                                    borderColor: isUnlocked ? 'var(--crt-text)' : '#555',
                                    color: isUnlocked ? 'var(--crt-text)' : '#555',
                                    minWidth: '100px'
                                  }}
                                  onClick={() => {
                                    showConfirm(`Czy uciekasz do: ${dest.name}? Stracisz obecne stanowisko i majątek w kraju. Twój stan gry zostanie zresetowany w ramach Nowej Gry+, ale zachowasz punkty DM, odznaczenia oraz odblokowane ulepszenia.`, () => {
                                      resetGame(marksEarned, dest.id as 'nrf' | 'austria' | 'usa' | 'kanada' | 'australia', speedrunChecked);
                                    }, 'DECYZJA O PASZPORCIE');
                                  }}
                                >
                                  Emigruj
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* SPEEDRUN CHECKBOX */}
                        {(state.prestigeCount || 0) >= 3 && (
                          <div style={{marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <input
                              type="checkbox"
                              id="speedrun-cb"
                              checked={speedrunChecked}
                              onChange={(e) => setSpeedrunChecked(e.target.checked)}
                              style={{cursor: 'pointer', width: '18px', height: '18px'}}
                            />
                            <label htmlFor="speedrun-cb" style={{cursor: 'pointer', fontSize: '0.9rem', color: 'var(--prl-yellow)'}}>
                              Rozpocznij następną grę w trybie Speedrun (⏱️ gra na czas do zwycięstwa)
                            </label>
                          </div>
                        )}

                        {/* LUDOWA TABLICA REKORDÓW SPEEDRUNU */}
                        {state.speedrunHistory && state.speedrunHistory.length > 0 && (
                          <div style={{marginTop: '25px', borderTop: '1px solid #333', paddingTop: '15px'}}>
                            <h3 style={{fontSize: '1rem', color: 'var(--prl-yellow)', marginBottom: '10px'}}>LUDOWA TABLICA REKORDÓW SPEEDRUNU</h3>
                            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem'}}>
                              <thead>
                                <tr style={{borderBottom: '1px solid #555', textAlign: 'left'}}>
                                  <th style={{padding: '5px'}}>Pozycja</th>
                                  <th style={{padding: '5px'}}>Czas ukończenia</th>
                                </tr>
                              </thead>
                              <tbody>
                                {state.speedrunHistory.map((time, idx) => (
                                  <tr key={idx} style={{borderBottom: '1px solid #333'}}>
                                    <td style={{padding: '5px'}}>{idx + 1}. Miejsce</td>
                                    <td style={{padding: '5px', fontFamily: 'monospace'}}>{formatSpeedrunTime(time)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* SOLIDARNOŚĆ PANEL */}
              <div className="panel" style={{borderColor: '#e63946'}}>
                <h2 style={{color: '#e63946'}}>★ SOLIDARNOŚĆ (OPOZYCJA PODZIEMNA)</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                  Finansuj podziemie i zdobywaj Punkty Solidarności (0–100). Każdy poziom odblokowuje przywileje!
                </p>
                <div style={{marginBottom: '15px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem'}}>
                    <span style={{color: '#e63946'}}>Punkty: <strong>{Math.floor(state.solidarnos)}/10000</strong></span>
                    <span style={{color: '#e63946', fontWeight: 'bold'}}>{SOLIDARITY_LEVELS.filter(l => state.solidarnos >= l.threshold).slice(-1)[0]?.name ?? 'Brak przynależności'}</span>
                  </div>
                  <div style={{width: '100%', height: '12px', background: '#222', border: '1px solid #e63946'}}>
                    <div style={{width: `${Math.min(100, (state.solidarnos / 100))}%`, height: '100%', background: 'linear-gradient(90deg, #cc0000, #e63946)'}} />
                  </div>
                </div>
                <div style={{marginBottom: '15px'}}>
                  {SOLIDARITY_LEVELS.map(level => {
                    const isUnlocked = state.solidarnos >= level.threshold;
                    return (
                      <div key={level.id} style={{display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 0', borderBottom: '1px solid #333', fontSize: '0.85rem'}}>
                        <span style={{color: isUnlocked ? '#e63946' : '#555', minWidth: '20px'}}>{isUnlocked ? '✓' : '○'}</span>
                        <span style={{color: isUnlocked ? 'var(--crt-text)' : 'var(--prl-gray)', minWidth: '170px', fontWeight: isUnlocked ? 'bold' : 'normal'}}>{level.name} ({level.threshold} pkt)</span>
                        <span style={{color: isUnlocked ? '#e63946' : '#555', fontSize: '0.8rem'}}>{level.effect}</span>
                      </div>
                    );
                  })}
                </div>
                <h3 style={{fontSize: '0.9rem', color: '#e63946', marginBottom: '8px'}}>Wspieraj Podziemie:</h3>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px', marginBottom: '15px'}}>
                  <button disabled={state.pln < 500000} onClick={() => fundSolidarnoscPln(20, 500000)} style={{borderColor: '#e63946', color: '#e63946', fontSize: '0.8rem', padding: '6px'}}>
                    Krajowy fundusz (PLN)<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+20 pkt / -500 000 zł</span>
                  </button>
                  <button disabled={state.dollars < 1000} onClick={() => fundSolidarnoscDollars(25, 1000)} style={{borderColor: '#e63946', color: '#e63946', fontSize: '0.8rem', padding: '6px'}}>
                    Zagraniczne dotacje ($)<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+25 pkt / -$1 000</span>
                  </button>
                  <button disabled={state.kartki < 100} onClick={() => fundSolidarnoscKartki(10, 100)} style={{borderColor: '#e63946', color: '#e63946', fontSize: '0.8rem', padding: '6px'}}>
                    Oddaj przydział kartkowy<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+10 pkt / -100 kartek</span>
                  </button>
                  <button disabled={state.talony < 50} onClick={() => fundSolidarnoscTalony(15, 50)} style={{borderColor: '#e63946', color: '#e63946', fontSize: '0.8rem', padding: '6px'}}>
                    Przekaż bony PKO<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+15 pkt / -50 talonów</span>
                  </button>
                  <button disabled={state.ruble < 100} onClick={() => fundSolidarnoscRuble(50, 100)} style={{borderColor: '#e63946', color: '#e63946', fontSize: '0.8rem', padding: '6px'}}>
                    Radzieckie wsparcie (Ruble)<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+50 pkt / -100 Rub</span>
                  </button>
                </div>
                {state.solidarnos >= 10000 && (
                  <div style={{padding: '15px', border: '2px solid #e63946', background: 'rgba(230,57,70,0.1)', textAlign: 'center'}}>
                    <h3 style={{color: '#e63946', marginTop: 0}}>★ OKRĄGŁY STÓŁ (Alternatywne Zwycięstwo)</h3>
                    <p style={{fontSize: '0.85rem', marginBottom: '10px'}}>
                      Wymagania: <strong>1 000 kartek</strong> i <strong>100 000 zł</strong><br/>
                      Posiadasz: {Math.floor(state.kartki)} kartek | {Math.floor(state.pln).toLocaleString()} zł
                    </p>
                    {state.okraglyStolVictory ? (
                      <div style={{color: '#e63946', fontWeight: 'bold', fontSize: '1.1rem'}}>★ HISTORIA DOKONANA! OKRĄGŁY STÓŁ PODPISANY!</div>
                    ) : (
                      <button disabled={state.kartki < 1000 || state.pln < 100000} onClick={startOkraglyStol}
                        style={{borderColor: '#e63946', color: '#e63946', padding: '10px 20px', fontWeight: 'bold'}}>
                        Zwołaj Okrągły Stół! (-1 000 kartek, -100 000 zł)
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* DRUGI OBIEG PANEL */}
              <div className="panel" style={{borderColor: 'var(--crt-border)', marginTop: '20px'}}>
                <h2>DRUGI OBIEG (TAJNA DRUKARNIA)</h2>
                
                {state.bibulaLockdownRemaining > 0 ? (
                  <div style={{
                    border: '2px solid var(--prl-red)',
                    background: 'rgba(204, 0, 0, 0.1)',
                    padding: '15px',
                    textAlign: 'center',
                    color: 'var(--prl-red)'
                  }}>
                    <h3 style={{marginTop: 0, fontWeight: 'bold'}}>DRUKARNIA ZAPLOMBOWANA PRZEZ SB!</h3>
                    <p style={{fontSize: '0.9rem', marginBottom: '5px'}}>
                      Nalot milicji zakończył się aresztowaniami i konfiskatą powielacza.
                    </p>
                    <div style={{fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'monospace'}}>
                      Blokada działalności: {Math.ceil(state.bibulaLockdownRemaining)}s
                    </div>
                  </div>
                ) : (
                  <div>
                    <p style={{fontSize: '0.8rem', marginBottom: '15px', color: 'var(--prl-gray)'}}>
                      Kupuj surowce, drukuj podziemną bibułę ("Tygodnik Mazowsze") i kolportuj ją, aby zdobyć poparcie Solidarności. Uważaj na cenzurę i Służbę Bezpieczeństwa!
                    </p>
                    
                    {/* Magazyn surowców */}
                    <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', fontSize: '0.9rem'}}>
                      <div>Papier: <strong>{state.bibulaPaper} ryz</strong></div>
                      <div>Tusz: <strong>{state.bibulaInk} flak.</strong></div>
                      <div>Gotowe pisma: <strong style={{color: 'var(--prl-yellow)'}}>{state.bibulaPisma} szt.</strong></div>
                    </div>

                    {/* Zakupy surowców */}
                    <div className="flex gap-2" style={{marginBottom: '15px'}}>
                      <button onClick={buyPaper} disabled={state.pln < 50} style={{flex: 1, padding: '8px', fontSize: '0.8rem'}}>
                        Kup Papier (-50 zł)<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+1 ryza</span>
                      </button>
                      <button onClick={buyInk} disabled={state.pln < 100} style={{flex: 1, padding: '8px', fontSize: '0.8rem'}}>
                        Kup Tusz (-100 zł)<br/><span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+1 flakon</span>
                      </button>
                    </div>

                    {/* Druk prasy */}
                    <div style={{border: '1px solid #333', padding: '12px', borderRadius: '4px', marginBottom: '20px'}}>
                      <div className="flex justify-between items-center" style={{marginBottom: '10px'}}>
                        <span style={{fontSize: '0.85rem'}}>Powielacz białkowy (Czas: 5s, koszt: 1 ryza + 1 tusz)</span>
                        <button onClick={startPrinting} disabled={state.isPrinting || state.bibulaPaper < 1 || state.bibulaInk < 1} style={{fontSize: '0.8rem', padding: '5px 10px'}}>
                          {state.isPrinting ? 'Drukowanie...' : 'Drukuj (+10 bibuł)'}
                        </button>
                      </div>
                      
                      {state.isPrinting && (
                        <div style={{width: '100%', height: '10px', background: '#222', border: '1px solid var(--crt-border)'}}>
                          <div style={{width: `${state.printProgress}%`, height: '100%', background: 'var(--crt-text)'}} />
                        </div>
                      )}
                    </div>

                    {/* Kolportaż prasy */}
                    <div>
                      <h3 style={{fontSize: '0.9rem', marginBottom: '8px', color: 'var(--crt-text)'}}>Rozpocznij Kolportaż (Zysk vs Ryzyko):</h3>
                      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px'}}>
                        <button onClick={() => distributePisma(10)} disabled={state.bibulaPisma < 10} style={{padding: '8px', fontSize: '0.8rem'}}>
                          Kolportuj x10<br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-yellow)'}}>+20 pkt. Sol</span><br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-red)'}}>Ryzyko: 1.0%</span>
                        </button>
                        <button onClick={() => distributePisma(100)} disabled={state.bibulaPisma < 100} style={{padding: '8px', fontSize: '0.8rem'}}>
                          Kolportuj x100<br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-yellow)'}}>+200 pkt. Sol</span><br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-red)'}}>Ryzyko: 10%</span>
                        </button>
                        <button onClick={() => distributePisma(500)} disabled={state.bibulaPisma < 500} style={{padding: '8px', fontSize: '0.8rem'}}>
                          Kolportuj x500<br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-yellow)'}}>+1000 pkt. Sol</span><br/>
                          <span style={{fontSize: '0.7rem', color: 'var(--prl-red)'}}>Ryzyko: 50%</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SŁUŻBA BEZPIECZEŃSTWA (SB) & TW */}
              <div className="panel" style={{borderColor: 'var(--prl-red)', marginTop: '20px'}}>
                <h2 style={{color: 'var(--prl-red)'}}>SŁUŻBA BEZPIECZEŃSTWA (SB)</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '15px', color: 'var(--prl-gray)'}}>
                  SB infiltruje Twoje szeregi. Pomocnicy mogą zostać zwerbowani jako Tajni Współpracownicy (TW) i potajemnie donosić, generując przyrost podejrzenia o +1%/sek. Śledztwo ujawni wtyczki, a Kontrwywiad tymczasowo zamrozi ich działalność.
                </p>

                <div style={{
                  padding: '10px',
                  border: '1px solid ' + (state.sbCounterIntelTimeLeft > 0 ? 'var(--dollar-green)' : 'var(--prl-red)'),
                  background: state.sbCounterIntelTimeLeft > 0 ? 'rgba(51, 255, 51, 0.05)' : 'rgba(204, 0, 0, 0.05)',
                  marginBottom: '15px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.95rem'
                }}>
                  {state.sbCounterIntelTimeLeft > 0 ? (
                    <span style={{color: 'var(--dollar-green)'}}>
                      🛡️ KONTRWYWIAD AKTYWNY: {Math.ceil(state.sbCounterIntelTimeLeft)}s (SB jest ślepe)
                    </span>
                  ) : (
                    <span style={{color: 'var(--prl-red)'}}>
                      ⚠️ BRAK OCHRONY KONTRWYWIADU (Zagrożenie werbunkiem TW)
                    </span>
                  )}
                </div>

                <div style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                  <button 
                    onClick={buyCounterIntel} 
                    disabled={state.pln < 5000} 
                    style={{flex: 1, padding: '8px', fontSize: '0.8rem', borderColor: 'var(--prl-red)', color: 'var(--prl-red)'}}
                  >
                    Opłać Kontrwywiad (-5 000 zł)<br/>
                    <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+5 min bezpiecznej pracy</span>
                  </button>
                  <button 
                    onClick={runInvestigation} 
                    disabled={state.pln < 3000} 
                    style={{flex: 1, padding: '8px', fontSize: '0.8rem', borderColor: 'var(--prl-red)', color: 'var(--prl-red)'}}
                  >
                    Zorganizuj Śledztwo (-3 000 zł)<br/>
                    <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>Wykryj wtyczki w sztabie</span>
                  </button>
                </div>

                <h3 style={{fontSize: '0.9rem', color: 'var(--prl-red)', borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px'}}>
                  UJAWNIENI AGENCI I WTYCZKI SB:
                </h3>

                {(() => {
                  const revealedTwIds = Object.keys(state.sbTwRevealed).filter(id => state.sbTwRevealed[id]);
                  const activeRevealedTwIds = revealedTwIds.filter(id => (state.helpers[id] || 0) > 0);
                  if (activeRevealedTwIds.length === 0) {
                    return (
                      <p style={{fontSize: '0.85rem', color: 'var(--prl-gray)', textAlign: 'center', padding: '10px 0'}}>
                        Brak ujawnionych agentów SB w sztabie pomocników. Uruchom śledztwo, aby zweryfikować lojalność.
                      </p>
                    );
                  }

                  return (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                      {activeRevealedTwIds.map(id => {
                        const h = HELPERS.find(helper => helper.id === id);
                        const isBlackmailed = state.sbTwBlackmailed[id];

                        return (
                          <div 
                            key={id} 
                            style={{
                              border: '1px solid #333', 
                              padding: '10px', 
                              borderRadius: '4px',
                              background: isBlackmailed ? 'rgba(51, 255, 51, 0.02)' : 'rgba(204, 0, 0, 0.02)'
                            }}
                          >
                            <div className="flex justify-between items-center" style={{marginBottom: '10px'}}>
                              <div>
                                <strong style={{color: isBlackmailed ? 'var(--dollar-green)' : 'var(--prl-red)'}}>
                                  {h ? h.name : id}
                                </strong>
                                <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginLeft: '10px'}}>
                                  ({isBlackmailed ? 'PODWÓJNY AGENT' : 'ZWERBOWANY JAKO TW'})
                                </span>
                              </div>
                              {!isBlackmailed && (
                                <span className="text-red" style={{fontSize: '0.85rem', fontWeight: 'bold'}}>
                                  Generuje: +1.0% Podejrzenia/s
                                </span>
                              )}
                            </div>

                            {isBlackmailed ? (
                              <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', margin: 0}}>
                                Donoszenie zablokowane. Agent przekazuje dezinformację do centrali SB.
                              </p>
                            ) : (
                              <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px'}}>
                                <button 
                                  onClick={() => dismissHelperTW(id)} 
                                  style={{padding: '5px', fontSize: '0.75rem', borderColor: 'var(--prl-red)', color: 'var(--prl-red)'}}
                                >
                                  Zwolnij wtyczkę<br/>
                                  <span style={{fontSize: '0.65rem', color: 'var(--prl-gray)'}}>-1 poz. pomocnika</span>
                                </button>
                                <button 
                                  onClick={() => blackmailHelperTW(id)} 
                                  disabled={state.bibulaPisma < 20}
                                  style={{padding: '5px', fontSize: '0.75rem', borderColor: 'var(--prl-red)', color: 'var(--prl-red)'}}
                                >
                                  Zaszantażuj<br/>
                                  <span style={{fontSize: '0.65rem', color: 'var(--prl-gray)'}}>-20 Bibuły</span>
                                </button>
                                <button 
                                  onClick={() => bribeSBHandler(id)} 
                                  disabled={state.dollars < 50}
                                  style={{padding: '5px', fontSize: '0.75rem', borderColor: 'var(--prl-red)', color: 'var(--prl-red)'}}
                                >
                                  Przekup SB<br/>
                                  <span style={{fontSize: '0.65rem', color: 'var(--prl-gray)'}}>-50 USD</span>
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
           </div>
        )}

        {/* TAB: ODZNACZENIA */}
        {currentTab === 'odznaczenia' && (
           <div className="achievements-board">
              <div className="achievements-board-header">
                 <h2 style={{color: 'var(--prl-yellow)'}}>Ludowa Tablica Odznaczeń i Zasług</h2>
                 <p style={{fontSize: '0.9rem', color: 'var(--prl-gray)'}}>
                    Odznaczenia państwowe i resortowe za wybitne zasługi dla gospodarki nieformalnej i budowania dobrobytu.
                    Odblokowano: {Object.keys(state.unlockedAchievements || {}).filter(k => state.unlockedAchievements[k]).length} / {ACHIEVEMENTS.length}
                 </p>
              </div>
              
              {/* Categories */}
              {['ekonomia', 'polityka', 'przemyt', 'prestiz'].map(cat => {
                 const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
                 const catName = cat === 'ekonomia' ? 'Zasługi Ekonomiczne (Spekulacja)' :
                                 cat === 'polityka' ? 'Zasługi Polityczne (Nomenklatura)' :
                                 cat === 'przemyt' ? 'Zasługi Logistyczne (Przemyt i Czarny Rynek)' :
                                 'Zasługi Państwowe (Prestiż)';
                                 
                 return (
                    <div key={cat} style={{marginBottom: '30px'}}>
                       <h3 className="achievements-category-title">{catName}</h3>
                       <div className="achievements-grid">
                          {catAchievements.map(ach => {
                             const isUnlocked = !!state.unlockedAchievements[ach.id];
                             return (
                                <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : ''}`}>
                                   <div>
                                      <div className="achievement-title">{ach.name}</div>
                                      <div className="achievement-desc">{ach.desc}</div>
                                   </div>
                                   <div className="achievement-reward">
                                      Nagroda: {ach.rewardDesc}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    </div>
                 );
              })}
            </div>
         )}

         {/* TAB: GIEŁDA (GPW) */}
         {currentTab === 'gpw' && (() => {
            const isGpwUnlocked = state.okraglyStolVictory || state.gpwUnlocked || state.pln >= 1000000 || Object.values(state.sharesOwned || {}).some(count => count > 0);
            
            if (!isGpwUnlocked) {
              return (
                <div className="panel" style={{borderColor: 'var(--prl-red)', textAlign: 'center', padding: '40px 20px'}}>
                  <h2 style={{color: 'var(--prl-red)', fontSize: '1.8rem', letterSpacing: '2px', marginBottom: '20px'}}>
                    GIEŁDA PAPIERÓW WARTOŚCIOWYCH (GPW)<br/>
                    <span style={{fontSize: '1rem', color: 'var(--prl-gray)'}}>🔒 SEKRETARIAT KONTROLNY UOP</span>
                  </h2>
                  <div style={{maxWidth: '600px', margin: '0 auto', fontSize: '1rem', lineHeight: '1.6', color: 'var(--crt-text)', marginBottom: '30px'}}>
                    <p>Wielki finał transformacji ustrojowej i gospodarczej! Polskie giełdy i prywatyzacja państwowych kombinatów zostaną otwarte po podpisaniu porozumień przy <strong>Okrągłym Stole</strong> (pełne zwycięstwo Solidarności) lub po zebraniu pierwszego miliona złotych gotówki (<strong>1 000 000 zł</strong>).</p>
                  </div>
                  <div className="flex gap-4 justify-center" style={{flexWrap: 'wrap'}}>
                    <button 
                      onClick={() => {
                        if (state.dollars >= 5000) {
                          playSuccess();
                          updateState(s => ({ ...s, dollars: s.dollars - 5000, gpwUnlocked: true }));
                          addToast("GPW ODBLOKOWANE", "Otworzyłeś rynek GPW za kapitał zagraniczny!");
                        } else {
                          playError();
                          showAlert("Brak wystarczającej liczby dolarów! Potrzebujesz $5 000 USD kapitału zagranicznego.", "Błąd odblokowania", "error");
                        }
                      }}
                      style={{padding: '10px 20px', borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)'}}
                    >
                      Zainwestuj kapitał zagraniczny ($5 000 USD)
                    </button>
                  </div>
                </div>
              );
            }

            const selectedStock = GPW_STOCKS.find(s => s.id === selectedStockId) || GPW_STOCKS[0];
            const currentPrice = state.stockPrices[selectedStock.id] || selectedStock.basePrice;
            const avgCost = state.sharesAvgCost[selectedStock.id] || 0;
            const ownedCount = state.sharesOwned[selectedStock.id] || 0;
            const history = state.stockPriceHistories[selectedStock.id] || [selectedStock.basePrice];
            
            const totalValue = ownedCount * currentPrice;
            const totalCost = ownedCount * avgCost;
            const profitLoss = totalValue - totalCost;
            const profitLossPercent = avgCost > 0 ? ((currentPrice - avgCost) / avgCost) * 100 : 0;

            const commissionRate = state.unlockedAchievements?.['gpw_wolf'] ? 0.0 : 0.01;

            const chartWidth = 500;
            const chartHeight = 160;
            const padding = 15;
            
            const minPrice = Math.min(...history) * 0.95;
            const maxPrice = Math.max(...history) * 1.05;
            const priceRange = maxPrice - minPrice || 1;
            
            const points = history.map((price, idx) => {
              const x = padding + (idx / (history.length - 1 || 1)) * (chartWidth - padding * 2);
              const y = chartHeight - padding - ((price - minPrice) / priceRange) * (chartHeight - padding * 2);
              return `${x},${y}`;
            }).join(' ');

            return (
              <div className="flex-col gap-4">
                {/* Ticker zdarzeń giełdowych */}
                {state.gpwActiveEvent && (
                  <div className="panel" style={{borderColor: 'var(--prl-yellow)', animation: 'pulse 2s infinite', padding: '10px 15px', marginBottom: '10px'}}>
                    <div style={{color: 'var(--prl-yellow)', fontWeight: 'bold', fontSize: '0.9rem'}}>⚠️ AKTYWNE ZDARZENIE RYNKOWE:</div>
                    <div style={{fontSize: '1.1rem', marginTop: '2px'}}>
                      <strong>{GPW_EVENTS.find(e => e.id === state.gpwActiveEvent)?.name}</strong>: {GPW_EVENTS.find(e => e.id === state.gpwActiveEvent)?.desc}
                      <span style={{color: 'var(--prl-gray)', marginLeft: '10px'}}>({state.gpwEventTimeLeft}s)</span>
                    </div>
                  </div>
                )}

                {/* Przecieki UOP status */}
                {state.gpwInsiderTip && (
                  <div className="panel" style={{borderColor: '#39ff14', padding: '10px 15px', marginBottom: '10px'}}>
                    <div style={{color: '#39ff14', fontWeight: 'bold', fontSize: '0.9rem'}}>🕵️ PRZECIEK OD TW (INFORMACJE INSIDERSKIE):</div>
                    <div style={{fontSize: '1rem', marginTop: '2px', color: 'var(--crt-text)'}}>
                      Poufne źródła wskazują, że akcje spółki <strong>{GPW_STOCKS.find(s => s.id === state.gpwInsiderTip?.stockId)?.name}</strong> pójdą w kierunku: <strong style={{color: state.gpwInsiderTip?.effect === 'up' ? '#39ff14' : 'var(--prl-red)'}}>{state.gpwInsiderTip?.effect === 'up' ? 'W GÓRĘ' : 'W DÓŁ'}</strong> przez jeszcze {(state.gpwInsiderTip?.ticksLeft || 0) * 10} sekund.
                    </div>
                  </div>
                )}

                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                  {/* Lewa kolumna: Lista Spółek */}
                  <div className="panel" style={{borderColor: '#39ff14'}}>
                    <h2 style={{color: '#39ff14', letterSpacing: '1px', fontSize: '1.4rem'}}>PRYWATYZOWANE PRZEDSIĘBIORSTWA</h2>
                    <div style={{maxHeight: '400px', overflowY: 'auto', marginTop: '10px'}}>
                      {GPW_STOCKS.map(stock => {
                        const price = state.stockPrices[stock.id] || stock.basePrice;
                        const owned = state.sharesOwned[stock.id] || 0;
                        const isSelected = selectedStockId === stock.id;
                        const baseDiff = ((price - stock.basePrice) / stock.basePrice) * 100;

                        return (
                          <div 
                            key={stock.id} 
                            onClick={() => { playClick(); setSelectedStockId(stock.id); }}
                            className="flex justify-between items-center"
                            style={{
                              padding: '10px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #222',
                              backgroundColor: isSelected ? 'rgba(57, 255, 20, 0.1)' : 'transparent',
                              borderLeft: isSelected ? '3px solid #39ff14' : 'none'
                            }}
                          >
                            <div className="flex-col">
                              <span style={{fontWeight: 'bold', color: isSelected ? '#39ff14' : 'var(--crt-text)'}}>{stock.name}</span>
                              <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Dywidenda: {(stock.dividendRate * 100).toFixed(1)}% co 30s | Posiadasz: {owned}</span>
                            </div>
                            <div style={{textAlign: 'right'}} className="flex-col">
                              <span style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{price} zł</span>
                              <span style={{fontSize: '0.8rem', color: baseDiff >= 0 ? '#39ff14' : 'var(--prl-red)'}}>
                                {baseDiff >= 0 ? '+' : ''}{baseDiff.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Prawa kolumna: Detale i Wykres */}
                  <div className="panel flex-col gap-4" style={{borderColor: '#39ff14'}}>
                    <div className="flex justify-between items-start">
                      <div className="flex-col">
                        <h2 style={{color: '#39ff14', fontSize: '1.4rem', margin: 0}}>{selectedStock.name}</h2>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>{selectedStock.desc}</span>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontSize: '1.6rem', fontWeight: 'bold', color: '#39ff14'}}>{currentPrice} zł</div>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>Cena debiutu: {selectedStock.basePrice} zł</span>
                      </div>
                    </div>

                    {/* Wykres SVG */}
                    <div style={{background: '#000', border: '1px solid #111', borderRadius: '4px', overflow: 'hidden', position: 'relative'}}>
                      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{display: 'block'}}>
                        {[0, 1, 2, 3, 4].map(i => {
                          const y = padding + (i / 4) * (chartHeight - padding * 2);
                          return <line key={i} x1="0" y1={y} x2={chartWidth} y2={y} stroke="#111" strokeDasharray="3" />;
                        })}
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                          const x = padding + (i / 7) * (chartWidth - padding * 2);
                          return <line key={i} x1={x} y1="0" x2={x} y2={chartHeight} stroke="#111" strokeDasharray="3" />;
                        })}

                        {history.length > 1 && (
                          <polyline
                            fill="none"
                            stroke="#39ff14"
                            strokeWidth="2"
                            points={points}
                            style={{ filter: 'drop-shadow(0px 0px 3px rgba(57, 255, 20, 0.7))' }}
                          />
                        )}
                        
                        {history.length > 0 && (() => {
                          const x = chartWidth - padding;
                          const y = chartHeight - padding - ((currentPrice - minPrice) / priceRange) * (chartHeight - padding * 2);
                          return <circle cx={x} cy={y} r="4" fill="#39ff14" />;
                        })()}
                      </svg>
                      <div style={{position: 'absolute', top: '5px', left: '10px', fontSize: '0.65rem', color: 'rgba(57, 255, 20, 0.4)'}}>CRT_MONITOR_GPW_v1.0</div>
                    </div>

                    {/* Portfel i transakcje */}
                    <div style={{background: 'rgba(57, 255, 20, 0.05)', border: '1px dashed rgba(57, 255, 20, 0.3)', padding: '12px', borderRadius: '4px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.9rem'}}>
                        <span>Posiadane akcje: <strong>{ownedCount}</strong></span>
                        <span>Średnia cena zakupu: <strong>{avgCost > 0 ? `${avgCost} zł` : 'brak'}</strong></span>
                      </div>
                      <div className="flex justify-between items-center mt-2" style={{fontSize: '0.9rem'}}>
                        <span>Wycena portfela: <strong>{totalValue} zł</strong></span>
                        <span>Zysk / Strata: 
                          <strong style={{color: profitLoss >= 0 ? '#39ff14' : 'var(--prl-red)', marginLeft: '5px'}}>
                            {profitLoss >= 0 ? '+' : ''}{profitLoss} zł ({profitLossPercent >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%)
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Kupno / Sprzedaż Buttons */}
                    <div className="flex-col gap-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => buyShares(selectedStock.id, 1)} 
                          style={{flex: 1, backgroundColor: 'transparent', color: '#39ff14', borderColor: '#39ff14'}}
                        >
                          Kup 1x
                        </button>
                        <button 
                          onClick={() => buyShares(selectedStock.id, 10)} 
                          style={{flex: 1, backgroundColor: 'transparent', color: '#39ff14', borderColor: '#39ff14'}}
                        >
                          Kup 10x
                        </button>
                        <button 
                          onClick={() => buyShares(selectedStock.id, 100)} 
                          style={{flex: 1, backgroundColor: 'transparent', color: '#39ff14', borderColor: '#39ff14'}}
                        >
                          Kup 100x
                        </button>
                        <button 
                          onClick={() => {
                            const crashDiscount = state.unlockedAchievements?.['gpw_crash'] ? 0.85 : 1.0;
                            const finalPrice = Math.round(currentPrice * crashDiscount);
                            const unitCost = finalPrice + Math.round(finalPrice * commissionRate);
                            const maxBuy = Math.floor(state.pln / unitCost);
                            if (maxBuy > 0) {
                              buyShares(selectedStock.id, maxBuy);
                            } else {
                              playError();
                            }
                          }}
                          style={{flex: 1, backgroundColor: '#39ff14', color: '#000', borderColor: '#39ff14'}}
                        >
                          Kup Max
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => sellShares(selectedStock.id, 1)} 
                          disabled={ownedCount < 1}
                          style={{flex: 1, borderColor: 'var(--prl-red)', color: 'var(--prl-red)', backgroundColor: 'transparent'}}
                        >
                          Sprzedaj 1x
                        </button>
                        <button 
                          onClick={() => sellShares(selectedStock.id, 10)} 
                          disabled={ownedCount < 10}
                          style={{flex: 1, borderColor: 'var(--prl-red)', color: 'var(--prl-red)', backgroundColor: 'transparent'}}
                        >
                          Sprzedaj 10x
                        </button>
                        <button 
                          onClick={() => sellShares(selectedStock.id, 100)} 
                          disabled={ownedCount < 100}
                          style={{flex: 1, borderColor: 'var(--prl-red)', color: 'var(--prl-red)', backgroundColor: 'transparent'}}
                        >
                          Sprzedaj 100x
                        </button>
                        <button 
                          onClick={() => {
                            if (ownedCount > 0) {
                              sellShares(selectedStock.id, ownedCount);
                            } else {
                              playError();
                            }
                          }}
                          disabled={ownedCount <= 0}
                          style={{flex: 1, backgroundColor: 'var(--prl-red)', color: '#000', borderColor: 'var(--prl-red)'}}
                        >
                          Sprzedaj Max
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sekcja: Spekulacja UOP (Insider Tips) */}
                <div className="panel" style={{borderColor: 'var(--prl-yellow)'}}>
                  <h2 style={{color: 'var(--prl-yellow)', fontSize: '1.4rem'}}>SPEKULACJE I INFORMACJE NIEJAWNE (TW / UOP)</h2>
                  <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                    Opłać nieoficjalnego pośrednika w biurze UOP lub zwerbowanego agenta, aby pozyskać ściśle tajny przeciek dotyczący kierunku wahań wybranej spółki. Kupowanie przecieku natychmiast zwiększa twoje Podejrzenie u Milicji o <strong>+15%</strong>.
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => buyGpwInsiderTip('pln')}
                      style={{flex: 1, borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: 'transparent'}}
                    >
                      Kup przeciek za gotówkę (50 000 zł)
                    </button>
                    <button 
                      onClick={() => buyGpwInsiderTip('dollars')}
                      style={{flex: 1, borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)', backgroundColor: 'transparent'}}
                    >
                      Kup przeciek za dewizy ($1 000 USD)
                    </button>
                  </div>
                </div>
              </div>
            );
         })()}

        {/* TAB: KONTA ZAGRANICZNE (SZWAJCARIA I LIECHTENSTEIN) */}
        {currentTab === 'offshore' && (() => {
           const isUnlocked = state.swissAccountUnlocked;
           const isInterpolLockdown = state.interpolLockdownTimeLeft > 0;
           
           if (!isUnlocked) {
             return (
               <div className="panel flex-col items-center justify-center text-center" style={{borderColor: 'gold', padding: '40px 20px', minHeight: '400px', backgroundColor: '#07162c'}}>
                 <h2 style={{color: 'gold', fontSize: '2rem', textShadow: '0 0 10px rgba(255, 215, 0, 0.3)', margin: '0 0 15px 0'}}>🇨🇭 SZWAJCARSKI BANK OFFSHORE (ZURYCH)</h2>
                 <p style={{maxWidth: '600px', fontSize: '1rem', color: '#b0c4de', lineHeight: '1.6', margin: '0 0 30px 0'}}>
                   Załóż tajne konto numeryczne w szwajcarskim banku. Pozwoli Ci to zabezpieczyć kapitał przed szalejącą w kraju hiperinflacją, inwigilacją Służby Bezpieczeństwa oraz lokować wolne dewizy na oprocentowanych lokatach terminowych.
                 </p>
                 <div style={{display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', maxWidth: '500px'}}>
                   <button 
                     onClick={() => openSwissAccount('pln')}
                     disabled={state.pln < 250000}
                     style={{
                       flex: 1,
                       padding: '15px',
                       borderColor: 'gold',
                       color: 'gold',
                       backgroundColor: 'transparent',
                       fontSize: '1rem'
                     }}
                   >
                     Otwórz za gotówkę<br/>
                     <strong>250 000 zł</strong>
                   </button>
                   <button 
                     onClick={() => openSwissAccount('dollars')}
                     disabled={state.dollars < 5000}
                     style={{
                       flex: 1,
                       padding: '15px',
                       borderColor: 'var(--pewex-blue)',
                       color: 'var(--pewex-blue)',
                       backgroundColor: 'transparent',
                       fontSize: '1rem'
                     }}
                   >
                     Otwórz za dewizy<br/>
                     <strong>$5 000 USD</strong>
                   </button>
                 </div>
               </div>
             );
           }

           let totalAssetValue = 0;
           NOMENKLATURA_COMPANIES.forEach(comp => {
             const companyState = state.nomenklaturaCompanies?.[comp.id];
             if (companyState && companyState.registered) {
               totalAssetValue += comp.costPln;
               const assetLevel = companyState.assetLevel || 0;
               const baseUpgradeCost = Math.floor(comp.costPln * 0.5);
               for (let i = 0; i < assetLevel; i++) {
                 totalAssetValue += Math.round(baseUpgradeCost * Math.pow(2.2, i));
               }
             }
           });

           const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
           let inflationMult = 1 + (state.inflationPercent / 100);
           if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
           const currentMarketRate = Math.floor(baseRate * inflationMult);
           const maxUsdCredit = currentMarketRate > 0 ? Math.floor((totalAssetValue * 0.5) / currentMarketRate) : 0;

           return (
             <div className="flex-col gap-4" style={{color: '#b0c4de'}}>
               {/* Nagłówek Konta */}
               <div className="panel" style={{borderColor: 'gold', backgroundColor: '#07162c', padding: '20px'}}>
                 <div className="flex justify-between items-center flex-wrap gap-4">
                   <div>
                     <span style={{fontSize: '0.85rem', color: '#8fa9c4'}}>SZWAJCARSKIE KONTO NUMERYCZNE:</span>
                     <h2 style={{margin: '2px 0 0 0', color: 'gold', fontSize: '1.8rem', letterSpacing: '2px'}}>{state.swissAccountNumber}</h2>
                   </div>
                   <div className="flex gap-4">
                     <div className="flex-col text-right" style={{background: 'rgba(255,215,0,0.05)', padding: '10px 20px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.2)'}}>
                       <span style={{fontSize: '0.75rem', color: '#8fa9c4'}}>SALDO PLN (OFFSHORE)</span>
                       <span style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'gold'}}>{(state.swissBalancePln || 0).toLocaleString()} zł</span>
                     </div>
                     <div className="flex-col text-right" style={{background: 'rgba(0,225,217,0.05)', padding: '10px 20px', borderRadius: '4px', border: '1px solid rgba(0,225,217,0.2)'}}>
                       <span style={{fontSize: '0.75rem', color: '#8fa9c4'}}>SALDO USD (DEWIZY)</span>
                       <span style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#00e1d9'}}>${(state.swissBalanceUsd || 0).toLocaleString()}</span>
                     </div>
                   </div>
                 </div>

                 {/* Interpol Tracker */}
                 <div style={{marginTop: '20px', borderTop: '1px solid #1a324f', paddingTop: '15px'}}>
                   <div className="flex justify-between items-center mb-1">
                     <span style={{fontSize: '0.8rem', color: 'var(--prl-red)'}}>🚨 MONITORING OPERACJI FINANSOWYCH (INTERPOL)</span>
                     <span style={{fontSize: '1rem', fontWeight: 'bold', color: 'var(--prl-red)'}}>{(state.interpolSuspicion || 0).toFixed(1)}%</span>
                   </div>
                   <div style={{background: '#111', height: '10px', borderRadius: '3px', overflow: 'hidden'}}>
                     <div style={{
                       background: 'linear-gradient(90deg, #ff9900, #ff0000)',
                       width: `${state.interpolSuspicion || 0}%`,
                       height: '100%',
                       transition: 'width 0.2s ease'
                     }}></div>
                   </div>
                 </div>
               </div>

               {/* Interpol Block active */}
               {isInterpolLockdown && (
                 <div className="panel" style={{borderColor: 'var(--prl-red)', backgroundColor: 'rgba(255,0,0,0.05)', textAlign: 'center', padding: '15px', animation: 'pulse 1.5s infinite'}}>
                   <h3 style={{color: 'var(--prl-red)', margin: '0 0 5px 0'}}>⚠️ BLOKADA INTERPOLU AKTYWNA</h3>
                   <p style={{margin: 0, fontSize: '0.9rem'}}>
                     Dostęp do szwajcarskiego banku został zablokowany na czas audytu międzynarodowego. Przelewy i lokaty zamrożone.<br/>
                     Pozostało: <strong>{Math.round(state.interpolLockdownTimeLeft)} sekund</strong>.
                   </p>
                 </div>
               )}

               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                 {/* Kredyt Offshore */}
                 <div className="panel" style={{borderColor: state.offshoreCreditTaken > 0 ? 'var(--prl-yellow)' : 'var(--crt-border)'}}>
                   <h3>🏦 POŻYCZKA DEWIZOWA (KREDYT OFFSHORE)</h3>
                   <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                     Zaciągnij natychmiastowy kredyt w dolarach pod zastaw prywatnego majątku w Polsce. Opcja wymaga posiadania spółek nomenklaturowych. Spłata (wraz z prowizją 10%) musi nastąpić w ciągu 5 minut, inaczej bank zwindykuje zastaw (spadek poziomu leasingu maszyn w spółkach o 2 poziomy).
                   </p>

                   {state.offshoreCreditTaken <= 0 ? (
                     <div className="flex-col gap-2">
                       <div style={{fontSize: '0.85rem'}}>Twój majątek krajowy pozwala na pożyczenie do: <strong style={{color: '#00e1d9'}}>${maxUsdCredit.toLocaleString()} USD</strong></div>
                       <button 
                         disabled={maxUsdCredit <= 0 || isInterpolLockdown}
                         onClick={takeOffshoreCredit}
                         style={{width: '100%', padding: '10px', borderColor: maxUsdCredit > 0 ? '#00e1d9' : 'var(--prl-gray)', color: maxUsdCredit > 0 ? '#00e1d9' : 'var(--prl-gray)', backgroundColor: 'transparent'}}
                       >
                         Zaciągnij kredyt dewizowy (${maxUsdCredit.toLocaleString()} USD)
                       </button>
                     </div>
                   ) : (
                     <div className="flex-col gap-2">
                       <div style={{color: 'var(--prl-yellow)', fontWeight: 'bold'}}>Aktywny kredyt: ${state.offshoreCreditTaken.toLocaleString()} USD</div>
                       <div style={{fontSize: '0.85rem'}}>Pozostało czasu na spłatę: <strong style={{color: 'var(--prl-red)'}}>{Math.floor(state.offshoreCreditTimeLeft)}s</strong></div>
                       <div style={{fontSize: '0.85rem'}}>Koszt spłaty (kredyt + 10% prowizji): <strong style={{color: '#00e1d9'}}>${Math.round(state.offshoreCreditTaken * 1.10).toLocaleString()} USD</strong></div>
                       <button 
                         disabled={state.swissBalanceUsd < Math.round(state.offshoreCreditTaken * 1.10) || isInterpolLockdown}
                         onClick={payOffshoreCredit}
                         style={{width: '100%', padding: '10px', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: 'transparent', marginTop: '10px'}}
                       >
                         Spłać kredyt z konta szwajcarskiego (${Math.round(state.offshoreCreditTaken * 1.10).toLocaleString()} USD)
                       </button>
                     </div>
                   )}
                 </div>

                 {/* Liechtenstein Trust */}
                 <div className="panel" style={{borderColor: state.hasLiechtensteinTrust ? 'var(--dollar-green)' : 'var(--crt-border)'}}>
                   <h3>🛡️ FUNDACJA POWIERNICZA W LIECHTENSTEINIE</h3>
                   <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                     Załóż prywatną fundację rodzinną w Vaduz (księstwo Liechtenstein). Chroni Twój zgromadzony w kraju majątek przed roszczeniami oraz konfiskatami SB/NIK. Fundacja redukuje utratę krajowych PLN z kontroli o 80% (95% z odznaczeniem).
                   </p>

                   {state.hasLiechtensteinTrust ? (
                     <div style={{background: 'rgba(0,255,0,0.05)', border: '1px solid var(--dollar-green)', color: 'var(--dollar-green)', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '3px'}}>
                       🛡️ TARCZA OFFSHORE VADUZ: AKTYWNA
                     </div>
                   ) : (
                     <button 
                       disabled={state.dollars < 20000}
                       onClick={registerLiechtensteinTrust}
                       style={{width: '100%', padding: '10px', borderColor: state.dollars >= 20000 ? 'var(--dollar-green)' : 'var(--prl-gray)', color: state.dollars >= 20000 ? 'var(--dollar-green)' : 'var(--prl-gray)', backgroundColor: 'transparent'}}
                     >
                       Zarejestruj fundację w Vaduz ($20 000 USD)
                     </button>
                   )}
                 </div>
               </div>

               {/* Operacje Dewizowe (dwie kolumny) */}
               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                 {/* Kolumna 1: Przelewy i Pranie gotówki */}
                 <div className="flex-col gap-4">
                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'gold'}}>1. TRANSFER ŚRODKÓW DO ZURYCHU</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Przelej PLN lub USD ze swojej krajowej gotówki do Szwajcarii.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota transferu..."
                         value={offshoreTransferAmount}
                         onChange={e => setOffshoreTransferAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { wireTransferToSwiss(val, 'pln'); setOffshoreTransferAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem'}}
                       >
                         SWIFT (PLN)
                       </button>
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { wireTransferToSwiss(val, 'dollars'); setOffshoreTransferAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem', borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)'}}
                       >
                         SWIFT (USD)
                       </button>
                     </div>

                     <div className="flex gap-2 mt-2">
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { sendOffshoreCourier(val, 'pln'); setOffshoreTransferAmount(''); }
                         }}
                         style={{flex: 1, padding: '8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)'}}
                       >
                         Szmugiel kurierem (PLN)
                       </button>
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { sendOffshoreCourier(val, 'dollars'); setOffshoreTransferAmount(''); }
                         }}
                         style={{flex: 1, padding: '8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)'}}
                       >
                         Szmugiel kurierem (USD)
                       </button>
                     </div>

                     {/* Aktywne przelewy/kurierzy */}
                     {((state.activeWireTransfers || []).length > 0 || (state.activeCouriers || []).length > 0) && (
                       <div style={{marginTop: '15px', borderTop: '1px solid #222', paddingTop: '10px'}}>
                         <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)', fontWeight: 'bold'}}>TRANSFERY W DRODZE:</span>
                         <div style={{maxHeight: '250px', overflowY: 'auto', marginTop: '5px'}}>
                           {(state.activeWireTransfers || []).map(w => (
                             <div key={w.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                               <span>⚡ SWIFT: {w.amount.toLocaleString()} {w.currency === 'pln' ? 'zł' : 'USD'}</span>
                               <span style={{color: 'gold'}}>Księgowanie: {Math.round(w.timeLeft)}s</span>
                             </div>
                           ))}
                           {(state.activeCouriers || []).map(c => (
                             <div key={c.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                               <span>🏃 Kurier: {c.amount.toLocaleString()} {c.currency === 'pln' ? 'zł' : 'USD'}</span>
                               <span style={{color: 'var(--prl-yellow)'}}>W podróży: {Math.round(c.timeLeft)}s</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'var(--dollar-green)'}}>2. POLISA PRALNICZA (WYCOFANIE DO KRAJU)</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Wypłać PLN ze swojego konta szwajcarskiego z powrotem do Polski jako legalnie udokumentowany kapitał. Wprowadzenie tych środków natychmiast obniża krajowe Podejrzenie Milicji o 20%.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota prania PLN..."
                         value={offshoreWashAmount}
                         onChange={e => setOffshoreWashAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreWashAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreWashAmount);
                           if (val > 0) { washOffshoreMoney(val); setOffshoreWashAmount(''); }
                         }}
                         style={{padding: '8px 15px', borderColor: 'var(--dollar-green)', color: 'var(--dollar-green)'}}
                       >
                         Pierze gotówkę
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Kolumna 2: Inwestycje i Lokaty */}
                 <div className="flex-col gap-4">
                   <div className="panel flex-col gap-2">
                     <h3>3. KANTOR DEWIZOWY W ZURYCHU</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Bezpieczna i szybka wymiana walut offshore. Kurs: <strong style={{color: 'gold'}}>1 USD = {currentMarketRate.toLocaleString()} PLN</strong>.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota wymiany..."
                         value={offshoreExchangeAmount}
                         onChange={e => setOffshoreExchangeAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreExchangeAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreExchangeAmount);
                           if (val > 0) { zurichExchange(val, 'pln'); setOffshoreExchangeAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem'}}
                       >
                         {"PLN -> USD"}
                       </button>
                       <button 
                         disabled={!offshoreExchangeAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreExchangeAmount);
                           if (val > 0) { zurichExchange(val, 'usd'); setOffshoreExchangeAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem', borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)'}}
                       >
                          {"USD -> PLN"}
                       </button>
                     </div>
                   </div>

                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'gold'}}>4. LOKATY TERMINOWE (TERM DEPOSITS)</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Zamroź kapitał na lokacie, aby uzyskać wysokie stopy zwrotu po określonym czasie.</p>

                     <div className="flex gap-2 items-center" style={{marginTop: '5px', borderBottom: '1px solid #222', paddingBottom: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota lokaty..."
                         value={offshoreDepositAmount}
                         onChange={e => setOffshoreDepositAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <select 
                         id="offshore-dep-currency"
                         style={{background: '#111', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '0.8rem'}}
                       >
                         <option value="pln">PLN</option>
                         <option value="dollars">USD</option>
                       </select>
                     </div>

                     <div style={{maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                       {OFFSHORE_DEPOSITS.map(dep => {
                         const hasLaundry = state.unlockedAchievements?.['offshore_laundry'];
                         const interestMult = hasLaundry ? 1.20 : 1.00;
                         const ratePct = Math.round(dep.interestRate * interestMult * 100);

                         return (
                           <div key={dep.id} className="flex justify-between items-center mt-3" style={{borderBottom: '1px solid #222', paddingBottom: '8px'}}>
                             <div className="flex-col">
                               <span style={{fontWeight: 'bold', color: 'gold', fontSize: '0.85rem'}}>{dep.name} (+{ratePct}%)</span>
                               <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>{dep.desc}</span>
                             </div>
                             <button 
                               disabled={!offshoreDepositAmount || isInterpolLockdown}
                               onClick={() => {
                                 const val = parseInt(offshoreDepositAmount);
                                 const cur = (document.getElementById('offshore-dep-currency') as HTMLSelectElement)?.value as 'pln' | 'dollars';
                                 if (val > 0) {
                                   createOffshoreDeposit(val, cur, dep.id);
                                   setOffshoreDepositAmount('');
                                 }
                               }}
                               style={{padding: '5px 10px', fontSize: '0.75rem', borderColor: 'gold', color: 'gold'}}
                             >
                               Otwórz
                             </button>
                           </div>
                         );
                       })}
                     </div>

                     {/* Aktywne lokaty */}
                     {(state.activeOffshoreDeposits || []).length > 0 && (
                       <div style={{marginTop: '15px', borderTop: '1px solid #222', paddingTop: '10px'}}>
                         <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)', fontWeight: 'bold'}}>AKTYWNE LOKATY:</span>
                         <div style={{maxHeight: '250px', overflowY: 'auto', marginTop: '5px'}}>
                           {(state.activeOffshoreDeposits || []).map(d => {
                             const type = OFFSHORE_DEPOSITS.find(t => t.id === d.depositTypeId);
                             return (
                               <div key={d.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                                 <span>📈 {type?.name || 'Lokata'}: {d.amount.toLocaleString()} {d.currency === 'pln' ? 'zł' : 'USD'}</span>
                                 <span style={{color: 'gold'}}>Czas: {Math.round(d.timeLeft)}s</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           );
         })()}

        {/* TAB: SYNDYKAT EKSPORTOWY */}
        {currentTab === 'syndykat' && (() => {
          const hasSafeHouse = state.syndicateUpgrades['safe_house'];
          const totalInventory = Object.values(state.cocomInventory || {}).reduce((a, b) => a + b, 0);
          
          if (!state.syndicateUnlocked) {
            return (
              <div className="panel" style={{borderColor: '#c0392b', color: '#c0392b'}}>
                <h2 style={{color: '#c0392b'}}>SYNDYKAT EKSPORTOWY</h2>
                <div style={{color: 'var(--crt-text)', marginBottom: '20px', lineHeight: '1.5'}}>
                  <p>Szwajcarskie konta i zaplecze biznesowe otwierają nowe możliwości. Najbardziej intratnym, ale i najniebezpieczniejszym zajęciem w bloku wschodnim jest handel technologiami objętymi zachodnim embargiem (COCOM).</p>
                  <p style={{marginTop: '10px'}}>Załóż zorganizowany syndykat, zdobywaj strategiczne technologie za dolary i przemycaj je na Wschód za gigantyczne kwoty w PLN. Zyski możesz następnie legalizować (prać), zacierając ślady.</p>
                </div>
                <button 
                  onClick={unlockSyndicate}
                  style={{padding: '20px', fontSize: '1.2rem', backgroundColor: '#c0392b', color: '#fff', width: '100%'}}
                >
                  ZAŁÓŻ SYNDYKAT EKSPORTOWY
                </button>
              </div>
            );
          }

          return (
            <div className="flex-col gap-4">
              {/* HEADER - STATUS */}
              <div className="panel" style={{borderColor: '#c0392b', padding: '15px'}}>
                <div className="flex justify-between items-center mb-2">
                  <h2 style={{color: '#c0392b', margin: 0}}>SYNDYKAT EKSPORTOWY</h2>
                  <div style={{fontSize: '1.2rem', color: '#39ff14'}}>
                    Nielegalne Zyski: <span style={{fontWeight: 'bold'}}>{(state.cocomProceedsPln || 0).toLocaleString()} zł</span>
                  </div>
                </div>

                {state.activeGeoEvent && (
                  <div style={{backgroundColor: '#4a0e0e', padding: '10px', border: '1px solid #ff3333', color: '#ff3333', marginBottom: '10px', borderRadius: '4px'}}>
                    <strong>🚨 ZDARZENIE GEOPOLITYCZNE:</strong> {GEOPOLITICAL_EVENTS.find(e => e.id === state.activeGeoEvent)?.name} 
                    <span style={{float: 'right', color: 'gold'}}>Czas: {Math.round(state.geoEventTimeLeft)}s</span>
                  </div>
                )}
                {state.embassyImmunityCooldown > 0 && (
                  <div style={{color: '#00e1d9', fontSize: '0.8rem', marginBottom: '5px'}}>
                    🛡️ Immunitet dyplomatyczny odnawia się: {Math.round(state.embassyImmunityCooldown)}s
                  </div>
                )}
              </div>

              <div className="game-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                {/* MAGAZYN I TRASY */}
                <div className="flex-col gap-4">
                  
                  {/* KATALOG COCOM */}
                  <div className="panel" style={{borderColor: '#8e44ad'}}>
                    <h3 style={{color: '#8e44ad'}}>Katalog COCOM (Zakup za USD)</h3>
                    <div className="game-grid" style={{gridTemplateColumns: '1fr', gap: '10px'}}>
                      {COCOM_ITEMS.map(item => {
                        const count = state.cocomInventory[item.id] || 0;
                        const canAfford = (state.swissBalanceUsd || 0) >= item.costUsd;
                        const ranks = ['czlonek', 'sekretarz', 'dyrektor', 'wiceminister', 'minister', 'biuro'];
                        const hasRank = !item.requiredPartyRank || state.syndicateUpgrades['nuclear_clearance'] || ranks.indexOf(state.partyRank || '') >= ranks.indexOf(item.requiredPartyRank);
                        
                        return (
                          <div key={item.id} style={{border: '1px dashed var(--crt-text)', padding: '10px'}}>
                            <div className="flex justify-between items-center mb-2">
                              <strong style={{color: '#00e1d9'}}>{item.name}</strong>
                              <span>Magazyn: <strong style={{color: count > 0 ? '#39ff14' : 'var(--crt-text)'}}>{count}</strong></span>
                            </div>
                            <div style={{fontSize: '0.75rem', marginBottom: '10px', color: '#aaa'}}>{item.desc}</div>
                            <div className="flex justify-between items-center">
                              <span style={{color: '#ff33ff'}}>Ryzyko bazy: {item.riskPercent}%</span>
                              <button 
                                onClick={() => buyCOCOMItem(item.id)}
                                disabled={!canAfford || !hasRank}
                                style={{padding: '5px 15px', backgroundColor: canAfford && hasRank ? '#00e1d9' : 'transparent', color: canAfford && hasRank ? '#000' : 'var(--crt-text)'}}
                              >
                                {hasRank ? `Kup: $${item.costUsd.toLocaleString()}` : `Wymaga: ${item.requiredPartyRank?.toUpperCase()}`}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* LOGISTYKA I PRANIE */}
                <div className="flex-col gap-4">
                  
                  {/* PRANIE PIENIĘDZY (REWORK L9) */}
                  <div className="panel" style={{borderColor: '#2ecc71'}}>
                    <h3 style={{color: '#2ecc71'}}>Pralnia Pieniędzy i Transfery Offshore</h3>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Legalizuj brudne złote na czyste PLN (zmniejsza podejrzenia SB) lub ryzykownie prać je na twardą walutę USD przez zagraniczne spółki-słupy (ogromna prowizja, ryzyko Interpolu).</p>
                    <div className="flex gap-2 mb-2">
                       <button onClick={() => launderCocomProceeds(50000, 'pln')} disabled={(state.cocomProceedsPln || 0) < 50000} style={{flex: 1}}>Pierz 50k ➔ PLN</button>
                       <button onClick={() => launderCocomProceeds(250000, 'pln')} disabled={(state.cocomProceedsPln || 0) < 250000} style={{flex: 1}}>Pierz 250k ➔ PLN</button>
                       <button onClick={() => launderCocomProceeds(1000000, 'pln')} disabled={(state.cocomProceedsPln || 0) < 1000000} style={{flex: 1}}>Pierz 1M ➔ PLN</button>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => launderCocomProceeds(250000, 'usd')} disabled={(state.cocomProceedsPln || 0) < 250000} style={{flex: 1, borderColor: '#3498db', color: '#3498db'}}>Pierz 250k ➔ USD (50% strat)</button>
                       <button onClick={() => launderCocomProceeds(1000000, 'usd')} disabled={(state.cocomProceedsPln || 0) < 1000000} style={{flex: 1, borderColor: '#3498db', color: '#3498db'}}>Pierz 1M ➔ USD (50% strat)</button>
                    </div>
                  </div>

                  {/* KONTRAHENCI */}
                  <div className="panel" style={{borderColor: '#e67e22'}}>
                    <h3 style={{color: '#e67e22'}}>Sieć Kontrahentów</h3>
                    <div className="flex-col gap-2">
                      {EXPORT_CONTACTS.map(contact => {
                         const isUnlocked = state.unlockedContacts[contact.id];
                         const canAfford = (state.swissBalanceUsd || 0) >= contact.costUsd;
                         // Check unlock req
                         let reqMet = true;
                         if (contact.unlockRequirement === 'sekretarz') reqMet = ['sekretarz', 'dyrektor', 'wiceminister', 'minister', 'biuro'].includes(state.partyRank || '');
                         if (contact.unlockRequirement === 'offshore_zurich') reqMet = !!state.unlockedAchievements?.['offshore_zurich'];
                         if (contact.unlockRequirement === 'liechtenstein') reqMet = !!state.hasLiechtensteinTrust;
                         if (contact.unlockRequirement === 'cocom_nsa') reqMet = !!state.unlockedAchievements?.['cocom_nsa'];

                         if (!isUnlocked && !reqMet) return null;

                         return (
                           <div key={contact.id} className="flex justify-between items-center" style={{padding: '5px', border: '1px solid', borderColor: isUnlocked ? '#e67e22' : 'var(--crt-text)'}}>
                             <div>
                               <div style={{fontWeight: 'bold', color: isUnlocked ? '#e67e22' : 'var(--crt-text)'}}>{contact.name}</div>
                               <div style={{fontSize: '0.75rem'}}>Cena: +{contact.priceBonus*100}% | Ryzyko: +{contact.riskBonus*100}%</div>
                             </div>
                             {!isUnlocked ? (
                               <button onClick={() => unlockExportContact(contact.id)} disabled={!canAfford}>Werbuj: ${contact.costUsd}</button>
                             ) : (
                               <span style={{color: '#39ff14'}}>Aktywny</span>
                             )}
                           </div>
                         );
                      })}
                    </div>
                  </div>

                  {/* WYSYŁKA TOWARU */}
                  {totalInventory > 0 && (
                     <div className="panel" style={{borderColor: '#ff3333'}}>
                       <h3 style={{color: '#ff3333'}}>Zleć Przemyt</h3>
                       <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Wybierz towar z magazynu i wyślij go przez siatkę przemytniczą.</p>
                       <div className="flex-col gap-2">
                         {COCOM_ITEMS.filter(item => (state.cocomInventory[item.id] || 0) > 0).map(item => (
                           <div key={`send-${item.id}`} style={{padding: '10px', border: '1px solid #ff3333'}}>
                             <div style={{fontWeight: 'bold', marginBottom: '5px'}}>{item.name} (Sztuk: {state.cocomInventory[item.id]})</div>
                             <div className="flex gap-2 mb-2">
                               {EXPORT_CONTACTS.filter(c => state.unlockedContacts[c.id]).map(contact => (
                                 <button key={`c-${contact.id}`} onClick={() => {
                                    sendCocomShipment(item.id, contact.id, 'lad_road');
                                 }} style={{fontSize: '0.7rem'}}>
                                   Do: {contact.country}
                                 </button>
                               ))}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                  )}

                  {/* ULEPSZENIA SYNDYKATU */}
                  <div className="panel" style={{borderColor: '#f1c40f'}}>
                    <h3 style={{color: '#f1c40f'}}>Infrastruktura Syndykatu</h3>
                    <div className="flex-col gap-2">
                      {SYNDICATE_UPGRADES.map(u => {
                        const isOwned = state.syndicateUpgrades[u.id];
                        const canAfford = (state.swissBalanceUsd || 0) >= u.costUsd;
                        return (
                          <div key={u.id} className="flex justify-between items-center" style={{padding: '5px', border: '1px solid', borderColor: isOwned ? '#f1c40f' : 'var(--crt-text)'}}>
                             <div style={{flex: 1, paddingRight: '10px'}}>
                               <div style={{fontWeight: 'bold', color: isOwned ? '#f1c40f' : 'var(--crt-text)'}}>{u.name}</div>
                               <div style={{fontSize: '0.75rem', color: '#aaa'}}>{u.effect}</div>
                             </div>
                             {!isOwned ? (
                               <button onClick={() => buySyndicateUpgrade(u.id)} disabled={!canAfford}>${u.costUsd}</button>
                             ) : (
                               <span style={{color: '#39ff14'}}>Posiadane</span>
                             )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* AKTYWNE PRZESYŁKI */}
                  {(state.activeCocomShipments || []).length > 0 && (
                    <div className="panel" style={{borderColor: '#3498db'}}>
                      <h3 style={{color: '#3498db'}}>Aktywne Transporty</h3>
                      <div className="flex-col gap-2">
                        {state.activeCocomShipments.map(ship => {
                          const item = COCOM_ITEMS.find(c => c.id === ship.itemId);
                          return (
                            <div key={ship.id} className="flex justify-between items-center" style={{fontSize: '0.75rem'}}>
                              <span>🚚 {item?.name} ➔ {ship.route}</span>
                              <span style={{color: 'gold'}}>Czas: {Math.round(ship.timeLeft)}s</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* AUTO-EKSPORT */}
                  {hasSafeHouse && (
                    <div className="panel" style={{borderColor: '#9b59b6'}}>
                      <h3 style={{color: '#9b59b6'}}>Kolejka Eksportowa (Auto)</h3>
                      <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Konspiracyjna kryjówka pozwala na automatyczny eksport towarów z niskim ryzykiem (≤40%).</p>
                      <button 
                        onClick={() => updateState(s => ({ ...s, autoExportEnabled: !s.autoExportEnabled }))}
                        style={{width: '100%', backgroundColor: state.autoExportEnabled ? '#9b59b6' : 'transparent', color: state.autoExportEnabled ? '#fff' : '#9b59b6', borderColor: '#9b59b6'}}
                      >
                        {state.autoExportEnabled ? 'ZATRZYMAJ AUTO-EKSPORT' : 'URUCHOM AUTO-EKSPORT'}
                      </button>
                    </div>
                  )}

                </div>
              </div>

              {/* L7 i L8: MAPA I FLOTA */}
              <div className="game-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                {/* L7: TRASY PRZEMYTNICZE */}
                <div className="flex-col gap-4">
                  <div className="panel" style={{borderColor: '#ff5e57'}}>
                    <h3 style={{color: '#ff5e57'}}>Globalne Szlaki Przemytnicze</h3>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>Stan granic zmienia się dynamicznie. Zlecaj kursy mądrze!</p>
                    {COCOM_SMUGGLING_ROUTES.map(route => {
                       const bStatus = state.borderShiftStatus[route.borderPatrolName] || 'standard';
                       let statusColor = '#fff';
                       if (bStatus === 'relaxed') statusColor = '#2ecc71';
                       if (bStatus === 'strict') statusColor = '#e74c3c';
                       
                       return (
                         <div key={route.id} style={{border: '1px dashed #ff5e57', padding: '10px', marginBottom: '10px'}}>
                           <div style={{fontWeight: 'bold', color: '#ff5e57'}}>{route.name}</div>
                           <div style={{fontSize: '0.75rem', color: '#aaa', marginBottom: '5px'}}>{route.desc}</div>
                           <div style={{fontSize: '0.8rem', marginBottom: '10px'}}>
                             Ryzyko: {route.baseRiskPercent}% | Czas: {route.baseTravelTimeSec}s<br/>
                             Przejście: <span style={{color: statusColor, fontWeight: 'bold'}}>{route.borderPatrolName} ({bStatus.toUpperCase()})</span>
                           </div>
                           <button onClick={() => autoStartRun(route.id)} style={{width: '100%', borderColor: '#ff5e57', color: '#ff5e57', backgroundColor: 'transparent'}}>
                             WYŚLIJ KONWÓJ (Auto-dobór Floty i Towaru)
                           </button>
                         </div>
                       );
                    })}
                  </div>
                </div>

                {/* L8: FLOTA I KADRY */}
                <div className="flex-col gap-4">
                  <div className="panel" style={{borderColor: '#34e7e4'}}>
                    <h3 style={{color: '#34e7e4'}}>Flota Pojazdów</h3>
                    {COCOM_VEHICLES.map(v => (
                       <div key={v.id} style={{border: '1px solid #34e7e4', padding: '10px', marginBottom: '10px', fontSize: '0.8rem'}}>
                         <div className="flex justify-between items-center mb-1">
                           <strong style={{color: '#34e7e4', fontSize: '1rem'}}>{v.name}</strong>
                           <span style={{color: '#34e7e4'}}>W Garażu: {state.cocomVehicles[v.id] || 0}/5</span>
                         </div>
                         <div style={{color: '#aaa', marginBottom: '5px'}}>{v.desc}</div>
                         <div className="flex justify-between items-center">
                           <span>Pojemność: {v.capacity}szt. | Kamuflaż: {v.stealthBonus > 0 ? '+'+v.stealthBonus : v.stealthBonus}%</span>
                           <button onClick={() => buyCocomVehicle(v.id)} style={{padding: '5px 10px', fontSize: '0.75rem'}}>
                             Kup: {v.costPln > 0 ? `${v.costPln.toLocaleString()} PLN` : `$${v.costUsd.toLocaleString()}`}
                           </button>
                         </div>
                       </div>
                    ))}
                  </div>

                  <div className="panel" style={{borderColor: '#ffdd59'}}>
                    <h3 style={{color: '#ffdd59'}}>Zaufani Kurierzy</h3>
                    {COCOM_PERSONNEL.map(p => (
                       <div key={p.id} style={{border: '1px solid #ffdd59', padding: '10px', marginBottom: '10px', fontSize: '0.8rem'}}>
                         <div className="flex justify-between items-center mb-1">
                           <strong style={{color: '#ffdd59', fontSize: '1rem'}}>{p.name}</strong>
                           <span style={{color: '#ffdd59'}}>Zatrudnieni: {state.cocomPersonnel[p.id] || 0}/10</span>
                         </div>
                         <div style={{color: '#aaa', marginBottom: '5px'}}>{p.desc}</div>
                         <div className="flex justify-between items-center">
                           <span>Pensja: {p.salaryPerRunPln.toLocaleString()} PLN | Kamuflaż: +{p.stealthBonus}%</span>
                           <button onClick={() => hireCocomPersonnel(p.id)} style={{padding: '5px 10px', fontSize: '0.75rem'}}>
                             Werbuj: {p.costPln > 0 ? `${p.costPln.toLocaleString()} PLN` : `$${p.costUsd.toLocaleString()}`}
                           </button>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {currentTab === 'wybory' && (() => {
          if (!state.electionsUnlocked) {
            return (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', color: '#000', border: '2px solid #d63031', borderRadius: '4px' }}>
                <h2 style={{ color: '#d63031', fontWeight: 'bold' }}>WYBORY 4 CZERWCA 1989</h2>
                <p style={{ fontSize: '1.2em' }}>Okrągły Stół zakończony! Władza zgodziła się na częściowo wolne wybory.</p>
                <p>Musisz zorganizować ogólnopolską kampanię wyborczą Komitetu Obywatelskiego "Solidarność".</p>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Warunki uruchomienia kampanii:</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li style={{ color: state.solidarnos >= 10000 ? 'green' : 'red' }}>
                      {state.solidarnos >= 10000 ? '✓' : '✗'} 10 000 Poparcia Solidarności (darmowe otwarcie)
                    </li>
                    <li style={{ margin: '10px 0', fontWeight: 'bold' }}>LUB</li>
                    <li style={{ color: state.pln >= 5000000 ? 'green' : 'red' }}>
                      {state.pln >= 5000000 ? '✓' : '✗'} 5 000 000 PLN (opłata organizacyjna)
                    </li>
                  </ul>
                  <button 
                    onClick={unlockElections}
                    disabled={state.solidarnos < 10000 && state.pln < 5000000}
                    style={{ 
                      marginTop: '15px', padding: '15px 30px', fontSize: '1.2em', 
                      backgroundColor: (state.solidarnos >= 10000 || state.pln >= 5000000) ? '#d63031' : '#ccc', 
                      color: '#fff', border: 'none', cursor: (state.solidarnos >= 10000 || state.pln >= 5000000) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', borderRadius: '4px'
                    }}
                  >
                    ROZPOCZNIJ KAMPANIĘ WYBORCZĄ
                  </button>
                </div>
              </div>
            );
          }

          const totalVotes = Object.values(state.regionalVotes).reduce((a, b) => a + b, 0);
          const totalCommittees = Object.keys(state.regionalCommittees).length;

          return (
            <div style={{ padding: '15px', backgroundColor: '#f5f6fa', color: '#2f3640', fontFamily: '"Arial", sans-serif' }}>
              
              {/* HEADER Z LOGO I STANEM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d63031', color: '#fff', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '900', letterSpacing: '1px' }}>SOLIDARNOŚĆ - WYBORY '89</h2>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                    Faza: 
                    <span style={{ fontWeight: 'bold', marginLeft: '5px', color: '#ffeaa7' }}>
                      {state.electionsPhase === 'campaign' && 'KAMPANIA TRWA'}
                      {state.electionsPhase === 'second_round' && 'II TURA (SENAT)'}
                      {state.electionsPhase === 'negotiations' && 'NEGOCJACJE KOALICYJNE'}
                      {state.electionsPhase === 'completed' && 'RZĄD SFORMOWANY'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Łącznie Głosów</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{totalVotes.toLocaleString()}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Propaganda TVP</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: state.regimePropaganda > 50 ? '#ff7675' : '#55efc4' }}>
                      {state.regimePropaganda}%
                    </div>
                  </div>
                </div>
              </div>

              {/* GŁÓWNY DASHBOARD */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                
                {/* LEWA KOLUMNA: Fundusze i Logistyka */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px' }}>Fundusze i Logistyka</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px', width: '45%' }}>
                      <div style={{ fontSize: '0.8em', color: '#7f8fa6' }}>Fundusz Wyborczy PLN</div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{state.electionFundsPln.toLocaleString()} zł</div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => transferToCampaign(100000, 'pln')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+100k</button>
                        <button onClick={() => transferToCampaign(1000000, 'pln')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+1M</button>
                      </div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px', width: '45%' }}>
                      <div style={{ fontSize: '0.8em', color: '#7f8fa6' }}>Fundusz Dewizowy USD</div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#44bd32' }}>${state.electionFundsUsd.toLocaleString()}</div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => transferToCampaign(1000, 'usd')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+$1k</button>
                        <button onClick={() => transferToCampaign(10000, 'usd')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+$10k</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>Drukarnia Centralna</h4>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.9em' }}>
                      <div style={{ flex: 1, padding: '5px', border: '1px solid #dcdde1', textAlign: 'center' }}>
                        Papier: <strong>{state.paperStocks}</strong> ryz
                        <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                          <button onClick={() => buyPrintingSupplies('paper', 'pln')} style={{ flex: 1, fontSize: '0.8em' }}>Kup (5k zł)</button>
                          <button onClick={() => buyPrintingSupplies('paper', 'usd')} style={{ flex: 1, fontSize: '0.8em' }}>Kup ($50)</button>
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: '5px', border: '1px solid #dcdde1', textAlign: 'center' }}>
                        Tusz: <strong>{state.inkStocks}</strong> l.
                        <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                          <button onClick={() => buyPrintingSupplies('ink', 'pln')} style={{ flex: 1, fontSize: '0.8em' }}>Kup (8k zł)</button>
                          <button onClick={() => buyPrintingSupplies('ink', 'usd')} style={{ flex: 1, fontSize: '0.8em' }}>Kup ($80)</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>Produkcja Materiałów</h4>
                    <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                      {CAMPAIGN_MATERIALS.map(mat => (
                        <div key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid #eee', fontSize: '0.85em' }}>
                          <div>
                            <strong>{mat.name}</strong> 
                            <span style={{ color: '#d63031', marginLeft: '5px', fontSize: '0.8em' }} title="Ryzyko SB">({mat.sbRiskPercent}% SB)</span>
                            <br/>
                            <span style={{ color: '#7f8fa6' }}>{mat.costPln}zł | {mat.paperCost} pap | {mat.inkCost} tusz</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>{state.campaignMaterials[mat.id] || 0} szt.</span>
                            <button 
                              onClick={() => printCampaignMaterial(mat.id)}
                              disabled={state.electionFundsPln < mat.costPln || state.paperStocks < mat.paperCost || state.inkStocks < mat.inkCost}
                              style={{ padding: '2px 8px', backgroundColor: '#2f3640', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              Drukuj
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PRAWA KOLUMNA: Mapy i Regiony */}
                <div style={{ flex: 2, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Komitety Obywatelskie ({totalCommittees}/{ELECTION_REGIONS.length})</span>
                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#7f8fa6' }}>Poparcie Kościoła: {state.churchSupport}%</span>
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {ELECTION_REGIONS.map(region => {
                      const isOpen = !!state.regionalCommittees[region.id];
                      const votes = state.regionalVotes[region.id] || 0;
                      const hasRally = (state.activeRallies || []).some(r => r.regionId === region.id);
                      
                      return (
                        <div key={region.id} style={{ 
                          border: `1px solid ${isOpen ? '#d63031' : '#dcdde1'}`, 
                          borderRadius: '4px', padding: '10px',
                          backgroundColor: isOpen ? '#fffaf0' : '#f5f6fa'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong style={{ color: isOpen ? '#d63031' : '#2f3640' }}>{region.name}</strong>
                            {hasRally && <span style={{ color: '#e1b12c', fontSize: '0.8em', fontWeight: 'bold' }}>📢 WIEC TRWA</span>}
                          </div>
                          
                          {!isOpen ? (
                            <div>
                              <div style={{ fontSize: '0.8em', color: '#7f8fa6', marginBottom: '10px' }}>{region.desc}</div>
                              <button 
                                onClick={() => openRegionalCommittee(region.id)}
                                disabled={state.electionFundsPln < region.committeeCostPln}
                                style={{ width: '100%', padding: '5px', backgroundColor: '#2f3640', color: '#fff', border: 'none', borderRadius: '3px' }}
                              >
                                Otwórz Komitet ({region.committeeCostPln.toLocaleString()} zł)
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '5px' }}>
                                {votes.toLocaleString()} <span style={{ fontSize: '0.6em', fontWeight: 'normal', color: '#7f8fa6' }}>głosów</span>
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Rob: {region.workerWeight * 100}%</div>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Int: {region.intellectualWeight * 100}%</div>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Rol: {region.farmerWeight * 100}%</div>
                              </div>
                              
                              <div style={{ marginTop: '10px', fontSize: '0.8em' }}>
                                <strong>Wyślij Lidera:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                  {CAMPAIGN_LEADERS.map(leader => {
                                    const isOnCooldown = (state.leaderCooldowns[leader.id] || 0) > 0;
                                    return (
                                      <button
                                        key={leader.id}
                                        onClick={() => launchRally(region.id, leader.id)}
                                        disabled={isOnCooldown || hasRally || state.electionFundsPln < leader.costPln || (leader.costUsd > 0 && state.electionFundsUsd < leader.costUsd)}
                                        title={`${leader.name}\nKoszt: ${leader.costPln}zł ${leader.costUsd > 0 ? `+ $${leader.costUsd}` : ''}`}
                                        style={{ 
                                          padding: '2px 5px', fontSize: '0.9em',
                                          backgroundColor: isOnCooldown ? '#ccc' : (leader.specialRegion === region.id ? '#d63031' : '#7f8fa6'),
                                          color: '#fff', border: 'none', borderRadius: '3px', cursor: isOnCooldown ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        {leader.name.split(' ')[1]} {isOnCooldown ? `(${Math.ceil(state.leaderCooldowns[leader.id])}s)` : ''}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DOLNA SEKCJA: Infrastruktura i Akcje Specjalne */}
              <div style={{ display: 'flex', gap: '15px' }}>
                
                {/* Infrastruktura */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px' }}>Infrastruktura Kampanii</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {ELECTION_UPGRADES.map(upg => {
                      const isBought = state.electionUpgrades[upg.id];
                      return (
                        <div key={upg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: isBought ? '#f1f2f6' : '#fff', border: '1px solid #dcdde1', borderRadius: '3px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: isBought ? '#7f8fa6' : '#2f3640' }}>
                              {isBought && '✓ '} {upg.name}
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#7f8fa6' }}>{upg.effect}</div>
                          </div>
                          {!isBought && (
                            <button 
                              onClick={() => buyElectionUpgrade(upg.id)}
                              disabled={state.electionFundsPln < upg.costPln || (upg.costUsd > 0 && state.electionFundsUsd < upg.costUsd)}
                              style={{ padding: '3px 8px', fontSize: '0.8em', backgroundColor: '#e1b12c', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              {upg.costPln > 0 ? `${upg.costPln / 1000}k zł` : ''} 
                              {upg.costPln > 0 && upg.costUsd > 0 ? ' + ' : ''}
                              {upg.costUsd > 0 ? `$${upg.costUsd}` : ''}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Debata i Wybory */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #d63031', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px', color: '#d63031' }}>Wielki Finał</h3>
                  
                  {/* DEBATA */}
                  <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Debata: Wałęsa vs Miodowicz</h4>
                    {state.debateCompleted ? (
                      <div style={{ color: '#44bd32', fontWeight: 'bold', textAlign: 'center', padding: '10px' }}>
                        ✓ Debata wygrana! Poparcie w całej Polsce wzrosło. (Wynik: {state.debateScore})
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.85em', marginBottom: '10px' }}>Runda {state.debateRound + 1} z 4</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {DEBATE_OPTIONS.filter(o => o.round === state.debateRound + 1).map(opt => (
                            <button 
                              key={opt.id}
                              onClick={() => interactDebate(opt.id)}
                              style={{ padding: '8px', fontSize: '0.85em', textAlign: 'left', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              <em>{opt.text}</em>
                              <div style={{ fontSize: '0.8em', color: '#7f8fa6', marginTop: '3px' }}>Ryzyko SB: {opt.sbRisk}% | Red. Propagandy: {opt.propagandaReduction}%</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PRZEBIEG WYBORÓW */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {state.electionsPhase === 'campaign' && (
                      <button 
                        onClick={runElectionsFirstRound}
                        disabled={totalVotes < 5000000 || state.campaignTimePlayed < 600}
                        style={{ padding: '15px', fontSize: '1.2em', fontWeight: 'bold', backgroundColor: (totalVotes >= 5000000 && state.campaignTimePlayed >= 600) ? '#d63031' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: (totalVotes >= 5000000 && state.campaignTimePlayed >= 600) ? 'pointer' : 'not-allowed' }}
                      >
                        PRZEPROWADŹ I TURĘ WYBORÓW (4 CZERWCA)
                        <div style={{ fontSize: '0.6em', fontWeight: 'normal', marginTop: '5px' }}>
                          Wymagane: 5 mln głosów i 10 min kampanii (Aktualnie: {Math.floor(state.campaignTimePlayed / 60)} min)
                        </div>
                      </button>
                    )}

                    {state.electionsPhase === 'second_round' && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Wyniki I Tury:<br/>
                          Sejm: <span style={{ color: '#d63031' }}>{state.sejmSeatsWon}/161</span> | Senat: <span style={{ color: '#d63031' }}>{state.senateSeatsWon}/100</span>
                        </div>
                        <button 
                          onClick={runElectionsSecondRound}
                          style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: '#e1b12c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          PRZEPROWADŹ II TURĘ WYBORÓW (18 CZERWCA)
                        </button>
                      </div>
                    )}

                    {state.electionsPhase === 'negotiations' && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Ostateczne Wyniki:<br/>
                          Sejm: <span style={{ color: '#d63031' }}>{state.sejmSeatsWon}/161</span> | Senat: <span style={{ color: '#d63031' }}>{state.senateSeatsWon}/100</span>
                        </div>
                        <button 
                          onClick={concludeNegotiations}
                          style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: '#44bd32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ROZPOCZNIJ NEGOCJACJE RZĄDOWE
                        </button>
                      </div>
                    )}

                    {state.electionsPhase === 'completed' && (
                      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#44bd32', color: '#fff', borderRadius: '4px' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>KAMPANIA ZAKOŃCZONA SUKCESEM</h3>
                        <p style={{ margin: 0 }}>Rząd powołany. Polska wkracza na drogę transformacji. Faza III RP wkrótce...</p>
                        <div style={{ marginTop: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Sejm: {state.sejmSeatsWon}/161 | Senat: {state.senateSeatsWon}/100
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {currentTab === 'lata90' && (() => {
          if (!state.fazaMUnlocked) {
            return (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', color: '#000', border: '2px solid #f1c40f', borderRadius: '4px' }}>
                <h2 style={{ color: '#f1c40f', fontWeight: 'bold', textShadow: '1px 1px 2px #000' }}>DZIKI KAPITALIZM (LATA 90.)</h2>
                <p style={{ fontSize: '1.2em' }}>Komunizm upadł! Czas na wolny rynek, prywatyzację i... hiperinflację.</p>
                <p>Aby przetrwać, musisz odnaleźć się w nowej rzeczywistości. Handluj na stadionie, prywatyzuj molochy, ale uważaj na mafię z Pruszkowa.</p>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Warunki: Ustawa Wilczka</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li style={{ color: state.pln >= 10000000 ? 'green' : 'red' }}>
                      {state.pln >= 10000000 ? '✓' : '✗'} 10 000 000 PLZ (Koszt transformacji / Łapówki dla urzędników)
                    </li>
                  </ul>
                  <button 
                    onClick={unlockFazaM}
                    disabled={state.pln < 10000000}
                    style={{ 
                      marginTop: '15px', padding: '15px 30px', fontSize: '1.2em', 
                      backgroundColor: state.pln >= 10000000 ? '#f1c40f' : '#ccc', 
                      color: '#000', border: 'none', cursor: state.pln >= 10000000 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', borderRadius: '4px'
                    }}
                  >
                    WPROWADŹ USTAWĘ WILCZKA
                  </button>
                </div>
              </div>
            );
          }

          const currentInflation = state.isDenominated ? 0 : Math.floor((state.plzInflationMult - 1) * 100);

          return (
            <div style={{ padding: '15px', backgroundColor: '#2c3e50', color: '#ecf0f1', fontFamily: '"Tahoma", sans-serif', borderRadius: '4px' }}>
              
              {/* HEADER Z LOGO I STANEM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1c40f', color: '#000', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '900', letterSpacing: '1px' }}>LATA 90. - DZIKI KAPITALIZM</h2>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                    Faza: <span style={{ fontWeight: 'bold' }}>{state.isDenominated ? 'STABILIZACJA (PLN)' : 'HIPERINFLACJA (PLZ)'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Kupony NFI</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e67e22' }}>{state.nfiVouchers || 0} szt.</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Inflacja Wskaźnikowa</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: state.isDenominated ? '#27ae60' : '#c0392b' }}>
                      {state.isDenominated ? '0%' : `+${currentInflation}%`}
                    </div>
                  </div>
                </div>
              </div>

              {/* SUB-TAB NAV */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
                <button 
                  onClick={() => { playClick(); setLata90SubTab('bazar'); }} 
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata90SubTab === 'bazar' ? '#f1c40f' : '#2c3e50', color: lata90SubTab === 'bazar' ? '#000' : '#fff' }}
                >
                  🏪 BAZAR & LOGISTYKA
                </button>
                <button 
                  onClick={() => { playClick(); setLata90SubTab('nfi'); }} 
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata90SubTab === 'nfi' ? '#f1c40f' : '#2c3e50', color: lata90SubTab === 'nfi' ? '#000' : '#fff' }}
                >
                  🏭 HOLDING NFI
                </button>
                <button 
                  onClick={() => { playClick(); setLata90SubTab('media'); }} 
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata90SubTab === 'media' ? '#f1c40f' : '#2c3e50', color: lata90SubTab === 'media' ? '#000' : '#fff' }}
                >
                  📺 MEDIA & REKLAMA
                </button>
                <button 
                  onClick={() => { playClick(); setLata90SubTab('mafia'); }} 
                  style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata90SubTab === 'mafia' ? '#f1c40f' : '#2c3e50', color: lata90SubTab === 'mafia' ? '#000' : '#fff' }}
                >
                  🕶️ MAFIA & OCHRONA
                </button>
              </div>

              {/* BAZAR & LOGISTYKA SUB-TAB */}
              {lata90SubTab === 'bazar' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Left: Bazar list */}
                  <div style={{ flex: 1.2, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f1c40f', paddingBottom: '5px', color: '#f1c40f' }}>Stadion Dziesięciolecia (Bazar)</h3>
                    
                    {(() => {
                      const totalBazarItems = Object.values(state.bazarInventory || {}).reduce((sum, val) => sum + (val || 0), 0);
                      const cap = state.bazarWarehouseCapacity || 50;
                      const currentUpgrade = WAREHOUSE_UPGRADES.find(u => u.id === state.bazarWarehouseUpgradeId);
                      const warehouseName = currentUpgrade ? currentUpgrade.name : 'Kartonowe pudła';
                      
                      return (
                        <div style={{ backgroundColor: '#2c3e50', padding: '12px', borderRadius: '4px', border: '1px solid #465c71', marginBottom: '15px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                            <span>Magazyn: <strong>{warehouseName}</strong></span>
                            <span><strong>{totalBazarItems}</strong> / {cap} szt.</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#34495e', borderRadius: '4px', marginTop: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (totalBazarItems / cap) * 100)}%`, height: '100%', backgroundColor: totalBazarItems >= cap ? '#e74c3c' : '#2ecc71' }} />
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'grid', gap: '12px' }}>
                      {BAZAR_ITEMS.map(item => {
                        const qty = state.bazarInventory[item.id] || 0;
                        const buyP = Math.floor(item.buyPricePln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const sellP = Math.floor(item.sellPricePln * (state.isDenominated ? 1 : state.plzInflationMult));
                        
                        const currentSat = state.bazarMarketSaturation[item.id] || 0;
                        const priceMult = Math.max(0.2, 1 - (currentSat / 150));
                        const finalSellPrice = Math.floor(sellP * priceMult);
                        
                        const totalBazarItems = Object.values(state.bazarInventory || {}).reduce((sum, val) => sum + (val || 0), 0);
                        const cap = state.bazarWarehouseCapacity || 50;
                        const canBuy = state.pln >= buyP && totalBazarItems < cap;

                        return (
                          <div key={item.id} style={{ padding: '12px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ color: '#fff', fontSize: '1.1em' }}>{item.name}</strong>
                              <span style={{ fontWeight: 'bold', color: '#e67e22' }}>W magazynie: {qty} szt.</span>
                            </div>
                            
                            {/* MARKET SATURATION PROGRESS BAR */}
                            <div style={{ marginTop: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#bdc3c7' }}>
                                <span>Nasycenie rynku (Podaż):</span>
                                <span style={{ color: currentSat > 50 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>{currentSat.toFixed(0)}% (Cena: -{((1 - priceMult) * 100).toFixed(0)}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '5px', backgroundColor: '#34495e', borderRadius: '3px', marginTop: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${currentSat}%`, height: '100%', backgroundColor: currentSat > 50 ? '#e74c3c' : '#f1c40f' }} />
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                              <button 
                                onClick={() => buyBazarItem(item.id, 1)}
                                disabled={!canBuy}
                                style={{ flex: 1, padding: '8px', fontSize: '0.9em', backgroundColor: '#c0392b', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Kup (Hurt: {buyP.toLocaleString()} zł)
                              </button>
                              <button 
                                onClick={() => sellBazarItem(item.id, 1)}
                                disabled={qty < 1}
                                style={{ flex: 1, padding: '8px', fontSize: '0.9em', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: qty >= 1 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Sprzedaj ({finalSellPrice.toLocaleString()} zł)
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                               <button onClick={() => buyBazarItem(item.id, 10)} disabled={state.pln < buyP * 10 || totalBazarItems + 10 > cap} style={{ flex: 1, padding: '4px', fontSize: '0.8em', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Kup x10</button>
                               <button onClick={() => sellBazarItem(item.id, qty)} disabled={qty < 1} style={{ flex: 1, padding: '4px', fontSize: '0.8em', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Sprzedaj Wszystko</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Logistics & Upgrades */}
                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e67e22', paddingBottom: '5px', color: '#e67e22' }}>Szlaki Importowe TIR</h3>
                    <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
                      {BAZAR_LOGISTICS_ROUTES.map(route => {
                        const costPln = Math.floor(route.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const active = (state.activeBazarTransports || []).filter(t => t.routeId === route.id);
                        const isAffordable = state.pln >= costPln && state.dollars >= route.costUsd;
                        const importedSummary = Object.entries(route.importedItems)
                          .map(([itemId, qty]) => {
                            const name = BAZAR_ITEMS.find(bi => bi.id === itemId)?.name || itemId;
                            return '+' + qty + ' ' + name;
                          }).join(', ');

                        return (
                          <div key={route.id} style={{ padding: '12px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                              <span style={{ fontSize: '1.05em', color: '#fff' }}>{route.name}</span>
                              <span style={{ color: '#f1c40f' }}>⏱️ {route.durationSec}s</span>
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#bdc3c7', margin: '4px 0' }}>{route.desc}</div>
                            <div style={{ fontSize: '0.8em', color: '#2ecc71', fontWeight: 'bold', margin: '4px 0' }}>Zawartość: {importedSummary}</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                              <div style={{ fontSize: '0.8em', color: '#fff' }}>
                                Koszt: <strong>{costPln.toLocaleString()} zł</strong> + <strong>${route.costUsd}</strong>
                              </div>
                              <button
                                onClick={() => dispatchBazarTransport(route.id)}
                                disabled={!isAffordable}
                                style={{ padding: '6px 12px', fontSize: '0.85em', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', cursor: isAffordable ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Wyślij TIR
                              </button>
                            </div>

                            {/* ACTIVE TRANSPORTS PROGRESS */}
                            {active.map(t => (
                              <div key={t.id} style={{ marginTop: '8px', padding: '6px', backgroundColor: '#34495e', borderRadius: '4px', fontSize: '0.8em', borderLeft: '4px solid #f1c40f', display: 'flex', justifyContent: 'space-between' }}>
                                <span>🚚 Transport w drodze...</span>
                                <strong>{t.timeLeft.toFixed(1)}s pozostało</strong>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>

                    <h3 style={{ margin: '15px 0 15px 0', borderBottom: '2px solid #3498db', paddingBottom: '5px', color: '#3498db' }}>Celnicy i Ulepszenia Magazynu</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      
                      {/* Bribe Customs */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '12px', borderRadius: '6px', border: '1px solid #465c71' }}>
                        <div>
                          <strong>Opłacenie celników na granicy</strong>
                          <div style={{ fontSize: '0.75em', color: '#bdc3c7' }}>Przyspiesza wszystkie TIRy o 15 sekund</div>
                        </div>
                        <button
                          onClick={bribeBazarCustoms}
                          disabled={(state.activeBazarTransports || []).length === 0 || state.pln < Math.floor(2000000 * (state.isDenominated ? 1 : state.plzInflationMult))}
                          style={{ padding: '6px 12px', fontSize: '0.85em', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Bribe ({(Math.floor(2000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString()} zł)
                        </button>
                      </div>

                      {/* Warehouse Upgrades */}
                      {WAREHOUSE_UPGRADES.map(upgrade => {
                        const isOwned = state.bazarWarehouseUpgradeId === upgrade.id || state.bazarWarehouseCapacity >= upgrade.capacity;
                        const costPln = Math.floor(upgrade.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const canBuy = state.pln >= costPln && !isOwned;
                        
                        return (
                          <div key={upgrade.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', padding: '12px', borderRadius: '6px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71') }}>
                            <div style={{ flex: 1 }}>
                              <strong>{upgrade.name}</strong>
                              <div style={{ fontSize: '0.75em', color: '#bdc3c7' }}>{upgrade.desc} (Pojemność: {upgrade.capacity} szt.)</div>
                            </div>
                            {isOwned ? (
                              <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.85em', padding: '4px' }}>POSIADASZ</span>
                            ) : (
                              <button
                                onClick={() => upgradeBazarWarehouse(upgrade.id)}
                                disabled={!canBuy}
                                style={{ padding: '6px 12px', fontSize: '0.85em', backgroundColor: '#9b59b6', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Kup ({costPln.toLocaleString()} zł)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* NFI COMPANIES SUB-TAB */}
              {lata90SubTab === 'nfi' && (
                <div>
                  <div style={{ backgroundColor: '#34495e', padding: '20px', borderRadius: '6px', border: '1px solid #7f8c8d', marginBottom: '15px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>Powszechna Prywatyzacja (NFI)</h3>
                    <p style={{ margin: 0, fontSize: '0.9em', color: '#bdc3c7' }}>
                      Państwo prywatyzuje fabryki z czasów PRL. Zbieraj Kupony NFI (generują się losowo co jakiś czas) i przejmuj kontrolę nad zakładami, aby generować stały dochód w PLN na sekundę. Zarządzaj kadrami, dbaj o morale, modernizuj maszyny i broń się przed strajkami związkowców!
                    </p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '15px' }}>
                    {NFI_COMPANIES.map(comp => {
                      const isOwned = state.nfiCompanies[comp.id];
                      const status = state.nfiCompanyStatus[comp.id] || { 
                        employment: comp.baseEmployment, 
                        infrastructure: comp.baseInfrastructure, 
                        morale: 100, 
                        unionStrength: comp.baseUnionStrength, 
                        strikeActive: false 
                      };
                      
                      let currentDividend = 0;
                      if (isOwned && !status.strikeActive) {
                        const baseWages = comp.baseEmployment * 5;
                        const currentWages = status.employment * 5;
                        const grossRevenue = (comp.dividendPerSecPln + baseWages) 
                          * (status.infrastructure / comp.baseInfrastructure) 
                          * (Math.min(status.employment, comp.baseEmployment * 1.2) / comp.baseEmployment);
                        const netProfit = grossRevenue - currentWages;
                        currentDividend = Math.floor(Math.max(0, netProfit) * (state.isDenominated ? 1 : state.plzInflationMult));
                      } else if (!isOwned) {
                        currentDividend = Math.floor(comp.dividendPerSecPln * (state.isDenominated ? 1 : state.plzInflationMult));
                      }

                      const modCost = Math.floor(10000000 * (state.isDenominated ? 1 : state.plzInflationMult));
                      const negoCost = Math.floor(5000000 * (state.isDenominated ? 1 : state.plzInflationMult));
                      const pacifyCost = Math.floor(3000000 * (state.isDenominated ? 1 : state.plzInflationMult));

                      return (
                        <div key={comp.id} style={{ 
                          padding: '15px', 
                          backgroundColor: isOwned ? (status.strikeActive ? '#7f1d1d' : '#1e293b') : '#2c3e50', 
                          borderRadius: '6px', 
                          border: `2px solid ${isOwned ? (status.strikeActive ? '#ef4444' : '#3b82f6') : '#465c71'}`,
                          color: '#fff',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <strong style={{ fontSize: '1.15em', color: status.strikeActive ? '#fca5a5' : '#fff' }}>{comp.name}</strong>
                              {isOwned ? (
                                <span style={{ 
                                  padding: '3px 8px', 
                                  backgroundColor: status.strikeActive ? '#ef4444' : '#10b981', 
                                  borderRadius: '4px', 
                                  fontSize: '0.75em', 
                                  fontWeight: 'bold' 
                                }}>
                                  {status.strikeActive ? '🔥 STRAJK OKUPACYJNY' : 'W HOLDINGU'}
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Wycena państwowa</span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '6px 0 12px 0' }}>{comp.desc}</div>

                            {isOwned ? (
                              // PANEL ZARZĄDZANIA WŁASNĄ FABRYKĄ
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85em', borderTop: '1px solid #475569', paddingTop: '10px', marginBottom: '15px' }}>
                                
                                {/* ZYSK / STRATA */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', backgroundColor: '#334155', padding: '6px', borderRadius: '4px' }}>
                                  <span>Zysk z dywidendy:</span>
                                  <strong style={{ color: status.strikeActive ? '#ef4444' : '#10b981' }}>
                                    {status.strikeActive ? '0 zł/s (ZABLOKOWANY)' : `+${currentDividend.toLocaleString()} zł/s`}
                                  </strong>
                                </div>

                                {/* MORALE ZAŁOGI */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#cbd5e1' }}>
                                    <span>Morale Robotników:</span>
                                    <span>{status.morale.toFixed(0)}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', backgroundColor: '#475569', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                                    <div style={{ width: `${status.morale}%`, height: '100%', backgroundColor: status.morale > 50 ? '#10b981' : (status.morale > 20 ? '#f59e0b' : '#ef4444') }} />
                                  </div>
                                </div>

                                {/* STAN MASZYN */}
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#cbd5e1' }}>
                                    <span>Stan Parku Maszynowego:</span>
                                    <span>{status.infrastructure.toFixed(0)}%</span>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', backgroundColor: '#475569', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                                    <div style={{ width: `${status.infrastructure}%`, height: '100%', backgroundColor: status.infrastructure > 60 ? '#10b981' : '#f59e0b' }} />
                                  </div>
                                </div>

                                {/* ZWIĄZKI ZAWODOWE */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#cbd5e1' }}>
                                  <span>Siła Związków Zawodowych (NSZZ):</span>
                                  <strong style={{ color: status.unionStrength > 100 ? '#ef4444' : '#fff' }}>{status.unionStrength.toFixed(0)} pkt</strong>
                                </div>

                                {/* ZATRUDNIENIE */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#cbd5e1' }}>
                                  <span>Zatrudnienie:</span>
                                  <strong>{status.employment.toLocaleString()} robotników</strong>
                                </div>

                                {/* PRZYCISKI ZATRUDNIANIA/ZWALNIANIA */}
                                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                  <button onClick={() => hireNfiEmployees(comp.id, 100)} style={{ flex: 1, padding: '4px', fontSize: '0.8em', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Zatrudnij +100</button>
                                  <button onClick={() => fireNfiEmployees(comp.id, 100)} disabled={status.employment <= 100} style={{ flex: 1, padding: '4px', fontSize: '0.8em', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Zwolnij -100</button>
                                </div>
                              </div>
                            ) : (
                              // STAN PAŃSTWOWEJ FABRYKI
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85em', borderTop: '1px solid #465c71', paddingTop: '8px', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Bazowa Dywidenda:</span>
                                  <strong style={{ color: '#2ecc71' }}>+{currentDividend.toLocaleString()} zł/s</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Zatrudnienie:</span>
                                  <span>{comp.baseEmployment.toLocaleString()} robotników</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Wymagane kupony NFI:</span>
                                  <strong style={{ color: '#e67e22' }}>{comp.vouchersRequired} Kuponów</strong>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* AKCJE PREZESA */}
                          <div>
                            {isOwned ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #475569', paddingTop: '10px' }}>
                                <button 
                                  onClick={() => modernizeNfiInfrastructure(comp.id)}
                                  disabled={state.pln < modCost}
                                  style={{ padding: '6px', fontSize: '0.85em', backgroundColor: '#f59e0b', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Modernizacja maszyn (-{modCost.toLocaleString()} zł)
                                </button>
                                
                                <button 
                                  onClick={() => negotiateNfiUnions(comp.id)}
                                  disabled={state.pln < negoCost}
                                  style={{ padding: '6px', fontSize: '0.85em', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Podwyżki / Negocjacje (-{negoCost.toLocaleString()} zł)
                                </button>
                                
                                <button 
                                  onClick={() => pacifyNfiStrike(comp.id)}
                                  disabled={state.pln < pacifyCost}
                                  style={{ padding: '6px', fontSize: '0.85em', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Pacyfikacja siłowa strajku (-{pacifyCost.toLocaleString()} zł)
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => buyNfiCompany(comp.id)}
                                disabled={(state.nfiVouchers || 0) < comp.vouchersRequired}
                                style={{ 
                                  width: '100%', padding: '10px', fontSize: '1.05em', fontWeight: 'bold', 
                                  backgroundColor: (state.nfiVouchers || 0) >= comp.vouchersRequired ? '#e67e22' : '#7f8c8d', 
                                  color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' 
                                }}
                              >
                                PRZEJMIJ FABRYKĘ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* WOLNE MEDIA & TELEWIZJA SUB-TAB */}
              {lata90SubTab === 'media' && (
                <div>
                  {!state.mediaUnlocked ? (
                    /* UNLOCK CONCESSION PROMISE */
                    <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#34495e', borderRadius: '6px', border: '1px solid #7f8c8d' }}>
                      <h2 style={{ color: '#f1c40f', margin: '0 0 15px 0' }}>📡 WOLNE MEDIA I PRYWATNE KANAŁY</h2>
                      <p style={{ maxWidth: '600px', margin: '0 auto 20px auto', color: '#bdc3c7', fontSize: '1.05em', lineHeight: '1.5' }}>
                        Komunizm upadł, a państwowy monopol TVP i Polskiego Radia został złamany! Krajowa Rada Radiofonii i Telewizji (KRRiT) zaczyna wydawać koncesje. Stwórz własną gazetę, stację radiową lub stację telewizyjną. Nadawaj programy, twórz ramówki reklamowe i buduj prawdziwe imperium medialne III RP!
                      </p>
                      <button
                        onClick={() => {
                          const cost = Math.floor(15000000 * (state.isDenominated ? 1 : state.plzInflationMult));
                          if (state.pln < cost) { playError(); return; }
                          updateState(s => ({ ...s, pln: s.pln - cost, mediaUnlocked: true }));
                          playSuccess();
                          showAlert("Wkroczyłeś w świat wolnych mediów! Możesz teraz wykupywać koncesje w KRRiT i tworzyć ramówki programów.", "📺 WOLNE MEDIA ODBLOKOWANE", "success");
                        }}
                        disabled={state.pln < Math.floor(15000000 * (state.isDenominated ? 1 : state.plzInflationMult))}
                        style={{ padding: '15px 30px', fontSize: '1.2em', fontWeight: 'bold', backgroundColor: '#f1c40f', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        KUP PROMESĘ KONCESYJNĄ KRRiT ({(Math.floor(15000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString()} zł)
                      </button>
                    </div>
                  ) : (
                    /* FULL MEDIA PANEL */
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      
                      {/* Left side: Owned stations, ramówki and custom actions */}
                      <div style={{ flex: 1.2, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                        
                        {/* GLOBAL MEDIA SUMMARY */}
                        <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <h4 style={{ margin: '0 0 5px 0', color: '#f1c40f' }}>Krajowa Rada (KRRiT)</h4>
                            <div style={{ fontSize: '0.85em', color: '#bdc3c7' }}>
                              Mnożnik cen koncesji: <strong>{((state.mediaKrritBribeDiscount || 1.0) * 100).toFixed(0)}%</strong>
                            </div>
                          </div>
                          <button
                            onClick={bribeKrrit}
                            disabled={state.pln < Math.floor(5000000 * (state.isDenominated ? 1 : state.plzInflationMult)) || (state.mediaKrritBribeDiscount || 1.0) <= 0.6}
                            style={{ padding: '6px 12px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' }}
                          >
                            Wręcz Kopertę Rady ({(Math.floor(5000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString()} zł)
                          </button>
                        </div>

                        <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f1c40f', paddingBottom: '5px', color: '#f1c40f' }}>Twoje Stacje Medialne</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                          
                          {MEDIA_STATIONS.map(station => {
                            const isOwned = state.mediaStations[station.id];
                            if (!isOwned) return null;
                            
                            const slots = state.activeMediaPrograms[station.id] || { rano: null, poludnie: null, wieczor: null };
                            const trust = state.mediaTrust[station.id] !== undefined ? state.mediaTrust[station.id] : 100;
                            
                            // Calculate current rating of station
                            let rating = station.baseRating;
                            let incomeMult = 0;
                            let activeCount = 0;
                            Object.values(slots).forEach(progId => {
                              if (progId) {
                                const p = MEDIA_PROGRAMS.find(pr => pr.id === progId);
                                if (p) {
                                  rating += p.ratingBonus;
                                  incomeMult += p.incomeMult;
                                  activeCount++;
                                }
                              }
                            });
                            
                            let coverageMult = 1.0;
                            MEDIA_ANTENNA_REGIONS.forEach(reg => {
                              if (state.mediaAntennas[reg.id]) coverageMult += reg.coverageMultiplier;
                            });
                            rating = Math.floor(rating * coverageMult * (0.5 + trust / 200));

                            return (
                              <div key={station.id} style={{ padding: '15px', backgroundColor: '#2c3e50', borderRadius: '6px', border: '1px solid #465c71' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong style={{ fontSize: '1.2em', color: '#fff' }}>{station.name}</strong>
                                  <span style={{ fontSize: '0.85em', color: '#bdc3c7', textTransform: 'uppercase', fontWeight: 'bold' }}>{station.type}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginTop: '5px', color: '#ecf0f1' }}>
                                  <span>Oglądalność: <strong>{rating.toLocaleString()} tys. widzów</strong></span>
                                  <span>Pasywny przychód: <strong>{(rating * 8 * incomeMult).toLocaleString()} zł/s</strong></span>
                                </div>

                                {/* TRUST PROGRESS BAR */}
                                <div style={{ marginTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8em', color: '#bdc3c7' }}>
                                    <span>Zaufanie widzów:</span>
                                    <strong style={{ color: trust > 70 ? '#2ecc71' : (trust > 40 ? '#f1c40f' : '#e74c3c') }}>{trust.toFixed(0)}/100</strong>
                                  </div>
                                  <div style={{ width: '100%', height: '6px', backgroundColor: '#34495e', borderRadius: '3px', marginTop: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${trust}%`, height: '100%', backgroundColor: trust > 70 ? '#2ecc71' : (trust > 40 ? '#f1c40f' : '#e74c3c') }} />
                                  </div>
                                </div>

                                {/* RAMÓWKA INTERACTION (MIXER) */}
                                <h4 style={{ margin: '15px 0 8px 0', fontSize: '0.85em', borderTop: '1px solid #465c71', paddingTop: '8px', color: '#f1c40f' }}>Ustawienie Ramówki (3 Sloty)</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                                  {['rano', 'poludnie', 'wieczor'].map(slotId => {
                                    const currentProgId = slots[slotId];
                                    
                                    
                                    // Filter owned programs
                                    const ownedPrograms = MEDIA_PROGRAMS.filter(p => state.mediaPrograms[p.id]);

                                    return (
                                      <div key={slotId} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#34495e', padding: '6px', borderRadius: '4px', fontSize: '0.8em' }}>
                                        <div style={{ color: '#bdc3c7', textTransform: 'capitalize', fontWeight: 'bold', fontSize: '0.75em', marginBottom: '2px' }}>{slotId}:</div>
                                        <select
                                          value={currentProgId || ''}
                                          onChange={(e) => setMediaSlot(station.id, slotId, e.target.value || null)}
                                          style={{ width: '100%', backgroundColor: '#2c3e50', color: '#fff', border: '1px solid #465c71', borderRadius: '3px', padding: '2px' }}
                                        >
                                          <option value="">-- PUSTY --</option>
                                          {ownedPrograms.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                          ))}
                                        </select>
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* ACTIONS PANEL FOR STATION */}
                                <h4 style={{ margin: '15px 0 8px 0', fontSize: '0.85em', color: '#f1c40f' }}>Wpływy i Agencja Tabloidowa</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                  <button
                                    onClick={() => runTabloidInvestigation(station.id)}
                                    style={{ padding: '6px', fontSize: '0.75em', backgroundColor: '#e67e22', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    title="Zleć paparazzi sensacyjny temat (75% szansy na wysoki zysk, 25% na przegrany proces o zniesławienie)"
                                  >
                                    📸 Zleć Aferę (1M)
                                  </button>
                                  <button
                                    onClick={() => claimMediaSponsorshipContract(station.id)}
                                    disabled={trust < 75}
                                    style={{ padding: '6px', fontSize: '0.75em', backgroundColor: trust >= 75 ? '#8e44ad' : '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: trust >= 75 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                    title="Podpisz kontrakt sponsorski z Pollena 2000. Wymaga zaufania >= 75. Daje natychmiastowy wysoki zysk kosztem utraty 15 pkt zaufania."
                                  >
                                    🧴 Kontrakt Sponsorski
                                  </button>
                                  <button
                                    onClick={() => broadcastPoliticalSpot(station.id, 'government')}
                                    disabled={trust < 50}
                                    style={{ padding: '6px', fontSize: '0.75em', backgroundColor: trust >= 50 ? '#34495e' : '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: trust >= 50 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                    title="Wyemituj orędzie rządu. Obniża zaufanie widzów, ale redukuje Twoją podejrzliwość u milicji."
                                  >
                                    📺 Spot Rządowy
                                  </button>
                                  <button
                                    onClick={() => broadcastPoliticalSpot(station.id, 'solidarity')}
                                    disabled={trust < 50}
                                    style={{ padding: '6px', fontSize: '0.75em', backgroundColor: trust >= 50 ? '#d63031' : '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: trust >= 50 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                    title="Wyemituj audycję komitetu Solidarności. Poparcie związku rośnie, ale rośnie też podejrzenie u milicji."
                                  >
                                    ✊ Spot Solidarności
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {Object.keys(state.mediaStations).filter(k => state.mediaStations[k]).length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#bdc3c7', border: '1px dashed #7f8c8d', borderRadius: '6px' }}>
                              Nie posiadasz jeszcze żadnej koncesji na nadawanie. Wykup pierwszą stację w sklepie medialnym po prawej!
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right side: Shop, licenses, antennas, concessions */}
                      <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                        
                        {/* KRRiT CONCESSIONS SHOP */}
                        <h3 style={{ margin: '0 0 12px 0', borderBottom: '2px solid #9b59b6', paddingBottom: '5px', color: '#9b59b6' }}>Koncesje KRRiT</h3>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                          {MEDIA_STATIONS.map(station => {
                            const isOwned = state.mediaStations[station.id];
                            const discount = state.mediaKrritBribeDiscount || 1.0;
                            const costPln = Math.floor(station.costPln * discount * (state.isDenominated ? 1 : state.plzInflationMult));
                            const canBuy = state.pln >= costPln && !isOwned;
                            
                            return (
                              <div key={station.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', padding: '10px', borderRadius: '4px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71'), fontSize: '0.85em' }}>
                                <div style={{ flex: 1 }}>
                                  <strong>{station.name}</strong>
                                  <div style={{ fontSize: '0.75em', color: '#bdc3c7' }}>{station.desc} (Rating bazowy: {station.baseRating})</div>
                                </div>
                                {isOwned ? (
                                  <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.8em', padding: '5px' }}>AKTYWNA</span>
                                ) : (
                                  <button
                                    onClick={() => buyMediaStation(station.id)}
                                    disabled={!canBuy}
                                    style={{ padding: '6px 10px', fontSize: '0.8em', backgroundColor: '#9b59b6', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                  >
                                    Kup ({costPln.toLocaleString()} zł)
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* PROGRAM LICENSES SHOP */}
                        <h3 style={{ margin: '15px 0 12px 0', borderBottom: '2px solid #2ecc71', paddingBottom: '5px', color: '#2ecc71' }}>Licencje Programowe</h3>
                        <div style={{ display: 'grid', gap: '8px', marginBottom: '20px', maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
                          {MEDIA_PROGRAMS.map(prog => {
                            const isOwned = state.mediaPrograms[prog.id];
                            const costPln = Math.floor(prog.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                            const canBuy = state.pln >= costPln && !isOwned;

                            return (
                              <div key={prog.id} style={{ padding: '10px', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', borderRadius: '4px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71'), fontSize: '0.85em' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                                  <span>{prog.name}</span>
                                  {isOwned ? (
                                    <span style={{ color: '#2ecc71', fontSize: '0.8em' }}>ZAKUPIONO</span>
                                  ) : (
                                    <span style={{ color: '#fff', fontSize: '0.8em' }}>{costPln.toLocaleString()} zł</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75em', color: '#bdc3c7', margin: '3px 0' }}>{prog.desc}</div>
                                <div style={{ fontSize: '0.75em', color: '#27ae60', margin: '3px 0' }}>
                                  + {prog.ratingBonus} Oglądalności | {prog.trustImpact > 0 ? `+${prog.trustImpact}` : prog.trustImpact} Zaufania/s | Reklamy: {prog.incomeMult}x
                                </div>
                                {!isOwned && (
                                  <button
                                    onClick={() => buyProgramLicense(prog.id)}
                                    disabled={!canBuy}
                                    style={{ width: '100%', padding: '4px', fontSize: '0.8em', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '3px', cursor: canBuy ? 'pointer' : 'not-allowed', marginTop: '6px', fontWeight: 'bold' }}
                                  >
                                    Kup Licencję
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* ANTENNA REGIONS */}
                        <h3 style={{ margin: '15px 0 12px 0', borderBottom: '2px solid #3498db', paddingBottom: '5px', color: '#3498db' }}>Nadajniki i Zasięg Naziemny</h3>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {MEDIA_ANTENNA_REGIONS.map(antenna => {
                            const isOwned = state.mediaAntennas[antenna.id] > 0;
                            const costPln = Math.floor(antenna.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                            const canBuy = state.pln >= costPln && !isOwned;

                            return (
                              <div key={antenna.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', padding: '10px', borderRadius: '4px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71'), fontSize: '0.85em' }}>
                                <div style={{ flex: 1 }}>
                                  <strong>{antenna.name}</strong>
                                  <div style={{ fontSize: '0.75em', color: '#bdc3c7' }}>{antenna.desc} (Zasięg: +{(antenna.coverageMultiplier * 100).toFixed(0)}%)</div>
                                </div>
                                {isOwned ? (
                                  <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.8em', padding: '5px' }}>WYBUDOWANY</span>
                                ) : (
                                  <button
                                    onClick={() => buyMediaAntenna(antenna.id)}
                                    disabled={!canBuy}
                                    style={{ padding: '6px 10px', fontSize: '0.8em', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                                  >
                                    Buduj ({costPln.toLocaleString()} zł)
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MAFIA & DENOMINACJA SUB-TAB */}
              {lata90SubTab === 'mafia' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  {/* Protection panel */}
                  <div style={{ flex: 1.2, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e74c3c', paddingBottom: '5px', color: '#e74c3c' }}>Ochrona i Haracze</h3>
                    <p style={{ fontSize: '0.95em', color: '#bdc3c7', lineHeight: '1.4' }}>
                      Kiedy Twój kapitał przekroczy próg 10 mln zł, mafia z Pruszkowa lub Wołomina spróbuje ściągnąć od Ciebie haracz (wynoszący 10% Twoich oszczędności).
                      Zainwestuj w ochronę osobistą, aby zabezpieczyć się przed ich żądaniami!
                    </p>

                    <div style={{ display: 'grid', gap: '12px', marginTop: '15px' }}>
                      {MAFIA_PROTECTIONS.map(prot => {
                        const currentProt = MAFIA_PROTECTIONS.find(p => p.id === state.mafiaProtectionId);
                        const currentLevel = currentProt ? currentProt.protectionLevel : 0;
                        const isOwned = currentLevel >= prot.protectionLevel;
                        const costPln = Math.floor(prot.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const canBuy = state.pln >= costPln && !isOwned;
                        
                        return (
                          <div key={prot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isOwned ? '#1e293b' : '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid ' + (isOwned ? '#27ae60' : '#465c71') }}>
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '1.05em', color: '#fff' }}>{prot.name}</strong>
                              <div style={{ fontSize: '0.8em', color: '#bdc3c7', marginTop: '3px' }}>{prot.desc} (Poziom ochrony: {prot.protectionLevel}%)</div>
                            </div>
                            {isOwned ? (
                              <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '0.9em', padding: '6px' }}>AKTYWNA</span>
                            ) : (
                              <button
                                onClick={() => hireMafiaProtection(prot.id)}
                                disabled={!canBuy}
                                style={{ padding: '8px 15px', fontSize: '0.85em', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuy ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Kup ({costPln.toLocaleString()} zł)
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Przejście do Lata 2000. */}
                  {state.isDenominated && !state.fazaSUnlocked && (
                    <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #3498db', borderRadius: '6px', marginTop: '15px' }}>
                      <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #3498db', paddingBottom: '5px', color: '#3498db' }}>Wejście do Unii Europejskiej</h3>
                      <p style={{ fontSize: '0.95em', color: '#bdc3c7', lineHeight: '1.4' }}>Złoty jest stabilny, a Polska puka do drzwi UE. Przygotuj 50 000 000 PLN kapitału, by wejść w nową erę biznesu!</p>
                      <button onClick={unlockFazaS} disabled={state.pln < 50000000} style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: state.pln >= 50000000 ? '#3498db' : '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 50000000 ? 'pointer' : 'not-allowed', marginTop: '15px' }}>
                        ROZPOCZNIJ LATA 2000. (50 Mln PLN)
                      </button>
                    </div>
                  )}

                  {/* Denomination panel */}
                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #27ae60', paddingBottom: '5px', color: '#27ae60' }}>Reforma Walutowa (Denominacja)</h3>
                    <p style={{ fontSize: '0.95em', color: '#bdc3c7', lineHeight: '1.4' }}>
                      Hiperinflacja zżera Twoje oszczędności! Aby przejść na stabilnego, nowego złotego (PLN) i skreślić 4 zera ze wszystkich cen w grze, musisz sfinansować wielką kampanię reform i denominacji waluty.
                    </p>

                    <div style={{ marginTop: '20px' }}>
                      {!state.isDenominated ? (
                         <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#2c3e50', border: '1px solid #27ae60', borderRadius: '6px' }}>
                           <div style={{ fontSize: '0.9em', color: '#ecf0f1', marginBottom: '15px' }}>Wymagany koszt reformy walutowej: 10 000 000 000 starych złotych (10 Mld PLZ).</div>
                           <button 
                             onClick={denominatePln}
                             disabled={state.pln < 10000000000}
                             style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: state.pln >= 10000000000 ? '#27ae60' : '#7f8c8d', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 10000000000 ? 'pointer' : 'not-allowed' }}
                           >
                             PRZEPROWADŹ DENOMINACJĘ (10 Mld PLZ)
                           </button>
                         </div>
                      ) : (
                         <div style={{ textAlign: 'center', padding: '25px', backgroundColor: '#27ae60', color: '#fff', borderRadius: '6px' }}>
                           <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2em' }}>DENOMINACJA ZAKOŃCZONA SUKCESEM</h4>
                           <p style={{ margin: 0, fontSize: '0.95em' }}>Złoty jest w pełni stabilny. Skreślono 4 zera. Jesteś rekinem finansjery wolnej Polski w III RP!</p>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {currentTab === 'miasto' && (() => {
          if (!state.fazaNUnlocked) {
            return (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#111', color: '#fff', border: '2px solid #8e44ad', borderRadius: '4px' }}>
                <h2 style={{ color: '#8e44ad', fontWeight: 'bold' }}>SZARA STREFA I MIASTO</h2>
                <p style={{ fontSize: '1.2em' }}>Bazar to za mało. Czas przejąć kontrolę nad ulicami Warszawy.</p>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#222', border: '1px solid #444' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#e74c3c' }}>Wymagane wkupne do struktur:</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li style={{ color: state.pln >= (state.isDenominated ? 10000 : 100000000) ? 'green' : 'red' }}>
                      {state.pln >= (state.isDenominated ? 10000 : 100000000) ? '✓' : '✗'} {state.isDenominated ? '10 000 PLN' : '100 000 000 PLZ'}
                    </li>
                  </ul>
                  <button 
                    onClick={unlockFazaN}
                    disabled={state.pln < (state.isDenominated ? 10000 : 100000000)}
                    style={{ 
                      marginTop: '15px', padding: '15px 30px', fontSize: '1.2em', 
                      backgroundColor: state.pln >= (state.isDenominated ? 10000 : 100000000) ? '#8e44ad' : '#444', 
                      color: '#fff', border: 'none', cursor: state.pln >= (state.isDenominated ? 10000 : 100000000) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', borderRadius: '4px'
                    }}
                  >
                    OPŁAĆ REZYDENTÓW I WEJDŹ DO GRY
                  </button>
                </div>
              </div>
            );
          }

          let playerPower = 0;
          let totalUpkeep = 0;
          Object.entries(state.gangUnits).forEach(([id, count]) => {
            const u = GANGSTER_UNITS.find(x => x.id === id);
            if (u) {
              playerPower += u.combatPower * count;
              totalUpkeep += u.upkeepPln * count;
            }
          });
          let wBonus = 0;
          Object.entries(state.gangWeapons).forEach(([id, count]) => {
            const w = BLACK_MARKET_WEAPONS.find(x => x.id === id);
            if (w) wBonus += w.powerBonus * count;
          });
          const modifiedPower = Math.floor(playerPower * (1 + wBonus)) + (state.gangRespect * 2);
          const currentUpkeep = Math.floor(totalUpkeep * (state.isDenominated ? 1 : state.plzInflationMult));

          return (
            <div style={{ padding: '15px', backgroundColor: '#1a1a1a', color: '#ecf0f1', fontFamily: '"Courier New", Courier, monospace', borderRadius: '4px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#8e44ad', color: '#fff', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '900', letterSpacing: '2px' }}>MAPA WPŁYWÓW: WARSZAWA</h2>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                    KONTROLA NAD MIASTEM
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Szacunek na mieście</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#f1c40f' }}>{state.gangRespect} pkt</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Siła Gangu</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#e74c3c' }}>{modifiedPower}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Koszty Utrzymania</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#c0392b' }}>-{currentUpkeep.toLocaleString()} zł/s</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                
                <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ backgroundColor: '#2c3e50', padding: '15px', border: '1px solid #34495e', borderRadius: '4px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #e74c3c', paddingBottom: '5px' }}>Rekrutacja (Żołnierze)</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {GANGSTER_UNITS.map(unit => {
                        const cost = Math.floor(unit.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const qty = state.gangUnits[unit.id] || 0;
                        return (
                          <div key={unit.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{unit.name} <span style={{color: '#f1c40f'}}>({qty})</span></div>
                              <div style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Siła: {unit.combatPower} | Żołd: {Math.floor(unit.upkeepPln * (state.isDenominated ? 1 : state.plzInflationMult))}/s</div>
                            </div>
                            <button 
                              onClick={() => buyGangUnit(unit.id, 1)}
                              disabled={state.pln < cost}
                              style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '3px', cursor: state.pln >= cost ? 'pointer' : 'not-allowed' }}
                            >
                              Werbuj ({cost.toLocaleString()} zł)
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#2c3e50', padding: '15px', border: '1px solid #34495e', borderRadius: '4px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f39c12', paddingBottom: '5px' }}>Czarny Rynek (Zbrojownia)</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {BLACK_MARKET_WEAPONS.map(w => {
                        const costPln = Math.floor(w.costPln * (state.isDenominated ? 1 : state.plzInflationMult));
                        const qty = state.gangWeapons[w.id] || 0;
                        return (
                          <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{w.name} <span style={{color: '#f1c40f'}}>({qty})</span></div>
                              <div style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Bonus: +{(w.powerBonus * 100).toFixed(0)}% do siły</div>
                            </div>
                            <button 
                              onClick={() => buyBlackMarketWeapon(w.id, 1)}
                              disabled={state.pln < costPln || state.dollars < w.costUsd}
                              style={{ padding: '5px 10px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              Kup ({costPln.toLocaleString()} zł{w.costUsd > 0 ? ` + ${w.costUsd}$` : ''})
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1.5, minWidth: '400px', backgroundColor: '#222', padding: '15px', border: '1px solid #444', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8e44ad', paddingBottom: '5px', color: '#8e44ad' }}>Terytoria (Pruszków vs Wołomin vs My)</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {WARSAW_DISTRICTS.map(dist => {
                      const ctrl = state.districtControl[dist.id] || { player: 0, pruszkow: 0, wolomin: 100 };
                      const income = Math.floor(dist.baseIncomePln * (ctrl.player / 100) * (state.isDenominated ? 1 : state.plzInflationMult));
                      return (
                        <div key={dist.id} style={{ backgroundColor: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '1.2em' }}>{dist.name}</strong>
                            <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>+{income.toLocaleString()} zł/s</span>
                          </div>
                          <div style={{ fontSize: '0.85em', color: '#aaa', marginBottom: '10px' }}>{dist.desc}</div>
                          
                          <div style={{ display: 'flex', height: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #555' }}>
                            <div style={{ width: `${ctrl.player}%`, backgroundColor: '#8e44ad', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', fontWeight: 'bold' }}>
                              {ctrl.player > 5 ? `${ctrl.player.toFixed(1)}%` : ''}
                            </div>
                            <div style={{ width: `${ctrl.pruszkow}%`, backgroundColor: '#e67e22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', fontWeight: 'bold' }}>
                              {ctrl.pruszkow > 5 ? `${ctrl.pruszkow.toFixed(1)}% (P)` : ''}
                            </div>
                            <div style={{ width: `${ctrl.wolomin}%`, backgroundColor: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7em', fontWeight: 'bold' }}>
                              {ctrl.wolomin > 5 ? `${ctrl.wolomin.toFixed(1)}% (W)` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}


      </div>
      
      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <div className="toast-title">{t.title}</div>
            <div className="toast-desc">{t.desc}</div>
          </div>
        ))}
      </div>

      {/* Retro Modal Dialog */}
      {activeModal && (
        <div className="retro-modal-overlay">
          <div className={`retro-modal ${activeModal.type ? `modal-${activeModal.type}` : ''}`}>
            <div className="retro-modal-title">{activeModal.title}</div>
            <div className="retro-modal-message">{activeModal.message}</div>
            <div className="retro-modal-buttons">
              {activeModal.cancelText && (
                <button className="retro-modal-btn btn-cancel" onClick={activeModal.onCancel}>
                  {activeModal.cancelText}
                </button>
              )}
              <button className="retro-modal-btn" onClick={activeModal.onConfirm}>
                {activeModal.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
