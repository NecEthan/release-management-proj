import { useEffect, useState } from 'react'
import './Releases.css'
import PageHeader from '../components/page-header'
import { API } from '../services/api'
import { useProject } from '../contexts/ProjectContext'
import ReactPaginate from 'react-paginate'

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
  const { currentProject } = useProject();

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;

  const pageCount = Math.ceil(releases.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const paginatedReleases = releases.slice(offset, offset + itemsPerPage);

  useEffect(() => {
    fetchReleases();
  }, [currentProject]);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const data = await API.getReleases(currentProject);
      setReleases(data.releases);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error fetching releases:', error);
    } finally {
      setLoading(false);
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

  const handlePageClick = (event: { selected: number }) => {
    setCurrentPage(event.selected);
  }

  const closeDialog = async () => {
    setSelectedRelease(null)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="releases">
      <PageHeader title="Releases" description="Track and manage all releases" onSync={fetchReleases} />
      <div className="releases-list">
        {releases.length === 0 ? (
          <div className="no-data-message">
            No releases found for this project
          </div>
        ) : (
          paginatedReleases.map((release) => (
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
          ))
        )}
      </div>

     {paginatedReleases.length > 0 && (
        <div className="pagination-wrapper">
          <div className="pagination-info">
            <span className="pagination-current">
              Page {currentPage + 1} of {pageCount}
            </span>
          </div>
          <ReactPaginate
            previousLabel="‹ Previous"
            nextLabel="Next ›"
            breakLabel={null}
            pageCount={pageCount}
            onPageChange={handlePageClick}
            containerClassName="pagination"
            pageLinkClassName="pagination-page"
            previousLinkClassName="pagination-nav"
            nextLinkClassName="pagination-nav"
            breakLinkClassName="pagination-break"
            disabledLinkClassName="pagination-disabled"
            activeLinkClassName="pagination-active"
            pageRangeDisplayed={0}
            marginPagesDisplayed={0}
            forcePage={currentPage}
          />
        </div>
      )}


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
