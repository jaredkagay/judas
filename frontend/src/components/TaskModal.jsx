import { btnStyle } from '../styles';

export default function TaskModal({ selectedTask, setSelectedTask }) {
  if (!selectedTask) return null;

  return (
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
  );
}