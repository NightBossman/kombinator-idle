// [Claude] NOWY PLIK (KIERUNEK.md pkt 1.1): silnik gry wydzielony z App.tsx.
// tick() to CZYSTA funkcja: bierze stan + deltaSec, zwraca nowy stan i listę zdarzeń
// (dźwięki, alerty, toasty, postęp C64). Silnik nie dotyka Reacta, DOM-u ani timerów -
// dzięki temu da się go testować (patrz engine.test.ts) i znika problem podwójnych
// komunikatów w trybie deweloperskim (StrictMode wywołuje updatery dwukrotnie).
//
// Logika przeniesiona 1:1 z pętli gry w App.tsx - celowo BEZ zmian w mechanice,
// żeby refaktoryzacja była bezpieczna. Porządkowanie wnętrza to następny krok.

import type { GameState } from '../hooks/useGameState';
import { generateBlackMarketOffers } from '../hooks/useGameState';
import { fmtNum } from '../utils/format';
// [Claude] KIERUNEK 1.3: wspolne wzory mnoznikow - jedno zrodlo prawdy dla silnika,
// symulacji offline (useGameState) i paneli UI (Casio, Bazar)
import { helperSpeedMult, businessProductionMult, cinkciarzRate, queueTimeMs, chfInstallmentPerSec, vatCarouselRefundPerSec, vatCarouselRiskGainPerSec, mordorIncomePerSec, mordorMoraleDecayPerSec, mordorEmployeeUpkeepPerSec, jdgRiskGainPerSec, cryptoMiningYield, cryptoPowerUpkeepPln, aiTrainSpeed, knfRiskGrowthRate, wiborInstallmentPerSec, polishDealTaxPerSec, usRiskGrowthRate, energyPowerUpkeepPln, grossPassiveIncomePlnPerSec, coiBondYieldPerSec, edoBondYieldPerSec, aiSaaSProfitUsdPerSec, aiSaaSProfitEurPerSec, nbpInterestRateAffectingWibor } from './formulas';
import {
  QUEUE_ITEMS, HELPERS, BUSINESSES, HISTORY_EVENTS, ACHIEVEMENTS, LUXURY_ITEMS,
  GPW_STOCKS, GPW_EVENTS, NOMENKLATURA_COMPANIES, OFFSHORE_DEPOSITS, COCOM_ITEMS,
  EXPORT_CONTACTS, GEOPOLITICAL_EVENTS, ELECTION_REGIONS, CAMPAIGN_MATERIALS,
  CAMPAIGN_LEADERS, COCOM_SMUGGLING_ROUTES, COCOM_VEHICLES, COCOM_PERSONNEL,
  BAZAR_ITEMS, NFI_COMPANIES, MAFIA_PROTECTIONS, WARSAW_DISTRICTS, GANGSTER_UNITS,
  BLACK_MARKET_WEAPONS, BAZAR_LOGISTICS_ROUTES, MEDIA_STATIONS, MEDIA_PROGRAMS,
  MEDIA_ANTENNA_REGIONS, EU_PROJECTS, LOBBY_BILLS
} from './items';

// Przeniesione z App.tsx - używane przez silnik i przez UI (zakładka luksusów, przemyt)
export const calculateLuxurySuspicionReduction = (ownedLuxuryItems: Record<string, boolean> | undefined) => {
  let reduction = 0;
  LUXURY_ITEMS.forEach(item => {
    if (ownedLuxuryItems?.[item.id]) {
      reduction += item.suspicionReduction;
    }
  });
  return Math.min(0.9, reduction);
};

export type SoundId = 'click' | 'success' | 'error' | 'alert';
export type AlertKind = 'info' | 'error' | 'success' | 'raid' | 'pap';

export type GameEvent =
  | { kind: 'sound'; sound: SoundId }
  | { kind: 'alert'; message: string; title: string; alertType: AlertKind }
  | { kind: 'toast'; title: string; desc: string }
  | { kind: 'c64Progress'; incrementPercent: number };

export interface TickContext {
  now: number;                 // Date.now() z chwili ticku (rotacja ofert czarnego rynku)
  activeQueue: string | null;  // aktywna kolejka gracza (statystyki + auto-pchacz C64)
}

