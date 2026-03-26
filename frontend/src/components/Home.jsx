// src/components/Home.jsx
import './Home.css';

export default function Home({ roomCode, setRoomCode, alias, setAlias, joinRoom, setView, hostId }) {
  return (
    <div className="home-wrapper">
      <div className="home-content">
        
        <div className="brand-header">
          <h1 className="brand-title">JUDAS</h1>
          <p className="brand-subtitle">OPERATIVE AUTHENTICATION</p>
        </div>

        <div className="join-section">
          <input 
            type="text" 
            placeholder="Room Code" 
            value={roomCode} 
            onChange={(e) => setRoomCode(e.target.value)} 
            className="input-base" 
          />
          <input 
            type="text" 
            placeholder="Agent Alias" 
            value={alias} 
            onChange={(e) => setAlias(e.target.value)} 
            className="input-base" 
          />
          <button onClick={() => joinRoom(alias, 'player')} className="btn-primary btn-accent">
            Join Mission
          </button>
        </div>
        
        <div className="divider">
          <span>OR</span>
        </div>
        
        <div className="action-section">
          <button onClick={() => { 
            if (hostId) {
              setView('host_dashboard');
            } else {
              setView('host_auth'); 
            }
          }} className="btn-primary">
            Host Mission
          </button>

          <button 
            onClick={() => setView('aux_setup')} 
            className="btn-text"
          >
            Configure Auxiliary Device
          </button>
        </div>

      </div>
    </div>
  );
}