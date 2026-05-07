import { useState } from 'react'
import {
  IconGoogle,
  IconLinkedIn,
  IconTelegram,
} from '../auth/SocialProviderIcons'

const SHARE_ICONS = [
  { label: 'Google', Icon: IconGoogle },
  { label: 'LinkedIn', Icon: IconLinkedIn },
  { label: 'Telegram', Icon: IconTelegram },
] as const

type Props = {
  campaignTitle: string
  referralUrl: string
}

export function CampaignReferralSection({
  campaignTitle,
  referralUrl,
}: Props) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      id="campaign"
      className="scroll-mt-24 border-b border-line bg-white py-8 sm:py-9"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-[120px]">
        <h2 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
          {campaignTitle}
        </h2>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand/55">
              Copy invite link
            </p>
            <div className="flex min-w-0 items-center gap-2 rounded-md border border-line px-3 py-2">
              <label className="sr-only" htmlFor="referral-link">
                Referral link
              </label>
              <input
                id="referral-link"
                readOnly
                value={referralUrl}
                className="min-w-0 flex-1 bg-transparent text-xs text-brand outline-none"
              />
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex size-7 items-center justify-center rounded-full border border-line text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                aria-label="Copy invite link"
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
                  <path
                    d="M9 9h10v10H9zM5 5h10v2H7v8H5z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
            {copied ? (
              <p className="mt-1 text-xs font-medium text-green-700">Copied</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand/55">
              Share to social media
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {SHARE_ICONS.map(({ label, Icon }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={`Share on ${label}`}
                  className="inline-flex size-7 items-center justify-center rounded-full border border-line bg-white text-brand shadow-sm transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-brand/65">
          Link-based referrals are the primary flow. Share this unique campaign link
          to acquire and track conversions.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line bg-footer/55 p-3">
            <p className="text-xs text-brand/60">Link Clicks</p>
            <p className="mt-1 text-2xl font-bold text-brand">1,420</p>
          </div>
          <div className="rounded-xl border border-line bg-footer/55 p-3">
            <p className="text-xs text-brand/60">Signups from Link</p>
            <p className="mt-1 text-2xl font-bold text-brand">204</p>
          </div>
          <div className="rounded-xl border border-line bg-footer/55 p-3">
            <p className="text-xs text-brand/60">Conversion Rate</p>
            <p className="mt-1 text-2xl font-bold text-brand">14.3%</p>
          </div>
        </div>
      </div>
    </section>
  )
}
