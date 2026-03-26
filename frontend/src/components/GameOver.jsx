import { useState } from 'react';
import './GameOver.css';

export default function GameOver({ gameOverData, leaveGame, alias, playAgain, endGameHost, gameLogs }) {
  const [logFilter, setLogFilter] = useState('ALL');

  const filteredLogs = gameLogs?.filter(log => 
    logFilter === 'ALL' || log?.involved?.includes(logFilter)
  ) || [];

  const uniquePlayers = Array.from(new Set(
    gameLogs?.flatMap(log => log.involved).filter(p => p !== 'SYSTEM' && p !== 'ORGANIZER')
  )) || [];

  const isAux = alias?.startsWith('AUX_');

  if (!gameOverData) return null;

  const isCrewWin = gameOverData.winner === 'Crewmates';
  const winColorClass = isCrewWin ? 'text-crewmate' : 'text-imposter';

  if (isAux) {
    return (
      <div className="game-over-wrapper center-content">
        <h2 className="game-over-subtitle">MISSION TERMINATED</h2>
        <h1 className={`game-over-title ${winColorClass}`}>
          {gameOverData.winner.toUpperCase()} WIN
        </h1>
        <p className="game-over-reason">
          {gameOverData.reason}
        </p>
      </div>
    );
  }

  return (
    <div className="game-over-wrapper">
      <div className="text-center" style={{ marginBottom: '40px' }}>
        <h2 className="game-over-subtitle">MISSION TERMINATED</h2>
        <h1 className={`game-over-title ${winColorClass}`}>
          {gameOverData.winner.toUpperCase()} WIN
        </h1>
        <p className="game-over-reason">
          {gameOverData.reason}
        </p>
      </div>

      {alias === 'ORGANIZER' && (
        <div className="glass-panel" style={{ width: '100%', maxWidth: '800px', marginBottom: '40px' }}>
          <div className="logs-header">
            <h3 className="logs-title" style={{ color: 'var(--text-primary)' }}>POST-MISSION RECAP</h3>
            <select 
              value={logFilter} 
              onChange={(e) => setLogFilter(e.target.value)} 
              className="input-base"
              style={{ padding: '6px 12px', height: 'auto' }}
            >
              <option value="ALL">All Events</option>
              <option value="SYSTEM">System Events</option>
              {uniquePlayers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="logs-window" style={{ height: '350px' }}>
            {filteredLogs.length === 0 ? (
              <div className="empty-logs">No log data recovered...</div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="log-entry">
                  <span className="log-time">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="game-over-actions">
        {alias === 'ORGANIZER' ? (
          <>
            <button onClick={playAgain} className="btn-primary" style={{ borderColor: '#10b981', color: '#10b981' }}>
              INITIALIZE NEW MISSION
            </button>
            <button onClick={endGameHost} className="btn-primary" style={{ borderColor: 'var(--accent-red)', color: 'var(--accent-red)' }}>
              SHUTDOWN SYSTEM
            </button>
          </>
        ) : (
          <button onClick={leaveGame} className="btn-primary" style={{ width: '100%' }}>
            DISCONNECT
          </button>
        )}
      </div>
    </div>
  );
}