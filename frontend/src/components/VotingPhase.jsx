export default function VotingPhase({
  meetingCaller, displayMeetingTime, alias, hasVoted, isAlive, eligibleTargets, castVote
}) {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px' }}>
      <h2 style={{ color: '#ff3333', fontSize: '28px', animation: 'blink 1s infinite' }}>🚨 EMERGENCY MEETING 🚨</h2>
      <p style={{ fontSize: '18px', marginBottom: '15px' }}>Initiated by: <strong style={{ color: '#ff3333' }}>{meetingCaller}</strong></p>
      
      <div style={{ margin: '20px 0', fontSize: '48px', fontWeight: 'bold', color: displayMeetingTime > 0 ? '#ffcc00' : '#ff3333' }}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      {alias === 'ORGANIZER' ? (
        <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #aaa', color: '#aaa', backgroundColor: '#111' }}>
          <h3>AWAITING AGENT VOTES...</h3>
          <p>The system will tally automatically once all active agents have voted or the timer expires.</p>
        </div>
      ) : hasVoted ? (
        <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #33ccff', color: '#33ccff', backgroundColor: '#111' }}>
          <h3>VOTE REGISTERED.</h3>
          <p>Awaiting server consensus...</p>
        </div>
      ) : (
        <>
          {isAlive ? (
            <>
              <h3 style={{ marginBottom: '20px' }}>SELECT AGENT TO ELIMINATE:</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                {eligibleTargets.map((player, idx) => player !== alias && (
                  <button key={idx} onClick={() => castVote(player)} style={{ padding: '15px', backgroundColor: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444', cursor: 'pointer', fontSize: '18px', textTransform: 'uppercase' }}>
                    {player}
                  </button>
                ))}
                <button onClick={() => castVote('SKIP')} style={{ padding: '15px', backgroundColor: '#333', color: '#aaa', border: '1px dashed #666', cursor: 'pointer', fontSize: '18px', marginTop: '20px' }}>
                  SKIP VOTE
                </button>
              </div>
            </>
          ) : (
            <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #666', color: '#aaa' }}>
              <h3>YOU ARE A GHOST</h3>
              <p>You cannot participate in voting.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}