import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { AiChatWidget } from '../chat/AiChatWidget'
import { paths } from '../../config/paths'
import { getAccessToken, getTokenPayload, setAccessToken } from '../../lib/api/http'

export function RequireAuth() {
  const location = useLocation()
  const token = getAccessToken()
  const payload = getTokenPayload()

  if (!token || !payload) {
    setAccessToken(null)
    return <Navigate to={paths.login} replace state={{ from: location.pathname }} />
  }

  const role = payload.role
  const showChat =
    role === 'admin' || role === 'broker' || role === 'user' || role === 'support'

  return (
    <>
      <Outlet />
      {showChat ? <AiChatWidget /> : null}
    </>
  )
}
