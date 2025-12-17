import { useState } from 'react'
import Sidenav from './components/sidenav'
import Home from './features/Home'
import Environments from './features/Environments'
import Releases from './features/Releases'
import Deployments from './features/Deployments'
import Hotfixes from './features/Hotfixes'
import MainContent from './components/main-content'
import MenuKey from './types/menu-key.type'


export default function App() {
  const [selected, setSelected] = useState<MenuKey>('home');

   const renderContent = () => {
    switch (selected) {
      case 'home': return <Home />
      case 'environments': return <Environments />
      case 'releases': return <Releases />
      case 'deployments': return <Deployments />
      case 'hotfixes': return <Hotfixes />
    }
  }

  return (
    <div className='container'>
      <Sidenav selected={selected} onSelect={setSelected} />
      <MainContent>
        {renderContent()}
      </MainContent>
    </div>
  )
}
