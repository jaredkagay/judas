// frontend/src/components/Host/LobbyManager.jsx
import './LobbyManager.css';

export default function LobbyManager({ 
    roomCode, handleHostGame, startGame, playerList, kickPlayer 
}) {
  if (!roomCode) {
    return (
      <div className="glass-panel text-center">
        <h3 className="lobby-standby-text">UPLINK STANDBY</h3>
        <button onClick={handleHostGame} className="btn-primary" style={{width: '100%'}}>GENERATE ROOM CODE</button>
      </div>
    );
  }

  return (
    <div className="glass-panel">
      <div className="text-center" style={{marginBottom: '32px'}}>
        <h3 className="lobby-established-text">UPLINK ESTABLISHED</h3>
        <h1 className="lobby-code-display">{roomCode}</h1>
        <button onClick={startGame} className="btn-primary lobby-start-btn">START MISSION</button>
      </div>
      <div>
        <h3 className="lobby-roster-title">ROSTER ({playerList?.length || 0} CONNECTED)</h3>
        <div className="roster-grid">
          {playerList?.map((player, idx) => (
            <div key={idx} className="player-chip" onClick={() => kickPlayer(player)} title={`Click to kick ${player}`}>
              {player}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}