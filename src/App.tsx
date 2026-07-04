import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useGameState } from './hooks/useGameState';
import { QUEUE_ITEMS, HELPERS, PARTY_RANKS, BUSINESSES, SMUGGLING_ROUTES, HISTORY_EVENTS, SEA_SMUGGLING_ROUTES, BALTONA_ITEMS, GPW_STOCKS, NOMENKLATURA_COMPANIES, OFFSHORE_DEPOSITS, COCOM_ITEMS, EXPORT_CONTACTS, SYNDICATE_UPGRADES, ELECTION_REGIONS, CAMPAIGN_MATERIALS, CAMPAIGN_LEADERS, DEBATE_OPTIONS, ELECTION_UPGRADES, COCOM_SMUGGLING_ROUTES, COCOM_VEHICLES, COCOM_PERSONNEL, BAZAR_ITEMS, NFI_COMPANIES, MAFIA_PROTECTIONS, GANGSTER_UNITS, BLACK_MARKET_WEAPONS, BAZAR_LOGISTICS_ROUTES, WAREHOUSE_UPGRADES, MEDIA_STATIONS, MEDIA_PROGRAMS, MEDIA_ANTENNA_REGIONS , EU_PROJECTS, DOTCOM_UPGRADES, REAL_ESTATE_PROJECTS, CRISIS_REAL_ESTATE, CURRENCY_OPTION_PRESETS, LOBBY_BILLS, COMMISSION_QUESTIONS, VAT_UPGRADES, HELPER_UPGRADE_COSTS } from './game/items';
import { playClick, playSuccess, playError, playAlert, isSoundEnabled, setSoundEnabled } from './utils/audio';
// [Claude] fmtNum/pluralPL: polskie formatowanie liczb (przecinek dziesiętny) i odmiana rzeczowników po liczebnikach.
// Usunięto też martwe "void DEBATE_OPTIONS; void ELECTION_UPGRADES;" - obie stałe są od dawna używane w zakładce Wyborów.
import { fmtNum, pluralPL } from './utils/format';
// [Claude] KIERUNEK 7.3: identyfikatory i rzuty koscia przez utils/rng.ts - koniec wyciszen react-hooks/purity
import { uniqueId, chance } from './utils/rng';
// [Claude] KIERUNEK 1.2: zakladki jako osobne komponenty (JSX przeniesiony 1:1 z tego pliku).
// [Claude] KIERUNEK 4: React.lazy - kod kazdej zakladki laduje sie dopiero przy pierwszym wejsciu
// (gracz w PRL-u nie pobiera kodu GPW ani karuzeli VAT); vite tnie paczke na czesci automatycznie.
const TabLata2000 = lazy(() => import('./tabs/TabLata2000'));
const TabPraca = lazy(() => import('./tabs/TabPraca'));
const TabBazar = lazy(() => import('./tabs/TabBazar'));
const TabCzarnyRynek = lazy(() => import('./tabs/TabCzarnyRynek'));
const TabPrzemyt = lazy(() => import('./tabs/TabPrzemyt'));
const TabPartia = lazy(() => import('./tabs/TabPartia'));
const TabOdznaczenia = lazy(() => import('./tabs/TabOdznaczenia'));
const TabGpw = lazy(() => import('./tabs/TabGpw'));
const TabOffshore = lazy(() => import('./tabs/TabOffshore'));
const TabSyndykat = lazy(() => import('./tabs/TabSyndykat'));
const TabWybory = lazy(() => import('./tabs/TabWybory'));
const TabLata90 = lazy(() => import('./tabs/TabLata90'));
const TabMiasto = lazy(() => import('./tabs/TabMiasto'));
const TabMordor = lazy(() => import('./tabs/TabMordor'));
import { GameApiContext } from './tabs/GameApiContext';
import type { GameApi } from './tabs/GameApiContext';
import { MORDOR_UPGRADES, JDG_TAX_LEVELS, EURO_BOND_TYPES } from './game/items';
// [Claude] KIERUNEK 1.3: wspolne wzory - panel Casio i Bazar pokazuja to, co liczy silnik
import { helperSpeedMult, businessProductionMult, cinkciarzRate, queueTimeMs, bazarPlnUnitPrice, bazarUsdUnitPrice, realEstateCostPln, realEstateBuildTimeSec, chfInstallmentPerSec, vatCarouselRefundPerSec, mordorIncomePerSec, mordorEmployeeUpkeepPerSec } from './game/formulas';
// [Claude] silnik gry (KIERUNEK.md pkt 1.1) - czysta pętla + zdarzenia; stamtąd też calculateLuxurySuspicionReduction
import { tick, calculateLuxurySuspicionReduction } from './game/engine';
import type { GameEvent, SoundId } from './game/engine';

