import './EmergencyAlert.css';

export default function EmergencyAlert({
  meetingCaller, alias, isAlive, hasAcknowledged, 
  acknowledgeMeeting, meetingAcks, meetingTotal
}) {
  return (
    <div className="alert-overlay">
      <h1 className="alert-title">🚨 EMERGENCY MEETING 🚨</h1>
      <h3 className="alert-caller">Initiated by: {meetingCaller}</h3>
      
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
    </div>
  );
}