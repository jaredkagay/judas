// frontend/src/components/AuxiliaryJoin.jsx
import { useState } from 'react';
import './Auxiliary.css';

export default function AuxiliaryJoin({ roomCode, setRoomCode, joinRoom, setView }) {
  const [deviceType, setDeviceType] = useState('AUX_EMERGENCY');

  const handleJoin = () => {
    if (!roomCode) return alert("Please enter a room code.");
    joinRoom(deviceType, 'aux_lobby');
  };

  return (
    <div className="aux-wrapper">
      <div className="glass-panel text-center" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ color: 'var(--text-secondary)', letterSpacing: '4px', marginBottom: '32px', fontFamily: 'var(--font-mono)' }}>
          HARDWARE INITIALIZATION
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="ROOM CODE" 
            value={roomCode} 
            onChange={(e) => setRoomCode(e.target.value)} 
            className="input-base text-center"
            style={{ fontSize: '1.5rem', letterSpacing: '8px' }}
          />
          
          <select 
            value={deviceType} 
            onChange={(e) => setDeviceType(e.target.value)}
            className="input-base"
            style={{ appearance: 'none', textAlign: 'center' }}
          >
            <option value="AUX_EMERGENCY">EMERGENCY CONSOLE</option>
            {/* Future expansions: AUX_SECURITY_CAMS, AUX_ADMIN_MAP, etc. */}
          </select>

          <button onClick={handleJoin} className="btn-primary" style={{ marginTop: '16px', borderColor: '#38bdf8', color: '#38bdf8' }}>
            CONNECT DEVICE
          </button>
          
          <button onClick={() => setView('home')} className="btn-primary">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}