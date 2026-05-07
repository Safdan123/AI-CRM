import { useNavigate, useParams } from 'react-router-dom'

export function AdminCustomerDetailPage() {
  const navigate = useNavigate()
  const { customerId = 'CUS-100' } = useParams<{ customerId: string }>()

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-9 items-center justify-center rounded-full border border-line text-brand transition hover:border-brand hover:bg-brand hover:text-white"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
            <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-[30px] font-bold text-brand">Customer Detail: {customerId}</h1>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs text-brand/60">Name</p>
            <p className="mt-1 font-semibold text-brand">Customer 1</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">Status</p>
            <p className="mt-1 font-semibold text-brand">Lead</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">Assigned Broker</p>
            <p className="mt-1 font-semibold text-brand">Ahmad Stan</p>
          </div>
          <div>
            <p className="text-xs text-brand/60">AI Prediction</p>
            <p className="mt-1 font-semibold text-brand">High conversion likelihood</p>
          </div>
        </div>
      </div>
    </div>
  )
}
