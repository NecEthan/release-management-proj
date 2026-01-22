import React, { useEffect, useState } from 'react'
import './Environments.css'
import PageHeader from '../components/page-header/page-header';
import { useProject } from '../contexts/ProjectContext';
import { API } from '../services/api';

export default function Environments() {

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  useEffect(() => {
    fetchEnvironments();
  }, [currentProject]);


  const fetchEnvironments = async () => {
    try {
      setLoading(true);
      const data = await API.getEnvironments(currentProject);
      setEnvironments(data.environments);
    } catch (error) {
      console.error('Error fetching environments:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchEnvironments();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  return (
    <div className="environments">
      <PageHeader title="Environments"
       description="Current versions across all environments"
        onSync={handleSync}
      />

      <div className="environments-container">
        {loading ? (
          <div className="no-data-message">Loading environments...</div>
        ) : environments.length === 0 ? (
          <div className="no-data-message">
            No environments found for this project
          </div>
        ) : (
          environments.map((env) => (
          <div key={env.id} className="env-card">
            <div className="env-name">{env.name}</div>
            <div className="env-version">{env.current_version || 'No version'}</div>
            <div className="env-deployed">
              <span className="deployed-label">Last Deployed:</span>
              <span className="deployed-time">
                {env.last_deployed_at ? new Date(env.last_deployed_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
          ))
        )}
      </div>
    </div>
  )
}
