import './TaskModal.css';

export default function TaskModal({ selectedTask, setSelectedTask }) {
  if (!selectedTask) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
         <h2 className="modal-title">{selectedTask.task_name}</h2>
         <h4 className="modal-location">📍 {selectedTask.location}</h4>
         <ul className="modal-desc-list">
            <li>{selectedTask.description}</li>
         </ul>
         <button onClick={() => setSelectedTask(null)} className="btn modal-close-btn">
           CLOSE DIRECTIVE
         </button>
      </div>
    </div>
  );
}