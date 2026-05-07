import { useEffect, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { getPublicContact, type PublicContactPayload } from '../lib/api/realServices'

export function ContactPage() {
  const [contact, setContact] = useState<PublicContactPayload | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    void getPublicContact()
      .then((res) => setContact(res.data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load contact details.')
      })
  }, [])

  return (
    <div className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white">
      <Header variant="default" mode="marketing" />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-8 lg:py-12">
        <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">Contact & Location</h1>
        <p className="mt-2 text-sm text-brand/70">
          Reach out to our support team and find our office location.
        </p>

        {contact ? (
          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-brand">Contact Information</h2>
              <p className="mt-3 text-sm text-brand/80">
                <span className="font-semibold text-brand">Email:</span> {contact.email}
              </p>
              <p className="mt-2 text-sm text-brand/80">
                <span className="font-semibold text-brand">Phone:</span> {contact.phone}
              </p>
              <p className="mt-2 text-sm text-brand/80">
                <span className="font-semibold text-brand">Address:</span> {contact.address}
              </p>
              <div className="mt-5">
                <a
                  href={contact.googleMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Open Google Map
                </a>
              </div>
            </article>

            <article className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-lg font-semibold text-brand">Social Links</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <a className="rounded-full border border-line px-4 py-2 text-sm text-brand hover:bg-footer" href={contact.social.facebook} target="_blank" rel="noopener noreferrer">Facebook</a>
                <a className="rounded-full border border-line px-4 py-2 text-sm text-brand hover:bg-footer" href={contact.social.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
                <a className="rounded-full border border-line px-4 py-2 text-sm text-brand hover:bg-footer" href={contact.social.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
              </div>
            </article>
          </section>
        ) : null}

        {!contact && !error ? (
          <p className="mt-6 rounded-xl border border-line bg-footer/50 px-4 py-3 text-sm text-brand/75">
            Loading contact information...
          </p>
        ) : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      </main>
      <Footer />
    </div>
  )
}
