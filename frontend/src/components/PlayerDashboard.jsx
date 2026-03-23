import { btnStyle, emergencyBtnStyle } from '../styles';

export default function PlayerDashboard({
  role, showRoleReveal, setShowRoleReveal, teammates,
  isAlive, peekRole, setPeekRole, tasks, setSelectedTask,
  markTaskComplete, callEmergency, displayCooldown, 
  reportNeutralized, leaveGame
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes pulseText { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
        `}
      </style>

      {!role ? (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ animation: 'pulseText 2s infinite', color: '#666', letterSpacing: '2px' }}>AWAITING MISSION BRIEFING...</h3>
        </div>
      ) : showRoleReveal ? (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: '#050505', display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center', zIndex: 9999,
          animation: 'fadeIn 1.5s ease-out'
        }}>
          <h3 style={{ color: '#aaa', letterSpacing: '3px', marginBottom: '10px' }}>YOUR CLEARANCE:</h3>
          <h1 style={{ 
            color: role === 'Imposter' ? '#ff3333' : '#33ccff', 
            fontSize: '50px', letterSpacing: '5px', margin: 0,
            textTransform: 'uppercase', textShadow: `0 0 20px ${role === 'Imposter' ? '#ff3333' : '#33ccff'}`
          }}>
            {role}
          </h1>
          
          <p style={{ color: '#888', marginTop: '30px', maxWidth: '250px', textAlign: 'center', lineHeight: '1.5' }}>
            {role === 'Imposter' 
              ? 'Eliminate the crew. Fake your tasks. Do not get caught.' 
              : 'Complete your directives. Find the Imposter. Stay alive.'}
          </p>

          {role === 'Imposter' && teammates.length > 0 && (
            <div style={{ marginTop: '30px', borderTop: '1px dashed #ff3333', paddingTop: '15px', textAlign: 'center' }}>
              <div style={{ color: '#ff3333', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '5px' }}>KNOWN ASSOCIATES:</div>
              <div style={{ color: 'white', fontSize: '18px', textTransform: 'uppercase' }}>{teammates.join(', ')}</div>
            </div>
          )}

          <button 
            onClick={() => setShowRoleReveal(false)} 
            style={{ ...btnStyle, marginTop: '60px', backgroundColor: 'transparent', border: '1px solid #666', color: '#aaa' }}
          >
            ACKNOWLEDGE
          </button>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.5s ease-out', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
          
          {!isAlive && (
            <div style={{ backgroundColor: '#550000', padding: '10px', width: '100%', textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
              STATUS: NEUTRALIZED (GHOST MODE)
            </div>
          )}

          <div style={{ opacity: isAlive ? 1 : 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <div style={{ width: '100%', maxWidth: '350px', marginTop: '10px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #444', paddingBottom: '10px', marginBottom: '15px' }}>
                <h3 style={{ color: '#aaa', margin: 0 }}>MISSION OBJECTIVES</h3>
                <button 
                  onPointerDown={() => setPeekRole(true)}
                  onPointerUp={() => setPeekRole(false)}
                  onPointerLeave={() => setPeekRole(false)}
                  style={{ background: 'none', border: '1px solid #333', color: '#666', fontSize: '10px', padding: '4px 8px', cursor: 'pointer', userSelect: 'none' }}
                >
                  HOLD TO VERIFY
                </button>
              </div>

              {peekRole ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', backgroundColor: '#111', border: '1px dashed #444' }}>
                  <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '10px' }}>YOU ARE</div>
                  <div style={{ color: role === 'Imposter' ? '#ff3333' : '#33ccff', fontSize: '24px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: teammates.length > 0 ? '20px' : '0' }}>
                    {role}
                  </div>
                  {role === 'Imposter' && teammates.length > 0 && (
                    <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                      <div style={{ color: '#ff3333', fontSize: '10px', marginBottom: '5px' }}>ASSOCIATES</div>
                      <div style={{ color: '#ccc', fontSize: '14px' }}>{teammates.join(', ')}</div>
                    </div>
                  )}
                </div>
              ) : (
                <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
                  {tasks.map(task => (
                    <li 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      style={{ backgroundColor: '#111', padding: '15px', marginBottom: '10px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: 'bold', textDecoration: task.is_completed ? 'line-through' : 'none', color: task.is_completed ? '#666' : '#f0f0f0' }}>
                        {task.task_name}
                      </div>
                      
                      <div 
                        onClick={(e) => !task.is_completed && markTaskComplete(task.id, e)}
                        style={{ 
                          width: '24px', height: '24px', border: '2px solid #666', borderRadius: '4px', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          backgroundColor: task.is_completed ? '#666' : 'transparent', transition: 'all 0.2s ease'
                        }}
                      >
                        {task.is_completed && <span style={{ color: '#000', fontWeight: 'bold', fontSize: '16px' }}>✓</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {isAlive && (
            <>
              <button onClick={callEmergency} style={emergencyBtnStyle}>
                EMERGENCY<br/>MEETING
              </button>

              <button 
                disabled={displayCooldown > 0}
                onClick={() => {
                  if (role === 'Imposter') {
                    alert("COMMS JAMMED: Cannot self-report.");
                  } else {
                    reportNeutralized();
                  }
                }}
                style={{ 
                  marginTop: '30px', padding: '15px', 
                  backgroundColor: displayCooldown > 0 ? '#111' : '#220000', 
                  color: displayCooldown > 0 ? '#555' : '#ff3333', 
                  border: displayCooldown > 0 ? '1px solid #333' : '1px solid #ff3333', 
                  width: '250px', fontWeight: 'bold', 
                  cursor: displayCooldown > 0 ? 'not-allowed' : 'pointer', letterSpacing: '1px' 
                }}
              >
                {displayCooldown > 0 ? `COMMS JAMMED (${displayCooldown}s)` : 'I WAS NEUTRALIZED'}
              </button>
            </>
          )}
          <button onClick={leaveGame} style={{ marginTop: '50px', padding: '10px', backgroundColor: 'transparent', color: '#666', border: '1px solid #333' }}>
            DISCONNECT
          </button>
        </div>
      )}
    </div>
  );
}