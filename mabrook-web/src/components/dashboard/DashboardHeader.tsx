import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '../../config/paths'
import { assets } from '../../siteAssets'
import { MabrookLogo } from '../brand/MabrookLogo'

const MENU_ITEMS = [
  { label: 'Dashboard', to: paths.dashboard },
  { label: 'Referrals', to: paths.brokerReferrals },
  { label: 'Campaigns', to: paths.campaigns },
  { label: 'Settings', to: paths.settings },
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
  const wrapRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-[120px]">
        <MabrookLogo compact />

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
                {MENU_ITEMS.map((item) => (
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
                  onClick={() => {
                    setOpen(false)
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
  )
}
