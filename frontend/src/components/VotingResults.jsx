import { btnStyle } from '../styles';

export default function VotingResults({ voteOutcome, resumeMission, gameOverData }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '30px' }}>
      <h2 style={{ color: '#aaa', letterSpacing: '2px' }}>VOTING CONCLUDED</h2>
      
      <div style={{ margin: '40px 0', padding: '30px', border: voteOutcome.eliminated === 'NO ONE' ? '2px solid #aaa' : '2px solid #ff3333', backgroundColor: '#111' }}>
        {voteOutcome.eliminated === 'NO ONE' ? (
          <h2 style={{ color: '#aaa' }}>VOTING TIED OR SKIPPED.<br/>NO AGENTS ELIMINATED.</h2>
        ) : (
          <>
            <h2 style={{ color: '#ff3333', fontSize: '36px', margin: '0' }}>AGENT ELIMINATED:</h2>
            <h1 style={{ color: 'white', fontSize: '48px', textTransform: 'uppercase', margin: '10px 0' }}>{voteOutcome.eliminated}</h1>
          </>
        )}
      </div>

      <div style={{ maxWidth: '300px', margin: '0 auto', textAlign: 'left', backgroundColor: '#1a1a1a', padding: '20px', border: '1px solid #333' }}>
        <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #444', paddingBottom: '10px' }}>FINAL TALLY:</h3>
        {Object.entries(voteOutcome.tally).map(([target, votes]) => (
          <div key={target} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span>{target}</span>
            <span style={{ fontWeight: 'bold', color: '#ff3333' }}>{votes}</span>
          </div>
        ))}
      </div>

      <button onClick={resumeMission} style={{ ...btnStyle, marginTop: '40px', backgroundColor: gameOverData ? '#cc00cc' : '#33ccff', color: gameOverData ? 'white' : 'black' }}>
        {gameOverData ? 'VIEW FINAL RESULTS' : 'RESUME MISSION'}
      </button>
    </div>
  );
}