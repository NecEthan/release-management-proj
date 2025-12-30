import { useEffect, useState } from 'react'
import './Environments.css'
import PageHeader from '../components/page-header';
import { useProject } from '../contexts/ProjectContext';

export default function Environments() {

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  useEffect(() => {
    fetchEnvironments();
  }, [currentProject]);


  const fetchEnvironments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/releases/environments?project=' + currentProject);
      const data = await response.json();
      setEnvironments(data.environments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching environments:', error);
      setLoading(false);
    }
  }

  const handleSync = async () => {
    try {
      await fetch('http://localhost:5000/api/circleci/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: currentProject })
      });
      await fetchEnvironments();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="environments">
      <PageHeader title="Environments"
       description="Current versions across all environments"
        onSync={handleSync}
      />

      <div className="environments-container">
        {environments.length === 0 ? (
          <div className="no-data-message">
            No environments found for this project
          </div>
        ) : (
          environments.map((env) => (
          <div key={env.id} className="env-card">
            <div className="env-name">{env.name}</div>
            <div className="env-version">{env.current_version}</div>
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
