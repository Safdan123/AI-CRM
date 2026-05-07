import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  fetchMyNotifications,
  markAllNotificationsReadThunk,
  markNotificationReadThunk,
} from '../../store/slices/notificationsSlice'

export function UserNotificationsPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.notifications.items)
  const loading = useAppSelector((state) => state.notifications.loading)
  const storeError = useAppSelector((state) => state.notifications.error)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void dispatch(fetchMyNotifications())
  }, [dispatch])

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">
        Notifications
      </h1>
      <p className="mt-2 text-sm text-brand/70">
        Stay updated with referral, rewards, and campaign events.
      </p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-brand/60">
          Unread: {items.filter((item) => !item.isRead).length} / {items.length}
        </p>
        <button
          type="button"
          className="rounded-full border border-line px-4 py-2 text-xs font-semibold text-brand transition hover:bg-footer disabled:opacity-60"
          disabled={items.every((item) => item.isRead)}
          onClick={() => {
            setError('')
            setStatus('')
            void dispatch(markAllNotificationsReadThunk())
              .unwrap()
              .then(() => setStatus('Marked all notifications as read.'))
              .catch((err) => setError(err instanceof Error ? err.message : 'Failed to mark all as read.'))
          }}
        >
          Mark all read
        </button>
      </div>

      <section className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item._id} className={`rounded-2xl border p-4 ${item.isRead ? 'border-line bg-white' : 'border-brand/25 bg-brand/5'}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-brand">{item.title}</h2>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${item.isRead ? 'bg-footer text-brand/65' : 'bg-brand text-white'}`}>
                  {item.isRead ? 'Read' : 'Unread'}
                </span>
                <span className="text-xs text-brand/60">
                  {new Date(item.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-brand/80">{item.body}</p>
            {!item.isRead ? (
              <button
                type="button"
                className="mt-3 rounded-full border border-line px-3 py-1 text-xs font-semibold text-brand transition hover:bg-footer"
                onClick={() => {
                  setError('')
                  setStatus('')
                  void dispatch(markNotificationReadThunk(item._id))
                    .unwrap()
                    .then(() => setStatus('Notification marked as read.'))
                    .catch((err) => setError(err instanceof Error ? err.message : 'Failed to mark notification as read.'))
                }}
              >
                Mark as read
              </button>
            ) : null}
          </article>
        ))}
        {loading ? (
          <p className="rounded-xl border border-line bg-footer/50 px-4 py-3 text-sm text-brand/75">
            Loading notifications...
          </p>
        ) : null}
        {items.length === 0 && !error && !loading ? (
          <p className="rounded-xl border border-line bg-footer/50 px-4 py-3 text-sm text-brand/75">
            No notifications yet.
          </p>
        ) : null}
        {status ? <p className="text-sm text-green-700">{status}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {storeError && !error ? <p className="text-sm text-red-600">{storeError}</p> : null}
      </section>
    </div>
  )
}
