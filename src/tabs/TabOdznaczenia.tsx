// [Claude] KIERUNEK 1.2: zakladka 'odznaczenia' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { ACHIEVEMENTS } from '../game/items';
import { useGameApi } from './GameApiContext';

export const TabOdznaczenia = memo(function TabOdznaczenia() {
  const { state } = useGameApi();
  return (
    <div className="achievements-board">
              <div className="achievements-board-header">
                 <h2 style={{color: 'var(--prl-yellow)'}}>Ludowa Tablica Odznaczeń i Zasług</h2>
                 <p style={{fontSize: '0.9rem', color: 'var(--prl-gray)'}}>
                    Odznaczenia państwowe i resortowe za wybitne zasługi dla gospodarki nieformalnej i budowania dobrobytu.
                    Odblokowano: {Object.keys(state.unlockedAchievements || {}).filter(k => state.unlockedAchievements[k]).length} / {ACHIEVEMENTS.length}
                 </p>
              </div>
              
              {/* Categories */}
              {['ekonomia', 'polityka', 'przemyt', 'prestiz'].map(cat => {
                 const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
                 const catName = cat === 'ekonomia' ? 'Zasługi Ekonomiczne (Spekulacja)' :
                                 cat === 'polityka' ? 'Zasługi Polityczne (Nomenklatura)' :
                                 cat === 'przemyt' ? 'Zasługi Logistyczne (Przemyt i Czarny Rynek)' :
                                 'Zasługi Państwowe (Prestiż)';
                                 
                 return (
                    <div key={cat} style={{marginBottom: '30px'}}>
                       <h3 className="achievements-category-title">{catName}</h3>
                       <div className="achievements-grid">
                          {catAchievements.map(ach => {
                             const isUnlocked = !!state.unlockedAchievements[ach.id];
                             return (
                                <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : ''}`}>
                                   <div>
                                      <div className="achievement-title">{ach.name}</div>
                                      <div className="achievement-desc">{ach.desc}</div>
                                   </div>
                                   <div className="achievement-reward">
                                      Nagroda: {ach.rewardDesc}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                    </div>
                 );
              })}
            </div>
  );
});
