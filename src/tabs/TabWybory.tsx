// [Claude] KIERUNEK 1.2: zakladka 'wybory' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { CAMPAIGN_LEADERS, CAMPAIGN_MATERIALS, DEBATE_OPTIONS, ELECTION_REGIONS, ELECTION_UPGRADES } from '../game/items';
import { fmtShort } from '../utils/format';
import { useGameApi } from './GameApiContext';

export const TabWybory = memo(function TabWybory() {
  const { buyElectionUpgrade, buyPrintingSupplies, concludeNegotiations, interactDebate, launchRally, openRegionalCommittee, printCampaignMaterial, runElectionsFirstRound, runElectionsSecondRound, state, transferToCampaign, unlockElections } = useGameApi();
  return (() => {
          if (!state.electionsUnlocked) {
            return (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#fff', color: '#000', border: '2px solid #d63031', borderRadius: '4px' }}>
                <h2 style={{ color: '#d63031', fontWeight: 'bold' }}>WYBORY 4 CZERWCA 1989</h2>
                <p style={{ fontSize: '1.2em' }}>Okrągły Stół zakończony! Władza zgodziła się na częściowo wolne wybory.</p>
                <p>Musisz zorganizować ogólnopolską kampanię wyborczą Komitetu Obywatelskiego "Solidarność".</p>
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
                  <h3 style={{ margin: '0 0 10px 0' }}>Warunki uruchomienia kampanii:</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    <li style={{ color: state.solidarnos >= 10000 ? 'green' : 'red' }}>
                      {state.solidarnos >= 10000 ? '✓' : '✗'} 10 000 Poparcia Solidarności (darmowe otwarcie)
                    </li>
                    <li style={{ margin: '10px 0', fontWeight: 'bold' }}>LUB</li>
                    <li style={{ color: state.pln >= 5000000 ? 'green' : 'red' }}>
                      {state.pln >= 5000000 ? '✓' : '✗'} 5 000 000 PLN (opłata organizacyjna)
                    </li>
                  </ul>
                  <button 
                    onClick={unlockElections}
                    disabled={state.solidarnos < 10000 && state.pln < 5000000}
                    style={{ 
                      marginTop: '15px', padding: '15px 30px', fontSize: '1.2em', 
                      backgroundColor: (state.solidarnos >= 10000 || state.pln >= 5000000) ? '#d63031' : '#ccc', 
                      color: '#fff', border: 'none', cursor: (state.solidarnos >= 10000 || state.pln >= 5000000) ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold', borderRadius: '4px'
                    }}
                  >
                    ROZPOCZNIJ KAMPANIĘ WYBORCZĄ
                  </button>
                </div>
              </div>
            );
          }

          const totalVotes = Object.values(state.regionalVotes).reduce((a, b) => a + b, 0);
          const totalCommittees = Object.keys(state.regionalCommittees).length;

          return (
            <div style={{ padding: '15px', backgroundColor: '#f5f6fa', color: '#2f3640', fontFamily: '"Arial", sans-serif' }}>
              
              {/* HEADER Z LOGO I STANEM */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#d63031', color: '#fff', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8em', fontWeight: '900', letterSpacing: '1px' }}>SOLIDARNOŚĆ - WYBORY '89</h2>
                  <div style={{ fontSize: '0.9em', opacity: 0.9 }}>
                    Faza: 
                    <span style={{ fontWeight: 'bold', marginLeft: '5px', color: '#ffeaa7' }}>
                      {state.electionsPhase === 'campaign' && 'KAMPANIA TRWA'}
                      {state.electionsPhase === 'second_round' && 'II TURA (SENAT)'}
                      {state.electionsPhase === 'negotiations' && 'NEGOCJACJE KOALICYJNE'}
                      {state.electionsPhase === 'completed' && 'RZĄD SFORMOWANY'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Łącznie Głosów</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{totalVotes.toLocaleString('pl-PL')}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8em', textTransform: 'uppercase' }}>Propaganda TVP</div>
                    <div style={{ fontSize: '1.5em', fontWeight: 'bold', color: state.regimePropaganda > 50 ? '#ff7675' : '#55efc4' }}>
                      {state.regimePropaganda}%
                    </div>
                  </div>
                </div>
              </div>

              {/* GŁÓWNY DASHBOARD */}
              <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                
                {/* LEWA KOLUMNA: Fundusze i Logistyka */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px' }}>Fundusze i Logistyka</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px', width: '45%' }}>
                      <div style={{ fontSize: '0.8em', color: '#7f8fa6' }}>Fundusz Wyborczy PLN</div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold' }}>{state.electionFundsPln.toLocaleString('pl-PL')} zł</div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => transferToCampaign(100000, 'pln')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+100k</button>
                        <button onClick={() => transferToCampaign(1000000, 'pln')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+1M</button>
                      </div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px', width: '45%' }}>
                      <div style={{ fontSize: '0.8em', color: '#7f8fa6' }}>Fundusz Dewizowy USD</div>
                      <div style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#44bd32' }}>${state.electionFundsUsd.toLocaleString('pl-PL')}</div>
                      <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                        <button onClick={() => transferToCampaign(1000, 'usd')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+$1k</button>
                        <button onClick={() => transferToCampaign(10000, 'usd')} style={{ flex: 1, padding: '2px', fontSize: '0.7em' }}>+$10k</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>Drukarnia Centralna</h4>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.9em' }}>
                      <div style={{ flex: 1, padding: '5px', border: '1px solid #dcdde1', textAlign: 'center' }}>
                        Papier: <strong>{fmtShort(state.paperStocks)}</strong> ryz
                        <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                          <button onClick={() => buyPrintingSupplies('paper', 'pln')} style={{ flex: 1, fontSize: '0.8em' }}>Kup (5k zł)</button>
                          <button onClick={() => buyPrintingSupplies('paper', 'usd')} style={{ flex: 1, fontSize: '0.8em' }}>Kup ($50)</button>
                        </div>
                      </div>
                      <div style={{ flex: 1, padding: '5px', border: '1px solid #dcdde1', textAlign: 'center' }}>
                        Tusz: <strong>{fmtShort(state.inkStocks)}</strong> l.
                        <div style={{ display: 'flex', gap: '2px', marginTop: '5px' }}>
                          <button onClick={() => buyPrintingSupplies('ink', 'pln')} style={{ flex: 1, fontSize: '0.8em' }}>Kup (8k zł)</button>
                          <button onClick={() => buyPrintingSupplies('ink', 'usd')} style={{ flex: 1, fontSize: '0.8em' }}>Kup ($80)</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '0.9em' }}>Produkcja Materiałów</h4>
                    <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                      {CAMPAIGN_MATERIALS.map(mat => (
                        <div key={mat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px', borderBottom: '1px solid #eee', fontSize: '0.85em' }}>
                          <div>
                            <strong>{mat.name}</strong> 
                            <span style={{ color: '#d63031', marginLeft: '5px', fontSize: '0.8em' }} title="Ryzyko SB">({mat.sbRiskPercent}% SB)</span>
                            <br/>
                            <span style={{ color: '#7f8fa6' }}>{mat.costPln}zł | {mat.paperCost} pap | {mat.inkCost} tusz</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontWeight: 'bold' }}>{state.campaignMaterials[mat.id] || 0} szt.</span>
                            <button 
                              onClick={() => printCampaignMaterial(mat.id)}
                              disabled={state.electionFundsPln < mat.costPln || state.paperStocks < mat.paperCost || state.inkStocks < mat.inkCost}
                              style={{ padding: '2px 8px', backgroundColor: '#2f3640', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              Drukuj
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PRAWA KOLUMNA: Mapy i Regiony */}
                <div style={{ flex: 2, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Komitety Obywatelskie ({totalCommittees}/{ELECTION_REGIONS.length})</span>
                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#7f8fa6' }}>Poparcie Kościoła: {state.churchSupport}%</span>
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {ELECTION_REGIONS.map(region => {
                      const isOpen = !!state.regionalCommittees[region.id];
                      const votes = state.regionalVotes[region.id] || 0;
                      const hasRally = (state.activeRallies || []).some(r => r.regionId === region.id);
                      
                      return (
                        <div key={region.id} style={{ 
                          border: `1px solid ${isOpen ? '#d63031' : '#dcdde1'}`, 
                          borderRadius: '4px', padding: '10px',
                          backgroundColor: isOpen ? '#fffaf0' : '#f5f6fa'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <strong style={{ color: isOpen ? '#d63031' : '#2f3640' }}>{region.name}</strong>
                            {hasRally && <span style={{ color: '#e1b12c', fontSize: '0.8em', fontWeight: 'bold' }}>📢 WIEC TRWA</span>}
                          </div>
                          
                          {!isOpen ? (
                            <div>
                              <div style={{ fontSize: '0.8em', color: '#7f8fa6', marginBottom: '10px' }}>{region.desc}</div>
                              <button 
                                onClick={() => openRegionalCommittee(region.id)}
                                disabled={state.electionFundsPln < region.committeeCostPln}
                                style={{ width: '100%', padding: '5px', backgroundColor: '#2f3640', color: '#fff', border: 'none', borderRadius: '3px' }}
                              >
                                Otwórz Komitet ({region.committeeCostPln.toLocaleString('pl-PL')} zł)
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div style={{ fontSize: '1.2em', fontWeight: 'bold', marginBottom: '5px' }}>
                                {votes.toLocaleString('pl-PL')} <span style={{ fontSize: '0.6em', fontWeight: 'normal', color: '#7f8fa6' }}>głosów</span>
                              </div>
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Rob: {region.workerWeight * 100}%</div>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Int: {region.intellectualWeight * 100}%</div>
                                <div style={{ fontSize: '0.7em', padding: '2px 4px', backgroundColor: '#eee', borderRadius: '2px' }}>Rol: {region.farmerWeight * 100}%</div>
                              </div>
                              
                              <div style={{ marginTop: '10px', fontSize: '0.8em' }}>
                                <strong>Wyślij Lidera:</strong>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                                  {CAMPAIGN_LEADERS.map(leader => {
                                    const isOnCooldown = (state.leaderCooldowns[leader.id] || 0) > 0;
                                    return (
                                      <button
                                        key={leader.id}
                                        onClick={() => launchRally(region.id, leader.id)}
                                        disabled={isOnCooldown || hasRally || state.electionFundsPln < leader.costPln || (leader.costUsd > 0 && state.electionFundsUsd < leader.costUsd)}
                                        title={`${leader.name}\nKoszt: ${leader.costPln}zł ${leader.costUsd > 0 ? `+ $${leader.costUsd}` : ''}`}
                                        style={{ 
                                          padding: '2px 5px', fontSize: '0.9em',
                                          backgroundColor: isOnCooldown ? '#ccc' : (leader.specialRegion === region.id ? '#d63031' : '#7f8fa6'),
                                          color: '#fff', border: 'none', borderRadius: '3px', cursor: isOnCooldown ? 'not-allowed' : 'pointer'
                                        }}
                                      >
                                        {leader.name.split(' ')[1]} {isOnCooldown ? `(${Math.ceil(state.leaderCooldowns[leader.id])}s)` : ''}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* DOLNA SEKCJA: Infrastruktura i Akcje Specjalne */}
              <div style={{ display: 'flex', gap: '15px' }}>
                
                {/* Infrastruktura */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #dcdde1', borderRadius: '4px' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px' }}>Infrastruktura Kampanii</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                    {ELECTION_UPGRADES.map(upg => {
                      const isBought = state.electionUpgrades[upg.id];
                      return (
                        <div key={upg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: isBought ? '#f1f2f6' : '#fff', border: '1px solid #dcdde1', borderRadius: '3px' }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9em', color: isBought ? '#7f8fa6' : '#2f3640' }}>
                              {isBought && '✓ '} {upg.name}
                            </div>
                            <div style={{ fontSize: '0.75em', color: '#7f8fa6' }}>{upg.effect}</div>
                          </div>
                          {!isBought && (
                            <button 
                              onClick={() => buyElectionUpgrade(upg.id)}
                              disabled={state.electionFundsPln < upg.costPln || (upg.costUsd > 0 && state.electionFundsUsd < upg.costUsd)}
                              style={{ padding: '3px 8px', fontSize: '0.8em', backgroundColor: '#e1b12c', color: '#fff', border: 'none', borderRadius: '3px' }}
                            >
                              {upg.costPln > 0 ? `${upg.costPln / 1000}k zł` : ''} 
                              {upg.costPln > 0 && upg.costUsd > 0 ? ' + ' : ''}
                              {upg.costUsd > 0 ? `$${upg.costUsd}` : ''}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Debata i Wybory */}
                <div style={{ flex: 1, backgroundColor: '#fff', padding: '15px', border: '1px solid #d63031', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ margin: '0 0 15px 0', borderBottom: '2px solid #d63031', paddingBottom: '5px', color: '#d63031' }}>Wielki Finał</h3>
                  
                  {/* DEBATA */}
                  <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f1f2f6', borderRadius: '4px' }}>
                    <h4 style={{ margin: '0 0 10px 0' }}>Debata: Wałęsa vs Miodowicz</h4>
                    {state.debateCompleted ? (
                      <div style={{ color: '#44bd32', fontWeight: 'bold', textAlign: 'center', padding: '10px' }}>
                        ✓ Debata wygrana! Poparcie w całej Polsce wzrosło. (Wynik: {state.debateScore})
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.85em', marginBottom: '10px' }}>Runda {state.debateRound + 1} z 4</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {DEBATE_OPTIONS.filter(o => o.round === state.debateRound + 1).map(opt => (
                            <button 
                              key={opt.id}
                              onClick={() => interactDebate(opt.id)}
                              style={{ padding: '8px', fontSize: '0.85em', textAlign: 'left', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}
                            >
                              <em>{opt.text}</em>
                              <div style={{ fontSize: '0.8em', color: '#7f8fa6', marginTop: '3px' }}>Ryzyko SB: {opt.sbRisk}% | Red. Propagandy: {opt.propagandaReduction}%</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PRZEBIEG WYBORÓW */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    {state.electionsPhase === 'campaign' && (
                      <button 
                        onClick={runElectionsFirstRound}
                        disabled={totalVotes < 5000000 || state.campaignTimePlayed < 600}
                        style={{ padding: '15px', fontSize: '1.2em', fontWeight: 'bold', backgroundColor: (totalVotes >= 5000000 && state.campaignTimePlayed >= 600) ? '#d63031' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: (totalVotes >= 5000000 && state.campaignTimePlayed >= 600) ? 'pointer' : 'not-allowed' }}
                      >
                        PRZEPROWADŹ I TURĘ WYBORÓW (4 CZERWCA)
                        <div style={{ fontSize: '0.6em', fontWeight: 'normal', marginTop: '5px' }}>
                          Wymagane: 5 mln głosów i 10 min kampanii (Aktualnie: {Math.floor(state.campaignTimePlayed / 60)} min)
                        </div>
                      </button>
                    )}

                    {state.electionsPhase === 'second_round' && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Wyniki I Tury:<br/>
                          Sejm: <span style={{ color: '#d63031' }}>{state.sejmSeatsWon}/161</span> | Senat: <span style={{ color: '#d63031' }}>{state.senateSeatsWon}/100</span>
                        </div>
                        <button 
                          onClick={runElectionsSecondRound}
                          style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: '#e1b12c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          PRZEPROWADŹ II TURĘ WYBORÓW (18 CZERWCA)
                        </button>
                      </div>
                    )}

                    {state.electionsPhase === 'negotiations' && (
                      <div>
                        <div style={{ textAlign: 'center', marginBottom: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Ostateczne Wyniki:<br/>
                          Sejm: <span style={{ color: '#d63031' }}>{state.sejmSeatsWon}/161</span> | Senat: <span style={{ color: '#d63031' }}>{state.senateSeatsWon}/100</span>
                        </div>
                        <button 
                          onClick={concludeNegotiations}
                          style={{ width: '100%', padding: '15px', fontSize: '1.1em', fontWeight: 'bold', backgroundColor: '#44bd32', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          ROZPOCZNIJ NEGOCJACJE RZĄDOWE
                        </button>
                      </div>
                    )}

                    {state.electionsPhase === 'completed' && (
                      <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#44bd32', color: '#fff', borderRadius: '4px' }}>
                        <h3 style={{ margin: '0 0 10px 0' }}>KAMPANIA ZAKOŃCZONA SUKCESEM</h3>
                        <p style={{ margin: 0 }}>Rząd powołany. Polska wkracza na drogę transformacji. Faza III RP wkrótce...</p>
                        <div style={{ marginTop: '10px', fontSize: '1.2em', fontWeight: 'bold' }}>
                          Sejm: {state.sejmSeatsWon}/161 | Senat: {state.senateSeatsWon}/100
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
