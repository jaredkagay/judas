import { useEffect } from 'react';
import './DiscussionPhase.css';

// Add playerList to the destructured props
export default function DiscussionPhase({ displayMeetingTime, alivePlayers, playerList, alias, meetingCaller, startVoting }) {
  const isAux = alias.startsWith('AUX_');

  // Compute ghosts/spectators
  const ghosts = playerList?.filter(p => 
    !alivePlayers.includes(p) && 
    !p.startsWith('AUX_') && 
    p !== 'ORGANIZER'
  ) || [];

  useEffect(() => {
    if (displayMeetingTime === 0 && (isAux || alias === 'ORGANIZER' || alias === meetingCaller)) {
      startVoting();
    }
  }, [displayMeetingTime, isAux, alias, meetingCaller, startVoting]);

  if (isAux) {
    return (
      <div style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h2 style={{ color: '#aaa', letterSpacing: '4px' }}>DELIBERATION IN PROGRESS</h2>
        <h1 style={{ fontSize: '120px', color: '#ff3333', margin: '40px 0' }}>{displayMeetingTime}s</h1>
        <button 
          onClick={startVoting} className="btn" 
          style={{ backgroundColor: '#ff3333', fontSize: '28px', padding: '20px 40px', marginTop: '50px' }}
        >
          START VOTING (OVERRIDE TIMER)
        </button>
      </div>
    );
  }

  // STANDARD PLAYER VIEW
  return (
    <div className="discussion-container">
      <h2 className="discussion-title">DELIBERATION PHASE</h2>
      <p className="discussion-subtitle">Discuss the evidence. Decide your vote.</p>

      <div className={`discussion-timer ${displayMeetingTime > 0 ? 'timer-active' : 'timer-expired'}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      <div className="roster-box">
        <h3 className="roster-title">ALIVE AGENTS</h3>
        <div className="roster-list">
          {alivePlayers.map((player, idx) => (
            <div key={idx} className="roster-agent">
              <span>{player}</span>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Ghost / Spectator Table */}
      {ghosts.length > 0 && (
        <div className="roster-box" style={{ marginTop: '20px', opacity: 0.5 }}>
          <h3 className="roster-title" style={{ color: '#888' }}>DECEASED / SPECTATORS</h3>
          <div className="roster-list">
            {ghosts.map((player, idx) => (
              <div key={idx} className="roster-agent" style={{ borderColor: '#444', color: '#888' }}>
                <span>{player}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {alias === 'ORGANIZER' && (
        <button onClick={startVoting} className="btn override-btn" style={{marginTop: '20px'}}>
          PROCEED TO VOTING (HOST OVERRIDE)
        </button>
      )}
    </div>
  );
}