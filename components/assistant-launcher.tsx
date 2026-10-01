'use client'

import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { AdvisorChat } from '@/components/advisor-chat'

const assistantEvent = 'amsi:open-assistant'

export function openAmsiAssistant() {
  window.dispatchEvent(new Event(assistantEvent))
}

export function AssistantLauncher() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener(assistantEvent, handleOpen)
    return () => window.removeEventListener(assistantEvent, handleOpen)
  }, [])

  return <>
    <button type="button" onClick={() => setOpen(true)} className="assistant-launcher fixed" aria-label="Ask the AMSI AI assistant" title="Ask the AMSI AI assistant">
      <Sparkles size={17} aria-hidden="true" />
      <span>Ask AMSI AI</span>
    </button>
    <AdvisorChat open={open} onClose={() => setOpen(false)} />
  </>
}