import './GameOver.css';

export default function GameOver({ gameOverData, alias, playAgain, endGameHost }) {
  const isAux = alias?.startsWith('AUX_');

  if (!gameOverData) return null;

  const isCrewWin = gameOverData.winner === 'Crewmates';

  if (isAux) {
    return (
      <div style={{ textAlign: 'center', marginTop: '15vh' }}>
        <h2 style={{ color: '#aaa', letterSpacing: '4px' }}>MISSION TERMINATED</h2>
        <h1 style={{ 
          fontSize: '80px', 
          color: isCrewWin ? '#33ccff' : '#ff3333', 
          margin: '40px 0' 
        }}>
          {gameOverData.winner.toUpperCase()} WIN
        </h1>
        <p style={{ color: '#777', fontSize: '24px', letterSpacing: '2px', marginTop: '20px' }}>
          {gameOverData.reason.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="gameover-container">
      <h2 className="gameover-header">MISSION TERMINATED</h2>
      
      <div className={`winner-box ${isCrewWin ? 'winner-crewmates' : 'winner-imposters'}`}>
        <h1 className={`winner-text ${isCrewWin ? 'text-crewmates' : 'text-imposters'}`}>
          {gameOverData.winner} WIN
        </h1>
        <h3 className="reason-text">{gameOverData.reason}</h3>
      </div>

      {alias === 'ORGANIZER' && (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
          <button onClick={playAgain} className="btn" style={{ backgroundColor: '#00cc00' }}>
            START NEW GAME
          </button>
          <button onClick={endGameHost} className="btn return-lobby-btn" style={{ margin: 0 }}>
            END GAME
          </button>
        </div>
      )}
    </div>
  );
}