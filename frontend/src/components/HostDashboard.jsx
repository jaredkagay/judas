import './HostDashboard.css';

export default function HostDashboard({
  hostUsername, logoutHost, 
  configImposters, setConfigImposters, 
  configCooldown, setConfigCooldown, 
  configDiscussionTime, setConfigDiscussionTime, 
  configVotingTime, setConfigVotingTime, 
  saveTemplateSettings, 
  dictionaryTasks, editingTaskId, 
  startEditTask, deleteTask, 
  newTaskName, setNewTaskName, 
  newTaskLocation, setNewTaskLocation, 
  newTaskDescription, setNewTaskDescription, 
  newTaskDifficulty, setNewTaskDifficulty, 
  saveTask, cancelEdit, 
  handleHostGame, setView,
  roomCode, playerList, startGame
}) {

  const renderTaskList = (difficultyLabel) => {
    const filtered = dictionaryTasks.filter(t => t.difficulty === difficultyLabel);
    if (filtered.length === 0) return null;
    
    const categoryClass = difficultyLabel === 'Hard' ? 'category-hard' : difficultyLabel === 'Medium' ? 'category-medium' : 'category-easy';

    return (
      <div className="task-category">
        <div className={`category-title ${categoryClass}`}>
          {difficultyLabel} DIRECTIVES ({filtered.length})
        </div>
        {filtered.map(task => {
          const isEditing = editingTaskId === task.id;
          return (
            <div key={task.id} className={`task-item ${isEditing ? 'task-item-editing' : 'task-item-default'}`}>
              <div>
                <div className="task-name" style={{ color: isEditing ? '#ffcc00' : 'white' }}>{task.task_name}</div>
                <div className="task-location">{task.location}</div>
              </div>
              <div className="task-actions">
                <button onClick={() => startEditTask(task)} className="edit-btn">EDIT</button>
                <button onClick={() => deleteTask(task.id)} className="delete-btn">X</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
          <h2 className="dashboard-title">{hostUsername}'S DASHBOARD</h2>
          <button onClick={logoutHost} className="logout-btn">LOG OUT</button>
      </div>

      <div className="host-top-section">
        {!roomCode ? (
           <button onClick={handleHostGame} className="btn generate-btn">GENERATE ROOM CODE</button>
        ) : (
           <div className="lobby-info">
             <div className="lobby-room-code-container">
               <h2>MISSION CREATED</h2>
               <h1 className="lobby-room-code">{roomCode}</h1>
               <button onClick={startGame} className="btn lobby-start-btn" style={{ backgroundColor: '#00cc00' }}>START MISSION</button>
             </div>
             <div className="roster-container">
               <h3 style={{ marginTop: 0 }}>ROSTER ({playerList?.length || 0} CONNECTED)</h3>
               <div className="roster-grid">
                 {playerList?.map((player, idx) => (
                   <div key={idx} className="player-chip">{player}</div>
                 ))}
               </div>
             </div>
           </div>
        )}
      </div>

      <div className="host-bottom-section">
        <div className="settings-panel">
          <h3>GAME SETTINGS</h3>
          <div className="settings-row">
            <span>IMPOSTER COUNT</span>
            <input 
              type="number" value={configImposters} onChange={(e) => setConfigImposters(parseInt(e.target.value))} 
              min={1} max={3} className="settings-input" 
            />
          </div>
          <div className="settings-row">
            <span>COOLDOWN (SEC)</span>
            <input 
              type="number" value={configCooldown} onChange={(e) => setConfigCooldown(parseInt(e.target.value))} 
              min={10} max={60} className="settings-input" 
            />
          </div>
          <div className="settings-row">
            <span>DISCUSSION TIME (SEC)</span>
            <input 
              type="number" value={configDiscussionTime} onChange={(e) => setConfigDiscussionTime(parseInt(e.target.value))} 
              min={10} max={300} className="settings-input" 
            />
          </div>
          <div className="settings-row">
            <span>VOTING TIME (SEC)</span>
            <input 
              type="number" value={configVotingTime} onChange={(e) => setConfigVotingTime(parseInt(e.target.value))} 
              min={10} max={300} className="settings-input" 
            />
          </div>
          <button onClick={saveTemplateSettings} className="save-params-btn">SAVE PARAMETERS</button>
        </div>

        <div className="tasks-panel">
          <div className={`dictionary-container ${editingTaskId ? 'dictionary-editing' : 'dictionary-default'}`}>
            <h3 className={`dictionary-title ${editingTaskId ? 'title-editing' : 'title-default'}`} style={{ marginTop: 0, borderBottom: '1px solid #333', paddingBottom: '10px' }}>
              {editingTaskId ? 'EDITING DIRECTIVE...' : 'TASK DICTIONARY'}
            </h3>
            
            <div className="task-list-scroll">
              {dictionaryTasks.length === 0 ? (
                <div className="empty-tasks">No tasks found. Add one below.</div>
              ) : (
                <>
                  {renderTaskList('Hard')}
                  {renderTaskList('Medium')}
                  {renderTaskList('Easy')}
                </>
              )}
            </div>

            <div className="task-form">
              <input type="text" placeholder="Task Name (e.g. Wipe Tables)" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="task-input" />
              <input type="text" placeholder="Location (e.g. Cafeteria)" value={newTaskLocation} onChange={e => setNewTaskLocation(e.target.value)} className="task-input" />
              <textarea placeholder="Description / Instructions..." value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="task-input task-textarea" />
              
              <div className="task-row">
                <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value)} className="task-input task-select">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <button onClick={saveTask} className={`task-save-btn ${editingTaskId ? 'save-edit' : 'save-new'}`}>
                  {editingTaskId ? 'SAVE EDIT' : 'ADD DIRECTIVE'}
                </button>
              </div>
              
              {editingTaskId && (
                <button onClick={cancelEdit} className="cancel-edit-btn">CANCEL EDIT</button>
              )}
            </div>
          </div>
        </div>
      </div>
      {!roomCode && <button onClick={() => setView('home')} className="cancel-btn">BACK TO MAIN MENU</button>}
    </div>
  );
}