/**
 * Static files live in `public/`; Vite serves them at the site root, or under `base` in production.
 */

/** Resolves a path relative to `public/` (e.g. `assets/logo/mark.svg` → correct URL with `base`). */
export function publicAsset(relativePath: string): string {
  const base = import.meta.env.BASE_URL ?? '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const rel = relativePath.replace(/^\/+/, '')
  return `${normalizedBase}${rel}`
}

export const assets = {
  hero: publicAsset('assets/marketing/hero.png'),
  dashboardHero: publicAsset('assets/marketing/hero-dashboard-broker.png'),
  arrowDown: publicAsset('assets/icons/arrow-down.svg'),
  navClose: publicAsset('assets/icons/nav-close.svg'),
  logoPieces: {
    vector0: publicAsset('assets/logo/vector-0.svg'),
    vector1: publicAsset('assets/logo/vector-1.svg'),
    vector2: publicAsset('assets/logo/vector-2.svg'),
    vector3: publicAsset('assets/logo/vector-3.svg'),
    vector4: publicAsset('assets/logo/vector-4.svg'),
    vector5: publicAsset('assets/logo/vector-5.svg'),
    vector6: publicAsset('assets/logo/vector-6.svg'),
    mark: publicAsset('assets/logo/mark.svg'),
    vector7: publicAsset('assets/logo/vector-7.svg'),
    vector8: publicAsset('assets/logo/vector-8.svg'),
    vector9: publicAsset('assets/logo/vector-9.svg'),
    vector10: publicAsset('assets/logo/vector-10.svg'),
    vector11: publicAsset('assets/logo/vector-11.svg'),
  },
  footerLogoMark: publicAsset('assets/logo/footer-mark.svg'),
  logoIcon: publicAsset('assets/logo/logoIcon.png'),
  socialLinkedin: publicAsset('assets/social/linkedin.svg'),
  socialFacebook: publicAsset('assets/social/facebook.svg'),
  socialInstagram: publicAsset('assets/social/instagram.svg'),
  socialTelegram: publicAsset('assets/social/telegram.svg'),
  avatarUser: publicAsset('assets/avatars/avatar-user.svg'),
} as const
