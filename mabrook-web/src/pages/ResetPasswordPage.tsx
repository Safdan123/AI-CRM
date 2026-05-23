import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthFields'
import { AuthShell } from '../components/auth/AuthShell'
import { paths } from '../config/paths'
import { authService } from '../lib/api'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (!token) {
      setError('Missing reset token. Use the link from your email.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword({ token, password })
      navigate(paths.login)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Reset Password" subtitle="Enter your new password below.">
      <form className="space-y-5" onSubmit={onSubmit}>
        <AuthField
          label="New password"
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <AuthField
          label="Confirm new password"
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {loading ? 'Saving…' : 'Reset password'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-brand/80">
        <Link to={paths.login} className="font-semibold text-brand underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}
