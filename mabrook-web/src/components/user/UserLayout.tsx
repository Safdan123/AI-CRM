import { Outlet } from 'react-router-dom'
import { DashboardHeader } from '../dashboard/DashboardHeader'
import { Footer } from '../layout/Footer'
import { UserSidebar } from './UserSidebar'

const PAGE_WRAP =
  'flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white'

export function UserLayout() {
  return (
    <div className={PAGE_WRAP}>
      <DashboardHeader userName="Ahmad Stan" userEmail="ahmad.stan@mail.com" />
      <div className="flex flex-1 flex-col border-t border-line bg-footer/40 lg:flex-row">
        <aside className="border-b border-line bg-white px-4 py-4 lg:w-72 lg:shrink-0 lg:border-b-0 lg:border-r lg:px-6 lg:py-10">
          <p className="mb-3 hidden text-xs font-semibold uppercase tracking-wider text-brand/50 lg:block">
            Referred User
          </p>
          <UserSidebar />
        </aside>
        <main className="min-w-0 flex-1 bg-white px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  )
}
