export default function LobbyManager({ 
    roomCode, handleHostGame, startGame, playerList, kickPlayer 
}) {
  if (!roomCode) {
    return (
      <button onClick={handleHostGame} className="btn generate-btn">GENERATE ROOM CODE</button>
    );
  }

  return (
    <div className="lobby-info">
      <div className="lobby-room-code-container">
        <h2>MISSION CREATED</h2>
        <h1 className="lobby-room-code">{roomCode}</h1>
        <button onClick={startGame} className="btn lobby-start-btn" style={{ backgroundColor: '#00cc00' }}>START MISSION</button>
      </div>
      <div className="roster-container">
        <h3 style={{ marginTop: 0 }}>ROSTER ({playerList?.length || 0} CONNECTED)</h3>
        <div className="roster-grid">
          {playerList?.map((player, idx) => (
            <div 
              key={idx} 
              className="player-chip kickable" 
              onClick={() => kickPlayer(player)}
              title={`Click to kick ${player}`}
            >
              {player}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}