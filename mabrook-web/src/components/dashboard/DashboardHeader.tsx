import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'
import { authService } from '../../lib/api'
import { getTokenPayload } from '../../lib/api/http'
import { searchGlobal } from '../../lib/api/realServices'
import { assets } from '../../siteAssets'
import { MabrookLogo } from '../brand/MabrookLogo'

const BROKER_MENU_ITEMS = [
  { label: 'Dashboard', to: paths.dashboard },
  { label: 'Referrals', to: paths.brokerReferrals },
  { label: 'Campaigns', to: paths.campaigns },
  { label: 'Settings', to: paths.settings },
] as const

const ADMIN_MENU_ITEMS = [
  { label: 'Dashboard', to: paths.admin.dashboard },
  { label: 'Referrals', to: paths.admin.referrals },
  { label: 'Campaigns', to: paths.campaigns },
  { label: 'Settings', to: paths.admin.settings },
] as const

const USER_MENU_ITEMS = [
  { label: 'Dashboard', to: paths.user.dashboard },
  { label: 'Profile', to: paths.user.profile },
  { label: 'Rewards', to: paths.user.rewards },
  { label: 'Notifications', to: paths.user.notifications },
] as const

type DashboardHeaderProps = {
  userName?: string
  userEmail?: string
}

export function DashboardHeader({
  userName = 'Alex Broker',
  userEmail = 'alex.broker@mabrook.app',
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Array<{ kind: 'campaign' | 'referral' | 'blog'; id: string; label: string }>>([])
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const role = getTokenPayload()?.role ?? 'user'

  const menuItems =
    role === 'admin' || role === 'support'
      ? ADMIN_MENU_ITEMS
      : role === 'user'
        ? USER_MENU_ITEMS
        : BROKER_MENU_ITEMS

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timeout = window.setTimeout(() => {
      void searchGlobal(query)
        .then((res) => {
          const next = [
            ...res.data.campaigns.map((c) => ({
              kind: 'campaign' as const,
              id: c.id,
              label: c.name ?? 'Campaign',
            })),
            ...res.data.referrals.map((r) => ({
              kind: 'referral' as const,
              id: r.id,
              label: `${r.id} — ${r.customerName ?? 'Referral'}`,
            })),
            ...res.data.blogs.map((b) => ({
              kind: 'blog' as const,
              id: b.id,
              label: b.title ?? 'Blog',
            })),
          ].slice(0, 8)
          setResults(next)
        })
        .catch(() => setResults([]))
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [query])

  function openResult(item: { kind: 'campaign' | 'referral' | 'blog'; id: string }) {
    if (item.kind === 'campaign') navigate(paths.campaignDetail(item.id))
    else if (item.kind === 'referral') navigate(paths.brokerReferralDetail(item.id))
    else navigate(paths.blogs)
    setQuery('')
    setResults([])
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-[120px]">
        <MabrookLogo compact />

        <div className="relative mr-auto hidden w-full max-w-[420px] md:block">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search referrals, campaigns, blogs"
            className="h-10 w-full rounded-full border border-line bg-white px-4 text-sm text-brand-ink outline-none transition focus:border-brand"
          />
          {results.length > 0 ? (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-line bg-white p-2 shadow-lg">
              {results.map((item) => (
                <button
                  key={`${item.kind}-${item.id}`}
                  type="button"
                  className="w-full rounded-lg px-3 py-2 text-left text-sm text-brand transition hover:bg-footer"
                  onClick={() => openResult(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="relative flex items-center gap-3" ref={wrapRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition hover:border-line hover:bg-footer"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <img
              src={assets.avatarUser}
              alt=""
              className="size-10 shrink-0 rounded-full border border-line bg-surface-tint object-cover"
              width={40}
              height={40}
            />
            <span className="hidden max-w-[160px] truncate text-left text-sm font-semibold text-brand sm:block">
              {userName}
            </span>
            <svg
              className={`hidden size-4 text-brand/60 sm:block ${open ? 'rotate-180' : ''} transition`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {open ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+8px)] w-[min(100vw-2rem,280px)] rounded-2xl border border-line bg-white py-2 shadow-lg"
            >
              <div className="border-b border-line px-4 py-3">
                <p className="font-semibold text-brand">{userName}</p>
                <p className="mt-0.5 text-sm text-brand/70">{userEmail}</p>
              </div>
              <nav className="flex flex-col py-1" aria-label="Account menu">
                {menuItems.map((item) => (
                  <Link
                    key={item.label}
                    role="menuitem"
                    to={item.to}
                    className="px-4 py-2.5 text-sm font-medium text-brand transition hover:bg-footer"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                  onClick={async () => {
                    setOpen(false)
                    try {
                      await authService.logout()
                    } catch {
                      // ignore logout network errors and still clear UI flow
                    }
                    navigate(paths.login)
                  }}
                >
                  Logout
                </button>
              </nav>
            </div>
          ) : null}
        </div>
        </div>
      </header>
      <div className="h-[72px] w-full shrink-0" aria-hidden />
    </>
  )
}
