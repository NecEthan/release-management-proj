import { useEffect, useState } from 'react';
import PageHeader from '../components/page-header'
import { useProject } from '../contexts/ProjectContext';
import './Home.css'
import { API } from '../services/api';

export default function Home() {
 
  const { currentProject } = useProject();
  const [productionVersion, setProductionVersion] = useState<string>('');
  const [releasesThisMonth, setReleasesThisMonth] = useState<number>(0);
  const [releases, setReleases] = useState<any[]>([]);

  useEffect(() => {
    fetchProductionVersion();
    fetchReleasesThisMonth();
    fetchReleases();
  }, [currentProject]);

   const fetchReleases = async () => {
      try {
        const data = await API.getReleases(currentProject)
        setReleases(data.releases)
      } catch (error) {
        console.error('Error fetching releases:', error)
      } 
    }

  const fetchProductionVersion = async () => {
    try {
      const data = await API.getEnvironments(currentProject);
      const production = data.environments.find((env: any) => env.name.toLowerCase() === 'develop');
      setProductionVersion(production?.current_version || 'N/A');
    } catch (error) {
      console.error('Error fetching production version:', error);
      setProductionVersion('Error');
    }
  };

  const fetchReleasesThisMonth = async () => {
    try {
      const data = await API.getReleaseStatsLastMonth(currentProject);
      setReleasesThisMonth(data.count);
    } catch (error) {
      console.error('Error fetching releases count:', error);
      setReleasesThisMonth(0);
    }
  };


   const stats = {
    currentLiveVersion: productionVersion,
    nextReleaseVersion: 'v2.5.0',
    releasesThisMonth: releasesThisMonth,
    activeHotfixes: 2,
  }

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
