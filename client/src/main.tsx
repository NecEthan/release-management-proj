import { createRoot } from 'react-dom/client'
import './global.css'
import App from './App'
import '../interceptor/fetchInterceptor' 

const rootEl = document.getElementById('root') as HTMLElement

createRoot(rootEl).render(
    <App />
)
