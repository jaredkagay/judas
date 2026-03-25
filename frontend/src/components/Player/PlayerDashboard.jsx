import { useState } from 'react';
import './PlayerDashboard.css';
import DirectivesView from './DirectivesView';         // Adjust path if needed
import FatalitySystemView from './FatalitySystemView'; // Adjust path if needed

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
      <div style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
        <h1 style={{ color: '#ff3333', fontSize: '40px', letterSpacing: '2px' }}>YOU ARE DECEASED</h1>
        <p style={{ color: '#aaa', marginTop: '20px' }}>WAIT IN PLACE. YOUR CORPSE ID IS:</p>
        <div style={{ fontSize: '90px', fontWeight: 'bold', color: 'white', letterSpacing: '10px', margin: '30px 0' }}>{corpseId}</div>
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
          <h1 className={`reveal-role ${role === 'Imposter' ? 'role-imposter' : role === 'Spectator' ? 'role-spectator' : 'role-crewmate'}`} style={{ color: role === 'Spectator' ? '#aaaaaa' : undefined }}>{role}</h1>
          <p className="reveal-desc">
            {role === 'Imposter' ? 'Eliminate the crew. Fake your tasks. Do not get caught.' : role === 'Spectator' ? 'You have joined an ongoing mission. Observe quietly.' : 'Complete your directives. Find the Imposter. Stay alive.'}
          </p>
          {role === 'Imposter' && teammates.length > 0 && (
            <div className="associates-box">
              <div className="associates-label">KNOWN ASSOCIATES:</div>
              <div className="associates-list">{teammates.join(', ')}</div>
            </div>
          )}
          <button onClick={() => setShowRoleReveal(false)} className="btn ack-reveal-btn">ACKNOWLEDGE</button>
        </div>
      ) : (
        <div className="dashboard-main">
          
          {!isAlive && <div className="ghost-status">STATUS: NEUTRALIZED (GHOST MODE)</div>}

          {/* GLOBAL HUD BANNER */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '10px 15px', border: '1px solid #444', marginBottom: '15px', fontSize: '14px', color: '#ccc', width: '100%', maxWidth: '350px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <div><strong>AGENT:</strong> <span style={{color: 'white'}}>{alias}</span></div>
                <div><strong>UPLINK:</strong> <span style={{color: '#33ccff'}}>{roomCode}</span></div>
            </div>
            <button onPointerDown={() => setPeekRole(true)} onPointerUp={() => setPeekRole(false)} onPointerLeave={() => setPeekRole(false)} className="verify-btn" style={{ height: '100%', padding: '10px' }}>HOLD TO VERIFY</button>
          </div>

          <div style={{ marginBottom: '20px', width: '100%', maxWidth: '350px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
              <span>MISSION PROGRESS</span><span>{taskProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: '#222', border: '1px solid #444', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ width: `${taskProgress}%`, height: '100%', backgroundColor: taskProgress === 100 ? '#00ff00' : '#33ccff', transition: 'width 0.5s ease-out, background-color 0.5s ease' }}></div>
            </div>
          </div>

          <div className={`dashboard-content ${isAlive ? 'alive-opacity' : 'ghost-opacity'}`} style={{ width: '100%', maxWidth: '350px', position: 'relative' }}>
            
            {peekRole && (
                <div className="peek-box" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, boxSizing: 'border-box' }}>
                    <div className="peek-label">YOU ARE</div>
                    <div className={`peek-role ${role === 'Imposter' ? 'role-imposter' : 'role-crewmate'}`} style={{ marginBottom: teammates.length > 0 ? '20px' : '20px', color: role === 'Spectator' ? '#aaaaaa' : undefined }}>{role}</div>
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

            {!peekRole && (
                <>
                    {activeTab === 'main' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                        <button className="btn" onClick={() => setActiveTab('tasks')} style={{ width: '100%', backgroundColor: '#33ccff', color: 'black' }}>VIEW DIRECTIVES</button>
                        <button className="btn" onClick={() => setActiveTab('map')} style={{ width: '100%', backgroundColor: '#ffcc00', color: 'black' }}>ACCESS MAP</button>
                        {isAlive && (
                        <>
                            <button className="btn" onClick={() => setActiveTab('report')} style={{ width: '100%', backgroundColor: '#ff3333' }}>REPORT A BODY</button>
                            <button className="btn" onClick={() => { setActiveTab('deaths'); setSelectingKiller(false); }} style={{ width: '100%', backgroundColor: '#111', border: '1px solid #555', color: '#aaa' }}>CASUALTY REPORT</button>
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

                    {activeTab === 'map' && (
                    <div style={{ width: '100%', textAlign: 'center', backgroundColor: '#111', padding: '40px 20px', border: '1px solid #444', boxSizing: 'border-box' }}>
                        <h2 style={{ color: '#ffcc00', marginBottom: '20px' }}>MAP SYSTEM</h2>
                        <p style={{ color: '#aaa', fontStyle: 'italic', marginBottom: '30px' }}>[WORK IN PROGRESS]</p>
                        <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', backgroundColor: '#444' }}>BACK TO DASHBOARD</button>
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