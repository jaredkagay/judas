import { useState } from 'react';
import './PlayerDashboard.css';
import DirectivesView from './DirectivesView';
import FatalitySystemView from './FatalitySystemView';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function PlayerDashboard({
  role, showRoleReveal, setShowRoleReveal, teammates,
  isAlive, peekRole, setPeekRole, tasks,
  markTaskComplete, displayCooldown, reportNeutralized, leaveGame,
  reportBody, corpseId, alias, roomCode, taskProgress, 
  playerList = []
}) {
  const [activeTab, setActiveTab] = useState('main'); 
  const [corpseInput, setCorpseInput] = useState("");
  const [selectingKiller, setSelectingKiller] = useState(false);
  const [mapFloor, setMapFloor] = useState('downstairs');

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
    if (role === 'Imposter') return; 
    setSelectingKiller(true);
  };

  const confirmKill = (killerAlias) => {
    reportNeutralized(killerAlias); 
  };

  // DECEASED SCREEN HIJACK
  if (!isAlive && role && corpseId) {
    return (
      <div className="deceased-screen">
        <div className="glass-panel text-center">
          <svg className="death-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h1 className="deceased-title">NEUTRALIZED</h1>
          <p className="deceased-sub">WAIT IN PLACE. YOUR CORPSE ID IS:</p>
          <div className="corpse-id-display">{corpseId}</div>
          <p className="deceased-warning">Do not speak. Another agent must enter this code to report you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="player-wrapper">
      {!role ? (
        <div className="waiting-screen">
          <h3 className="waiting-text">AWAITING MISSION BRIEFING...</h3>
          <button onClick={leaveGame} className="btn-primary" style={{ marginTop: '20px' }}>DISCONNECT</button>
        </div>
      ) : showRoleReveal ? (
        <div className="reveal-overlay">
          <div className="glass-panel text-center" style={{ width: '90%', maxWidth: '350px' }}>
            <h3 className="reveal-label">YOUR CLEARANCE:</h3>
            <h1 className={`reveal-role ${role === 'Imposter' ? 'role-imposter' : role === 'Spectator' ? 'role-spectator' : 'role-crewmate'}`}>
              {role}
            </h1>
            <p className="reveal-desc">
              {role === 'Imposter' ? 'Eliminate the crew. Fake your tasks. Do not get caught.' : role === 'Spectator' ? 'You have joined an ongoing mission. Observe quietly.' : 'Complete your directives. Find the Imposter. Stay alive.'}
            </p>
            {role === 'Imposter' && teammates.length > 0 && (
              <div className="associates-box">
                <div className="associates-label">KNOWN ASSOCIATES:</div>
                <div className="associates-list">{teammates.join(', ')}</div>
              </div>
            )}
            <button onClick={() => setShowRoleReveal(false)} className="btn-primary" style={{ marginTop: '40px', width: '100%' }}>ACKNOWLEDGE</button>
          </div>
        </div>
      ) : (
        <div className="dashboard-main">
          
          {!isAlive && <div className="ghost-status">STATUS: NEUTRALIZED (GHOST MODE)</div>}

          {/* GLOBAL HUD BANNER */}
          <div className="hud-banner">
            <div className="hud-info">
                <div><span className="hud-label">AGENT:</span> <span className="hud-value">{alias}</span></div>
                <div><span className="hud-label">UPLINK:</span> <span className="hud-value" style={{color: 'var(--text-secondary)'}}>{roomCode}</span></div>
            </div>
            <button onPointerDown={() => setPeekRole(true)} onPointerUp={() => setPeekRole(false)} onPointerLeave={() => setPeekRole(false)} className="verify-btn">
              HOLD TO VERIFY
            </button>
          </div>

          <div className="progress-container">
            <div className="progress-header">
              <span>MISSION PROGRESS</span><span>{taskProgress}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${taskProgress}%`, backgroundColor: taskProgress === 100 ? '#10b981' : 'var(--text-secondary)' }}></div>
            </div>
          </div>

          <div className={`dashboard-content ${isAlive ? 'alive-opacity' : 'ghost-opacity'}`}>
            
            {peekRole && (
                <div className="peek-box glass-panel">
                    <div className="peek-label">YOU ARE</div>
                    <div className={`peek-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`}>{role}</div>
                    {role === 'Imposter' && isAlive && (
                        <div className="peek-weapon-status">
                            <div className="associates-label">WEAPON STATUS</div>
                            <div style={{ color: displayCooldown > 0 ? 'var(--accent-red)' : '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                                {displayCooldown > 0 ? `RECHARGING (${displayCooldown}s)` : 'READY TO KILL'}
                            </div>
                        </div>
                    )}
                    {role === 'Imposter' && teammates.length > 0 && (
                      <div className="peek-associates">
                        <div className="associates-label">ASSOCIATES</div>
                        <div style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{teammates.join(', ')}</div>
                      </div>
                    )}
                </div>
            )}

            {!peekRole && (
                <>
                    {activeTab === 'main' && (
                    <div className="dashboard-grid">
                        <button className="square-btn" onClick={() => setActiveTab('tasks')}>
                            <img src="/tasks.png" alt="Directives" className="btn-icon" />
                        </button>
                        
                        <button className="square-btn" onClick={() => setActiveTab('map')}>
                            <img src="/map.png" alt="Map" className="btn-icon" />
                        </button>

                        {isAlive && (
                        <>
                            <button className="square-btn btn-danger" onClick={() => setActiveTab('report')}>
                              <img src="/report.png" alt="Report" className="btn-icon" />
                            </button>
                            
                            <button className="square-btn btn-danger" onClick={() => { setActiveTab('deaths'); setSelectingKiller(false); }}>
                              <img src="/kill.png" alt="Kill" className="btn-icon" />
                          </button>
                        </>
                        )}
                    </div>
                    )}

                    {activeTab === 'deaths' && (
                      <FatalitySystemView 
                        role={role} selectingKiller={selectingKiller} setSelectingKiller={setSelectingKiller}
                        handleNeutralizedClick={handleNeutralizedClick} setActiveTab={setActiveTab}
                        playerList={playerList} alias={alias} confirmKill={confirmKill}
                      />
                    )}

                    {activeTab === 'tasks' && (
                      <DirectivesView tasks={tasks} markTaskComplete={markTaskComplete} setActiveTab={setActiveTab} />
                    )}

                    {activeTab === 'report' && isAlive && (
                    <div className="glass-panel text-center">
                        <h2 style={{ color: 'var(--accent-red)', marginBottom: '20px', letterSpacing: '2px' }}>ENTER CORPSE ID</h2>
                        <input 
                          type="number" placeholder="000" maxLength="3" value={corpseInput}
                          onChange={(e) => setCorpseInput(e.target.value.slice(0, 3))}
                          className="input-base"
                          style={{ width: '100%', padding: '20px', fontSize: '40px', textAlign: 'center', letterSpacing: '20px', marginBottom: '24px', boxSizing: 'border-box' }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button onClick={handleReportSubmit} className="btn-primary btn-accent" style={{ flex: 1 }}>REPORT</button>
                          <button onClick={() => setActiveTab('main')} className="btn-primary" style={{ flex: 1 }}>CANCEL</button>
                        </div>
                    </div>
                    )}

                    {activeTab === 'map' && (
                    <div className="glass-panel text-center map-panel">
                        <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px', letterSpacing: '2px' }}>INTEL MAP</h2>
                        
                        {/* Floor Toggle Slider */}
                        <div className="floor-toggle">
                            <button 
                                className={`toggle-btn ${mapFloor === 'downstairs' ? 'active' : ''}`}
                                onClick={() => setMapFloor('downstairs')}
                            >
                                DOWNSTAIRS
                            </button>
                            <button 
                                className={`toggle-btn ${mapFloor === 'upstairs' ? 'active' : ''}`}
                                onClick={() => setMapFloor('upstairs')}
                            >
                                UPSTAIRS
                            </button>
                        </div>

                        {/* Mobile-Friendly Zoomable Container */}
                        <div className="map-image-container">
                            <TransformWrapper
                                initialScale={1}
                                minScale={1}
                                maxScale={5}
                                centerOnInit={true}
                                wheel={{ step: 0.1 }} // Allows smooth scrolling on desktop too
                            >
                                <TransformComponent wrapperClass="map-transform-wrapper">
                                    <img 
                                        // Update these paths to where you saved your images in the public folder!
                                        src={mapFloor === 'upstairs' ? '/map-upstairs.png' : '/map-downstairs.png'} 
                                        alt={`Map of ${mapFloor}`} 
                                        className="map-image" 
                                    />
                                </TransformComponent>
                            </TransformWrapper>
                        </div>

                        <p className="map-hint">Pinch to zoom, drag to pan</p>

                        <button className="btn-primary" onClick={() => setActiveTab('main')} style={{ width: '100%', marginTop: '16px' }}>BACK TO DASHBOARD</button>
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