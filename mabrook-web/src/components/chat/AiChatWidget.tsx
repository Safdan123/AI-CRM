import { useEffect, useId, useState } from 'react'
import { assets } from '../../siteAssets'
import { AiChatPanel } from './AiChatPanel'

export function AiChatWidget() {
  const [open, setOpen] = useState(false)
  const inputId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [open])

  return (
    <>
      {!open ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-white shadow-[0_8px_30px_rgba(0,53,102,0.22)] ring-2 ring-brand/10 transition hover:scale-105 hover:shadow-[0_12px_36px_rgba(0,53,102,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        aria-label="Open Mabrook assistant"
      >
        <img
          src={assets.logoIcon}
          alt=""
          className="size-9 object-contain"
          width={36}
          height={36}
        />
      </button>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-end sm:justify-end sm:p-6"
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-brand/25 backdrop-blur-[2px]"
            aria-label="Close assistant"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-chat-title"
            className="relative flex h-[min(640px,calc(100dvh-1.5rem))] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-line px-4 py-3">
              <img
                src={assets.logoIcon}
                alt=""
                className="size-9 object-contain"
                width={36}
                height={36}
              />
              <div className="min-w-0 flex-1">
                <h2 id="ai-chat-title" className="text-base font-semibold text-brand">
                  Mabrook Assistant
                </h2>
                <p className="text-xs text-brand/60">Demo replies until AI is connected</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-brand/70 transition hover:bg-footer hover:text-brand"
                aria-label="Close"
              >
                <img src={assets.navClose} alt="" className="size-4" width={16} height={16} />
              </button>
            </div>
            <AiChatPanel
              variant="popup"
              inputId={inputId}
              showHeader={false}
              className="min-h-0 flex-1 rounded-none border-0 shadow-none"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}
