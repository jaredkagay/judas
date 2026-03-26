// frontend/src/components/AuxiliaryDashboard.jsx
import './Auxiliary.css';

export default function AuxiliaryDashboard({ callEmergency, displayCooldown }) {
  return (
    <div className="aux-wrapper">
      <h2 className="aux-title">CAFETERIA CONSOLE</h2>
      
      <button 
        className="big-red-button"
        onClick={callEmergency}
        disabled={displayCooldown > 0}
      >
        {displayCooldown > 0 ? (
          <>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>SYSTEM RECHARGING</span>
            <span className="aux-timer-text">{displayCooldown}s</span>
          </>
        ) : (
          <span>EMERGENCY<br/>MEETING</span>
        )}
      </button>
    </div>
  );
}