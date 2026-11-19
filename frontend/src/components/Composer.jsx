import { useState } from 'react'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'concise', label: 'Concise' },
]

export default function Composer({ tone, onTone, onSend, disabled }) {
  const [text, setText] = useState('')
  const submit = () => {
    if (!text.trim() || disabled) return
    onSend(text.trim())
    setText('')
  }
  return (
    <div className="composer">
      <div className="tones" role="radiogroup" aria-label="Response tone">
        {TONES.map((t) => (
          <button key={t.id} role="radio" aria-checked={tone === t.id}
            className={tone === t.id ? 'on' : ''} onClick={() => onTone(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="box">
        <textarea rows={1} value={text} placeholder="Ask anything…" maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }} />
        <button className="send" onClick={submit} disabled={disabled || !text.trim()} aria-label="Send message">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
        </button>
      </div>
    </div>
  )
}
