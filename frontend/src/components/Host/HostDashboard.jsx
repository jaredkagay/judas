import React from 'react';
import './HostDashboard.css';
import GameSettingsPanel from './GameSettingsPanel';
import TaskDictionary from './TaskDictionary';
import LobbyManager from './LobbyManager';

export default function HostDashboard(props) {
  // Destructuring props to pass them cleanly to child components
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
    setNewTaskDifficulty, saveTask, cancelEdit
  } = props;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
          <h2 className="dashboard-title">{hostUsername}'S DASHBOARD</h2>
          <button onClick={logoutHost} className="logout-btn">LOG OUT</button>
      </div>

      <div className="host-top-section">
        <LobbyManager 
            roomCode={roomCode} 
            handleHostGame={handleHostGame} 
            startGame={startGame} 
            playerList={playerList} 
            kickPlayer={kickPlayer} 
        />
      </div>

      <div className="host-bottom-section">
        <GameSettingsPanel 
            configImposters={configImposters} setConfigImposters={setConfigImposters}
            configCooldown={configCooldown} setConfigCooldown={setConfigCooldown}
            configDiscussionTime={configDiscussionTime} setConfigDiscussionTime={setConfigDiscussionTime}
            configVotingTime={configVotingTime} setConfigVotingTime={setConfigVotingTime}
            saveTemplateSettings={saveTemplateSettings}
        />

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

      {!roomCode && <button onClick={() => setView('home')} className="cancel-btn">BACK TO MAIN MENU</button>}
    </div>
  );
}