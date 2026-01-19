import { useState, useEffect } from 'react';
import './Hotfixes.css';
import PageHeader from '../components/page-header/page-header';
import { API } from '../services/api';
import { useProject } from '../contexts/ProjectContext';

export default function Hotfixes() {
  const [hotfixes, setHotfixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentProject } = useProject();

  useEffect(() => {
    fetchHotfixes();
  }, [currentProject]);

  const fetchHotfixes = async () => {
    try {
      setLoading(true);
      const data = await API.getHotfixes(currentProject);
      setHotfixes(data.hotfixes || []);
    } catch (error) {
      console.error('Error fetching hotfixes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await API.syncCircleCI(currentProject);
      await fetchHotfixes();
    } catch (error) {
      console.error('Error syncing:', error);
    }
  };

  const handleHotfixClick = async (hotfix: any) => {
    try {
      const response = await API.getHotfixDetails(hotfix.id, currentProject);
      const hotfixData = response.hotfix;
      
      // Open the first PR in a new tab if it exists
      if (hotfixData.pullRequests && hotfixData.pullRequests.length > 0) {
        window.open(hotfixData.pullRequests[0].url, '_blank');
      }
    } catch (error) {
      console.error('Error fetching hotfix details:', error);
    }
  };

  return (
    <div className="hotfixes">
      <PageHeader title="Hotfixes"
        description="Monitor and deploy emergency hotfixes"
        onSync={handleSync}
      />

      <div className="hotfixes-list">
        {loading ? (
          <div>Loading hotfixes...</div>
        ) : hotfixes.length === 0 ? (
          <div>
            No hotfixes found for this project
          </div>
        ) : (
          hotfixes.map((hotfix) => (
            <div key={hotfix.id} className="hotfix-item" 
              onClick={() => handleHotfixClick(hotfix)}>
              <div className="hotfix-header">
                <span className="hotfix-version">{hotfix.title}</span>
              </div>
              <div className="hotfix-description">{hotfix.description}</div>
              {hotfix.detected_at && (
                <div className="hotfix-meta">
                  <span className="hotfix-date">
                    Detected: {new Date(hotfix.detected_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
