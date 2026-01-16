import React, { useEffect, useState } from 'react';
import PageHeader from '../components/page-header/page-header';
import { useProject } from '../contexts/ProjectContext';
import './Home.css'
import { API } from '../services/api';
import { ResponsiveContainer, LineChart, CartesianGrid, Line, Tooltip, XAxis, YAxis } from 'recharts';

export default function Home() {
 
  const { currentProject } = useProject();
  const [productionVersion, setProductionVersion] = useState<string>('');
  const [releasesThisMonth, setReleasesThisMonth] = useState<number>(0);
  const [releases, setReleases] = useState<any[]>([]);
  const [lastDeployedTime, setLastDeploymentTime] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [hotfixesThisMonth, setHotfixesThisMonth] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchALlDAta();
  }, [currentProject]);


  const fetchALlDAta = async () => {
    try {
      setLoading(true);
      await fetchProductionVersion();
      await fetchReleasesThisMonth();
      await fetchReleases();
      await fetchLastDeployment();
      await fetchDeploymentFrequency();
      await fetchHotfixesThisMonth();
    } finally {
      setLoading(false);
    }
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

  const fetchDeploymentFrequency = async () => {
    try {
      const data = await API.getDeployments(currentProject);

      const last7Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
      });

      const grouped = last7Days.map(date => {
        const count = data.deployments.filter((d: any) => 
          d.deployed_at.startsWith(date)
        ).length;
        return {
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          deployments: count
        };
      })

      setChartData(grouped);
    } catch (error) {
      console.error('Error fetching deployment frequency:', error);
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

  const fetchHotfixesThisMonth = async () => {
    try {
      const data = await API.getHotfixes(currentProject);
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const hotfixesCount = data.hotfixes.filter((hotfix: any) => {
        const detectedDate = new Date(hotfix.detected_at);
        return detectedDate >= firstDayOfMonth;
      }).length;
      
      setHotfixesThisMonth(hotfixesCount);
    } catch (error) {
      console.error('Error fetching hotfixes count:', error);
      setHotfixesThisMonth(0);
    }
  };

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchProductionVersion();
      await fetchReleasesThisMonth();
      await fetchReleases();
      await fetchLastDeployment();
      await fetchHotfixesThisMonth();
    } catch (error) {
      console.error('Error syncing with CircleCI:', error);
    }
  };


   const stats = {
    currentLiveVersion: productionVersion,
    lastDeployedTime: lastDeployedTime,
    releasesThisMonth: releasesThisMonth,
    activeHotfixes: hotfixesThisMonth,
  }

  if (loading) {
    return (
      <div className="home">
        <PageHeader title="Overview" description="Key statistics and recent releases" onSync={handleSync} />
        <div className="stats-container">
          <div>Loading overview data...</div>
        </div>
      </div>
    );
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

      <div className="chart-section">
        <h2>Deployment Frequency (Last 30 Days)</h2>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis dataKey="date" stroke="rgba(255, 255, 255, 0.5)" />
              <YAxis stroke="rgba(255, 255, 255, 0.5)" style={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ 
                  backgroundColor: 'rgba(10, 18, 32, 0.95)', 
                  border: '1px solid rgba(255, 140, 0, 0.3)',
                  borderRadius: '8px'
                }} />
              <Line  
              type="monotone" 
                dataKey="deployments" 
                stroke="#ff8c00" 
                strokeWidth={2}
                dot={{ fill: '#ff8c00', r: 4 }}
              />
            </LineChart>

          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}
