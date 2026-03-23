import { btnStyle } from '../styles';

export default function GameOver({ gameOverData, leaveGame }) {
  if (!gameOverData) return null;

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2 style={{ color: '#aaa', letterSpacing: '5px' }}>MISSION TERMINATED</h2>
      
      <div style={{ 
        marginTop: '40px', padding: '40px 20px', 
        border: gameOverData.winner === 'Crewmates' ? '2px solid #33ccff' : '2px solid #ff3333',
        backgroundColor: '#111' 
      }}>
        <h1 style={{ 
          fontSize: '50px', margin: '0 0 20px 0', textTransform: 'uppercase',
          color: gameOverData.winner === 'Crewmates' ? '#33ccff' : '#ff3333' 
        }}>
          {gameOverData.winner} WIN
        </h1>
        <h3 style={{ color: '#aaa', margin: 0 }}>{gameOverData.reason}</h3>
      </div>

      <button onClick={leaveGame} style={{ ...btnStyle, marginTop: '60px', backgroundColor: '#333' }}>
        DISCONNECT & RETURN TO LOBBY
      </button>
    </div>
  );
}