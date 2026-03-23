import './VotingResults.css';

export default function VotingResults({ voteOutcome, resumeMission, gameOverData }) {
  return (
    <div className="results-container">
      <h2 className="results-header">VOTING CONCLUDED</h2>
      
      <div className={`elimination-box ${voteOutcome.eliminated === 'NO ONE' ? 'elimination-tied' : 'elimination-player'}`}>
        {voteOutcome.eliminated === 'NO ONE' ? (
          <h2 className="tied-text">VOTING TIED OR SKIPPED.<br/>NO AGENTS ELIMINATED.</h2>
        ) : (
          <>
            <h2 className="eliminated-label">AGENT ELIMINATED:</h2>
            <h1 className="eliminated-name">{voteOutcome.eliminated}</h1>
          </>
        )}
      </div>

      <div className="tally-box">
        <h3 className="tally-header">FINAL TALLY:</h3>
        {Object.entries(voteOutcome.tally).map(([target, votes]) => (
          <div key={target} className="tally-row">
            <span>{target}</span>
            <span className="tally-count">{votes}</span>
          </div>
        ))}
      </div>

      <button 
        onClick={resumeMission} 
        className={`btn resume-btn ${gameOverData ? 'resume-gameover' : 'resume-active'}`}
      >
        {gameOverData ? 'VIEW FINAL RESULTS' : 'RESUME MISSION'}
      </button>
    </div>
  );
}