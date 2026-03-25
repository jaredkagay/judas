export default function DirectivesView({ tasks, markTaskComplete, setActiveTab }) {
    const incompleteTasks = tasks.filter(t => !t.is_completed);
    const completedTasks = tasks.filter(t => t.is_completed);
  
    return (
      <div className="tasks-container" style={{ width: '100%', marginTop: 0 }}>
        <div className="tasks-scroll-area">
          {incompleteTasks.length === 0 && completedTasks.length > 0 && (
            <div className="all-tasks-done">ALL DIRECTIVES COMPLETED</div>
          )}
          <div className="task-cards-container">
            {incompleteTasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <h4 className="task-card-title">{task.task_name}</h4>
                  <div onClick={(e) => markTaskComplete(task.id, e)} className="checkbox checkbox-empty"></div>
                </div>
                <div className="task-card-meta">
                  <span className={`badge diff-${task.difficulty ? task.difficulty.toLowerCase() : 'default'}`}>{task.difficulty || 'STANDARD'}</span>
                  <span className="badge loc-badge">{task.location || 'UNKNOWN'}</span>
                </div>
                <p className="task-card-desc">{task.description}</p>
              </div>
            ))}
          </div>
          {completedTasks.length > 0 && (
            <div className="completed-tasks-section">
              <h4 className="completed-tasks-title">COMPLETED DIRECTIVES</h4>
              <ul className="task-ul">
                {completedTasks.map(task => (
                  <li key={task.id} className="task-li task-li-completed">
                    <div className="task-li-name task-complete">{task.task_name}</div>
                    <div className="checkbox checkbox-done"><span className="check-mark">✓</span></div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button className="btn" onClick={() => setActiveTab('main')} style={{ width: '100%', marginTop: '20px', backgroundColor: '#444' }}>
          BACK TO DASHBOARD
        </button>
      </div>
    );
  }