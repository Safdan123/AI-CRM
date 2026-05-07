import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '../../config/paths'
import { assets } from '../../siteAssets'
import { MabrookLogo } from '../brand/MabrookLogo'
import { ButtonLink } from '../ui/ButtonLink'
import { Container } from '../ui/Container'

export type HeaderVariant = 'overlay' | 'default'

type HeaderProps = {
  /** `overlay`: fixed over hero (scroll adds solid bar). `default`: sticky bar for inner pages. */
  variant?: HeaderVariant
  mode?: 'marketing' | 'auth'
  /** Optional class on outer `<header>` */
  className?: string
}

/**
 * Global site header — reusable on any page. Use `overlay` on landing heroes; `default` elsewhere.
 */
export function Header({
  variant = 'default',
  mode = 'marketing',
  className = '',
}: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [heroElevated, setHeroElevated] = useState(false)

  useEffect(() => {
    if (variant !== 'overlay') return
    const onScroll = () => setHeroElevated(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [variant])

  const positionClasses =
    variant === 'overlay'
      ? `fixed left-0 right-0 top-0 z-50 w-full transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 ease-out ${
          heroElevated
            ? 'border-b border-line/80 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/92'
            : 'border-b border-transparent bg-white/88 shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-white/82'
        }`
      : 'sticky top-0 z-50 border-b border-line/80 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/90'

  return (
    <header className={`${positionClasses} ${className}`.trim()}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to main content
      </a>
      <Container className="flex items-center justify-between gap-4 py-4">
        <div onClick={() => setMobileOpen(false)}>
          <MabrookLogo compact />
        </div>

        {mode === 'marketing' ? (
          <nav className="hidden items-center gap-2 md:flex md:gap-4" aria-label="Account">
            <Link to={paths.about} className="px-3 py-2 text-sm font-semibold text-brand/85 transition hover:text-brand">
              About
            </Link>
            <Link to={paths.blogs} className="px-3 py-2 text-sm font-semibold text-brand/85 transition hover:text-brand">
              Blogs
            </Link>
            <Link to={paths.contact} className="px-3 py-2 text-sm font-semibold text-brand/85 transition hover:text-brand">
              Contact
            </Link>
            <ButtonLink
              to={paths.login}
              variant="secondary"
              className="hover:bg-brand/8"
            >
              Log In
            </ButtonLink>
            <ButtonLink
              to={paths.signup}
              variant="primary"
              className="px-6 py-3 hover:-translate-y-px"
            >
              Sign up
            </ButtonLink>
          </nav>
        ) : (
          <Link
            to={paths.home}
            className="hidden size-12 items-center justify-center rounded-full border border-line transition hover:bg-brand/5 md:inline-flex"
            aria-label="Close and go home"
          >
            <img src={assets.navClose} alt="" className="size-8 rotate-180" />
          </Link>
        )}

        {mode === 'auth' ? (
          <Link
            to={paths.home}
            className="inline-flex size-11 items-center justify-center rounded-lg border border-line text-brand transition hover:bg-brand/5 md:hidden"
            aria-label="Close and go home"
          >
            <img src={assets.navClose} alt="" className="size-7 rotate-180" />
          </Link>
        ) : (
          <button
            type="button"
            className={`inline-flex size-11 items-center justify-center rounded-lg border text-brand backdrop-blur-sm md:hidden ${
              variant === 'overlay'
                ? 'border-brand/25 bg-white/90 shadow-sm'
                : 'border-line bg-white'
            }`}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <span className="sr-only">Menu</span>
            <svg
              className="size-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              {mobileOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        )}
      </Container>

      {mobileOpen && mode === 'marketing' ? (
        <div
          id="mobile-menu"
          className={`border-b px-4 py-4 shadow-md md:hidden ${
            variant === 'overlay'
              ? 'border-line/60 bg-white/98 backdrop-blur-md'
              : 'border-line bg-white'
          }`}
        >
          <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-4 sm:px-8">
            <Link
              to={paths.about}
              className="rounded-xl px-4 py-3 text-center text-base font-semibold text-brand"
              onClick={() => setMobileOpen(false)}
            >
              About
            </Link>
            <Link
              to={paths.blogs}
              className="rounded-xl px-4 py-3 text-center text-base font-semibold text-brand"
              onClick={() => setMobileOpen(false)}
            >
              Blogs
            </Link>
            <Link
              to={paths.contact}
              className="rounded-xl px-4 py-3 text-center text-base font-semibold text-brand"
              onClick={() => setMobileOpen(false)}
            >
              Contact
            </Link>
            <Link
              to={paths.login}
              className="rounded-xl px-4 py-3 text-center text-base font-semibold text-brand"
              onClick={() => setMobileOpen(false)}
            >
              Log In
            </Link>
            <Link
              to={paths.signup}
              className="rounded-full bg-brand px-4 py-3 text-center text-base font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
