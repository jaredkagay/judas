import { useState } from 'react';
import './HostAuth.css';

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
    <form onSubmit={authenticateHost} className="auth-form">
      <h2 className="auth-title">HOST {authMode}</h2>
      
      <input 
        type="text" placeholder="USERNAME" required className="input-field"
        value={localUsername} onChange={(e) => setLocalUsername(e.target.value)} 
      />
      <input 
        type="password" placeholder="PASSWORD" required className="input-field"
        value={localPassword} onChange={(e) => setLocalPassword(e.target.value)} 
      />
      
      <button type="submit" className="btn">
        {authMode === 'login' ? 'ACCESS DASHBOARD' : 'INITIALIZE ACCOUNT'}
      </button>
      
      <div onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="auth-toggle">
        {authMode === 'login' ? 'Need an account? Register here.' : 'Already have clearance? Log in.'}
      </div>

      <button type="button" onClick={() => setView('home')} className="cancel-btn auth-cancel">
        CANCEL
      </button>
    </form>
  );
}