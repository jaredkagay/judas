import { useState } from 'react';
import './PlayerDashboard.css';

export default function PlayerDashboard({
  role, showRoleReveal, setShowRoleReveal, teammates,
  isAlive, peekRole, setPeekRole, tasks,
  markTaskComplete, displayCooldown, reportNeutralized, leaveGame,
  reportBody, corpseId, alias, roomCode, taskProgress, 
  playerList = [] // NEW PROP ADDED HERE
}) {
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'tasks', 'report', 'map', 'deaths'
  const [corpseInput, setCorpseInput] = useState("");
  const [selectingKiller, setSelectingKiller] = useState(false); // Tracks if they are looking at the lineup

  const handleReportSubmit = () => {
    if (corpseInput.length === 3) {
      reportBody(corpseInput);
      setActiveTab('main');
      setCorpseInput("");
    } else {
      alert("Corpse ID must be exactly 3 digits.");
    }
  };

  const handleNeutralizedClick = () => {
    if (role === 'Imposter') {
      // Button is there, but does nothing for Imposters
      return; 
    }
    setSelectingKiller(true);
  };

  const confirmKill = (killerAlias) => {
    // Pass the killer's name back to App.jsx to send to the server
    reportNeutralized(killerAlias); 
    // The server will respond by setting isAlive to false, 
    // which will automatically trigger the DECEASED screen below!
  };

  const incompleteTasks = tasks.filter(t => !t.is_completed);
  const completedTasks = tasks.filter(t => t.is_completed);

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

          {/* GLOBAL HUD BANNER */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            backgroundColor: '#1a1a1a', 
            padding: '10px 15px', 
            border: '1px solid #444',
            marginBottom: '15px',
            fontSize: '14px',
            color: '#ccc',
            width: '100%',
            maxWidth: '350px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div><strong>AGENT:</strong> <span style={{color: 'white'}}>{alias}</span></div>
                <div><strong>UPLINK:</strong> <span style={{color: '#33ccff'}}>{roomCode}</span></div>
            </div>
            <button 
                onPointerDown={() => setPeekRole(true)}
                onPointerUp={() => setPeekRole(false)}
                onPointerLeave={() => setPeekRole(false)}
                className="verify-btn"
                style={{ height: '100%', padding: '10px' }}
            >
                HOLD TO VERIFY
            </button>
          </div>

          <div style={{ marginBottom: '20px', width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
              <span>MISSION PROGRESS</span>
              <span>{taskProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', border: '1px solid #444', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${taskProgress}%`, height: '100%', backgroundColor: taskProgress === 100 ? '#00ff00' : '#33ccff', transition: 'width 0.5s ease-out, background-color 0.5s ease' }}></div>
            </div>
          </div>

          <div className={`dashboard-content ${isAlive ? 'alive-opacity' : 'ghost-opacity'}`} style={{ width: '100%', maxWidth: '350px', position: 'relative' }}>
            
            {/* PEEK ROLE OVERLAY */}
            {peekRole && (
                <div className="peek-box" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, boxSizing: 'border-box' }}>
                    <div className="peek-label">YOU ARE</div>
                    <div className={`peek-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`} style={{ marginBottom: teammates.length > 0 ? '20px' : '20px', color: role === 'Spectator' ? '#aaaaaa' : undefined }}>
                      {role}
                    </div>
                    {role === 'Imposter' && isAlive && (
                        <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginBottom: '20px' }}>
                            <div className="associates-label" style={{fontSize: '12px'}}>WEAPON STATUS</div>
                            <div style={{ color: displayCooldown > 0 ? '#ff3333' : '#00ff00', fontSize: '24px', fontWeight: 'bold' }}>
                                {displayCooldown > 0 ? `RECHARGING (${displayCooldown}s)` : 'READY TO KILL'}
                            </div>
                        </div>
                    )}
                    {role === 'Imposter' && teammates.length > 0 && (
                      <div className="peek-associates">
                        <div className="associates-label" style={{fontSize: '10px'}}>ASSOCIATES</div>
                        <div style={{ color: '#ccc', fontSize: '14px' }}>{teammates.join(', ')}</div>
                      </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT */}
            {!peekRole && (
                <>
                    {/* MAIN MENU TAB */}
                    {activeTab === 'main' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                        <button className="btn" onClick={() => setActiveTab('tasks')} style={{ width: '100%', backgroundColor: '#33ccff', color: 'black' }}>
                          VIEW DIRECTIVES
                        </button>
                        <button className="btn" onClick={() => setActiveTab('map')} style={{ width: '100%', backgroundColor: '#ffcc00', color: 'black' }}>
                          ACCESS MAP
                        </button>
                        {isAlive && (
                        <>
                            <button className="btn" onClick={() => setActiveTab('report')} style={{ width: '100%', backgroundColor: '#ff3333' }}>
                              REPORT A BODY
                            </button>
                            <button className="btn" onClick={() => { setActiveTab('deaths'); setSelectingKiller(false); }} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #555', color: '#aaa' }}>
                              CASUALTY REPORT
                            </button>
                        </>
                        )}
                    </div>
                    )}

                    {/* DEATHS / KILL REGISTRATION TAB */}
                    {activeTab === 'deaths' && (
                      <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#0a0a0a', padding: '20px', border: '1px solid #444', boxSizing: 'border-box' }}>
                        
                        {!selectingKiller ? (
                          <>
                            <h2 style={{ color: '#ff3333', marginBottom: '20px' }}>FATALITY SYSTEM</h2>
                            <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '30px' }}>Only engage this system if you have been eliminated from the mission.</p>
                            
                            <button 
                              onClick={handleNeutralizedClick}
                              className="btn" 
                              style={{ 
                                width: '100%', 
                                padding: '20px', 
                                backgroundColor: role === 'Imposter' ? '#222' : '#550000', 
                                color: role === 'Imposter' ? '#555' : 'white',
                                border: role === 'Imposter' ? '1px solid #333' : '2px solid #ff3333',
                                cursor: role === 'Imposter' ? 'not-allowed' : 'pointer',
                                marginBottom: '20px'
                              }}
                            >
                              I WAS NEUTRALIZED
                            </button>

                            <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', backgroundColor: '#444' }}>
                              BACK TO DASHBOARD
                            </button>
                          </>
                        ) : (
                          <>
                            <h2 style={{ color: '#ff3333', marginBottom: '10px' }}>IDENTIFY ASSASSIN</h2>
                            <p style={{ color: '#aaa', fontSize: '12px', marginBottom: '20px' }}>Select the agent who neutralized you to register the kill.</p>
                            
                            {/* Replace your current lineup-container with this: */}
                            <div className="lineup-container">
                              {playerList
                                .filter(p => p !== alias) // Now just compares the string directly
                                .map(p => (
                                <div key={p} className="lineup-card" onClick={() => confirmKill(p)}>
                                  {p}
                                </div>
                              ))}
                            </div>

                            <button className="btn" onClick={() => setSelectingKiller(false)} style={{ width: '100%', marginTop: '20px', backgroundColor: '#444' }}>
                              CANCEL
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* TASKS TAB (Unchanged) */}
                    {activeTab === 'tasks' && (
                    <div className="tasks-container" style={{ width: '100%', marginTop: 0 }}>
                        <div className="tasks-scroll-area">
                            {incompleteTasks.length === 0 && completedTasks.length > 0 && (
                            <div className="all-tasks-done">ALL DIRECTIVES COMPLETED</div>
                            )}
                            <div className="task-cards-container">
                            {incompleteTasks.map(task => (
                                <div key={task.id} className="task-card">
                                <div className="task-card-header">
                                    <h4 className="task-card-title">{task.task_name}</h4>
                                    <div onClick={(e) => markTaskComplete(task.id, e)} className="checkbox checkbox-empty"></div>
                                </div>
                                <div className="task-card-meta">
                                    <span className={`badge diff-${task.difficulty ? task.difficulty.toLowerCase() : 'default'}`}>{task.difficulty || 'STANDARD'}</span>
                                    <span className="badge loc-badge">{task.location || 'UNKNOWN'}</span>
                                </div>
                                <p className="task-card-desc">{task.description}</p>
                                </div>
                            ))}
                            </div>
                            {completedTasks.length > 0 && (
                            <div className="completed-tasks-section">
                                <h4 className="completed-tasks-title">COMPLETED DIRECTIVES</h4>
                                <ul className="task-ul">
                                {completedTasks.map(task => (
                                    <li key={task.id} className="task-li task-li-completed">
                                    <div className="task-li-name task-complete">{task.task_name}</div>
                                    <div className="checkbox checkbox-done"><span className="check-mark">✓</span></div>
                                    </li>
                                ))}
                                </ul>
                            </div>
                            )}
                        </div>
                        <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', marginTop: '20px', backgroundColor: '#444' }}>
                        BACK TO DASHBOARD
                        </button>
                    </div>
                    )}

                    {/* REPORT BODY TAB (Unchanged) */}
                    {activeTab === 'report' && isAlive && (
                    <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#111', padding: '20px', border: '1px solid #444', boxSizing: 'border-box' }}>
                        <h2 style={{ color: '#ff3333', marginBottom: '20px' }}>ENTER CORPSE ID</h2>
                        <input 
                        type="number" placeholder="000" maxLength="3" value={corpseInput}
                        onChange={(e) => setCorpseInput(e.target.value.slice(0, 3))}
                        style={{ width: '100%', padding: '15px', fontSize: '40px', textAlign: 'center', letterSpacing: '15px', backgroundColor: '#050505', color: 'white', border: '1px solid #333', marginBottom: '20px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleReportSubmit} className="btn" style={{ flex: 1, backgroundColor: '#ff3333' }}>REPORT</button>
                        <button onClick={() => setActiveTab('main')} className="btn" style={{ flex: 1, backgroundColor: '#444' }}>CANCEL</button>
                        </div>
                    </div>
                    )}

                    {/* MAP TAB (Unchanged) */}
                    {activeTab === 'map' && (
                    <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#111', padding: '40px 20px', border: '1px solid #444', boxSizing: 'border-box' }}>
                        <h2 style={{ color: '#ffcc00', marginBottom: '20px' }}>MAP SYSTEM</h2>
                        <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '30px' }}>[WORK IN PROGRESS]</p>
                        <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', backgroundColor: '#444' }}>
                        BACK TO DASHBOARD
                        </button>
                    </div>
                    )}
                </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}