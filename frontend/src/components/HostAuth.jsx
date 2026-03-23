import { btnStyle, inputStyle } from '../styles';

export default function HostAuth({ 
  authenticateHost, 
  authMode, 
  setAuthMode, 
  hostUsername, 
  setHostUsername, 
  hostPassword, 
  setHostPassword, 
  setView 
}) {
  return (
    <form onSubmit={authenticateHost} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '50px' }}>
      <h2 style={{ color: '#aaa', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', textTransform: 'uppercase' }}>
        HOST {authMode}
      </h2>
      
      <input 
        type="text" 
        placeholder="USERNAME" 
        value={hostUsername} 
        onChange={(e) => setHostUsername(e.target.value)} 
        style={inputStyle} 
        required
      />
      <input 
        type="password" 
        placeholder="PASSWORD" 
        value={hostPassword} 
        onChange={(e) => setHostPassword(e.target.value)} 
        style={inputStyle} 
        required
      />
      
      <button type="submit" style={btnStyle}>
        {authMode === 'login' ? 'ACCESS DASHBOARD' : 'INITIALIZE ACCOUNT'}
      </button>
      
      <div 
        onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
        style={{ textAlign: 'center', color: '#666', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}
      >
        {authMode === 'login' ? 'Need an account? Register here.' : 'Already have clearance? Log in.'}
      </div>

      <button type="button" onClick={() => setView('home')} style={{ padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', marginTop: '20px' }}>
        CANCEL
      </button>
    </form>
  );
}