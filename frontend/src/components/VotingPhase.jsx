import './VotingPhase.css';

export default function VotingPhase({ meetingCaller, displayMeetingTime, alias, hasVoted, isAlive, eligibleTargets, castVote }) {
  const isAux = alias.startsWith('AUX_');
  const displayCaller = meetingCaller.startsWith('AUX_') ? 'Emergency Button' : meetingCaller;

  if (isAux) {
    return (
      <div className="voting-wrapper center-content">
        <div className={`timer-display ${displayMeetingTime <= 10 ? 'timer-urgent' : ''}`}>
          {displayMeetingTime}s
        </div>
        <h2 className="voting-subtitle" style={{ marginTop: '24px' }}>WAITING FOR CONSENSUS...</h2>
      </div>
    );
  }

  return (
    <div className="voting-wrapper">
      <div className="text-center" style={{ marginBottom: '24px' }}>
        <h2 className="voting-title" style={{ color: 'var(--accent-red)' }}>🚨 VOTING ACTIVE 🚨</h2>
        <p className="voting-caller">Initiated by: <span style={{ color: 'var(--accent-red)' }}>{displayCaller}</span></p>
      </div>

      <div className={`timer-display ${displayMeetingTime <= 10 ? 'timer-urgent' : ''}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      {alias === 'ORGANIZER' ? (
        <div className="glass-panel text-center">
          <h3 className="status-header">AWAITING AGENT VOTES...</h3>
          <p className="status-text">The system will tally automatically once all active agents have voted or the timer expires.</p>
        </div>
      ) : hasVoted ? (
        <div className="glass-panel text-center" style={{ borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
          <h3 className="status-header" style={{ color: '#10b981' }}>VOTE REGISTERED</h3>
          <p className="status-text">Awaiting server consensus...</p>
        </div>
      ) : (
        <>
          {isAlive ? (
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
              <h3 className="roster-header text-center" style={{ marginBottom: '24px' }}>SELECT AGENT TO ELIMINATE</h3>
              <div className="targets-grid">
                {eligibleTargets.map((player, idx) => player !== alias && (
                  <button key={idx} onClick={() => castVote(player)} className="target-btn">
                    {player}
                  </button>
                ))}
              </div>
              <button onClick={() => castVote('SKIP')} className="skip-btn">
                SKIP VOTE
              </button>
            </div>
          ) : (
            <div className="glass-panel text-center ghost-panel">
              <h3 className="status-header">YOU ARE NEUTRALIZED</h3>
              <p className="status-text">You cannot participate in voting.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}