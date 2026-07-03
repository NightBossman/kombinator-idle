// [Claude] KIERUNEK 1.2: zakladka 'czarnyRynek' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { LUXURY_ITEMS, QUEUE_ITEMS } from '../game/items';
import { fmtNum, pluralPL } from '../utils/format';
import { calculateLuxurySuspicionReduction } from '../game/engine';
import { calculateLuxuryPrestigeBonus } from '../game/formulas';
import { useGameApi } from './GameApiContext';

export const TabCzarnyRynek = memo(function TabCzarnyRynek() {
  const { bidInAuction, buyAsset, buyBlackMarketOffer, buyBondPRL, buyBondSolidarnos, buyBonyPewex, buyDollarPremium, buyInflationUpgrade, buyInstantCzarnyRynek, buyWholesale, exchangeRubleForDollars, exchangeTalonyForKartki, realTime, redeemSolidarnosBonds, sellAsset, sellBonyPewex, state, wholesalePrices } = useGameApi();
  return (
    <div className="flex-col gap-4">
              {/* NOWY PANEL KANTOR & SPEKULACJA (1989) */}
              {state.activeDestination === 'usa' ? (
                <div className="panel" style={{borderColor: 'var(--dollar-green)', marginBottom: '20px'}}>
                  <h2 style={{color: 'var(--dollar-green)'}}>KANTOR, SPEKULACJA & OBLIGACJE (1989)</h2>
                  <p style={{fontSize: '0.85rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                    Hiperinflacja niszczy wartość złotówki! Wymieniaj dewizy, spekuluj hurtowym towarem i kupuj obligacje indeksowane, by ratować majątek przed dewaluacją.
                  </p>

                  <div className="game-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', border: 'none', background: 'transparent', padding: 0}}>
                    {/* SEKCJA 1: DYNAMICZNY KANTOR WALUTOWY */}
                    <div className="panel" style={{borderColor: '#85bb65', padding: '10px'}}>
                      <h3 style={{color: '#85bb65', fontSize: '1rem', marginTop: 0}}>CINKCIARZ 2.0 (KURS: {Math.floor(state.exchangeRate * (1 + state.inflationPercent/100))} zł)</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Dolar ($):</span>
                          <span>Sprzedaż: {Math.floor(state.exchangeRate * (1 + state.inflationPercent/100) * 0.95)} zł</span>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Bon Pewex (1$):</span>
                          <div className="flex gap-1">
                            <button onClick={() => buyBonyPewex(1)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (1 bon)</button>
                            <button onClick={() => sellBonyPewex(1)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Sprzedaj</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Srebro (1 oz):</span>
                          <div className="flex gap-1">
                            <button onClick={() => buyAsset('srebro', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (10k zł)</button>
                            <button onClick={() => sellAsset('srebro', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Wycofaj (2.5$)</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <span>Krugerrand (1 oz):</span>
                          <div className="flex-col gap-1">
                            <div className="flex gap-1">
                              <button onClick={() => buyAsset('krugerrand', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (PLN)</button>
                              <button onClick={() => buyAsset('krugerrand', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (400$)</button>
                            </div>
                            <button onClick={() => sellAsset('krugerrand', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem', marginTop: '2px', width: '100%'}}>Sprzedaj ({state.inflationUpgrades?.['licencjaDewizowa'] ? 390 : 380}$)</button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Sztabka Złota (5 oz):</span>
                          <div className="flex-col gap-1">
                            <div className="flex gap-1">
                              <button onClick={() => buyAsset('sztabkaZlota', 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (PLN)</button>
                              <button onClick={() => buyAsset('sztabkaZlota', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (2000$)</button>
                            </div>
                            <button onClick={() => sellAsset('sztabkaZlota', 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem', marginTop: '2px', width: '100%'}}>Sprzedaj ({state.inflationUpgrades?.['licencjaDewizowa'] ? 1975 : 1950}$)</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SEKCJA 2: OBLIGACJE INFLACYJNE */}
                    <div className="panel" style={{borderColor: '#ffd700', padding: '10px'}}>
                      <h3 style={{color: '#ffd700', fontSize: '1rem', marginTop: 0}}>PAPIERY WARTOŚCIOWE</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        <div className="flex-col" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                          <div className="flex justify-between items-center">
                            <strong>Obligacje PRL (Nominalne)</strong>
                            <button onClick={buyBondPRL} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(50000 * (1 + state.inflationPercent/100))} zł)</button>
                          </div>
                          <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Masz: {state.bondPrlCount || 0} szt. | Zysk: +{((state.bondPrlCount || 0) * 2000).toLocaleString('pl-PL')} zł/s</span>
                        </div>
                        <div className="flex-col">
                          <div className="flex justify-between items-center">
                            <strong>Obligacje Solidarności (Indeksowane)</strong>
                            <div className="flex gap-1">
                              <button onClick={() => buyBondSolidarnos('pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>PLN</button>
                              <button onClick={() => buyBondSolidarnos('dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>100$</button>
                            </div>
                          </div>
                          <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Masz: {state.bondSolCount || 0} szt. | Oprocentowanie: +{fmtNum((state.inflationPercent + 5), 1)}%/s</span>
                          {state.bondSolCount > 0 && (
                            <div className="flex justify-between items-center style-button" style={{marginTop: '5px', background: 'rgba(255, 215, 0, 0.1)', padding: '5px'}}>
                              <span>Wartość: {Math.floor(state.bondSolValue || 0).toLocaleString('pl-PL')} zł</span>
                              <button onClick={redeemSolidarnosBonds} style={{padding: '2px 5px', fontSize: '0.75rem', borderColor: '#ffd700', color: '#ffd700'}}>Wykup</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SEKCJA 3: SPEKULACJA TOWAROWA */}
                    <div className="panel" style={{borderColor: '#ff33ff', padding: '10px'}}>
                      <h3 style={{color: '#ff33ff', fontSize: '1rem', marginTop: 0}}>HURTOWNIA SPEKULACYJNA (±15% co 15s)</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem'}}>
                        {Object.entries(wholesalePrices).map(([key, price]) => {
                          const name = key === 'kawa' ? 'Kawa (10 szt.)' : key === 'spirytus' ? 'Spirytus (10 szt.)' : key === 'dzinsy' ? 'Dżinsy (10 szt.)' : 'Kasprzak (5 szt.)';
                          const plnCost = Math.floor(price.pln * (1 + state.inflationPercent/100));
                          const usdCost = price.usd;
                          return (
                            <div key={key} className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '5px'}}>
                              <div className="flex-col">
                                <span>{name}</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>{plnCost} zł / {usdCost}$</span>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => buyWholesale(key, 'pln')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>PLN</button>
                                <button onClick={() => buyWholesale(key, 'dollars')} style={{padding: '2px 5px', fontSize: '0.75rem'}}>USD</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* SEKCJA 4: ULEPSZENIA OSŁONOWE */}
                    <div className="panel" style={{borderColor: '#00ffff', padding: '10px', gridColumn: 'span 1'}}>
                      <h3 style={{color: '#00ffff', fontSize: '1rem', marginTop: 0}}>KAPITAŁ OCHRONNY</h3>
                      <div className="flex-col gap-2" style={{fontSize: '0.85rem', maxHeight: '350px', overflowY: 'auto'}}>
                        {/* Konto PKO */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Konto PKO (PLN)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-60% dewaluacji PLN</span>
                          </div>
                          {state.inflationUpgrades?.['kontoPKO'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('kontoPKO', 'pln', 100000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(100000 * (1 + state.inflationPercent/100))} zł)</button>
                          )}
                        </div>
                        {/* Automat Pewex */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Automat Pewex (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>25% zysków PLN na Bony Pewex</span>
                          </div>
                          {state.inflationUpgrades?.['automatPewex'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('automatPewex', 'dollars', 500)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (500$)</button>
                          )}
                        </div>
                        {/* Książeczka Mieszkaniowa */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Książeczka (PLN)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>+0.05 Solidarność / s</span>
                          </div>
                          {state.inflationUpgrades?.['ksiazeczkaMieszkaniowa'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('ksiazeczkaMieszkaniowa', 'pln', 250000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup ({Math.floor(250000 * (1 + state.inflationPercent/100))} zł)</button>
                          )}
                        </div>
                        {/* Licencja Dewizowa */}
                        <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '3px'}}>
                          <div className="flex-col">
                            <span>Licencja Dewizowa (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-50% spreadu na złocie</span>
                          </div>
                          {state.inflationUpgrades?.['licencjaDewizowa'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('licencjaDewizowa', 'dollars', 1000)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (1000$)</button>
                          )}
                        </div>
                        {/* Polisa Asekuracyjna */}
                        <div className="flex justify-between items-center">
                          <div className="flex-col">
                            <span>Polisa (USD)</span>
                            <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>-25% wzrostu inflacji</span>
                          </div>
                          {state.inflationUpgrades?.['polisaAsekuracyjna'] ? (
                            <span style={{color: '#00ffff'}}>KUPIONE</span>
                          ) : (
                            <button onClick={() => buyInflationUpgrade('polisaAsekuracyjna', 'dollars', 2500)} style={{padding: '2px 5px', fontSize: '0.75rem'}}>Kup (2500$)</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel" style={{borderColor: 'var(--prl-dark-gray)', color: 'var(--prl-gray)', marginBottom: '20px', textAlign: 'center', padding: '15px'}}>
                  <h3 style={{color: 'var(--prl-gray)', fontSize: '1rem', marginTop: 0}}>KANTOR I SPEKULACJA (BLOKADA)</h3>
                  <p style={{fontSize: '0.85rem', margin: 0}}>Te opcje handlu walutowego i spekulacji staną się dostępne po emigracji do Stanów Zjednoczonych w 1989 roku (Faza F).</p>
                </div>
              )}
              {/* PANEL AUKCJI TOWARÓW LUKSUSOWYCH */}
              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>LICYTACJA TOWARÓW LUKSUSOWYCH</h2>
                {state.auction ? (
                  <div className="flex-col gap-3" style={{padding: '10px', background: 'rgba(50, 0, 50, 0.3)', border: '1px dashed #ff33ff'}}>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong style={{color: '#ff33ff', fontSize: '1.2rem'}}>{state.auction.itemName}</strong>
                        <div style={{fontSize: '0.85rem', color: 'var(--prl-gray)', marginTop: '2px'}}>
                          Status: {state.auction.highestBidder === 'Gracz' ? (
                            <span style={{color: 'var(--dollar-green)'}}>PROWADZISZ!</span>
                          ) : state.auction.highestBidder === 'Cena Wywoławcza' ? (
                            <span style={{color: 'var(--prl-yellow)'}}>Czekamy na pierwszą ofertę</span>
                          ) : (
                            <span style={{color: 'var(--prl-red)'}}>Przelicytowany przez {state.auction.highestBidder}!</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-col text-right">
                        <span style={{fontSize: '1.1rem', color: 'var(--prl-yellow)'}}>
                          Oferta: {state.auction.currentBid} {state.auction.currency === 'dollars' ? '$' : 'zł'}
                        </span>
                        <span style={{fontSize: '0.8rem', color: 'var(--prl-gray)'}}>
                          Lider: {state.auction.highestBidder}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar / Time left */}
                    <div style={{marginTop: '5px'}}>
                      <div style={{fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', marginBottom: '3px'}}>
                        <span>Pozostały czas: {Math.max(0, Math.floor(state.auction.timeLeft))} sek.</span>
                        <span style={{color: '#ff33ff'}}>{Math.floor((state.auction.timeLeft / 45) * 100)}%</span>
                      </div>
                      <div style={{width: '100%', height: '12px', background: '#222', border: '1px solid #ff33ff', padding: '1px', boxSizing: 'border-box'}}>
                        <div style={{width: `${Math.max(0, Math.min(100, (state.auction.timeLeft / 45) * 100))}%`, height: '100%', background: 'linear-gradient(90deg, #880088, #ff33ff)'}} />
                      </div>
                    </div>

                    {/* Licytuj button & Increment */}
                    {(() => {
                      const increment = state.auction.currency === 'dollars' ? 50 : 1000;
                      const nextBid = state.auction.currentBid + increment;
                      const hasEnough = state.auction.currency === 'dollars' ? state.dollars >= nextBid : state.pln >= nextBid;
                      const isLeading = state.auction.highestBidder === 'Gracz';
                      
                      return (
                        <div className="flex gap-4 items-center mt-2">
                          <button 
                            onClick={bidInAuction}
                            disabled={isLeading || !hasEnough}
                            style={{
                              flex: 1, 
                              borderColor: isLeading ? 'var(--dollar-green)' : '#ff33ff', 
                              color: isLeading ? 'var(--dollar-green)' : '#ff33ff',
                              backgroundColor: isLeading ? 'rgba(0, 100, 0, 0.1)' : 'transparent',
                              fontSize: '1.2rem',
                              padding: '8px'
                            }}
                          >
                            {isLeading ? 'JESTEŚ LIDEREM' : `LICYTUJ (+${increment} ${state.auction.currency === 'dollars' ? '$' : 'zł'})`}
                          </button>
                        </div>
                      );
                    })()}

                    {/* Log licytacji */}
                    <div style={{marginTop: '10px', padding: '5px', background: 'rgba(0,0,0,0.4)', border: '1px solid #444'}}>
                      <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)', borderBottom: '1px solid #333', paddingBottom: '3px', marginBottom: '5px'}}>Przebieg licytacji:</div>
                      <div style={{fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '220px', overflowY: 'auto'}}>
                        {(state.auction.biddingLog || []).slice(-4).map((log, i) => (
                          <div key={i} style={{color: log.includes('Gracz') ? 'var(--dollar-green)' : 'var(--prl-gray)'}}>{log}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{padding: '15px', textAlign: 'center', color: 'var(--prl-gray)'}}>
                    {LUXURY_ITEMS.filter(li => !state.ownedLuxuryItems?.[li.id]).length > 0 ? (
                      <p>Kolejna licytacja towaru luksusowego rozpocznie się za: <strong style={{color: '#ff33ff'}}>{Math.max(0, Math.floor(state.nextAuctionIn))}</strong> sek.</p>
                    ) : (
                      <p style={{color: 'var(--dollar-green)'}}>★ Posiadasz wszystkie dostępne towary luksusowe! Jesteś prawdziwym Królem Czerwonego Salonu! ★</p>
                    )}
                  </div>
                )}
              </div>

              {/* PANEL POSIADANYCH TOWARÓW LUKSUSOWYCH */}
              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>TWÓJ SALON DOBROBYTU (AKTYWNE TOWARY LUKSUSOWYCH)</h2>
                <div style={{display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '0.9rem', flexWrap: 'wrap'}}>
                  <div>
                    Skumulowana redukcja podejrzeń: <strong style={{color: 'var(--prl-yellow)'}}>-{Math.floor(calculateLuxurySuspicionReduction(state.ownedLuxuryItems) * 100)}%</strong>
                  </div>
                  <div>
                    Premia prestiżu przy ucieczce: <strong style={{color: 'var(--dollar-green)'}}>+{Math.floor(calculateLuxuryPrestigeBonus(state.ownedLuxuryItems) * 100)}% DM</strong>
                  </div>
                </div>

                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '15px', marginTop: '10px'}}>
                  {LUXURY_ITEMS.map(item => {
                    const owned = !!state.ownedLuxuryItems?.[item.id];
                    return (
                      <div 
                        key={item.id} 
                        className="panel" 
                        style={{
                          margin: 0, 
                          padding: '10px', 
                          borderColor: owned ? '#ff33ff' : '#444', 
                          background: owned ? 'rgba(100, 0, 100, 0.1)' : 'rgba(0,0,0,0.3)',
                          opacity: owned ? 1.0 : 0.4
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <strong style={{color: owned ? '#ff33ff' : 'var(--prl-gray)'}}>{item.name}</strong>
                          <span style={{fontSize: '0.8rem', color: owned ? 'var(--dollar-green)' : 'var(--prl-red)'}}>
                            {owned ? '✓ POSIADASZ' : '○ BRAK'}
                          </span>
                        </div>
                        <p style={{fontSize: '0.8rem', margin: '5px 0 0 0', color: 'var(--prl-gray)'}}>{item.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="panel" style={{borderColor: '#ff33ff'}}>
                <h2 style={{color: '#ff33ff'}}>TAJNE OFERTY SPECJALNE (ROTACYJNE)</h2>
                <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                   Pojawiają się z tajnych transportów kolejowych co 5 minut. Każda oferta może być zakupiona tylko raz!
                   Oferty wygasają za: {Math.max(0, Math.floor((300000 - (realTime.getTime() - state.lastMarketRefresh)) / 1000))} sek.
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px'}}>
                   {state.blackMarketOffers.map(offer => {
                      const costDesc = offer.costPln !== undefined ? `${offer.costPln} zł` :
                                       offer.costTalony !== undefined ? `${offer.costTalony} Talonów` :
                                       `${offer.costRuble} ${pluralPL(offer.costRuble || 0, 'rubel', 'ruble', 'rubli')}`;
                                       
                      const isAffordable = offer.costPln !== undefined ? state.pln >= offer.costPln :
                                           offer.costTalony !== undefined ? state.talony >= offer.costTalony :
                                           state.ruble >= (offer.costRuble || 0);
                                           
                      return (
                         <div key={offer.id} className="panel" style={{margin: 0, padding: '10px', borderColor: '#880088', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'}}>
                            <div>
                               <strong style={{color: '#ff33ff', fontSize: '0.9rem'}}>{offer.name}</strong>
                               <div style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginTop: '5px'}}>
                                  Dostajesz: {offer.amount} szt.
                               </div>
                            </div>
                            <button 
                               style={{marginTop: '10px', width: '100%', borderColor: '#ff33ff', color: '#ff33ff'}}
                               disabled={!isAffordable}
                               onClick={() => buyBlackMarketOffer(offer.id)}
                            >
                               Kup za {costDesc}
                            </button>
                         </div>
                      );
                   })}
                   {state.blackMarketOffers.length === 0 && (
                      <p style={{gridColumn: 'span 3', color: 'var(--prl-gray)'}}>Brak ofert specjalnych w tym momencie. Poczekaj na dostawę!</p>
                   )}
                </div>
              </div>

              <div className="game-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', padding: 0, border: 'none', background: 'transparent'}}>
                 {/* ZAKUPY BEZ KOLEJKI */}
                 <div className="panel" style={{borderColor: '#ff33ff'}}>
                    <h2 style={{color: '#ff33ff'}}>ZAKUPY BEZ KOLEJKI (INSTANT)</h2>
                    <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                       Kupuj towary od ręki od paserów. Kosztują 2.5x więcej i generują Podejrzenie Milicji!
                    </p>
                    <div style={{maxHeight: '400px', overflowY: 'auto', paddingRight: '10px'}}>
                       {QUEUE_ITEMS.map(item => {
                          const bmAchMult = (state.unlockedAchievements?.['black_market_1'] ? 0.90 : 1) * (state.unlockedAchievements?.['black_market_2'] ? 0.80 : 1);
                          const cost = item.costPln === 0 ? 25 : Math.floor(item.costPln * 2.5);
                          const finalCost = Math.floor(cost * bmAchMult);
                          const suspAchMult = (state.unlockedAchievements?.['pol_rank_1'] ? 0.95 : 1) * (state.unlockedAchievements?.['pol_rank_2'] ? 0.90 : 1);
                          const suspicionAdd = Math.max(1, Math.floor(Math.floor(item.costPln / 50) * suspAchMult));
                          return (
                             <div key={item.id} className="flex justify-between items-center mt-3" style={{borderBottom: '1px solid #333', paddingBottom: '5px', fontSize: '0.85rem'}}>
                                <div className="flex-col">
                                   <span>{item.name}</span>
                                   {state.partyRank !== 'minister' && (
                                      <span style={{fontSize: '0.75rem', color: 'var(--prl-red)'}}>
                                         +{suspicionAdd}% Podejrzenia
                                      </span>
                                   )}
                                </div>
                                <button 
                                   style={{borderColor: '#ff33ff', color: '#ff33ff', padding: '3px 10px', fontSize: '0.8rem'}}
                                   disabled={state.pln < finalCost}
                                   onClick={() => buyInstantCzarnyRynek(item.id)}
                                >
                                   Kup ({finalCost} zł)
                                </button>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 {/* CINKCIARZ PREMIUM I INNA WYMIANA */}
                 <div className="flex-col gap-4">
                    <div className="panel" style={{borderColor: '#ff33ff'}}>
                        <h2 style={{color: '#ff33ff'}}>CINKCIARZ PREMIUM</h2>
                        <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                           Kupuj dolary bez ryzyka wpadki. Kurs jest o 30% wyższy, ale Milicja nie ma się do czego przyczepić.
                        </p>
                        {(() => {
                           const currentBaseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
                           const premiumRate = Math.floor(currentBaseRate * 1.30);
                           return (
                              <>
                                 <div className="flex justify-between items-center text-dollar" style={{marginBottom: '10px', fontSize: '0.9rem'}}>
                                   <span>Kurs premium:</span>
                                   <span style={{color: '#ff33ff'}}>1$ = {premiumRate} zł</span>
                                 </div>
                                 <button 
                                   style={{borderColor: '#ff33ff', color: '#ff33ff', width: '100%'}}
                                   disabled={state.pln < premiumRate}
                                   onClick={buyDollarPremium}
                                 >
                                   Kup 1$ bez Podejrzenia (-{premiumRate} zł)
                                 </button>
                              </>
                           );
                        })()}
                     </div>

                    <div className="panel" style={{borderColor: '#ff33ff'}}>
                       <h2 style={{color: '#ff33ff'}}>KANTOR TALONÓW I RUBLI</h2>
                       <p style={{fontSize: '0.8rem', marginBottom: '10px', color: 'var(--prl-gray)'}}>
                          Wymieniaj alternatywne waluty na niezbędne zasoby.
                       </p>
                       <div className="flex-col gap-3">
                          <div className="flex justify-between items-center" style={{borderBottom: '1px solid #333', paddingBottom: '10px'}}>
                             <div className="flex-col">
                                <span>Wymień Talony na Kartki</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>
                                  Koszt: {state.activeEvent === 'stocznia' ? '1 Talon' : '2 Talony'} = Otrzymasz: 3 Kartki
                                  {state.activeEvent === 'stocznia' && <span style={{color: 'var(--pewex-blue)', marginLeft: '5px'}}>(STRAJK - TANIEJ!)</span>}
                                </span>
                             </div>
                             <button 
                                disabled={state.talony < (state.activeEvent === 'stocznia' ? 1 : 2)} 
                                onClick={exchangeTalonyForKartki}
                                style={{borderColor: '#5bc0de', color: '#5bc0de'}}
                             >
                                Wymień
                             </button>
                          </div>
                          
                          <div className="flex justify-between items-center" style={{paddingTop: '5px'}}>
                             <div className="flex-col">
                                <span>Wymień Ruble na Dolary</span>
                                <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Koszt: 10 Rubli = Otrzymasz: $1</span>
                             </div>
<button 
                                disabled={state.ruble < 10} 
                                onClick={exchangeRubleForDollars}
                                style={{borderColor: '#ff4500', color: '#ff4500'}}
                             >
                                Wymień
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
           </div>
  );
});

// [Claude] KIERUNEK 4: default export dla React.lazy (podzial paczki JS per zakladka)
export default TabCzarnyRynek;
