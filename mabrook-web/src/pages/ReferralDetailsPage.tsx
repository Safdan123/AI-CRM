import { useNavigate, useParams } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

export function ReferralDetailsPage() {
  const navigate = useNavigate()
  const { referralId = 'RF-1023' } = useParams<{ referralId: string }>()

  const timeline = [
    { step: 'Submitted', date: '2026-05-02 10:22 AM', active: true },
    { step: 'In Review', date: '2026-05-03 01:15 PM', active: true },
    { step: 'Converted', date: '--', active: false },
    { step: 'Rewarded', date: '--', active: false },
  ]

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Jack Morris" userEmail="jack.morris@mabrook.app" />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Referrals / {referralId}</p>
        </section>
        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="mb-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex size-9 items-center justify-center rounded-full border border-line text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                aria-label="Go back"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                  <path
                    d="m15 18-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
                Referral Details
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="rounded-2xl border border-line bg-white p-5 lg:col-span-2">
                <h2 className="text-lg font-semibold text-brand">Referral Information</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Referral ID</p>
                    <p className="mt-1 font-semibold text-brand">{referralId}</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Customer Name</p>
                    <p className="mt-1 font-semibold text-brand">Ali Raza</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Phone</p>
                    <p className="mt-1 font-semibold text-brand">+92 301 0000001</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3">
                    <p className="text-xs text-brand/60">Campaign</p>
                    <p className="mt-1 font-semibold text-brand">Campaign 10</p>
                  </div>
                  <div className="rounded-xl bg-footer/60 p-3 md:col-span-2">
                    <p className="text-xs text-brand/60">Referral Notes</p>
                    <p className="mt-1 text-sm text-brand/80">
                      Customer is interested in investment options and requested a
                      callback this week.
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5">
                <h2 className="text-lg font-semibold text-brand">Status Timeline</h2>
                <ul className="mt-4 space-y-3">
                  {timeline.map((item) => (
                    <li key={item.step} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex size-4 shrink-0 rounded-full border ${
                          item.active
                            ? 'border-green-500 bg-green-500'
                            : 'border-line bg-white'
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-brand">{item.step}</p>
                        <p className="text-xs text-brand/60">{item.date}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
