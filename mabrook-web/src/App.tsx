import { BrowserRouter } from 'react-router-dom'
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications'
import { AppRoutes } from './router/AppRoutes'

function RealtimeBridge() {
  useRealtimeNotifications()
  return null
}

function App() {
  return (
    <BrowserRouter>
      <RealtimeBridge />
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
