import { assets } from '../../siteAssets'

/**
 * Broker dashboard hero — full-bleed image with copy overlaid on the left.
 */
export function DashboardHero() {
  return (
    <section className="relative min-h-[320px] overflow-hidden border-b border-line bg-[#f9fafb] sm:min-h-[360px] lg:min-h-[400px]">
      <img
        src={assets.dashboardHero}
        alt=""
        className="absolute inset-x-0 -top-10 h-[115%] min-h-full w-full object-cover object-[82%_top] sm:-top-12 sm:object-[88%_top] lg:-top-14"
        aria-hidden
      />
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col justify-center px-4 py-10 sm:px-8 sm:py-12 lg:px-[120px] lg:py-14">
        <div className="max-w-[520px]">
          <h1 className="text-[clamp(1.75rem,3.5vw,2.75rem)] font-black uppercase leading-[1.02] tracking-[-0.02em] text-brand">
            Start sharing to
            <br />
            climb leaderboard
          </h1>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-4 py-2 text-sm font-semibold text-brand transition hover:bg-[#bae6fd]"
          >
            <span
              className="inline-flex size-5 items-center justify-center rounded-full border border-brand/25 text-[11px] font-bold"
              aria-hidden
            >
              ?
            </span>
            How it works
          </button>
          <p className="mt-4 max-w-[480px] text-sm leading-relaxed text-brand/75 sm:text-[15px]">
            Share and get to the front line to use our new Halal Investment Super App!
            Refer as many people as possible, and the top 5 on the leaderboard will have
            $1000 cash to invest!
          </p>
        </div>
      </div>
    </section>
  )
}
