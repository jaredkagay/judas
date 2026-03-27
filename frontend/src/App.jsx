import { useState, useRef, useEffect } from 'react';

// Component Imports
import Home from './components/Home';
import HostAuth from './components/HostAuth';
import HostDashboard from './components/Host/HostDashboard';
import PlayerDashboard from './components/Player/PlayerDashboard';
import EmergencyAlert from './components/EmergencyAlert';
import DiscussionPhase from './components/DiscussionPhase';
import VotingPhase from './components/VotingPhase';
import VotingResults from './components/VotingResults';
import GameOver from './components/GameOver';
import AuxiliaryJoin from './components/AuxiliaryJoin';
import AuxiliaryDashboard from './components/AuxiliaryDashboard';
import OrganizerDashboard from './components/Host/OrganizerDashboard';

import './App.css';
import './components/Shared.css';

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
  const [gameLogs, setGameLogs] = useState([]);
  const [logFilter, setLogFilter] = useState('ALL');

  const [voteOutcome, setVoteOutcome] = useState({ eliminated: '', tally: {} });
  
  const [isAlive, setIsAlive] = useState(true);
  const [gameOverData, setGameOverData] = useState(null);

  const [cooldownEndTime, setCooldownEndTime] = useState(0); 
  const [displayCooldown, setDisplayCooldown] = useState(0);

  const [configImposters, setConfigImposters] = useState(1);
  const [configCooldown, setConfigCooldown] = useState(30);
  const [configDiscussionTime, setConfigDiscussionTime] = useState(60);
  const [configVotingTime, setConfigVotingTime] = useState(60);

  const [dictionaryTasks, setDictionaryTasks] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskLocation, setNewTaskLocation] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState('Medium');

  const [hostId, setHostId] = useState(null);
  const [hostUsername, setHostUsername] = useState('');

  const [editingTaskId, setEditingTaskId] = useState(null);

  const [showRoleReveal, setShowRoleReveal] = useState(false);
  const [peekRole, setPeekRole] = useState(false);
  const [teammates, setTeammates] = useState([]);

  const [meetingAcks, setMeetingAcks] = useState(0);
  const [meetingTotal, setMeetingTotal] = useState(0);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [meetingEndTime, setMeetingEndTime] = useState(0); 
  const [displayMeetingTime, setDisplayMeetingTime] = useState(0);

  const [corpseId, setCorpseId] = useState(null);
  const [reportedBody, setReportedBody] = useState('');

  const [emergencyCooldownEndTime, setEmergencyCooldownEndTime] = useState(0); 
  const [displayEmergencyCooldown, setDisplayEmergencyCooldown] = useState(0);

  const [organizerState, setOrganizerState] = useState({ phase: 'Lobby', players: [] });

  const [configTasksHard, setConfigTasksHard] = useState(1);
  const [configTasksMedium, setConfigTasksMedium] = useState(2);
  const [configTasksEasy, setConfigTasksEasy] = useState(3);

  const ws = useRef(null);

  useEffect(() => {
    if (cooldownEndTime === 0) {
      setDisplayCooldown(0);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((cooldownEndTime - now) / 1000));
      setDisplayCooldown(remaining);

      if (remaining === 0) {
        setCooldownEndTime(0);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [cooldownEndTime]);

  useEffect(() => {
    const savedRoom = localStorage.getItem('roomCode');
    const savedAlias = localStorage.getItem('alias');
    if (savedRoom && savedAlias) {
      setRoomCode(savedRoom);
      setAlias(savedAlias);
      const targetView = savedAlias.startsWith('AUX_') ? 'aux_dashboard' : 'player';
      connectWebSocket(savedRoom, savedAlias, targetView); 
    }
    
    const savedHostId = localStorage.getItem('hostId');
    const savedHostName = localStorage.getItem('hostUsername');
    if (savedHostId && savedHostName) {
      setHostId(parseInt(savedHostId));
      setHostUsername(savedHostName);
    }
  }, []);

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

  useEffect(() => {
    if (view === 'voting' && displayMeetingTime === 0 && !hasVoted && isAlive && alias !== 'ORGANIZER' && !alias.startsWith('AUX_')) {
      castVote('SKIP');
    }
  }, [displayMeetingTime, view, hasVoted, isAlive, alias]);

  useEffect(() => {
    if (emergencyCooldownEndTime === 0) {
      setDisplayEmergencyCooldown(0);
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((emergencyCooldownEndTime - now) / 1000));
      setDisplayEmergencyCooldown(remaining);
      if (remaining === 0) setEmergencyCooldownEndTime(0);
    }, 200);
    return () => clearInterval(interval);
  }, [emergencyCooldownEndTime]);

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
        
        if (data.is_alive !== undefined) setIsAlive(data.is_alive); 
        
        setShowRoleReveal(true);
      }
      else if (data.event === 'emergency_alert') {
        setMeetingCaller(data.caller);
        setHasVoted(false);
        setHasAcknowledged(false);
        setMeetingAcks(0);
        setMeetingTotal(data.total_alive); 
        if (userAlias !== 'ORGANIZER') setView('emergency_alert');
        
        try {
          const alarm = document.getElementById("emergency-alarm");
          if (alarm) {
            alarm.currentTime = 0;
            alarm.play();
          }
        } catch (e) { console.log("Audio autoplay blocked by browser"); }
      }
      else if (data.event === 'ack_update') {
        setMeetingAcks(data.acks);
        setMeetingTotal(data.total);
      }
      else if (data.event === 'discussion_started') {
        const alarm = document.getElementById("emergency-alarm");
        if (alarm) alarm.pause();
        
        setEligibleTargets(data.alive_agents || []);
        
        // ADDED FALLBACKS (|| 60) to prevent the timer from crashing to NaN/0s
        const dTime = data.discussion_time || 60;
        setMeetingEndTime(Date.now() + (dTime * 1000));
        setDisplayMeetingTime(dTime);
        if (userAlias !== 'ORGANIZER') setView('discussion');
      }
      else if (data.event === 'voting_started') {
        // ADDED FALLBACKS (|| 30)
        const vTime = data.voting_time || 30;
        setMeetingEndTime(Date.now() + (vTime * 1000));
        setDisplayMeetingTime(vTime); 
        setEligibleTargets(data.eligible_targets || []);
        if (userAlias !== 'ORGANIZER') setView('voting');
      }
      else if (data.event === 'vote_results') {
        setVoteOutcome({ 
          eliminated: data.eliminated, 
          tally: data.tally,
          wasImposter: data.was_imposter,
          impostersRemaining: data.imposters_remaining 
        });
        
        if (data.eliminated === userAlias) setIsAlive(false);
        
        setCooldownEndTime(Date.now() + (30 * 1000));
        setEmergencyCooldownEndTime(Date.now() + (30 * 1000));

        if (data.game_over) {
          setGameOverData({ winner: data.winner, reason: data.reason });
          setView('game_over');
          
          if (userAlias.startsWith('AUX_')) {
            setHasVoted(false);
            setVoteOutcome({ eliminated: '', tally: {} });
          }
        } else {
          if (userAlias.startsWith('AUX_')) {
            setHasVoted(false);
            setVoteOutcome({ eliminated: '', tally: {} });
            setView('aux_dashboard');
          } else {
            if (userAlias !== 'ORGANIZER') setView('voting_results');
          }
        }
      }
      else if (data.event === 'game_started') {
        if (userAlias === 'ORGANIZER') {
            setView('organizer_dashboard');
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                ws.current.send(JSON.stringify({ action: 'request_sync' }));
            }
        }
        else if (userAlias.startsWith('AUX_')) setView('aux_dashboard'); 
        
        if (data.cooldown) {
          setCooldownEndTime(Date.now() + (data.cooldown * 1000));
          setEmergencyCooldownEndTime(Date.now() + (data.cooldown * 1000));
        }
      }
      else if (data.event === 'task_progress_update') {
        setTaskProgress(data.progress);
      }
      else if (data.event === 'game_log') {
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setGameLogs(prev => [
          { id: Date.now() + Math.random(), time: timeString, message: data.message, involved: data.involved }, 
          ...prev
        ]);
      }
      else if (data.event === 'game_over') {
        setGameOverData({ winner: data.winner, reason: data.reason });
        setView('game_over');
      }
      else if (data.event === 'cooldown_reset') {
        setCooldownEndTime(Date.now() + (data.cooldown * 1000));
      }
      else if (data.event === 'corpse_id_assigned') {
        setCorpseId(data.corpse_id);
      }
      else if (data.event === 'invalid_corpse_id') {
        alert("Invalid Corpse ID. Please check the code and try again.");
      }
      else if (data.event === 'body_reported_alert') {
        setMeetingCaller(data.caller);
        setReportedBody(data.target);
        setCorpseId(null);
        setHasVoted(false);
        setHasAcknowledged(false);
        setMeetingAcks(0);
        setMeetingTotal(data.total_alive); 
        if (userAlias !== 'ORGANIZER') setView('emergency_alert');
        
        try {
          const alarm = document.getElementById("emergency-alarm");
          if (alarm) {
            alarm.currentTime = 0;
            alarm.play();
          }
        } catch (e) { console.log("Audio autoplay blocked by browser"); }
      }
      else if (data.event === 'return_to_lobby') {
        setRole(null);
        setTasks([]);
        setGameOverData(null);
        setVoteOutcome({ eliminated: '', tally: {} });
        setHasVoted(false);
        setIsAlive(true);
        setReportedBody('');
        setMeetingCaller('');
        setCorpseId(null);
        setTaskProgress(0); 
        setGameLogs([]);
        
        if (userAlias === 'ORGANIZER') {
          setView('host_dashboard');
        } else if (userAlias.startsWith('AUX_')) {
          setView('aux_lobby');
        } else {
          setView('player'); 
        }
      }
      else if (data.event === 'kicked') {
        alert("You have been removed from the session by the host.");
        leaveGame();
      }
      else if (data.event === 'kill_confirmed') {
        setDisplayCooldown(data.cooldown);
      }
      else if (data.event === 'game_ended') {
        leaveGame();
      }
      else if (data.event === 'you_died') {
        setIsAlive(false);
        setCorpseId(data.corpse_id);
      } 
      else if (data.event === 'kill_rejected') {
        alert("STOP CHEATING!");
        
      } 
      else if (data.event === 'kill_confirmed') {
        setDisplayCooldown(data.cooldown);
      }
      if (data.event === 'organizer_sync') {
        setOrganizerState({ phase: data.phase, players: data.players });
      }
    };
    
    ws.current.onclose = () => setIsConnected(false);
  };

  const logoutHost = () => {
    setHostId(null);
    setHostUsername('');
    localStorage.removeItem('hostId');
    localStorage.removeItem('hostUsername');
    setView('home');
  };

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
        setConfigTasksHard(tmpl.task_count_hard || 1);
        setConfigTasksMedium(tmpl.task_count_medium || 2);
        setConfigTasksEasy(tmpl.task_count_easy || 3);
      }
      const taskRes = await fetch(`${import.meta.env.VITE_API_URL}/tasks/${hostId}`);
      if (taskRes.ok) {
        setDictionaryTasks(await taskRes.json());
      }
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    }
  };

  useEffect(() => {
    if (view === 'host_dashboard' && hostId) {
      fetchDashboardData();
    }
  }, [view, hostId]);

  const saveTemplateSettings = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/template/${hostId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imposter_count: configImposters,
        cooldown_sec: configCooldown,
        discussion_time_sec: configDiscussionTime,
        voting_time_sec: configVotingTime,
        task_count_hard: configTasksHard,
        task_count_medium: configTasksMedium,
        task_count_easy: configTasksEasy
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

  const saveTask = async () => {
    if (!newTaskName || !newTaskLocation || !newTaskDescription || !hostId) return;
    
    if (editingTaskId) {
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
      setDictionaryTasks(dictionaryTasks.map(t => t.id === editingTaskId ? updatedTask : t));
    } else {
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
          voting_time_sec: configVotingTime,
          task_count_hard: configTasksHard,
          task_count_medium: configTasksMedium,
          task_count_easy: configTasksEasy
        })
      });
      const data = await response.json();
      const newCode = data.room_code;
      setRoomCode(newCode);
      setAlias('ORGANIZER');
      connectWebSocket(newCode, 'ORGANIZER', 'host_dashboard');
    } catch (error) {
      console.error("Failed to host game:", error);
    }
  };

  const startGame = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/start/${roomCode}`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        host_id: hostId,
        imposter_count: configImposters, 
        cooldown_sec: configCooldown,
        discussion_time_sec: configDiscussionTime,
        voting_time_sec: configVotingTime,
        task_count_hard: configTasksHard,
        task_count_medium: configTasksMedium,
        task_count_easy: configTasksEasy
      })
    });
  };

  const joinRoom = (forcedAlias = alias, targetView = 'player') => {
    if (!roomCode || !forcedAlias) return;
    setAlias(forcedAlias);
    localStorage.setItem('roomCode', roomCode.toUpperCase());
    localStorage.setItem('alias', forcedAlias);
    connectWebSocket(roomCode.toUpperCase(), forcedAlias, targetView);
  };

  const callEmergency = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isAlive) {
      ws.current.send(JSON.stringify({ action: 'trigger_emergency' }));
    }
  };

  const acknowledgeMeeting = () => {
    setHasAcknowledged(true);
    const alarm = document.getElementById("emergency-alarm");
    if (alarm) alarm.pause(); 
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'acknowledge_meeting' }));
    }
  };

  const forceDiscussion = () => {
  if (ws.current && ws.current.readyState === WebSocket.OPEN) {
    ws.current.send(JSON.stringify({ action: 'force_discussion' }));
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
    e.stopPropagation(); 
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, is_completed: true } : t
    ));
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'complete_task', task_id: taskId }));
    }
  };

  const reportNeutralized = (killerAlias) => {
    ws.current.send(JSON.stringify({
      action: "report_kill",
      victim: alias,
      killer: killerAlias
    }));
  };

  const reportBody = (code) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && isAlive) {
      ws.current.send(JSON.stringify({ action: 'report_body', corpse_id: code }));
    }
  };

  const resumeMission = () => {
    if (gameOverData) {
      setView('game_over');
      return;
    }
    setHasVoted(false);
    setVoteOutcome({ eliminated: '', tally: {} });
    setReportedBody('');
    
    if (alias === 'ORGANIZER') setView('organizer_dashboard');
    else if (alias.startsWith('AUX_')) setView('aux_dashboard');
    else setView('player');
  };

  const leaveGame = () => {
    localStorage.clear();
    window.location.reload();
  };

  const playAgain = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'play_again' }));
    }
  };

  const kickPlayer = (targetAlias) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'kick_player', target: targetAlias }));
    }
  };

  const endGameHost = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action: 'end_game' }));
    }
  };

  const filteredLogs = gameLogs?.filter(log => 
    logFilter === 'ALL' || log.involved.includes(logFilter)
  ) || [];

  return (
    <div className="app-container">
      <h1 className="app-title">JUDAS</h1>
      
      {view === 'home' && (
        <Home 
          roomCode={roomCode} setRoomCode={setRoomCode} 
          alias={alias} setAlias={setAlias} 
          joinRoom={joinRoom} setView={setView} hostId={hostId} 
        />
      )}

      {view === 'aux_setup' && (
        <AuxiliaryJoin 
          roomCode={roomCode} setRoomCode={setRoomCode} 
          joinRoom={joinRoom} setView={setView} 
        />
      )}

      {view === 'aux_lobby' && (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h3 style={{ color: '#aaa', letterSpacing: '2px' }}>SYSTEM CONNECTED. AWAITING MISSION START...</h3>
        </div>
      )}

      {view === 'aux_dashboard' && (
        <AuxiliaryDashboard callEmergency={callEmergency} displayCooldown={displayEmergencyCooldown} />
      )}

      {view === 'host_auth' && (
        <HostAuth 
          setHostId={setHostId} setHostUsername={setHostUsername} setView={setView} 
        />
      )}

      {view === 'host_dashboard' && (
        <HostDashboard 
          hostUsername={hostUsername} logoutHost={logoutHost}
          configImposters={configImposters} setConfigImposters={setConfigImposters}
          configCooldown={configCooldown} setConfigCooldown={setConfigCooldown}
          configDiscussionTime={configDiscussionTime} setConfigDiscussionTime={setConfigDiscussionTime}
          configVotingTime={configVotingTime} setConfigVotingTime={setConfigVotingTime}
          saveTemplateSettings={saveTemplateSettings}
          dictionaryTasks={dictionaryTasks} editingTaskId={editingTaskId}
          startEditTask={startEditTask} deleteTask={deleteTask}
          newTaskName={newTaskName} setNewTaskName={setNewTaskName}
          newTaskLocation={newTaskLocation} setNewTaskLocation={setNewTaskLocation}
          newTaskDescription={newTaskDescription} setNewTaskDescription={setNewTaskDescription}
          newTaskDifficulty={newTaskDifficulty} setNewTaskDifficulty={setNewTaskDifficulty}
          saveTask={saveTask} cancelEdit={cancelEdit}
          handleHostGame={handleHostGame} setView={setView}
          roomCode={roomCode} playerList={playerList} startGame={startGame}
          kickPlayer={kickPlayer} gameLogs={gameLogs}
          configTasksHard={configTasksHard} setConfigTasksHard={setConfigTasksHard}
          configTasksMedium={configTasksMedium} setConfigTasksMedium={setConfigTasksMedium}
          configTasksEasy={configTasksEasy} setConfigTasksEasy={setConfigTasksEasy}
        />
      )}

      {/* These views are small enough to safely leave inline, keeping component overhead low */}
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
        <OrganizerDashboard 
          roomCode={roomCode}
          organizerState={organizerState}
          taskProgress={taskProgress}
          logFilter={logFilter}
          setLogFilter={setLogFilter}
          filteredLogs={filteredLogs}
          startVoting={startVoting}
          forceDiscussion={forceDiscussion}
        />
      )}

      {view === 'player' && isConnected && (
        <PlayerDashboard 
          role={role} showRoleReveal={showRoleReveal} setShowRoleReveal={setShowRoleReveal}
          teammates={teammates} isAlive={isAlive} peekRole={peekRole} setPeekRole={setPeekRole}
          tasks={tasks} markTaskComplete={markTaskComplete}
          callEmergency={callEmergency} displayCooldown={displayCooldown} 
          reportNeutralized={reportNeutralized} leaveGame={leaveGame}
          reportBody={reportBody} corpseId={corpseId}
          alias={alias} roomCode={roomCode} taskProgress={taskProgress}
          playerList={playerList}
        />
      )}

      {view === 'emergency_alert' && (
        <EmergencyAlert 
          meetingCaller={meetingCaller} alias={alias} isAlive={isAlive}
          hasAcknowledged={hasAcknowledged} acknowledgeMeeting={acknowledgeMeeting}
          meetingAcks={meetingAcks} meetingTotal={meetingTotal}
          reportedBody={reportedBody}
        />
      )}

      {view === 'discussion' && (
        <DiscussionPhase 
          displayMeetingTime={displayMeetingTime} 
          alivePlayers={eligibleTargets}
          playerList={playerList}
          alias={alias} meetingCaller={meetingCaller} startVoting={startVoting}
        />
      )}
      
      {view === 'voting' && isConnected && (
        <VotingPhase 
          meetingCaller={meetingCaller} displayMeetingTime={displayMeetingTime}
          alias={alias} hasVoted={hasVoted} isAlive={isAlive}
          eligibleTargets={eligibleTargets} castVote={castVote}
        />
      )}

      {view === 'voting_results' && (
        <VotingResults 
          voteOutcome={voteOutcome} resumeMission={resumeMission} gameOverData={gameOverData}
        />
      )}

      {view === 'game_over' && gameOverData && (
        <GameOver gameOverData={gameOverData} leaveGame={leaveGame} alias={alias} playAgain={playAgain} endGameHost={endGameHost} gameLogs={gameLogs} />
      )}

      <audio id="emergency-alarm" src="https://assets.mixkit.co/active_storage/sfx/995/995-preview.mp3" loop />
    </div>
  );
}

export default App;