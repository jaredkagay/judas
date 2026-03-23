import './Home.css';

export default function Home({ roomCode, setRoomCode, alias, setAlias, joinRoom, setView, hostId }) {
  return (
    <div className="home-container">
      <input type="text" placeholder="ROOM CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} className="input-field" />
      <input type="text" placeholder="AGENT ALIAS" value={alias} onChange={(e) => setAlias(e.target.value)} className="input-field" />
      
      <button onClick={joinRoom} className="btn">JOIN MISSION</button>
      
      <div className="home-divider">— OR —</div>
      
      <button onClick={() => { 
        if (hostId) {
          setView('host_dashboard');
        } else {
          setView('host_auth'); 
        }
      }} className="btn host-btn">
        HOST MISSION
      </button>
    </div>
  );
}