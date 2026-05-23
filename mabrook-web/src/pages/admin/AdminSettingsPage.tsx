import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'
import { authService } from '../../lib/api'
import type { AuthUser } from '../../lib/api/types'

const LS = {
  compactTables: 'admin.settings.compactTables',
  digest: 'admin.settings.digest',
} as const

function readBool(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key)
    if (v === '1') return true
    if (v === '0') return false
    return fallback
  } catch {
    return fallback
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function readDigest(): 'off' | 'daily' | 'weekly' {
  try {
    const v = localStorage.getItem(LS.digest)
    if (v === 'daily' || v === 'weekly') return v
    return 'off'
  } catch {
    return 'off'
  }
}

function writeDigest(v: 'off' | 'daily' | 'weekly') {
  try {
    localStorage.setItem(LS.digest, v)
  } catch {
    /* ignore */
  }
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
}: {
  id: string
  label: string
  description: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/80 py-4 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-semibold text-brand">
          {label}
        </label>
        <p className="mt-1 text-xs leading-relaxed text-brand/60">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand' : 'bg-brand/20'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200 ease-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  )
}

const quickLinks: { label: string; to: string; hint: string }[] = [
  { label: 'Dashboard', to: paths.admin.dashboard, hint: 'KPIs, growth, scoring snapshot' },
  { label: 'Users & roles', to: paths.admin.usersRoles, hint: 'Access and role management' },
  { label: 'Notifications', to: paths.admin.notifications, hint: 'Broadcast messages to users' },
  { label: 'Insights', to: paths.admin.aiInsights, hint: 'Lead and churn scores' },
  { label: 'Reports', to: paths.admin.reports, hint: 'Exports and summaries' },
  { label: 'Referrals', to: paths.admin.referrals, hint: 'Review queue' },
]

export function AdminSettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loadError, setLoadError] = useState('')
  const [compactTables, setCompactTables] = useState(false)
  const [digest, setDigest] = useState<'off' | 'daily' | 'weekly'>('off')
  const [prefsSaved, setPrefsSaved] = useState(false)

  useEffect(() => {
    setCompactTables(readBool(LS.compactTables, false))
    setDigest(readDigest())
  }, [])

  useEffect(() => {
    void authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => setLoadError('Could not load your account.'))
  }, [])

  const persistCompact = useCallback((next: boolean) => {
    setCompactTables(next)
    writeBool(LS.compactTables, next)
    setPrefsSaved(true)
    window.setTimeout(() => setPrefsSaved(false), 1600)
  }, [])

  const persistDigest = useCallback((next: 'off' | 'daily' | 'weekly') => {
    setDigest(next)
    writeDigest(next)
    setPrefsSaved(true)
    window.setTimeout(() => setPrefsSaved(false), 1600)
  }, [])

  async function handleLogout() {
    try {
      await authService.logout()
    } catch {
      /* still navigate */
    }
    navigate(paths.login)
  }

  const apiMode = (import.meta.env.VITE_API_MODE as string | undefined) ?? 'mock'
  const appMode = import.meta.env.MODE

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="mb-8 border-b border-line pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand/45">Administration</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight text-brand max-sm:text-[28px]">Settings</h1>
        {/*
          Workspace preferences, shortcuts to core tools, and session controls. Changes here stay on this browser
          unless a server-backed settings API is added later.
        */}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
            <h2 className="text-base font-semibold text-brand">Workspace</h2>
            <p className="mt-1 text-sm text-brand/60">Signed-in administrator profile</p>
            {loadError ? (
              <p className="mt-4 text-sm text-rose-700">{loadError}</p>
            ) : user ? (
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-footer/50 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand/50">Name</dt>
                  <dd className="mt-1 truncate text-sm font-semibold text-brand">{user.fullName}</dd>
                </div>
                <div className="rounded-xl bg-footer/50 px-4 py-3">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand/50">Email</dt>
                  <dd className="mt-1 truncate text-sm text-brand/85">{user.email}</dd>
                </div>
                <div className="rounded-xl bg-footer/50 px-4 py-3 sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-brand/50">Role</dt>
                  <dd className="mt-1">
                    <span className="inline-flex rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold capitalize text-brand ring-1 ring-brand/15">
                      {user.role}
                    </span>
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="mt-6 h-20 animate-pulse rounded-xl bg-footer/60" />
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-brand">Preferences</h2>
                <p className="mt-1 text-sm text-brand/60">Stored locally in this browser</p>
              </div>
              {prefsSaved ? (
                <span className="text-xs font-semibold text-emerald-700">Saved</span>
              ) : null}
            </div>
            <div className="mt-2">
              <ToggleRow
                id="pref-compact"
                label="Compact admin tables"
                description="Tighter row spacing on list pages when those screens read this flag (extensible for future tables)."
                checked={compactTables}
                onChange={persistCompact}
              />
            </div>
            <div className="mt-4 border-t border-line/80 pt-4">
              <label htmlFor="digest" className="text-sm font-semibold text-brand">
                Admin digest email
              </label>
              <p className="mt-1 text-xs text-brand/60">
                Preference only — wire to notification or mail service when product defines schedules.
              </p>
              <select
                id="digest"
                value={digest}
                onChange={(e) => persistDigest(e.target.value as 'off' | 'daily' | 'weekly')}
                className="mt-3 h-10 w-full max-w-xs rounded-xl border border-line bg-white px-3 text-sm font-medium text-brand outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 sm:w-auto"
              >
                <option value="off">Off</option>
                <option value="daily">Daily summary</option>
                <option value="weekly">Weekly summary</option>
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
            <h2 className="text-base font-semibold text-brand">Session</h2>
            <p className="mt-1 text-sm text-brand/60">Sign out on this device</p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-5 h-10 rounded-full border border-line bg-white px-5 text-sm font-semibold text-brand transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800"
            >
              Sign out
            </button>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
            <h2 className="text-base font-semibold text-brand">Shortcuts</h2>
            <p className="mt-1 text-sm text-brand/60">Jump to common admin areas</p>
            <ul className="mt-4 space-y-2">
              {quickLinks.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="flex items-center justify-between gap-2 rounded-xl border border-line/90 bg-footer/35 px-3 py-2.5 text-sm font-medium text-brand transition hover:border-brand/30 hover:bg-white"
                  >
                    <span>{item.label}</span>
                    <span className="text-brand/35" aria-hidden>
                      →
                    </span>
                  </Link>
                  <p className="mt-0.5 px-1 text-[11px] text-brand/50">{item.hint}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-gradient-to-b from-white to-footer/40 p-6 shadow-sm ring-1 ring-black/[0.02]">
            <h2 className="text-base font-semibold text-brand">Environment</h2>
            <p className="mt-1 text-sm text-brand/60">Build-time and client configuration (read-only)</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3 border-b border-line/60 pb-3">
                <dt className="text-brand/55">Vite mode</dt>
                <dd className="font-mono text-xs font-semibold text-brand">{appMode}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-brand/55">API mode</dt>
                <dd className="font-mono text-xs font-semibold text-brand">{apiMode}</dd>
              </div>
            </dl>
            <p className="mt-4 text-[11px] leading-relaxed text-brand/50">
              Set <span className="font-mono text-brand/70">VITE_API_MODE=real</span> in{' '}
              <span className="font-mono text-brand/70">mabrook-web/.env</span> for live services behind Kong.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
