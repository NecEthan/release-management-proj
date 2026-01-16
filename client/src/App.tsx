import { useEffect, useState } from 'react'
import Sidenav from './components/sidenav/sidenav'
import MainContent from './components/main-content/main-content'
import Home from './features/Home'
import Environments from './features/Environments'
import Releases from './features/Releases'
import Deployments from './features/Deployments'
import Hotfixes from './features/Hotfixes'
import MenuKey from './types/menu-key.type'
import { ProjectProvider } from './contexts/ProjectContext';
import Authentication from './components/auth/authentication'

export default function App() {
  const [selected, setSelected] = useState<MenuKey>('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authStatus = localStorage.getItem('isAuthenticated') === 'true';
    setIsAuthenticated(authStatus);
  }, [])

   const renderContent = () => {
    switch (selected) {
      case 'home': return <Home />
      case 'environments': return <Environments />
      case 'releases': return <Releases />
      case 'deployments': return <Deployments />
      case 'hotfixes': return <Hotfixes />
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
