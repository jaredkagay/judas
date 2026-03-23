import { btnStyle } from '../styles';

export default function DiscussionPhase({
  displayMeetingTime, playerList, alias, meetingCaller, startVoting
}) {
  return (
    <div style={{ textAlign: 'center', marginTop: '20px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#ffcc00', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>DELIBERATION PHASE</h2>
      <p style={{ color: '#aaa', margin: 0 }}>Discuss the evidence. Decide your vote.</p>
      
      <div style={{ margin: '30px 0', fontSize: '64px', fontWeight: 'bold', color: displayMeetingTime > 0 ? '#33ccff' : '#ff3333', textShadow: '0 0 10px rgba(51, 204, 255, 0.3)' }}>
        00:{displayMeetingTime.toString().padStart(2, '0')}
      </div>

      <div style={{ backgroundColor: '#111', padding: '15px', border: '1px solid #333', textAlign: 'left', marginBottom: '40px' }}>
        <h3 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: 0 }}>AGENTS PRESENT</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {playerList.map((player, idx) => (
            <div key={idx} style={{ padding: '10px 0', borderBottom: '1px dashed #222', color: '#f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
              <span>{player}</span>
            </div>
          ))}
        </div>
      </div>

      {alias === 'ORGANIZER' ? (
        <button 
          onClick={startVoting}
          style={{ ...btnStyle, width: '100%', backgroundColor: '#ffcc00', color: 'black', cursor: 'pointer' }}
        >
          PROCEED TO VOTING (OVERRIDE)
        </button>
      ) : alias === meetingCaller ? (
        <button 
          disabled={displayMeetingTime > 0}
          onClick={startVoting}
          style={{ ...btnStyle, width: '100%', backgroundColor: displayMeetingTime > 0 ? '#333' : '#ff3333', color: displayMeetingTime > 0 ? '#666' : 'white', cursor: displayMeetingTime > 0 ? 'not-allowed' : 'pointer' }}
        >
          {displayMeetingTime > 0 ? 'AWAITING DELIBERATION...' : 'PROCEED TO VOTING'}
        </button>
      ) : (
        <div style={{ color: '#666', fontStyle: 'italic', padding: '20px', border: '1px dashed #333' }}>
          Awaiting <span style={{ color: '#ff3333' }}>{meetingCaller}</span> to initiate voting sequence...
        </div>
      )}
    </div>
  );
}