import './PlayerDashboard.css';

export default function PlayerDashboard({
  role, showRoleReveal, setShowRoleReveal, teammates,
  isAlive, peekRole, setPeekRole, tasks, setSelectedTask,
  markTaskComplete, callEmergency, displayCooldown, 
  reportNeutralized, leaveGame
}) {
  return (
    <div className="player-wrapper">
      {!role ? (
        <div className="waiting-screen">
          <h3 className="waiting-text">AWAITING MISSION BRIEFING...</h3>
        </div>
      ) : showRoleReveal ? (
        <div className="reveal-overlay">
          <h3 className="reveal-label">YOUR CLEARANCE:</h3>
          <h1 className={`reveal-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`}>
            {role}
          </h1>
          
          <p className="reveal-desc">
            {role === 'Imposter' 
              ? 'Eliminate the crew. Fake your tasks. Do not get caught.' 
              : 'Complete your directives. Find the Imposter. Stay alive.'}
          </p>

          {role === 'Imposter' && teammates.length > 0 && (
            <div className="associates-box">
              <div className="associates-label">KNOWN ASSOCIATES:</div>
              <div className="associates-list">{teammates.join(', ')}</div>
            </div>
          )}

          <button onClick={() => setShowRoleReveal(false)} className="btn ack-reveal-btn">
            ACKNOWLEDGE
          </button>
        </div>
      ) : (
        <div className="dashboard-main">
          
          {!isAlive && (
            <div className="ghost-status">
              STATUS: NEUTRALIZED (GHOST MODE)
            </div>
          )}

          <div className={`dashboard-content ${isAlive ? 'alive-opacity' : 'ghost-opacity'}`}>
            <div className="tasks-container">
              <div className="tasks-header">
                <h3 className="tasks-title">MISSION OBJECTIVES</h3>
                <button 
                  onPointerDown={() => setPeekRole(true)}
                  onPointerUp={() => setPeekRole(false)}
                  onPointerLeave={() => setPeekRole(false)}
                  className="verify-btn"
                >
                  HOLD TO VERIFY
                </button>
              </div>

              {peekRole ? (
                <div className="peek-box">
                  <div className="peek-label">YOU ARE</div>
                  <div className={`peek-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`} style={{ marginBottom: teammates.length > 0 ? '20px' : '0' }}>
                    {role}
                  </div>
                  {role === 'Imposter' && teammates.length > 0 && (
                    <div className="peek-associates">
                      <div className="associates-label" style={{fontSize: '10px'}}>ASSOCIATES</div>
                      <div style={{ color: '#ccc', fontSize: '14px' }}>{teammates.join(', ')}</div>
                    </div>
                  )}
                </div>
              ) : (
                <ul className="task-ul">
                  {tasks.map(task => (
                    <li 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className="task-li"
                    >
                      <div className={`task-li-name ${task.is_completed ? 'task-complete' : 'task-incomplete'}`}>
                        {task.task_name}
                      </div>
                      
                      <div 
                        onClick={(e) => !task.is_completed && markTaskComplete(task.id, e)}
                        className={`checkbox ${task.is_completed ? 'checkbox-done' : 'checkbox-empty'}`}
                      >
                        {task.is_completed && <span className="check-mark">✓</span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {isAlive && (
            <>
              <button onClick={callEmergency} className="emergency-btn">
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
                className={`report-btn ${displayCooldown > 0 ? 'report-jammed' : 'report-active'}`}
              >
                {displayCooldown > 0 ? `COMMS JAMMED (${displayCooldown}s)` : 'I WAS NEUTRALIZED'}
              </button>
            </>
          )}
          <button onClick={leaveGame} className="cancel-btn disconnect-btn">
            DISCONNECT
          </button>
        </div>
      )}
    </div>
  );
}