// [Claude] KIERUNEK 1.2: zakladka 'gpw' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { GPW_EVENTS, GPW_STOCKS } from '../game/items';
import { fmtNum } from '../utils/format';
import { playClick, playError, playSuccess } from '../utils/audio';
import { useGameApi } from './GameApiContext';

export const TabGpw = memo(function TabGpw() {
  const { addToast, buyGpwInsiderTip, buyShares, selectedStockId, sellShares, setSelectedStockId, showAlert, state, updateState } = useGameApi();
  return (() => {
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
            const paddingLeft = 40;
            const paddingRight = 15;
            const paddingTop = 15;
            const paddingBottom = 20;
            
            const minPrice = Math.min(...history) * 0.95;
            const maxPrice = Math.max(...history) * 1.05;
            const priceRange = maxPrice - minPrice || 1;
            
            const chartInnerWidth = chartWidth - paddingLeft - paddingRight;
            const chartInnerHeight = chartHeight - paddingTop - paddingBottom;
            
            const points = history.map((price, idx) => {
              const x = paddingLeft + (idx / (history.length - 1 || 1)) * chartInnerWidth;
              const y = chartHeight - paddingBottom - ((price - minPrice) / priceRange) * chartInnerHeight;
              return `${x},${y}`;
            }).join(' ');
            
            const basePriceY = chartHeight - paddingBottom - ((selectedStock.basePrice - minPrice) / priceRange) * chartInnerHeight;


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
                              <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Dywidenda: {fmtNum((stock.dividendRate * 100), 1)}% co 30s | Posiadasz: {owned}</span>
                            </div>
                            <div style={{textAlign: 'right'}} className="flex-col">
                              <span style={{fontSize: '1.1rem', fontWeight: 'bold'}}>{fmtNum(price)} zł</span>
                              <span style={{fontSize: '0.8rem', color: baseDiff >= 0 ? '#39ff14' : 'var(--prl-red)'}}>
                                {baseDiff >= 0 ? '+' : ''}{fmtNum(baseDiff, 1)}%
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
                        <div style={{fontSize: '1.6rem', fontWeight: 'bold', color: '#39ff14'}}>{fmtNum(currentPrice)} zł</div>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>Cena debiutu: {fmtNum(selectedStock.basePrice)} zł</span>
                      </div>
                    </div>

                    {/* Wykres SVG */}
                    <div style={{background: '#000', border: '1px solid #111', borderRadius: '4px', overflow: 'hidden', position: 'relative'}}>
                      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{display: 'block'}}>
                        {/* Linie siatki poziome (ceny) */}
                        {[0, 1, 2, 3, 4].map(i => {
                          const y = paddingTop + (i / 4) * chartInnerHeight;
                          const priceAtY = maxPrice - (i / 4) * priceRange;
                          return (
                            <g key={`y-${i}`}>
                              <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="#111" strokeDasharray="3" />
                              <text x={2} y={y + 3} fill="rgba(57, 255, 20, 0.6)" fontSize="9">{fmtNum(priceAtY, 0)}</text>
                            </g>
                          );
                        })}
                        
                        {/* Linie siatki pionowe (czas) */}
                        {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                          const x = paddingLeft + (i / 7) * chartInnerWidth;
                          return (
                            <g key={`x-${i}`}>
                              <line x1={x} y1={paddingTop} x2={x} y2={chartHeight - paddingBottom} stroke="#111" strokeDasharray="3" />
                            </g>
                          );
                        })}
                        
                        <text x={paddingLeft} y={chartHeight - 5} fill="rgba(57, 255, 20, 0.6)" fontSize="9">-2.5 min</text>
                        <text x={chartWidth - paddingRight} y={chartHeight - 5} fill="rgba(57, 255, 20, 0.6)" fontSize="9" textAnchor="end">teraz</text>

                        {/* Linia ceny debiutu */}
                        {basePriceY >= paddingTop && basePriceY <= chartHeight - paddingBottom && (
                          <g>
                            <line x1={paddingLeft} y1={basePriceY} x2={chartWidth - paddingRight} y2={basePriceY} stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="4 2" />
                            <text x={paddingLeft + 5} y={basePriceY - 3} fill="rgba(255, 255, 255, 0.4)" fontSize="8">DEBIUT</text>
                          </g>
                        )}

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
                          const x = paddingLeft + chartInnerWidth;
                          const y = chartHeight - paddingBottom - ((currentPrice - minPrice) / priceRange) * chartInnerHeight;
                          return <circle cx={x} cy={y} r="4" fill="#39ff14" />;
                        })()}
                      </svg>
                      <div style={{position: 'absolute', top: '5px', left: '10px', fontSize: '0.65rem', color: 'rgba(57, 255, 20, 0.4)'}}>CRT_MONITOR_GPW_v1.0</div>
                    </div>

                    {/* Portfel i transakcje */}
                    <div style={{background: 'rgba(57, 255, 20, 0.05)', border: '1px dashed rgba(57, 255, 20, 0.3)', padding: '12px', borderRadius: '4px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.9rem'}}>
                        <span>Posiadane akcje: <strong>{ownedCount}</strong></span>
                        <span>Średnia cena zakupu: <strong>{avgCost > 0 ? `${fmtNum(avgCost)} zł` : 'brak'}</strong></span>
                      </div>
                      <div className="flex justify-between items-center mt-2" style={{fontSize: '0.9rem'}}>
                        <span>Wycena portfela: <strong>{fmtNum(totalValue)} zł</strong></span>
                        <span>Zysk / Strata: 
                          <strong style={{color: profitLoss >= 0 ? '#39ff14' : 'var(--prl-red)', marginLeft: '5px'}}>
                            {profitLoss >= 0 ? '+' : ''}{fmtNum(profitLoss)} zł ({profitLossPercent >= 0 ? '+' : ''}{fmtNum(profitLossPercent, 1)}%)
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
         })();
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabGpw;
