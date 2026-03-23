import { useState, useRef, useEffect } from 'react';

function App() {
  const [view, setView] = useState('home'); 
  const [roomCode, setRoomCode] = useState('');
  const [alias, setAlias] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [playerList, setPlayerList] = useState([]); 
  const [eligibleTargets, setEligibleTargets] = useState([]);
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
  const [configDiscussionTime, setConfigDiscussionTime] = useState(60);
  const [configVotingTime, setConfigVotingTime] = useState(60);

  const [dictionaryTasks, setDictionaryTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('Medium');

  // --- NEW HOST AUTH STATE ---
  const [hostId, setHostId] = useState(null);
  const [hostUsername, setHostUsername] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const [editingTaskId, setEditingTaskId] = useState(null);

  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [peekRole, setPeekRole] = useState(false);
  const [teammates, setTeammates] = useState([]);

  // --- NEW MEETING PHASE STATE ---
  const [meetingAcks, setMeetingAcks] = useState(0);
  const [meetingTotal, setMeetingTotal] = useState(0);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [meetingEndTime, setMeetingEndTime] = useState(0); 
  const [displayMeetingTime, setDisplayMeetingTime] = useState(0);

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
    
    // NEW: Host auto-login logic
    const savedHostId = localStorage.getItem('hostId');
    const savedHostName = localStorage.getItem('hostUsername');
    if (savedHostId && savedHostName) {
      setHostId(parseInt(savedHostId));
      setHostUsername(savedHostName);
    }
  }, []);

  // NEW: Discussion Timer Countdown
  useEffect(() => {
    if (meetingEndTime === 0) {
      setDisplayMeetingTime(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((meetingEndTime - now) / 1000));
      setDisplayMeetingTime(remaining);

      if (remaining === 0) setMeetingEndTime(0);
    }, 200);

    return () => clearInterval(interval);
  }, [meetingEndTime]);

  // 2. Auto-Skip if voting time runs out
  useEffect(() => {
    // If we are in the voting screen, time is up, the player is alive, hasn't voted, and IS NOT the organizer... force a skip!
    if (view === 'voting' && displayMeetingTime === 0 && !hasVoted && isAlive && alias !== 'ORGANIZER') {
      castVote('SKIP');
    }
  }, [displayMeetingTime, view, hasVoted, isAlive, alias]);

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
        if (data.teammates) setTeammates(data.teammates);
        setShowRoleReveal(true);
      }
      // ... (keep roster_update and role_reveal)

      // PHASE 1: ALERT
      else if (data.event === 'emergency_alert') {
        setMeetingCaller(data.caller);
        setHasVoted(false);
        setHasAcknowledged(false);
        setMeetingAcks(0);
        // Fallback total if ack_update hasn't fired yet
        setMeetingTotal(data.total_alive); 
        setView('emergency_alert');
        
        // Play an alarm sound! (Will only play if the browser allows auto-play)
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3');
          audio.loop = true;
          audio.id = "emergency-alarm";
          audio.play();
        } catch (e) { console.log("Audio autoplay blocked by browser"); }
      }
      
      // PHASE 1.5: ACKNOWLEDGMENT TRACKING
      else if (data.event === 'ack_update') {
        setMeetingAcks(data.acks);
        setMeetingTotal(data.total);
      }
      
      // PHASE 2: DISCUSSION
      else if (data.event === 'discussion_started') {
        // Stop the alarm sound
        const alarm = document.getElementById("emergency-alarm");
        if (alarm) alarm.pause();
        
        setMeetingEndTime(Date.now() + (data.discussion_time * 1000));
        setDisplayMeetingTime(data.discussion_time);
        setView('discussion');
      }

      // PHASE 3: VOTING (This moves us from discussion into the actual voting screen)
      else if (data.event === 'voting_started') {
        setMeetingEndTime(Date.now() + (data.voting_time * 1000));
        setDisplayMeetingTime(data.voting_time); 
        setEligibleTargets(data.eligible_targets || []);
        setView('voting');
      }

      // ... (keep vote_results, game_started, etc.)
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

  const authenticateHost = async (e) => {
    e.preventDefault();
    if (!hostUsername || !hostPassword) return;

    const endpoint = authMode === 'login' ? '/login' : '/register';
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: hostUsername, password: hostPassword })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Authentication failed: ${errorData.detail}`);
        return;
      }

      const data = await response.json();
      
      // Save session securely
      setHostId(data.host_id);
      localStorage.setItem('hostId', data.host_id);
      localStorage.setItem('hostUsername', data.username);
      
      // Clear password from state for security
      setHostPassword(''); 
      
      // Send them to the dashboard
      setView('host_dashboard'); 
      fetchTasks(); // We'll update this function next time to fetch host-specific tasks
    } catch (error) {
      console.error("Auth error:", error);
      alert("Failed to connect to the server.");
    }
  };

  const logoutHost = () => {
    setHostId(null);
    setHostUsername('');
    localStorage.removeItem('hostId');
    localStorage.removeItem('hostUsername');
    setView('home');
  };

  const fetchTasks = async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`);
    const data = await response.json();
    setDictionaryTasks(data);
  };

  // Fetches the Host's saved Template and Tasks from the database
  const fetchDashboardData = async () => {
    if (!hostId) return;

    try {
      const tmplRes = await fetch(`${import.meta.env.VITE_API_URL}/template/${hostId}`);
      if (tmplRes.ok) {
        const tmpl = await tmplRes.json();
        setConfigImposters(tmpl.imposter_count);
        setConfigCooldown(tmpl.cooldown_sec);
        setConfigDiscussionTime(tmpl.discussion_time_sec || 60); 
        setConfigVotingTime(tmpl.voting_time_sec || 30);
      }
      // 2. Get Host's Task Dictionary
      const taskRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${hostId}`);
      if (taskRes.ok) {
        setDictionaryTasks(await taskRes.json());
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  };

  // Trigger data fetch whenever the dashboard is opened
  useEffect(() => {
    if (view === 'host_dashboard' && hostId) {
      fetchDashboardData();
    }
  }, [view, hostId]);

  // Saves changes made to the Imposter Count or Cooldown
  const saveTemplateSettings = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/template/${hostId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imposter_count: configImposters,
        cooldown_sec: configCooldown,
        discussion_time_sec: configDiscussionTime,
        voting_time_sec: configVotingTime
      })
    });
    alert("Mission parameters saved!");
  };

  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setNewTaskName(task.task_name);
    setNewTaskLocation(task.location);
    setNewTaskDescription(task.description);
    setNewTaskDifficulty(task.difficulty || 'Medium');
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
    setNewTaskName('');
    setNewTaskLocation('');
    setNewTaskDescription('');
    setNewTaskDifficulty('Medium');
  };

  // This single function handles both Creating and Updating
  const saveTask = async () => {
    if (!newTaskName || !newTaskLocation || !newTaskDescription || !hostId) return;
    
    if (editingTaskId) {
      // UPDATE EXISTING TASK
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${editingTaskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_name: newTaskName,
          location: newTaskLocation,
          description: newTaskDescription,
          difficulty: newTaskDifficulty
        })
      });
      const updatedTask = await response.json();
      
      // Replace the old task with the updated one in our list
      setDictionaryTasks(dictionaryTasks.map(t => t.id === editingTaskId ? updatedTask : t));
    } else {
      // CREATE NEW TASK
      const response = await fetch(`${import.meta.env.VITE_API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_id: hostId,
          task_name: newTaskName,
          location: newTaskLocation,
          description: newTaskDescription,
          difficulty: newTaskDifficulty
        })
      });
      const addedTask = await response.json();
      setDictionaryTasks([...dictionaryTasks, addedTask]);
    }
    
    // Clear the form and exit edit mode
    cancelEdit();
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
          host_id: hostId,
          imposter_count: configImposters, 
          cooldown_sec: configCooldown,
          discussion_time_sec: configDiscussionTime,
          voting_time_sec: configVotingTime
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

  const acknowledgeMeeting = () => {
    setHasAcknowledged(true);
    const alarm = document.getElementById("emergency-alarm");
    if (alarm) alarm.pause(); // <-- Stops the alarm instantly
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'acknowledge_meeting' }));
    }
  };

  const startVoting = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'start_voting' }));
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

  const renderTaskList = (difficultyLabel) => {
    const filtered = dictionaryTasks.filter(t => t.difficulty === difficultyLabel);
    if (filtered.length === 0) return null; // Don't show the category if it's empty
    
    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ 
          color: difficultyLabel === 'Hard' ? '#ff3333' : difficultyLabel === 'Medium' ? '#ffcc00' : '#33ccff', 
          fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', borderBottom: '1px solid #333', paddingBottom: '4px'
        }}>
          {difficultyLabel} DIRECTIVES ({filtered.length})
        </div>
        {filtered.map(task => (
          <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: editingTaskId === task.id ? '#332200' : '#111', padding: '10px', marginBottom: '5px', border: editingTaskId === task.id ? '1px solid #ffcc00' : '1px solid #333' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: editingTaskId === task.id ? '#ffcc00' : 'white' }}>{task.task_name}</div>
              <div style={{ color: '#aaa', fontSize: '12px' }}>{task.location}</div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => startEditTask(task)} style={{ backgroundColor: 'transparent', color: '#33ccff', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>EDIT</button>
              <button onClick={() => deleteTask(task.id)} style={{ backgroundColor: 'transparent', color: '#ff3333', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>X</button>
            </div>
          </div>
        ))}
      </div>
    );
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
          
          {/* UPDATED HOST BUTTON */}
          <button onClick={() => { 
            if (hostId) {
              setView('host_dashboard');
              // We will eventually fetch their specific template/tasks here
            } else {
              setView('host_auth'); 
            }
          }} style={{...btnStyle, backgroundColor: '#1a1a1a', border: '1px solid #444', color: '#aaa'}}>
            HOST MISSION
          </button>
        </div>
      )}

      {/* NEW: Host Authentication View */}
      {view === 'host_auth' && (
        <form onSubmit={authenticateHost} style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '300px', margin: '0 auto', marginTop: '50px' }}>
          <h2 style={{ color: '#aaa', textAlign: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', textTransform: 'uppercase' }}>
            HOST {authMode}
          </h2>
          
          <input 
            type="text" 
            placeholder="USERNAME" 
            value={hostUsername} 
            onChange={(e) => setHostUsername(e.target.value)} 
            style={inputStyle} 
            required
          />
          <input 
            type="password" 
            placeholder="PASSWORD" 
            value={hostPassword} 
            onChange={(e) => setHostPassword(e.target.value)} 
            style={inputStyle} 
            required
          />
          
          <button type="submit" style={btnStyle}>
            {authMode === 'login' ? 'ACCESS DASHBOARD' : 'INITIALIZE ACCOUNT'}
          </button>
          
          <div 
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            style={{ textAlign: 'center', color: '#666', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline' }}
          >
            {authMode === 'login' ? 'Need an account? Register here.' : 'Already have clearance? Log in.'}
          </div>

          <button type="button" onClick={() => setView('home')} style={{ padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer', marginTop: '20px' }}>
            CANCEL
          </button>
        </form>
      )}

      {/* NEW: Host Configuration View */}
      {/* NEW: Host Dashboard View */}
      {view === 'host_dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '350px', margin: '0 auto', marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
             <h2 style={{ color: '#aaa', margin: 0, textTransform: 'uppercase' }}>{hostUsername}'S DASHBOARD</h2>
             <button onClick={logoutHost} style={{ backgroundColor: 'transparent', color: '#ff3333', border: '1px solid #ff3333', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
               LOG OUT
             </button>
          </div>
          
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

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
            <span>DISCUSSION TIME (SEC)</span>
            <input 
              type="number" 
              value={configDiscussionTime} 
              onChange={(e) => setConfigDiscussionTime(parseInt(e.target.value))} 
              min={10} max={300} 
              style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
            <span>VOTING TIME (SEC)</span>
            <input 
              type="number" 
              value={configVotingTime} 
              onChange={(e) => setConfigVotingTime(parseInt(e.target.value))} 
              min={10} max={300} 
              style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
            />
          </div>
          
          <button onClick={saveTemplateSettings} style={{ padding: '10px', backgroundColor: '#333', color: '#f0f0f0', border: '1px dashed #666', cursor: 'pointer' }}>
            SAVE PARAMETERS
          </button>

          {/* THE TASK DICTIONARY MODULE */}
          <div style={{ border: editingTaskId ? '2px solid #ffcc00' : '1px solid #33ccff', padding: '15px', backgroundColor: '#050505', marginTop: '10px', transition: 'border 0.3s' }}>
            <h3 style={{ color: editingTaskId ? '#ffcc00' : '#33ccff', margin: '0 0 15px 0', letterSpacing: '1px' }}>
              {editingTaskId ? 'EDITING DIRECTIVE...' : 'TASK DICTIONARY'}
            </h3>
            
            {/* Scrollable List of Existing Tasks Grouped by Difficulty */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {dictionaryTasks.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', fontStyle: 'italic', padding: '20px 0' }}>No tasks found. Add one below.</div>
              ) : (
                <>
                  {renderTaskList('Hard')}
                  {renderTaskList('Medium')}
                  {renderTaskList('Easy')}
                </>
              )}
            </div>

            {/* Form for Creating / Editing */}
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
                
                <button onClick={saveTask} style={{ padding: '10px', backgroundColor: editingTaskId ? '#ffcc00' : '#33ccff', color: 'black', fontWeight: 'bold', border: 'none', cursor: 'pointer', flex: 1 }}>
                  {editingTaskId ? 'SAVE EDIT' : 'ADD DIRECTIVE'}
                </button>
              </div>
              
              {/* Show cancel button only when editing */}
              {editingTaskId && (
                <button onClick={cancelEdit} style={{ padding: '5px', backgroundColor: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '12px', marginTop: '-5px' }}>
                  CANCEL EDIT
                </button>
              )}
            </div>
          </div>

          <button onClick={handleHostGame} style={{...btnStyle, width: '100%', marginTop: '20px'}}>GENERATE ROOM CODE</button>
          
          {/* A soft cancel to go back to home without logging out */}
          <button onClick={() => setView('home')} style={{ padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}>
            BACK TO MAIN MENU
          </button>
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
         <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
           <style>
             {`
               @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
               @keyframes pulseText { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
             `}
           </style>

           {!role ? (
             // WAITING SCREEN (Before start)
             <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <h3 style={{ animation: 'pulseText 2s infinite', color: '#666', letterSpacing: '2px' }}>AWAITING MISSION BRIEFING...</h3>
             </div>
           ) : showRoleReveal ? (
             // REVEAL OVERLAY (Hides everything else)
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

               {/* Render Fellow Imposters if they exist */}
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
             // UNIFIED PLAYER DASHBOARD (Renders only after pressing Acknowledge)
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
                       {/* Also show teammates in the Peek screen so they can check mid-game */}
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
      )}

      {/* PHASE 1: THE ALERT OVERLAY */}
      {view === 'emergency_alert' && (
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
      )}

      {/* PHASE 2: DISCUSSION / DELIBERATION */}
      {view === 'discussion' && (
        <div style={{ textAlign: 'center', marginTop: '20px', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
          <h2 style={{ color: '#ffcc00', fontSize: '28px', textTransform: 'uppercase', letterSpacing: '2px' }}>DELIBERATION PHASE</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Discuss the evidence. Decide your vote.</p>
          
          {/* Countdown Timer */}
          <div style={{ margin: '30px 0', fontSize: '64px', fontWeight: 'bold', color: displayMeetingTime > 0 ? '#33ccff' : '#ff3333', textShadow: '0 0 10px rgba(51, 204, 255, 0.3)' }}>
            00:{displayMeetingTime.toString().padStart(2, '0')}
          </div>

          {/* Roster Display */}
          <div style={{ backgroundColor: '#111', padding: '15px', border: '1px solid #333', textAlign: 'left', marginBottom: '40px' }}>
            <h3 style={{ color: '#aaa', borderBottom: '1px solid #333', paddingBottom: '10px', marginTop: 0 }}>AGENTS PRESENT</h3>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {playerList.map((player, idx) => (
                <div key={idx} style={{ padding: '10px 0', borderBottom: '1px dashed #222', color: '#f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{player}</span>
                  {/* Note: If you want to explicitly show dead/alive status here, the backend roster_update will need to pass an object {alias: 'name', is_alive: true} instead of just strings! For now, we show everyone. */}
                </div>
              ))}
            </div>
          </div>

          {/* Voting Trigger (Only for Caller or Host) */}
          {alias === 'ORGANIZER' ? (
            <button 
              onClick={startVoting}
              style={{ ...btnStyle, width: '100%', backgroundColor: '#ffcc00', color: 'black', cursor: 'pointer' }}
            >
              PROCEED TO VOTING (OVERRIDE)
            </button>
          ) : alias === meetingCaller ? (
            <button 
              disabled={displayMeetingTime > 0}
              onClick={startVoting}
              style={{ ...btnStyle, width: '100%', backgroundColor: displayMeetingTime > 0 ? '#333' : '#ff3333', color: displayMeetingTime > 0 ? '#666' : 'white', cursor: displayMeetingTime > 0 ? 'not-allowed' : 'pointer' }}
            >
              {displayMeetingTime > 0 ? 'AWAITING DELIBERATION...' : 'PROCEED TO VOTING'}
            </button>
          ) : (
            <div style={{ color: '#666', fontStyle: 'italic', padding: '20px', border: '1px dashed #333' }}>
              Awaiting <span style={{ color: '#ff3333' }}>{meetingCaller}</span> to initiate voting sequence...
            </div>
          )}
        </div>
      )}
      
      {view === 'voting' && isConnected && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <h2 style={{ color: '#ff3333', fontSize: '28px', animation: 'blink 1s infinite' }}>🚨 EMERGENCY MEETING 🚨</h2>
          <p style={{ fontSize: '18px', marginBottom: '15px' }}>Initiated by: <strong style={{ color: '#ff3333' }}>{meetingCaller}</strong></p>
          
          <div style={{ margin: '20px 0', fontSize: '48px', fontWeight: 'bold', color: displayMeetingTime > 0 ? '#ffcc00' : '#ff3333' }}>
            00:{displayMeetingTime.toString().padStart(2, '0')}
          </div>

          {alias === 'ORGANIZER' ? (
            <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #aaa', color: '#aaa', backgroundColor: '#111' }}>
              <h3>AWAITING AGENT VOTES...</h3>
              <p>The system will tally automatically once all active agents have voted or the timer expires.</p>
            </div>
          ) : hasVoted ? (
            <div style={{ marginTop: '50px', padding: '20px', border: '1px solid #33ccff', color: '#33ccff', backgroundColor: '#111' }}>
              <h3>VOTE REGISTERED.</h3>
              <p>Awaiting server consensus...</p>
            </div>
          ) : (
            <>
              {isAlive ? (
                <>
                  <h3 style={{ marginBottom: '20px' }}>SELECT AGENT TO ELIMINATE:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px', margin: '0 auto' }}>
                    {eligibleTargets.map((player, idx) => player !== alias && (
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