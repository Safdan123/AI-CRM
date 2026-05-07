import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { Footer } from '../components/layout/Footer'
import { paths } from '../config/paths'
import { getTokenPayload } from '../lib/api/http'

type PositionReward = {
  id: string
  position: string
  reward: string
}

type FormState = {
  campaignName: string
  totalRewardAmount: string
  startDate: string
  endDate: string
  positions: PositionReward[]
}

type FormErrors = {
  campaignName?: string
  totalRewardAmount?: string
  startDate?: string
  endDate?: string
  positions: Array<{ position?: string; reward?: string }>
}

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

const inputClass =
  'h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-brand-ink outline-none transition focus:border-brand'

const labelClass = 'mb-2 block text-xs font-medium text-brand/85'

const emptyPositionRow = (index: number): PositionReward => ({
  id: `pos-${Date.now()}-${index}`,
  position: String(index + 1),
  reward: '',
})

const initialForm: FormState = {
  campaignName: '',
  totalRewardAmount: '',
  startDate: '',
  endDate: '',
  positions: [emptyPositionRow(0)],
}

function isPositiveNumber(v: string) {
  const normalized = v.replace(/[$,\s]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) && n > 0
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = { positions: form.positions.map(() => ({})) }

  if (!form.campaignName.trim()) {
    errors.campaignName = 'Campaign name is required'
  }
  if (!form.totalRewardAmount.trim()) {
    errors.totalRewardAmount = 'Total reward amount is required'
  } else if (!isPositiveNumber(form.totalRewardAmount)) {
    errors.totalRewardAmount = 'Enter a valid amount greater than 0'
  }

  if (!form.startDate) errors.startDate = 'Start date is required'
  if (!form.endDate) errors.endDate = 'End date is required'

  if (form.startDate && form.endDate && form.endDate <= form.startDate) {
    errors.endDate = 'End date must be after start date'
  }

  form.positions.forEach((row, idx) => {
    if (!row.position.trim()) {
      errors.positions[idx].position = 'Leaderboard position is required'
    } else if (!Number.isInteger(Number(row.position)) || Number(row.position) <= 0) {
      errors.positions[idx].position = 'Position must be a positive whole number'
    }
    if (!row.reward.trim()) {
      errors.positions[idx].reward = 'Reward is required'
    } else if (!isPositiveNumber(row.reward)) {
      errors.positions[idx].reward = 'Reward must be greater than 0'
    }
  })

  return errors
}

function hasErrors(errors: FormErrors) {
  if (
    errors.campaignName ||
    errors.totalRewardAmount ||
    errors.startDate ||
    errors.endDate
  ) {
    return true
  }
  return errors.positions.some((item) => item.position || item.reward)
}

