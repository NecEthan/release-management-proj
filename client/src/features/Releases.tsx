import { useEffect, useState } from 'react'
import './Releases.css'
import PageHeader from '../components/page-header'
import { API } from '../services/api'

type Release = {
  id: number;
  version: string;
  release_date: string;
  status: string;
  ticket_count: string;
  pr_count: string;
}

export default function Releases() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRelease, setSelectedRelease] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'jira' | 'prs'>('jira')

  useEffect(() => {
    fetchReleases()
  }, [])

  const fetchReleases = async () => {
    try {
      const data = await API.getReleases()
      setReleases(data.releases)
    } catch (error) {
      console.error('Error fetching releases:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReleaseClick = async (release: Release) => {
    try {
      const data = await API.getReleaseDetails(release.id)
      setSelectedRelease(data.release)
    } catch (error) {
      console.error('Error fetching release details:', error)
    }
  }

  const closeDialog = async () => {
    setSelectedRelease(null)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="releases">
      <PageHeader title="Releases" description="Track and manage all releases" onSync={fetchReleases} />
      <div className="releases-list">
        {releases.map((release) => (
          <div
            key={release.id}
            className="release-item"
            onClick={() => handleReleaseClick(release)}
          >
            <div className="release-header">
              <span className="release-version">{release.version}</span>
              <span className="release-date">{new Date(release.release_date).toLocaleDateString()}</span>
            </div>
            <div className="release-description">{release.status}</div>
            <div className="release-stats">
              <span>{release.ticket_count ? parseInt(release.ticket_count) : 0} Jira Tickets</span>
              <span>{release.pr_count ? parseInt(release.pr_count) : 0} Pull Requests</span>
            </div>
          </div>
        ))}
      </div>

      {selectedRelease && (
        <div className="dialog-overlay" onClick={closeDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>{selectedRelease.version}</h2>
              <button className="dialog-close" onClick={closeDialog}>
                ×
              </button>
            </div>
            <div className="dialog-content">
              <div className="dialog-section">
                <p className="dialog-status">Status: <strong>{selectedRelease.status}</strong></p>
                <p className="dialog-date">Release Date: {new Date(selectedRelease.release_date).toLocaleString()}</p>
              </div>

              <div className="dialog-tabs">
                <button
                  className={`dialog-tab ${activeTab === 'jira' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jira')}
                >
                  Jira Tickets ({selectedRelease.jiraTickets?.length || 0})
                </button>
                <button
                  className={`dialog-tab ${activeTab === 'prs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prs')}
                >
                  Pull Requests ({selectedRelease.pullRequests?.length || 0})
                </button>
              </div>

              {activeTab === 'jira' && (
                <div className="dialog-section">
                  <div className="dialog-section-scrollable">
                    <div className="tickets-list">
                      {selectedRelease.jiraTickets?.length > 0 ? (
                        selectedRelease.jiraTickets.map((ticket: any) => (
                          <div key={ticket.id} className="ticket-item">
                            <a href={ticket.url} target="_blank" rel="noopener noreferrer" className="ticket-id">{ticket.jira_key}</a>
                            <span className="ticket-title">{ticket.summary}</span>
                            <span className={`ticket-status status-${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                              {ticket.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>No Jira tickets found for this release</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'prs' && (
                <div className="dialog-section">
                  <div className="dialog-section-scrollable">
                    <div className="prs-list">
                      {selectedRelease.pullRequests?.length > 0 ? (
                        selectedRelease.pullRequests.map((pr: any) => (
                          <div key={pr.id} className="pr-item">
                            <a href={pr.url} target="_blank" rel="noopener noreferrer" className="pr-id">#{pr.pr_number}</a>
                            <span className="pr-title">{pr.title}</span>
                            <span className="pr-author">by {pr.author}</span>
                          </div>
                        ))
                      ) : (
                        <p>No pull requests found for this release</p>
                      )}
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
