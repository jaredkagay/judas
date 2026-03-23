import { btnStyle, inputStyle } from '../styles';

export default function Home({ roomCode, setRoomCode, alias, setAlias, joinRoom, setView, hostId }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '50px' }}>
      <input type="text" placeholder="ROOM CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={inputStyle} />
      <input type="text" placeholder="AGENT ALIAS" value={alias} onChange={(e) => setAlias(e.target.value)} style={inputStyle} />
      
      <button onClick={joinRoom} style={btnStyle}>JOIN MISSION</button>
      <div style={{ textAlign: 'center', margin: '20px 0', color: '#555', letterSpacing: '2px' }}>— OR —</div>
      
      <button onClick={() => { 
        if (hostId) {
          setView('host_dashboard');
        } else {
          setView('host_auth'); 
        }
      }} style={{...btnStyle, backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#aaa'}}>
        HOST MISSION
      </button>
    </div>
  );
}