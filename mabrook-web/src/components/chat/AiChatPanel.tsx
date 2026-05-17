import { useEffect, useRef, useState } from 'react'
import { getTokenPayload } from '../../lib/api/http'
import {
  createMessage,
  getSuggestedPrompts,
  getWelcomeMessage,
  sendMockAssistantMessage,
  type ChatMessage,
} from '../../lib/chat/mockChatAssistant'

type AiChatPanelProps = {
  className?: string
  variant?: 'page' | 'popup'
  showHeader?: boolean
  inputId?: string
}

export function AiChatPanel({
  className = '',
  variant = 'page',
  showHeader = true,
  inputId = 'chat-input',
}: AiChatPanelProps) {
  const role = getTokenPayload()?.role ?? 'user'
  const chatRole =
    role === 'admin' || role === 'broker' || role === 'user' || role === 'support'
      ? role
      : 'user'

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    createMessage('assistant', getWelcomeMessage(chatRole)),
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const suggestions = getSuggestedPrompts(chatRole)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function sendText(text: string) {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    setError('')
    setInput('')
    setMessages((prev) => [...prev, createMessage('user', trimmed)])
    setSending(true)

    try {
      const reply = await sendMockAssistantMessage(trimmed)
      setMessages((prev) => [...prev, createMessage('assistant', reply)])
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendText(input)
  }

  const showSuggestions = messages.length <= 1 && !sending

  const heightClass =
    variant === 'popup' ? 'min-h-0 h-full' : 'min-h-[min(640px,calc(100vh-220px))]'
  const shellClass =
    variant === 'page' ? 'rounded-2xl border border-line bg-white shadow-sm' : ''

  return (
    <div className={`flex flex-col ${heightClass} ${shellClass} ${className}`.trim()}>
      {showHeader ? (
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#e0f2fe] text-sm font-bold text-brand">
              AI
            </span>
            <div>
              <h2 className="text-lg font-semibold text-brand">Mabrook Assistant</h2>
              <p className="text-xs text-brand/60">
                Demo mode — answers are simulated until the AI service is connected.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 sm:px-5">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[min(100%,520px)] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-brand text-white'
                  : 'border border-line bg-[#f7fbff] text-brand'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-line bg-[#f7fbff] px-4 py-3 text-sm text-brand/70">
              <span className="inline-flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse [animation-delay:150ms]">●</span>
                <span className="animate-pulse [animation-delay:300ms]">●</span>
              </span>
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {showSuggestions ? (
        <div className="flex flex-wrap gap-2 border-t border-line/80 px-4 py-3">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void sendText(prompt)}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-medium text-brand transition hover:border-brand hover:bg-footer"
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="px-4 pb-1 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-line px-4 py-4"
      >
        <label className="sr-only" htmlFor={inputId}>
          Message
        </label>
        <textarea
          id={inputId}
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void sendText(input)
            }
          }}
          placeholder="Ask about referrals, campaigns, rewards…"
          className="max-h-32 min-h-10 flex-1 resize-y rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-brand-ink outline-none transition focus:border-brand"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="h-10 shrink-0 rounded-full bg-brand px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-brand/35"
        >
          Send
        </button>
      </form>
    </div>
  )
}
