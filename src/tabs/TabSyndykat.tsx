// [Claude] KIERUNEK 1.2: zakladka 'syndykat' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { COCOM_ITEMS, COCOM_PERSONNEL, COCOM_SMUGGLING_ROUTES, COCOM_VEHICLES, EXPORT_CONTACTS, GEOPOLITICAL_EVENTS, SYNDICATE_UPGRADES } from '../game/items';
import { useGameApi } from './GameApiContext';

export const TabSyndykat = memo(function TabSyndykat() {
  const { autoStartRun, buyCOCOMItem, buyCocomVehicle, buySyndicateUpgrade, hireCocomPersonnel, launderCocomProceeds, sendCocomShipment, state, unlockExportContact, unlockSyndicate, updateState } = useGameApi();
  return (() => {
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
                    Nielegalne Zyski: <span style={{fontWeight: 'bold'}}>{(state.cocomProceedsPln || 0).toLocaleString('pl-PL')} zł</span>
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
                                {hasRank ? `Kup: $${item.costUsd.toLocaleString('pl-PL')}` : `Wymaga: ${item.requiredPartyRank?.toUpperCase()}`}
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
                             Kup: {v.costPln > 0 ? `${v.costPln.toLocaleString('pl-PL')} PLN` : `$${v.costUsd.toLocaleString('pl-PL')}`}
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
                           <span>Pensja: {p.salaryPerRunPln.toLocaleString('pl-PL')} PLN | Kamuflaż: +{p.stealthBonus}%</span>
                           <button onClick={() => hireCocomPersonnel(p.id)} style={{padding: '5px 10px', fontSize: '0.75rem'}}>
                             Werbuj: {p.costPln > 0 ? `${p.costPln.toLocaleString('pl-PL')} PLN` : `$${p.costUsd.toLocaleString('pl-PL')}`}
                           </button>
                         </div>
                       </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          );
        })();
});
