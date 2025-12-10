import { useEffect, useState } from 'react'

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
    <div style={{ fontFamily: 'system-ui', padding: 24 }}>
      <h1>React + Express Starter</h1>
      <p>Client is running. Below is server health:</p>
      <pre>{JSON.stringify(health, null, 2)}</pre>
    </div>
  )
}
