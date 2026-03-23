import './OrganizerLobby.css';

export default function OrganizerLobby({ roomCode, startGame, playerList }) {
  return (
    <div className="lobby-container">
      <h2>MISSION CREATED</h2>
      <h1 className="lobby-room-code">{roomCode}</h1>
      <button onClick={startGame} className="btn lobby-start-btn">START MISSION</button>
      
      <div className="roster-container">
        <h3>ROSTER ({playerList.length} CONNECTED)</h3>
        <div className="roster-grid">
          {playerList.map((player, idx) => (
            <div key={idx} className="player-chip">{player}</div>
          ))}
        </div>
      </div>
    </div>
  );
}