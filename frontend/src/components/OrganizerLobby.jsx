import { btnStyle } from '../styles';

export default function OrganizerLobby({ roomCode, startGame, playerList }) {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>MISSION CREATED</h2>
      <h1 style={{ fontSize: '60px', color: '#ff3333', letterSpacing: '10px', margin: '20px 0' }}>{roomCode}</h1>
      <button onClick={startGame} style={{...btnStyle, backgroundColor: '#00cc00', marginBottom: '20px'}}>START MISSION</button>
      
      <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
        <h3>ROSTER ({playerList.length} CONNECTED)</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
          {playerList.map((player, idx) => (
            <div key={idx} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', border: '1px solid #444' }}>{player}</div>
          ))}
        </div>
      </div>
    </div>
  );
}