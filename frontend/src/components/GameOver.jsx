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

  if (isAux) {
    return (
      <div style={{ textAlign: 'center', marginTop: '15vh' }}>
        <h2 style={{ color: '#aaa', letterSpacing: '4px' }}>MISSION TERMINATED</h2>
        <h1 style={{ 
          fontSize: '80px', 
          color: isCrewWin ? '#33ccff' : '#ff3333', 
          margin: '40px 0' 
        }}>
          {gameOverData.winner.toUpperCase()} WIN
        </h1>
        <p style={{ color: '#777', fontSize: '24px', letterSpacing: '2px', marginTop: '20px' }}>
          {gameOverData.reason.toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="gameover-container">
      <h2 className="gameover-header">MISSION TERMINATED</h2>
      
      <div className={`winner-box ${isCrewWin ? 'winner-crewmates' : 'winner-imposters'}`}>
        <h1 className={`winner-text ${isCrewWin ? 'text-crewmates' : 'text-imposters'}`}>
          {gameOverData.winner} WIN
        </h1>
        <h3 className="reason-text">{gameOverData.reason}</h3>
      </div>

      {alias === 'ORGANIZER' && (
        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '40px' }}>
          <button onClick={playAgain} className="btn" style={{ backgroundColor: '#00cc00' }}>
            START NEW GAME
          </button>
          <button onClick={endGameHost} className="btn return-lobby-btn" style={{ margin: 0 }}>
            END GAME
          </button>
        </div>
      )}

      {alias === 'ORGANIZER' && (
        <div className="logs-panel-container" style={{ margin: '30px auto', maxWidth: '600px', textAlign: 'left' }}>
          <div className="logs-header">
            <h3 style={{ margin: 0, color: '#ff3333' }}>POST-MISSION RECAP</h3>
            <select 
              value={logFilter} 
              onChange={(e) => setLogFilter(e.target.value)} 
              className="log-filter"
            >
              <option value="ALL">All Events</option>
              <option value="SYSTEM">System Events</option>
              {uniquePlayers.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="log-list-scroll" style={{ height: '250px' }}>
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

    </div>
  );
}