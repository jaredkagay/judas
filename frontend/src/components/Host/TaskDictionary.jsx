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
  );
}