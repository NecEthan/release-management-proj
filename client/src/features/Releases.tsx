import { useEffect, useState } from 'react'
import './Releases.css'
import PageHeader from '../components/page-header/page-header'
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
      const data = await API.getReleases(currentProject);
      setReleases(data.releases);
      setCurrentPage(0);
    } catch (error) {
      console.error('Error fetching releases:', error);
    }
  }

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchReleases();
    } catch (error) {
      console.error('Error syncing with CircleCI:', error);
    }
  }

  const handleReleaseClick = async (release: Release) => {
    try {
      const data = await API.getReleaseDetails(release.id, currentProject)
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

  return (
    <div className="releases">
      <PageHeader title="Releases" description="Track and manage all releases" onSync={handleSync} />
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
              <div className="dialog-title-section">
                <h2>{selectedRelease.version}</h2>
                <span className="dialog-date">
                  {new Date(selectedRelease.release_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              <button className="dialog-close" onClick={closeDialog}>
                ×
              </button>
            </div>

            <div className="dialog-tabs">
              <button
                className={`dialog-tab ${activeTab === 'jira' ? 'active' : ''}`}
                onClick={() => setActiveTab('jira')}
              >
                <svg className="tab-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"></path>
                  <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"></path>
                </svg>
                Jira Tickets
              </button>
              <button
                className={`dialog-tab ${activeTab === 'prs' ? 'active' : ''}`}
                onClick={() => setActiveTab('prs')}
              >
                <svg className="tab-icon" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"></path>
                </svg>
                Pull Requests
              </button>
            </div>

            <div className="dialog-content">
              {activeTab === 'jira' && (
                <div className="tickets-list">
                  {selectedRelease.jiraTickets?.length > 0 ? (
                    selectedRelease.jiraTickets.map((ticket: any) => (
                      <a 
                        key={ticket.id} 
                        href={ticket.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="ticket-item"
                      >
                        <div className="item-header">
                          <span className="ticket-id">{ticket.jira_key}</span>
                          <span className={`ticket-status status-${ticket.status?.toLowerCase().replace(' ', '-')}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <span className="ticket-title">{ticket.summary}</span>
                      </a>
                    ))
                  ) : (
                    <div className="no-data-message">
                      <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <p>No Jira tickets found for this release</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'prs' && (
                <div className="prs-list">
                  {selectedRelease.pullRequests?.length > 0 ? (
                    selectedRelease.pullRequests.map((pr: any) => {
                      const ticketMatches = pr.title.match(/PP[-\s_]?\d+/gi);
                      
                      return (
                        <a 
                          key={pr.id} 
                          href={pr.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="pr-item"
                        >
                          <div className="item-header">
                            <div className="pr-header-left">
                              <span className="pr-id">#{pr.pr_number}</span>
                              {ticketMatches && ticketMatches.map((ticket: string, index: number) => (
                                <span key={`${ticket}-${index}`} className="pr-ticket-badge">
                                  {ticket.toUpperCase().replace(/[\s_]/g, '-')}
                                </span>
                              ))}
                            </div>
                            <span className="pr-author">by {pr.author}</span>
                          </div>
                          <span className="pr-title">{pr.title}</span>
                        </a>
                      );
                    })
                  ) : (
                    <div className="no-data-message">
                      <svg className="empty-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      <p>No pull requests found for this release</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
