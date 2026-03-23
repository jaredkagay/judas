import { useState, useRef, useEffect } from 'react';

function App() {
  const [view, setView] = useState('home'); 
  const [roomCode, setRoomCode] = useState('');
  const [alias, setAlias] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [playerList, setPlayerList] = useState([]); 
  const [role, setRole] = useState(null); 
  const [meetingCaller, setMeetingCaller] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [taskProgress, setTaskProgress] = useState(0);

  const [voteOutcome, setVoteOutcome] = useState({ eliminated: '', tally: {} });
  
  const [isAlive, setIsAlive] = useState(true);
  const [gameOverData, setGameOverData] = useState(null);

  // NEW TIMING METHOD: Store the exact timestamp when the cooldown should end
  const [cooldownEndTime, setCooldownEndTime] = useState(0); 
  const [displayCooldown, setDisplayCooldown] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);

  const [configImposters, setConfigImposters] = useState(1);
  const [configCooldown, setConfigCooldown] = useState(30);

  const [dictionaryTasks, setDictionaryTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('Medium');
  
  const ws = useRef(null);

  // NEW: The "Finish Line" Effect. It checks the real-world clock constantly.
  useEffect(() => {
    if (cooldownEndTime === 0) {
      setDisplayCooldown(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      // Calculate how many seconds are left between now and the finish line
      const remaining = Math.max(0, Math.ceil((cooldownEndTime - now) / 1000));
      setDisplayCooldown(remaining);

      // Stop checking once we hit 0
      if (remaining === 0) {
        setCooldownEndTime(0);
      }
    }, 200); // Check 5 times a second so it never visibly lags

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  useEffect(() => {
    const savedRoom = localStorage.getItem('roomCode');
    const savedAlias = localStorage.getItem('alias');
    if (savedRoom && savedAlias) {
      setRoomCode(savedRoom);
      setAlias(savedAlias);
      connectWebSocket(savedRoom, savedAlias, 'player'); 
    }
  }, []);

  const connectWebSocket = (code, userAlias, targetView) => {
    ws.current = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/${code.toUpperCase()}/${userAlias}`);

    ws.current.onopen = () => {
      setIsConnected(true);
      setView(targetView);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === 'roster_update') {
        setPlayerList(data.all_players); 
      } 
      else if (data.event === 'role_reveal') {
        setRole(data.role); 
        if (data.tasks) setTasks(data.tasks);
      }
      else if (data.event === 'emergency_alert') {
        setMeetingCaller(data.caller);
        setHasVoted(false);
        setView(userAlias === 'ORGANIZER' ? 'organizer_meeting' : 'voting');
      }
      else if (data.event === 'vote_results') {
        setVoteOutcome({ eliminated: data.eliminated, tally: data.tally });
        if (data.eliminated === userAlias) setIsAlive(false);
        
        if (data.game_over) {
          setGameOverData({ winner: data.winner, reason: data.reason });
        }
        setView('voting_results');
      }
      else if (data.event === 'game_started') {
        if (userAlias === 'ORGANIZER') setView('organizer_dashboard');
        
        // NEW: Calculate the finish line time locally
        if (data.cooldown) {
          setCooldownEndTime(Date.now() + (data.cooldown * 1000));
        }
      }
      else if (data.event === 'task_progress_update') {
        setTaskProgress(data.progress);
      }
      else if (data.event === 'game_over') {
        setGameOverData({ winner: data.winner, reason: data.reason });
        setView('game_over');
      }
      else if (data.event === 'cooldown_reset') {
        // NEW: Calculate the finish line time locally
        setCooldownEndTime(Date.now() + (data.cooldown * 1000));
      }
    };
    
    ws.current.onclose = () => setIsConnected(false);
  };

  const fetchTasks = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`);
    const data = await response.json();
    setDictionaryTasks(data);
  };

  const addTask = async () => {
    if (!newTaskName || !newTaskLocation || !newTaskDescription) return;
    
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_name: newTaskName,
        location: newTaskLocation,
        description: newTaskDescription,
        difficulty: newTaskDifficulty
      })
    });
    
    const addedTask = await response.json();
    setDictionaryTasks([...dictionaryTasks, addedTask]);
    
    // Clear the form
    setNewTaskName('');
    setNewTaskLocation('');
    setNewTaskDescription('');
    setNewTaskDifficulty('Medium');
  };

  const deleteTask = async (taskId) => {
    await fetch(`${import.meta.env.VITE_API_URL}/tasks/${taskId}`, { method: 'DELETE' });
    setDictionaryTasks(dictionaryTasks.filter(t => t.id !== taskId));
  };

  const handleHostGame = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/host`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imposter_count: configImposters, 
          cooldown_sec: configCooldown 
        })
      });
      const data = await response.json();
      const newCode = data.room_code;
      setRoomCode(newCode);
      setAlias('ORGANIZER');
      connectWebSocket(newCode, 'ORGANIZER', 'organizer');
    } catch (error) {
      console.error("Failed to host game:", error);
    }
  };

  const startGame = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/start/${roomCode}`, { method: 'POST' });
  };

  const joinRoom = () => {
    if (!roomCode || !alias) return;
    localStorage.setItem('roomCode', roomCode.toUpperCase());
    localStorage.setItem('alias', alias);
    connectWebSocket(roomCode.toUpperCase(), alias, 'player');
  };

  const callEmergency = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isAlive) {
      ws.current.send(JSON.stringify({ action: 'trigger_emergency' }));
    }
  };

  const castVote = (targetAlias) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'submit_vote', target: targetAlias }));
      setHasVoted(true);
    }
  };

  const markTaskComplete = (taskId, e) => {
    e.stopPropagation(); // Prevents the modal from opening when clicking the checkbox
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, is_completed: true } : t
    ));
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'complete_task', task_id: taskId }));
    }
  };

  const reportNeutralized = () => {
    setIsAlive(false);
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'report_neutralized' }));
    }
  };

  const resumeMission = () => {
    if (gameOverData) {
      setView('game_over');
      return;
    }

    setHasVoted(false);
    setVoteOutcome({ eliminated: '', tally: {} });
    setView(alias === 'ORGANIZER' ? 'organizer_dashboard' : 'player');

    // NEW: Reset the finish line 30 seconds from now
    setCooldownEndTime(Date.now() + (30 * 1000));
  };

  const leaveGame = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div style={{ backgroundColor: '#0a0a0a', color: '#f0f0f0', minHeight: '100vh', padding: '20px', fontFamily: 'monospace' }}>
      <h1 style={{ color: '#ff3333', textAlign: 'center', letterSpacing: '2px' }}>OPERATION: RETREAT</h1>
      
      {view === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '50px' }}>
          <input type="text" placeholder="ROOM CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="AGENT ALIAS" value={alias} onChange={(e) => setAlias(e.target.value)} style={inputStyle} />
          
          <button onClick={joinRoom} style={btnStyle}>JOIN MISSION</button>
          <div style={{ textAlign: 'center', margin: '20px 0', color: '#555', letterSpacing: '2px' }}>— OR —</div>
          
          {/* UPDATED: Fetch the tasks right before showing the host config screen */}
          <button onClick={() => { setView('host_config'); fetchTasks(); }} style={{...btnStyle, backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#aaa'}}>
            HOST MISSION
          </button>
        </div>
      )}

      {/* NEW: Host Configuration View */}
      {view === 'host_config' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '350px', margin: '0 auto', marginTop: '30px' }}>
          <h2 style={{ color: '#aaa', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '10px' }}>MISSION PARAMETERS</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
            <span>IMPOSTER COUNT</span>
            <input 
              type="number" 
              value={configImposters} 
              onChange={(e) => setConfigImposters(parseInt(e.target.value))} 
              min={1} max={3} 
              style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
            <span>COOLDOWN (SEC)</span>
            <input 
              type="number" 
              value={configCooldown} 
              onChange={(e) => setConfigCooldown(parseInt(e.target.value))} 
              min={10} max={60} 
              style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
            />
          </div>

          {/* NEW: The Task Selection Module UI */}
          <div style={{ border: '1px solid #33ccff', padding: '15px', backgroundColor: '#050505', marginTop: '10px' }}>
            <h3 style={{ color: '#33ccff', margin: '0 0 15px 0', letterSpacing: '1px' }}>TASK DICTIONARY</h3>
            
            {/* Scrollable List of Existing Tasks */}
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {dictionaryTasks.map(task => (
                <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '10px', marginBottom: '5px', border: '1px solid #333' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{task.task_name}</div>
                    <div style={{ color: '#aaa', fontSize: '12px' }}>{task.location}</div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} style={{ backgroundColor: 'transparent', color: '#ff3333', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>X</button>
                </div>
              ))}
            </div>

            {/* Add New Task Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px dashed #333', paddingTop: '15px' }}>
              <input type="text" placeholder="Task Name (e.g. Wipe Tables)" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: 'white' }} />
              <input type="text" placeholder="Location (e.g. Cafeteria)" value={newTaskLocation} onChange={e => setNewTaskLocation(e.target.value)} style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: 'white' }} />
              <textarea placeholder="Description / Instructions..." value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: 'white', minHeight: '60px', fontFamily: 'monospace' }} />
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value)} style={{ padding: '10px', backgroundColor: '#1a1a1a', border: '1px solid #444', color: 'white', flex: 1 }}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <button onClick={addTask} style={{ padding: '10px', backgroundColor: '#33ccff', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer', flex: 1 }}>
                  ADD DIRECTIVE
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleHostGame} style={{...btnStyle, width: '100%', marginTop: '20px'}}>GENERATE ROOM CODE</button>
          <button onClick={() => setView('home')} style={{ padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}>CANCEL</button>
        </div>
      )}

      {view === 'organizer' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2>MISSION CREATED</h2>
          <h1 style={{ fontSize: '60px', color: '#ff3333', letterSpacing: '10px', margin: '20px 0' }}>{roomCode}</h1>
          <button onClick={startGame} style={{...btnStyle, backgroundColor: '#00cc00', marginBottom: '20px'}}>START MISSION</button>
          
          <div style={{ borderTop: '1px solid #333', paddingTop: '20px' }}>
            <h3>ROSTER ({playerList.length} CONNECTED)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
              {playerList.map((player, idx) => (
                <div key={idx} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', border: '1px solid #444' }}>{player}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'organizer_meeting' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: '#ff3333' }}>🚨 EMERGENCY MEETING 🚨</h2>
          <p>Called by: {meetingCaller}</p>
          <h3 style={{ marginTop: '40px' }}>Awaiting Agent Votes...</h3>
        </div>
      )}

      {view === 'player_join' && !isConnected && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '50px' }}>
         <input type="text" placeholder="ROOM CODE" value={roomCode} onChange={(e) => setRoomCode(e.target.value)} style={inputStyle} />
         <input type="text" placeholder="AGENT ALIAS" value={alias} onChange={(e) => setAlias(e.target.value)} style={inputStyle} />
         <button onClick={joinRoom} style={btnStyle}>INITIALIZE UPLINK</button>
       </div>
      )}

      {view === 'organizer_dashboard' && (
        <div style={{ textAlign: 'center', marginTop: '30px', maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ color: '#aaa', letterSpacing: '3px' }}>MISSION IN PROGRESS</h2>
          <h1 style={{ fontSize: '40px', color: '#ff3333', margin: '10px 0' }}>{roomCode}</h1>
          
          <div style={{ marginTop: '40px', padding: '30px', border: '1px solid #33ccff', backgroundColor: '#111' }}>
            <h3 style={{ color: '#33ccff', marginBottom: '20px', letterSpacing: '2px' }}>CREW TASK COMPLETION</h3>
            <div style={{ width: '100%', height: '40px', backgroundColor: '#222', border: '2px solid #444', borderRadius: '20px', overflow: 'hidden' }}>
              <div style={{ width: `${taskProgress}%`, height: '100%', backgroundColor: taskProgress === 100 ? '#00ff00' : '#33ccff', transition: 'width 0.5s ease-out, background-color 0.5s ease' }}></div>
            </div>
            <h1 style={{ marginTop: '15px', color: taskProgress === 100 ? '#00ff00' : '#f0f0f0', fontSize: '36px' }}>{taskProgress}%</h1>
          </div>

          <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '40px' }}>
            <h3>ACTIVE ROSTER</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '10px' }}>
              {playerList.map((player, idx) => (
                <div key={idx} style={{ backgroundColor: '#1a1a1a', padding: '10px 20px', border: '1px solid #444' }}>{player}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'player' && isConnected && (
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '30px' }}>
           {!role ? (
             <h3>AWAITING MISSION BRIEFING...</h3>
           ) : (
             <>
               {!isAlive && (
                 <div style={{ backgroundColor: '#550000', padding: '10px', width: '100%', textAlign: 'center', fontWeight: 'bold', marginBottom: '20px' }}>
                   STATUS: NEUTRALIZED (GHOST MODE)
                 </div>
               )}

               <div style={{ opacity: isAlive ? 1 : 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                 <h2 style={{ color: role === 'Imposter' ? '#ff3333' : '#33ccff', fontSize: '32px', borderBottom: '2px solid', paddingBottom: '10px' }}>
                   YOU ARE: {role.toUpperCase()}
                 </h2>

                 {/* UPDATED: Cleaner Task List */}
                 {role === 'Crewmate' && tasks.length > 0 && (
                   <div style={{ width: '100%', maxWidth: '350px', marginTop: '20px', marginBottom: '30px' }}>
                     <h3 style={{ color: '#aaa', borderBottom: '1px solid #444', paddingBottom: '10px' }}>MISSION OBJECTIVES:</h3>
                     <ul style={{ listStyleType: 'none', padding: 0 }}>
                       {tasks.map(task => (
                         <li 
                           key={task.id} 
                           onClick={() => setSelectedTask(task)} // Opens the modal
                           style={{ backgroundColor: '#111', padding: '15px', marginBottom: '10px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                         >
                           <div style={{ fontSize: '18px', fontWeight: 'bold', textDecoration: task.is_completed ? 'line-through' : 'none', color: task.is_completed ? '#666' : '#f0f0f0' }}>
                             {task.task_name}
                           </div>
                           
                           <div 
                             onClick={(e) => !task.is_completed && markTaskComplete(task.id, e)} // e.stopPropagation() is inside here!
                             style={{ 
                               width: '30px', height: '30px', border: '2px solid #33ccff', borderRadius: '5px', 
                               display: 'flex', alignItems: 'center', justifyContent: 'center', 
                               backgroundColor: task.is_completed ? '#33ccff' : 'transparent', transition: 'all 0.2s ease'
                             }}
                           >
                             {task.is_completed && <span style={{ color: '#000', fontWeight: 'bold', fontSize: '20px' }}>✓</span>}
                           </div>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}

                 {role === 'Imposter' && (
                   <div style={{ width: '100%', maxWidth: '350px', marginTop: '20px', marginBottom: '30px', textAlign: 'center' }}>
                     <h3 style={{ color: '#aaa', borderBottom: '1px solid #444', paddingBottom: '10px' }}>SYSTEM UPLINK:</h3>
                     
                     {/* UPDATED: We use displayCooldown here instead */}
                     {displayCooldown > 0 ? (
                       <div style={{ padding: '15px', backgroundColor: '#111', color: '#555', border: '1px solid #333', width: '100%', fontWeight: 'bold' }}>
                         SYNCING DATA... {displayCooldown}s
                       </div>
                     ) : (
                       <div style={{ padding: '15px', backgroundColor: '#002200', color: '#00ff00', border: '1px solid #00ff00', width: '100%', fontWeight: 'bold', animation: 'blink 2s infinite' }}>
                         UPLINK ESTABLISHED
                       </div>
                     )}
                   </div>
                 )}
               </div>

               {isAlive && (
                 <>
                   <button onClick={callEmergency} style={emergencyBtnStyle}>
                     EMERGENCY<br/>MEETING
                   </button>

                   {role === 'Crewmate' && (
                     <button 
                       disabled={displayCooldown > 0}
                       onClick={reportNeutralized}
                       style={{ 
                         marginTop: '30px', padding: '15px', 
                         backgroundColor: displayCooldown > 0 ? '#111' : '#220000', 
                         color: displayCooldown > 0 ? '#555' : '#ff3333', 
                         border: displayCooldown > 0 ? '1px solid #333' : '1px solid #ff3333', 
                         width: '250px', fontWeight: 'bold', 
                         cursor: displayCooldown > 0 ? 'not-allowed' : 'pointer', letterSpacing: '1px' 
                       }}
                     >
                       {/* UPDATED: Using displayCooldown for the button as well */}
                       {displayCooldown > 0 ? `COMMS JAMMED (${displayCooldown}s)` : 'I WAS NEUTRALIZED'}
                     </button>
                   )}
                 </>
               )}
             </>
           )}
           <button onClick={leaveGame} style={{ marginTop: '50px', padding: '10px', backgroundColor: 'transparent', color: '#666', border: '1px solid #666' }}>
             DISCONNECT
           </button>
       </div>
      )}
      
      {view === 'voting' && isConnected && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h2 style={{ color: '#ff3333', fontSize: '28px', animation: 'blink 1s infinite' }}>🚨 EMERGENCY MEETING 🚨</h2>
          <p style={{ fontSize: '18px', marginBottom: '30px' }}>Initiated by: <strong style={{ color: '#ff3333' }}>{meetingCaller}</strong></p>
          
          {hasVoted ? (
            <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #33ccff', color: '#33ccff' }}>
              <h3>VOTE REGISTERED.</h3>
              <p>Awaiting server consensus...</p>
            </div>
          ) : (
            <>
              {isAlive ? (
                <>
                  <h3 style={{ marginBottom: '20px' }}>SELECT AGENT TO ELIMINATE:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                    {playerList.map((player, idx) => player !== alias && (
                      <button key={idx} onClick={() => castVote(player)} style={{ padding: '15px', backgroundColor: '#1a1a1a', color: '#f0f0f0', border: '1px solid #444', cursor: 'pointer', fontSize: '18px', textTransform: 'uppercase' }}>
                        {player}
                      </button>
                    ))}
                    <button onClick={() => castVote('SKIP')} style={{ padding: '15px', backgroundColor: '#333', color: '#aaa', border: '1px dashed #666', cursor: 'pointer', fontSize: '18px', marginTop: '20px' }}>
                      SKIP VOTE
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #666', color: '#aaa' }}>
                  <h3>YOU ARE A GHOST</h3>
                  <p>You cannot participate in voting.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === 'voting_results' && (
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <h2 style={{ color: '#aaa', letterSpacing: '2px' }}>VOTING CONCLUDED</h2>
          
          <div style={{ margin: '40px 0', padding: '30px', border: voteOutcome.eliminated === 'NO ONE' ? '2px solid #aaa' : '2px solid #ff3333', backgroundColor: '#111' }}>
            {voteOutcome.eliminated === 'NO ONE' ? (
              <h2 style={{ color: '#aaa' }}>VOTING TIED OR SKIPPED.<br/>NO AGENTS ELIMINATED.</h2>
            ) : (
              <>
                <h2 style={{ color: '#ff3333', fontSize: '36px', margin: '0' }}>AGENT ELIMINATED:</h2>
                <h1 style={{ color: 'white', fontSize: '48px', textTransform: 'uppercase', margin: '10px 0' }}>{voteOutcome.eliminated}</h1>
              </>
            )}
          </div>

          <div style={{ maxWidth: '300px', margin: '0 auto', textAlign: 'left', backgroundColor: '#1a1a1a', padding: '20px', border: '1px solid #333' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #444', paddingBottom: '10px' }}>FINAL TALLY:</h3>
            {Object.entries(voteOutcome.tally).map(([target, votes]) => (
              <div key={target} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>{target}</span>
                <span style={{ fontWeight: 'bold', color: '#ff3333' }}>{votes}</span>
              </div>
            ))}
          </div>

          <button onClick={resumeMission} style={{ ...btnStyle, marginTop: '40px', backgroundColor: gameOverData ? '#cc00cc' : '#33ccff', color: gameOverData ? 'white' : 'black' }}>
            {gameOverData ? 'VIEW FINAL RESULTS' : 'RESUME MISSION'}
          </button>
        </div>
      )}

      {view === 'game_over' && gameOverData && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h2 style={{ color: '#aaa', letterSpacing: '5px' }}>MISSION TERMINATED</h2>
          
          <div style={{ 
            marginTop: '40px', padding: '40px 20px', 
            border: gameOverData.winner === 'Crewmates' ? '2px solid #33ccff' : '2px solid #ff3333',
            backgroundColor: '#111' 
          }}>
            <h1 style={{ 
              fontSize: '50px', margin: '0 0 20px 0', textTransform: 'uppercase',
              color: gameOverData.winner === 'Crewmates' ? '#33ccff' : '#ff3333' 
            }}>
              {gameOverData.winner} WIN
            </h1>
            <h3 style={{ color: '#aaa', margin: 0 }}>{gameOverData.reason}</h3>
          </div>

          <button onClick={leaveGame} style={{ ...btnStyle, marginTop: '60px', backgroundColor: '#333' }}>
            DISCONNECT & RETURN TO LOBBY
          </button>
        </div>
      )}

      {/* NEW: THE TASK MODAL OVERLAY */}
      {selectedTask && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 
        }}>
          <div style={{ backgroundColor: '#111', border: '2px solid #33ccff', padding: '30px', maxWidth: '300px', width: '90%' }}>
             <h2 style={{ color: '#33ccff', marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>{selectedTask.task_name}</h2>
             <h4 style={{ color: '#aaa', margin: '15px 0' }}>📍 {selectedTask.location}</h4>
             <ul style={{ color: '#f0f0f0', paddingLeft: '20px', lineHeight: '1.5' }}>
                <li>{selectedTask.description}</li>
             </ul>
             <button onClick={() => setSelectedTask(null)} style={{ ...btnStyle, width: '100%', marginTop: '30px', backgroundColor: '#333' }}>
               CLOSE DIRECTIVE
             </button>
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle = { padding: '15px', backgroundColor: '#ff3333', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px', width: '250px' };
const inputStyle = { padding: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', color: 'white', textAlign: 'center', letterSpacing: '3px' };
const emergencyBtnStyle = { width: '250px', height: '250px', borderRadius: '50%', backgroundColor: '#cc0000', color: 'white', fontSize: '24px', fontWeight: 'bold', border: '10px solid #550000', boxShadow: '0 0 20px #ff000055', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', marginTop: '30px' };

export default App;