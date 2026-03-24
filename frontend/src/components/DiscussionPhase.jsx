import { useEffect } from 'react';
import './DiscussionPhase.css';

export default function DiscussionPhase({ displayMeetingTime, alivePlayers, alias, meetingCaller, startVoting }) {
  const isAux = alias.startsWith('AUX_');
  const displayCaller = meetingCaller.startsWith('AUX_') ? 'Emergency Button' : meetingCaller;

  useEffect(() => {
    // Auto-advance if the timer hits 0
    if (displayMeetingTime === 0 && (alias === meetingCaller || alias === 'ORGANIZER')) {
      startVoting();
    }
  }, [displayMeetingTime, alias, meetingCaller, startVoting]);

  if (isAux) {
    return (
      <div style={{ textAlign: 'center', marginTop: '10vh' }}>
        <h2 style={{ color: '#aaa', letterSpacing: '4px' }}>DELIBERATION IN PROGRESS</h2>
        <h1 style={{ fontSize: '120px', color: '#ff3333', margin: '40px 0' }}>{displayMeetingTime}s</h1>
        
        {alias === meetingCaller && (
          <button 
            onClick={startVoting} 
            className="btn" 
            style={{ backgroundColor: '#ff3333', fontSize: '28px', padding: '20px 40px', marginTop: '50px' }}
          >
            START VOTING
          </button>
        )}
      </div>
    );
  }

  // STANDARD PLAYER VIEW
  return (
    <div className="discussion-container">
      <h2 className="discussion-title">DELIBERATION PHASE</h2>
      <p className="discussion-subtitle">Discuss the evidence. Decide your vote.</p>

      {/* THIS IS THE TIMER THAT WAS MISSING FOR PLAYERS: */}
      <div className={`discussion-timer ${displayMeetingTime > 0 ? 'timer-active' : 'timer-expired'}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      <div className="roster-box">
        <h3 className="roster-title">AGENTS PRESENT</h3>
        <div className="roster-list">
          {alivePlayers.map((player, idx) => (
            <div key={idx} className="roster-agent">
              <span>{player}</span>
            </div>
          ))}
        </div>
      </div>

      {alias === 'ORGANIZER' ? (
        <button onClick={startVoting} className="btn override-btn">
          PROCEED TO VOTING (OVERRIDE)
        </button>
      ) : alias === meetingCaller ? (
        <button 
          onClick={startVoting} 
          className="btn proceed-btn"
        >
          PROCEED TO VOTING (OVERRIDE)
        </button>
      ) : (
        <div className="awaiting-caller-text">
          Awaiting <span className="caller-highlight">{displayCaller}</span> to initiate voting sequence...
        </div>
      )}
    </div>
  );
}