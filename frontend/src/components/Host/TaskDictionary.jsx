// frontend/src/components/Host/TaskDictionary.jsx
import './TaskDictionary.css';

export default function TaskDictionary({
  dictionaryTasks, editingTaskId, 
  startEditTask, deleteTask, 
  newTaskName, setNewTaskName, 
  newTaskLocation, setNewTaskLocation, 
  newTaskDescription, setNewTaskDescription, 
  newTaskDifficulty, setNewTaskDifficulty, 
  saveTask, cancelEdit
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
            <div key={task.id} className={`task-item ${isEditing ? 'task-item-editing' : ''}`}>
              <div>
                <div className={`task-name ${isEditing ? 'editing-text' : ''}`}>{task.task_name}</div>
                <div className="task-location">{task.location}</div>
              </div>
              <div className="task-actions">
                <button onClick={() => startEditTask(task)} className="task-action-btn btn-edit">EDIT</button>
                <button onClick={() => deleteTask(task.id)} className="task-action-btn btn-delete">DELETE</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 24px 0', fontFamily: 'var(--font-mono)', fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '2px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>TASK DICTIONARY</h3>
        
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          {dictionaryTasks.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No tasks in dictionary. Add some below.</p>
          ) : (
            <>
              {renderTaskList('Hard')}
              {renderTaskList('Medium')}
              {renderTaskList('Easy')}
            </>
          )}
        </div>

        <div className="task-form-grid">
          <input type="text" placeholder="Task Name (e.g. Wipe Tables)" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} className="input-base" />
          <input type="text" placeholder="Location (e.g. Cafeteria)" value={newTaskLocation} onChange={e => setNewTaskLocation(e.target.value)} className="input-base" />
          <textarea placeholder="Description / Instructions..." value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} className="input-base task-textarea" />
          
          <div className="task-form-actions">
            <select value={newTaskDifficulty} onChange={e => setNewTaskDifficulty(e.target.value)} className="input-base" style={{flex: 1}}>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <button onClick={saveTask} className="btn-primary" style={{flex: 2, backgroundColor: editingTaskId ? '#f59e0b' : 'var(--glass-bg)', color: editingTaskId ? '#000' : 'var(--text-primary)'}}>
              {editingTaskId ? 'SAVE EDIT' : 'ADD DIRECTIVE'}
            </button>
            {editingTaskId && (
              <button onClick={cancelEdit} className="btn-primary" style={{flex: 1}}>CANCEL</button>
            )}
          </div>
        </div>
    </div>
  );
}