export function CreateCampaignPage() {
  const navigate = useNavigate()
  const role = getTokenPayload()?.role
  const canCreateCampaign = role === 'admin'
  const [form, setForm] = useState<FormState>(initialForm)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  const errors = useMemo(() => validateForm(form), [form])
  const invalid = hasErrors(errors)
  const createDisabled = saving || invalid

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const setPositionField = (
    index: number,
    key: keyof PositionReward,
    value: string,
  ) => {
    setForm((prev) => {
      const next = [...prev.positions]
      next[index] = { ...next[index], [key]: value }
      return { ...prev, positions: next }
    })
  }

  const addPositionRow = () => {
    setForm((prev) => ({
      ...prev,
      positions: [...prev.positions, emptyPositionRow(prev.positions.length)],
    }))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canCreateCampaign) return
    setSubmitted(true)
    if (invalid) return

    setSaving(true)
    const payload = {
      ...form,
      createdAt: new Date().toISOString(),
    }
    window.setTimeout(() => {
      const current = localStorage.getItem('mockCampaignCreations')
      const parsed = current ? (JSON.parse(current) as unknown[]) : []
      localStorage.setItem('mockCampaignCreations', JSON.stringify([payload, ...parsed]))
      console.log('Create campaign payload:', payload)
      setSaving(false)
      navigate(paths.campaigns)
    }, 700)
  }

  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Jack Morris" userEmail="jack.morris@mabrook.app" />
      <main className="flex-1 bg-white">
        <section className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-8 lg:px-[120px]">
          <p className="text-xs text-brand/55">Home / Campaigns / Create New Campaign</p>
        </section>

        <section className="border-t border-line pb-16 pt-10">
          <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-8">
            <div className="mb-8 flex items-center gap-3">
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
              <h1 className="text-[36px] font-bold leading-tight text-brand max-sm:text-3xl">
                Create new campaign
              </h1>
            </div>

            <form onSubmit={handleCreate}>
              {!canCreateCampaign ? (
                <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Only admins can create campaigns.
                </p>
              ) : null}
              <section className="pb-10">
                <h2 className="mb-4 text-[22px] font-semibold text-brand">Campaign details</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="campaignName" className={labelClass}>
                      Campaign Name
                    </label>
                    <input
                      id="campaignName"
                      value={form.campaignName}
                      onChange={(e) => setField('campaignName', e.target.value)}
                      className={`${inputClass} ${submitted && errors.campaignName ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.campaignName ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.campaignName}</p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="totalRewardAmount" className={labelClass}>
                      Total Reward Amount
                    </label>
                    <input
                      id="totalRewardAmount"
                      value={form.totalRewardAmount}
                      onChange={(e) => setField('totalRewardAmount', e.target.value)}
                      placeholder="$250"
                      className={`${inputClass} ${submitted && errors.totalRewardAmount ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.totalRewardAmount ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.totalRewardAmount}</p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="startDate" className={labelClass}>
                      Start Date
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setField('startDate', e.target.value)}
                      className={`${inputClass} ${submitted && errors.startDate ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.startDate ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.startDate}</p>
                    ) : null}
                  </div>
                  <div>
                    <label htmlFor="endDate" className={labelClass}>
                      End Date
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setField('endDate', e.target.value)}
                      className={`${inputClass} ${submitted && errors.endDate ? 'border-red-400' : ''}`}
                    />
                    {submitted && errors.endDate ? (
                      <p className="mt-1.5 text-xs text-red-600">{errors.endDate}</p>
                    ) : null}
                  </div>
                </div>
              </section>

              <section className="border-t border-line py-8">
                <h2 className="mb-4 text-[22px] font-semibold text-brand">
                  Set leaderboard positions
                </h2>

                <div className="space-y-4">
                  {form.positions.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                      <div>
                        <label htmlFor={`position-${row.id}`} className={labelClass}>
                          Leaderboard Position
                        </label>
                        <input
                          id={`position-${row.id}`}
                          value={row.position}
                          onChange={(e) =>
                            setPositionField(index, 'position', e.target.value)
                          }
                          className={`${inputClass} ${
                            submitted && errors.positions[index]?.position
                              ? 'border-red-400'
                              : ''
                          }`}
                        />
                        {submitted && errors.positions[index]?.position ? (
                          <p className="mt-1.5 text-xs text-red-600">
                            {errors.positions[index]?.position}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <label htmlFor={`reward-${row.id}`} className={labelClass}>
                          Reward
                        </label>
                        <input
                          id={`reward-${row.id}`}
                          value={row.reward}
                          onChange={(e) =>
                            setPositionField(index, 'reward', e.target.value)
                          }
                          placeholder="$150"
                          className={`${inputClass} ${
                            submitted && errors.positions[index]?.reward ? 'border-red-400' : ''
                          }`}
                        />
                        {submitted && errors.positions[index]?.reward ? (
                          <p className="mt-1.5 text-xs text-red-600">
                            {errors.positions[index]?.reward}
                          </p>
                        ) : null}
                      </div>
                      {index === 0 ? (
                        <button
                          type="button"
                          onClick={addPositionRow}
                          className="h-10 rounded-full border border-line px-6 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                        >
                          + Add new
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-4 flex flex-wrap items-center justify-end gap-3 border-t border-line pt-8">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-10 min-w-[92px] rounded-full border border-line px-6 text-sm font-semibold text-brand transition hover:border-brand hover:bg-brand hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDisabled || !canCreateCampaign}
                  className="h-10 min-w-[92px] rounded-full bg-brand px-8 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand/35"
                >
                  {saving ? 'Creating...' : 'Create'}
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
