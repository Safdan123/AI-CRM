import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { assets } from '../siteAssets'

const team = [
  {
    name: 'Ayesha Khan',
    role: 'Product & Community Lead',
    bio: 'Builds referral experiences that are easy to trust and simple to use for first-time users.',
  },
  {
    name: 'Hamza Ali',
    role: 'Engineering Lead',
    bio: 'Designs secure backend workflows with clean APIs and reliable MongoDB Atlas integrations.',
  },
  {
    name: 'Sara Ahmed',
    role: 'Growth & Support',
    bio: 'Helps brokers and customers onboard quickly through support, content, and campaign guidance.',
  },
]

export function AboutPage() {
  return (
    <div className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white">
      <Header variant="default" mode="marketing" />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-8 lg:py-12">
        <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">About Mabrook</h1>
        <p className="mt-2 text-sm text-brand/70">
          Meet the team and learn the story behind our referral rewards platform.
        </p>

        <section className="mt-6 rounded-2xl border border-line bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={assets.avatarUser}
              alt="Mabrook team"
              className="size-20 rounded-full border border-line bg-footer object-cover"
            />
            <div>
              <h2 className="text-lg font-semibold text-brand">Our Biography</h2>
              <p className="mt-1 text-sm text-brand/80">
                Mabrook started as a semester project focused on ethical, transparent referral rewards.
                Our mission is to help businesses grow while giving users a secure and friendly digital experience.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {team.map((member) => (
            <article key={member.name} className="rounded-2xl border border-line bg-white p-5">
              <img
                src={assets.avatarUser}
                alt={`${member.name} profile`}
                className="size-16 rounded-full border border-line bg-footer object-cover"
              />
              <h3 className="mt-3 text-base font-semibold text-brand">{member.name}</h3>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-brand/60">{member.role}</p>
              <p className="mt-2 text-sm text-brand/80">{member.bio}</p>
            </article>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  )
}
