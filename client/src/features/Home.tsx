import MainContent from '../components/main-content'
import PageHeader from '../components/page-header'
import './Home.css'

export default function Home() {
  const stats = {
    currentLiveVersion: 'v2.4.1',
    nextReleaseVersion: 'v2.5.0',
    releasesThisMonth: 3,
    activeHotfixes: 2,
  }

  const releases = [
    { id: 1, version: 'v2.5.0', date: '2025-12-20', description: 'New user dashboard and analytics' },
    { id: 2, version: 'v2.4.2', date: '2025-12-15', description: 'Bug fixes and performance improvements' },
    { id: 3, version: 'v2.4.1', date: '2025-12-01', description: 'Security patches and UI updates' },
    { id: 4, version: 'v2.4.0', date: '2025-11-15', description: 'Major feature release' },
  ]

  return (
    <div className="home">
      <PageHeader title="Overview" description="Key statistics and recent releases" />

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Current Live Version</div>
          <div className="stat-value">{stats.currentLiveVersion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Next Release</div>
          <div className="stat-value">{stats.nextReleaseVersion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Releases This Month</div>
          <div className="stat-value">{stats.releasesThisMonth}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Number of Hotfixes this month</div>
          <div className="stat-value highlight">{stats.activeHotfixes}</div>
        </div>
      </div>

      <div className="releases-section">
        <h2>Recent Releases</h2>
        <div className="releases-list">
          {releases.map((release) => (
            <div key={release.id} className="release-item">
              <div className="release-header">
                <span className="release-version">{release.version}</span>
              </div>
              <div className="release-date">{release.date}</div>
              <div className="release-description">{release.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
