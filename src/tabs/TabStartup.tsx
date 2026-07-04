import React, { useContext, useState } from 'react';
import { GameApiContext } from './GameApiContext';
import { AI_UPGRADES } from '../game/items';
import { cryptoMiningYield, cryptoPowerUpkeepPln, aiTrainSpeed, knfRiskGrowthRate } from '../game/formulas';
import { fmtNum } from '../utils/format';

export const TabStartup: React.FC = React.memo(() => {
  const api = useContext(GameApiContext);
  const [subTab, setSubTab] = useState<'krypto' | 'ai' | 'fintech'>('krypto');

  if (!api) return null;
  const {
    state,
    buyCryptoRig,
    sellBitcoin,
    buyAiComputer,
    hirePromptEngineer,
    startAiTraining,
    generatePitchDeck,
    pumpKmbToken,
    sellKmbTokens,
    buyAiUpgrade
  } = api;

  // Obliczenia pomocnicze
  const btcRate = cryptoMiningYield(state);
  const powerCost = cryptoPowerUpkeepPln(state);
  const trainSpeed = aiTrainSpeed(state);
  const knfRiskRate = knfRiskGrowthRate(state);

  const rtxCount = state.cryptoRigs?.['rtx4090'] || 0;
  const asicCount = state.cryptoRigs?.['asic'] || 0;

  return (
    <div className="panel" style={{ borderColor: '#f2a900', fontFamily: 'monospace' }}>
      <h2 style={{ color: '#f2a900', marginTop: 0, borderBottom: '1px solid #f2a900', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>🚀 ERA STARTUPÓW I CYFRYZACJI (LATA 2020.)</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--prl-gray)' }}>Status: Aktywny</span>
      </h2>

      {/* Nawigacja sub-tabów */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setSubTab('krypto')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'krypto' ? '#f2a900' : 'transparent',
            color: subTab === 'krypto' ? '#000' : '#f2a900',
            borderColor: '#f2a900',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🪙 KOPALNIA KRYPTO
        </button>
        <button
          onClick={() => setSubTab('ai')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'ai' ? '#00e1d9' : 'transparent',
            color: subTab === 'ai' ? '#000' : '#00e1d9',
            borderColor: '#00e1d9',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🤖 SOFTWARE HOUSE AI
        </button>
        <button
          onClick={() => setSubTab('fintech')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: subTab === 'fintech' ? '#e74c3c' : 'transparent',
            color: subTab === 'fintech' ? '#000' : '#e74c3c',
            borderColor: '#e74c3c',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📉 FINTECH & TOKENY
        </button>
      </div>

      {/* SUB-TAB: KOPALNIA KRYPTO */}
      {subTab === 'krypto' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Panel statusu wydobycia */}
            <div className="panel" style={{ borderColor: '#f2a900', background: 'rgba(242, 169, 0, 0.05)' }}>
              <h3 style={{ color: '#f2a900', marginTop: 0 }}>📊 STATYSTYKI WYDOBYCIA</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Posiadane Bitcoiny: <strong style={{ color: '#f2a900' }}>{(state.bitcoins || 0).toFixed(6)} ₿</strong></div>
                <div>Aktualny kurs BTC: <strong style={{ color: 'var(--dollar-green)' }}>{state.bitcoinPricePln.toLocaleString('pl-PL')} PLN</strong></div>
                <div>Wydobycie netto: <strong style={{ color: '#33ff33' }}>+{btcRate.toFixed(5)} ₿/s</strong></div>
                <div>Zużycie prądu z koparek: <strong style={{ color: '#ff6666' }}>-{fmtNum(powerCost, 2)} PLN/s</strong></div>
                {state.aiUpgrades?.['fotowoltaika'] && (
                  <div style={{ color: '#33ff33', fontSize: '0.8rem' }}>🟢 Aktywna fotowoltaika (-40% rachunków za prąd)</div>
                )}
                <div style={{ borderTop: '1px dashed #f2a900', marginTop: '10px', paddingTop: '10px' }}>
                  Wartość portfela BTC: <strong>{Math.floor((state.bitcoins || 0) * state.bitcoinPricePln).toLocaleString('pl-PL')} PLN</strong>
                </div>
              </div>

              {/* Sprzedaż BTC */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                <button
                  onClick={() => sellBitcoin(0.1)}
                  disabled={(state.bitcoins || 0) < 0.1}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderColor: '#f2a900',
                    color: '#f2a900',
                    background: 'transparent',
                    cursor: (state.bitcoins || 0) >= 0.1 ? 'pointer' : 'not-allowed',
                    opacity: (state.bitcoins || 0) >= 0.1 ? 1 : 0.5
                  }}
                >
                  Sprzedaj 0.1 ₿
                </button>
                <button
                  onClick={() => sellBitcoin(1.0)}
                  disabled={(state.bitcoins || 0) < 1.0}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderColor: '#f2a900',
                    color: '#f2a900',
                    background: 'transparent',
                    cursor: (state.bitcoins || 0) >= 1.0 ? 'pointer' : 'not-allowed',
                    opacity: (state.bitcoins || 0) >= 1.0 ? 1 : 0.5
                  }}
                >
                  Sprzedaj 1.0 ₿
                </button>
                <button
                  onClick={() => sellBitcoin(state.bitcoins || 0)}
                  disabled={(state.bitcoins || 0) <= 0}
                  style={{
                    flex: 1,
                    padding: '6px',
                    borderColor: '#f2a900',
                    color: '#f2a900',
                    background: 'transparent',
                    cursor: (state.bitcoins || 0) > 0 ? 'pointer' : 'not-allowed',
                    opacity: (state.bitcoins || 0) > 0 ? 1 : 0.5
                  }}
                >
                  Sprzedaj Całość
                </button>
              </div>
            </div>

            {/* Panel zakupów koparek */}
            <div className="panel" style={{ borderColor: '#f2a900' }}>
              <h3 style={{ color: '#f2a900', marginTop: 0 }}>🛒 ZAKUP KOPAREK KRYPTO</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* RTX 4090 */}
                <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Koparka RTX 4090 ({rtxCount} szt.)</span>
                    <span style={{ color: 'var(--prl-yellow)' }}>10 000 PLN</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', margin: '5px 0' }}>Pobór prądu: 450W. Daje 0,00005 BTC/s. Niezawodny klasyk graczy.</div>
                  <button
                    onClick={() => buyCryptoRig('rtx4090')}
                    disabled={state.pln < 10000}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: state.pln >= 10000 ? '#f2a900' : '#333',
                      color: state.pln >= 10000 ? '#000' : '#888',
                      border: 'none',
                      cursor: state.pln >= 10000 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    Kup Koparkę
                  </button>
                </div>

                {/* ASIC */}
                <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Antminer ASIC S19 ({asicCount} szt.)</span>
                    <span style={{ color: 'var(--prl-yellow)' }}>40 000 PLN</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', margin: '5px 0' }}>Pobór prądu: 3.0 kW! Daje 0,00025 BTC/s. Przemysłowa machina o ogromnym apetycie na prąd.</div>
                  <button
                    onClick={() => buyCryptoRig('asic')}
                    disabled={state.pln < 40000}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: state.pln >= 40000 ? '#f2a900' : '#333',
                      color: state.pln >= 40000 ? '#000' : '#888',
                      border: 'none',
                      cursor: state.pln >= 40000 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    Kup Koparkę
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: SOFTWARE HOUSE AI */}
      {subTab === 'ai' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Panel operacji AI */}
            <div className="panel" style={{ borderColor: '#00e1d9', background: 'rgba(0, 225, 217, 0.05)' }}>
              <h3 style={{ color: '#00e1d9', marginTop: 0 }}>🧠 TRENOWANIE I MODELE</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Superkomputery H100: <strong>{state.aiComputers || 0} szt.</strong></div>
                <div>Prompt Engineerzy: <strong>{state.aiPromptEngineers || 0} osób</strong></div>
                <div>Koszt płac inżynierów: <strong style={{ color: '#ff6666' }}>-{(state.aiPromptEngineers || 0) * 150} PLN/s</strong></div>
                <div>Wytrenowane modele AI: <strong style={{ color: '#00e1d9' }}>{state.aiModelsTrained || 0} szt.</strong></div>
                <div style={{ borderTop: '1px dashed #00e1d9', marginTop: '10px', paddingTop: '10px' }}>
                  Szybkość treningu: <strong>+{trainSpeed.toFixed(2)}%/s</strong>
                </div>
              </div>

              {/* Trening Modelu */}
              <div style={{ marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.8rem' }}>
                  <span>Postęp treningu:</span>
                  <span>{Math.floor(state.aiTrainProgress || 0)}%</span>
                </div>
                <div style={{ width: '100%', height: '16px', background: '#222', border: '1px solid #00e1d9', borderRadius: '4px', overflow: 'hidden', position: 'relative', marginBottom: '15px' }}>
                  <div
                    style={{
                      width: `${state.aiTrainProgress || 0}%`,
                      height: '100%',
                      background: '#00e1d9',
                      transition: 'width 0.2s linear'
                    }}
                  />
                </div>
                <button
                  onClick={startAiTraining}
                  disabled={state.isTrainingAi}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderColor: '#00e1d9',
                    color: '#00e1d9',
                    background: state.isTrainingAi ? '#333' : 'transparent',
                    cursor: state.isTrainingAi ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {state.isTrainingAi ? 'TRENOWANIE W TOKU...' : 'URUCHOM TRENING MODELU AI'}
                </button>
              </div>

              {/* Pitch Deck */}
              <div style={{ marginTop: '15px', borderTop: '1px dashed #00e1d9', paddingTop: '15px' }}>
                <button
                  onClick={generatePitchDeck}
                  disabled={state.aiModelsTrained <= 0}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: state.aiModelsTrained > 0 ? '#33ff33' : '#333',
                    color: state.aiModelsTrained > 0 ? '#000' : '#888',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: state.aiModelsTrained > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  🚀 GENERUJ PITCH DECK & ZGARNIJ VC FUNDING
                </button>
                <div style={{ fontSize: '0.75rem', color: 'var(--prl-gray)', marginTop: '5px', textAlign: 'center' }}>
                  (Wymaga min. 1 wytrenowanego modelu. Przynosi od 500k do 2M PLN finansowania VC per model!)
                </div>
              </div>
            </div>

            {/* Zakup sprzętu i kadr */}
            <div className="panel" style={{ borderColor: '#00e1d9' }}>
              <h3 style={{ color: '#00e1d9', marginTop: 0 }}>💼 INVESTMENTS & ZASOBY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* H100 Machine */}
                <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Stacja robocza H100 GPU</span>
                    <span style={{ color: 'var(--prl-yellow)' }}>120 000 PLN</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', margin: '5px 0' }}>Zwiększa bazową szybkość treningu AI o +0.5%/s.</div>
                  <button
                    onClick={buyAiComputer}
                    disabled={state.pln < 120000}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: state.pln >= 120000 ? '#00e1d9' : '#333',
                      color: state.pln >= 120000 ? '#000' : '#888',
                      border: 'none',
                      cursor: state.pln >= 120000 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    Kup H100
                  </button>
                </div>

                {/* Prompt Engineer */}
                <div style={{ borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <span>Prompt Engineer</span>
                    <span style={{ color: 'var(--prl-yellow)' }}>30 000 PLN</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--prl-gray)', margin: '5px 0' }}>Koszt rekrutacji. Zwiększa szybkość treningu o +0.2%/s. Pensja: 150 PLN/s.</div>
                  <button
                    onClick={hirePromptEngineer}
                    disabled={state.pln < 30000}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: state.pln >= 30000 ? '#00e1d9' : '#333',
                      color: state.pln >= 30000 ? '#000' : '#888',
                      border: 'none',
                      cursor: state.pln >= 30000 ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold'
                    }}
                  >
                    Zatrudnij Inżyniera
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: FINTECH & TOKENY */}
      {subTab === 'fintech' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
            {/* Panel Tokena */}
            <div className="panel" style={{ borderColor: '#e74c3c', background: 'rgba(231, 76, 60, 0.05)' }}>
              <h3 style={{ color: '#e74c3c', marginTop: 0 }}>📊 GIEŁDA KOMBINATORCOIN (KMB)</h3>
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <div>Posiadane tokeny: <strong>{(state.kmbTokensOwned || 0).toLocaleString('pl-PL')} KMB</strong></div>
                <div>Kurs tokena KMB: <strong style={{ color: '#33ff33' }}>{fmtNum(state.kmbTokenPricePln || 0, 4)} PLN</strong></div>
                <div>Wycena posiadanych tokenów: <strong>{Math.floor((state.kmbTokensOwned || 0) * (state.kmbTokenPricePln || 0)).toLocaleString('pl-PL')} PLN</strong></div>
                <div style={{ borderTop: '1px dashed #e74c3c', marginTop: '10px', paddingTop: '10px' }}>
                  Wskaźnik inwigilacji KNF: <strong style={{ color: state.knfRiskLevel > 60 ? '#ff3333' : 'var(--crt-text)' }}>{Math.floor(state.knfRiskLevel || 0)}%</strong>
                </div>
                <div>Pasywny przyrost ryzyka KNF: <strong>+{knfRiskRate.toFixed(2)}%/s</strong></div>
                {state.aiUpgrades?.['dubaj_shell'] && (
                  <div style={{ color: '#33ff33', fontSize: '0.8rem' }}>🟢 Słup w ZEA aktywny (-50% podejrzliwości KNF)</div>
                )}
              </div>

              {/* Pump and Dump buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                <button
                  onClick={pumpKmbToken}
                  disabled={state.pln < 50000}
                  style={{
                    padding: '10px',
                    backgroundColor: state.pln >= 50000 ? '#33ff33' : '#333',
                    color: state.pln >= 50000 ? '#000' : '#888',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: state.pln >= 50000 ? 'pointer' : 'not-allowed',
                    boxShadow: state.pln >= 50000 ? '0 0 5px #33ff33' : 'none'
                  }}
                >
                  🚀 PUMP TOKEN (Koszt: 50 000 PLN)
                </button>
                <button
                  onClick={sellKmbTokens}
                  disabled={(state.kmbTokensOwned || 0) <= 0}
                  style={{
                    padding: '10px',
                    backgroundColor: (state.kmbTokensOwned || 0) > 0 ? '#ff3333' : '#333',
                    color: (state.kmbTokensOwned || 0) > 0 ? '#fff' : '#888',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: (state.kmbTokensOwned || 0) > 0 ? 'pointer' : 'not-allowed',
                    boxShadow: (state.kmbTokensOwned || 0) > 0 ? '0 0 5px #ff3333' : 'none'
                  }}
                >
                  📉 DUMP TOKEN (Sprzedaj Całość)
                </button>
                <div style={{ fontSize: '0.75rem', color: 'var(--prl-gray)', textAlign: 'center' }}>
                  (Dump tokena sprowadzi jego cenę w dół o 80%! Uciekaj z gotówką przed krachem!)
                </div>
              </div>
            </div>

            {/* Ostrzeżenie i zasady KNF */}
            <div className="panel" style={{ borderColor: '#e74c3c', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ color: '#e74c3c', marginTop: 0 }}>🚨 OSTRZEŻENIE PUBLICZNE KNF</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--prl-gray)' }}>
                  Komisja Nadzoru Finansowego bada obrót nieuregulowanymi aktywami kryptograficznymi. Pumping własnego tokena oraz posiadanie wolumenu KMB w portfelu podnosi poziom inwigilacji.
                </p>
                <p style={{ fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--prl-gray)' }}>
                  Gdy wskaźnik inwigilacji osiągnie <strong>100%</strong>, KNF przeprowadzi nalot skarbowy. Skutkuje to <strong>utratą 30% gotówki w PLN, konfiskatą wszystkich tokenów KMB i krachem giełdy</strong>.
                </p>
              </div>
              <div style={{ padding: '10px', border: '1px dashed #e74c3c', borderRadius: '4px', background: 'rgba(231, 76, 60, 0.1)', color: '#ff3333', fontSize: '0.85rem', textAlign: 'center', fontWeight: 'bold' }}>
                BĄDŹ CZUJNY! SPRZEDAJ TOKENY ZANIM WSKAŹNIK OSIĄGNIE 100%!
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL ULEPSZEŃ STARTUPOWYCH */}
      <div className="panel" style={{ borderColor: 'var(--prl-yellow)', marginTop: '20px' }}>
        <h3 style={{ color: 'var(--prl-yellow)', marginTop: 0 }}>⚡ ULEPSZENIA SYNDYKATU TECH ery 2020.</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '15px' }}>
          {AI_UPGRADES.map(up => {
            const purchased = state.aiUpgrades?.[up.id] || false;
            return (
              <div key={up.id} className="panel" style={{ borderColor: purchased ? '#33ff33' : '#444', background: purchased ? 'rgba(51, 255, 51, 0.05)' : 'transparent', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: purchased ? '#33ff33' : 'var(--crt-text)' }}>{up.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--prl-gray)', margin: '5px 0' }}>{up.desc}</div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => buyAiUpgrade(up.id)}
                    disabled={purchased || state.pln < up.costPln}
                    style={{
                      width: '100%',
                      padding: '4px',
                      backgroundColor: purchased ? '#33ff33' : (state.pln >= up.costPln ? 'var(--prl-yellow)' : '#333'),
                      color: '#000',
                      border: 'none',
                      cursor: (purchased || state.pln < up.costPln) ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    {purchased ? 'WYKUPIONE' : `Kup za ${up.costPln.toLocaleString('pl-PL')} zł`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default TabStartup;
