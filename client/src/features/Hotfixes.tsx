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

  const handleHotfixClick = async (hotfix: any) => {
    try {
      const details = await API.getHotfixDetails(hotfix.id);
      setSelectedHotfix(details);
    } catch (error) {
      console.error('Error fetching hotfix details:', error);
    }
  };

  return (
    <div className="hotfixes">
      <PageHeader title="Hotfixes"
        description="Monitor and deploy emergency hotfixes"
        onSync={fetchHotfixes}
      />

      <div className="hotfixes-list">
        {hotfixes.map((hotfix) => (
          <div key={hotfix.id} className="hotfix-item" 
            onClick={() => handleHotfixClick(hotfix)}>
            <div className="hotfix-header">
              <span className="hotfix-version">{hotfix.title}</span>
            </div>
            <div className="hotfix-description">{hotfix.description}</div>
            <div className="hotfix-meta">
              <span className="hotfix-status">{hotfix.status}</span>
              {hotfix.detected_at && (
                <span className="hotfix-date">
                  Detected: {new Date(hotfix.detected_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        ))}
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
            <div className="dialog-content">
              <div className="dialog-section">
                <h3>Description</h3>
                <p className="dialog-text">{selectedHotfix.description}</p>
              </div>

              <div className="dialog-section">
                <h3>Status</h3>
                <p className="dialog-text">{selectedHotfix.status}</p>
              </div>

              {selectedHotfix.resolved_at && (
                <div className="dialog-section">
                  <h3>Resolved</h3>
                  <p className="dialog-text">
                    {new Date(selectedHotfix.resolved_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {selectedHotfix.release && (
                <div className="dialog-section">
                  <h3>Related Release</h3>
                  <p className="dialog-text">{selectedHotfix.release.version}</p>
                </div>
              )}

              {selectedHotfix.tickets && selectedHotfix.tickets.length > 0 && (
                <div className="dialog-section">
                  <h3>Jira Tickets</h3>
                  <div className="pr-list">
                    {selectedHotfix.tickets.map((ticket: any) => (
                      <a 
                        key={ticket.id} 
                        href={ticket.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="jira-link"
                      >
                        {ticket.key}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedHotfix.pull_requests && selectedHotfix.pull_requests.length > 0 && (
                <div className="dialog-section">
                  <h3>Pull Requests</h3>
                  <div className="pr-list">
                    {selectedHotfix.pull_requests.map((pr: any) => (
                      <a 
                        key={pr.id} 
                        href={pr.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="pr-link"
                      >
                        #{pr.number}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
      

    
  );
}
