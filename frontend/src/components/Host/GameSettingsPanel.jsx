import './GameSettingsPanel.css';

export default function GameSettingsPanel({
  configImposters, setConfigImposters,
  configCooldown, setConfigCooldown,
  configDiscussionTime, setConfigDiscussionTime,
  configVotingTime, setConfigVotingTime,
  saveTemplateSettings
}) {
  return (
    <div className="glass-panel">
      <h3 className="settings-header">MISSION PARAMETERS</h3>
      
      <div className="settings-row">
        <span>IMPOSTER COUNT</span>
        <input 
          type="number" 
          value={configImposters} 
          onChange={(e) => setConfigImposters(parseInt(e.target.value))} 
          min={1} max={3} 
          className="input-base settings-number-input" 
        />
      </div>
      
      <div className="settings-row">
        <span>COOLDOWN (SEC)</span>
        <input 
          type="number" 
          value={configCooldown} 
          onChange={(e) => setConfigCooldown(parseInt(e.target.value))} 
          min={10} max={60} 
          className="input-base settings-number-input" 
        />
      </div>
      
      <div className="settings-row">
        <span>DISCUSSION TIME (SEC)</span>
        <input 
          type="number" 
          value={configDiscussionTime} 
          onChange={(e) => setConfigDiscussionTime(parseInt(e.target.value))} 
          min={10} max={300} 
          className="input-base settings-number-input" 
        />
      </div>
      
      <div className="settings-row">
        <span>VOTING TIME (SEC)</span>
        <input 
          type="number" 
          value={configVotingTime} 
          onChange={(e) => setConfigVotingTime(parseInt(e.target.value))} 
          min={10} max={300} 
          className="input-base settings-number-input" 
        />
      </div>
      
      <button onClick={saveTemplateSettings} className="btn-primary settings-save-btn">
        SAVE AS DEFAULT
      </button>
    </div>
  );
}