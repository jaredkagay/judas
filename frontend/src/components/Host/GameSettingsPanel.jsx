export default function GameSettingsPanel({
  configImposters, setConfigImposters,
  configCooldown, setConfigCooldown,
  configDiscussionTime, setConfigDiscussionTime,
  configVotingTime, setConfigVotingTime,
  saveTemplateSettings
}) {
  return (
    <div className="settings-panel">
      <h3>GAME SETTINGS</h3>
      <div className="settings-row">
        <span>IMPOSTER COUNT</span>
        <input 
          type="number" value={configImposters} onChange={(e) => setConfigImposters(parseInt(e.target.value))} 
          min={1} max={3} className="settings-input" 
        />
      </div>
      <div className="settings-row">
        <span>COOLDOWN (SEC)</span>
        <input 
          type="number" value={configCooldown} onChange={(e) => setConfigCooldown(parseInt(e.target.value))} 
          min={10} max={60} className="settings-input" 
        />
      </div>
      <div className="settings-row">
        <span>DISCUSSION TIME (SEC)</span>
        <input 
          type="number" value={configDiscussionTime} onChange={(e) => setConfigDiscussionTime(parseInt(e.target.value))} 
          min={10} max={300} className="settings-input" 
        />
      </div>
      <div className="settings-row">
        <span>VOTING TIME (SEC)</span>
        <input 
          type="number" value={configVotingTime} onChange={(e) => setConfigVotingTime(parseInt(e.target.value))} 
          min={10} max={300} className="settings-input" 
        />
      </div>
      <button onClick={saveTemplateSettings} className="save-params-btn">SAVE PARAMETERS</button>
    </div>
  );
}