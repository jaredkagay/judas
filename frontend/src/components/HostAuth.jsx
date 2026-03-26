// frontend/src/components/HostAuth.jsx
import { useState } from 'react';

export default function HostAuth({ setHostId, setHostUsername, setView }) {
  const [authMode, setAuthMode] = useState('login'); 
  const [localUsername, setLocalUsername] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  const authenticateHost = async (e) => {
    e.preventDefault();
    if (!localUsername || !localPassword) return;

    const endpoint = authMode === 'login' ? '/login' : '/register';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: localUsername, password: localPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Authentication failed: ${errorData.detail}`);
        return;
      }

      const data = await response.json();
      
      setHostId(data.host_id);
      setHostUsername(data.username);
      
      localStorage.setItem('hostId', data.host_id);
      localStorage.setItem('hostUsername', data.username);
      
      setView('host_dashboard'); 
    } catch (error) {
      console.error("Auth error:", error);
      alert("Failed to connect to the server.");
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <div className="glass-panel text-center" style={{ maxWidth: '400px', width: '90%' }}>
        <h2 style={{ color: 'var(--text-secondary)', letterSpacing: '4px', marginBottom: '32px', fontFamily: 'var(--font-mono)' }}>
          HOST {authMode.toUpperCase()}
        </h2>
        
        <form onSubmit={authenticateHost} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" placeholder="USERNAME" required className="input-base"
            value={localUsername} onChange={(e) => setLocalUsername(e.target.value)} 
          />
          <input 
            type="password" placeholder="PASSWORD" required className="input-base"
            value={localPassword} onChange={(e) => setLocalPassword(e.target.value)} 
          />
          
          <button type="submit" className="btn-primary btn-accent" style={{ marginTop: '16px' }}>
            {authMode === 'login' ? 'ACCESS COMMAND CENTER' : 'INITIALIZE ACCOUNT'}
          </button>
        </form>
        
        <div 
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} 
          style={{ marginTop: '24px', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
        >
          {authMode === 'login' ? 'Need clearance? Register here.' : 'Already have clearance? Login.'}
        </div>
      </div>
    </div>
  );
}