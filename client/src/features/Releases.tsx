import { useState } from 'react'
import './Releases.css'

export default function Releases() {
  const [selectedRelease, setSelectedRelease] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'jira' | 'prs'>('jira')

  const releases = [
    {
      id: 1,
      version: 'v2.5.0',
      date: '2025-12-20',
      description: 'New user dashboard and analytics',
      jiraTickets: [
        { id: 'PROJ-123', title: 'Add user dashboard', status: 'Done' },
        { id: 'PROJ-124', title: 'Implement analytics API', status: 'Done' },
        { id: 'PROJ-125', title: 'Create chart components', status: 'In Review' },
        { id: 'PROJ-126', title: 'Add data visualization library', status: 'Done' },
        { id: 'PROJ-127', title: 'Implement real-time metrics', status: 'Done' },
        { id: 'PROJ-128', title: 'Create admin dashboard view', status: 'Done' },
        { id: 'PROJ-129', title: 'Add export functionality', status: 'In Review' },
        { id: 'PROJ-130', title: 'Implement filtering system', status: 'Done' },
        { id: 'PROJ-131', title: 'Add date range selector', status: 'Done' },
        { id: 'PROJ-132', title: 'Create custom report builder', status: 'In Review' },
        { id: 'PROJ-133', title: 'Add performance monitoring', status: 'Done' },
        { id: 'PROJ-134', title: 'Implement caching layer', status: 'Done' },
        { id: 'PROJ-135', title: 'Add user preferences storage', status: 'Done' },
        { id: 'PROJ-136', title: 'Create dashboard templates', status: 'In Review' },
        { id: 'PROJ-137', title: 'Add comparison views', status: 'Done' },
        { id: 'PROJ-138', title: 'Implement drill-down functionality', status: 'Done' },
        { id: 'PROJ-139', title: 'Add scheduled reports', status: 'In Review' },
        { id: 'PROJ-140', title: 'Create mobile responsive views', status: 'Done' },
        { id: 'PROJ-141', title: 'Add accessibility features', status: 'Done' },
        { id: 'PROJ-142', title: 'Implement dark mode support', status: 'Done' },
      ],
      pullRequests: [
        { id: 'PR-45', title: 'feat: user dashboard UI', author: 'John Doe', url: '#' },
        { id: 'PR-46', title: 'feat: analytics backend', author: 'Jane Smith', url: '#' },
        { id: 'PR-47', title: 'feat: chart library integration', author: 'Bob Johnson', url: '#' },
        { id: 'PR-48', title: 'feat: data visualization components', author: 'Alice Brown', url: '#' },
        { id: 'PR-49', title: 'feat: real-time metrics websocket', author: 'Charlie White', url: '#' },
        { id: 'PR-50', title: 'feat: admin dashboard layout', author: 'David Lee', url: '#' },
        { id: 'PR-51', title: 'feat: CSV/PDF export functionality', author: 'Emma Wilson', url: '#' },
        { id: 'PR-52', title: 'feat: advanced filtering system', author: 'Frank Miller', url: '#' },
        { id: 'PR-53', title: 'feat: date range picker component', author: 'Grace Taylor', url: '#' },
        { id: 'PR-54', title: 'feat: custom report builder UI', author: 'Henry Davis', url: '#' },
        { id: 'PR-55', title: 'feat: performance monitoring integration', author: 'Ivy Chen', url: '#' },
        { id: 'PR-56', title: 'perf: Redis caching implementation', author: 'Jack Thompson', url: '#' },
        { id: 'PR-57', title: 'feat: user preferences API', author: 'Kelly Martinez', url: '#' },
        { id: 'PR-58', title: 'feat: dashboard template system', author: 'Liam Anderson', url: '#' },
        { id: 'PR-59', title: 'feat: comparison view components', author: 'Mia Garcia', url: '#' },
        { id: 'PR-60', title: 'feat: drill-down navigation', author: 'Noah Robinson', url: '#' },
        { id: 'PR-61', title: 'feat: scheduled reports scheduler', author: 'Olivia Clark', url: '#' },
        { id: 'PR-62', title: 'style: mobile responsive breakpoints', author: 'Paul Wright', url: '#' },
        { id: 'PR-63', title: 'a11y: WCAG 2.1 compliance updates', author: 'Quinn Harris', url: '#' },
        { id: 'PR-64', title: 'feat: dark mode theme support', author: 'Ryan Walker', url: '#' },
      ],
    },
    {
      id: 2,
      version: 'v2.4.2',
      date: '2025-12-15',
      description: 'Bug fixes and performance improvements',
      jiraTickets: [
        { id: 'PROJ-120', title: 'Fix memory leak in reports', status: 'Done' },
        { id: 'PROJ-121', title: 'Optimize database queries', status: 'Done' },
      ],
      pullRequests: [
        { id: 'PR-43', title: 'fix: memory leak in reports module', author: 'Alice Brown', url: '#' },
        { id: 'PR-44', title: 'perf: database query optimization', author: 'Charlie White', url: '#' },
      ],
    },
    {
      id: 3,
      version: 'v2.4.1',
      date: '2025-12-01',
      description: 'Security patches and UI updates',
      jiraTickets: [
        { id: 'PROJ-115', title: 'Security vulnerability patch', status: 'Done' },
        { id: 'PROJ-116', title: 'Update navigation UI', status: 'Done' },
        { id: 'PROJ-117', title: 'Fix login redirect issue', status: 'Done' },
      ],
      pullRequests: [
        { id: 'PR-40', title: 'security: patch CVE-2024-1234', author: 'Security Team', url: '#' },
        { id: 'PR-41', title: 'ui: update navigation bar', author: 'Design Team', url: '#' },
        { id: 'PR-42', title: 'fix: login redirect logic', author: 'John Doe', url: '#' },
      ],
    },
    {
      id: 4,
      version: 'v2.4.0',
      date: '2025-11-15',
      description: 'Major feature release',
      jiraTickets: [
        { id: 'PROJ-100', title: 'New reporting module', status: 'Done' },
        { id: 'PROJ-101', title: 'User permissions overhaul', status: 'Done' },
      ],
      pullRequests: [
        { id: 'PR-35', title: 'feat: reporting module', author: 'Jane Smith', url: '#' },
        { id: 'PR-36', title: 'feat: permissions system v2', author: 'Bob Johnson', url: '#' },
      ],
    },
  ]

  return (
    <div className="releases">
      <h1>Releases</h1>
      <p>Track and manage all releases</p>

      <div className="releases-list">
        {releases.map((release) => (
          <div
            key={release.id}
            className="release-item"
            onClick={() => setSelectedRelease(release)}
          >
            <div className="release-header">
              <span className="release-version">{release.version}</span>
              <span className="release-date">{release.date}</span>
            </div>
            <div className="release-description">{release.description}</div>
            <div className="release-stats">
              <span>{release.jiraTickets.length} Jira Tickets</span>
              <span>{release.pullRequests.length} Pull Requests</span>
            </div>
          </div>
        ))}
      </div>

      {selectedRelease && (
        <div className="dialog-overlay" onClick={() => setSelectedRelease(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedRelease.version}</h2>
              <button className="dialog-close" onClick={() => setSelectedRelease(null)}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <div className="dialog-section">
                <p className="dialog-description">{selectedRelease.description}</p>
                <p className="dialog-date">Release Date: {selectedRelease.date}</p>
              </div>

              <div className="dialog-tabs">
                <button
                  className={`dialog-tab ${activeTab === 'jira' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jira')}
                >
                  Jira Tickets ({selectedRelease.jiraTickets.length})
                </button>
                <button
                  className={`dialog-tab ${activeTab === 'prs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prs')}
                >
                  Pull Requests ({selectedRelease.pullRequests.length})
                </button>
              </div>

              {activeTab === 'jira' && (
                <div className="dialog-section">
                  <div className="dialog-section-scrollable">
                    <div className="tickets-list">
                      {selectedRelease.jiraTickets.map((ticket: any) => (
                        <div key={ticket.id} className="ticket-item">
                          <span className="ticket-id">{ticket.id}</span>
                          <span className="ticket-title">{ticket.title}</span>
                          <span className={`ticket-status status-${ticket.status.toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prs' && (
                <div className="dialog-section">
                  <div className="dialog-section-scrollable">
                    <div className="prs-list">
                      {selectedRelease.pullRequests.map((pr: any) => (
                        <div key={pr.id} className="pr-item">
                          <span className="pr-id">{pr.id}</span>
                          <span className="pr-title">{pr.title}</span>
                          <span className="pr-author">by {pr.author}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
