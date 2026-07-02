// [Claude] KIERUNEK 1.2: zakladka 'lata90' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { BAZAR_ITEMS, BAZAR_LOGISTICS_ROUTES, MAFIA_PROTECTIONS, MEDIA_ANTENNA_REGIONS, MEDIA_PROGRAMS, MEDIA_STATIONS, NFI_COMPANIES, WAREHOUSE_UPGRADES } from '../game/items';
import { fmtNum } from '../utils/format';
import { playClick, playError, playSuccess } from '../utils/audio';
import { useGameApi } from './GameApiContext';

export const TabLata90 = memo(function TabLata90() {
  const { bribeBazarCustoms, bribeKrrit, broadcastPoliticalSpot, buyBazarItem, buyMediaAntenna, buyMediaStation, buyNfiCompany, buyProgramLicense, claimMediaSponsorshipContract, denominatePln, dispatchBazarTransport, fireNfiEmployees, hireMafiaProtection, hireNfiEmployees, lata90SubTab, modernizeNfiInfrastructure, negotiateNfiUnions, pacifyNfiStrike, runTabloidInvestigation, sellBazarItem, setLata90SubTab, setMediaSlot, showAlert, state, unlockFazaM, unlockFazaS, updateState, upgradeBazarWarehouse } = useGameApi();
  return (() => {
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
                                Kup (Hurt: {buyP.toLocaleString('pl-PL')} zł)
                              </button>
                              <button 
                                onClick={() => sellBazarItem(item.id, 1)}
                                disabled={qty < 1}
                                style={{ flex: 1, padding: '8px', fontSize: '0.9em', backgroundColor: '#27ae60', color: '#fff', border: 'none', borderRadius: '4px', cursor: qty >= 1 ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                              >
                                Sprzedaj ({finalSellPrice.toLocaleString('pl-PL')} zł)
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
                                Koszt: <strong>{costPln.toLocaleString('pl-PL')} zł</strong> + <strong>${route.costUsd}</strong>
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
                                <strong>{fmtNum(t.timeLeft, 1)}s pozostało</strong>
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
                          Bribe ({(Math.floor(2000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString('pl-PL')} zł)
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
                                Kup ({costPln.toLocaleString('pl-PL')} zł)
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
                                    {status.strikeActive ? '0 zł/s (ZABLOKOWANY)' : `+${currentDividend.toLocaleString('pl-PL')} zł/s`}
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
                                  <strong>{status.employment.toLocaleString('pl-PL')} robotników</strong>
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
                                  <strong style={{ color: '#2ecc71' }}>+{currentDividend.toLocaleString('pl-PL')} zł/s</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Zatrudnienie:</span>
                                  <span>{comp.baseEmployment.toLocaleString('pl-PL')} robotników</span>
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
                                  Modernizacja maszyn (-{modCost.toLocaleString('pl-PL')} zł)
                                </button>
                                
                                <button 
                                  onClick={() => negotiateNfiUnions(comp.id)}
                                  disabled={state.pln < negoCost}
                                  style={{ padding: '6px', fontSize: '0.85em', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Podwyżki / Negocjacje (-{negoCost.toLocaleString('pl-PL')} zł)
                                </button>
                                
                                <button 
                                  onClick={() => pacifyNfiStrike(comp.id)}
                                  disabled={state.pln < pacifyCost}
                                  style={{ padding: '6px', fontSize: '0.85em', backgroundColor: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                  Pacyfikacja siłowa strajku (-{pacifyCost.toLocaleString('pl-PL')} zł)
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
                        KUP PROMESĘ KONCESYJNĄ KRRiT ({(Math.floor(15000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString('pl-PL')} zł)
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
                            Wręcz Kopertę Rady ({(Math.floor(5000000 * (state.isDenominated ? 1 : state.plzInflationMult))).toLocaleString('pl-PL')} zł)
                          </button>
                        </div>

                        <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #f1c40f', paddingBottom: '5px', color: '#f1c40f' }}>Twoje Stacje Medialne</h3>
                        <div style={{ display: 'grid', gap: '15px' }}>
                          
                          {MEDIA_STATIONS.map(station => {
                            const isOwned = state.mediaStations[station.id];
                            if (!isOwned) return null;
                            
                            const slots = state.activeMediaPrograms[station.id] || { rano: null, poludnie: null, wieczor: null };
                            const trust = state.mediaTrust[station.id] !== undefined ? state.mediaTrust[station.id] : 100;
                            
                            // [Claude] usunięto nieużywany licznik activeCount (martwy kod)
                            // Calculate current rating of station
                            let rating = station.baseRating;
                            let incomeMult = 0;
                            Object.values(slots).forEach(progId => {
                              if (progId) {
                                const p = MEDIA_PROGRAMS.find(pr => pr.id === progId);
                                if (p) {
                                  rating += p.ratingBonus;
                                  incomeMult += p.incomeMult;
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
                                  <span>Oglądalność: <strong>{rating.toLocaleString('pl-PL')} tys. widzów</strong></span>
                                  <span>Pasywny przychód: <strong>{(rating * 8 * incomeMult).toLocaleString('pl-PL')} zł/s</strong></span>
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
                                    Kup ({costPln.toLocaleString('pl-PL')} zł)
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
                                    <span style={{ color: '#fff', fontSize: '0.8em' }}>{costPln.toLocaleString('pl-PL')} zł</span>
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
                                    Buduj ({costPln.toLocaleString('pl-PL')} zł)
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
                                Kup ({costPln.toLocaleString('pl-PL')} zł)
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
        })();
});
