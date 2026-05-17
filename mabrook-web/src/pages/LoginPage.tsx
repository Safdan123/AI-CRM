import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthFields'
import { AuthShell } from '../components/auth/AuthShell'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { paths } from '../config/paths'
import { authService } from '../lib/api'
import { navigateAfterAuth } from '../lib/referral/afterAuthRedirect'
import { getPendingInviteCode } from '../lib/referral/inviteStorage'

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const response = await authService.login({ email, password })
      await navigateAfterAuth(response.data.user.role, navigate)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New to Mabrook?{' '}
          <Link
            to={getPendingInviteCode() ? `${paths.signup}?from=invite` : paths.signup}
            className="font-semibold text-brand underline"
          >
            Sign up
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <AuthField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <div className="flex justify-end">
          <Link to={paths.auth.forgotPassword} className="text-sm text-brand underline">
            Forgot password?
          </Link>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-line bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/60"
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <div className="mt-8">
        <SocialAuthButtons />
      </div>
    </AuthShell>
  )
}
