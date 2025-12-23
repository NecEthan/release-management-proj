import PageHeader from '../components/page-header';
import { useProject } from '../contexts/ProjectContext';
import './Analytics.css';

export default function Analytics() {
  const { currentProject } = useProject();

  return (
    <div className="analytics">
      <PageHeader 
        title="Analytics" 
        description="Deployment and release metrics"
      />
    </div>
  );
}
