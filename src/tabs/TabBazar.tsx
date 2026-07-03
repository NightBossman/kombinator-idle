// [Claude] KIERUNEK 1.2: zakladka 'bazar' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { PRODUCED_ITEMS, QUEUE_ITEMS } from '../game/items';
import { calculateLuxurySuspicionReduction } from '../game/engine';
import { bazarPlnUnitPrice, bazarUsdUnitPrice } from '../game/formulas';
import { useGameApi } from './GameApiContext';

export const TabBazar = memo(function TabBazar() {
  const { deliverForRuble, deliverForTalony, sellItem, sellItemDollars, state, updateState } = useGameApi();
  return (
    <div className="flex-col gap-4">
              <div className="panel">
                <h2>BAZAR (SPRZEDAŻ)</h2>
                <div style={{maxHeight: '500px', overflowY: 'auto', paddingRight: '10px'}}>
                  {QUEUE_ITEMS.map(item => {
                    const amount = Math.floor(state.inventory[item.id] || 0);
                    if (amount === 0) return null;
                    
                    // [Claude] KIERUNEK 1.3: cena z tego samego wzoru, ktory placi sellItem
                    const sellP = bazarPlnUnitPrice(item.sellPricePln, item.id, state);
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                        <span>{item.name} (Masz: {amount})</span>
                        <div className="flex gap-2">
                           <button onClick={() => sellItem(item.id, item.sellPricePln, 1)}>x1 (+{sellP} zł)</button>
                           {state.plnUpgrades['wozek'] && amount >= 10 && (
                              <button onClick={() => sellItem(item.id, item.sellPricePln, 10)}>x10 (+{sellP*10} zł)</button>
                           )}
                           {state.plnUpgrades['torba'] && amount >= 100 && (
                              <button onClick={() => sellItem(item.id, item.sellPricePln, 100)}>x100 (+{sellP*100} zł)</button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {PRODUCED_ITEMS.map(item => {
                    const amount = Math.floor(state.inventory[item.id] || 0);
                    if (amount === 0) return null;
                    
                    // [Claude] KIERUNEK 1.3: ceny z tych samych wzorow, ktore placa sellItem /
                    // sellItemDollars. Uwaga: cena dolarowa NIE zawiera juz bonusu Uwolnienia Cen -
                    // stary przycisk go obiecywal, ale mechanika sprzedazy nigdy go nie wyplacala.
                    const sellP = item.sellPricePln ? bazarPlnUnitPrice(item.sellPricePln, item.id, state) : 0;
                    const sellD = item.sellPriceDollars ? bazarUsdUnitPrice(item.sellPriceDollars, item.id, state) : 0;
                    
                    return (
                      <div key={item.id} className="flex justify-between items-center mt-4" style={{borderBottom: '1px solid #333', paddingBottom: '10px', borderColor: 'var(--dollar-green)'}}>
                        <span style={{color: 'var(--dollar-green)'}}>{item.name} (Masz: {amount})</span>
                        <div className="flex gap-2">
                           {item.sellPricePln ? (
                             <>
                               <button onClick={() => sellItem(item.id, item.sellPricePln!, 1)}>x1 (+{sellP} zł)</button>
                               {state.plnUpgrades['wozek'] && amount >= 10 && (
                                  <button onClick={() => sellItem(item.id, item.sellPricePln!, 10)}>x10 (+{sellP*10} zł)</button>
                               )}
                               {state.plnUpgrades['torba'] && amount >= 100 && (
                                  <button onClick={() => sellItem(item.id, item.sellPricePln!, 100)}>x100 (+{sellP*100} zł)</button>
                               )}
                             </>
                           ) : (
                             <>
                               <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 1)}>x1 (+${sellD})</button>
                               {state.plnUpgrades['wozek'] && amount >= 10 && (
                                  <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 10)}>x10 (+${sellD*10})</button>
                               )}
                               {state.plnUpgrades['torba'] && amount >= 100 && (
                                  <button onClick={() => sellItemDollars(item.id, item.sellPriceDollars!, 100)}>x100 (+${sellD*100})</button>
                               )}
                             </>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {Object.values(state.inventory).every(v => v < 1) && (
                     <p style={{color: 'var(--prl-gray)'}}>Nie masz nic na sprzedaż. Idź postać w kolejce.</p>
                  )}
                </div>
              </div>

              <div className="panel">
                <h2>CINKCIARZ (KANTOR)</h2>
                <div className="flex justify-between items-center text-dollar" style={{marginBottom: '10px'}}>
                  <span>Aktualny kurs:</span>
                  <span>
                    1$ = {state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : Math.floor(state.exchangeRate)} zł
                    {state.activeEvent === 'drozyzna' && <span style={{color: 'var(--prl-red)', marginLeft: '5px'}}>(INFLACJA!)</span>}
                  </span>
                </div>
                <button 
                  disabled={state.pln < (state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate)}
                  onClick={() => {
                    updateState(s => {
                      const currentRate = s.activeEvent === 'drozyzna' ? Math.floor(s.exchangeRate * 1.30) : s.exchangeRate;
                      if (s.pln >= currentRate) {
                        const luxurySuspMult = 1 - calculateLuxurySuspicionReduction(s.ownedLuxuryItems);
                        const suspAdd = s.partyRank === 'minister' || s.activeEvent === 'odwilz' ? 0 : Math.max(0, Math.floor(2 * luxurySuspMult));
                        return { ...s, pln: s.pln - currentRate, dollars: s.dollars + 1, suspicion: s.suspicion + suspAdd };
                      }
                      return s;
                    });
                  }}
                  style={{width: '100%'}}
                >
                  Kup 1$ (-{state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : Math.floor(state.exchangeRate)} zł)
                </button>
              </div>

              <div className="panel">
                <h2>SKLEP REJONOWY / SKUP W WALUCIE</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px'}}>
                  Sprzedawaj towary państwu w zamian za bony towarowe (Talony) lub wymieniaj towary z ZSRR na Ruble.
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px'}}>
                  <div>
                    <h3 style={{fontSize: '0.9rem', color: '#5bc0de', marginTop: 0}}>Dostawy do Sklepu Rejonowego</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>10x Papier Toaletowy</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['papier'] || 0) < 10} onClick={() => deliverForTalony('papier', 10, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>5x Mydło "Biały Jeleń"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['mydlo'] || 0) < 5} onClick={() => deliverForTalony('mydlo', 5, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>3x Cukier (1kg)</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['cukier'] || 0) < 3} onClick={() => deliverForTalony('cukier', 3, 1)}>+1 Talon</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Dżinsy "Odra"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['dzinsy'] || 0) < 1} onClick={() => deliverForTalony('dzinsy', 1, 2)}>+2 Talony</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Radio "Kasprzak"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['kasprzak'] || 0) < 1} onClick={() => deliverForTalony('kasprzak', 1, 5)}>+5 Talonów</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x TV "Neptun"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['neptun'] || 0) < 1} onClick={() => deliverForTalony('neptun', 1, 10)}>+10 Talonów</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 style={{fontSize: '0.9rem', color: '#ff4500', marginTop: 0}}>Wymiana z ZSRR</h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Spirytus (0.5l)</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['spirytus'] || 0) < 1} onClick={() => deliverForRuble('spirytus', 1, 5)}>+5 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Buty "Relaks"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['relaks'] || 0) < 1} onClick={() => deliverForRuble('relaks', 1, 10)}>+10 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Radio "Kasprzak"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['kasprzak'] || 0) < 1} onClick={() => deliverForRuble('kasprzak', 1, 25)}>+25 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Aparat "Zorki"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['zorki'] || 0) < 1} onClick={() => deliverForRuble('zorki', 1, 40)}>+40 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Pralka "Frania"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['frania'] || 0) < 1} onClick={() => deliverForRuble('frania', 1, 60)}>+60 Rubli</button>
                      </div>
                      <div className="flex justify-between items-center" style={{fontSize: '0.8rem', borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                        <span>1x Skuter "Osa"</span>
                        <button style={{padding: '2px 5px', fontSize: '0.75rem'}} disabled={(state.inventory['osa'] || 0) < 1} onClick={() => deliverForRuble('osa', 1, 100)}>+100 Rubli</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
           </div>
  );
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabBazar;
