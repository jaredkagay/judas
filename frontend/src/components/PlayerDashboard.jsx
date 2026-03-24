import { useState } from 'react';
import './PlayerDashboard.css';

export default function PlayerDashboard({
  role, showRoleReveal, setShowRoleReveal, teammates,
  isAlive, peekRole, setPeekRole, tasks, setSelectedTask,
  markTaskComplete, displayCooldown, reportNeutralized, leaveGame,
  reportBody, corpseId, alias, roomCode, taskProgress
}) {
  const [showReportModal, setShowReportModal] = useState(false);
  const [corpseInput, setCorpseInput] = useState("");

  const handleReportSubmit = () => {
    if (corpseInput.length === 3) {
      reportBody(corpseInput);
      setShowReportModal(false);
      setCorpseInput("");
    } else {
      alert("Corpse ID must be exactly 3 digits.");
    }
  };

  // ONLY hijack the screen if they are dead AND their body hasn't been found yet
  if (!isAlive && role && corpseId) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
        <h1 style={{ color: '#ff3333', fontSize: '40px', letterSpacing: '2px' }}>YOU ARE DECEASED</h1>
        <p style={{ color: '#aaa', marginTop: '20px' }}>WAIT IN PLACE. YOUR CORPSE ID IS:</p>
        <div style={{ fontSize: '90px', fontWeight: 'bold', color: 'white', letterSpacing: '10px', margin: '30px 0' }}>
          {corpseId}
        </div>
        <p style={{ color: '#777' }}>Do not speak. Another agent must enter this code to report you.</p>
        {/* Abort Mission button removed so they have to stay and wait! */}
      </div>
    );
  }

  return (
    <div className="player-wrapper">
      {!role ? (
        <div className="waiting-screen" style={{ flexDirection: 'column' }}>
          <h3 className="waiting-text" style={{ marginBottom: '30px' }}>AWAITING MISSION BRIEFING...</h3>
          <button onClick={leaveGame} className="btn" style={{ backgroundColor: '#444' }}>DISCONNECT</button>
        </div>
      ) : showRoleReveal ? (
        <div className="reveal-overlay">
          <h3 className="reveal-label">YOUR CLEARANCE:</h3>
          <h1 className={`reveal-role ${role === 'Imposter' ? 'role-imposter' : role === 'Spectator' ? 'role-spectator' : 'role-crewmate'}`} style={{ color: role === 'Spectator' ? '#aaaaaa' : undefined }}>
            {role}
          </h1>
          
          <p className="reveal-desc">
            {role === 'Imposter' 
              ? 'Eliminate the crew. Fake your tasks. Do not get caught.' 
              : role === 'Spectator'
              ? 'You have joined an ongoing mission. Observe quietly.'
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

          {/* NEW: Player HUD / Info Banner */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: '#1a1a1a', 
            padding: '10px 15px', 
            border: '1px solid #444',
            marginBottom: '15px',
            fontSize: '14px',
            color: '#ccc'
          }}>
            <div><strong>AGENT:</strong> <span style={{color: 'white'}}>{alias}</span></div>
            <div><strong>UPLINK:</strong> <span style={{color: '#33ccff'}}>{roomCode}</span></div>
          </div>

          {/* NEW: Global Task Progress Bar */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
              <span>MISSION PROGRESS</span>
              <span>{taskProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', border: '1px solid #444', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${taskProgress}%`, 
                height: '100%', 
                backgroundColor: taskProgress === 100 ? '#00ff00' : '#33ccff', 
                transition: 'width 0.5s ease-out, background-color 0.5s ease' 
              }}></div>
            </div>
          </div>

          {/* RESTORED: Ghost Opacity class application */}
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
                  <div className={`peek-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`} 
                       style={{ marginBottom: teammates.length > 0 ? '20px' : '0', color: role === 'Spectator' ? '#aaaaaa' : undefined }}>
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

          {/* Buttons are only visible to living players */}
          {isAlive && (
            <>
              <button 
                onClick={() => setShowReportModal(true)} 
                className="btn" 
                style={{ backgroundColor: '#ff3333', marginTop: '20px', width: '100%', padding: '15px', fontSize: '18px', fontWeight: 'bold' }}
              >
                REPORT BODY
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
                style={{ marginTop: '15px' }}
              >
                {displayCooldown > 0 ? `COMMS JAMMED (${displayCooldown}s)` : 'I WAS NEUTRALIZED'}
              </button>

              {showReportModal && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h2 style={{ color: '#ff3333', marginBottom: '20px' }}>ENTER CORPSE ID</h2>
                    <input 
                      type="number"
                      placeholder="000"
                      maxLength="3"
                      value={corpseInput}
                      onChange={(e) => setCorpseInput(e.target.value.slice(0, 3))}
                      style={{ width: '100%', padding: '15px', fontSize: '40px', textAlign: 'center', letterSpacing: '15px', backgroundColor: '#111', color: 'white', border: '1px solid #444', marginBottom: '20px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={handleReportSubmit} className="btn" style={{ flex: 1, backgroundColor: '#ff3333' }}>REPORT</button>
                      <button onClick={() => setShowReportModal(false)} className="btn" style={{ flex: 1, backgroundColor: '#444' }}>CANCEL</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}