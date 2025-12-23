import { useEffect, useState } from 'react'
import Sidenav from './components/sidenav'
import Home from './features/Home'
import Environments from './features/Environments'
import Releases from './features/Releases'
import Deployments from './features/Deployments'
import Hotfixes from './features/Hotfixes'
import Analytics from './features/Analytics'
import MainContent from './components/main-content'
import MenuKey from './types/menu-key.type'
import { ProjectProvider } from './contexts/ProjectContext';
import Authentication from './components/authentication'

export default function App() {
  const [selected, setSelected] = useState<MenuKey>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
    setLoading(false);
  }, [])

   const renderContent = () => {
    switch (selected) {
      case 'home': return <Home />
      case 'environments': return <Environments />
      case 'releases': return <Releases />
      case 'deployments': return <Deployments />
      case 'hotfixes': return <Hotfixes />
      case 'analytics': return <Analytics />
    }
  }

  if (!isAuthenticated) {
    return <Authentication />;
  }

  return (
    <ProjectProvider>
      <div className='container'>
        <Sidenav selected={selected} onSelect={setSelected} />
        <MainContent>
          {renderContent()}
        </MainContent>
      </div>
    </ProjectProvider>
  )
}
