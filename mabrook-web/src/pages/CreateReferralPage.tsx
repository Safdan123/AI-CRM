import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'
import { getTokenPayload } from '../lib/api/http'
import { campaignService } from '../lib/api'
import { createReferral } from '../lib/api/realServices'
import type { Campaign } from '../lib/api/types'

type FormState = {
  customerName: string
  phone: string
  campaign: string
  relationship: string
  notes: string
}

type FormErrors = Partial<Record<keyof FormState, string>>

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const inputClass =
  'h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-brand-ink outline-none transition focus:border-brand'

const relationshipOptions = ['Friend', 'Family', 'Colleague', 'Client', 'Other']

const initialForm: FormState = {
  customerName: '',
  phone: '',
  campaign: '',
  relationship: '',
  notes: '',
}

function validate(form: FormState) {
  const errors: FormErrors = {}
  if (!form.customerName.trim()) errors.customerName = 'Customer name is required'
  if (!form.phone.trim()) errors.phone = 'Phone is required'
  else if (!/^[+\d\s-]{8,}$/.test(form.phone.trim()))
    errors.phone = 'Enter a valid phone number'
  if (!form.campaign) errors.campaign = 'Campaign is required'
  if (!form.relationship) errors.relationship = 'Relationship is required'
  if (!form.notes.trim()) errors.notes = 'Referral notes are required'
  return errors
}

export function CreateReferralPage() {
  const navigate = useNavigate()
  const role = getTokenPayload()?.role
  const canCreateReferral = role === 'admin' || role === 'broker'
  const [form, setForm] = useState<FormState>(initialForm)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    void campaignService
      .list()
      .then((res) => {
        setCampaigns(res.data)
      })
      .catch(() => {
        setCampaigns([])
      })
  }, [])

  const errors = useMemo(() => validate(form), [form])
  const hasErrors = Object.keys(errors).length > 0

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreateReferral) return
    setSubmitted(true)
    setSubmitError('')
    if (hasErrors) return

    setSaving(true)
    void createReferral({
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      campaignId: form.campaign,
      relationship: form.relationship,
      notes: form.notes.trim(),
    })
      .then(() => {
        navigate(paths.brokerReferrals)
      })
      .catch((err) => {
        setSubmitError(err instanceof Error ? err.message : 'Failed to submit referral.')
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Jack Morris" userEmail="jack.morris@mabrook.app" />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Referrals / Create Referral</p>
        </section>
        <section className="border-t border-line pb-16 pt-7">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="mb-6 flex items-center gap-3">
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
                Create Referral
              </h1>
            </div>

            <form onSubmit={onSubmit}>
              {!canCreateReferral ? (
                <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Only admins and brokers can submit referrals.
                </p>
              ) : null}
              <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-brand">Customer Information</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-brand/85">
                      Customer Name
                    </label>
                    <input
                      value={form.customerName}
                      onChange={(e) => update('customerName', e.target.value)}
                      className={`${inputClass} ${submitted && errors.customerName ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.customerName ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.customerName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-brand/85">Phone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      className={`${inputClass} ${submitted && errors.phone ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.phone ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-brand/85">
                      Campaign
                    </label>
                    <select
                      value={form.campaign}
                      onChange={(e) => update('campaign', e.target.value)}
                      className={`${inputClass} ${submitted && errors.campaign ? 'border-red-400' : ''}`}
                    >
                      <option value="">Select campaign</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {submitted && errors.campaign ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.campaign}</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-brand/85">
                      Referral Relationship
                    </label>
                    <select
                      value={form.relationship}
                      onChange={(e) => update('relationship', e.target.value)}
                      className={`${inputClass} ${submitted && errors.relationship ? 'border-red-400' : ''}`}
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {submitted && errors.relationship ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.relationship}</p>
                    ) : null}
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-medium text-brand/85">
                      Referral Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update('notes', e.target.value)}
                      className={`h-28 w-full rounded-md border border-line px-3 py-2 text-sm outline-none transition focus:border-brand ${
                        submitted && errors.notes ? 'border-red-400' : ''
                      }`}
                    />
                    {submitted && errors.notes ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.notes}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                {submitError ? (
                  <p className="w-full text-right text-xs text-red-600">{submitError}</p>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-10 rounded-full border border-line px-6 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canCreateReferral || saving}
                  className="h-10 rounded-full bg-brand px-7 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {saving ? 'Submitting...' : 'Submit Referral'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
