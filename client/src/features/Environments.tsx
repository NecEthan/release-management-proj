import './Environments.css'

export default function Environments() {
  const environments = [
    { id: 1, name: 'Production', version: 'v2.4.1', lastDeployed: '2025-12-01 14:30', color: '#4caf50' },
    { id: 2, name: 'Pre-Production', version: 'v2.4.2', lastDeployed: '2025-12-08 09:15', color: '#ff9800' },
    { id: 3, name: 'Testing', version: 'v2.5.0', lastDeployed: '2025-12-10 16:45', color: '#2196f3' },
    { id: 4, name: 'Stable', version: 'v2.4.1', lastDeployed: '2025-11-28 11:00', color: '#9c27b0' },
  ]

  return (
    <div className="environments">
      <h1>Environments</h1>
      <p>Current versions across all environments</p>

      <div className="environments-container">
        {environments.map((env) => (
          <div key={env.id} className="env-card">
            <div className="env-name">{env.name}</div>
            <div className="env-version">{env.version}</div>
            <div className="env-deployed">
              <span className="deployed-label">Last Deployed:</span>
              <span className="deployed-time">{env.lastDeployed}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
