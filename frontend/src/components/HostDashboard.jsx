import { btnStyle } from '../styles';

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
  handleHostGame, setView
}) {

  // Helper function moved from App.jsx directly into this component
  const renderTaskList = (difficultyLabel) => {
    const filtered = dictionaryTasks.filter(t => t.difficulty === difficultyLabel);
    if (filtered.length === 0) return null;
    
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
          type="number" value={configImposters} onChange={(e) => setConfigImposters(parseInt(e.target.value))} 
          min={1} max={3} style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
        <span>COOLDOWN (SEC)</span>
        <input 
          type="number" value={configCooldown} onChange={(e) => setConfigCooldown(parseInt(e.target.value))} 
          min={10} max={60} style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
        <span>DISCUSSION TIME (SEC)</span>
        <input 
          type="number" value={configDiscussionTime} onChange={(e) => setConfigDiscussionTime(parseInt(e.target.value))} 
          min={10} max={300} style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '15px', border: '1px solid #333' }}>
        <span>VOTING TIME (SEC)</span>
        <input 
          type="number" value={configVotingTime} onChange={(e) => setConfigVotingTime(parseInt(e.target.value))} 
          min={10} max={300} style={{ width: '50px', backgroundColor: '#222', color: 'white', border: 'none', padding: '5px', textAlign: 'center' }} 
        />
      </div>
      
      <button onClick={saveTemplateSettings} style={{ padding: '10px', backgroundColor: '#333', color: '#f0f0f0', border: '1px dashed #666', cursor: 'pointer' }}>
        SAVE PARAMETERS
      </button>

      <div style={{ border: editingTaskId ? '2px solid #ffcc00' : '1px solid #33ccff', padding: '15px', backgroundColor: '#050505', marginTop: '10px', transition: 'border 0.3s' }}>
        <h3 style={{ color: editingTaskId ? '#ffcc00' : '#33ccff', margin: '0 0 15px 0', letterSpacing: '1px' }}>
          {editingTaskId ? 'EDITING DIRECTIVE...' : 'TASK DICTIONARY'}
        </h3>
        
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
          
          {editingTaskId && (
            <button onClick={cancelEdit} style={{ padding: '5px', backgroundColor: 'transparent', color: '#aaa', border: 'none', cursor: 'pointer', fontSize: '12px', marginTop: '-5px' }}>
              CANCEL EDIT
            </button>
          )}
        </div>
      </div>

      <button onClick={handleHostGame} style={{...btnStyle, width: '100%', marginTop: '20px'}}>GENERATE ROOM CODE</button>
      <button onClick={() => setView('home')} style={{ padding: '10px', backgroundColor: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}>
        BACK TO MAIN MENU
      </button>
    </div>
  );
}