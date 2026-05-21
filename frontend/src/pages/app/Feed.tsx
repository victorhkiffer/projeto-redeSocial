import { useEffect, useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { apiFetch } from '../../lib/api'

type Post = {
  id: string
  company: { id: string; name: string }
  content: string
  createdAt: string
  likesCount: number
  commentsCount: number
  likedByMe: boolean
}

type Comment = {
  id: string
  content: string
  createdAt: string
  company: { id: string; name: string }
}

export default function Feed() {
  const { accessToken } = useAuth()
  const token = accessToken ?? ''

  const [content, setContent] = useState('')
  const [items, setItems] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch<{ items: Post[] }>('/posts?limit=20', { token })
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createPost(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await apiFetch('/posts', { method: 'POST', token, body: JSON.stringify({ content }) })
      setContent('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao criar post')
    }
  }

  async function toggleLike(post: Post) {
    setError(null)
    try {
      if (post.likedByMe) {
        await apiFetch(`/posts/${post.id}/unlike`, { method: 'POST', token, body: JSON.stringify({}) })
      } else {
        await apiFetch(`/posts/${post.id}/like`, { method: 'POST', token, body: JSON.stringify({}) })
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao curtir')
    }
  }

  async function toggleComments(postId: string) {
    const next = !openComments[postId]
    setOpenComments((prev) => ({ ...prev, [postId]: next }))
    if (!next || comments[postId]) return
    try {
      const res = await apiFetch<{ items: Comment[] }>(`/posts/${postId}/comments`, { token })
      setComments((prev) => ({ ...prev, [postId]: res.items }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar comentários')
    }
  }

  async function addComment(postId: string) {
    const draft = commentDraft[postId] ?? ''
    if (!draft.trim()) return
    setError(null)
    try {
      await apiFetch(`/posts/${postId}/comments`, {
        method: 'POST',
        token,
        body: JSON.stringify({ content: draft })
      })
      setCommentDraft((prev) => ({ ...prev, [postId]: '' }))
      const res = await apiFetch<{ items: Comment[] }>(`/posts/${postId}/comments`, { token })
      setComments((prev) => ({ ...prev, [postId]: res.items }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao comentar')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-semibold">Feed</h1>
        <button
          type="button"
          onClick={load}
          className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm hover:border-[color:var(--primary)]"
        >
          Recarregar
        </button>
      </div>

      {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}

      <form onSubmit={createPost} className="rounded-xl border border-[color:var(--border)] p-4">
        <div className="text-sm font-medium">Criar postagem</div>
        <textarea
          className="mt-2 w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Compartilhe uma atualização…"
          required
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="text-xs text-[color:var(--muted)]">{content.length}/5000</div>
          <button
            type="submit"
            className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
          >
            Publicar
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-[color:var(--border)]">
        <div className="border-b border-[color:var(--border)] p-3 text-sm font-medium">Publicações</div>
        <div className="divide-y divide-[color:var(--border)]">
          {loading ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Carregando…</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-[color:var(--muted)]">Nenhuma publicação ainda.</div>
          ) : (
            items.map((post) => (
              <div key={post.id} className="p-4">
                <div className="text-sm font-medium">{post.company.name}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm">{post.content}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--muted)]">
                  <button
                    type="button"
                    onClick={() => toggleLike(post)}
                    className="rounded-lg border border-[color:var(--border)] px-3 py-2 hover:border-[color:var(--primary)]"
                  >
                    {post.likedByMe ? 'Descurtir' : 'Curtir'} ({post.likesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComments(post.id)}
                    className="rounded-lg border border-[color:var(--border)] px-3 py-2 hover:border-[color:var(--primary)]"
                  >
                    Comentários ({post.commentsCount})
                  </button>
                </div>

                {openComments[post.id] ? (
                  <div className="mt-3 rounded-xl border border-[color:var(--border)] p-3">
                    <div className="space-y-2">
                      {(comments[post.id] ?? []).map((c) => (
                        <div key={c.id} className="rounded-lg border border-[color:var(--border)] p-2">
                          <div className="text-xs font-medium">{c.company.name}</div>
                          <div className="text-sm">{c.content}</div>
                        </div>
                      ))}
                      {(comments[post.id] ?? []).length === 0 ? (
                        <div className="text-sm text-[color:var(--muted)]">Sem comentários.</div>
                      ) : null}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <input
                        value={commentDraft[post.id] ?? ''}
                        onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        className="w-full rounded-lg border border-[color:var(--border)] bg-transparent px-3 py-2 text-sm"
                        placeholder="Escreva um comentário…"
                      />
                      <button
                        type="button"
                        onClick={() => addComment(post.id)}
                        className="rounded-lg bg-[color:var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--primary-hover)]"
                      >
                        Enviar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
