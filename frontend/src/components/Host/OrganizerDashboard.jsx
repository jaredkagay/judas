import React from 'react';

export default function OrganizerDashboard({
  roomCode,
  organizerState,
  taskProgress,
  logFilter,
  setLogFilter,
  filteredLogs,
  startVoting,
  forceDiscussion
}) {
  return (
    <div style={{ textAlign: 'center', marginTop: '30px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ color: '#aaa', letterSpacing: '3px' }}>OVERSEER HUB</h2>
      <h1 style={{ fontSize: '40px', color: '#ff3333', margin: '10px 0' }}>{roomCode}</h1>
      
      <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#222', border: '1px solid #444', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h3 style={{ color: '#ffcc00', margin: 0 }}>CURRENT PHASE: {organizerState.phase.toUpperCase()}</h3>
         
         {/* Phase Skip Controls */}
         {organizerState.phase === 'Emergency Alert' && (
           <button onClick={forceDiscussion} className="btn" style={{ padding: '10px 20px', fontSize: '14px' }}>SKIP TO DISCUSSION</button>
         )}
         {organizerState.phase === 'Discussion' && (
           <button onClick={startVoting} className="btn" style={{ padding: '10px 20px', fontSize: '14px' }}>SKIP TO VOTING</button>
         )}
      </div>

      <div style={{ padding: '20px', border: '1px solid #33ccff', backgroundColor: '#111' }}>
        <h3 style={{ color: '#33ccff', marginBottom: '20px', letterSpacing: '2px' }}>CREW TASK COMPLETION: {taskProgress}%</h3>
        <div style={{ width: '100%', height: '20px', backgroundColor: '#222', border: '1px solid #444', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ width: `${taskProgress}%`, height: '100%', backgroundColor: taskProgress === 100 ? '#00ff00' : '#33ccff', transition: 'width 0.5s ease' }}></div>
        </div>
      </div>

      <div className="logs-panel-container" style={{ marginTop: '40px', textAlign: 'left' }}>
        <div className="logs-header">
          <h3 style={{ margin: 0, color: '#ff3333' }}>LIVE MISSION LOGS</h3>
          <select 
            value={logFilter} 
            onChange={(e) => setLogFilter(e.target.value)} 
            className="log-filter"
          >
            <option value="ALL">All Agents</option>
            {organizerState.players.map(p => (
              <option key={p.alias} value={p.alias}>{p.alias}</option>
            ))}
          </select>
        </div>
        <div className="log-list-scroll">
          {filteredLogs.length === 0 ? (
            <div className="empty-logs">Awaiting live event data...</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="log-entry">
                <span className="log-time">[{log.time}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #333', paddingTop: '20px', marginTop: '40px' }}>
        <h3>MASTER PLAYER ROSTER</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
          {organizerState.players.map((p, idx) => (
            <div key={idx} style={{
              padding: '15px', 
              backgroundColor: p.is_alive ? '#222' : '#441111',
              borderLeft: `5px solid ${p.role === 'Imposter' ? '#ff3333' : '#33ccff'}`,
              textAlign: 'left',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: p.is_alive ? '#fff' : '#888', textDecoration: p.is_alive ? 'none' : 'line-through' }}>{p.alias}</div>
              <div style={{ color: p.role === 'Imposter' ? '#ff3333' : '#33ccff', marginTop: '5px' }}>{p.role || 'Unassigned'}</div>
              <div style={{ fontSize: '12px', color: '#aaa', marginTop: '10px' }}>
                Status: {p.is_alive ? 'ALIVE' : 'DECEASED'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}