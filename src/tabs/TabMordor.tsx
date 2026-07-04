import { useState, memo } from 'react';
import { useGameApi } from './GameApiContext';
import { fmtNum, fmtShort } from '../utils/format';
import { playClick } from '../utils/audio';
import { MORDOR_UPGRADES, JDG_TAX_LEVELS, EURO_BOND_TYPES } from '../game/items';
import { mordorIncomePerSec, mordorMoraleDecayPerSec, mordorEmployeeUpkeepPerSec, jdgRiskGainPerSec } from '../game/formulas';

type SubTabId = 'biuro' | 'kadry' | 'obligacje';

const TabMordor = () => {
  const {
    state,
    buyMordorFloor,
    recruitMordorEmployee,
    buyMordorUpgrade,
    organizeMordorPizza,
    issueJdgContract,
    upgradeTaxLevel,
    buyEuroBond,
    sellEurosToPln
  } = useGameApi();

  const [subTab, setSubTab] = useState<SubTabId>('biuro');

  // Calculates active tax level info
  const taxLevel = JDG_TAX_LEVELS.find(l => l.level === state.jdgTaxOptimizationLevel) || JDG_TAX_LEVELS[0];
  const nextTaxLevel = JDG_TAX_LEVELS.find(l => l.level === (state.jdgTaxOptimizationLevel || 0) + 1);

  // General Mordor calculations
  const maxEmployees = state.mordorFloors * 10;
  const currentIncomeEur = mordorIncomePerSec(state);
  const currentUpkeepPln = mordorEmployeeUpkeepPerSec(state);
  const currentMoraleDecay = mordorMoraleDecayPerSec(state);
  const currentJdgRiskGain = jdgRiskGainPerSec(state);

  return (
    <div className="panel" style={{ border: '2px solid #8e44ad', boxShadow: '0 0 15px rgba(142, 68, 173, 0.3)' }}>
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #8e44ad', paddingBottom: '15px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#8e44ad', textShadow: '0 0 5px rgba(142, 68, 173, 0.4)' }}>
            🏢 MORDOR NA DOMANIEWSKIEJ (LATA 2010.)
          </h2>
          <span style={{ fontSize: '0.85em', color: 'var(--prl-gray)' }}>
            Witaj w stolicy polskiego korporacjonizmu. Wyzyskuj, optymalizuj podatki na B2B i spekuluj obligacjami.
          </span>
        </div>
        
        {/* Quick Stats Panel */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ backgroundColor: '#111', padding: '8px 12px', borderRadius: '4px', border: '1px solid #333', minWidth: '130px' }}>
            <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)' }}>Saldo w EUR</div>
            <strong style={{ color: '#00e1d9', fontSize: '1.2em' }}>{fmtNum(state.euros || 0, 2)} EUR</strong>
            <div style={{ fontSize: '0.7em', color: '#27ae60' }}>
              ~{fmtNum((state.euros || 0) * state.euroExchangeRate, 0)} PLN
            </div>
          </div>
          <div style={{ backgroundColor: '#111', padding: '8px 12px', borderRadius: '4px', border: '1px solid #333', minWidth: '130px' }}>
            <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)' }}>Kurs EUR/PLN</div>
            <strong style={{ color: '#f1c40f', fontSize: '1.1em' }}>{fmtNum(state.euroExchangeRate, 4)} PLN</strong>
          </div>
        </div>
      </div>

      {/* QUICK EXCHANGE TOOL */}
      {state.euros > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0, 225, 217, 0.1)', padding: '10px 15px', borderRadius: '6px', border: '1px solid rgba(0, 225, 217, 0.3)', marginBottom: '15px' }}>
          <span style={{ fontSize: '0.85em' }}>
            Potrzebujesz gotówki w PLN? Wymień swoje euro w oficjalnym kantorze NBP!
          </span>
          <button 
            onClick={() => { playClick(); sellEurosToPln(); }} 
            className="retro-button"
            style={{ padding: '6px 12px', fontSize: '0.85em', backgroundColor: '#00e1d9', color: '#000', fontWeight: 'bold' }}
          >
            Wymień EUR na PLN (+{fmtNum(state.euros * state.euroExchangeRate, 0)} PLN)
          </button>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#1b1b1b', padding: '6px', borderRadius: '6px' }}>
        <button 
          onClick={() => { playClick(); setSubTab('biuro'); }} 
          style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: subTab === 'biuro' ? '#8e44ad' : 'transparent', color: subTab === 'biuro' ? '#fff' : '#aaa' }}
        >
          🏢 KORPO BIURO
        </button>
        <button 
          onClick={() => { playClick(); setSubTab('kadry'); }} 
          style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: subTab === 'kadry' ? '#8e44ad' : 'transparent', color: subTab === 'kadry' ? '#fff' : '#aaa' }}
        >
          📄 KADRY B2B & PIP
        </button>
        <button 
          onClick={() => { playClick(); setSubTab('obligacje'); }} 
          style={{ flex: 1, padding: '10px', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer', backgroundColor: subTab === 'obligacje' ? '#8e44ad' : 'transparent', color: subTab === 'obligacje' ? '#fff' : '#aaa' }}
        >
          🇪🇺 OBLIGACJE EURO
        </button>
      </div>

      {/* ==================== SUB-TAB: BIURO ==================== */}
      {subTab === 'biuro' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Controls & Management */}
          <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ backgroundColor: '#161616', padding: '15px', borderRadius: '6px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#8e44ad', fontSize: '1.1em' }}>Struktura Biura</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9em' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Piętra biurowca:</span>
                  <strong>{state.mordorFloors} szt.</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Zatrudnieni korposi:</span>
                  <strong>{state.mordorEmployees} / {maxEmployees}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Płace i koszty:</span>
                  <strong style={{ color: 'var(--prl-red)' }}>-{fmtNum(currentUpkeepPln, 0)} PLN/s</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Przychód biura:</span>
                  <strong style={{ color: '#00e1d9' }}>+{fmtNum(currentIncomeEur, 2)} EUR/s</strong>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                <button 
                  onClick={() => buyMordorFloor()} 
                  disabled={state.pln < 5000000}
                  className="retro-button"
                  style={{ width: '100%', padding: '10px', fontSize: '0.9em', backgroundColor: '#9b59b6', color: '#fff', fontWeight: 'bold' }}
                >
                  Dobuduj piętro (+10 miejsc) <span style={{ color: '#f1c40f' }}>[5M PLN]</span>
                </button>

                <button 
                  onClick={() => recruitMordorEmployee()} 
                  disabled={state.pln < 200000 || state.mordorEmployees >= maxEmployees}
                  className="retro-button"
                  style={{ width: '100%', padding: '10px', fontSize: '0.9em', backgroundColor: '#8e44ad', color: '#fff', fontWeight: 'bold' }}
                >
                  Rekrutuj pracownika (BPO) <span style={{ color: '#f1c40f' }}>[200k PLN]</span>
                </button>
              </div>
            </div>

            {/* Morale Section */}
            <div style={{ backgroundColor: '#161616', padding: '15px', borderRadius: '6px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#8e44ad', fontSize: '1.1em' }}>Morale i Wypalenie Zawodowe</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '5px' }}>
                  <span>Morale zespołu:</span>
                  <strong style={{ color: state.mordorMorale > 50 ? '#2ecc71' : state.mordorMorale > 20 ? '#f1c40f' : '#e74c3c' }}>
                    {fmtNum(state.mordorMorale, 1)}%
                  </strong>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '5px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${state.mordorMorale}%`, 
                      height: '100%', 
                      backgroundColor: state.mordorMorale > 50 ? '#2ecc71' : state.mordorMorale > 20 ? '#f1c40f' : '#e74c3c',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
                {state.mordorEmployees > 0 && (
                  <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', marginTop: '4px', textAlign: 'right' }}>
                    Spada o: -{fmtNum(currentMoraleDecay, 3)}%/s
                  </div>
                )}
              </div>

              {state.mordorMorale < 20 && state.mordorEmployees > 0 && (
                <div style={{ color: '#e74c3c', fontSize: '0.8em', marginBottom: '10px', border: '1px dashed #e74c3c', padding: '6px', borderRadius: '4px' }}>
                  ⚠️ Uwaga! Tragiczne morale. Pracownicy zaraz zaczną składać wypowiedzenia (3.3% szansy/s).
                </div>
              )}

              <button 
                onClick={() => organizeMordorPizza()} 
                disabled={state.pln < 50000 || state.mordorMorale >= 100}
                className="retro-button"
                style={{ width: '100%', padding: '8px', fontSize: '0.85em', backgroundColor: '#e67e22', color: '#fff', fontWeight: 'bold' }}
              >
                Zamów pizzę na integrację (+20% morale) <span style={{ color: '#f1c40f' }}>[50k PLN]</span>
              </button>
            </div>
          </div>

          {/* Corporate Upgrades */}
          <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#161616', padding: '20px', borderRadius: '6px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8e44ad', paddingBottom: '5px', color: '#8e44ad' }}>
              Ulepszenia Korporacyjne
            </h3>

            <div style={{ display: 'grid', gap: '12px' }}>
              {MORDOR_UPGRADES.map(upg => {
                const bought = state.mordorUpgrades?.[upg.id];
                const canBuy = state.pln >= upg.costPln && !bought;
                return (
                  <div key={upg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: '10px 15px', borderRadius: '6px', border: bought ? '1px solid #8e44ad' : '1px solid #444' }}>
                    <div style={{ flex: 1, marginRight: '15px' }}>
                      <strong style={{ color: bought ? '#8e44ad' : '#fff', fontSize: '0.95em' }}>{upg.name}</strong>
                      <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', marginTop: '3px' }}>{upg.desc}</div>
                    </div>
                    <div>
                      {bought ? (
                        <span style={{ fontSize: '0.8em', color: '#8e44ad', fontWeight: 'bold' }}>ZAKUPIONE</span>
                      ) : (
                        <button 
                          onClick={() => buyMordorUpgrade(upg.id)} 
                          disabled={!canBuy}
                          className="retro-button"
                          style={{ padding: '6px 12px', fontSize: '0.8em', backgroundColor: '#8e44ad', color: '#fff' }}
                        >
                          Kup za {fmtShort(upg.costPln)}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: KADRY B2B ==================== */}
      {subTab === 'kadry' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Contracts and optimization */}
          <div style={{ flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ backgroundColor: '#161616', padding: '15px', borderRadius: '6px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#8e44ad', fontSize: '1.1em' }}>Fikcyjne Samozatrudnienie (B2B)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9em', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Aktywne kontrakty B2B:</span>
                  <strong>{state.jdgContracts} / {state.mordorEmployees}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Aktualna forma podatków:</span>
                  <strong style={{ color: '#3498db' }}>{taxLevel.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--prl-gray)' }}>Oszczędność na ZUS/płacach:</span>
                  <strong style={{ color: '#2ecc71' }}>-{fmtNum((1 - taxLevel.upkeepReduction) * 100, 0)}% kosztów</strong>
                </div>
              </div>

              <button 
                onClick={() => issueJdgContract()} 
                disabled={state.pln < 50000 || state.jdgContracts >= state.mordorEmployees}
                className="retro-button"
                style={{ width: '100%', padding: '10px', fontSize: '0.9em', backgroundColor: '#e74c3c', color: '#fff', fontWeight: 'bold' }}
              >
                Przenieś pracownika na B2B <span style={{ color: '#f1c40f' }}>[50k PLN]</span>
              </button>
              {state.jdgContracts >= state.mordorEmployees && state.mordorEmployees > 0 && (
                <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', marginTop: '5px', textAlign: 'center' }}>
                  Wszyscy zatrudnieni są już na samozatrudnieniu (B2B).
                </div>
              )}
            </div>

            {/* PIP Risk Panel */}
            <div style={{ backgroundColor: '#161616', padding: '15px', borderRadius: '6px', border: '1px solid #333' }}>
              <h3 style={{ margin: '0 0 12px 0', color: 'var(--prl-red)', fontSize: '1.1em' }}>Inspekcja Pracy (PIP)</h3>
              
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', marginBottom: '5px' }}>
                  <span>Ryzyko kontroli PIP:</span>
                  <strong style={{ color: state.jdgRiskLevel > 70 ? 'var(--prl-red)' : state.jdgRiskLevel > 40 ? '#f1c40f' : '#2ecc71' }}>
                    {fmtNum(state.jdgRiskLevel || 0, 1)}%
                  </strong>
                </div>
                <div style={{ width: '100%', height: '10px', backgroundColor: '#222', borderRadius: '5px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${state.jdgRiskLevel || 0}%`, 
                      height: '100%', 
                      backgroundColor: state.jdgRiskLevel > 70 ? 'var(--prl-red)' : state.jdgRiskLevel > 40 ? '#f1c40f' : '#2ecc71',
                      transition: 'width 0.3s ease'
                    }} 
                  />
                </div>
                {state.jdgContracts > 0 && (
                  <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', marginTop: '4px', textAlign: 'right' }}>
                    Przyrasta o: +{fmtNum(currentJdgRiskGain, 3)}%/s
                  </div>
                )}
              </div>
              <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)' }}>
                 PIP uderzy przy 100%. Spowoduje to nałożenie kary grzywny w wysokości: <strong>{fmtNum(state.jdgContracts * 15000 * (state.jdgTaxOptimizationLevel + 1), 0)} PLN</strong> i cofnięcie ryzyka do 40%.
              </div>
            </div>
          </div>

          {/* Tax Optimization Upgrades */}
          <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#161616', padding: '20px', borderRadius: '6px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8e44ad', paddingBottom: '5px', color: '#8e44ad' }}>
              Forma Optymalizacji Podatkowej
            </h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              {JDG_TAX_LEVELS.map(lvl => {
                const current = state.jdgTaxOptimizationLevel === lvl.level;
                const active = state.jdgTaxOptimizationLevel >= lvl.level;
                const next = nextTaxLevel && nextTaxLevel.level === lvl.level;
                
                return (
                  <div key={lvl.level} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#222', padding: '12px 15px', borderRadius: '6px', border: current ? '2px solid #3498db' : active ? '1px solid #8e44ad' : '1px solid #444', opacity: (active || next) ? 1.0 : 0.4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: current ? '#3498db' : '#fff' }}>{lvl.name}</strong>
                      {current && <span style={{ fontSize: '0.75em', backgroundColor: '#3498db', color: '#000', padding: '2px 6px', borderRadius: '3px', fontWeight: 'bold' }}>AKTYWNE</span>}
                      {active && !current && <span style={{ fontSize: '0.75em', color: '#8e44ad' }}>ODBLOKOWANE</span>}
                    </div>
                    <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', margin: '5px 0' }}>{lvl.desc}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px', fontSize: '0.8em' }}>
                      <span style={{ color: '#2ecc71' }}>Koszty BPO: -{fmtNum((1 - lvl.upkeepReduction)*100, 0)}%</span>
                      <span style={{ color: 'var(--prl-red)' }}>Ryzyko PIP: x{lvl.riskFactor}</span>
                    </div>

                    {next && (
                      <button 
                        onClick={() => upgradeTaxLevel()} 
                        disabled={state.pln < lvl.costPln}
                        className="retro-button"
                        style={{ marginTop: '10px', padding: '6px', fontSize: '0.8em', backgroundColor: '#3498db', color: '#fff', fontWeight: 'bold' }}
                      >
                        Wdróż optymalizację za {fmtShort(lvl.costPln)} PLN
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB: OBLIGACJE ==================== */}
      {subTab === 'obligacje' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Bond market */}
          <div style={{ flex: 1.5, minWidth: '320px', backgroundColor: '#161616', padding: '20px', borderRadius: '6px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8e44ad', paddingBottom: '5px', color: '#8e44ad' }}>
              Rynek Skarbowy Strefy Euro
            </h3>

            <div style={{ display: 'grid', gap: '15px' }}>
              {EURO_BOND_TYPES.map(bond => {
                const canBuy = (state.euros || 0) >= bond.costEur;
                return (
                  <div key={bond.id} style={{ padding: '15px', backgroundColor: '#222', borderRadius: '6px', border: '1px solid #444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.05em', color: '#fff' }}>{bond.name}</strong>
                      <span style={{ fontSize: '0.85em', color: '#00e1d9', fontWeight: 'bold' }}>{bond.country}</span>
                    </div>
                    <div style={{ fontSize: '0.75em', color: 'var(--prl-gray)', margin: '8px 0' }}>{bond.desc}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85em', borderTop: '1px solid #333', paddingTop: '8px', marginTop: '8px' }}>
                      <div>Koszt: <strong>{fmtNum(bond.costEur)} EUR</strong></div>
                      <div>Zwrot: <strong style={{ color: '#2ecc71' }}>+{fmtNum(bond.interestRate * 100, 0)}%</strong></div>
                      <div>Ryzyko krachu: <strong style={{ color: bond.riskOfCrash > 25 ? 'var(--prl-red)' : '#f1c40f' }}>{bond.riskOfCrash}%</strong></div>
                    </div>

                    <button 
                      onClick={() => buyEuroBond(bond.id)} 
                      disabled={!canBuy}
                      className="retro-button"
                      style={{ width: '100%', marginTop: '10px', padding: '6px', fontSize: '0.85em', backgroundColor: '#00e1d9', color: '#000', fontWeight: 'bold' }}
                    >
                      Kup obligacje ({bond.durationSec}s)
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Bonds */}
          <div style={{ flex: 1.2, minWidth: '300px', backgroundColor: '#161616', padding: '20px', borderRadius: '6px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #8e44ad', paddingBottom: '5px', color: '#8e44ad' }}>
              Posiadane Obligacje
            </h3>

            {(!state.euroBonds || state.euroBonds.length === 0) ? (
              <div style={{ padding: '30px 15px', color: 'var(--prl-gray)', textAlign: 'center', fontSize: '0.9em', border: '1px dashed #444', borderRadius: '6px' }}>
                Nie posiadasz aktualnie żadnych obligacji państwowych strefy euro.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {state.euroBonds.map((bond, idx) => {
                  const definition = EURO_BOND_TYPES.find(d => d.id === bond.id);
                  const duration = definition ? definition.durationSec : 90;
                  const progress = Math.max(0, 100 - (bond.timeLeft / duration) * 100);
                  
                  return (
                    <div key={bond.uuid || idx} style={{ padding: '12px', backgroundColor: '#222', borderRadius: '6px', borderLeft: '4px solid #00e1d9', borderTop: '1px solid #333', borderRight: '1px solid #333', borderBottom: '1px solid #333' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85em', fontWeight: 'bold', marginBottom: '5px' }}>
                        <span>{bond.country} (Nominał: {fmtNum(bond.nominalAmountEur)} EUR)</span>
                        <span style={{ color: '#f1c40f' }}>{fmtNum(bond.timeLeft, 1)}s</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#111', borderRadius: '3px', overflow: 'hidden', marginBottom: '5px' }}>
                        <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#00e1d9' }} />
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75em', color: 'var(--prl-gray)' }}>
                        <span>Oczekiwany zysk: +{fmtNum(bond.nominalAmountEur * bond.interestRate, 0)} EUR</span>
                        <span style={{ color: bond.riskOfCrash > 25 ? 'var(--prl-red)' : 'inherit' }}>Ryzyko: {bond.riskOfCrash}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(TabMordor);
