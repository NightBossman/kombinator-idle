// [Claude] KIERUNEK 1.2: zakladka 'odznaczenia' wydzielona z App.tsx (JSX przeniesiony 1:1).
// Dane i akcje przychodza z kontekstu GameApi - patrz GameApiContext.tsx.
import { memo } from 'react';
import { ACHIEVEMENTS } from '../game/items';
import { useGameApi } from './GameApiContext';
import { fmtNum, pluralPL } from '../utils/format';

export const TabOdznaczenia = memo(function TabOdznaczenia() {
  const { state } = useGameApi();
  
  const timeSec = state.stats.totalTimePlayed || 0;
  const timeMins = Math.floor(timeSec / 60);
  const timeHours = Math.floor(timeMins / 60);
  
  const formattedTime = timeHours > 0 
    ? `${timeHours} ${pluralPL(timeHours, 'godzina', 'godziny', 'godzin')} ${timeMins % 60} min`
    : `${timeMins} ${pluralPL(timeMins, 'minuta', 'minuty', 'minut')}`;

  const totalItemsSold = Object.values(state.stats.totalItemsSold || {}).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0);

  return (
    <div className="achievements-board">
      <div className="achievements-board-header">
         <h2 style={{color: 'var(--prl-yellow)'}}>Statystyki i Osiągnięcia Obywatela</h2>
         <p style={{fontSize: '0.9rem', color: 'var(--prl-gray)'}}>
            Akta operacyjne, wypracowany kapitał oraz odznaczenia państwowe i resortowe.
         </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
         <div className="panel" style={{ borderColor: 'var(--prl-text)', margin: 0 }}>
            <h3 style={{ color: 'var(--prl-yellow)', borderBottom: '1px solid var(--prl-gray)', paddingBottom: '5px' }}>Portfel i Kapitał</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '0.95rem' }}>
               <li style={{marginBottom:'5px'}}><strong>Łącznie zarobiono:</strong> {fmtNum(state.stats.totalPlnEarned)} zł</li>
               <li style={{marginBottom:'5px'}}><strong>Łącznie dewiz:</strong> $ {fmtNum(state.stats.totalDollarsEarned)}</li>
               <li style={{marginBottom:'5px'}}><strong>Odsetki z lokat:</strong> {fmtNum(state.stats.totalInterestEarned || 0)} zł</li>
               <li style={{marginBottom:'5px'}}><strong>Zyski z dywidend:</strong> {fmtNum(state.stats.totalDividendsEarned || 0)} zł</li>
            </ul>
         </div>

         <div className="panel" style={{ borderColor: 'var(--prl-text)', margin: 0 }}>
            <h3 style={{ color: 'var(--prl-yellow)', borderBottom: '1px solid var(--prl-gray)', paddingBottom: '5px' }}>Działalność Operacyjna</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '0.95rem' }}>
               <li style={{marginBottom:'5px'}}><strong>Udane szmugle:</strong> {fmtNum(state.stats.totalSmugglesCompleted)}</li>
               <li style={{marginBottom:'5px'}}><strong>Wpadki na cle:</strong> {fmtNum(state.stats.totalCleCatches || 0)}</li>
               <li style={{marginBottom:'5px'}}><strong>Zakupy (Czarny Rynek):</strong> {fmtNum(state.stats.totalBlackMarketPurchases || 0)}</li>
               <li style={{marginBottom:'5px'}}><strong>Transporty do Moskwy:</strong> {fmtNum(state.stats.totalMoscowRuns || 0)}</li>
            </ul>
         </div>

         <div className="panel" style={{ borderColor: 'var(--prl-text)', margin: 0 }}>
            <h3 style={{ color: 'var(--prl-yellow)', borderBottom: '1px solid var(--prl-gray)', paddingBottom: '5px' }}>Aktywność</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '0.95rem' }}>
               <li style={{marginBottom:'5px'}}><strong>Czas pracy silnika:</strong> {formattedTime}</li>
               <li style={{marginBottom:'5px'}}><strong>Odblokowane odznaczenia:</strong> {Object.keys(state.unlockedAchievements || {}).filter(k => state.unlockedAchievements[k]).length} / {ACHIEVEMENTS.length}</li>
               <li style={{marginBottom:'5px'}}><strong>Towary sprzedane:</strong> {fmtNum(totalItemsSold)} szt.</li>
            </ul>
         </div>
      </div>
      
      <h2 style={{color: 'var(--prl-yellow)', textAlign: 'center', margin: '30px 0'}}>Ludowa Tablica Odznaczeń i Zasług</h2>
      
      {/* Categories */}
      {['ekonomia', 'polityka', 'przemyt', 'prestiz'].map(cat => {
         const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat);
         const catName = cat === 'ekonomia' ? 'Zasługi Ekonomiczne (Spekulacja)' :
                         cat === 'polityka' ? 'Zasługi Polityczne (Nomenklatura)' :
                         cat === 'przemyt' ? 'Zasługi Logistyczne (Przemyt i Czarny Rynek)' :
                         'Zasługi Państwowe (Prestiż)';
         const unlockedInCat = catAchievements.filter(ach => state.unlockedAchievements[ach.id]).length;
                         
         return (
            <div key={cat} style={{marginBottom: '30px'}}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '20px' }}>
                  <h3 className="achievements-category-title" style={{ margin: 0, border: 'none' }}>{catName}</h3>
                  <span style={{ color: 'var(--prl-gray)', fontSize: '0.9rem' }}>{unlockedInCat} / {catAchievements.length}</span>
               </div>
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

export default TabOdznaczenia;