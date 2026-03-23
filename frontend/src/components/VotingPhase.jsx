import './VotingPhase.css';

export default function VotingPhase({
  meetingCaller, displayMeetingTime, alias, hasVoted, isAlive, eligibleTargets, castVote
}) {
  return (
    <div className="voting-container">
      <h2 className="voting-alert-title">🚨 EMERGENCY MEETING 🚨</h2>
      <p className="voting-caller-info">Initiated by: <strong className="caller-highlight">{meetingCaller}</strong></p>
      
      <div className={`voting-timer ${displayMeetingTime > 0 ? 'timer-active' : 'timer-expired'}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      {alias === 'ORGANIZER' ? (
        <div className="status-box status-awaiting">
          <h3>AWAITING AGENT VOTES...</h3>
          <p>The system will tally automatically once all active agents have voted or the timer expires.</p>
        </div>
      ) : hasVoted ? (
        <div className="status-box status-voted">
          <h3>VOTE REGISTERED.</h3>
          <p>Awaiting server consensus...</p>
        </div>
      ) : (
        <>
          {isAlive ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>SELECT AGENT TO ELIMINATE:</h3>
              <div className="targets-container">
                {eligibleTargets.map((player, idx) => player !== alias && (
                  <button key={idx} onClick={() => castVote(player)} className="target-btn">
                    {player}
                  </button>
                ))}
                <button onClick={() => castVote('SKIP')} className="skip-btn">
                  SKIP VOTE
                </button>
              </div>
            </>
          ) : (
            <div className="status-box status-ghost">
              <h3>YOU ARE A GHOST</h3>
              <p>You cannot participate in voting.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}