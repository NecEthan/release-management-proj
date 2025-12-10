import { useEffect, useState } from 'react'
import Sidenav from './components/sidenav'
import MainContent from './components/main-content'

type Health = { status: string; time: string }

export default function App() {
  const [health, setHealth] = useState<Health | null>(null)

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(r => r.json())
      .then((data: Health) => setHealth(data))
      .catch(err => console.error('API error', err))
  }, [])

  return (
    <div className='container'>
      <Sidenav />
      <MainContent>
        <h1>Welcome</h1>
      </MainContent>
    </div>
  )
}
