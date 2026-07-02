// [Claude] KIERUNEK 1.2: zakladka 'przemyt' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { BALTONA_ITEMS, BUSINESSES, HELPERS, HELPER_UPGRADE_COSTS, NOMENKLATURA_COMPANIES, PEWEX_ITEMS, SEA_SMUGGLING_ROUTES, SMUGGLING_ROUTES } from '../game/items';
import { fmtNum } from '../utils/format';
import { playClick } from '../utils/audio';
import { useGameApi } from './GameApiContext';

export const TabPrzemyt = memo(function TabPrzemyt() {
  const { activeSmuggle, bribeSbChief, buyBaltonaUpgrade, buyBusiness, buyHelper, exchangeGoodsForBaltona, helperMult, hireRedDirector, przemytSubTab, recruitTwInNomenklatura, registerNomenklaturaCompany, setPrzemytSubTab, smuggleProgress, startSeaSmuggle, startSmuggle, state, updateState, upgradeHelper, upgradeLeasing } = useGameApi();
  return (
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
                                <div style={{width: `${smuggleProgress}%`, height: '100%', background: 'var(--dollar-green)', transition: 'width 0.2s linear'}} />
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
                              {/* [Claude] naprawa: parseFloat(toFixed()) dawało kropkę dziesiętną; fmtNum daje polski przecinek */}
                              {h.desc} ({fmtNum(h.ratePerTick * helperMult * upgradeMult * (1 + passiveGen), 4, true)}/sek)
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
                                <div style={{width: `${state.seaSmuggleProgress}%`, height: '100%', background: 'var(--prl-yellow)', transition: 'width 0.2s linear'}} />
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
                               {fmtNum((state.sbSuspicion || 0), 1)}%
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
                                 Załóż spółkę (Zarejestruj: {comp.costPln.toLocaleString('pl-PL')} zł)
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
                           revenueDisplay = `+${plnAmount.toLocaleString('pl-PL')} zł/s`;
                         } else if (comp.generateType === 'dollars') {
                           revenueDisplay = `+$${Math.floor(comp.baseRate * rateMult)} USD/s`;
                         } else if (comp.generateType === 'autos') {
                           revenueDisplay = `Montaż aut: poz. ${fmtNum(rateMult, 1)} (czas śr: ${Math.round(60/rateMult)}s)`;
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
                                   Kup ({nextLeasingCost.toLocaleString('pl-PL')} zł)
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
  );
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabPrzemyt;
