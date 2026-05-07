import { useEffect, useState, type FormEvent } from 'react'
import type { BlogPayload } from '../../lib/api/realServices'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import {
  createBlogThunk,
  deleteBlogThunk,
  fetchBlogs,
  updateBlogThunk,
} from '../../store/slices/blogsSlice'

export function AdminBlogsPage() {
  const dispatch = useAppDispatch()
  const items = useAppSelector((state) => state.blogs.items)
  const loading = useAppSelector((state) => state.blogs.loading)
  const storeError = useAppSelector((state) => state.blogs.error)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState('')
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void dispatch(fetchBlogs())
  }, [dispatch])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setStatus('')
    const parsedTags = tags
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    try {
      if (editingBlogId) {
        await dispatch(
          updateBlogThunk({
            blogId: editingBlogId,
            title,
            body,
            tags: parsedTags,
          }),
        ).unwrap()
        setStatus('Blog updated.')
      } else {
        await dispatch(
          createBlogThunk({
            title,
            body,
            tags: parsedTags,
          }),
        ).unwrap()
        setStatus('Blog published.')
      }
      setTitle('')
      setBody('')
      setTags('')
      setEditingBlogId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save blog.')
    }
  }

  function beginEdit(item: BlogPayload) {
    setEditingBlogId(item._id)
    setTitle(item.title)
    setBody(item.body)
    setTags(item.tags.join(', '))
    setError('')
    setStatus('')
  }

  async function handleDelete(blogId: string) {
    setError('')
    setStatus('')
    try {
      await dispatch(deleteBlogThunk(blogId)).unwrap()
      if (editingBlogId === blogId) {
        setEditingBlogId(null)
        setTitle('')
        setBody('')
        setTags('')
      }
      setStatus('Blog deleted.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete blog.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="mb-4 text-[30px] font-bold text-brand">Blogs</h1>
      <p className="mb-5 text-sm text-brand/70">Create, edit, and manage website blog posts.</p>

      <form onSubmit={handleSubmit} className="mb-6 space-y-3 rounded-2xl border border-line bg-white p-5">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Blog title"
          className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-brand"
          required
        />
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Blog content"
          className="h-28 w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          required
        />
        <input
          value={tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder="tags, comma, separated"
          className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {editingBlogId ? 'Update blog' : 'Publish blog'}
        </button>
        {editingBlogId ? (
          <button
            type="button"
            className="ml-2 h-10 rounded-full border border-line px-5 text-sm font-semibold text-brand transition hover:bg-footer"
            onClick={() => {
              setEditingBlogId(null)
              setTitle('')
              setBody('')
              setTags('')
              setStatus('')
              setError('')
            }}
          >
            Cancel edit
          </button>
        ) : null}
        {status ? <p className="text-sm text-green-700">{status}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="rounded-xl border border-line bg-footer/50 px-4 py-3 text-sm text-brand/75">
            Loading blogs...
          </p>
        ) : null}
        {items.map((item) => (
          <article key={item._id} className="rounded-xl border border-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-brand">{item.title}</h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => beginEdit(item)}
                  className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-brand transition hover:bg-footer"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(item._id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-2 text-sm text-brand/80">{item.body}</p>
            {item.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={`${item._id}-${tag}`} className="rounded-full bg-footer px-2 py-0.5 text-xs text-brand/70">
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
        {storeError && !error ? <p className="text-sm text-red-600">{storeError}</p> : null}
      </div>
    </div>
  )
}
