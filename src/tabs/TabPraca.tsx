// [Claude] KIERUNEK 1.2: zakladka 'praca' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { PLN_UPGRADES, QUEUE_ITEMS } from '../game/items';
import { pluralPL } from '../utils/format';
import { playClick } from '../utils/audio';
import { useGameApi } from './GameApiContext';

export const TabPraca = memo(function TabPraca() {
  const { activeQueue, activeQueue2, isKartkiRequired, pracuj, queueProgress, queueProgress2, startQueue, state, updateState } = useGameApi();
  return (
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
                                {/* [Claude] naprawa odmiany: "1 kartek" -> "1 kartka", "2 kartki" itd. */}
                                Koszt: {cost} zł {item.kartkiCost ? `+ ${isKartkiRequired(item) ? item.kartkiCost : 0} ${pluralPL(isKartkiRequired(item) ? item.kartkiCost : 0, 'kartka', 'kartki', 'kartek')}` : ''}
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
                            <div style={{width: `${queueProgress}%`, height: '100%', background: '#33ff33', transition: 'width 0.2s linear'}} />
                          </div>
                        )}
                        {activeQueue2 === item.id && (
                          <div style={{width: '100%', height: '10px', background: '#222', marginTop: '5px'}}>
                            <div style={{width: `${queueProgress2}%`, height: '100%', background: '#ff33ff', transition: 'width 0.2s linear'}} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
           </div>
  );
});
