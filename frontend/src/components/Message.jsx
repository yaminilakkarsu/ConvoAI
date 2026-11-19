import { useState } from 'react'

export default function Message({ msg, isLast, streaming, canRegenerate, onRegenerate }) {
  const [copied, setCopied] = useState(false)
  const isAI = msg.role === 'assistant'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className={`row ${isAI ? 'ai' : 'user'}`}>
      {isAI && <div className="avatar">C</div>}
      <div className="col">
        <div className={`bubble ${msg.error ? 'error' : ''}`}>
          {msg.content}
          {isAI && streaming && isLast && (msg.content ? <span className="caret" /> : <span className="typing"><i /><i /><i /></span>)}
        </div>
        {isAI && msg.content && !(streaming && isLast) && (
          <div className="actions">
            <button onClick={copy} title="Copy response">{copied ? 'Copied' : 'Copy'}</button>
            {isLast && canRegenerate && <button onClick={onRegenerate} title="Regenerate response">Regenerate</button>}
          </div>
        )}
      </div>
    </div>
  )
}
