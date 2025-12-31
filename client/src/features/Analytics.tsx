import { useEffect, useState } from 'react';
import PageHeader from '../components/page-header';
import { useProject } from '../contexts/ProjectContext';
import './Analytics.css';
import { API } from '../services/api';
import { Deployment } from '../types/deployment.type';

export default function Analytics() {
  const { currentProject } = useProject();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchDeployments();
  }, [currentProject]);

  const fetchDeployments = async () => {
    try {
      const data = await API.getDeployments(currentProject);
      setDeployments(data.deployments);
    } catch (error) {
      console.error('Error fetching deployments:', error);
    }
  };

  const getDeploymentsInRange = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return deployments.filter(d => new Date(d.deployed_at) >= cutoffDate);
  };

  const deploymentsInRange = getDeploymentsInRange();

  const environmentCounts = deploymentsInRange.reduce((acc, d) => {
    acc[d.environment] = (acc[d.environment] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const branchCounts = deploymentsInRange.reduce((acc, d) => {
    acc[d.branch] = (acc[d.branch] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="analytics">
      <PageHeader 
        title="Analytics" 
        description="Deployment and release metrics"
      />

      <div className="time-range-selector">
        <button 
          className={timeRange === '7d' ? 'active' : ''} 
          onClick={() => setTimeRange('7d')}
        >
          Last 7 Days
        </button>
        <button 
          className={timeRange === '30d' ? 'active' : ''} 
          onClick={() => setTimeRange('30d')}
        >
          Last 30 Days
        </button>
        <button 
          className={timeRange === '90d' ? 'active' : ''} 
          onClick={() => setTimeRange('90d')}
        >
          Last 90 Days
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{deploymentsInRange.length}</div>
          <div className="stat-label">Total Deployments</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            {(deploymentsInRange.length / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90)).toFixed(1)}
          </div>
          <div className="stat-label">Per Day Average</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{Object.keys(environmentCounts).length}</div>
          <div className="stat-label">Environments</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{Object.keys(branchCounts).length}</div>
          <div className="stat-label">Unique Branches</div>
        </div>
      </div>

      {deploymentsInRange.length === 0 && (
        <div className="no-data-message">
          <p>No deployments found in the selected time range.</p>
          <p className="no-data-hint">Try selecting a longer time period or check if deployments are being tracked.</p>
        </div>
      )}
    </div>
  );
}
