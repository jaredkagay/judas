import './EmergencyAlert.css';

export default function EmergencyAlert({ meetingCaller, alias, isAlive, hasAcknowledged, acknowledgeMeeting, meetingAcks, meetingTotal, reportedBody }) {
  const isAux = alias.startsWith('AUX_');
  const displayCaller = meetingCaller.startsWith('AUX_') ? 'Emergency Button' : meetingCaller;

  return (
    <div className="emergency-wrapper">
      <div className="glass-panel text-center" style={{ borderColor: 'rgba(220, 38, 38, 0.4)', maxWidth: '400px' }}>
        
        {reportedBody ? (
           <h1 className="emergency-title">🚨 BODY REPORTED 🚨</h1>
        ) : (
           <h1 className="emergency-title">🚨 EMERGENCY 🚨</h1>
        )}
        
        {reportedBody ? (
           <h3 className="emergency-caller"><span style={{color: 'var(--accent-red)'}}>{displayCaller}</span> found the remains of <span style={{color: 'var(--text-secondary)', textDecoration: 'line-through'}}>{reportedBody}</span></h3>
        ) : (
           <h3 className="emergency-caller">Initiated by: <span style={{color: 'var(--accent-red)'}}>{displayCaller}</span></h3>
        )}

        {isAux ? (
          <>
            <p className="emergency-warning" style={{ marginTop: '32px' }}>
              AWAITING PHYSICAL CREW ARRIVAL
            </p>
            <div className="meeting-acks-display">
              {meetingAcks} <span style={{color: 'var(--text-secondary)', fontSize: '3rem'}}>/ {meetingTotal}</span>
            </div>
          </>
        ) : (
          <>
            <p className="emergency-warning" style={{ margin: '24px 0' }}>
              PROCEED TO THE MEETING ROOM AND CHECK IN ON YOUR DEVICE.
            </p>
            
            {alias === 'ORGANIZER' ? (
               <div className="ack-box">AWAITING AGENT CHECK-INS...</div>
            ) : isAlive ? (
              !hasAcknowledged ? (
                <button onClick={acknowledgeMeeting} className="btn-primary btn-accent" style={{ width: '100%', padding: '16px', fontSize: '1.2rem' }}>
                  CHECK IN
                </button>
              ) : (
                <div className="ack-box" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
                  CHECKED IN. AWAITING SQUAD...
                </div>
              )
            ) : (
               <div className="ack-box ghost-ack">GHOSTS DO NOT CHECK IN</div>
            )}
          </>
        )}

      </div>
    </div>
  );
}