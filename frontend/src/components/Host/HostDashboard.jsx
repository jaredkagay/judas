// frontend/src/components/Host/HostDashboard.jsx
import React from 'react';
import './HostDashboard.css';
import GameSettingsPanel from './GameSettingsPanel';
import TaskDictionary from './TaskDictionary';
import LobbyManager from './LobbyManager';

export default function HostDashboard(props) {
  const {
    hostUsername, logoutHost, setView, roomCode, 
    configImposters, setConfigImposters, 
    configCooldown, setConfigCooldown, 
    configDiscussionTime, setConfigDiscussionTime, 
    configVotingTime, setConfigVotingTime, 
    saveTemplateSettings, handleHostGame, playerList, startGame, kickPlayer,
    dictionaryTasks, editingTaskId, startEditTask, deleteTask, 
    newTaskName, setNewTaskName, newTaskLocation, setNewTaskLocation, 
    newTaskDescription, setNewTaskDescription, newTaskDifficulty, 
    setNewTaskDifficulty, saveTask, cancelEdit,
    configTasksHard, setConfigTasksHard,
    configTasksMedium, setConfigTasksMedium,
    configTasksEasy, setConfigTasksEasy,
  } = props;

  return (
    <div className="command-center-wrapper">
      <div className="command-header glass-panel">
          <div className="command-title">
            <span className="live-dot"></span>
            {hostUsername}'S COMMAND CENTER
          </div>
          <div style={{display: 'flex', gap: '16px'}}>
            {!roomCode && <button onClick={() => setView('home')} className="btn-primary" style={{padding: '8px 16px', fontSize: '0.8rem'}}>MAIN MENU</button>}
            <button onClick={logoutHost} className="btn-primary" style={{borderColor: 'var(--accent-red)', color: 'var(--accent-red)', padding: '8px 16px', fontSize: '0.8rem'}}>LOG OUT</button>
          </div>
      </div>

      <div className="command-grid">
        {/* Left Sidebar: Ops & Settings */}
        <div className="command-sidebar">
          <LobbyManager 
              roomCode={roomCode} handleHostGame={handleHostGame} 
              startGame={startGame} playerList={playerList} kickPlayer={kickPlayer} 
          />
          <GameSettingsPanel 
            configImposters={configImposters} setConfigImposters={setConfigImposters}
            configCooldown={configCooldown} setConfigCooldown={setConfigCooldown}
            configDiscussionTime={configDiscussionTime} setConfigDiscussionTime={setConfigDiscussionTime}
            configVotingTime={configVotingTime} setConfigVotingTime={setConfigVotingTime}
            
            configTasksHard={configTasksHard} setConfigTasksHard={setConfigTasksHard}
            configTasksMedium={configTasksMedium} setConfigTasksMedium={setConfigTasksMedium}
            configTasksEasy={configTasksEasy} setConfigTasksEasy={setConfigTasksEasy}
            
            saveTemplateSettings={saveTemplateSettings}
          />
        </div>

        {/* Right Main Area: Task Dictionary */}
        <div className="command-main">
          <TaskDictionary 
              dictionaryTasks={dictionaryTasks} editingTaskId={editingTaskId}
              startEditTask={startEditTask} deleteTask={deleteTask}
              newTaskName={newTaskName} setNewTaskName={setNewTaskName}
              newTaskLocation={newTaskLocation} setNewTaskLocation={setNewTaskLocation}
              newTaskDescription={newTaskDescription} setNewTaskDescription={setNewTaskDescription}
              newTaskDifficulty={newTaskDifficulty} setNewTaskDifficulty={setNewTaskDifficulty}
              saveTask={saveTask} cancelEdit={cancelEdit}
          />
        </div>
      </div>
    </div>
  );
}