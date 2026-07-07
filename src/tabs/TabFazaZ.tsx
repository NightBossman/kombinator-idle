import { useState } from 'react';
import { useGameApi } from './GameApiContext';
import { fmtNum } from '../utils/format';

export default function TabFazaZ() {
  const api = useGameApi();
  const s = api.state;
  const [bondsAmount, setBondsAmount] = useState<number>(1000);

  const renderKpoPanel = () => {
    // [Claude] panel odzwierciedla domknięcie pętli: po zatwierdzeniu KPO znikają przyciski
    // lobbingu, a pasek nie przekracza już 100%.
    const approved = !!s.kpoApproved?.['zatwierdzony'];
    const progress = Math.min(10000, s.kpoLobbyProgress || 0);
    const pct = Math.floor((progress / 10000) * 100);
    return (
      <div className="panel">
        <h2>🏛️ KRAJOWY PLAN ODBUDOWY (KPO)</h2>
        {approved ? (
          <>
            <p style={{ color: 'var(--dollar-green)', fontWeight: 'bold' }}>✅ KPO ZATWIERDZONY — dotacja z Brukseli wpłynęła.</p>
            <p style={{ color: 'var(--prl-gray)' }}>Kamienie milowe odhaczone. Fundusze rozdysponowane.</p>
          </>
        ) : (
          <>
            <p>Lobbing w Brukseli wymaga czasu i pieniędzy. Waluty otwierają różne drzwi.</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
              <button onClick={() => api.fundKpoLobby(1000000, 'pln')} disabled={s.pln < 1000000}>Lobbuj (1M PLN)</button>
              <button onClick={() => api.fundKpoLobby(100000, 'usd')} disabled={s.dollars < 100000}>Lobbuj (100k USD)</button>
              <button onClick={() => api.fundKpoLobby(100000, 'eur')} disabled={s.euros < 100000}>Lobbuj (100k EUR)</button>
            </div>
            <p>Postęp lobbingu: {fmtNum(progress)} / 10 000 ({pct}%)</p>
          </>
        )}
      </div>
    );
  };

  const renderAiSaaSPanel = () => {
    const costEur = 100000 * Math.pow(1.5, s.gpuClusters || 0);
    return (
      <div className="panel">
        <h2>🤖 AI SaaS (B2B)</h2>
        <p>Klastry GPU generują ogromne przychody w USD i EUR, ale pożerają mnóstwo prądu.</p>
        <p>Posiadane klastry: {s.gpuClusters || 0}</p>
        <button onClick={() => api.buyGpuCluster()}>
          Kup Klaster GPU ({fmtNum(costEur)} EUR)
        </button>
        <div style={{ marginTop: '10px' }}>
          <button onClick={() => api.toggleAiSaaS()} style={{ backgroundColor: s.aiSaaSActive ? '#27ae60' : '' }}>
            {s.aiSaaSActive ? 'WYŁĄCZ USŁUGĘ' : 'WŁĄCZ USŁUGĘ'}
          </button>
        </div>
      </div>
    );
  };

  const renderBondsPanel = () => {
    return (
      <div className="panel">
        <h2>📈 OBLIGACJE SKARBOWE DETALICZNE</h2>
        <p>Inwestuj w obligacje COI i EDO chroniąc się przed inflacją.</p>
        <p>Obecna Inflacja: {fmtNum(s.inflationPercent)}%</p>
        <p>Posiadane COI: {fmtNum(s.coiBondsPLN || 0)} PLN (Oprocentowanie: {fmtNum(Math.max(0, s.inflationPercent) + 1.5)}%)</p>
        <p>Posiadane EDO: {fmtNum(s.edoBondsPLN || 0)} PLN (Oprocentowanie: {fmtNum(Math.max(0, s.inflationPercent) + 2.0)}%)</p>
        
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input 
            type="number" 
            value={bondsAmount} 
            onChange={e => setBondsAmount(Number(e.target.value) || 0)}
            style={{ padding: '5px', width: '120px', backgroundColor: '#000', color: '#0f0', border: '1px solid #0f0' }}
          />
          <button onClick={() => api.buyBonds('coi', bondsAmount)}>Kup COI</button>
          <button onClick={() => api.buyBonds('edo', bondsAmount)}>Kup EDO</button>
          <button onClick={() => api.sellBonds('coi', bondsAmount)}>Sprzedaj COI</button>
          <button onClick={() => api.sellBonds('edo', bondsAmount)}>Sprzedaj EDO</button>
        </div>
      </div>
    );
  };

  const renderRppPanel = () => {
    return (
      <div className="panel">
        <h2>🏦 RADA POLITYKI PIENIĘŻNEJ (RPP)</h2>
        <p>Co 60 sekund prezes NBP organizuje stand-up. Stopy się zmieniają, WIBOR wariuje.</p>
        <p style={{ fontSize: '1.2em' }}>Aktualna Stopa NBP: <strong>{fmtNum(s.nbpInterestRate || 0)}%</strong></p>
        <p>WIBOR: {fmtNum(s.wiborRate || 0)}% (Raty kredytu zależą od tego!)</p>
        <p>Następne posiedzenie za: {Math.ceil(s.rppMeetingTimer || 0)}s</p>
      </div>
    );
  };

  return (
    <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease-in' }}>
      <h1>FAZA Z: ERA AI I KPO (2024+)</h1>
      <p style={{ color: 'var(--prl-gray)', marginBottom: '20px' }}>
        Pandemia to już tylko wspomnienie. Teraz na tapecie jest Krajowy Plan Odbudowy, boom na sztuczną inteligencję i stand-upy prezesa NBP. Stopy procentowe grają własną melodię, a inflacja znów szaleje. Czas ugrać na tym swoje.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {renderRppPanel()}
        {renderBondsPanel()}
        {renderAiSaaSPanel()}
        {renderKpoPanel()}
      </div>
    </div>
  );
}
