// frontend/src/components/Player/FatalitySystemView.jsx
export default function FatalitySystemView({ 
  role, selectingKiller, setSelectingKiller, 
  handleNeutralizedClick, setActiveTab, playerList, alias, confirmKill 
}) {
  return (
    <div className="glass-panel text-center">
      {!selectingKiller ? (
        <>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '16px', letterSpacing: '2px' }}>FATALITY SYSTEM</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '32px', lineHeight: '1.5' }}>
            Only engage this system if you have been eliminated from the mission.
          </p>
          
          <button 
            onClick={handleNeutralizedClick}
            className={`btn-primary ${role !== 'Imposter' ? 'btn-accent' : ''}`} 
            style={{ 
              width: '100%', 
              padding: '24px', 
              fontSize: '1.1rem',
              letterSpacing: '2px',
              marginBottom: '16px',
              opacity: role === 'Imposter' ? 0.4 : 1,
              cursor: role === 'Imposter' ? 'not-allowed' : 'pointer'
            }}
            disabled={role === 'Imposter'}
          >
            I WAS NEUTRALIZED
          </button>

          <button className="btn-primary" onClick={() => setActiveTab('main')} style={{ width: '100%' }}>
            BACK TO DASHBOARD
          </button>
        </>
      ) : (
        <>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '16px', letterSpacing: '2px' }}>IDENTIFY ASSASSIN</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
            Select the agent who neutralized you to register the kill.
          </p>
          
          <div className="lineup-container">
            {playerList
              .filter(p => p !== alias)
              .map(p => (
              <div key={p} className="lineup-card" onClick={() => confirmKill(p)}>
                {p}
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setSelectingKiller(false)} style={{ width: '100%', marginTop: '24px' }}>
            CANCEL
          </button>
        </>
      )}
    </div>
  );
}