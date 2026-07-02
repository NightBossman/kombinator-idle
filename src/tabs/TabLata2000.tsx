// [Claude] KIERUNEK 1.2: zakladka 'lata2000' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { CRISIS_REAL_ESTATE, CURRENCY_OPTION_PRESETS, DOTCOM_UPGRADES, EU_PROJECTS, LOBBY_BILLS, REAL_ESTATE_PROJECTS, VAT_GOODS, VAT_UPGRADES } from '../game/items';
import { fmtNum } from '../utils/format';
import { playClick } from '../utils/audio';
import { useGameApi } from './GameApiContext';

export const TabLata2000 = memo(function TabLata2000() {
  const { addCompanyCapital, bribeEuAuditor, buyCrisisRealEstate, buyCurrencyOption, buyDotcomUpgrade, buyRealEstate, buyTeczkaIPN, buyVatUpgrade, claimVatRefund, finishCrisisRealEstate, hireBankAdvisor, lata2000SubTab, newCompanyGoods, newCompanyName, registerShellCompany, resolveVatAudit, restructureChfDebt, sellCrisisRealEstate, sellRealEstate, sendWorkerToZmywak, setLata2000SubTab, setNewCompanyGoods, setNewCompanyName, setVatOffshoreAmountInput, startEuProject, state, takeChfMortgage, toggleCompanyActive, toggleLobbyBill, toggleVatCarousel, transferToOffshore, vatOffshoreAmountInput, withdrawFromOffshore } = useGameApi();
  return (() => {
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
                    <strong style={{ fontSize: '1.2em', color: state.chfExchangeRate > 3.0 ? '#e74c3c' : '#2ecc71' }}>{fmtNum(state.chfExchangeRate, 2)} PLN</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Dług w CHF:</span>
                    <strong style={{ fontSize: '1.2em', color: '#e74c3c' }}>{state.chfDebt.toLocaleString('pl-PL')} CHF</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#2c3e50', padding: '10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '0.9em', color: '#bdc3c7' }}>Gotówka:</span>
                    <strong style={{ fontSize: '1.2em', color: '#2ecc71' }}>{state.pln.toLocaleString('pl-PL')} PLN</strong>
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
                <button onClick={() => { playClick(); setLata2000SubTab('polityka'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'polityka' ? '#9b59b6' : '#2c3e50', color: lata2000SubTab === 'polityka' ? '#fff' : '#bdc3c7' }}>
                  ⚖️ POLITYKA 2.0
                </button>
                <button onClick={() => { playClick(); setLata2000SubTab('raje'); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: lata2000SubTab === 'raje' ? '#1abc9c' : '#2c3e50', color: lata2000SubTab === 'raje' ? '#fff' : '#bdc3c7' }}>
                  🇨🇾 RAJE & VAT
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
                                <span style={{ fontSize: '0.85em', color: '#ecf0f1' }}>Wkład własny: <strong>{costOwn.toLocaleString('pl-PL')} PLN</strong></span>
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
                                <div style={{ fontSize: '0.75em', color: '#bdc3c7', marginTop: '3px', textAlign: 'right' }}>{fmtNum(active.timeLeft, 1)}s</div>
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
                        <strong style={{ color: '#2ecc71', fontSize: '1.2em' }}>{state.dotcomUsers.toLocaleString('pl-PL')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ color: '#bdc3c7' }}>Pojemność Serwerów:</span>
                        <strong style={{ color: '#fff' }}>{state.dotcomServerCapacity.toLocaleString('pl-PL')}</strong>
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
                                Kup ({upg.costPln.toLocaleString('pl-PL')} PLN)
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
                              <span style={{ fontSize: '0.85em', color: '#2ecc71', fontWeight: 'bold' }}>Sprzedaż: {proj.sellRevenuePln.toLocaleString('pl-PL')} PLN</span>
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#bdc3c7', margin: '8px 0' }}>{proj.desc}</div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                              <span style={{ fontSize: '0.85em', color: '#ecf0f1' }}>Posiadasz: <strong>{owned} szt.</strong></span>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => buyRealEstate(proj.id, false)} disabled={!canBuyCash} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#2ecc71', color: '#fff', border: 'none', borderRadius: '4px', cursor: canBuyCash ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                                  Kup ({proj.costPln.toLocaleString('pl-PL')} PLN)
                                </button>
                                <button onClick={() => buyRealEstate(proj.id, true)} style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }} title={`Pobierze ${neededChf.toLocaleString('pl-PL')} CHF kredytu`}>
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
                              <span style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Premia: <strong>{opt.premiumPln === 0 ? 'DARMOWA*' : `${opt.premiumPln.toLocaleString('pl-PL')} PLN`}</strong></span>
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
                              <span>{opt.type.toUpperCase()} ({opt.amountChf.toLocaleString('pl-PL')} CHF @ {fmtNum(opt.strikeRate, 2)})</span>
                              <span style={{ color: '#f1c40f', fontWeight: 'bold' }}>{fmtNum(opt.timeLeft, 1)}s</span>
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
                                    <span style={{ fontSize: '0.8em', color: '#e67e22', fontWeight: 'bold' }}>Syndyk: {proj.buyCostPln.toLocaleString('pl-PL')} PLN</span>
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
                      {Object.values(state.crisisRealEstateOwned).some(count => count > 0) && (
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
                      Wysłanych pracowników: <strong style={{ color: '#f1c40f', fontSize: '1.5em' }}>{state.zmywakWorkers.toLocaleString('pl-PL')}</strong>
                    </div>
                    <div style={{ marginBottom: '20px', fontSize: '0.9em', color: '#2ecc71' }}>
                      Pasywny przychód: <strong>+{Math.floor(state.zmywakWorkers * 5 * 0.15 * 6).toLocaleString('pl-PL')} PLN/s</strong>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                      <button onClick={() => sendWorkerToZmywak(1)} disabled={state.pln < 2000} style={{ padding: '10px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 2000 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Wyślij 1 osobę (2 000 PLN)</button>
                      <button onClick={() => sendWorkerToZmywak(100)} disabled={state.pln < 200000} style={{ padding: '10px 20px', backgroundColor: '#2980b9', color: '#fff', border: 'none', borderRadius: '4px', cursor: state.pln >= 200000 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Wyślij 100 osób (200 tys. PLN)</button>
                    </div>
                  </div>
                </div>
              )}

              {lata2000SubTab === 'polityka' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                  {/* Left Column: Lobbying Bills */}
                  <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #9b59b6', paddingBottom: '5px', color: '#9b59b6' }}>Lobbing Rządowy (Korupcja Ustawodawcza)</h3>
                    <div style={{ display: 'grid', gap: '15px' }}>
                      {LOBBY_BILLS.map(bill => {
                        const isActive = !!state.lobbyActiveBills?.[bill.id];
                        return (
                          <div key={bill.id} style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: isActive ? '2px solid #9b59b6' : '1px solid #465c71', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1, marginRight: '15px' }}>
                              <strong style={{ color: '#fff', fontSize: '1.05em' }}>{bill.name}</strong>
                              <p style={{ margin: '5px 0', fontSize: '0.85em', color: '#bdc3c7' }}>{bill.desc}</p>
                              <div style={{ fontSize: '0.8em', color: '#2ecc71', fontWeight: 'bold' }}>
                                Efekt: {bill.effectDesc}
                              </div>
                              <div style={{ fontSize: '0.8em', color: '#e74c3c', marginTop: '2px' }}>
                                Koszt: -{bill.bribeCostPerSec.toLocaleString('pl-PL')} PLN/s | Korupcja: +{bill.corruptionPerSec}%/s
                              </div>
                            </div>
                            <button
                              onClick={() => toggleLobbyBill(bill.id)}
                              style={{
                                padding: '10px 15px',
                                backgroundColor: isActive ? '#e74c3c' : '#2ecc71',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                minWidth: '100px'
                              }}
                            >
                              {isActive ? 'WYŁĄCZ' : 'AKTYWUJ'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Corruption and Archivist */}
                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Corruption Monitor */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>Monitor Śledztwa Sejmowego</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '5px' }}>
                        <span>Wskaźnik Korupcji:</span>
                        <strong style={{ color: state.lobbyCorruption >= 80 ? '#e74c3c' : '#e67e22' }}>{Math.floor(state.lobbyCorruption)}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '15px', backgroundColor: '#34495e', borderRadius: '4px', overflow: 'hidden', border: '1px solid #465c71' }}>
                        <div style={{ width: `${state.lobbyCorruption}%`, height: '100%', backgroundColor: state.lobbyCorruption >= 80 ? '#e74c3c' : '#e67e22', transition: 'width 0.3s ease' }}></div>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.75em', color: '#bdc3c7', lineHeight: '1.3' }}>
                        Ostrzeżenie: Gdy pasek korupcji osiągnie 100%, Sejm powoła Nadzwyczajną Komisję Śledczą, a gra zostanie zablokowana do czasu zakończenia przesłuchania!
                      </p>
                    </div>

                    {/* SB Archivist */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71', textAlign: 'center' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#f1c40f' }}>Archiwum MSW / IPN</h4>
                      <p style={{ margin: '0 0 15px 0', fontSize: '0.85em', color: '#bdc3c7' }}>
                        Kupuj tajne akta od emerytowanych oficerów SB, by szantażować śledczych w razie wezwania przed komisję.
                      </p>
                      <div style={{ fontSize: '1.1em', marginBottom: '15px', color: '#fff' }}>
                        Posiadane teczki IPN: <strong style={{ color: '#f1c40f', fontSize: '1.3em' }}>{state.teczkiCount || 0} szt.</strong>
                      </div>
                      <button
                        onClick={buyTeczkaIPN}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#f1c40f',
                          color: '#000',
                          border: 'none',
                          borderRadius: '4px',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        KUP TECZKĘ (50 000 USD)
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {lata2000SubTab === 'raje' && (
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', width: '100%' }}>
                  {/* Left Column: Shell Companies and Carousel */}
                  <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px' }}>
                    <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #1abc9c', paddingBottom: '5px', color: '#1abc9c' }}>Karuzela VAT & Spółki-krzaki</h3>
                    
                    {/* Control Panel */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <div>Roszczenie o zwrot VAT: <strong style={{ color: '#2ecc71', fontSize: '1.2em' }}>{Math.floor(state.vatRefundClaimed || 0).toLocaleString('pl-PL')} PLN</strong></div>
                        <div style={{ fontSize: '0.8em', color: '#bdc3c7', marginTop: '2px' }}>
                          Status deklaracji: {state.vatRefundStatus === 'none' ? 'Brak deklaracji' :
                                             state.vatRefundStatus === 'pending' ? `Weryfikacja w toku (${Math.ceil(state.vatRefundTimer || 0)}s)` :
                                             state.vatRefundStatus === 'approved' ? 'Zwrócono pomyślnie' : 'Odrzucono (Kontrola)'}
                          {state.vatRefundStatus === 'pending' && ` (${Math.floor(state.vatRefundPendingAmount).toLocaleString('pl-PL')} PLN)`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={toggleVatCarousel}
                          style={{
                            padding: '10px 15px',
                            backgroundColor: state.vatCarouselActive ? '#e74c3c' : '#2ecc71',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                        >
                          {state.vatCarouselActive ? '🛑 STOP KARUZELA' : '🔄 START KARUZELA'}
                        </button>
                        <button
                          onClick={claimVatRefund}
                          disabled={state.vatRefundClaimed <= 0 || state.vatRefundStatus === 'pending'}
                          style={{
                            padding: '10px 15px',
                            backgroundColor: '#3498db',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: (state.vatRefundClaimed > 0 && state.vatRefundStatus !== 'pending') ? 'pointer' : 'not-allowed',
                            fontWeight: 'bold',
                            opacity: (state.vatRefundClaimed > 0 && state.vatRefundStatus !== 'pending') ? 1.0 : 0.5
                          }}
                        >
                          📩 ZŁÓŻ VAT-7
                        </button>
                      </div>
                    </div>

                    {/* Companies List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#ecf0f1' }}>Rejestr Spółek ({ (state.vatCompanies || []).length }/5)</h4>
                      
                      {(state.vatCompanies || []).map(comp => {
                        const goods = VAT_GOODS.find(g => g.type === comp.goodsType);
                        return (
                          <div key={comp.id} style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <strong style={{ fontSize: '1.1em', color: '#fff' }}>{comp.name}</strong>
                                <span style={{ marginLeft: '10px', fontSize: '0.8em', backgroundColor: '#34495e', padding: '2px 6px', borderRadius: '4px', color: '#1abc9c' }}>
                                  {goods?.name} (VAT {goods ? goods.vatRate * 100 : 22}%)
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.85em', color: comp.status === 'inspected' ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>
                                  {comp.status === 'inspected' ? '⚠️ KONTROLA' :
                                   comp.status === 'trading' ? '🔄 W OBROCIE' : '⏳ BEZCZYNNY'}
                                </span>
                                <input
                                  type="checkbox"
                                  checked={comp.isActive}
                                  onChange={() => toggleCompanyActive(comp.id)}
                                  disabled={comp.status === 'inspected'}
                                  style={{ transform: 'scale(1.2)', cursor: 'pointer' }}
                                />
                              </div>
                            </div>

                            <p style={{ fontSize: '0.8em', color: '#bdc3c7', margin: '5px 0' }}>{goods?.desc}</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', backgroundColor: '#34495e', padding: '10px', borderRadius: '4px' }}>
                              <div>Kapitał obrotowy: <strong style={{ color: '#fff' }}>{comp.capital.toLocaleString('pl-PL')} PLN</strong></div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button onClick={() => addCompanyCapital(comp.id, 50000)} disabled={comp.status === 'inspected' || state.pln < 50000} style={{ padding: '4px 8px', fontSize: '0.75em', cursor: 'pointer', fontWeight: 'bold' }}>+50k PLN</button>
                                <button onClick={() => addCompanyCapital(comp.id, 100000)} disabled={comp.status === 'inspected' || state.pln < 100000} style={{ padding: '4px 8px', fontSize: '0.75em', cursor: 'pointer', fontWeight: 'bold' }}>+100k PLN</button>
                              </div>
                            </div>

                            {comp.status === 'inspected' && (
                              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e74c3c', paddingTop: '10px' }}>
                                <span style={{ fontSize: '0.8em', color: '#e74c3c' }}>Zablokowane przez US! Opłać adwokata lub daj łapówkę.</span>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                  <button onClick={() => resolveVatAudit(comp.id, 'bribe')} disabled={state.pln < 60000} style={{ padding: '4px 8px', fontSize: '0.75em', backgroundColor: '#e67e22', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Łapówka (60k PLN)</button>
                                  {state.vatUpgrades?.['doradca_vat'] && (
                                    <button onClick={() => resolveVatAudit(comp.id, 'lawyer')} disabled={state.pln < 25000} style={{ padding: '4px 8px', fontSize: '0.75em', backgroundColor: '#3498db', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>Adwokat (25k PLN)</button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Register Form */}
                      {(state.vatCompanies || []).length < 5 && (
                        <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px dashed #1abc9c', marginTop: '10px' }}>
                          <h5 style={{ margin: '0 0 10px 0', color: '#1abc9c' }}>Zarejestruj nową spółkę z o.o. (Koszt: 100 000 PLN)</h5>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                            <input
                              type="text"
                              placeholder="Nazwa spółki (np. Stal-Trans Sp. z o.o.)"
                              value={newCompanyName}
                              onChange={(e) => setNewCompanyName(e.target.value)}
                              style={{ flex: 2, padding: '8px', borderRadius: '4px', border: '1px solid #7f8c8d', backgroundColor: '#34495e', color: '#fff' }}
                            />
                            <select
                              value={newCompanyGoods}
                              onChange={(e) => setNewCompanyGoods(e.target.value as 'electronics' | 'steel' | 'fuel')}
                              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #7f8c8d', backgroundColor: '#34495e', color: '#fff' }}
                            >
                              <option value="steel">Stal zbrojeniowa</option>
                              <option value="electronics">Elektronika</option>
                              <option value="fuel">Paliwa płynne</option>
                            </select>
                          </div>
                          <button
                            onClick={() => {
                              registerShellCompany(newCompanyName, newCompanyGoods);
                              setNewCompanyName('');
                            }}
                            disabled={state.pln < 100000}
                            style={{
                              width: '100%',
                              padding: '10px',
                              backgroundColor: '#1abc9c',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              fontWeight: 'bold',
                              cursor: state.pln >= 100000 ? 'pointer' : 'not-allowed',
                              opacity: state.pln >= 100000 ? 1 : 0.6
                            }}
                          >
                            Zarejestruj spółkę
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Skarbówka Monitoring & Offshore */}
                  <div style={{ flex: 1, minWidth: '300px', backgroundColor: '#34495e', padding: '20px', border: '1px solid #7f8c8d', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Risk indicator */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#e67e22' }}>Ryzyko Kontroli Skarbowej</h4>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', marginBottom: '5px' }}>
                        <span>Aktualne Ryzyko:</span>
                        <strong style={{ color: state.vatAuditRisk >= 75 ? '#e74c3c' : '#e67e22' }}>{Math.floor(state.vatAuditRisk || 0)}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '15px', backgroundColor: '#34495e', borderRadius: '4px', overflow: 'hidden', border: '1px solid #465c71' }}>
                        <div style={{ width: `${state.vatAuditRisk}%`, height: '100%', backgroundColor: state.vatAuditRisk >= 75 ? '#e74c3c' : '#e67e22', transition: 'width 0.3s ease' }}></div>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: '0.72em', color: '#bdc3c7', lineHeight: '1.3' }}>
                        Ryzyko rośnie, gdy karuzela się kręci (szybciej dla paliw i elektroniki). Spada powoli, gdy karuzela jest wyłączona, oraz po pomyślnych zwrotach VAT.
                      </p>
                    </div>

                    {/* Cyprus bank */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#1abc9c' }}>Bankowość Offshore (Larnaka, Cypr)</h4>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.8em', color: '#bdc3c7' }}>
                        Przelej PLN do cypryjskiego holding-u, aby generować odsetki (+0.5%/min) i uchronić je przed grzywnami skarbowymi.
                      </p>
                      
                      <div style={{ backgroundColor: '#34495e', padding: '10px', borderRadius: '4px', textAlign: 'center', marginBottom: '15px' }}>
                        <span>Środki na Cyprze:</span>
                        <div style={{ fontSize: '1.4em', color: '#1abc9c', fontWeight: 'bold', marginTop: '5px' }}>
                          {Math.floor(state.offshoreCyprusBalance || 0).toLocaleString('pl-PL')} PLN
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input
                            type="number"
                            value={vatOffshoreAmountInput}
                            onChange={(e) => setVatOffshoreAmountInput(e.target.value)}
                            style={{ flex: 1, padding: '6px', borderRadius: '4px', backgroundColor: '#34495e', color: '#fff', border: '1px solid #7f8c8d' }}
                          />
                          <button
                            onClick={() => {
                              const amt = parseInt(vatOffshoreAmountInput) || 0;
                              if (amt > 0) transferToOffshore(amt);
                            }}
                            disabled={state.pln < (parseInt(vatOffshoreAmountInput) || 0)}
                            style={{ padding: '6px 12px', backgroundColor: '#1abc9c', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Przelej (Cypr)
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            const amt = parseInt(vatOffshoreAmountInput) || 0;
                            if (amt > 0) withdrawFromOffshore(amt);
                          }}
                          disabled={state.offshoreCyprusBalance < (parseInt(vatOffshoreAmountInput) || 0)}
                          style={{ width: '100%', padding: '6px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                          Wypłać pożyczkę udziałowca
                        </button>
                      </div>
                    </div>

                    {/* Upgrades */}
                    <div style={{ backgroundColor: '#2c3e50', padding: '15px', borderRadius: '6px', border: '1px solid #465c71' }}>
                      <h4 style={{ margin: '0 0 10px 0', color: '#f1c40f' }}>Doradztwo Podatkowe & Słupy</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {VAT_UPGRADES.map(upg => {
                          const isBought = !!state.vatUpgrades?.[upg.id];
                          return (
                            <div key={upg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#34495e', padding: '8px 12px', borderRadius: '4px' }}>
                              <div style={{ flex: 1, marginRight: '10px' }}>
                                <strong style={{ fontSize: '0.85em', color: '#fff' }}>{upg.name}</strong>
                                <p style={{ margin: '2px 0 0 0', fontSize: '0.72em', color: '#bdc3c7', lineHeight: '1.2' }}>{upg.desc}</p>
                              </div>
                              <button
                                onClick={() => buyVatUpgrade(upg.id)}
                                disabled={isBought || (upg.costPln ? state.pln < upg.costPln : false) || (upg.costUsd ? state.dollars < upg.costUsd : false)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.75em',
                                  backgroundColor: isBought ? '#7f8c8d' : '#f1c40f',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  cursor: isBought ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {isBought ? 'KUPIONE' : upg.costPln ? `${(upg.costPln/1000).toFixed(0)}k zł` : upg.costUsd ? `${(upg.costUsd/1000).toFixed(0)}k $` : '0 $'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          );
        })();
});
