import './EmergencyAlert.css';

export default function EmergencyAlert({ meetingCaller, alias, isAlive, hasAcknowledged, acknowledgeMeeting, meetingAcks, meetingTotal, reportedBody }) {
  const isAux = alias.startsWith('AUX_');
  const displayCaller = meetingCaller.startsWith('AUX_') ? 'Emergency Button' : meetingCaller;

  return (
    <div className="alert-overlay">
      {reportedBody ? (
         <h1 className="alert-title">🚨 BODY REPORTED 🚨</h1>
      ) : (
         <h1 className="alert-title">🚨 EMERGENCY MEETING 🚨</h1>
      )}
      
      {reportedBody ? (
         <h3 className="alert-caller">{displayCaller} found the remains of {reportedBody}</h3>
      ) : (
         <h3 className="alert-caller">Initiated by: {displayCaller}</h3>
      )}

      {/* iPad / Auxiliary View */}
      {isAux ? (
        <>
          <p className="alert-warning" style={{ color: '#aaa', marginTop: '50px' }}>
            AWAITING CREW ARRIVAL
          </p>
          <h1 style={{ fontSize: '80px', color: '#33ccff', margin: '20px 0' }}>
            {meetingAcks} / {meetingTotal}
          </h1>
        </>
      ) : (
        /* Standard Player View */
        <>
          <p className="alert-warning">
            DROP EVERYTHING. HEAD TO THE MEETING ROOM IMMEDIATELY.
          </p>
          
          {alias === 'ORGANIZER' ? (
             <div className="ack-box">AWAITING AGENT ACKNOWLEDGMENTS...</div>
          ) : isAlive ? (
            !hasAcknowledged ? (
              <button onClick={acknowledgeMeeting} className="ack-btn">
                I'M ON MY WAY
              </button>
            ) : (
              <div className="ack-box">AWAITING OTHER AGENTS...</div>
            )
          ) : (
             <div className="ack-box ack-box-ghost">YOU ARE A GHOST. GATHER QUIETLY.</div>
          )}
          
          <h2 className="ack-count">{meetingAcks} / {meetingTotal} EN ROUTE</h2>
        </>
      )}
    </div>
  );
}