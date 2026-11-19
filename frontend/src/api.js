const H = { 'Content-Type': 'application/json' }

async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

export const listConvos = () => fetch('/api/conversations').then(json)
export const createConvo = (tone) =>
  fetch('/api/conversations', { method: 'POST', headers: H, body: JSON.stringify({ tone }) }).then(json)
export const getConvo = (id) => fetch(`/api/conversations/${id}`).then(json)
export const deleteConvo = (id) => fetch(`/api/conversations/${id}`, { method: 'DELETE' }).then(json)

/**
 * POST + read the SSE stream. (EventSource only supports GET, so the stream is
 * consumed with fetch + ReadableStream and parsed as "data: {...}\n\n" frames.)
 */
export async function streamChat(id, payload, { onChunk, onDone, onError }) {
  try {
    const res = await fetch(`/api/conversations/${id}/chat`, {
      method: 'POST', headers: H, body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return onError(body.error || `Request failed (${res.status})`)
    }
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop()
      for (const frame of frames) {
        if (!frame.startsWith('data: ')) continue
        const ev = JSON.parse(frame.slice(6))
        if (ev.type === 'chunk') onChunk(ev.content)
        else if (ev.type === 'done') onDone()
        else if (ev.type === 'error') onError(ev.error)
      }
    }
  } catch {
    onError('Connection to the server was lost.')
  }
}
