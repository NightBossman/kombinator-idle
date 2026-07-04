import React, { useContext, useState } from 'react';
import { GameApiContext } from './GameApiContext';
import { POLISH_DEAL_TAXES } from '../game/items';
import { wiborInstallmentPerSec, polishDealTaxPerSec, usRiskGrowthRate, energyPowerUpkeepPln, grossPassiveIncomePlnPerSec } from '../game/formulas';
import { fmtNum } from '../utils/format';

export const TabPolskiLad: React.FC = React.memo(() => {
  const api = useContext(GameApiContext);
  const [subTab, setSubTab] = useState<'taxes' | 'credit' | 'energy'>('taxes');
  const [loanInput, setLoanInput] = useState<string>('1000000');
  const [repayInput, setRepayInput] = useState<string>('1000000');

  if (!api) return null;

  const {
    state,
    changeTaxForm,
    takePlnLoan,
    payPlnLoan,
    triggerCreditHolidays,
    buyAccountingOffice,
    buyWindTurbine
  } = api;

  // Obliczenia wartości pochodnych
  const grossIncome = grossPassiveIncomePlnPerSec(state);
  const wiborCost = wiborInstallmentPerSec(state);
  const taxCost = polishDealTaxPerSec(state, grossIncome);
  const usRiskRate = usRiskGrowthRate(state, grossIncome);
  const energyCost = energyPowerUpkeepPln(state);

  const accountingCost = 500000 * Math.pow(1.8, state.accountingOffices || 0);
  const windTurbineCost = 2000000 * Math.pow(2.0, state.windTurbines || 0);

  const currentWiborRateInterest = state.wiborRate + 2.0;

  // Wybrana forma opodatkowania
  const activeTaxInfo = POLISH_DEAL_TAXES.find(t => t.id === state.taxForm) || POLISH_DEAL_TAXES[0];

  return (
    <div className="panel" style={{ borderColor: '#27ae60', fontFamily: 'monospace' }}>
      <h2 style={{ color: '#27ae60', marginTop: 0, borderBottom: '1px solid #27ae60', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>📉 POLSKI ŁAD, WIBOR I ENERGIA (LATA 2022-2023)</span>
        <span style={{ fontSize: '0.8rem', color: '#27ae60', textShadow: '0 0 3px #27ae60' }}>SYSTEM: ONLINE</span>
      </h2>

      {/* Nawigacja sub-tabów */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setSubTab('taxes')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'taxes' ? '#27ae60' : 'transparent',
            color: subTab === 'taxes' ? '#000' : '#27ae60',
            borderColor: '#27ae60',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ⚖️ POLSKI ŁAD & URZĄD SKARBOWY
        </button>
        <button
          onClick={() => setSubTab('credit')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'credit' ? '#2980b9' : 'transparent',
            color: subTab === 'credit' ? '#000' : '#2980b9',
            borderColor: '#2980b9',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          🏦 KREDYT OBROTOWY & WIBOR
        </button>
        <button
          onClick={() => setSubTab('energy')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'energy' ? '#e67e22' : 'transparent',
            color: subTab === 'energy' ? '#000' : '#e67e22',
            borderColor: '#e67e22',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ⚡ KRYZYS ENERGETYCZNY & WIATR
        </button>
      </div>

      {/* SUB-TAB: PODATKI */}
      {subTab === 'taxes' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Panel bilansu skarbowego */}
            <div className="panel" style={{ borderColor: '#27ae60', background: 'rgba(39, 174, 96, 0.05)' }}>
              <h3 style={{ color: '#27ae60', marginTop: 0 }}>📊 ROZLICZENIE PODATKOWE</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Pasywne PLN brutto: <strong style={{ color: '#33ff33' }}>+{fmtNum(grossIncome, 2)} PLN/s</strong></div>
                <div>Podatek Polski Ład: <strong style={{ color: '#ff6666' }}>-{fmtNum(taxCost, 2)} PLN/s</strong></div>
                <div>Aktualna forma: <strong style={{ color: '#27ae60' }}>{activeTaxInfo.name}</strong></div>
                <div style={{ borderTop: '1px dashed #444', marginTop: '10px', paddingTop: '10px' }}>
                  Ryzyko kontroli US: 
                  <strong style={{ color: state.usRiskLevel > 75 ? '#ff3333' : state.usRiskLevel > 40 ? '#f1c40f' : '#27ae60', marginLeft: '5px' }}>
                    {state.usRiskLevel.toFixed(2)}%
                  </strong>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#222', border: '1px solid #444', borderRadius: '3px', marginTop: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${state.usRiskLevel}%`, height: '100%', background: state.usRiskLevel > 75 ? '#ff3333' : state.usRiskLevel > 40 ? '#f1c40f' : '#27ae60', transition: 'width 0.5s ease-out' }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', marginTop: '5px' }}>
                  Przyrost ryzyka: <span style={{ color: '#e74c3c' }}>+{usRiskRate.toFixed(6)} %/s</span> (zależy od formy podatku)
                </div>
              </div>
            </div>

            {/* Panel biur rachunkowych */}
            <div className="panel" style={{ borderColor: '#27ae60' }}>
              <h3 style={{ color: '#27ae60', marginTop: 0 }}>🏢 BIURA RACHUNKOWE</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--prl-gray)', margin: '0 0 10px 0' }}>
                Zatrudniaj certyfikowanych księgowych, aby amortyzować przyrost kontroli skarbowej US. Każde biuro zmniejsza tempo przyrostu ryzyka o 15% (maksymalnie o 90%).
              </p>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
                <div>Posiadane biura: <strong style={{ color: '#27ae60' }}>{state.accountingOffices || 0}</strong></div>
                <div>Redukcja ryzyka: <strong style={{ color: '#33ff33' }}>-{Math.min(90, (state.accountingOffices || 0) * 15)}%</strong></div>
                <div>Koszt następnego biura: <strong style={{ color: 'var(--prl-yellow)' }}>{accountingCost.toLocaleString('pl-PL')} PLN</strong></div>
              </div>
              <button
                onClick={buyAccountingOffice}
                disabled={state.pln < accountingCost}
                className="btn-action"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: state.pln >= accountingCost ? '#27ae60' : '#333',
                  color: state.pln >= accountingCost ? '#000' : '#777',
                  borderColor: state.pln >= accountingCost ? '#27ae60' : '#444',
                  cursor: state.pln >= accountingCost ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                KUP BIURO RACHUNKOWE
              </button>
            </div>
          </div>

          {/* Formy opodatkowania */}
          <div className="panel" style={{ borderColor: '#27ae60' }}>
            <h3 style={{ color: '#27ae60', marginTop: 0, borderBottom: '1px dashed #27ae60', paddingBottom: '8px' }}>📋 WYBÓR FORMY OPODATKOWANIA POLSKIEGO ŁADU</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {POLISH_DEAL_TAXES.map(tax => {
                const isCurrent = state.taxForm === tax.id;
                return (
                  <div
                    key={tax.id}
                    style={{
                      border: `1px solid ${isCurrent ? '#27ae60' : '#444'}`,
                      background: isCurrent ? 'rgba(39, 174, 96, 0.08)' : 'transparent',
                      padding: '12px',
                      borderRadius: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}
                  >
                    {isCurrent && (
                      <span style={{ position: 'absolute', top: '5px', right: '5px', fontSize: '0.65rem', background: '#27ae60', color: '#000', padding: '1px 4px', fontWeight: 'bold', borderRadius: '3px' }}>
                        AKTYWNY
                      </span>
                    )}
                    <div>
                      <strong style={{ color: isCurrent ? '#27ae60' : '#fff', fontSize: '0.95rem' }}>{tax.name}</strong>
                      <p style={{ fontSize: '0.75rem', color: 'var(--prl-gray)', margin: '8px 0' }}>{tax.desc}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', marginTop: '8px' }}>
                        Mnożnik ryzyka US: <strong style={{ color: tax.usRiskFactor > 1 ? '#ff3333' : '#27ae60' }}>{tax.usRiskFactor}x</strong>
                      </div>
                      <button
                        onClick={() => changeTaxForm(tax.id)}
                        disabled={isCurrent}
                        style={{
                          width: '100%',
                          padding: '5px',
                          marginTop: '10px',
                          backgroundColor: isCurrent ? '#333' : '#27ae60',
                          color: isCurrent ? '#777' : '#000',
                          border: 'none',
                          cursor: isCurrent ? 'default' : 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      >
                        WYBIERZ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: KREDYT PLN & WIBOR */}
      {subTab === 'credit' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Status kredytu */}
            <div className="panel" style={{ borderColor: '#2980b9', background: 'rgba(41, 128, 185, 0.05)' }}>
              <h3 style={{ color: '#2980b9', marginTop: 0 }}>📊 DEBET W PLN (WIBOR)</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Aktualne zadłużenie: <strong style={{ color: '#e74c3c' }}>{fmtNum(state.plnDebt || 0, 2)} PLN</strong></div>
                <div>Wskaźnik WIBOR: <strong style={{ color: 'var(--prl-yellow)' }}>{state.wiborRate.toFixed(2)}%</strong></div>
                <div>Oprocentowanie banku: <strong style={{ color: 'var(--prl-yellow)' }}>{currentWiborRateInterest.toFixed(2)}%</strong> <span style={{ fontSize: '0.75rem', color: 'var(--prl-gray)' }}>(WIBOR + 2% marży)</span></div>
                <div>Rata odsetkowa PLN/s: <strong style={{ color: '#ff6666' }}>-{fmtNum(wiborCost, 2)} PLN/s</strong></div>
                
                {state.creditHolidaysTimer > 0 ? (
                  <div style={{ borderTop: '1px dashed #2980b9', marginTop: '10px', paddingTop: '10px', color: '#2ecc71' }}>
                    🏖️ Aktywne Wakacje Kredytowe: <strong>{state.creditHolidaysTimer.toFixed(1)}s</strong>
                  </div>
                ) : state.creditHolidaysCooldown > 0 ? (
                  <div style={{ borderTop: '1px dashed #2980b9', marginTop: '10px', paddingTop: '10px', color: 'var(--prl-gray)' }}>
                    ⏳ Cooldown Wakacji: <strong>{state.creditHolidaysCooldown.toFixed(1)}s</strong>
                  </div>
                ) : (
                  <div style={{ borderTop: '1px dashed #2980b9', marginTop: '10px', paddingTop: '10px', color: '#2980b9' }}>
                    🏖️ Wakacje kredytowe gotowe do aktywacji.
                  </div>
                )}
              </div>
            </div>

            {/* Wakacje Kredytowe & Obsługa */}
            <div className="panel" style={{ borderColor: '#2980b9' }}>
              <h3 style={{ color: '#2980b9', marginTop: 0 }}>🏖️ WAKACJE KREDYTOWE</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--prl-gray)', margin: '0 0 15px 0' }}>
                Zawiesza pobieranie rat odsetkowych na 60 sekund. Możliwość ponownej aktywacji po 120 sekundach cooldownu. Wykorzystaj to w chwilach kryzysu płynnościowego.
              </p>
              <button
                onClick={triggerCreditHolidays}
                disabled={state.creditHolidaysTimer > 0 || state.creditHolidaysCooldown > 0 || (state.plnDebt || 0) <= 0}
                className="btn-action"
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: (state.creditHolidaysTimer > 0 || state.creditHolidaysCooldown > 0 || (state.plnDebt || 0) <= 0) ? '#333' : '#2980b9',
                  color: (state.creditHolidaysTimer > 0 || state.creditHolidaysCooldown > 0 || (state.plnDebt || 0) <= 0) ? '#777' : '#fff',
                  borderColor: (state.creditHolidaysTimer > 0 || state.creditHolidaysCooldown > 0 || (state.plnDebt || 0) <= 0) ? '#444' : '#2980b9',
                  cursor: (state.creditHolidaysTimer > 0 || state.creditHolidaysCooldown > 0 || (state.plnDebt || 0) <= 0) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🏖️ AKTYWUJ WAKACJE KREDYTOWE
              </button>
            </div>
          </div>

          {/* Obsługa zaciągania i spłaty */}
          <div className="panel" style={{ borderColor: '#2980b9' }}>
            <h3 style={{ color: '#2980b9', marginTop: 0, borderBottom: '1px dashed #2980b9', paddingBottom: '8px' }}>💰 OBSŁUGA ZADŁUŻENIA OBROTOWEGO</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', marginTop: '15px' }}>
              
              {/* Zaciągnij */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Kwota pożyczki (PLN):</label>
                <input
                  type="number"
                  value={loanInput}
                  onChange={e => setLoanInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    fontFamily: 'inherit',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={() => takePlnLoan(Number(loanInput))}
                  disabled={Number(loanInput) <= 0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#27ae60',
                    color: '#000',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  ZACIĄGNIJ KREDYT
                </button>
              </div>

              {/* Spłać */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px' }}>Kwota spłaty (PLN):</label>
                <input
                  type="number"
                  value={repayInput}
                  onChange={e => setRepayInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: '#222',
                    border: '1px solid #444',
                    color: '#fff',
                    fontFamily: 'inherit',
                    marginBottom: '10px'
                  }}
                />
                <button
                  onClick={() => payPlnLoan(Number(repayInput))}
                  disabled={Number(repayInput) <= 0 || state.pln < 1 || (state.plnDebt || 0) <= 0}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  SPŁAĆ KREDYT
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: KRYZYS ENERGETYCZNY */}
      {subTab === 'energy' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Status kryzysu */}
            <div className="panel" style={{ borderColor: '#e67e22', background: 'rgba(230, 126, 34, 0.05)' }}>
              <h3 style={{ color: '#e67e22', marginTop: 0 }}>🔌 ZASILANIE & KRYZYS PRĄDU</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Koszt prądu: <strong style={{ color: '#ff6666' }}>-{fmtNum(energyCost, 2)} PLN/s</strong></div>
                <div>Status kryzysu: <strong style={{ color: '#ff3333' }}>POTROJONA STAWKA (3x)</strong></div>
                <div style={{ borderTop: '1px dashed #444', marginTop: '10px', paddingTop: '10px' }}>
                  Turbiny wiatrowe: <strong style={{ color: '#e67e22' }}>{state.windTurbines || 0}</strong>
                </div>
                <div>
                  Obniżka kosztu prądu: <strong style={{ color: '#33ff33' }}>-{(100 * (1 - Math.pow(0.75, state.windTurbines || 0))).toFixed(1)}%</strong>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', marginTop: '5px' }}>
                  🟢 Fotowoltaika z Fazy X: <span style={{ color: state.aiUpgrades?.['fotowoltaika'] ? '#33ff33' : 'var(--prl-gray)' }}>
                    {state.aiUpgrades?.['fotowoltaika'] ? 'Aktywna (-40% prądu z koparek)' : 'Niezakupiona'}
                  </span>
                </div>
              </div>
            </div>

            {/* Turbiny Wiatrowe */}
            <div className="panel" style={{ borderColor: '#e67e22' }}>
              <h3 style={{ color: '#e67e22', marginTop: 0 }}>💨 TURBINY WIATROWE</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--prl-gray)', margin: '0 0 10px 0' }}>
                Zainwestuj we własną generację wiatrową. Każda turbina wiatrowa obniża całkowity rachunek za prąd (z koparek krypto i biur Mordor) o 25% (efekt kumuluje się multiplikatywnie).
              </p>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '15px' }}>
                <div>Koszt następnej turbiny: <strong style={{ color: 'var(--prl-yellow)' }}>{windTurbineCost.toLocaleString('pl-PL')} PLN</strong></div>
              </div>
              <button
                onClick={buyWindTurbine}
                disabled={state.pln < windTurbineCost}
                className="btn-action"
                style={{
                  width: '100%',
                  padding: '8px',
                  backgroundColor: state.pln >= windTurbineCost ? '#e67e22' : '#333',
                  color: state.pln >= windTurbineCost ? '#000' : '#777',
                  borderColor: state.pln >= windTurbineCost ? '#e67e22' : '#444',
                  cursor: state.pln >= windTurbineCost ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold'
                }}
              >
                KUP TURBINĘ WIATROWĄ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TabPolskiLad.displayName = 'TabPolskiLad';
export default TabPolskiLad;
