export default function EmergencyAlert({
  meetingCaller, alias, isAlive, hasAcknowledged, 
  acknowledgeMeeting, meetingAcks, meetingTotal
}) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      backgroundColor: '#ff0000', color: 'white', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center', zIndex: 10000,
      animation: 'flashRed 0.8s infinite alternate'
    }}>
      <style>{`@keyframes flashRed { from { backgroundColor: '#ff0000'; } to { backgroundColor: '#550000'; } }`}</style>
      
      <h1 style={{ fontSize: '48px', margin: 0, textAlign: 'center', textShadow: '0 0 20px black' }}>🚨 EMERGENCY MEETING 🚨</h1>
      <h3 style={{ marginTop: '20px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '10px 20px' }}>Initiated by: {meetingCaller}</h3>
      
      <p style={{ fontSize: '20px', textAlign: 'center', maxWidth: '300px', margin: '40px 0', fontWeight: 'bold' }}>
        DROP EVERYTHING. HEAD TO THE MEETING ROOM IMMEDIATELY.
      </p>
      
      {alias === 'ORGANIZER' ? (
         <div style={{ padding: '20px 40px', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#222', color: '#aaa', border: '5px solid #444' }}>
           AWAITING AGENT ACKNOWLEDGMENTS...
         </div>
      ) : isAlive ? (
        !hasAcknowledged ? (
          <button onClick={acknowledgeMeeting} style={{ padding: '20px 40px', fontSize: '24px', fontWeight: 'bold', backgroundColor: 'black', color: 'white', border: '5px solid white', cursor: 'pointer', boxShadow: '0 10px 20px rgba(0,0,0,0.5)' }}>
            I'M ON MY WAY
          </button>
        ) : (
          <div style={{ padding: '20px 40px', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#222', color: '#aaa', border: '5px solid #444' }}>
            AWAITING OTHER AGENTS...
          </div>
        )
      ) : (
         <div style={{ padding: '20px 40px', fontSize: '20px', fontWeight: 'bold', backgroundColor: '#222', color: '#ff3333', border: '5px solid #ff3333' }}>
           YOU ARE A GHOST. GATHER QUIETLY.
         </div>
      )}
      
      <h2 style={{ marginTop: '50px', letterSpacing: '3px' }}>{meetingAcks} / {meetingTotal} EN ROUTE</h2>
    </div>
  );
}