// [Claude] KIERUNEK 1.2: zakladka 'offshore' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { NOMENKLATURA_COMPANIES, OFFSHORE_DEPOSITS } from '../game/items';
import { fmtNum } from '../utils/format';
import { useGameApi } from './GameApiContext';

export const TabOffshore = memo(function TabOffshore() {
  const { createOffshoreDeposit, offshoreDepositAmount, offshoreExchangeAmount, offshoreTransferAmount, offshoreWashAmount, openSwissAccount, payOffshoreCredit, registerLiechtensteinTrust, sendOffshoreCourier, setOffshoreDepositAmount, setOffshoreExchangeAmount, setOffshoreTransferAmount, setOffshoreWashAmount, state, takeOffshoreCredit, washOffshoreMoney, wireTransferToSwiss, zurichExchange } = useGameApi();
  return (() => {
           const isUnlocked = state.swissAccountUnlocked;
           const isInterpolLockdown = state.interpolLockdownTimeLeft > 0;
           
           if (!isUnlocked) {
             return (
               <div className="panel flex-col items-center justify-center text-center" style={{borderColor: 'gold', padding: '40px 20px', minHeight: '400px', backgroundColor: '#07162c'}}>
                 <h2 style={{color: 'gold', fontSize: '2rem', textShadow: '0 0 10px rgba(255, 215, 0, 0.3)', margin: '0 0 15px 0'}}>🇨🇭 SZWAJCARSKI BANK OFFSHORE (ZURYCH)</h2>
                 <p style={{maxWidth: '600px', fontSize: '1rem', color: '#b0c4de', lineHeight: '1.6', margin: '0 0 30px 0'}}>
                   Załóż tajne konto numeryczne w szwajcarskim banku. Pozwoli Ci to zabezpieczyć kapitał przed szalejącą w kraju hiperinflacją, inwigilacją Służby Bezpieczeństwa oraz lokować wolne dewizy na oprocentowanych lokatach terminowych.
                 </p>
                 <div style={{display: 'flex', gap: '20px', justifyContent: 'center', width: '100%', maxWidth: '500px'}}>
                   <button 
                     onClick={() => openSwissAccount('pln')}
                     disabled={state.pln < 250000}
                     style={{
                       flex: 1,
                       padding: '15px',
                       borderColor: 'gold',
                       color: 'gold',
                       backgroundColor: 'transparent',
                       fontSize: '1rem'
                     }}
                   >
                     Otwórz za gotówkę<br/>
                     <strong>250 000 zł</strong>
                   </button>
                   <button 
                     onClick={() => openSwissAccount('dollars')}
                     disabled={state.dollars < 5000}
                     style={{
                       flex: 1,
                       padding: '15px',
                       borderColor: 'var(--pewex-blue)',
                       color: 'var(--pewex-blue)',
                       backgroundColor: 'transparent',
                       fontSize: '1rem'
                     }}
                   >
                     Otwórz za dewizy<br/>
                     <strong>$5 000 USD</strong>
                   </button>
                 </div>
               </div>
             );
           }

           let totalAssetValue = 0;
           NOMENKLATURA_COMPANIES.forEach(comp => {
             const companyState = state.nomenklaturaCompanies?.[comp.id];
             if (companyState && companyState.registered) {
               totalAssetValue += comp.costPln;
               const assetLevel = companyState.assetLevel || 0;
               const baseUpgradeCost = Math.floor(comp.costPln * 0.5);
               for (let i = 0; i < assetLevel; i++) {
                 totalAssetValue += Math.round(baseUpgradeCost * Math.pow(2.2, i));
               }
             }
           });

           const baseRate = state.activeEvent === 'drozyzna' ? Math.floor(state.exchangeRate * 1.30) : state.exchangeRate;
           let inflationMult = 1 + (state.inflationPercent / 100);
           if (state.activeEvent === 'czarny_wtorek') inflationMult *= 2;
           const currentMarketRate = Math.floor(baseRate * inflationMult);
           const maxUsdCredit = currentMarketRate > 0 ? Math.floor((totalAssetValue * 0.5) / currentMarketRate) : 0;

           return (
             <div className="flex-col gap-4" style={{color: '#b0c4de'}}>
               {/* Nagłówek Konta */}
               <div className="panel" style={{borderColor: 'gold', backgroundColor: '#07162c', padding: '20px'}}>
                 <div className="flex justify-between items-center flex-wrap gap-4">
                   <div>
                     <span style={{fontSize: '0.85rem', color: '#8fa9c4'}}>SZWAJCARSKIE KONTO NUMERYCZNE:</span>
                     <h2 style={{margin: '2px 0 0 0', color: 'gold', fontSize: '1.8rem', letterSpacing: '2px'}}>{state.swissAccountNumber}</h2>
                   </div>
                   <div className="flex gap-4">
                     <div className="flex-col text-right" style={{background: 'rgba(255,215,0,0.05)', padding: '10px 20px', borderRadius: '4px', border: '1px solid rgba(255,215,0,0.2)'}}>
                       <span style={{fontSize: '0.75rem', color: '#8fa9c4'}}>SALDO PLN (OFFSHORE)</span>
                       <span style={{fontSize: '1.4rem', fontWeight: 'bold', color: 'gold'}}>{(state.swissBalancePln || 0).toLocaleString('pl-PL')} zł</span>
                     </div>
                     <div className="flex-col text-right" style={{background: 'rgba(0,225,217,0.05)', padding: '10px 20px', borderRadius: '4px', border: '1px solid rgba(0,225,217,0.2)'}}>
                       <span style={{fontSize: '0.75rem', color: '#8fa9c4'}}>SALDO USD (DEWIZY)</span>
                       <span style={{fontSize: '1.4rem', fontWeight: 'bold', color: '#00e1d9'}}>${(state.swissBalanceUsd || 0).toLocaleString('pl-PL')}</span>
                     </div>
                   </div>
                 </div>

                 {/* Interpol Tracker */}
                 <div style={{marginTop: '20px', borderTop: '1px solid #1a324f', paddingTop: '15px'}}>
                   <div className="flex justify-between items-center mb-1">
                     <span style={{fontSize: '0.8rem', color: 'var(--prl-red)'}}>🚨 MONITORING OPERACJI FINANSOWYCH (INTERPOL)</span>
                     <span style={{fontSize: '1rem', fontWeight: 'bold', color: 'var(--prl-red)'}}>{fmtNum((state.interpolSuspicion || 0), 1)}%</span>
                   </div>
                   <div style={{background: '#111', height: '10px', borderRadius: '3px', overflow: 'hidden'}}>
                     <div style={{
                       background: 'linear-gradient(90deg, #ff9900, #ff0000)',
                       width: `${state.interpolSuspicion || 0}%`,
                       height: '100%',
                       transition: 'width 0.2s ease'
                     }}></div>
                   </div>
                 </div>
               </div>

               {/* Interpol Block active */}
               {isInterpolLockdown && (
                 <div className="panel" style={{borderColor: 'var(--prl-red)', backgroundColor: 'rgba(255,0,0,0.05)', textAlign: 'center', padding: '15px', animation: 'pulse 1.5s infinite'}}>
                   <h3 style={{color: 'var(--prl-red)', margin: '0 0 5px 0'}}>⚠️ BLOKADA INTERPOLU AKTYWNA</h3>
                   <p style={{margin: 0, fontSize: '0.9rem'}}>
                     Dostęp do szwajcarskiego banku został zablokowany na czas audytu międzynarodowego. Przelewy i lokaty zamrożone.<br/>
                     Pozostało: <strong>{Math.round(state.interpolLockdownTimeLeft)} sekund</strong>.
                   </p>
                 </div>
               )}

               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                 {/* Kredyt Offshore */}
                 <div className="panel" style={{borderColor: state.offshoreCreditTaken > 0 ? 'var(--prl-yellow)' : 'var(--crt-border)'}}>
                   <h3>🏦 POŻYCZKA DEWIZOWA (KREDYT OFFSHORE)</h3>
                   <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                     Zaciągnij natychmiastowy kredyt w dolarach pod zastaw prywatnego majątku w Polsce. Opcja wymaga posiadania spółek nomenklaturowych. Spłata (wraz z prowizją 10%) musi nastąpić w ciągu 5 minut, inaczej bank zwindykuje zastaw (spadek poziomu leasingu maszyn w spółkach o 2 poziomy).
                   </p>

                   {state.offshoreCreditTaken <= 0 ? (
                     <div className="flex-col gap-2">
                       <div style={{fontSize: '0.85rem'}}>Twój majątek krajowy pozwala na pożyczenie do: <strong style={{color: '#00e1d9'}}>${maxUsdCredit.toLocaleString('pl-PL')} USD</strong></div>
                       <button 
                         disabled={maxUsdCredit <= 0 || isInterpolLockdown}
                         onClick={takeOffshoreCredit}
                         style={{width: '100%', padding: '10px', borderColor: maxUsdCredit > 0 ? '#00e1d9' : 'var(--prl-gray)', color: maxUsdCredit > 0 ? '#00e1d9' : 'var(--prl-gray)', backgroundColor: 'transparent'}}
                       >
                         Zaciągnij kredyt dewizowy (${maxUsdCredit.toLocaleString('pl-PL')} USD)
                       </button>
                     </div>
                   ) : (
                     <div className="flex-col gap-2">
                       <div style={{color: 'var(--prl-yellow)', fontWeight: 'bold'}}>Aktywny kredyt: ${state.offshoreCreditTaken.toLocaleString('pl-PL')} USD</div>
                       <div style={{fontSize: '0.85rem'}}>Pozostało czasu na spłatę: <strong style={{color: 'var(--prl-red)'}}>{Math.floor(state.offshoreCreditTimeLeft)}s</strong></div>
                       <div style={{fontSize: '0.85rem'}}>Koszt spłaty (kredyt + 10% prowizji): <strong style={{color: '#00e1d9'}}>${Math.round(state.offshoreCreditTaken * 1.10).toLocaleString('pl-PL')} USD</strong></div>
                       <button 
                         disabled={state.swissBalanceUsd < Math.round(state.offshoreCreditTaken * 1.10) || isInterpolLockdown}
                         onClick={payOffshoreCredit}
                         style={{width: '100%', padding: '10px', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)', backgroundColor: 'transparent', marginTop: '10px'}}
                       >
                         Spłać kredyt z konta szwajcarskiego (${Math.round(state.offshoreCreditTaken * 1.10).toLocaleString('pl-PL')} USD)
                       </button>
                     </div>
                   )}
                 </div>

                 {/* Liechtenstein Trust */}
                 <div className="panel" style={{borderColor: state.hasLiechtensteinTrust ? 'var(--dollar-green)' : 'var(--crt-border)'}}>
                   <h3>🛡️ FUNDACJA POWIERNICZA W LIECHTENSTEINIE</h3>
                   <p style={{fontSize: '0.8rem', color: 'var(--prl-gray)', marginBottom: '15px'}}>
                     Załóż prywatną fundację rodzinną w Vaduz (księstwo Liechtenstein). Chroni Twój zgromadzony w kraju majątek przed roszczeniami oraz konfiskatami SB/NIK. Fundacja redukuje utratę krajowych PLN z kontroli o 80% (95% z odznaczeniem).
                   </p>

                   {state.hasLiechtensteinTrust ? (
                     <div style={{background: 'rgba(0,255,0,0.05)', border: '1px solid var(--dollar-green)', color: 'var(--dollar-green)', padding: '10px', textAlign: 'center', fontWeight: 'bold', borderRadius: '3px'}}>
                       🛡️ TARCZA OFFSHORE VADUZ: AKTYWNA
                     </div>
                   ) : (
                     <button 
                       disabled={state.dollars < 20000}
                       onClick={registerLiechtensteinTrust}
                       style={{width: '100%', padding: '10px', borderColor: state.dollars >= 20000 ? 'var(--dollar-green)' : 'var(--prl-gray)', color: state.dollars >= 20000 ? 'var(--dollar-green)' : 'var(--prl-gray)', backgroundColor: 'transparent'}}
                     >
                       Zarejestruj fundację w Vaduz ($20 000 USD)
                     </button>
                   )}
                 </div>
               </div>

               {/* Operacje Dewizowe (dwie kolumny) */}
               <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                 {/* Kolumna 1: Przelewy i Pranie gotówki */}
                 <div className="flex-col gap-4">
                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'gold'}}>1. TRANSFER ŚRODKÓW DO ZURYCHU</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Przelej PLN lub USD ze swojej krajowej gotówki do Szwajcarii.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota transferu..."
                         value={offshoreTransferAmount}
                         onChange={e => setOffshoreTransferAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { wireTransferToSwiss(val, 'pln'); setOffshoreTransferAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem'}}
                       >
                         SWIFT (PLN)
                       </button>
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { wireTransferToSwiss(val, 'dollars'); setOffshoreTransferAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem', borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)'}}
                       >
                         SWIFT (USD)
                       </button>
                     </div>

                     <div className="flex gap-2 mt-2">
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { sendOffshoreCourier(val, 'pln'); setOffshoreTransferAmount(''); }
                         }}
                         style={{flex: 1, padding: '8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)'}}
                       >
                         Szmugiel kurierem (PLN)
                       </button>
                       <button 
                         disabled={!offshoreTransferAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreTransferAmount);
                           if (val > 0) { sendOffshoreCourier(val, 'dollars'); setOffshoreTransferAmount(''); }
                         }}
                         style={{flex: 1, padding: '8px', fontSize: '0.75rem', borderColor: 'var(--prl-yellow)', color: 'var(--prl-yellow)'}}
                       >
                         Szmugiel kurierem (USD)
                       </button>
                     </div>

                     {/* Aktywne przelewy/kurierzy */}
                     {((state.activeWireTransfers || []).length > 0 || (state.activeCouriers || []).length > 0) && (
                       <div style={{marginTop: '15px', borderTop: '1px solid #222', paddingTop: '10px'}}>
                         <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)', fontWeight: 'bold'}}>TRANSFERY W DRODZE:</span>
                         <div style={{maxHeight: '250px', overflowY: 'auto', marginTop: '5px'}}>
                           {(state.activeWireTransfers || []).map(w => (
                             <div key={w.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                               <span>⚡ SWIFT: {w.amount.toLocaleString('pl-PL')} {w.currency === 'pln' ? 'zł' : 'USD'}</span>
                               <span style={{color: 'gold'}}>Księgowanie: {Math.round(w.timeLeft)}s</span>
                             </div>
                           ))}
                           {(state.activeCouriers || []).map(c => (
                             <div key={c.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                               <span>🏃 Kurier: {c.amount.toLocaleString('pl-PL')} {c.currency === 'pln' ? 'zł' : 'USD'}</span>
                               <span style={{color: 'var(--prl-yellow)'}}>W podróży: {Math.round(c.timeLeft)}s</span>
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                   </div>

                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'var(--dollar-green)'}}>2. POLISA PRALNICZA (WYCOFANIE DO KRAJU)</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Wypłać PLN ze swojego konta szwajcarskiego z powrotem do Polski jako legalnie udokumentowany kapitał. Wprowadzenie tych środków natychmiast obniża krajowe Podejrzenie Milicji o 20%.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota prania PLN..."
                         value={offshoreWashAmount}
                         onChange={e => setOffshoreWashAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreWashAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreWashAmount);
                           if (val > 0) { washOffshoreMoney(val); setOffshoreWashAmount(''); }
                         }}
                         style={{padding: '8px 15px', borderColor: 'var(--dollar-green)', color: 'var(--dollar-green)'}}
                       >
                         Pierze gotówkę
                       </button>
                     </div>
                   </div>
                 </div>

                 {/* Kolumna 2: Inwestycje i Lokaty */}
                 <div className="flex-col gap-4">
                   <div className="panel flex-col gap-2">
                     <h3>3. KANTOR DEWIZOWY W ZURYCHU</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Bezpieczna i szybka wymiana walut offshore. Kurs: <strong style={{color: 'gold'}}>1 USD = {currentMarketRate.toLocaleString('pl-PL')} PLN</strong>.</p>
                     
                     <div className="flex gap-2 items-center" style={{marginTop: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota wymiany..."
                         value={offshoreExchangeAmount}
                         onChange={e => setOffshoreExchangeAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <button 
                         disabled={!offshoreExchangeAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreExchangeAmount);
                           if (val > 0) { zurichExchange(val, 'pln'); setOffshoreExchangeAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem'}}
                       >
                         {"PLN -> USD"}
                       </button>
                       <button 
                         disabled={!offshoreExchangeAmount || isInterpolLockdown}
                         onClick={() => {
                           const val = parseInt(offshoreExchangeAmount);
                           if (val > 0) { zurichExchange(val, 'usd'); setOffshoreExchangeAmount(''); }
                         }}
                         style={{padding: '8px 12px', fontSize: '0.8rem', borderColor: 'var(--pewex-blue)', color: 'var(--pewex-blue)'}}
                       >
                          {"USD -> PLN"}
                       </button>
                     </div>
                   </div>

                   <div className="panel flex-col gap-2">
                     <h3 style={{color: 'gold'}}>4. LOKATY TERMINOWE (TERM DEPOSITS)</h3>
                     <p style={{fontSize: '0.75rem', color: 'var(--prl-gray)'}}>Zamroź kapitał na lokacie, aby uzyskać wysokie stopy zwrotu po określonym czasie.</p>

                     <div className="flex gap-2 items-center" style={{marginTop: '5px', borderBottom: '1px solid #222', paddingBottom: '10px'}}>
                       <input 
                         type="number"
                         placeholder="Kwota lokaty..."
                         value={offshoreDepositAmount}
                         onChange={e => setOffshoreDepositAmount(e.target.value)}
                         style={{flex: 1, background: '#111', border: '1px solid #333', padding: '8px', color: '#fff'}}
                       />
                       <select 
                         id="offshore-dep-currency"
                         style={{background: '#111', border: '1px solid #333', padding: '8px', color: '#fff', fontSize: '0.8rem'}}
                       >
                         <option value="pln">PLN</option>
                         <option value="dollars">USD</option>
                       </select>
                     </div>

                     <div style={{maxHeight: '350px', overflowY: 'auto', paddingRight: '5px'}}>
                       {OFFSHORE_DEPOSITS.map(dep => {
                         const hasLaundry = state.unlockedAchievements?.['offshore_laundry'];
                         const interestMult = hasLaundry ? 1.20 : 1.00;
                         const ratePct = Math.round(dep.interestRate * interestMult * 100);

                         return (
                           <div key={dep.id} className="flex justify-between items-center mt-3" style={{borderBottom: '1px solid #222', paddingBottom: '8px'}}>
                             <div className="flex-col">
                               <span style={{fontWeight: 'bold', color: 'gold', fontSize: '0.85rem'}}>{dep.name} (+{ratePct}%)</span>
                               <span style={{fontSize: '0.7rem', color: 'var(--prl-gray)'}}>{dep.desc}</span>
                             </div>
                             <button 
                               disabled={!offshoreDepositAmount || isInterpolLockdown}
                               onClick={() => {
                                 const val = parseInt(offshoreDepositAmount);
                                 const cur = (document.getElementById('offshore-dep-currency') as HTMLSelectElement)?.value as 'pln' | 'dollars';
                                 if (val > 0) {
                                   createOffshoreDeposit(val, cur, dep.id);
                                   setOffshoreDepositAmount('');
                                 }
                               }}
                               style={{padding: '5px 10px', fontSize: '0.75rem', borderColor: 'gold', color: 'gold'}}
                             >
                               Otwórz
                             </button>
                           </div>
                         );
                       })}
                     </div>

                     {/* Aktywne lokaty */}
                     {(state.activeOffshoreDeposits || []).length > 0 && (
                       <div style={{marginTop: '15px', borderTop: '1px solid #222', paddingTop: '10px'}}>
                         <span style={{fontSize: '0.75rem', color: 'var(--prl-gray)', fontWeight: 'bold'}}>AKTYWNE LOKATY:</span>
                         <div style={{maxHeight: '250px', overflowY: 'auto', marginTop: '5px'}}>
                           {(state.activeOffshoreDeposits || []).map(d => {
                             const type = OFFSHORE_DEPOSITS.find(t => t.id === d.depositTypeId);
                             return (
                               <div key={d.id} className="flex justify-between items-center" style={{fontSize: '0.75rem', padding: '3px 0'}}>
                                 <span>📈 {type?.name || 'Lokata'}: {d.amount.toLocaleString('pl-PL')} {d.currency === 'pln' ? 'zł' : 'USD'}</span>
                                 <span style={{color: 'gold'}}>Czas: {Math.round(d.timeLeft)}s</span>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           );
         })();
});
