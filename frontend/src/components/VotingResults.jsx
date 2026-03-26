import './VotingResults.css';

export default function VotingResults({ voteOutcome, resumeMission, gameOverData }) {
  const { eliminated, tally, wasImposter, impostersRemaining } = voteOutcome;

  return (
    <div className="results-wrapper">
      <h2 className="results-header">VOTING CONCLUDED</h2>
      
      <div className={`glass-panel text-center elimination-panel ${eliminated === 'NO ONE' ? 'tied-panel' : 'eliminated-panel'}`}>
        {eliminated === 'NO ONE' ? (
          <h2 className="tied-text">VOTING TIED OR SKIPPED.<br/>NO AGENTS ELIMINATED.</h2>
        ) : (
          <>
            <h3 className="eliminated-label">AGENT ELIMINATED:</h3>
            <h1 className="eliminated-name">{eliminated}</h1>
          </>
        )}
      </div>

      {eliminated !== 'NO ONE' && wasImposter !== undefined && wasImposter !== null && (
        <div className="glass-panel text-center reveal-panel">
          <h2 className={`reveal-text ${wasImposter ? 'reveal-imposter' : 'reveal-crewmate'}`}>
            {eliminated} was {wasImposter ? 'an Imposter.' : 'not an Imposter.'}
          </h2>
          <h3 className="reveal-subtext">
            {impostersRemaining} Imposter{impostersRemaining !== 1 ? 's' : ''} remain{impostersRemaining === 1 ? 's' : ''}.
          </h3>
        </div>
      )}

      <div className="glass-panel tally-panel">
        <h3 className="tally-header">FINAL TALLY</h3>
        <div className="tally-list">
          {Object.entries(tally).sort((a,b) => b[1] - a[1]).map(([target, votes]) => (
            <div key={target} className="tally-row">
              <span className="tally-target">{target}</span>
              <span className="tally-count">{votes}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Universal Mission Resume Control */}
      <button onClick={resumeMission} className="btn-primary" style={{ width: '100%', borderColor: '#10b981', color: '#10b981', marginTop: '16px' }}>
        CONTINUE MISSION
      </button>

    </div>
  );
}