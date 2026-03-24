import { useState } from 'react';

export default function AuxiliaryJoin({ roomCode, setRoomCode, joinRoom, setView }) {
  const [deviceType, setDeviceType] = useState('AUX_EMERGENCY');

  const handleJoin = () => {
    if (!roomCode) return alert("Please enter a room code.");
    // Pass the device type as the alias, and 'aux_lobby' as the target view
    joinRoom(deviceType, 'aux_lobby');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '300px', margin: '50px auto', textAlign: 'center' }}>
      <h2 style={{ color: '#aaa', letterSpacing: '2px' }}>AUX DEVICE SETUP</h2>
      
      <input 
        type="text" 
        placeholder="ROOM CODE" 
        value={roomCode} 
        onChange={(e) => setRoomCode(e.target.value)} 
        className="input-field" 
      />
      
      <select 
        value={deviceType} 
        onChange={(e) => setDeviceType(e.target.value)}
        className="input-field"
        style={{ backgroundColor: '#111', color: 'white', border: '1px solid #444', padding: '10px' }}
      >
        <option value="AUX_EMERGENCY">Emergency Meeting Button</option>
        {/* You can add AUX_SECURITY_CAMS or other devices here later */}
      </select>

      <button onClick={handleJoin} className="btn" style={{ backgroundColor: '#cc00cc' }}>
        CONNECT DEVICE
      </button>

      <button 
        onClick={() => setView('home')} 
        style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', cursor: 'pointer', marginTop: '10px' }}
      >
        Back to Home
      </button>
    </div>
  );
}