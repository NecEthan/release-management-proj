import { useState, useEffect } from 'react';
import './Hotfixes.css';
import PageHeader from '../components/page-header';
import { API } from '../services/api';
import { useProject } from '../contexts/ProjectContext';

export default function Hotfixes() {
  const [selectedHotfix, setSelectedHotfix] = useState<any>(null);
  const [hotfixes, setHotfixes] = useState<any[]>([]);
  const { currentProject } = useProject();

  useEffect(() => {
    fetchHotfixes();
  }, [currentProject]);

  const fetchHotfixes = async () => {
    try {
      const data = await API.getHotfixes(currentProject);
      setHotfixes(data.hotfixes || []);
    } catch (error) {
      console.error('Error fetching hotfixes:', error);
    }
  };

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchHotfixes();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const handleHotfixClick = async (hotfix: any) => {
    try {
      const response = await API.getHotfixDetails(hotfix.id, currentProject);
      setSelectedHotfix(response.hotfix);
    } catch (error) {
      console.error('Error fetching hotfix details:', error);
    }
  };

  return (
    <div className="hotfixes">
      <PageHeader title="Hotfixes"
        description="Monitor and deploy emergency hotfixes"
        onSync={handleSync}
      />

      <div className="hotfixes-list">
        {hotfixes.length === 0 ? (
          <div className="no-data-message">
            No hotfixes found for this project
          </div>
        ) : (
          hotfixes.map((hotfix) => (
            <div key={hotfix.id} className="hotfix-item" 
              onClick={() => handleHotfixClick(hotfix)}>
              <div className="hotfix-header">
                <span className="hotfix-version">{hotfix.title}</span>
              </div>
              <div className="hotfix-description">{hotfix.description}</div>
              {hotfix.detected_at && (
                <div className="hotfix-meta">
                  <span className="hotfix-date">
                    Detected: {new Date(hotfix.detected_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {selectedHotfix && (
        <div className="dialog-overlay" onClick={() => setSelectedHotfix(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedHotfix.title}</h2>
              <button className="dialog-close" onClick={() => setSelectedHotfix(null)}>
                ×
              </button>
            </div>

            <p className="dialog-date">
              {selectedHotfix.status && `Status: ${selectedHotfix.status}`}
              {selectedHotfix.created_at && ` • Created: ${new Date(selectedHotfix.created_at).toLocaleDateString()}`}
            </p>

              <div className="hotfix-details-content">
                {selectedHotfix.description && (
                  <div className="detail-item">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedHotfix.description}</span>
                  </div>
                )}
                {selectedHotfix.release_version && (
                  <div className="detail-item">
                    <span className="detail-label">Release Version</span>
                    <span className="detail-value">{selectedHotfix.release_version}</span>
                  </div>
                )}
                {selectedHotfix.environment_name && (
                  <div className="detail-item">
                    <span className="detail-label">Environment</span>
                    <span className="detail-value">{selectedHotfix.environment_name}</span>
                  </div>
                )}
                {selectedHotfix.resolved_at && (
                  <div className="detail-item">
                    <span className="detail-label">Resolved</span>
                    <span className="detail-value">
                      {new Date(selectedHotfix.resolved_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {selectedHotfix.jiraTickets && selectedHotfix.jiraTickets.length > 0 && (
                <div className="dialog-section">
                  <h3>Related Jira Tickets ({selectedHotfix.jiraTickets.length})</h3>
                  <div className="tickets-list">
                    {selectedHotfix.jiraTickets.map((ticket: any) => (
                      <a 
                        key={ticket.id} 
                        href={ticket.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ticket-item"
                      >
                        <span className="ticket-id">{ticket.jira_key}</span>
                        <span className="ticket-title">{ticket.summary}</span>
                        <span className={`ticket-status status-${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                          {ticket.status}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedHotfix.pullRequests && selectedHotfix.pullRequests.length > 0 && (
                <div className="dialog-section">
                  <h3>Related Pull Requests ({selectedHotfix.pullRequests.length})</h3>
                  <div className="prs-list">
                    {selectedHotfix.pullRequests.map((pr: any) => {
                      const ticketMatches = pr.title?.match(/PP[-\s_]?\d+/gi);
                      
                      return (
                        <a 
                          key={pr.id} 
                          href={pr.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="pr-item"
                        >
                          <span className="pr-id">#{pr.pr_number}</span>
                          {ticketMatches && ticketMatches.map((ticket: string, index: number) => (
                            <span key={`${ticket}-${index}`} className="pr-ticket-badge">
                              {ticket.toUpperCase().replace(/[\s_]/g, '-')}
                            </span>
                          ))}
                          <span className="pr-title">{pr.title}</span>
                          <span className="pr-author">by {pr.author}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
      )}
    </div>
      

    
  );
}
