import { useEffect, useState, type FormEvent } from 'react'
import {
  createNotification,
  listAdminUsers,
} from '../../lib/api/realServices'

type AdminUser = {
  id: string
  fullName: string
  email: string
  role: 'admin' | 'broker' | 'user' | 'support'
}

export function AdminNotificationsPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [targetUserId, setTargetUserId] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void listAdminUsers()
      .then((res) => {
        setUsers(res.data)
        setTargetUserId(res.data[0]?.id ?? '')
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Failed to load users.'),
      )
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')
    try {
      await createNotification({ userId: targetUserId, title, body })
      setStatus('Notification sent.')
      setTitle('')
      setBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send notification.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">Notifications</h1>
      <p className="mb-5 text-sm text-brand/70">
        Send account notifications to users, brokers, and admins.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-2xl border border-line bg-white p-5"
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-brand">Recipient</span>
          <select
            value={targetUserId}
            onChange={(event) => setTargetUserId(event.target.value)}
            className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-brand"
            required
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.fullName} ({user.role}) - {user.email}
              </option>
            ))}
          </select>
        </label>

        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Title"
          className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-brand"
          required
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Notification message"
          className="h-28 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          required
        />
        <button
          type="submit"
          className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Send notification
        </button>
        {status ? <p className="text-sm text-green-700">{status}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  )
}
