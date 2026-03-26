// frontend/src/components/Host/OrganizerDashboard.jsx
import React from 'react';
import './OrganizerDashboard.css';

export default function OrganizerDashboard({
  roomCode, organizerState, taskProgress, logFilter,
  setLogFilter, filteredLogs, startVoting, forceDiscussion
}) {
  return (
    <div className="command-center-wrapper" style={{ maxWidth: '1200px' }}>
      
      <div className="command-header glass-panel text-center" style={{ flexDirection: 'column', gap: '8px' }}>
        <h2 className="overseer-title">OVERSEER HUB</h2>
        <h1 className="overseer-code">{roomCode}</h1>
      </div>
      
      <div className="glass-panel phase-bar">
         <h3 className="phase-text">CURRENT PHASE: {organizerState.phase.toUpperCase()}</h3>
         
         <div style={{display: 'flex', gap: '12px'}}>
           {organizerState.phase === 'Emergency Alert' && (
             <button onClick={forceDiscussion} className="btn-primary" style={{ fontSize: '0.8rem' }}>SKIP TO DISCUSSION</button>
           )}
           {organizerState.phase === 'Discussion' && (
             <button onClick={startVoting} className="btn-primary" style={{ fontSize: '0.8rem' }}>FORCE VOTING</button>
           )}
         </div>
      </div>

      <div className="overseer-grid">
        
        {/* Terminal Logs */}
        <div className="glass-panel">
          <div className="logs-header">
            <h3 className="logs-title">SYSTEM LOGS</h3>
            <select value={logFilter} onChange={(e) => setLogFilter(e.target.value)} className="input-base" style={{ padding: '4px 8px', height: 'auto' }}>
              <option value="ALL">All Events</option>
              <option value="SYSTEM">System Events</option>
              {organizerState.players.map(p => (
                <option key={p.alias} value={p.alias}>{p.alias}</option>
              ))}
            </select>
          </div>
          <div className="logs-window">
            {filteredLogs.length === 0 ? (
              <div style={{ textAlign: 'center', marginTop: '50px', opacity: 0.5 }}>[Awaiting telemetry data...]</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Master Roster */}
        <div className="glass-panel">
          <h3 className="master-roster-title">MASTER ROSTER</h3>
          <div className="master-roster-grid">
            {organizerState.players.map((p, idx) => (
              <div key={idx} className={`roster-card ${p.is_alive ? 'roster-card-alive' : 'roster-card-dead'} ${p.role === 'Imposter' ? 'border-imposter' : p.role ? 'border-crewmate' : ''}`}>
                <div>
                  <div className={`roster-alias ${p.is_alive ? 'alive' : 'dead'}`}>{p.alias}</div>
                  <div className={`roster-role ${p.role === 'Imposter' ? 'role-imposter-text' : 'role-crewmate-text'}`}>
                    {p.role ? p.role.toUpperCase() : 'AWAITING ASSIGNMENT'}
                  </div>
                </div>
                {!p.is_alive && <div className="status-neutralized">NEUTRALIZED</div>}
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </div>
  );
}