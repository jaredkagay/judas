import './GameOver.css';

export default function GameOver({ gameOverData, leaveGame, alias }) {
  // 1. Safety check for the iPad
  const isAux = alias?.startsWith('AUX_');

  // 2. Safety check for missing data
  if (!gameOverData) return null;

  // 3. THIS WAS MISSING! Define isCrewWin for both views to use
  const isCrewWin = gameOverData.winner === 'Crewmates';

  // --- IPAD / TERMINAL VIEW ---
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

  // --- STANDARD PLAYER VIEW ---
  return (
    <div className="gameover-container">
      <h2 className="gameover-header">MISSION TERMINATED</h2>
      
      <div className={`winner-box ${isCrewWin ? 'winner-crewmates' : 'winner-imposters'}`}>
        <h1 className={`winner-text ${isCrewWin ? 'text-crewmates' : 'text-imposters'}`}>
          {gameOverData.winner} WIN
        </h1>
        <h3 className="reason-text">{gameOverData.reason}</h3>
      </div>

      <button onClick={leaveGame} className="btn return-lobby-btn">
        DISCONNECT & RETURN TO LOBBY
      </button>
    </div>
  );
}