export function tick(s: GameState, deltaSec: number, ctx: TickContext): { state: GameState; events: GameEvent[] } {
  const events: GameEvent[] = [];

  // Zbieracze zdarzeń o sygnaturach identycznych z pomocnikami UI w App.tsx -
  // dzięki temu przeniesiona logika (~46 wywołań) nie wymagała przepisywania.
  const showAlert = (message: string, title: string = 'KOMUNIKAT URZĘDOWY', alertType: AlertKind = 'info') => {
    events.push({ kind: 'alert', message, title, alertType });
  };
  const addToast = (title: string, desc: string) => {
    events.push({ kind: 'toast', title, desc });
  };
  const playClick = () => { events.push({ kind: 'sound', sound: 'click' }); };
  const playSuccess = () => { events.push({ kind: 'sound', sound: 'success' }); };
  const playError = () => { events.push({ kind: 'sound', sound: 'error' }); };
  const playAlert = () => { events.push({ kind: 'sound', sound: 'alert' }); };
  // Przeniesiony kod owijał komunikaty w setTimeout(..., 50), by uciec z updatera Reacta.
  // W czystym silniku timer jest zbędny - lokalny "setTimeout" wykonuje callback od razu,
  // a kolejność zdarzeń pozostaje ta sama.
  const setTimeout = (fn: () => void, delayMs?: number): void => { void delayMs; fn(); };

  const now = ctx.now;
  const activeQueue = ctx.activeQueue;

  const compute = (): GameState => {
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

        // Faza D (Port Gdynia): rotacja stanu morza
        nextState.seaStateTimer = (s.seaStateTimer || 120) - deltaSec;
        if (nextState.seaStateTimer <= 0) {
          const states: Array<'calm' | 'storm' | 'lockdown' | 'patrols' | 'sailor_day'> = ['calm', 'storm', 'lockdown', 'patrols', 'sailor_day'];
          const weights = [40, 20, 10, 20, 10]; // wagi dla stanów (spokój ma najwięcej)
          
          const totalWeight = weights.reduce((sum, w) => sum + w, 0);
          let r = Math.random() * totalWeight;
          let newIndex = 0;
          for (let i = 0; i < weights.length; i++) {
            if (r < weights[i]) {
              newIndex = i;
              break;
            }
            r -= weights[i];
          }

          nextState.seaState = states[newIndex];
          nextState.seaStateTimer = 120 + Math.floor(Math.random() * 60); // 2-3 minuty
          
          let alertDesc = '';
          if (nextState.seaState === 'calm') alertDesc = 'Morze Bałtyckie uspokoiło się. Szmugiel morski przebiega bez zakłóceń.';
          else if (nextState.seaState === 'storm') alertDesc = 'Sztorm na Bałtyku! Rejsy potrwają 50% dłużej.';
          else if (nextState.seaState === 'lockdown') alertDesc = 'WOP i SB zablokowały Port Gdynia! Ryzyko wpadki wzrosło o 40%.';
          else if (nextState.seaState === 'patrols') alertDesc = 'Wzmożone patrole Wojsk Ochrony Pogranicza. Ryzyko wyższe o 20%.';
          else if (nextState.seaState === 'sailor_day') alertDesc = 'Dzień Marynarza! Strażnicy są pijani. Czas -30%, Ryzyko -10%.';
          
          addToast("ZMIANA SYTUACJI W PORCIE", alertDesc);
        }

        // Faza F (Hiperinflacja): przyrost inflacji co sekundę (zamrożone po denominacji)
        if (s.activeDestination === 'usa' && !s.isDenominated) {
          let inflationInc = 0.2;
          if (s.partyRank === 'biuro') inflationInc = 0.3;
          else if (s.partyRank === 'minister') inflationInc = 0.14;

          if (s.activeEvent === 'uwolnienie_cen') {
            inflationInc += 0.8;
          }
          const polisaMult = s.inflationUpgrades?.['polisaAsekuracyjna'] ? 0.75 : 1.0;
          nextState.inflationPercent = (s.inflationPercent || 0) + (inflationInc * polisaMult) * deltaSec;
        } else if (!s.fazaZUnlocked) {
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

        // Faza U: Polityka 2.0 (Lobbying i Komisja Śledcza)
        if (s.prisonSentenceRemaining > 0) {
          nextState.prisonSentenceRemaining = Math.max(0, s.prisonSentenceRemaining - deltaSec);
        }

        let activeBribes = 0;
        let corruptionGain = 0;
        if (s.fazaSUnlocked) {
          LOBBY_BILLS.forEach(bill => {
            if (s.lobbyActiveBills?.[bill.id]) {
              activeBribes += bill.bribeCostPerSec;
              corruptionGain += bill.corruptionPerSec;
            }
          });
          
          if (activeBribes > 0) {
            const cost = Math.floor(activeBribes * deltaSec);
            if (nextState.pln >= cost) {
              nextState.pln -= cost;
            } else {
              nextState.lobbyActiveBills = {};
              // [Claude] stary kod sprawdzał tu settingsOpen (pauzę), ale tick() w ogóle nie jest
              // wywoływany podczas pauzy (App przerywa interwał wcześniej) - warunek był martwy
              addToast("BRAK ŚRODKÓW", "Lobbing wstrzymany - zabrakło gotówki na łapówki!");
              playError();
            }
          }
          
          if (corruptionGain > 0 && !s.commissionActive && s.prisonSentenceRemaining <= 0) {
            nextState.lobbyCorruption = Math.min(100, (s.lobbyCorruption || 0) + corruptionGain * deltaSec);
          }

          // Faza V: Karuzela VAT
          if (s.vatCarouselActive && s.prisonSentenceRemaining <= 0) {
            const gainedRefund = vatCarouselRefundPerSec(nextState) * deltaSec;
            if (gainedRefund > 0) {
              nextState.vatRefundClaimed = (s.vatRefundClaimed || 0) + gainedRefund;
              const riskGain = vatCarouselRiskGainPerSec(nextState) * deltaSec;
              nextState.vatAuditRisk = Math.min(100, (s.vatAuditRisk || 0) + riskGain);
            }
          } else {
            // Zgromadzone roszczenia wygasają jeśli karuzela stoi (by nie trzymać ich w nieskończoność)
            if (s.vatRefundClaimed > 0) {
              nextState.vatRefundClaimed = Math.max(0, s.vatRefundClaimed - (s.vatRefundClaimed * 0.01 * deltaSec));
            }
          }

          // Pasywny spadek ryzyka (zamrożone w trakcie weryfikacji)
          // [Claude] usunięto warunek !s.devFreezeVatRisk - flaga nie była nigdzie ustawiana (martwy kod)
          if (!s.vatCarouselActive && s.vatRefundStatus !== 'pending') {
            nextState.vatAuditRisk = Math.max(0, (s.vatAuditRisk || 0) - 0.3 * deltaSec);
          }

          // 2. Weryfikacja VAT-7 i kontrola skarbowa
          if (s.vatRefundStatus === 'pending') {
            nextState.vatRefundTimer = (s.vatRefundTimer || 0) - deltaSec;
            if (nextState.vatRefundTimer <= 0) {
              // Rozstrzygnięcie kontroli skarbowej
              const roll = Math.random() * 100;
              if (roll < s.vatAuditRisk) {
                // Wpadka - Kontrola wykryła karuzelę!
                nextState.vatRefundStatus = 'rejected';
                
                // Znajdź pierwszą aktywną i nie-zamrożoną spółkę i ją zamroź
                const companiesCopy = [...(s.vatCompanies || [])];
                const targetIndex = companiesCopy.findIndex(c => c.isActive && c.status === 'trading');
                let targetName = "Spółka krzak";
                if (targetIndex !== -1) {
                  companiesCopy[targetIndex] = {
                    ...companiesCopy[targetIndex],
                    status: 'inspected',
                    capital: 0 // tracimy kapitał
                  };
                  targetName = companiesCopy[targetIndex].name;
                }
                nextState.vatCompanies = companiesCopy;
                nextState.vatCarouselActive = false; // wyłącz karuzelę

                // Kara: 150% żądanej kwoty (lub 75% jeśli z doradcą)
                const penaltyMult = s.vatUpgrades?.['doradca_vat'] ? 0.75 : 1.5;
                const penalty = Math.floor(s.vatRefundPendingAmount * penaltyMult);
                nextState.pln = Math.max(0, nextState.pln - penalty);
                nextState.vatRefundPendingAmount = 0;

                setTimeout(() => {
                  playAlert();
                  showAlert(`KONTROLA SKARBOWA! Urząd Skarbowy wykrył nieprawidłowości w spółce "${targetName}". Kapitał obrotowy został zajęty, a na Twoją firmę nałożono karę w wysokości ${penalty.toLocaleString('pl-PL')} PLN.`, "🚨 URZĄD SKARBOWY", "error");
                }, 100);
              } else {
                // Sukces - Zwrot zaakceptowany
                nextState.vatRefundStatus = 'approved';
                nextState.pln += s.vatRefundPendingAmount;
                nextState.vatRefundPendingAmount = 0;
                // Spadek ryzyka o 30% po udanym zwrocie
                nextState.vatAuditRisk = Math.max(0, s.vatAuditRisk - 30);
                setTimeout(() => {
                  playSuccess();
                  addToast("VAT ZWRÓCONY", `Zatwierdzono deklarację VAT-7. Otrzymałeś ${s.vatRefundPendingAmount.toLocaleString('pl-PL')} PLN zwrotu!`);
                }, 100);
              }
            }
          }

          // 3. Pasywne odsetki na Cyprze
          if (s.offshoreCyprusBalance > 0) {
            const interest = s.offshoreCyprusBalance * (0.0005 / 60) * deltaSec;
            nextState.offshoreCyprusBalance = s.offshoreCyprusBalance + interest;
          }
        }

        // Aktywacja Komisji Śledczej
        if (nextState.lobbyCorruption >= 100 && !s.commissionActive && s.prisonSentenceRemaining <= 0) {
          nextState.commissionActive = true;
          nextState.commissionAggression = 50;
          nextState.commissionEvidence = 20;
          nextState.commissionQuestionIndex = 0;
          
          setTimeout(() => {
            playAlert();
            showAlert("Sejm powołał Nadzwyczajną Komisję Śledczą do zbadania wpływów lobbingowych w sektorze dewelopersko-finansowym! Zostajesz wezwany na przesłuchanie.", "🚨 SEJMOWA KOMISJA ŚLEDCZA", "raid");
          }, 100);
        }

        // Książeczka mieszkaniowa poparcie Solidarności
        if (s.inflationUpgrades?.['ksiazeczkaMieszkaniowa']) {
          nextState.solidarnos = Math.min(10000, (s.solidarnos || 0) + 0.05 * deltaSec);
        }
        
        // Event unlocking logic based on PLN >= 100 000 for 10 minutes (600 seconds)
        if (!s.eventsUnlocked) {
          if (s.pln >= 100000) {
            const nextTime = (s.timeWithHighPlnSec || 0) + deltaSec;
            nextState.timeWithHighPlnSec = nextTime;
            if (nextTime >= 600) {
              nextState.eventsUnlocked = true;
              showAlert(
                "Obywatelu! Twój dynamiczny wzrost kapitału (osiągnięcie 100 000 zł) przyciągnął uwagę opinii publicznej i władz.\n\nOd teraz w kraju będą dziać się nieprzewidywalne zdarzenia historyczne (reformy, podwyżki cen, kryzysy), które bezpośrednio wpłyną na Twoje interesy!",
                "⚡ NIEOCZEKIWANE ZDARZENIA",
                "success"
              );
              playAlert();
            }
          } else {
            nextState.timeWithHighPlnSec = 0;
          }
        }

        // Faza C: Zdarzenia historyczne
        let activeEvent = s.activeEvent;
        let eventTimeLeft = s.eventTimeLeft;
        let nextEventIn = s.nextEventIn;

        if (nextState.eventsUnlocked) {
          if (activeEvent) {
            eventTimeLeft -= deltaSec;
            if (eventTimeLeft <= 0) {
              activeEvent = null;
              eventTimeLeft = 0;
            }
          } else {
            nextEventIn -= deltaSec;
            if (nextEventIn <= 0) {
              const availableEvents = HISTORY_EVENTS.filter(e => !e.era || (e.era === 'lata2000' && s.fazaSUnlocked) || (e.era === 'lata2010' && s.fazaWUnlocked));
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
              } else if (randomEvent.id === 'greek_haircut') {
                const updatedBonds = (nextState.euroBonds || []).map(bond => {
                  if (bond.id === 'bond_greece') {
                    return { ...bond, nominalAmountEur: Math.floor(bond.nominalAmountEur * 0.5) };
                  }
                  return bond;
                });
                nextState.euroBonds = updatedBonds;
              } else if (randomEvent.id === 'euro_cup_2012') {
                nextState.pln += 50000;
                nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + 50000;
                nextState.mordorMorale = Math.min(100, (nextState.mordorMorale || 100) + 30);
              }
              
              setTimeout(() => {
                playAlert();
                const rewardNotice = randomEvent.id === 'samochod' 
                  ? `\n\n[DARMOWY WÓZ]: Do Twojego garażu trafia nowiutki polski pojazd!`
                  : randomEvent.id === 'papiez'
                  ? `\n\n[DAR]: Otrzymujesz +500 zł i tracisz 20% podejrzeń!`
                  : randomEvent.id === 'greek_haircut'
                  ? `\n\n[HAIRCUT]: Wartość nominalna Twoich greckich obligacji zostaje ścięta o 50%!`
                  : randomEvent.id === 'euro_cup_2012'
                  ? `\n\n[FESTIWAL]: Otrzymujesz +50 000 PLN, a morale pracowników w Mordorze rośnie o 30%!`
                  : ``;
                showAlert(`--- ${randomEvent.name} ---\n\n${randomEvent.desc}${rewardNotice}`, 'TELEGRAM PAP (Wiadomości)', 'pap');
              }, 50);
            }
          }
        }

        nextState.activeEvent = activeEvent;
        nextState.eventTimeLeft = Math.max(0, Math.floor(eventTimeLeft));
        nextState.nextEventIn = Math.max(0, Math.floor(nextEventIn));

        // [Claude] naprawa (Faza T): recessionTimer był ustawiany na 180 przy zdarzeniu 'lehman_recession',
        // ale NIGDZIE nie był odliczany, a recessionActive nigdy nie wracało na false - raz uruchomiona
        // recesja trwałaby wiecznie (wieczny krach GPW i zamrożony rynek nieruchomości).
        if (s.recessionActive) {
          nextState.recessionTimer = Math.max(0, (s.recessionTimer || 0) - deltaSec);
          if (nextState.recessionTimer <= 0) {
            nextState.recessionActive = false;
            setTimeout(() => {
              playSuccess();
              showAlert('Rynki finansowe odbijają po krachu. Recesja dobiegła końca - GPW i rynek nieruchomości wracają do normy. Czas sprzedać wykończone budowy od syndyka!', '📈 KONIEC RECESJI', 'success');
            }, 50);
          }
        }

        // [Claude] naprawa (Faza T): opcje walutowe dawało się kupić, ale ich timeLeft nigdy nie malał
        // i nie istniało żadne rozliczenie - gracz płacił premię i nic z tego nie miał. Rozliczenie
        // według opisów z CURRENCY_OPTION_PRESETS: PUT (strike 3.50) i CALL (strike 3.00) wypłacają
        // różnicę kursu ponad strike razy wolumen ("zarabiasz, gdy frank drożeje"); opcja toksyczna
        // daje niewielki zysk przy franku poniżej 4.20, a powyżej - podwójną karę od nadwyżki.
        if ((s.currencyOptions || []).length > 0) {
          const stillRunning: typeof s.currencyOptions = [];
          (s.currencyOptions || []).forEach(opt => {
            const tLeft = opt.timeLeft - deltaSec;
            if (tLeft > 0) {
              stillRunning.push({ ...opt, timeLeft: tLeft });
              return;
            }
            const rate = nextState.chfExchangeRate;
            let payout: number;
            if (opt.type === 'toxic') {
              payout = rate <= opt.strikeRate
                ? (opt.strikeRate - rate) * opt.amountChf * 0.05
                : -2 * (rate - opt.strikeRate) * opt.amountChf;
            } else if (opt.type === 'put') {
              payout = Math.max(0, opt.strikeRate - rate) * opt.amountChf;
            } else {
              payout = Math.max(0, rate - opt.strikeRate) * opt.amountChf;
            }
            payout = Math.floor(payout);
            if (payout >= 0) {
              nextState.pln += payout;
              nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + payout;
            } else {
              nextState.pln = Math.max(0, nextState.pln + payout);
            }
            setTimeout(() => {
              if (payout > 0) {
                playSuccess();
                addToast('OPCJA ROZLICZONA', `Kontrakt ${opt.type.toUpperCase()} wygasł przy kursie ${fmtNum(rate, 2)} PLN/CHF. Zysk: +${payout.toLocaleString('pl-PL')} PLN.`);
              } else if (payout === 0) {
                addToast('OPCJA WYGASŁA', `Kontrakt ${opt.type.toUpperCase()} wygasł bez wartości (kurs ${fmtNum(rate, 2)} PLN/CHF).`);
              } else {
                playError();
                showAlert(`Toksyczna opcja walutowa wygasła przy kursie ${fmtNum(rate, 2)} PLN/CHF - powyżej kursu wykonania ${fmtNum(opt.strikeRate, 2)}! Bank potrąca ${Math.abs(payout).toLocaleString('pl-PL')} PLN kary.`, '🚨 ROZLICZENIE OPCJI TOKSYCZNEJ', 'error');
              }
            }, 50);
          });
          nextState.currencyOptions = stillRunning;
        }

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

        // [Claude] KIERUNEK 1.3: tempo pomocnikow ze wspolnego wzoru (formulas.ts);
        // zZdarzeniami: true dolicza Ustawe Wilczka, jak dotychczas w petli online
        const helperMult = helperSpeedMult(s, { zZdarzeniami: true });
                          
        // Helpers processing
        HELPERS.forEach(h => {
          const count = s.helpers[h.id] || 0;
          if (count > 0) {
            const level = s.helperUpgrades?.[h.id] || 0;
            const upgradeMult = 1 + level * 0.5;
            const amount = count * h.ratePerTick * deltaSec * helperMult * upgradeMult;
            if (h.id === 'cinkciarz') {
              // [Claude] KIERUNEK 1.3: kurs ze wspolnego wzoru; inflacja z biezacego ticku
              const currentRate = cinkciarzRate(s, nextState.inflationPercent);
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
            // [Claude] KIERUNEK 1.3: tempo biznesow ze wspolnego wzoru (formulas.ts)
            const amount = count * b.ratePerTick * deltaSec * businessProductionMult(s, b.generateType, { zZdarzeniami: true });
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

          const remainingTransfers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[] = [];
          let swiftPlnEarned = 0;
          let swiftUsdEarned = 0;

          (s.activeWireTransfers || []).forEach(transfer => {
            const newTime = transfer.timeLeft - deltaSec;
            if (newTime <= 0) {
              if (transfer.currency === 'pln') swiftPlnEarned += transfer.amount;
              else swiftUsdEarned += transfer.amount;
              
              setTimeout(() => {
                playSuccess();
                addToast("PRZELEW SWIFT", `Zaksięgowano przelew na kwotę: ${transfer.currency === 'pln' ? `${transfer.amount.toLocaleString('pl-PL')} zł` : `$${transfer.amount} USD`}.`);
              }, 50);
            } else {
              remainingTransfers.push({ ...transfer, timeLeft: newTime });
            }
          });
          nextState.activeWireTransfers = remainingTransfers;
          nextState.swissBalancePln = (s.swissBalancePln || 0) + swiftPlnEarned;
          nextState.swissBalanceUsd = (s.swissBalanceUsd || 0) + swiftUsdEarned;

          const remainingCouriers: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number }[] = [];
          let courierPlnEarned = 0;
          let courierUsdEarned = 0;

          (s.activeCouriers || []).forEach(courier => {
            const newTime = courier.timeLeft - deltaSec;
            if (newTime <= 0) {
              const fail = Math.random() < 0.10;
              if (fail) {
                setTimeout(() => {
                  playError();
                  showAlert(`Twój kurier został zatrzymany na granicy! Służby celne skonfiskowały całą gotówkę (${courier.currency === 'pln' ? `${courier.amount.toLocaleString('pl-PL')} zł` : `$${courier.amount} USD`}) i wszczęły dochodzenie.`, '🚨 KURIER ZATRZYMANY', 'error');
                }, 50);
                nextState.suspicion = Math.min(100, (s.suspicion || 0) + 30);
              } else {
                if (courier.currency === 'pln') courierPlnEarned += courier.amount;
                else courierUsdEarned += courier.amount;
                
                setTimeout(() => {
                  playSuccess();
                  addToast("KURIER OMINĄŁ CŁO", `Kurier pomyślnie dostarczył gotówkę do banku: ${courier.currency === 'pln' ? `${courier.amount.toLocaleString('pl-PL')} zł` : `$${courier.amount} USD`}.`);
                }, 50);
              }
            } else {
              remainingCouriers.push({ ...courier, timeLeft: newTime });
            }
          });
          nextState.activeCouriers = remainingCouriers;
          nextState.swissBalancePln += courierPlnEarned;
          nextState.swissBalanceUsd += courierUsdEarned;

          const remainingDeposits: { id: string; amount: number; currency: 'pln' | 'dollars'; timeLeft: number; depositTypeId: string }[] = [];
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
                showAlert(`Zakończył się okres lokaty "${depType?.name || 'Lokata'}". Środki wraz z odsetkami (${dep.currency === 'pln' ? `${finalAmount.toLocaleString('pl-PL')} zł` : `$${finalAmount} USD`}) wróciły na Twoje konto szwajcarskie.`, '💰 LOKATA ZAKOŃCZONA', 'success');
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
                addToast("SYNDYKAT: TRANSAKCJA", `Dostarczono ${item.name} za ${earned.toLocaleString('pl-PL')} zł!`);
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
                addToast("GLOBALNY PRZEMYT", `Sukces na trasie ${route.name}! Zysk: ${earned.toLocaleString('pl-PL')} zł (odjęto pensję kuriera).`);
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
            
            const baseRate = region.baseSupportRate;
            
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
                  addToast('WIEC ZAKOŃCZONY', `${leader.name} zdobył ${boost.toLocaleString('pl-PL')} głosów w ${region.name}!`);
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
                    showAlert(`Funkcjonariusze SB zrywają plakaty w ${regionName}! Strata: ${loss.toLocaleString('pl-PL')} głosów.`, '🚨 PROWOKACJA SB', 'raid');
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
                   showAlert(`Ludzie "Pershinga" pobrali haracz! Utracono ${extorted.toLocaleString('pl-PL')} zł!`, '🔫 MAFIA', 'raid');
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
              const revenuePerSec = stationRating * 8 * totalIncomeMult;
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
            const fluctuation = 1 + (Math.random() * 0.10 - 0.05); // +/- 5%
            let newRate = nextState.chfExchangeRate * fluctuation;
            // Zapobieganie ucieczce kursu w skrajności
            if (newRate < 2.0) newRate += 0.1;
            if (newRate > 4.8) newRate -= 0.1;
            // Jeśli dot-com rośnie, rynek sprzyja aprecjacji, ale frank i tak jest nieobliczalny
            nextState.chfExchangeRate = Math.max(1.8, Math.min(5.5, newRate));
          }

          // 2. Raty kredytów we frankach (CHF)
          if (nextState.chfDebt > 0) {
            const installmentChf = chfInstallmentPerSec(nextState);
            const plnCost = Math.floor(installmentChf * nextState.chfExchangeRate * deltaSec);
            if (nextState.pln >= plnCost) {
              nextState.pln -= plnCost;
              nextState.chfDebt = Math.max(0, nextState.chfDebt - (installmentChf * deltaSec * 0.8)); // 80% to kapitał
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
                  showAlert(`Zakończono rozliczanie wniosku unijnego: ${euDef.name}! Unia zwróciła Ci ${refund.toLocaleString('pl-PL')} PLN.`, '🇪🇺 DOTACJA WYPŁACONA', 'success');
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
               showAlert(`Kontrola z OLAF i Urzędu Skarbowego wykazała nieprawidłowości w Twoich dotacjach unijnych! Skonfiskowano ${penalty.toLocaleString('pl-PL')} PLN tytułem zwrotu i kar.`, '🚨 KONTROLA UNIJNA', 'raid');
             }, 50);
          }
          
          // 7. Deweloperka (czas budowy)
          if (nextState.realEstateUnderConstruction && nextState.realEstateUnderConstruction.length > 0) {
            const stillBuilding: typeof nextState.realEstateUnderConstruction = [];
            
            for (const build of nextState.realEstateUnderConstruction) {
              build.timeLeft -= deltaSec;
              
              if (build.timeLeft <= 0) {
                // Budowa ukończona!
                nextState.realEstateOwned[build.id] = (nextState.realEstateOwned[build.id] || 0) + 1;
                
                // Alert/Toast
                playSuccess();
                addToast('BUDOWA UKOŃCZONA', `Inwestycja oddana do użytku.`);
                
                // WYZWALACZ RECESJI 2008
                if (build.id === 'mikro_wola' && !nextState.recessionTriggered) {
                  nextState.recessionTriggered = true;
                  nextState.recessionActive = true;
                  nextState.recessionTimer = 180; // 3 minuty recesji
                  nextState.chfExchangeRate = Math.min(7.20, nextState.chfExchangeRate + 0.50);
                  playAlert();
                  showAlert(
                    'Pęknięcie bańki na amerykańskim rynku subprime rozlało się na cały świat. Globalny Krach finansowy dotarł do nas! GPW tonie, banki upadają, a toksyczne opcje walutowe grożą bankructwem przedsiębiorstw. Masz 3 minuty na przetrwanie najgorszego!',
                    'WIELKA RECESJA 2008!',
                    'raid'
                  );
                }
              } else {
                stillBuilding.push(build);
              }
            }
            
            nextState.realEstateUnderConstruction = stillBuilding;
          }
        }

        // ===== Faza W: Mordor na Domaniewskiej (Lata 2010.) - tick =====
        if (s.fazaWUnlocked) {
          // 1. Przychód z Mordoru (EUR)
          const mordorIncome = mordorIncomePerSec(nextState) * deltaSec;
          if (mordorIncome > 0) {
            nextState.euros = (nextState.euros || 0) + mordorIncome;
            nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + Math.floor(mordorIncome * nextState.euroExchangeRate);
          }

          // 2. Koszt utrzymania (ZUS/JDG/Płace w PLN)
          const mordorUpkeep = mordorEmployeeUpkeepPerSec(nextState) * deltaSec;
          if (mordorUpkeep > 0) {
            nextState.pln = Math.max(0, nextState.pln - mordorUpkeep);
          }

          // 3. Spadek morale pracowników Mordoru
          const decay = mordorMoraleDecayPerSec(nextState) * deltaSec;
          if (decay > 0) {
            nextState.mordorMorale = Math.max(0, nextState.mordorMorale - decay);
            
            // Jeśli morale spada poniżej 20, pracownicy odchodzą (1 na 30s)
            if (nextState.mordorMorale < 20 && nextState.mordorEmployees > 0) {
              if (Math.random() < 0.033 * deltaSec) {
                nextState.mordorEmployees = Math.max(0, nextState.mordorEmployees - 1);
                setTimeout(() => {
                  playError();
                  addToast('KORPO-REZYGNACJA', 'Pracownik odszedł z Mordoru z powodu tragicznego morale.');
                }, 50);
              }
            }
          }

          // 4. Ryzyko kontroli PIP z kontraktów B2B (JDG)
          const riskGain = jdgRiskGainPerSec(nextState) * deltaSec;
          if (riskGain > 0) {
            nextState.jdgRiskLevel = Math.min(100, (nextState.jdgRiskLevel || 0) + riskGain);
            
            // Kontrola PIP
            if (nextState.jdgRiskLevel >= 100) {
              nextState.jdgRiskLevel = 40; // reset do 40
              const taxLevel = s.jdgTaxOptimizationLevel || 0;
              const penaltyPln = nextState.jdgContracts * 15000 * (taxLevel + 1);
              nextState.pln = Math.max(0, nextState.pln - penaltyPln);
              setTimeout(() => {
                playAlert();
                showAlert(`KONTROLA PIP! Państwowa Inspekcja Pracy wykryła fikcyjne samozatrudnienie (syndrom B2B) w Twoich strukturach. Nałożono karę w wysokości ${penaltyPln.toLocaleString('pl-PL')} PLN.`, '🚨 INSPEKCJA PIP', 'error');
              }, 50);
            }
          }

          // 5. Wahania kursu EUR/PLN (wahania od 3.8 do 4.6)
          const prev10sEuroTick = Math.floor((s.stats.totalTimePlayed || 0) / 10);
          const current10sEuroTick = Math.floor(nextState.stats.totalTimePlayed / 10);
          if (current10sEuroTick > prev10sEuroTick) {
            const fluctuation = 1 + (Math.random() * 0.06 - 0.03); // +/- 3%
            let newRate = nextState.euroExchangeRate * fluctuation;
            if (newRate < 3.8) newRate = 3.8 + Math.random() * 0.1;
            if (newRate > 4.6) newRate = 4.6 - Math.random() * 0.1;
            nextState.euroExchangeRate = Math.max(3.6, Math.min(4.8, newRate));
          }

          // 6. Odliczanie obligacji skarbowych strefy euro
          if ((nextState.euroBonds || []).length > 0) {
            const remainingBonds: typeof nextState.euroBonds = [];
            nextState.euroBonds.forEach(bond => {
              const newTime = bond.timeLeft - deltaSec;
              if (newTime <= 0) {
                // Rozliczenie obligacji!
                const isCrash = Math.random() * 100 < bond.riskOfCrash;
                if (isCrash) {
                  // Krach - tracimy wszystko
                  setTimeout(() => {
                    playError();
                    showAlert(`BANKRUCTWO KRAJU! Państwo ${bond.country} ogłosiło niewypłacalność. Twoje obligacje o wartości nominalnej ${bond.nominalAmountEur.toLocaleString('pl-PL')} EUR są bezwartościowe.`, '📉 KRACH OBLIGACJI', 'error');
                  }, 50);
                } else {
                  // Wypłata zysku nominalnego + odsetki
                  const revenue = Math.floor(bond.nominalAmountEur * (1 + bond.interestRate));
                  nextState.euros = (nextState.euros || 0) + revenue;
                  nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + Math.floor(revenue * nextState.euroExchangeRate);
                  setTimeout(() => {
                    playSuccess();
                    addToast('OBLIGACJE ROZLICZONE', `Wypłacono nominalną wartość obligacji ${bond.country}. Zysk: +${revenue.toLocaleString('pl-PL')} EUR.`);
                  }, 50);
                }
              } else {
                remainingBonds.push({ ...bond, timeLeft: newTime });
              }
            });
            nextState.euroBonds = remainingBonds;
          }
        }

        // Faza X: Startupy, AI i Kopalnia Krypto (Lata 2020.)
        if (s.fazaXUnlocked) {
          // 1. Pasywne wydobycie BTC
          const btcMined = cryptoMiningYield(nextState) * deltaSec;
          if (btcMined > 0) {
            nextState.bitcoins = (nextState.bitcoins || 0) + btcMined;
          }

          // 2. Pasywny koszt prądu (PLN/s) - tylko jeśli Faza Y nie jest aktywna
          if (!nextState.fazaYUnlocked) {
            const powerCost = cryptoPowerUpkeepPln(nextState) * deltaSec;
            if (powerCost > 0) {
              nextState.pln = Math.max(0, nextState.pln - powerCost);
            }
          }

          // 3. Pasywne płace Prompt Engineerów (PLN/s)
          const engineersWage = (nextState.aiPromptEngineers || 0) * 150 * deltaSec;
          if (engineersWage > 0) {
            nextState.pln = Math.max(0, nextState.pln - engineersWage);
          }

          // 4. Wytrenowanie modeli AI (w tle)
          if (nextState.isTrainingAi) {
            const speed = aiTrainSpeed(nextState) * deltaSec;
            nextState.aiTrainProgress = (nextState.aiTrainProgress || 0) + speed;
            if (nextState.aiTrainProgress >= 100) {
              nextState.aiTrainProgress = 0;
              nextState.isTrainingAi = false;
              nextState.aiModelsTrained = (nextState.aiModelsTrained || 0) + 1;
              setTimeout(() => {
                playSuccess();
                addToast("MODEL AI WYTRENOWANY", `Wytrenowano model AI nr ${nextState.aiModelsTrained}! Możesz teraz wygenerować Pitch Deck.`);
              }, 50);
            }
          }

          // 5. Pasywny przyrost ryzyka KNF i fluktuacje tokena KMB
          const knfRisk = knfRiskGrowthRate(nextState) * deltaSec;
          if (knfRisk > 0) {
            nextState.knfRiskLevel = Math.min(100, (nextState.knfRiskLevel || 0) + knfRisk);
            
            // Nalot KNF przy 100% ryzyka
            if (nextState.knfRiskLevel >= 100) {
              nextState.knfRiskLevel = 30; // reset do 30%
              const penalty = Math.max(500000, Math.floor(nextState.pln * 0.30));
              nextState.pln = Math.max(0, nextState.pln - penalty);
              nextState.kmbTokensOwned = 0; // KNF zamraża/konfiskuje tokeny!
              nextState.kmbTokenPricePln = 0.1; // krach tokena
              setTimeout(() => {
                playAlert();
                showAlert(`KONTROLA KNF! Komisja Nadzoru Finansowego wykryła manipulacje rynkowe i schemat "pump and dump" na KombinatorCoin (KMB). Nałożono karę ${penalty.toLocaleString('pl-PL')} PLN oraz skonfiskowano wszystkie posiadane tokeny.`, '🚨 INTERWENCJA KNF', 'error');
              }, 50);
            }
          }

          // Pasywne wahania kursu KombinatorCoin (KMB)
          const prev10sKmbTick = Math.floor((s.stats.totalTimePlayed || 0) / 10);
          const current10sKmbTick = Math.floor(nextState.stats.totalTimePlayed / 10);
          if (current10sKmbTick > prev10sKmbTick) {
            const decay = 0.95 + Math.random() * 0.08; // naturalny decay/szum
            nextState.kmbTokenPricePln = Math.max(0.01, nextState.kmbTokenPricePln * decay);
          }

          // 6. Wahania kursu Bitcoina (losowe skoki o ±4 co 10 sekund)
          const prev10sBtcTick = Math.floor((s.stats.totalTimePlayed || 0) / 10);
          const current10sBtcTick = Math.floor(nextState.stats.totalTimePlayed / 10);
          if (current10sBtcTick > prev10sBtcTick) {
            const btcFluctuation = 1 + (Math.random() * 0.08 - 0.04);
            let newBtcPrice = nextState.bitcoinPricePln * btcFluctuation;
            if (newBtcPrice < 40000) newBtcPrice = 40000 + Math.random() * 5000;
            if (newBtcPrice > 450000) newBtcPrice = 450000 - Math.random() * 20000;
            nextState.bitcoinPricePln = Math.round(newBtcPrice);
          }
        }


        // Faza Y: Polski Ład, WIBOR i Kryzys Energetyczny (Lata 2022-2023)
        if (s.fazaYUnlocked) {
          // 1. Wakacje kredytowe i cooldown
          if (nextState.creditHolidaysTimer > 0) {
            nextState.creditHolidaysTimer = Math.max(0, nextState.creditHolidaysTimer - deltaSec);
          }
          if (nextState.creditHolidaysCooldown > 0) {
            nextState.creditHolidaysCooldown = Math.max(0, nextState.creditHolidaysCooldown - deltaSec);
          }

          // 2. Wahania WIBOR co 10 sekund
          const prev10sWiborTick = Math.floor((s.stats.totalTimePlayed || 0) / 10);
          const current10sWiborTick = Math.floor(nextState.stats.totalTimePlayed / 10);
          if (current10sWiborTick > prev10sWiborTick) {
            const fluctuation = (Math.random() * 0.8 - 0.4);
            nextState.wiborRate = Math.max(1.0, Math.min(15.0, Number((nextState.wiborRate + fluctuation).toFixed(2))));
          }

          // 3. Pasywny koszt kredytu obrotowego PLN (WIBOR)
          const wiborCost = wiborInstallmentPerSec(nextState) * deltaSec;
          if (wiborCost > 0) {
            nextState.pln = Math.max(0, nextState.pln - wiborCost);
          }

          // 4. Podatki Polskiego Ładu
          const grossIncomeRate = grossPassiveIncomePlnPerSec(nextState);
          const taxCost = polishDealTaxPerSec(nextState, grossIncomeRate) * deltaSec;
          if (taxCost > 0) {
            nextState.pln = Math.max(0, nextState.pln - taxCost);
          }

          // 5. Pasywny przyrost ryzyka kontroli skarbowej US
          const usRisk = usRiskGrowthRate(nextState, grossIncomeRate) * deltaSec;
          if (usRisk > 0) {
            nextState.usRiskLevel = Math.min(100, (nextState.usRiskLevel || 0) + usRisk);
            
            // Nalot skarbowy US przy 100%
            if (nextState.usRiskLevel >= 100) {
              nextState.usRiskLevel = 20; // reset do 20%
              const penalty = Math.max(100000, Math.floor(nextState.pln * 0.25));
              nextState.pln = Math.max(0, nextState.pln - penalty);
              setTimeout(() => {
                playAlert();
                showAlert(`KONTROLA SKARBOWA! Urząd Skarbowy zakwestionował Twoje odliczenia w Polskim Ładzie. Nałożono domiar podatkowy i karę w wysokości ${penalty.toLocaleString('pl-PL')} PLN!`, '🚨 URZĄD SKARBOWY', 'error');
              }, 50);
            }
          }

          // 6. Kryzys Energetyczny (zawsze aktywny w tej fazie) i koszt energii
          nextState.energyCrisisActive = true;
          const totalPowerCost = energyPowerUpkeepPln(nextState) * deltaSec;
          if (totalPowerCost > 0) {
            nextState.pln = Math.max(0, nextState.pln - totalPowerCost);
          }
        }

        // ===== Faza Z: KPO, AI SaaS, Obligacje COI/EDO (Lata 2024-2025) =====
        if (s.fazaZUnlocked) {
          // 1. Zyski z Obligacji detalicznych
          const coiYield = coiBondYieldPerSec(nextState) * deltaSec;
          const edoYield = edoBondYieldPerSec(nextState) * deltaSec;
          const totalBondYield = coiYield + edoYield;
          if (totalBondYield > 0) {
            nextState.pln += totalBondYield;
            nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + totalBondYield;
          }

          // 2. Zyski z AI SaaS (EUR i USD)
          if (nextState.aiSaaSActive && nextState.gpuClusters > 0) {
            const usdEarned = aiSaaSProfitUsdPerSec(nextState) * deltaSec;
            const eurEarned = aiSaaSProfitEurPerSec(nextState) * deltaSec;
            
            if (usdEarned > 0) {
              nextState.dollars = (nextState.dollars || 0) + usdEarned;
              nextState.stats.totalDollarsEarned = (nextState.stats.totalDollarsEarned || 0) + usdEarned;
            }
            if (eurEarned > 0) {
              nextState.euros = (nextState.euros || 0) + eurEarned;
              nextState.stats.totalPlnEarned = (nextState.stats.totalPlnEarned || 0) + Math.floor(eurEarned * nextState.euroExchangeRate);
            }
          }

          // 3. Posiedzenie RPP - wahania stóp procentowych
          if (nextState.rppMeetingTimer > 0) {
            nextState.rppMeetingTimer = Math.max(0, nextState.rppMeetingTimer - deltaSec);
          } else {
            // Posiedzenie RPP co 60 sekund
            nextState.rppMeetingTimer = 60;
            
            // Zmiana inflacji
            const inflationShift = (Math.random() * 2) - 1; // -1 do +1
            nextState.inflationPercent = Math.max(0, Math.min(25, (nextState.inflationPercent || 0) + inflationShift));
            
            // Decyzja RPP oparta na inflacji
            let rateChange: number;
            if (nextState.inflationPercent > nextState.nbpInterestRate + 2) {
              // Podwyżka stóp (walka z inflacją)
              rateChange = 0.25 * (Math.floor(Math.random() * 3) + 1); // 0.25, 0.50, 0.75
            } else if (nextState.inflationPercent < nextState.nbpInterestRate - 2) {
              // Obniżka stóp
              rateChange = -0.25 * (Math.floor(Math.random() * 2) + 1);
            } else {
              // Utrzymanie/nieznaczne wahania
              rateChange = Math.random() > 0.5 ? 0.25 : -0.25;
            }
            
            nextState.nbpInterestRate = Math.max(0.1, Math.min(20, nextState.nbpInterestRate + rateChange));
            
            // Aktualizacja WIBOR
            nextState.wiborRate = nbpInterestRateAffectingWibor(nextState.nbpInterestRate);
            
            setTimeout(() => {
              playAlert();
              addToast("KOMUNIKAT RPP", `Rada Polityki Pieniężnej zmieniła stopy. Stopa NBP: ${nextState.nbpInterestRate.toFixed(2)}%, WIBOR: ${nextState.wiborRate.toFixed(2)}%`);
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
        // [Claude] silnik nie dotyka stanu Reacta: zamiast setQueueProgress zwracamy zdarzenie
        // 'c64Progress', a App.tsx dolicza postęp kolejki po swojej stronie.
        if (s.pewexItems['c64'] && activeQueue) {
          const c64Item = QUEUE_ITEMS.find(i => i.id === activeQueue);
          if (c64Item) {
            // [Claude] KIERUNEK 1.3: czas kolejki ze wspolnego wzoru (formulas.ts)
            const timeToBuy = queueTimeMs(c64Item.timeToBuyMs, s);
            // Dolicza mniej więcej 50 ms postępu na sekundę (jak dotychczas)
            events.push({ kind: 'c64Progress', incrementPercent: (50 / timeToBuy) * 100 });
          }
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
          const fluctuation = 1 + (Math.random() * 0.10 - 0.05); // ±5%
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
          else if (ach.id === 'smug_moskwa') isUnlocked = (stats.totalMoscowRuns || 0) >= 10;
          
          
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
  };

  return { state: compute(), events };
}
