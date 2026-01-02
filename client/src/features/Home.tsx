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
  const [lastDeployedTime, setLastDeploymentTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchALlDAta();
  }, [currentProject]);


  const fetchALlDAta = async () => {
    setLoading(true);
    await fetchProductionVersion();
    await fetchReleasesThisMonth();
    await fetchReleases();
    await fetchLastDeployment();
    setLoading(false);
  };

  const fetchLastDeployment = async () => {

    try {
      const data = await API.getDeployments(currentProject);

      if (data.deployments && data.deployments.length > 0) {
        const lastDeployment = data.deployments[0];
        const deployedAt = new Date(lastDeployment.deployed_at);
        const now = new Date();
        const diffMs = now.getTime() - deployedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays > 0) {
          setLastDeploymentTime(`${diffDays}d ago`);
        } else if (diffHours > 0) {
          setLastDeploymentTime(`${diffHours}h ago`);
        } else if (diffMins > 0) {
          setLastDeploymentTime(`${diffMins}m ago`);
        } else {
          setLastDeploymentTime('Just now');
        }
      } else {
        setLastDeploymentTime('N/A');
      }
    }
    catch (error) {
      console.error('Error fetching last deployment:', error);
      setLastDeploymentTime('Error');
    }

  }

  

   const fetchReleases = async () => {
      try {
        const data = await API.getReleases(currentProject)
        setReleases(data.releases)
      } catch (error) {
        console.error('Error fetching releases:', error)
      } 
    };

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

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchProductionVersion();
      await fetchReleasesThisMonth();
      await fetchReleases();
      await fetchLastDeployment();
    } catch (error) {
      console.error('Error syncing with CircleCI:', error);
    }
  };


   const stats = {
    currentLiveVersion: productionVersion,
    lastDeployedTime: lastDeployedTime,
    releasesThisMonth: releasesThisMonth,
    activeHotfixes: 2,
  }

  if (loading) {
    return (
      <div className="home">
         <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      <PageHeader title="Overview" description="Key statistics and recent releases" onSync={handleSync} />

      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Current Live Version</div>
          <div className="stat-value">{stats.currentLiveVersion}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Last Deployed</div>
          <div className="stat-value">{stats.lastDeployedTime}</div>
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
