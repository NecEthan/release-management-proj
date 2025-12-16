import { useState } from 'react';
import './Hotfixes.css';
import PageHeader from '../components/page-header';
import { API } from '../services/api';

export default function Hotfixes() {
  const [selectedHotfix, setSelectedHotfix] = useState<any>(null)

  const hotfixes = [
    {
      id: 1,
      version: 'v2.4.1-hotfix.3',
      status: 'Deployed',
      priority: 'Critical',
      deployedDate: '2025-12-10 15:30',
      deployedBy: 'John Smith',
      affectedEnvironments: ['Production'],
      description: 'Emergency fix for payment gateway timeout',
      jiraTicket: 'PROJ-567',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-567',
      pullRequests: [
        { id: 'PR-234', title: 'fix: increase payment gateway timeout', author: 'John Smith', url: 'https://github.com/your-org/repo/pull/234' },
      ],
    },
    {
      id: 2,
      version: 'v2.4.1-hotfix.2',
      status: 'In Progress',
      priority: 'High',
      deployedDate: null,
      deployedBy: null,
      affectedEnvironments: ['Testing'],
      description: 'Fix for user authentication loop',
      jiraTicket: 'PROJ-543',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-543',
      pullRequests: [
        { id: 'PR-235', title: 'fix: OAuth redirect loop', author: 'Jane Doe', url: 'https://github.com/your-org/repo/pull/235' },
      ],
    },
    {
      id: 3,
      version: 'v2.4.1-hotfix.1',
      status: 'Deployed',
      priority: 'Medium',
      deployedDate: '2025-12-08 09:45',
      deployedBy: 'Alice Johnson',
      affectedEnvironments: ['Production', 'Pre-Production'],
      description: 'Patch for data export formatting issue',
      jiraTicket: 'PROJ-521',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-521',
      pullRequests: [
        { id: 'PR-228', title: 'fix: CSV export date formatting', author: 'Alice Johnson', url: 'https://github.com/your-org/repo/pull/228' },
      ],
    },
    {
      id: 4,
      version: 'v2.4.0-hotfix.5',
      status: 'Deployed',
      priority: 'Critical',
      deployedDate: '2025-12-05 18:20',
      deployedBy: 'Security Team',
      affectedEnvironments: ['Production'],
      description: 'Critical security vulnerability patch',
      jiraTicket: 'PROJ-498',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-498',
      pullRequests: [
        { id: 'PR-220', title: 'security: patch SQL injection vulnerability', author: 'Security Team', url: 'https://github.com/your-org/repo/pull/220' },
        { id: 'PR-221', title: 'security: add input validation', author: 'Security Team', url: 'https://github.com/your-org/repo/pull/221' },
      ],
    },
    {
      id: 5,
      version: 'v2.4.0-hotfix.4',
      status: 'Deployed',
      priority: 'High',
      deployedDate: '2025-12-03 14:15',
      deployedBy: 'Bob Williams',
      affectedEnvironments: ['Production', 'Pre-Production'],
      description: 'Fix for database connection pooling',
      jiraTicket: 'PROJ-476',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-476',
      pullRequests: [
        { id: 'PR-215', title: 'fix: database connection pool management', author: 'Bob Williams', url: 'https://github.com/your-org/repo/pull/215' },
      ],
    },
    {
      id: 6,
      version: 'v2.3.2-hotfix.2',
      status: 'Planning',
      priority: 'Medium',
      deployedDate: null,
      deployedBy: null,
      affectedEnvironments: ['Stable'],
      description: 'UI rendering issue on mobile devices',
      jiraTicket: 'PROJ-445',
      jiraUrl: 'https://your-company.atlassian.net/browse/PROJ-445',
      pullRequests: [
        { id: 'PR-240', title: 'fix: mobile navigation rendering', author: 'Charlie Brown', url: 'https://github.com/your-org/repo/pull/240' },
      ],
    },
  ];

  return (
    <div className="hotfixes">
      <PageHeader title="Hotfixes"
        description="Monitor and deploy emergency hotfixes"
        onSync={API.getEnvironments}
      />

      <div className="hotfixes-list">
        {hotfixes.map((hotfix) => (
          
          <div key={hotfix.id} className="hotfix-item" 
            onClick={() => setSelectedHotfix(hotfix)}>
            <div className="hotfix-header">
              <span className="hotfix-version">{hotfix.version}</span>
            </div>
            <div className="hotfix-description">{hotfix.description}</div>
            <div className="hotfix-meta">
              <span className="hotfix-jira">{hotfix.jiraTicket}</span>
              {hotfix.deployedDate && (
                <span className="hotfix-date">Deployed: {hotfix.deployedDate}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedHotfix && (
        <div className="dialog-overlay" onClick={() => setSelectedHotfix(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedHotfix.version}</h2>
              <button className="dialog-close" onClick={() => setSelectedHotfix(null)}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <div className="dialog-section">
                <h3>Description</h3>
                <p className="dialog-text">{selectedHotfix.description}</p>
              </div>

              {selectedHotfix.deployedDate && (
                <div className="dialog-section">
                  <h3>Deployment Information</h3>
                  <div className="deployment-info">
                    <div className="info-row">
                      <span className="info-label">Deployed:</span>
                      <span className="info-value">{selectedHotfix.deployedDate}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Deployed By:</span>
                      <span className="info-value">{selectedHotfix.deployedBy}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="dialog-section">
                <h3>Jira Ticket</h3>
                <a href={selectedHotfix.jiraUrl} target="_blank" rel="noopener noreferrer" className="jira-link">
                  {selectedHotfix.jiraTicket}
                </a>
              </div>

              <div className="dialog-section">
                <h3>Pull Requests</h3>
                <div className="pr-list">
                  {selectedHotfix.pullRequests.map((pr: any) => (
                    <a key={pr.id} href={pr.url} target="_blank" rel="noopener noreferrer" className="pr-link">
                      {pr.id}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
      

    
  );
}
