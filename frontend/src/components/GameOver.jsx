import './GameOver.css';

export default function GameOver({ gameOverData, leaveGame }) {
  if (!gameOverData) return null;

  const isCrewWin = gameOverData.winner === 'Crewmates';

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