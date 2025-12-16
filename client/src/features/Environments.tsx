import { useEffect, useState } from 'react'
import './Environments.css'
import PageHeader from '../components/page-header';

export default function Environments() {

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnvironments();
  }, []);

  const fetchEnvironments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/releases/environments');
      const data = await response.json();
      setEnvironments(data.environments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching environments:', error);
      setLoading(false);
    }
  }

  if (loading) return <div>Loading...</div>;


  return (
    <div className="environments">
      <PageHeader title="Environments"
       description="Current versions across all environments"
        onSync={fetchEnvironments}
      />

      <div className="environments-container">
        {environments.map((env) => (
          <div key={env.id} className="env-card">
            <div className="env-name">{env.name}</div>
            <div className="env-version">{env.current_version}</div>
            <div className="env-deployed">
              <span className="deployed-label">Last Deployed:</span>
              <span className="deployed-time">{env.last_deployed_at}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
