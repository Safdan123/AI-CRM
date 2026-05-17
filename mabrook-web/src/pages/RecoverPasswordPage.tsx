import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthFields'
import { AuthShell } from '../components/auth/AuthShell'
import { paths } from '../config/paths'
import { authService } from '../lib/api'

export function RecoverPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Recover Password"
      subtitle="Enter your email address and we'll send you a reset link."
    >
      {sent ? (
        <p className="rounded-xl border border-line bg-footer/60 px-4 py-3 text-sm text-brand">
          If an account exists for that email, a reset link has been sent. Check Mailpit at{' '}
          <a href="http://localhost:8025" className="font-semibold underline" target="_blank" rel="noreferrer">
            localhost:8025
          </a>{' '}
          in development.
        </p>
      ) : (
        <form className="space-y-5" onSubmit={onSubmit}>
          <AuthField
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-full bg-brand text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-brand/80">
        <Link to={paths.login} className="font-semibold text-brand underline">
          Back to login
        </Link>
      </p>
    </AuthShell>
  )
}
