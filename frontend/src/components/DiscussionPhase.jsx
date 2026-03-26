import { useEffect } from 'react';
import './DiscussionPhase.css';

export default function DiscussionPhase({ displayMeetingTime, alivePlayers, playerList, alias, meetingCaller, startVoting }) {
  const isAux = alias.startsWith('AUX_');

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
      <div className="discussion-wrapper" style={{ justifyContent: 'center', height: '100vh' }}>
        <h2 className="discussion-title">DELIBERATION IN PROGRESS</h2>
        <div className={`timer-display ${displayMeetingTime <= 10 ? 'timer-urgent' : ''}`}>
          {displayMeetingTime}s
        </div>
        <button onClick={startVoting} className="btn-primary btn-accent" style={{ padding: '24px 48px', fontSize: '1.5rem', marginTop: '32px' }}>
          FORCE VOTING
        </button>
      </div>
    );
  }

  return (
    <div className="discussion-wrapper">
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <h2 className="discussion-title">DELIBERATION PHASE</h2>
        <p className="discussion-subtitle">Discuss the evidence. Decide your vote.</p>
      </div>

      <div className={`timer-display ${displayMeetingTime <= 10 ? 'timer-urgent' : ''}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '16px' }}>
        <h3 className="roster-header">ALIVE AGENTS</h3>
        <div className="discussion-roster">
          {alivePlayers.map((player, idx) => (
            <div key={idx} className="discussion-agent-chip">
              {player}
            </div>
          ))}
        </div>
      </div>

      {ghosts.length > 0 && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '16px', marginTop: '16px', opacity: 0.6 }}>
          <h3 className="roster-header" style={{ color: 'var(--accent-red)' }}>CASUALTIES / SPECTATORS</h3>
          <div className="discussion-roster">
            {ghosts.map((player, idx) => (
              <div key={idx} className="discussion-agent-chip chip-dead">
                {player}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}