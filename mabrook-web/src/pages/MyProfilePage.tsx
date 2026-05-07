import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { countryDialCodes, initialProfile } from '../data/profile.mock'
import { getMyProfile, updateMyProfile } from '../lib/api/realServices'

type FormState = {
  fullName: string
  email: string
  countryCode: string
  mobile: string
  imageUrl: string | null
}

type FieldErrors = Partial<
  Record<'fullName' | 'email' | 'mobile', string | undefined>
>

function cloneProfile(): FormState {
  return {
    fullName: initialProfile.fullName,
    email: initialProfile.email,
    countryCode: initialProfile.countryCode,
    mobile: initialProfile.mobile,
    imageUrl: initialProfile.imageUrl,
  }
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
}

const inputClass =
  'h-12 w-full rounded-xl border border-line bg-white px-4 text-brand-ink outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-footer disabled:opacity-70'

const labelClass = 'mb-2 block text-sm font-medium text-brand'

export function MyProfilePage() {
  const fileRef = useRef<HTMLInputElement>(null)

  const [baseline, setBaseline] = useState<FormState>(() => cloneProfile())
  const [form, setForm] = useState<FormState>(() => cloneProfile())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    void getMyProfile()
      .then((res) => {
        const payload = res.data
        const next: FormState = {
          fullName: payload.fullName,
          email: payload.email,
          countryCode: initialProfile.countryCode,
          mobile: payload.phone,
          imageUrl: payload.avatarUrl || null,
        }
        setBaseline(next)
        setForm(next)
      })
      .catch((err) => {
        setServerError(err instanceof Error ? err.message : 'Failed to load profile.')
      })
      .finally(() => setInitialLoading(false))
  }, [])

  const isDirty = useMemo(() => {
    return (
      form.fullName !== baseline.fullName ||
      form.email !== baseline.email ||
      form.countryCode !== baseline.countryCode ||
      form.mobile !== baseline.mobile ||
      form.imageUrl !== baseline.imageUrl
    )
  }, [form, baseline])

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setSuccessMessage('')
      setErrors((e) => {
        if (key === 'fullName' || key === 'email' || key === 'mobile') {
          const k = key as keyof FieldErrors
          if (!e[k]) return e
          return { ...e, [k]: undefined }
        }
        return e
      })
    },
    [],
  )

  const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const url = typeof reader.result === 'string' ? reader.result : null
      if (url) updateField('imageUrl', url)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = () => {
    updateField('imageUrl', null)
  }

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!form.fullName.trim()) next.fullName = 'Please enter your full name'
    if (!form.email.trim()) next.email = 'Please enter your email address'
    else if (!isValidEmail(form.email))
      next.email = 'Please enter a valid email address'
    if (!form.mobile.trim()) next.mobile = 'Please enter your mobile number'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const snapshot = { ...form }
    setLoading(true)
    setServerError('')
    setErrors({})
    void updateMyProfile({
      fullName: snapshot.fullName,
      phone: snapshot.mobile,
      avatarUrl: snapshot.imageUrl ?? '',
    })
      .then(() => {
        setBaseline(snapshot)
        setSuccessMessage('Your profile has been updated')
      })
      .catch((err) => {
        setServerError(err instanceof Error ? err.message : 'Failed to save profile.')
      })
      .finally(() => setLoading(false))
  }

  const submitLabel = loading
    ? 'Saving...'
    : successMessage && !isDirty
      ? 'Saved'
      : 'Save changes'

  const submitDisabled = loading || !isDirty

  const displayInitials = initialsFromName(form.fullName || 'User')
  const fieldDisabled = loading

  return (
    <div className="mx-auto max-w-2xl">
      <header className="mb-8">
        <h1 className="text-2xl font-black tracking-tight text-brand sm:text-3xl">
          My profile
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-brand/75 sm:text-base">
          Update your photo and personal details. Your email may be used for
          account notifications and recovery.
        </p>
      </header>

      {initialLoading ? (
        <div className="mb-6 rounded-xl border border-line bg-footer px-4 py-3 text-sm text-brand/80">
          Loading profile...
        </div>
      ) : null}
      {serverError ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}
      {successMessage ? (
        <div
          className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-900"
          role="status"
        >
          {successMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="border-b border-line pb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand/60">
            Profile photo
          </h2>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative size-28 shrink-0 overflow-hidden rounded-full border border-line bg-footer shadow-sm">
              {form.imageUrl ? (
                <img
                  src={form.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-brand/10 text-2xl font-bold text-brand">
                  {displayInitials}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={fieldDisabled}
                onChange={onPickImage}
              />
              <button
                type="button"
                disabled={fieldDisabled}
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition hover:bg-footer disabled:cursor-not-allowed disabled:opacity-50"
              >
                Change image
              </button>
              <button
                type="button"
                disabled={fieldDisabled || !form.imageUrl}
                onClick={removeImage}
                className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-brand/80 shadow-sm transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove image
              </button>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              disabled={fieldDisabled}
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className={`${inputClass} ${errors.fullName ? 'border-red-400' : ''}`}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName ? (
              <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={fieldDisabled}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={`${inputClass} ${errors.email ? 'border-red-400' : ''}`}
              aria-invalid={!!errors.email}
            />
            {errors.email ? (
              <p className="mt-2 text-sm text-red-600">{errors.email}</p>
            ) : null}
          </div>

          <div>
            <span className={labelClass}>Mobile number</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div className="relative sm:w-52">
                <label htmlFor="countryCode" className="sr-only">
                  Country code
                </label>
                <select
                  id="countryCode"
                  disabled={fieldDisabled}
                  value={form.countryCode}
                  onChange={(e) => updateField('countryCode', e.target.value)}
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-4 pr-10 text-brand-ink outline-none transition focus:border-brand disabled:cursor-not-allowed disabled:bg-footer disabled:opacity-70"
                >
                  {countryDialCodes.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand/50">
                  <svg
                    className="size-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <label htmlFor="mobile" className="sr-only">
                  Mobile number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  disabled={fieldDisabled}
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', e.target.value)}
                  placeholder="501234567"
                  className={`${inputClass} ${errors.mobile ? 'border-red-400' : ''}`}
                  aria-invalid={!!errors.mobile}
                />
                {errors.mobile ? (
                  <p className="mt-2 text-sm text-red-600">{errors.mobile}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={submitDisabled}
            className="min-w-[140px] rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
