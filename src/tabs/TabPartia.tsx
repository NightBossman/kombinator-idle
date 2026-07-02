// [Claude] KIERUNEK 1.2: zakladka 'partia' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { HELPERS, PARTY_RANKS, SOLIDARITY_LEVELS } from '../game/items';
import { pluralPL } from '../utils/format';
import { playClick } from '../utils/audio';
import { calculateLuxuryPrestigeBonus } from '../game/formulas';
import { useGameApi } from './GameApiContext';

export const TabPartia = memo(function TabPartia() {
  const { blackmailHelperTW, bribe, bribeSBHandler, buyCounterIntel, buyInk, buyPaper, currentRankIndex, dismissHelperTW, distributePisma, formatSpeedrunTime, fundSolidarnoscDollars, fundSolidarnoscKartki, fundSolidarnoscPln, fundSolidarnoscRuble, fundSolidarnoscTalony, resetGame, runInvestigation, setSpeedrunChecked, showConfirm, speedrunChecked, startOkraglyStol, startPrinting, state, updateState } = useGameApi();
  return (
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
                      Posiadasz: {Math.floor(state.kartki)} {pluralPL(state.kartki, 'kartkę', 'kartki', 'kartek')} | {Math.floor(state.pln).toLocaleString('pl-PL')} zł
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
                          <div style={{width: `${state.printProgress}%`, height: '100%', background: 'var(--crt-text)', transition: 'width 0.2s linear'}} />
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
  );
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabPartia;
