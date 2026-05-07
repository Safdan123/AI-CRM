import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField } from '../components/auth/AuthFields'
import { AuthShell } from '../components/auth/AuthShell'
import { SocialAuthButtons } from '../components/auth/SocialAuthButtons'
import { paths } from '../config/paths'
import { authService } from '../lib/api'
import type { UserRole } from '../lib/api/types'
import { getDashboardRouteByRole } from '../lib/auth/roleRoute'

export function SignupPage() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<UserRole>('user')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const canPickRole = import.meta.env.VITE_ALLOW_SIGNUP_ROLE_PICKER === 'true'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!acceptedTerms) {
      setError('Please accept Terms of use and Privacy Policy.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await authService.signup({
        fullName,
        email,
        password,
        role: canPickRole ? role : 'user',
      })
      navigate(getDashboardRouteByRole(response.data.user.role))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your Mabrook account"
      subtitle={
        <>
          Already with Mabrook?{' '}
          <Link to={paths.login} className="font-semibold text-brand underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          label="Full name"
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
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
          placeholder="Create password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <AuthField
          label="Confirm password"
          type="password"
          placeholder="Confirm password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
        {canPickRole ? (
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-brand">Account role</span>
            <select
              className="h-12 w-full rounded-xl border border-line px-4 text-brand-ink outline-none transition focus:border-brand"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole)}
            >
              <option value="user">User</option>
              <option value="broker">Broker</option>
              <option value="admin">Admin</option>
              <option value="support">Support</option>
            </select>
          </label>
        ) : null}
        <label className="flex items-start gap-3 text-sm text-brand/85">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-line"
            checked={acceptedTerms}
            onChange={(event) => setAcceptedTerms(event.target.checked)}
          />
          <span>
            By registering, you accept our{' '}
            <Link to={paths.legal.agreements} className="underline">
              Terms of use
            </Link>{' '}
            and{' '}
            <Link to={paths.legal.privacy} className="underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center rounded-[14px] border border-line bg-brand px-6 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-brand/60"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <div className="mt-8">
        <SocialAuthButtons dividerLabel="Or sign up with" />
      </div>
    </AuthShell>
  )
}
