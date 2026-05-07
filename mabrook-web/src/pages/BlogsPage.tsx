import { useEffect, useState } from 'react'
import { Footer } from '../components/layout/Footer'
import { Header } from '../components/layout/Header'
import { listBlogs, type BlogPayload } from '../lib/api/realServices'

export function BlogsPage() {
  const [blogs, setBlogs] = useState<BlogPayload[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    void listBlogs()
      .then((res) => setBlogs(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load blogs.'))
  }, [])

  return (
    <div className="flex min-h-svh w-full max-w-full flex-col overflow-x-hidden bg-white">
      <Header variant="default" mode="marketing" />
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-8 sm:px-8 lg:py-12">
        <h1 className="text-[34px] font-bold leading-tight text-brand max-sm:text-3xl">Blogs</h1>
        <p className="mt-2 text-sm text-brand/70">Insights, updates, and project announcements.</p>
        <section className="mt-6 space-y-4">
          {blogs.map((blog) => (
            <article key={blog._id} className="rounded-2xl border border-line bg-white p-5">
              <h2 className="text-xl font-semibold text-brand">{blog.title}</h2>
              <p className="mt-2 whitespace-pre-line text-sm text-brand/80">{blog.body}</p>
              {blog.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {blog.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-footer px-3 py-1 text-xs text-brand/70">
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
          {blogs.length === 0 && !error ? (
            <p className="rounded-xl border border-line bg-footer/50 px-4 py-3 text-sm text-brand/75">
              No blog posts yet.
            </p>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </section>
      </main>
      <Footer />
    </div>
  )
}
