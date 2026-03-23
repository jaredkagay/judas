import './DiscussionPhase.css';

export default function DiscussionPhase({
  displayMeetingTime, playerList, alias, meetingCaller, startVoting
}) {
  return (
    <div className="discussion-container">
      <h2 className="discussion-title">DELIBERATION PHASE</h2>
      <p className="discussion-subtitle">Discuss the evidence. Decide your vote.</p>
      
      <div className={`discussion-timer ${displayMeetingTime > 0 ? 'timer-active' : 'timer-expired'}`}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      <div className="roster-box">
        <h3 className="roster-title">AGENTS PRESENT</h3>
        <div className="roster-list">
          {playerList.map((player, idx) => (
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
          disabled={displayMeetingTime > 0}
          onClick={startVoting}
          className="btn proceed-btn"
        >
          {displayMeetingTime > 0 ? 'AWAITING DELIBERATION...' : 'PROCEED TO VOTING'}
        </button>
      ) : (
        <div className="awaiting-caller-text">
          Awaiting <span className="caller-highlight">{meetingCaller}</span> to initiate voting sequence...
        </div>
      )}
    </div>
  );
}