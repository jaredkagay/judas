export default function FatalitySystemView({ 
    role, selectingKiller, setSelectingKiller, 
    handleNeutralizedClick, setActiveTab, playerList, alias, confirmKill 
}) {
  return (
    <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #444', boxSizing: 'border-box' }}>
      {!selectingKiller ? (
        <>
          <h2 style={{ color: '#ff3333', marginBottom: '20px' }}>FATALITY SYSTEM</h2>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>Only engage this system if you have been eliminated from the mission.</p>
          
          <button 
            onClick={handleNeutralizedClick}
            className="btn" 
            style={{ 
              width: '100%', 
              padding: '20px', 
              backgroundColor: role === 'Imposter' ? '#222' : '#550000', 
              color: role === 'Imposter' ? '#555' : 'white',
              border: role === 'Imposter' ? '1px solid #333' : '2px solid #ff3333',
              cursor: role === 'Imposter' ? 'not-allowed' : 'pointer',
              marginBottom: '20px'
            }}
          >
            I WAS NEUTRALIZED
          </button>

          <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', backgroundColor: '#444' }}>
            BACK TO DASHBOARD
          </button>
        </>
      ) : (
        <>
          <h2 style={{ color: '#ff3333', marginBottom: '10px' }}>IDENTIFY ASSASSIN</h2>
          <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '20px' }}>Select the agent who neutralized you to register the kill.</p>
          
          <div className="lineup-container">
            {playerList
              .filter(p => p !== alias)
              .map(p => (
              <div key={p} className="lineup-card" onClick={() => confirmKill(p)}>
                {p}
              </div>
            ))}
          </div>

          <button className="btn" onClick={() => setSelectingKiller(false)} style={{ width: '100%', marginTop: '20px', backgroundColor: '#444' }}>
            CANCEL
          </button>
        </>
      )}
    </div>
  );
}