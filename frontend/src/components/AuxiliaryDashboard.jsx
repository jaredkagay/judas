export default function AuxiliaryDashboard({ callEmergency, displayCooldown }) {
  return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <h2 style={{ color: '#aaa', letterSpacing: '3px', marginBottom: '40px' }}>CAFETERIA CONSOLE</h2>
      
      <button 
        className="emergency-btn"
        onClick={callEmergency}
        disabled={displayCooldown > 0}
        style={{ 
          width: '70vw', height: '70vw', 
          maxWidth: '500px', maxHeight: '500px', 
          fontSize: '48px',
          opacity: displayCooldown > 0 ? 0.3 : 1
        }}
      >
        {displayCooldown > 0 ? `RECHARGING (${displayCooldown}s)` : 'EMERGENCY MEETING'}
      </button>
    </div>
  );
}