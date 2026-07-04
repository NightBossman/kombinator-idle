// [Claude] KIERUNEK 1.2: zakladka 'miasto' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { BLACK_MARKET_WEAPONS, GANGSTER_UNITS, WARSAW_DISTRICTS } from '../game/items';
import { fmtNum } from '../utils/format';
import { useGameApi } from './GameApiContext';

export const TabMiasto = memo(function TabMiasto() {
  const { buyBlackMarketWeapon, buyGangUnit, state, unlockFazaN } = useGameApi();
  return (() => {
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
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: '#c0392b' }}>-{currentUpkeep.toLocaleString('pl-PL')} zł/s</div>
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
                              Werbuj ({cost.toLocaleString('pl-PL')} zł)
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
                              <div style={{ fontSize: '0.8em', color: '#bdc3c7' }}>Bonus: +{fmtNum(w.powerBonus * 100, 0)}% do siły</div>
                            </div>
                            <button 
                              onClick={() => buyBlackMarketWeapon(w.id, 1)}
                              disabled={state.pln < costPln || state.dollars < w.costUsd}
                              style={{ padding: '5px 10px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              Kup ({costPln.toLocaleString('pl-PL')} zł{w.costUsd > 0 ? ` + ${w.costUsd}$` : ''})
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
                      
                      // Normalize to eliminate tiny slivers < 2%
                      let p = ctrl.player < 2 ? 0 : ctrl.player;
                      let pr = ctrl.pruszkow < 2 ? 0 : ctrl.pruszkow;
                      let w = ctrl.wolomin < 2 ? 0 : ctrl.wolomin;
                      const sum = p + pr + w;
                      if (sum > 0) {
                        p = (p / sum) * 100;
                        pr = (pr / sum) * 100;
                        w = (w / sum) * 100;
                      } else {
                        w = 100;
                      }

                      const firstActive = p > 0 ? 'p' : (pr > 0 ? 'pr' : 'w');
                      const lastActive = w > 0 ? 'w' : (pr > 0 ? 'pr' : 'p');

                      return (
                        <div key={dist.id} style={{ backgroundColor: '#111', padding: '15px', borderRadius: '4px', border: '1px solid #333' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <strong style={{ fontSize: '1.2em' }}>{dist.name}</strong>
                            <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>+{income.toLocaleString('pl-PL')} zł/s</span>
                          </div>
                          <div style={{ fontSize: '0.85em', color: '#aaa', marginBottom: '10px' }}>{dist.desc}</div>
                          
                          <div style={{ display: 'flex', height: '20px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #555', backgroundColor: '#222' }}>
                            {p > 0 && (
                              <div style={{ 
                                width: `${p}%`, 
                                backgroundColor: '#8e44ad', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.7em', 
                                fontWeight: 'bold',
                                borderTopLeftRadius: firstActive === 'p' ? '9px' : '0',
                                borderBottomLeftRadius: firstActive === 'p' ? '9px' : '0',
                                borderTopRightRadius: lastActive === 'p' ? '9px' : '0',
                                borderBottomRightRadius: lastActive === 'p' ? '9px' : '0'
                              }}>
                                {p > 5 ? `${fmtNum(p, 1)}%` : ''}
                              </div>
                            )}
                            {pr > 0 && (
                              <div style={{ 
                                width: `${pr}%`, 
                                backgroundColor: '#e67e22', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.7em', 
                                fontWeight: 'bold',
                                borderTopLeftRadius: firstActive === 'pr' ? '9px' : '0',
                                borderBottomLeftRadius: firstActive === 'pr' ? '9px' : '0',
                                borderTopRightRadius: lastActive === 'pr' ? '9px' : '0',
                                borderBottomRightRadius: lastActive === 'pr' ? '9px' : '0'
                              }}>
                                {pr > 5 ? `${fmtNum(pr, 1)}% (P)` : ''}
                              </div>
                            )}
                            {w > 0 && (
                              <div style={{ 
                                width: `${w}%`, 
                                backgroundColor: '#c0392b', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '0.7em', 
                                fontWeight: 'bold',
                                borderTopLeftRadius: firstActive === 'w' ? '9px' : '0',
                                borderBottomLeftRadius: firstActive === 'w' ? '9px' : '0',
                                borderTopRightRadius: lastActive === 'w' ? '9px' : '0',
                                borderBottomRightRadius: lastActive === 'w' ? '9px' : '0'
                              }}>
                                {w > 5 ? `${fmtNum(w, 1)}% (W)` : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })();
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabMiasto;