export type TabId = 'praca' | 'bazar' | 'przemyt' | 'partia' | 'czarnyRynek' | 'odznaczenia' | 'gpw' | 'offshore' | 'syndykat' | 'wybory' | 'lata90' | 'miasto' | 'lata2000' | 'mordor';

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { state, updateState, resetGame: originalResetGame } = useGameState(settingsOpen);
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
  const [lata2000SubTab, setLata2000SubTab] = useState<'ue' | 'dotcom' | 'deweloperka' | 'zmywak' | 'polityka' | 'raje'>('ue');
  const [selectedStockId, setSelectedStockId] = useState<string>('kghm');
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [newCompanyGoods, setNewCompanyGoods] = useState<'electronics' | 'steel' | 'fuel'>('steel');
  const [vatOffshoreAmountInput, setVatOffshoreAmountInput] = useState<string>('100000');
  const [toasts, setToasts] = useState<{ id: string; title: string; desc: string }[]>([]);
  const [casioMode, setCasioMode] = useState<'bilans' | 'statystyki' | 'szczegoly'>('bilans');
  const [speedrunChecked, setSpeedrunChecked] = useState(false);
  const [offshoreTransferAmount, setOffshoreTransferAmount] = useState<string>('');
  const [offshoreExchangeAmount, setOffshoreExchangeAmount] = useState<string>('');

  interface GameModal {
    title: string;
    message: string;
    type?: 'info' | 'error' | 'success' | 'raid' | 'pap';
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }
  // [Claude] KIERUNEK 3: KOLEJKA modali zamiast pojedynczego okna. Wcześniej gdy w tej samej
  // sekundzie wypadło kilka zdarzeń (np. koniec lokaty + nalot SB), gracz widział tylko
  // ostatni komunikat - reszta przepadała. Teraz "ZROZUMIANO" pokazuje kolejny z kolejki.
  // Bezpieczniki: identyczna treść nie dubluje się w kolejce, limit 8 okien naraz.
  const [modalQueue, setModalQueue] = useState<GameModal[]>([]);
  const activeModal = modalQueue.length > 0 ? modalQueue[0] : null;
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
  // [Claude] KIERUNEK 7.2: przełącznik efektu CRT (scanlines + migotanie) dla słabszych komputerów;
  // ustawienie trwałe w localStorage, jak dźwięk
  const [crtOn, setCrtOn] = useState(() => {
    try { return localStorage.getItem('kombinator_crt_enabled') !== 'false'; } catch { return true; }
  });
  const toggleCrt = () => {
    setCrtOn(prev => {
      const next = !prev;
      try { localStorage.setItem('kombinator_crt_enabled', String(next)); } catch { /* brak zapisu nie szkodzi */ }
      return next;
    });
  };
  
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
    if (settingsOpen || modalQueue.length > 0) return;
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
  }, [settingsOpen, modalQueue.length]);
  

  // useCallback: stabilne tożsamości, żeby efekty mogły mieć showAlert w zależnościach
  // bez restartu co render (settery useState są stabilne, więc [] wystarczy)
  const closeActiveModal = useCallback(() => setModalQueue(q => q.slice(1)), []);
  const enqueueModal = useCallback((modal: GameModal) => {
    setModalQueue(q => {
      if (q.length >= 8) return q;
      if (q.some(m => m.message === modal.message && m.title === modal.title)) return q;
      return [...q, modal];
    });
  }, []);

  const showAlert = useCallback((message: string, title = 'KOMUNIKAT URZĘDOWY', type: 'info' | 'error' | 'success' | 'raid' | 'pap' = 'info') => {
    enqueueModal({
      title,
      message,
      type,
      confirmText: 'ZROZUMIANO',
      onConfirm: closeActiveModal
    });
  }, [enqueueModal, closeActiveModal]);

  // Raport offline (wykonywany po wczytaniu save'a i ewentualnej symulacji)
  useEffect(() => {
    console.log('Checking offlineReport:', state.offlineReport);
    if (state.offlineReport) {
      const rep = state.offlineReport;
      const hours = Math.floor(rep.timeSec / 3600);
      const mins = Math.floor((rep.timeSec % 3600) / 60);
      let msg = `Towarzyszu Obywatelu, pod Twoją nieobecność (${hours}h ${mins}m) nasz kombinat pracował pełną parą!\n\nOto wyniki produkcyjne:\n`;
      if (rep.earnedPln > 0) msg += `- Gotówka (PLN): +${fmtNum(rep.earnedPln)}\n`;
      if (rep.earnedDollars > 0) msg += `- Dewizy (USD): +$${fmtNum(rep.earnedDollars)}\n`;
      if (rep.dividends > 0) msg += `- Dywidendy GPW/NFI: +${fmtNum(rep.dividends)} PLN\n`;
      if (rep.interest > 0) msg += `- Odsetki: +${fmtNum(rep.interest)}\n`;
      
      const itemKeys = Object.keys(rep.earnedItems);
      if (itemKeys.length > 0) {
        msg += `\nWyprodukowane dobra:\n`;
        itemKeys.forEach(k => {
          if (rep.earnedItems[k] > 0) {
             msg += `- ${k}: +${fmtNum(rep.earnedItems[k], 2, true)}\n`;
          }
        });
      }
      
      msg += `\nKu chwale ojczyzny!`;
      
      // eslint-disable-next-line react-hooks/set-state-in-effect
      enqueueModal({
        title: 'RAPORT ZMIANY (OFFLINE)',
        message: msg,
        type: 'info',
        confirmText: 'ZROZUMIANO',
        onConfirm: () => {
           updateState(s => ({ ...s, offlineReport: null }));
           closeActiveModal();
        }
      });
    }
  }, [state.offlineReport, enqueueModal, closeActiveModal, updateState]);

  const showConfirm = (message: string, onConfirm: () => void, title = 'DECYZJA') => {
    enqueueModal({
      title,
      message,
      confirmText: 'TAK',
      cancelText: 'NIE',
      onConfirm: () => {
        onConfirm();
        closeActiveModal();
      },
      onCancel: closeActiveModal
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
    const id = uniqueId('toast');
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
  }, [state.pewexItems.transformacja, state.okraglyStolVictory, state.speedrunActive, state.speedrunHistory, state.speedrunTime, updateState, showAlert]);

  // [Claude] 7.3: bez Date.now() przy inicjalizacji (czysty render); pierwszy tick uzupelnia wartosc
  const lastTickRef = useRef<number | null>(null);
  
  // Game Loop
  // [Claude] Refaktoryzacja (KIERUNEK.md pkt 1.1): cała logika ticku mieszka teraz w czystej
  // funkcji tick() w src/game/engine.ts. Silnik zwraca listę zdarzeń (dźwięki, alerty, toasty),
  // które App odtwarza PO zakończeniu aktualizacji stanu - w efekcie niżej. Bufor z tickId
  // usuwa duplikaty: React StrictMode w trybie deweloperskim celowo wywołuje updater dwukrotnie,
  // co przy starym setTimeout wewnątrz updatera podwajało komunikaty i dźwięki.
  const pendingTickEventsRef = useRef<{ tickId: number; events: GameEvent[] }[]>([]);
  const tickIdRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - (lastTickRef.current ?? now);
      lastTickRef.current = now;
      const deltaSec = deltaMs / 1000;

      if (settingsOpen || modalQueue.length > 0) {
        return; // Pauza
      }

      const tickId = ++tickIdRef.current;
      updateState(s => {
        const result = tick(s, deltaSec, { now, activeQueue });
        pendingTickEventsRef.current = pendingTickEventsRef.current.filter(p => p.tickId !== tickId);
        if (result.events.length > 0) {
          pendingTickEventsRef.current.push({ tickId, events: result.events });
        }
        return result.state;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [updateState, activeQueue, settingsOpen, modalQueue.length]);

  // [Claude] Odtwarzanie zdarzeń silnika po każdym renderze (poza updaterem stanu).
  // Efekt celowo NIE ma tablicy zależności - musi zaglądać do bufora po każdym renderze.
  // Pętla aktualizacji się nie zapętla: bufor jest czyszczony (splice) przy pierwszym wejściu,
  // a kolejne wywołanie kończy się na strażniku "length === 0".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (pendingTickEventsRef.current.length === 0) return;
    const batches = pendingTickEventsRef.current.splice(0);
    const playById: Record<SoundId, () => void> = { click: playClick, success: playSuccess, error: playError, alert: playAlert };
    for (const batch of batches) {
      for (const ev of batch.events) {
        if (ev.kind === 'sound') {
          playById[ev.sound]();
        } else if (ev.kind === 'alert') {
          showAlert(ev.message, ev.title, ev.alertType);
        } else if (ev.kind === 'toast') {
          addToast(ev.title, ev.desc);
        } else {
          setQueueProgress(prev => prev + ev.incrementPercent);
        }
      }
    }
  });

  // Queue Progression
  // [Claude] KIERUNEK 1.3: czas kolejki liczy wspolny wzor queueTimeMs() (ten sam, ktorego
  // uzywa silnik dla auto-pchacza C64). Wartosc liczona przy renderze, a efekt zalezy od
  // samej LICZBY - restartuje sie tylko, gdy czas faktycznie sie zmieni (wczesniej restart
  // nastepowal co tick, bo silnik klonuje unlockedAchievements przy kazdej sekundzie).
  const queue1Item = activeQueue ? QUEUE_ITEMS.find(i => i.id === activeQueue) : undefined;
  const queue1TimeMs = queue1Item ? queueTimeMs(queue1Item.timeToBuyMs, state) : 0;
  useEffect(() => {
    if (!queue1Item || settingsOpen || modalQueue.length > 0 || queue1TimeMs <= 0) return;
    const item = queue1Item;
    const timeToBuy = queue1TimeMs;

    // [Claude] wydajność: tick 50 ms wymuszał ~20 pełnych re-renderów aplikacji na sekundę na KAŻDY aktywny pasek.
    // 200 ms wystarcza (płynność zapewnia CSS transition na pasku), a obciążenie spada 4-krotnie.
    const tickMs = 200;
    const interval = setInterval(() => {
      setQueueProgress(prev => {
        const next = prev + (tickMs / timeToBuy) * 100;
        if (next >= 100) {
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
            // Zeszyt Komitetu: ponawia kolejkę jednorazowo po ukończeniu (nie w nieskończoność)
            if (s.plnUpgrades['zeszyt'] && s.pln >= currentCost && s.kartki >= reqKartki && !s.zeszytDidRequeue) {
                nextState.pln -= currentCost;
                if (reqKartki > 0) nextState.kartki -= reqKartki;
                nextState.zeszytDidRequeue = true;
            } else {
                nextState.zeszytDidRequeue = false;
                setActiveQueue(null);
            }
            
            return nextState;
          });
          return 0; // reset progress
        }
        return next;
      });
    }, tickMs);
    
    return () => clearInterval(interval);
  }, [queue1Item, queue1TimeMs, updateState, settingsOpen, modalQueue.length]);

  // Queue Progression 2 (Double queue upgrade)
  // [Claude] KIERUNEK 1.3: jak w pierwszej kolejce - wspolny wzor queueTimeMs()
  const queue2Item = activeQueue2 ? QUEUE_ITEMS.find(i => i.id === activeQueue2) : undefined;
  const queue2TimeMs = queue2Item ? queueTimeMs(queue2Item.timeToBuyMs, state) : 0;
  useEffect(() => {
    if (!queue2Item || settingsOpen || modalQueue.length > 0 || queue2TimeMs <= 0) return;
    const item = queue2Item;
    const timeToBuy = queue2TimeMs;

    // [Claude] wydajność: tick 50 ms wymuszał ~20 pełnych re-renderów aplikacji na sekundę na KAŻDY aktywny pasek.
    // 200 ms wystarcza (płynność zapewnia CSS transition na pasku), a obciążenie spada 4-krotnie.
    const tickMs = 200;
    const interval = setInterval(() => {
      setQueueProgress2(prev => {
        const next = prev + (tickMs / timeToBuy) * 100;
        if (next >= 100) {
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
            // Zeszyt Komitetu: ponawia kolejkę jednorazowo po ukończeniu (nie w nieskończoność)
            if (s.plnUpgrades['zeszyt'] && s.pln >= currentCost && s.kartki >= reqKartki && !s.zeszyt2DidRequeue) {
                nextState.pln -= currentCost;
                if (reqKartki > 0) nextState.kartki -= reqKartki;
                nextState.zeszyt2DidRequeue = true;
            } else {
                nextState.zeszyt2DidRequeue = false;
                setActiveQueue2(null);
            }
            
            return nextState;
          });
          return 0;
        }
        return next;
      });
    }, tickMs);
    
    return () => clearInterval(interval);
  }, [queue2Item, queue2TimeMs, updateState, settingsOpen, modalQueue.length]);

  // Smuggling Progression
  useEffect(() => {
    if (!activeSmuggle || settingsOpen || modalQueue.length > 0) return;
    const route = SMUGGLING_ROUTES.find(r => r.id === activeSmuggle);
    if (!route) return;

    // [Claude] wydajność: tick 50 ms wymuszał ~20 pełnych re-renderów aplikacji na sekundę na KAŻDY aktywny pasek.
    // 200 ms wystarcza (płynność zapewnia CSS transition na pasku), a obciążenie spada 4-krotnie.
    const tickMs = 200;
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
                  // [Claude] naprawa odmiany: "22 Rubli" -> "22 ruble" (reguły liczebnika polskiego)
                  alertMsg += ` oraz ${rubleEarned} ${pluralPL(rubleEarned, 'rubel', 'ruble', 'rubli')}`;
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
  }, [activeSmuggle, state.solidarnos, state.baltonaUpgrades, updateState, settingsOpen, showAlert, modalQueue.length]);

  // Printing Progression
  useEffect(() => {
    if (!state.isPrinting || settingsOpen || modalQueue.length > 0) return;
    const printTimeMs = 5000; // 5 seconds
    // [Claude] wydajność: tick 50 ms wymuszał ~20 pełnych re-renderów aplikacji na sekundę na KAŻDY aktywny pasek.
    // 200 ms wystarcza (płynność zapewnia CSS transition na pasku), a obciążenie spada 4-krotnie.
    const tickMs = 200;
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
  }, [state.isPrinting, updateState, settingsOpen, modalQueue.length]);

  // Sea Smuggling Progression
  useEffect(() => {
    if (!state.activeSeaSmuggle || settingsOpen || modalQueue.length > 0) return;
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

    // [Claude] wydajność: jak wyżej - rzadszy tick, płynność daje CSS transition
    const tickMs = 200;
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
                `Statek dotarł do portu! Marynarze pomyślnie dostarczyli towar i wręczyli Ci ${bonyEarned} ${pluralPL(bonyEarned, 'Bon Towarowy', 'Bony Towarowe', 'Bonów Towarowych')} Baltona.`,
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
  }, [state.activeSeaSmuggle, state.baltonaUpgrades, state.solidarnos, state.pewexItems, state.unlockedAchievements, updateState, settingsOpen, showAlert, modalQueue.length]);

  const startQueue = (id: string, cost: number, kartkiCost: number = 0) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      addToast("BLOKADA AKCJI", "Odbywasz karę więzienia!");
      return;
    }
    const hasDoubleQueue = !!state.pewexItems['podwojna_kolejka'];
    // [Claude] porządki: początkowe "= 0" nigdy nie było używane (każda gałąź nadpisuje lub wychodzi)
    let targetSlot: 1 | 2;
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
    
    // [Claude] KIERUNEK 1.3: cena z tego samego wzoru, ktory widnieje na przycisku Bazaru -
    // wyplata to DOKLADNIE cena jednostkowa razy liczba sztuk (wczesniej zaokraglenie
    // przy x10/x100 moglo dac o pare zlotych inna kwote, niz obiecywal przycisk)
    const finalPrice = bazarPlnUnitPrice(price, id, state) * amount;
    
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
    
    // [Claude] KIERUNEK 1.3: wspolny wzor z przyciskiem Bazaru (formulas.ts)
    const finalPrice = bazarUsdUnitPrice(price, id, state) * amount;
    
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
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
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
      showAlert(`Brak środków! Otwarcie konta kosztuje ${costPln.toLocaleString('pl-PL')} zł.`, 'Brak gotówki', 'error');
      return;
    }
    if (payWith === 'dollars' && state.dollars < costUsd) {
      playError();
      showAlert(`Brak środków! Otwarcie konta kosztuje $${costUsd.toLocaleString('pl-PL')} USD.`, 'Brak gotówki', 'error');
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

      addToast("ZLECONO PRZELEW SWIFT", `Wysłano ${amountToTransfer.toLocaleString('pl-PL')} ${currency === 'pln' ? 'zł' : 'USD'} (Prowizja: ${commission.toLocaleString('pl-PL')}).`);

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
        addToast("KANTOR ZURYCH", `Wymieniono ${amount.toLocaleString('pl-PL')} PLN na $${targetUsd} USD.`);
      } else {
        const spreadRate = 0.015;
        const targetPln = Math.floor((amount * currentMarketRate) * (1 - spreadRate));
        nextBalUsd -= amount;
        nextBalPln += targetPln;
        addToast("KANTOR ZURYCH", `Wymieniono $${amount} USD na ${targetPln.toLocaleString('pl-PL')} PLN.`);
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
      showAlert(`Brak dewiz! Założenie fundacji w Vaduz kosztuje $${costUsd.toLocaleString('pl-PL')} USD.`, "Brak dolarów", "error");
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

      addToast("POLISA PRALNICZA", `Legalnie przetransferowano ${amount.toLocaleString('pl-PL')} PLN do kraju. Krajowe Podejrzenie Milicji spadło!`);

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

      addToast("KURIER WYRUSZYŁ", `Kurier wyruszył z kwotą ${amount.toLocaleString('pl-PL')} ${currency === 'pln' ? 'zł' : 'USD'} w walizce.`);

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
      addToast("KREDYT DEWIZOWY", `Zaciągnięto pożyczkę na kwotę $${maxUsdCredit.toLocaleString('pl-PL')} USD. Czas na spłatę: 5 minut.`);
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
      showAlert(`Brak dolarów na koncie szwajcarskim! Spłata kredytu wraz z odsetkami kosztuje $${cost.toLocaleString('pl-PL')} USD.`, "Brak środków", "error");
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
    addToast("SYNDYKAT: ZAKUP", `Zakupiono ${item.name} za $${item.costUsd.toLocaleString('pl-PL')}`);
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
      id: uniqueId('ship'),
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
      id: uniqueId('run'),
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
      addToast("PRANIE ZYSKÓW", `Wyprany kapitał: ${netAmount.toLocaleString('pl-PL')} zł (prowizja ${Math.round(commissionRate * 100)}%)`);
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
      addToast("ZAGRANICZNE KONTA", `Wyprano kapitał na kwotę $${usdEarned.toLocaleString('pl-PL')} (ogromna prowizja operacyjna)`);
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
      gangRespect: s.gangRespect + (5 * qty),
      stats: {
        ...s.stats,
        totalBlackMarketPurchases: (s.stats.totalBlackMarketPurchases || 0) + qty
      }
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
      fazaMUnlocked: true,
      gpwUnlocked: true
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
        { id: uniqueId('transport'), routeId, timeLeft: route.durationSec }
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
    showAlert(`Wybudowano maszt nadawczy: ${antenna.name}. Zasięg stacji wzrósł o +${fmtNum(antenna.coverageMultiplier * 100, 0)}%!`, '📡 MASZT NADAWCZY', 'success');
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
    showAlert(`Podpisano kontrakt sponsorski z marką Pollena 2000! Otrzymano ${payout.toLocaleString('pl-PL')} zł. Widzowie są lekko zirytowani komercjalizacją (Zaufanie -15).`, '🧴 KONTRAKT SPONSORSKI', 'success');
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

    const success = chance(0.75);
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
      showAlert(`Afera na pierwszej stronie! Ujawniono romanse elit giełdowych. Sprzedaż poszybowała w górę! Zarobiono netto: ${(profit - costPln).toLocaleString('pl-PL')} zł (Zaufanie -10).`, '📸 PAPARAZZI', 'success');
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
      showAlert(`Przegrany proces sądowy o naruszenie dóbr osobistych! Musisz opłacić odszkodowanie w wysokości ${penalty.toLocaleString('pl-PL')} zł (Zaufanie -25).`, '⚖️ POZEW SĄDOWY', 'raid');
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
    addToast('RESTRUKTURYZACJA', `Zwolniono ${amount.toLocaleString('pl-PL')} pracowników. Koszty żołdu spadły, morale osłabło.`);
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
    addToast('ZATRUDNIENIE', `Zatrudniono dodatkowe ${amount.toLocaleString('pl-PL')} osób. Wzrost potencjału produkcyjnego.`);
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

  // ===== Faza W: Mordor na Domaniewskiej (Lata 2010.) - Funkcje Transakcyjne =====

  const unlockFazaW = () => {
    if (state.fazaWUnlocked) { playError(); return; }
    const cost = 100000000;
    if (state.pln < cost || !state.fazaSUnlocked || state.recessionActive || state.chfDebt > 0) {
      playError();
      showAlert('Aby wejść w lata 2010., musisz spłacić cały kredyt CHF, zakończyć Recesję 2008 i posiadać 100 000 000 PLN.', 'WYMAGANIA BLOKADY', 'error');
      return;
    }

    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      fazaWUnlocked: true
    }));
    setCurrentTab('mordor');
    playSuccess();
    showAlert('Wkraczasz w lata 2010.! Polska staje się zagłębiem outsourcingowym Europy, powstaje warszawski Mordor na Domaniewskiej, a programiści i menedżerowie masowo zakładają jednoosobowe działalności gospodarcze (JDG). Witaj w nowej rzeczywistości!', '🏢 NOWA ERA: LATA 2010.', 'success');
  };

  const buyEuroBond = (bondId: string) => {
    const bondDef = EURO_BOND_TYPES.find(b => b.id === bondId);
    if (!bondDef || (state.euros || 0) < bondDef.costEur) { playError(); return; }

    updateState(s => ({
      ...s,
      euros: (s.euros || 0) - bondDef.costEur,
      euroBonds: [...(s.euroBonds || []), {
        uuid: uniqueId('bond'),
        id: bondDef.id,
        country: bondDef.country,
        buyPriceEur: bondDef.costEur,
        nominalAmountEur: bondDef.costEur,
        timeLeft: bondDef.durationSec,
        interestRate: bondDef.interestRate,
        riskOfCrash: bondDef.riskOfCrash
      }]
    }));
    playSuccess();
    addToast('RYNEK OBLIGACJI', `Zakupiono obligacje skarbowe kraju: ${bondDef.country}.`);
  };

  const buyMordorFloor = () => {
    const cost = 5000000;
    if (state.pln < cost) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      mordorFloors: (s.mordorFloors || 0) + 1
    }));
    playSuccess();
    addToast('BIUROWIEC', 'Wybudowano kolejne piętro w korporacyjnej wieży.');
  };

  const buyMordorUpgrade = (upgradeId: string) => {
    const upg = MORDOR_UPGRADES.find(u => u.id === upgradeId);
    if (!upg || state.pln < upg.costPln || state.mordorUpgrades?.[upgradeId]) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - upg.costPln,
      mordorUpgrades: {
        ...(s.mordorUpgrades || {}),
        [upgradeId]: true
      }
    }));
    playSuccess();
    addToast('ULEPSZENIE BIURA', `Wdrożono: ${upg.name}.`);
  };

  const recruitMordorEmployee = () => {
    const cost = 200000;
    const maxCapacity = (state.mordorFloors || 0) * 10;
    if (state.pln < cost || (state.mordorEmployees || 0) >= maxCapacity) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      mordorEmployees: (s.mordorEmployees || 0) + 1,
      mordorMorale: Math.min(100, (s.mordorMorale || 0) + 5)
    }));
    playSuccess();
    addToast('REKRUTACJA', 'Zatrudniono nowego pracownika w zespole.');
  };

  const organizeMordorPizza = () => {
    const cost = 50000;
    if (state.pln < cost || (state.mordorMorale || 0) >= 100) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      mordorMorale: Math.min(100, (s.mordorMorale || 0) + 20)
    }));
    playSuccess();
    addToast('INTEGRACJA', 'Dostawca dowiózł pizzę do kuchni. Morale rośnie!');
  };

  const issueJdgContract = () => {
    const cost = 50000;
    if (state.pln < cost || (state.jdgContracts || 0) >= (state.mordorEmployees || 0)) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - cost,
      jdgContracts: (s.jdgContracts || 0) + 1
    }));
    playSuccess();
    addToast('UMOWA B2B', 'Pracownik podpisał samozatrudnienie (redukcja kosztów).');
  };

  const upgradeTaxLevel = () => {
    const nextLvl = JDG_TAX_LEVELS.find(l => l.level === (state.jdgTaxOptimizationLevel || 0) + 1);
    if (!nextLvl || state.pln < nextLvl.costPln) { playError(); return; }

    updateState(s => ({
      ...s,
      pln: s.pln - nextLvl.costPln,
      jdgTaxOptimizationLevel: nextLvl.level
    }));
    playSuccess();
    addToast('PODATKI', `Wdrożono nowy poziom optymalizacji: ${nextLvl.name}.`);
  };

  const sellEurosToPln = () => {
    if ((state.euros || 0) <= 0) { playError(); return; }
    const plnGain = Math.floor(state.euros * state.euroExchangeRate);

    updateState(s => ({
      ...s,
      pln: s.pln + plnGain,
      euros: 0
    }));
    playSuccess();
    addToast('KANTOR NBP', `Wymieniono EUR na PLN. Otrzymano +${plnGain.toLocaleString('pl-PL')} PLN.`);
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
      activeEuProjects: [...s.activeEuProjects, { id: uniqueId('eu'), projectId, timeLeft: proj.durationSec, funded: false }]
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
    showAlert(`Otrzymałeś kredyt we frankach szwajcarskich! Do spłaty: ${amountChf.toLocaleString('pl-PL')} CHF. Otrzymano po potrąceniu prowizji: ${plnReceived.toLocaleString('pl-PL')} PLN.`, '🏦 KREDYT CHF UZYSKANY', 'success');
  };

  const buyRealEstate = (projectId: string, useChf: boolean) => {
    const proj = REAL_ESTATE_PROJECTS.find(p => p.id === projectId);
    if (!proj) return;
    
    const count = (state.realEstateOwned[projectId] || 0) + (state.realEstateUnderConstruction.filter(x => x.id === projectId).length);
    const actualCostPln = realEstateCostPln(proj.costPln, count);
    const actualBuildTime = realEstateBuildTimeSec(proj.buildTimeSec, count);

    if (useChf) {
      if (state.chfDebt > 0 && state.pln < 1000000) { playError(); return; }
      const neededChf = Math.ceil(actualCostPln / state.chfExchangeRate);
      updateState(s => ({
        ...s,
        chfDebt: s.chfDebt + neededChf,
        realEstateUnderConstruction: [...s.realEstateUnderConstruction, { id: projectId, timeLeft: actualBuildTime, financedWithChf: true, uuid: uniqueId('build') }]
      }));
      playSuccess();
      addToast('DEWELOPERKA', `Rozpoczęto budowę "${proj.name}" (kredyt CHF).`);
    } else {
      if (state.pln < actualCostPln) { playError(); return; }
      updateState(s => ({
        ...s,
        pln: s.pln - actualCostPln,
        realEstateUnderConstruction: [...s.realEstateUnderConstruction, { id: projectId, timeLeft: actualBuildTime, financedWithChf: false, uuid: uniqueId('build') }]
      }));
      playSuccess();
      addToast('DEWELOPERKA', `Rozpoczęto budowę "${proj.name}".`);
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
    addToast('SPRZEDAŻ NIERUCHOMOŚCI', `Sprzedano: ${proj.name} za ${proj.sellRevenuePln.toLocaleString('pl-PL')} PLN.`);
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
    addToast('AGENCJA PRACY', `Wysłano ${count} ${pluralPL(count, 'osobę', 'osoby', 'osób')} na zmywak do UK.`);
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
          id: uniqueId('opcja'),
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
    addToast('KONTRAKT SPEKULACYJNY', `Nabyto opcję ${preset.type.toUpperCase()} na sumę ${preset.amountChf.toLocaleString('pl-PL')} CHF.`);
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
    addToast('KAPITAŁ ODZYSKANY', `Sprzedano inwestycję: ${proj.name} za ${proj.sellRevenuePln.toLocaleString('pl-PL')} PLN!`);
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
      showAlert(`Brak gotówki! Restrukturyzacja 500 000 CHF wymaga spłaty po karnym kursie stabilizującym ${fmtNum(penaltyRate, 2)} PLN/CHF. Wymagane: ${fmtNum(plnCost)} PLN.`, 'BRAK ŚRODKÓW', 'error');
      return;
    }

    updateState(s => ({
      ...s,
      pln: s.pln - plnCost,
      chfDebt: Math.max(0, s.chfDebt - restructureAmountChf)
    }));
    playSuccess();
    showAlert(`Pomyślnie spłacono i zamknięto 500 000 CHF długu walutowego za kwotę ${fmtNum(plnCost)} PLN. Ograniczyłeś ryzyko kursowe!`, '🏦 RESTRUKTURYZACJA CHF', 'success');
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
          fazaWUnlocked: true,
          euros: 50000,
          euroExchangeRate: 4.20,
          mordorFloors: 1,
          mordorEmployees: 5,
          mordorMorale: 80,
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

  const toggleLobbyBill = (id: string) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    updateState(s => {
      const active = { ...s.lobbyActiveBills };
      active[id] = !active[id];
      playClick();
      return { ...s, lobbyActiveBills: active };
    });
  };

  const buyTeczkaIPN = () => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if (state.dollars < 50000) {
      playError();
      addToast("BRAK ŚRODKÓW", "Potrzebujesz 50 000 USD, aby kupić teczkę IPN.");
      return;
    }
    updateState(s => {
      playSuccess();
      addToast("KUPIONO TECZKĘ", "Zakupiono tajne akta kompromitujące polityków.");
      return {
        ...s,
        dollars: s.dollars - 50000,
        teczkiCount: (s.teczkiCount || 0) + 1
      };
    });
  };

  const answerCommissionQuestion = (questionId: string, optionId: string) => {
    const question = COMMISSION_QUESTIONS.find(q => q.id === questionId);
    if (!question) return;
    const option = question.options.find(o => o.id === optionId);
    if (!option) return;

    updateState(s => {
      const newAggression = Math.max(0, Math.min(100, s.commissionAggression + option.aggressionChange));
      const newEvidence = Math.max(0, Math.min(100, s.commissionEvidence + option.evidenceChange));
      const newQuestionIndex = s.commissionQuestionIndex + 1;
      
      let commissionActive = s.commissionActive;
      let prisonSentenceRemaining = s.prisonSentenceRemaining;
      let pln = s.pln;
      let lobbyCorruption = s.lobbyCorruption;
      let lobbyActiveBills = { ...s.lobbyActiveBills };

      setTimeout(() => {
        playClick();
        addToast(option.toastTitle.toUpperCase(), option.toastDesc);
      }, 50);

      // Sprawdzenie czy przesłuchanie się skończyło
      if (newQuestionIndex >= COMMISSION_QUESTIONS.length) {
        commissionActive = false;
        lobbyCorruption = 0;
        // Skazanie
        if (newEvidence >= 70 || newAggression >= 70) {
          prisonSentenceRemaining = 60; // 60s więzienia
          pln = Math.floor(pln * 0.5); // strata 50% kasy
          lobbyActiveBills = {}; // wyłączenie lobbingu
          setTimeout(() => {
            playAlert();
            showAlert("Komisja Śledcza uznała Cię za winnego korupcji! Zostałeś skazany na 1 minutę więzienia oraz ukarany grzywną w wysokości 50% gotówki.", "🚨 SKAZANY!", "error");
          }, 200);
        } else {
          setTimeout(() => {
            playSuccess();
            showAlert("Dzięki sprytnym zeznaniom komisja nie znalazła wystarczających dowodów. Zostałeś oczyszczony z zarzutów!", "⚖️ UNIEWINNIONY", "success");
          }, 200);
        }
      }

      return {
        ...s,
        commissionAggression: newAggression,
        commissionEvidence: newEvidence,
        commissionQuestionIndex: newQuestionIndex,
        commissionActive,
        prisonSentenceRemaining,
        pln,
        lobbyCorruption,
        lobbyActiveBills
      };
    });
  };

  const useTeczkaInCommission = () => {
    if (state.teczkiCount <= 0) {
      playError();
      addToast("BRAK TECZEK", "Nie posiadasz żadnych teczek IPN do szantażu.");
      return;
    }
    updateState(s => {
      playSuccess();
      addToast("SZANTAŻ UDANY", "Użyłeś tajnych akt SB. Śledczy nagle złagodnieli!");
      return {
        ...s,
        teczkiCount: s.teczkiCount - 1,
        commissionAggression: Math.max(0, s.commissionAggression - 30)
      };
    });
  };

  // --- FAZA V: AKCJE KARUZELI VAT I OFFSHORE ---

  const registerShellCompany = (name: string, goodsType: 'electronics' | 'steel' | 'fuel') => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if ((state.vatCompanies || []).length >= 5) {
      playError();
      addToast("LIMIT SPÓŁEK", "Możesz mieć maksymalnie 5 zarejestrowanych spółek.");
      return;
    }
    if (state.pln < 100000) {
      playError();
      addToast("BRAK ŚRODKÓW", "Potrzebujesz 100 000 PLN, aby opłacić rejestrację spółki z o.o.");
      return;
    }

    const finalName = name.trim() || 'Firma Krzak S.A.';
    updateState(s => {
      const newCompany = {
        id: 'comp_' + Date.now(),
        name: finalName,
        goodsType,
        capital: 0,
        isActive: true,
        status: 'idle' as const
      };
      return {
        ...s,
        pln: s.pln - 100000,
        vatCompanies: [...(s.vatCompanies || []), newCompany]
      };
    });
    playSuccess();
    addToast("REJESTRACJA", `Zarejestrowano nową spółkę: ${finalName}`);
  };

  const addCompanyCapital = (companyId: string, amount: number) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if (state.pln < amount) {
      playError();
      addToast("BRAK ŚRODKÓW", "Nie posiadasz wystarczającej gotówki PLN.");
      return;
    }

    updateState(s => {
      const updated = (s.vatCompanies || []).map(c => {
        if (c.id === companyId) {
          if (c.status === 'inspected') return c; // block capital if inspected
          return { ...c, capital: c.capital + amount, status: 'trading' as const };
        }
        return c;
      });
      playSuccess();
      return {
        ...s,
        pln: s.pln - amount,
        vatCompanies: updated
      };
    });
    addToast("KAPITAŁ ZASILONY", `Zasilono kapitał spółki kwotą ${amount.toLocaleString('pl-PL')} PLN`);
  };

  const toggleCompanyActive = (companyId: string) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    updateState(s => {
      const updated = (s.vatCompanies || []).map(c => {
        if (c.id === companyId) {
          const nextActive = !c.isActive;
          return { ...c, isActive: nextActive };
        }
        return c;
      });
      playClick();
      return {
        ...s,
        vatCompanies: updated
      };
    });
  };

  const toggleVatCarousel = () => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    updateState(s => {
      const nextActive = !s.vatCarouselActive;
      playClick();
      return {
        ...s,
        vatCarouselActive: nextActive
      };
    });
  };

  const claimVatRefund = () => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if (state.vatRefundClaimed <= 0) {
      playError();
      addToast("BRAK ROSZCZEŃ", "Nie posiadasz żadnych zadeklarowanych kwot VAT do odzyskania.");
      return;
    }
    if (state.vatRefundStatus === 'pending') {
      playError();
      addToast("WERYFIKACJA W TOKU", "Urząd Skarbowy analizuje już poprzednią deklarację VAT-7.");
      return;
    }

    updateState(s => {
      playSuccess();
      const timer = s.vatUpgrades?.['doradca_vat'] ? 10 : 15;
      return {
        ...s,
        vatRefundStatus: 'pending' as const,
        vatRefundPendingAmount: Math.floor(s.vatRefundClaimed),
        vatRefundClaimed: 0,
        vatRefundTimer: timer
      };
    });
    addToast("DEKLARACJA WYSŁANA", "Złożono deklarację VAT-7 w Urzędzie Skarbowym. Weryfikacja w toku...");
  };

  const resolveVatAudit = (companyId: string, method: 'bribe' | 'lawyer') => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    const cost = method === 'lawyer' ? 25000 : 60000;
    if (method === 'lawyer' && !state.vatUpgrades?.['doradca_vat']) {
      playError();
      addToast("BRAK USŁUGI", "Musisz najpierw wykupić ulepszenie Kancelaria Prawa Podatkowego.");
      return;
    }
    if (state.pln < cost) {
      playError();
      addToast("BRAK ŚRODKÓW", `Potrzebujesz ${cost.toLocaleString('pl-PL')} PLN na uregulowanie sytuacji.`);
      return;
    }

    updateState(s => {
      const updated = (s.vatCompanies || []).map(c => {
        if (c.id === companyId) {
          return { ...c, status: 'idle' as const };
        }
        return c;
      });
      playSuccess();
      return {
        ...s,
        pln: s.pln - cost,
        vatCompanies: updated
      };
    });
    addToast("SPÓŁKA ODZYSKANA", "Spółka została pomyślnie oczyszczona z zarzutów skarbowych.");
  };

  const transferToOffshore = (amount: number) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if (state.pln < amount) {
      playError();
      addToast("BRAK ŚRODKÓW", "Nie masz tyle gotówki PLN na głównym koncie.");
      return;
    }

    const commissionRate = state.vatUpgrades?.['holding_cypryjski'] ? 0.02 : 0.10;
    const tax = amount * commissionRate;
    const transferred = amount - tax;

    updateState(s => {
      playSuccess();
      return {
        ...s,
        pln: s.pln - amount,
        offshoreCyprusBalance: (s.offshoreCyprusBalance || 0) + transferred
      };
    });
    addToast("TRANSFER OFFSHORE", `Przelano ${transferred.toLocaleString('pl-PL')} PLN na Cypr (Prowizja: ${tax.toLocaleString('pl-PL')} PLN)`);
  };

  const withdrawFromOffshore = (amount: number) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    if (state.offshoreCyprusBalance < amount) {
      playError();
      addToast("BRAK ŚRODKÓW", "Nie posiadasz tylu środków na cypryjskim koncie offshore.");
      return;
    }

    updateState(s => {
      playSuccess();
      return {
        ...s,
        offshoreCyprusBalance: s.offshoreCyprusBalance - amount,
        pln: s.pln + amount
      };
    });
    addToast("WYPŁATA OFFSHORE", `Wypłacono ${amount.toLocaleString('pl-PL')} PLN z Cypru jako pożyczkę udziałowca.`);
  };

  const buyVatUpgrade = (upgradeId: string) => {
    if (state.prisonSentenceRemaining > 0) {
      playError();
      return;
    }
    const upg = VAT_UPGRADES.find(u => u.id === upgradeId);
    if (!upg) return;

    if (upg.costPln && state.pln < upg.costPln) {
      playError();
      addToast("BRAK ŚRODKÓW", `Potrzebujesz ${upg.costPln.toLocaleString('pl-PL')} PLN.`);
      return;
    }
    if (upg.costUsd && state.dollars < upg.costUsd) {
      playError();
      addToast("BRAK ŚRODKÓW", `Potrzebujesz ${upg.costUsd.toLocaleString('pl-PL')} USD.`);
      return;
    }

    updateState(s => {
      playSuccess();
      const nextUpgrades = { ...s.vatUpgrades, [upgradeId]: true };
      const nextState = {
        ...s,
        vatUpgrades: nextUpgrades
      };
      if (upg.costPln) nextState.pln -= upg.costPln;
      if (upg.costUsd) nextState.dollars -= upg.costUsd;
      return nextState;
    });
    addToast("ZAKUPIONO ULEPSZENIE", `Zakupiono: ${upg.name}`);
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
    addToast("TRANSFER NA KAMPANIĘ", `Przekazano ${amount.toLocaleString('pl-PL')} ${currency === 'pln' ? 'zł' : 'USD'} na fundusz wyborczy.`);
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
    if (chance(mat.sbRiskPercent / 100)) {
      const guardMod = state.electionUpgrades['guard_squad'] ? 0.6 : 1.0;
      if (chance(guardMod)) {
        updateState(s => ({
          ...s,
          electionFundsPln: s.electionFundsPln - mat.costPln,
          paperStocks: Math.round((s.paperStocks - mat.paperCost) * 100) / 100,
          inkStocks: Math.round((s.inkStocks - mat.inkCost) * 100) / 100,
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
      paperStocks: Math.round((s.paperStocks - mat.paperCost) * 100) / 100,
      inkStocks: Math.round((s.inkStocks - mat.inkCost) * 100) / 100,
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
    if (totalVotes < 5000000) { playError(); showAlert(`Potrzebujesz minimum 5 000 000 głosów poparcia! Masz: ${totalVotes.toLocaleString('pl-PL')}.`, '⛔ ZA MAŁO GŁOSÓW', 'error'); return; }
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
      showAlert(`Rząd koalicyjny sformowany z bonusem x${fmtNum(bonusMult, 1)}. Transformacja w III RP rozpoczyna się!`, '🇵🇱 RZĄD KOALICYJNY', 'success');
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
       const stats = { ...s.stats, totalBlackMarketPurchases: (s.stats.totalBlackMarketPurchases || 0) + 1 };
       const suspAchMult = (s.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (s.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
       const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
       const suspicionAdd = s.partyRank === 'minister' || s.activeEvent === 'odwilz' ? 0 : Math.max(1, Math.floor(Math.floor(originalItem.costPln / 50) * suspAchMult * luxurySuspMult));
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
  // [Claude] KIERUNEK 1.3: wzory ze wspolnego modulu formulas.ts. Casio pokazuje teraz
  // DOKLADNIE to, co liczy silnik - stara kopia pomijala Magnetofon Grundig, Ustawe Wilczka
  // oraz inflacje i Czarny Wtorek w kursie cinkciarza (zanizone wskazania).
  const helperMult = helperSpeedMult(state, { zZdarzeniami: true });
  const effectiveExchangeRate = cinkciarzRate(state);
  
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
  BUSINESSES.forEach(b => {
    const count = state.businesses[b.id] || 0;
    if (count > 0) {
      const amount = count * b.ratePerTick * businessProductionMult(state, b.generateType, { zZdarzeniami: true });
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
        const revenuePerSec = stationRating * 8 * totalIncomeMult;
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
    if (state.lobbyActiveBills?.['zamowienia_publiczne']) {
      dotcomPlnRate = Math.floor(dotcomPlnRate * 2.0);
    }
  }

  let zmywakPlnRate = 0;
  if (state.fazaSUnlocked && state.zmywakWorkers > 0) {
    const gbpPerSec = state.zmywakWorkers * 5;
    const commissionGbp = gbpPerSec * 0.15;
    zmywakPlnRate = Math.floor(commissionGbp * 6);
    if (state.lobbyActiveBills?.['ustawa_hazardowa']) {
      zmywakPlnRate = Math.floor(zmywakPlnRate * 3.0);
    }
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
    if (state.lobbyActiveBills?.['ustawa_liniowa']) {
      nfiPlnRate = Math.floor(nfiPlnRate * 1.5);
    }
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
    const installmentChf = chfInstallmentPerSec(state);
    chfPlnCost = Math.floor(installmentChf * state.chfExchangeRate);
  }

  let cyprusInterestPlnRate = 0;
  if (state.fazaSUnlocked && state.offshoreCyprusBalance > 0) {
    cyprusInterestPlnRate = state.offshoreCyprusBalance * (0.0005 / 60);
  }

  let vatCarouselPlnRate = 0;
  if (state.fazaSUnlocked) {
    vatCarouselPlnRate = vatCarouselRefundPerSec(state);
  }

  let mordorPlnIncomeRate = 0;
  let mordorUpkeepCost = 0;
  if (state.fazaWUnlocked) {
    mordorPlnIncomeRate = mordorIncomePerSec(state) * state.euroExchangeRate;
    mordorUpkeepCost = mordorEmployeeUpkeepPerSec(state);
  }

  const totalPassiveIncome = businessPlnRate + mediaPlnRate + dotcomPlnRate + zmywakPlnRate + nfiPlnRate + gpwPlnRate + cyprusInterestPlnRate + mordorPlnIncomeRate;
  let lobbyBribeCost = 0;
  if (state.fazaSUnlocked) {
    LOBBY_BILLS.forEach(bill => {
      if (state.lobbyActiveBills?.[bill.id]) {
        lobbyBribeCost += bill.bribeCostPerSec;
      }
    });
  }

  const totalPassiveExpenses = Math.abs(cinkciarzPlnRate) + gangPlnCost + chfPlnCost + lobbyBribeCost + mordorUpkeepCost;
  const plnRate = totalPassiveIncome - totalPassiveExpenses;
  const dollarsRate = businessUsdRate + cinkciarzUsdRate + widmoUsdRate;
  const eurosRate = mordorIncomePerSec(state);

  const currentEventData = HISTORY_EVENTS.find(e => e.id === state.activeEvent);

  // [Claude] KIERUNEK 1.2: wszystko, czego potrzebuja komponenty zakladek, w jednym obiekcie.
  // Jawny typ GameApi sprawia, ze tsc wykryje kazda rozbieznosc miedzy App a zakladkami.
  const api: GameApi = {
    activeQueue,
    activeQueue2,
    activeSmuggle,
    addCompanyCapital,
    addToast,
    autoStartRun,
    bidInAuction,
    blackmailHelperTW,
    bribe,
    bribeBazarCustoms,
    bribeEuAuditor,
    bribeKrrit,
    bribeSBHandler,
    bribeSbChief,
    broadcastPoliticalSpot,
    buyAsset,
    buyBaltonaUpgrade,
    buyBazarItem,
    buyBlackMarketOffer,
    buyBlackMarketWeapon,
    buyBondPRL,
    buyBondSolidarnos,
    buyBonyPewex,
    buyBusiness,
    buyCOCOMItem,
    buyCocomVehicle,
    buyCounterIntel,
    buyCrisisRealEstate,
    buyCurrencyOption,
    buyEuroBond,
    buyDollarPremium,
    buyDotcomUpgrade,
    buyElectionUpgrade,
    buyGangUnit,
    buyGpwInsiderTip,
    buyHelper,
    buyInflationUpgrade,
    buyInk,
    buyInstantCzarnyRynek,
    buyMediaAntenna,
    buyMediaStation,
    buyNfiCompany,
    buyPaper,
    buyPrintingSupplies,
    buyProgramLicense,
    buyMordorFloor,
    buyMordorUpgrade,
    buyRealEstate,
    buyShares,
    buySyndicateUpgrade,
    buyTeczkaIPN,
    buyVatUpgrade,
    buyWholesale,
    claimMediaSponsorshipContract,
    claimVatRefund,
    concludeNegotiations,
    createOffshoreDeposit,
    currentRankIndex,
    deliverForRuble,
    deliverForTalony,
    denominatePln,
    dismissHelperTW,
    dispatchBazarTransport,
    distributePisma,
    exchangeGoodsForBaltona,
    exchangeRubleForDollars,
    exchangeTalonyForKartki,
    finishCrisisRealEstate,
    fireNfiEmployees,
    formatSpeedrunTime,
    fundSolidarnoscDollars,
    fundSolidarnoscKartki,
    fundSolidarnoscPln,
    fundSolidarnoscRuble,
    fundSolidarnoscTalony,
    helperMult,
    hireBankAdvisor,
    hireCocomPersonnel,
    hireMafiaProtection,
    hireNfiEmployees,
    hireRedDirector,
    interactDebate,
    isKartkiRequired,
    issueJdgContract,
    lata2000SubTab,
    lata90SubTab,
    launchRally,
    launderCocomProceeds,
    modernizeNfiInfrastructure,
    negotiateNfiUnions,
    newCompanyGoods,
    newCompanyName,
    offshoreDepositAmount,
    offshoreExchangeAmount,
    offshoreTransferAmount,
    offshoreWashAmount,
    openRegionalCommittee,
    openSwissAccount,
    organizeMordorPizza,
    pacifyNfiStrike,
    payOffshoreCredit,
    pracuj,
    printCampaignMaterial,
    przemytSubTab,
    queueProgress,
    queueProgress2,
    realTime,
    recruitTwInNomenklatura,
    recruitMordorEmployee,
    redeemSolidarnosBonds,
    registerLiechtensteinTrust,
    registerNomenklaturaCompany,
    registerShellCompany,
    resetGame,
    resolveVatAudit,
    restructureChfDebt,
    runElectionsFirstRound,
    runElectionsSecondRound,
    runInvestigation,
    runTabloidInvestigation,
    selectedStockId,
    sellAsset,
    sellBazarItem,
    sellBonyPewex,
    sellCrisisRealEstate,
    sellEurosToPln,
    sellItem,
    sellItemDollars,
    sellRealEstate,
    sellShares,
    sendCocomShipment,
    sendOffshoreCourier,
    sendWorkerToZmywak,
    setLata2000SubTab,
    setLata90SubTab,
    setMediaSlot,
    setNewCompanyGoods,
    setNewCompanyName,
    setOffshoreDepositAmount,
    setOffshoreExchangeAmount,
    setOffshoreTransferAmount,
    setOffshoreWashAmount,
    setPrzemytSubTab,
    setSelectedStockId,
    setSpeedrunChecked,
    setVatOffshoreAmountInput,
    showAlert,
    showConfirm,
    smuggleProgress,
    speedrunChecked,
    startEuProject,
    startOkraglyStol,
    startPrinting,
    startQueue,
    startSeaSmuggle,
    startSmuggle,
    state,
    takeChfMortgage,
    takeOffshoreCredit,
    toggleCompanyActive,
    toggleLobbyBill,
    toggleVatCarousel,
    transferToCampaign,
    transferToOffshore,
    unlockElections,
    unlockExportContact,
    unlockFazaM,
    unlockFazaN,
    unlockFazaS,
    unlockFazaW,
    unlockSyndicate,
    updateState,
    upgradeBazarWarehouse,
    upgradeHelper,
    upgradeLeasing,
    upgradeTaxLevel,
    vatOffshoreAmountInput,
    washOffshoreMoney,
    wholesalePrices,
    wireTransferToSwiss,
    withdrawFromOffshore,
    zurichExchange,
  };

  return (
    <GameApiContext.Provider value={api}>
    <div className={crtOn ? 'crt-screen' : 'crt-screen crt-off'}>
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

              {/* Efekt CRT (KIERUNEK 7.2) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem' }}>Efekt CRT (scanlines):</span>
                <button
                  onClick={() => { playClick(); toggleCrt(); }}
                  title="Wyłącz na słabszym komputerze - usuwa migotanie i linie ekranu kineskopowego"
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
                  {crtOn ? '📺 WŁĄCZONY' : '⬛ WYŁĄCZONY'}
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
                <button 
                  onClick={() => {
                    updateState(s => ({
                      ...s,
                      lobbyCorruption: 100
                    }));
                    setSettingsOpen(false);
                    setTimeout(() => addToast("DEV CHEAT", "Ustawiono korupcję na 100% - Komisja Śledcza zostanie wywołana!"), 50);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(155, 89, 182, 0.2)',
                    border: '1px solid #9b59b6',
                    color: '#9b59b6',
                    padding: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #9b59b6',
                    marginTop: '4px'
                  }}
                >
                  🔧 DEV: WYWOŁAJ KOMISJĘ
                </button>
                <button 
                  onClick={() => {
                    updateState(s => ({
                      ...s,
                      euros: (s.euros || 0) + 1000000
                    }));
                    setSettingsOpen(false);
                    setTimeout(() => addToast("DEV CHEAT", "Dodano 1 000 000 EUR!"), 50);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(0, 225, 217, 0.2)',
                    border: '1px solid #00e1d9',
                    color: '#00e1d9',
                    padding: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #00e1d9',
                    marginTop: '4px'
                  }}
                >
                  🔧 DEV: +1M EUR
                </button>
                <button 
                  onClick={() => {
                    updateState(s => ({
                      ...s,
                      pln: s.pln + 100000000
                    }));
                    setSettingsOpen(false);
                    setTimeout(() => addToast("DEV CHEAT", "Dodano 100 000 000 PLN!"), 50);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(46, 204, 113, 0.2)',
                    border: '1px solid #2ecc71',
                    color: '#2ecc71',
                    padding: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #2ecc71',
                    marginTop: '4px'
                  }}
                >
                  🔧 DEV: +100M PLN
                </button>
                <button 
                  onClick={() => {
                    updateState(s => ({
                      ...s,
                      offshoreCyprusBalance: (s.offshoreCyprusBalance || 0) + 1000000
                    }));
                    setSettingsOpen(false);
                    setTimeout(() => addToast("DEV CHEAT", "Dodano 1 000 000 PLN na Cyprze!"), 50);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(26, 188, 156, 0.2)',
                    border: '1px solid #1abc9c',
                    color: '#1abc9c',
                    padding: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #1abc9c',
                    marginTop: '4px'
                  }}
                >
                  🔧 DEV: +1M PLN CYPR
                </button>
                <button 
                  onClick={() => {
                    updateState(s => ({
                      ...s,
                      vatAuditRisk: 100
                    }));
                    setSettingsOpen(false);
                    setTimeout(() => addToast("DEV CHEAT", "Ustawiono ryzyko kontroli VAT na 100%!"), 50);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(230, 126, 34, 0.2)',
                    border: '1px solid #e67e22',
                    color: '#e67e22',
                    padding: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 'bold',
                    boxShadow: '0 0 3px #e67e22',
                    marginTop: '4px'
                  }}
                >
                  🔧 DEV: RYZYKO 100% & ZAMROŹ
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
        <div className="pap-ticker" style={{borderColor: '#3a3a1a', background: 'rgba(20,18,0,0.4)', color: '#6b6b3a', letterSpacing: '0.04em'}}>
          <div className="pap-badge" style={{background: '#2a2a0a', color: '#5a5a2a', fontStyle: 'italic'}}>AKTA ZASTRZEŻONE</div>
          <div className="pap-text" style={{fontSize: '0.88rem', fontStyle: 'italic', opacity: 0.7}}>
            {state.eventsUnlocked
              ? '▒▒▒ CZEKA NA SYGNAŁ... ▒▒▒ Następna transmisja zaszyfrowana. Utrzymuj kapitał powyżej progu.'
              : '▒▒▒ [TREŚĆ UTAJNIONA] ▒▒▒ Dostęp do kanału specjalnego wymaga odpowiedniego statusu majątkowego. Osiągnij próg — a zasłona opadnie.'}
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
             <span style={{fontSize: '1.2rem'}}>{fmtNum(state.inflationPercent, 1)}%</span>
          </div>
        )}
        <div className="flex-col">
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>ZŁOTÓWKI</span>
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.pln).toLocaleString('pl-PL')} zł</span>
        </div>
        <div className="flex-col text-dollar">
           <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>DOLARY</span>
           <span style={{fontSize: '1.2rem'}}>${Math.floor(state.dollars).toLocaleString('pl-PL')}</span>
        </div>
        {state.fazaWUnlocked && (
          <div className="flex-col" style={{color: '#00e1d9'}}>
             <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>EURO</span>
             <span style={{fontSize: '1.2rem'}}>{fmtNum(state.euros || 0, 2)} €</span>
          </div>
        )}
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
           {/* [Claude] KIERUNEK 7.4: "Rub" -> "rub." - spójnie z resztą skrótów (szt./bon./oz) */}
           <span style={{fontSize: '1.2rem'}}>{Math.floor(state.ruble)} rub.</span>
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
                <div style={{marginTop: '5px'}}>Złotówki: <span style={{color: plnRate >= 0 ? '#33ff33' : 'var(--prl-red)'}}>{plnRate >= 0 ? '+' : ''}{fmtNum(plnRate, 2)} zł/s</span></div>
                <div>Dolary: <span style={{color: 'var(--dollar-green)'}}>+{fmtNum(dollarsRate, 3)} $/s</span></div>
                {state.fazaWUnlocked && (
                  <div>Euro: <span style={{color: '#00e1d9'}}>+{fmtNum(eurosRate, 3)} €/s</span></div>
                )}
                <div>Kartki: <span style={{color: 'var(--prl-yellow)'}}>+{fmtNum(kartkiRate, 3)} szt/s</span></div>
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
                        {shortName}: +{fmtNum(rate, 4)}
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
                 <div style={{marginTop: '5px'}}>Biznesy (Szklarnie itp.): <span style={{color: '#33ff33'}}>+{fmtNum(businessPlnRate, 2)} zł/s</span></div>
                 {state.mediaUnlocked && (
                   <div>Wolne Media (Reklamy): <span style={{color: '#33ff33'}}>+{fmtNum(mediaPlnRate, 2)} zł/s</span></div>
                 )}
                 {state.fazaSUnlocked && (
                   <>
                     <div>Portal Dot-Com (AdSense): <span style={{color: '#33ff33'}}>+{fmtNum(dotcomPlnRate, 2)} zł/s</span></div>
                     <div>Emigracja (Zmywak UK): <span style={{color: '#33ff33'}}>+{fmtNum(zmywakPlnRate, 2)} zł/s</span></div>
                   </>
                 )}
                 {state.fazaMUnlocked && (
                   <div>Dywidendy NFI: <span style={{color: '#33ff33'}}>+{fmtNum(nfiPlnRate, 2)} zł/s</span></div>
                 )}
                 {state.gpwUnlocked && (
                   <div>Dywidendy GPW (śr): <span style={{color: '#33ff33'}}>+{fmtNum(gpwPlnRate, 2)} zł/s</span></div>
                 )}
                 {state.fazaWUnlocked && (
                   <div>Mordor BPO (EUR): <span style={{color: '#33ff33'}}>+{fmtNum(mordorPlnIncomeRate, 2)} zł/s</span></div>
                 )}
                 <div style={{borderTop: '1px dashed #33ff33', marginTop: '8px', paddingTop: '5px'}}>Suma Przychodów (Realne PLN): <strong>+{fmtNum(totalPassiveIncome, 2)} zł/s</strong></div>
                 {vatCarouselPlnRate > 0 && (
                   <div style={{marginTop: '5px', color: 'var(--prl-yellow)'}}>Należności VAT: <strong>+{fmtNum(vatCarouselPlnRate, 2)} zł/s</strong> (oczekujące)</div>
                 )}
               </div>
               <div>
                 <strong style={{color: 'var(--prl-red)'}}>PASYWNE KOSZTY (PLN/s):</strong>
                 <div style={{marginTop: '5px', color: '#ff6666'}}>Prowizje cinkciarza: <span>-{fmtNum(Math.abs(cinkciarzPlnRate), 2)} zł/s</span></div>
                 {state.fazaNUnlocked && (
                   <div style={{color: '#ff6666'}}>Utrzymanie gangu: <span>-{fmtNum(gangPlnCost, 2)} zł/s</span></div>
                 )}
                 {state.fazaSUnlocked && chfPlnCost > 0 && (
                   <div style={{color: '#ff6666'}}>Spłata kredytów CHF: <span>-{fmtNum(chfPlnCost, 2)} zł/s</span></div>
                 )}
                 {state.fazaSUnlocked && lobbyBribeCost > 0 && (
                   <div style={{color: '#ff6666'}}>Koszty lobbingu rządowego: <span>-{fmtNum(lobbyBribeCost, 2)} zł/s</span></div>
                 )}
                 {state.fazaWUnlocked && mordorUpkeepCost > 0 && (
                   <div style={{color: '#ff6666'}}>Koszty biura (Mordor): <span>-{fmtNum(mordorUpkeepCost, 2)} zł/s</span></div>
                 )}
                 <div style={{borderTop: '1px dashed var(--prl-red)', marginTop: '8px', paddingTop: '5px', color: 'var(--prl-red)'}}>Suma Kosztów: <strong>-{fmtNum(totalPassiveExpenses, 2)} zł/s</strong></div>
               </div>
               <div style={{display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', borderLeft: '1px dashed var(--prl-yellow)', paddingLeft: '15px'}}>
                 <strong style={{color: 'var(--prl-yellow)'}}>BILANS NETTO:</strong>
                 <div style={{fontSize: '1.4rem', color: plnRate >= 0 ? '#33ff33' : 'var(--prl-red)', fontWeight: 'bold', marginTop: '10px'}}>
                   {plnRate >= 0 ? '+' : ''}{fmtNum(plnRate, 2)} zł/s
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
                   <div>Łączne PLN: <span style={{color: 'var(--crt-text)'}}>{Math.floor(state.stats.totalPlnEarned).toLocaleString('pl-PL')} zł</span></div>
                   <div>Łączne Dolary: <span style={{color: 'var(--dollar-green)'}}>${Math.floor(state.stats.totalDollarsEarned).toLocaleString('pl-PL')}</span></div>
                   <div>Max PLN w ręku: <span style={{color: 'var(--crt-text)'}}>{Math.floor(state.stats.maxPlnHeld).toLocaleString('pl-PL')} zł</span></div>
                   <div>Czas w kolejce: <span style={{color: 'var(--prl-yellow)'}}>{Math.floor(state.stats.totalTimeQueued).toLocaleString('pl-PL')} s</span></div>
                </div>
                <div>
                   <div>Sprzedane towary: <span style={{color: 'var(--crt-text)'}}>{state.stats.totalItemsSold.toLocaleString('pl-PL')} szt.</span></div>
                   <div>Wymiany u Cinkciarza: <span style={{color: 'var(--crt-text)'}}>{state.stats.totalCinkciarzExchanges}</span></div>
                   <div>Wydatki na łapówki: <span style={{color: 'var(--prl-red)'}}>{state.stats.totalBribesPaidPln.toLocaleString('pl-PL')} zł</span></div>
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
         {state.gpwUnlocked && (
            <button onClick={() => { playClick(); setCurrentTab('gpw'); }} style={{flex: 1, backgroundColor: currentTab === 'gpw' ? '#39ff14' : 'transparent', color: currentTab === 'gpw' ? '#000' : '#39ff14', borderColor: '#39ff14'}}>GIEŁDA (GPW)</button>
         )}
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
          {state.fazaWUnlocked && (
            <button onClick={() => { playClick(); setCurrentTab('mordor'); }} style={{flex: 1, backgroundColor: currentTab === 'mordor' ? '#8e44ad' : 'transparent', color: currentTab === 'mordor' ? '#fff' : '#8e44ad', borderColor: '#8e44ad'}}>MORDOR (2010.)</button>
          )}
      </div>

      <div className="game-grid" style={{gridTemplateColumns: '1fr'}}>
        {/* [Claude] KIERUNEK 4: zakladki lazy - retro-komunikat na czas dogrywania modulu */}
        <Suspense fallback={<div className="panel"><h2>WCZYTYWANIE MODUŁU...</h2><p style={{color: 'var(--prl-gray)'}}>Dalekopis odbiera dane sekcji. Chwileczkę, towarzyszu.</p></div>}>
        
        {/* TAB: PRACA / KOLEJKA */}

        {currentTab === 'lata2000' && <TabLata2000 />}
        {currentTab === 'mordor' && <TabMordor />}
        {currentTab === 'praca' && <TabPraca />}

        {/* TAB: BAZAR / CINKCIARZ */}
        {currentTab === 'bazar' && <TabBazar />}

        {/* TAB: CZARNY RYNEK */}
        {currentTab === 'czarnyRynek' && <TabCzarnyRynek />}

        {/* TAB: PRZEMYT / BIZNES */}
        {currentTab === 'przemyt' && <TabPrzemyt />}

        {/* TAB: PARTIA / OPOZYCJA */}
        {currentTab === 'partia' && <TabPartia />}

        {/* TAB: ODZNACZENIA */}
        {currentTab === 'odznaczenia' && <TabOdznaczenia />}

         {/* TAB: GIEŁDA (GPW) */}
         {currentTab === 'gpw' && <TabGpw />}

        {/* TAB: KONTA ZAGRANICZNE (SZWAJCARIA I LIECHTENSTEIN) */}
        {currentTab === 'offshore' && <TabOffshore />}

        {/* TAB: SYNDYKAT EKSPORTOWY */}
        {currentTab === 'syndykat' && <TabSyndykat />}

        {currentTab === 'wybory' && <TabWybory />}

        {currentTab === 'lata90' && <TabLata90 />}

        {currentTab === 'miasto' && <TabMiasto />}
        </Suspense>

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
            {/* [Claude] KIERUNEK 3: wskaźnik kolejki - gracz wie, że czekają kolejne depesze */}
            {modalQueue.length > 1 && (
              <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--prl-gray)', textAlign: 'right' }}>
                +{modalQueue.length - 1} {pluralPL(modalQueue.length - 1, 'kolejny komunikat', 'kolejne komunikaty', 'kolejnych komunikatów')} w kolejce...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sejm Commission Modal */}
      {state.commissionActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          fontFamily: 'monospace'
        }}>
          <div style={{
            width: '480px',
            backgroundColor: '#150000',
            border: '3px solid #ff3333',
            borderRadius: '10px',
            padding: '25px',
            boxShadow: '0 0 35px rgba(255, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            color: '#ff6666'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #ff3333', paddingBottom: '10px' }}>
              <strong style={{ fontSize: '1.3em', color: '#ff3333', textShadow: '0 0 5px #ff3333' }}>🚨 SEJMOWA KOMISJA ŚLEDCZA (NA ŻYWO)</strong>
            </div>

            <div style={{ backgroundColor: '#000000', border: '1px solid #440000', padding: '10px', borderRadius: '6px', fontSize: '0.9em', color: '#ffcc00' }}>
              <span style={{ color: '#ff3333', fontWeight: 'bold' }}>[TVP INFO]</span> Przesłuchanie znanego biznesmena w sprawie afery lobbingowej w Sejmie...
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#0a0000', padding: '12px', borderRadius: '6px', border: '1px dashed #440000' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                  <span>AGRESJA ŚLEDCZYCH:</span>
                  <strong>{state.commissionAggression}%</strong>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#220000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ff3333' }}>
                  <div style={{ width: `${state.commissionAggression}%`, height: '100%', backgroundColor: '#ff3333', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '4px' }}>
                  <span>DOWODY WINY:</span>
                  <strong>{state.commissionEvidence}%</strong>
                </div>
                <div style={{ width: '100%', height: '12px', backgroundColor: '#220000', borderRadius: '4px', overflow: 'hidden', border: '1px solid #ffaa00' }}>
                  <div style={{ width: `${state.commissionEvidence}%`, height: '100%', backgroundColor: '#ffaa00', transition: 'width 0.3s ease' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginTop: '4px' }}>
                <span>POSIADANE TECZKI IPN:</span>
                <strong style={{ color: '#fff' }}>{state.teczkiCount || 0} szt.</strong>
              </div>
            </div>

            {state.commissionQuestionIndex < COMMISSION_QUESTIONS.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ backgroundColor: '#220505', borderLeft: '4px solid #ff3333', padding: '12px', borderRadius: '4px', color: '#ffdddd', fontSize: '1.05em', lineHeight: '1.4' }}>
                  <strong>Pytanie {state.commissionQuestionIndex + 1}/{COMMISSION_QUESTIONS.length}:</strong><br/>
                  {COMMISSION_QUESTIONS[state.commissionQuestionIndex].question}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {COMMISSION_QUESTIONS[state.commissionQuestionIndex].options.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => answerCommissionQuestion(COMMISSION_QUESTIONS[state.commissionQuestionIndex].id, opt.id)}
                      style={{
                        textAlign: 'left',
                        padding: '10px 15px',
                        backgroundColor: '#2a0a0a',
                        border: '1px solid #ff4444',
                        borderRadius: '6px',
                        color: '#ffcccc',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: '0.9em',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4a0a0a'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2a0a0a'; e.currentTarget.style.color = '#ffcccc'; }}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>

                <button
                  onClick={useTeczkaInCommission}
                  disabled={!state.teczkiCount || state.teczkiCount <= 0}
                  style={{
                    padding: '8px',
                    backgroundColor: state.teczkiCount > 0 ? '#ffcc00' : '#444400',
                    color: state.teczkiCount > 0 ? '#000000' : '#888',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: state.teczkiCount > 0 ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    fontSize: '0.85em',
                    boxShadow: state.teczkiCount > 0 ? '0 0 5px #ffcc00' : 'none'
                  }}
                >
                  📂 SZANTAŻUJ POSŁA TECZKĄ IPN (-1 teczka, -30% agresji)
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px', color: '#ffdddd' }}>
                Podsumowanie przesłuchania...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prison Overlay */}
      {state.prisonSentenceRemaining > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#050505',
          color: '#ff3333',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10001,
          fontFamily: 'monospace',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0', textShadow: '0 0 10px #ff3333' }}>🚨 ZAKŁAD KARNY 🚨</h1>
          <div style={{ fontSize: '1.2rem', marginBottom: '20px', border: '2px solid #ff3333', padding: '15px', borderRadius: '8px', maxWidth: '500px', backgroundColor: '#1a0505' }}>
            Zostałeś skazany na karę pozbawienia wolności za nielegalny lobbing i korupcję polityczną. Twoje konta bankowe zostały zamrożone, a biznesy toczą się w tle bez Twojej kontroli.
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', margin: '20px 0' }}>
            Pozostały czas kary: <span style={{ color: '#ffffff' }}>{Math.ceil(state.prisonSentenceRemaining)} s</span>
          </div>
          <div style={{ fontSize: '0.9rem', color: '#666' }}>
            Zarabiasz pasywnie, ale nie możesz klikać ani budować niczego do czasu wyjścia.
          </div>
        </div>
      )}
    </div>
    </GameApiContext.Provider>
  );
}

export default App;
