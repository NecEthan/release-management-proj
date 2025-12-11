import './Hotfixes.css';

export default function Hotfixes() {
  const hotfixes = [
    {
      id: 1,
      version: 'v2.4.1-hotfix.3',
      status: 'Deployed',
      priority: 'Critical',
      deployedDate: '2025-12-10 15:30',
      affectedEnvironments: ['Production'],
      description: 'Emergency fix for payment gateway timeout',
      jiraTicket: 'PROJ-567',
    },
    {
      id: 2,
      version: 'v2.4.1-hotfix.2',
      status: 'In Progress',
      priority: 'High',
      deployedDate: null,
      affectedEnvironments: ['Testing'],
      description: 'Fix for user authentication loop',
      jiraTicket: 'PROJ-543',
    },
    {
      id: 3,
      version: 'v2.4.1-hotfix.1',
      status: 'Deployed',
      priority: 'Medium',
      deployedDate: '2025-12-08 09:45',
      affectedEnvironments: ['Production', 'Pre-Production'],
      description: 'Patch for data export formatting issue',
      jiraTicket: 'PROJ-521',
    },
    {
      id: 4,
      version: 'v2.4.0-hotfix.5',
      status: 'Deployed',
      priority: 'Critical',
      deployedDate: '2025-12-05 18:20',
      affectedEnvironments: ['Production'],
      description: 'Critical security vulnerability patch',
      jiraTicket: 'PROJ-498',
    },
    {
      id: 5,
      version: 'v2.4.0-hotfix.4',
      status: 'Deployed',
      priority: 'High',
      deployedDate: '2025-12-03 14:15',
      affectedEnvironments: ['Production', 'Pre-Production'],
      description: 'Fix for database connection pooling',
      jiraTicket: 'PROJ-476',
    },
    {
      id: 6,
      version: 'v2.3.2-hotfix.2',
      status: 'Planning',
      priority: 'Medium',
      deployedDate: null,
      affectedEnvironments: ['Stable'],
      description: 'UI rendering issue on mobile devices',
      jiraTicket: 'PROJ-445',
    },
  ];

  return (
    <div className="hotfixes">
      <h1>Hotfixes</h1>
      <p>Monitor and deploy emergency hotfixes</p>

      <div className="hotfixes-list">
        {hotfixes.map((hotfix) => (
          <div key={hotfix.id} className="hotfix-item">
            <div className="hotfix-header">
              <span className="hotfix-version">{hotfix.version}</span>
              <span className={`hotfix-priority priority-${hotfix.priority.toLowerCase()}`}>
                {hotfix.priority}
              </span>
            </div>
            <div className="hotfix-description">{hotfix.description}</div>
            <div className="hotfix-meta">
              <span className={`hotfix-status status-${hotfix.status.toLowerCase().replace(' ', '-')}`}>
                {hotfix.status}
              </span>
              <span className="hotfix-jira">{hotfix.jiraTicket}</span>
              {hotfix.deployedDate && (
                <span className="hotfix-date">Deployed: {hotfix.deployedDate}</span>
              )}
            </div>
            <div className="hotfix-environments">
              {hotfix.affectedEnvironments.map((env) => (
                <span key={env} className="env-badge">{env}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
