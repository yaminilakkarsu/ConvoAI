import { useEffect, useRef, useState } from 'react'
import * as api from './api'
import Sidebar from './components/Sidebar'
import Message from './components/Message'
import Composer from './components/Composer'
import Welcome from './components/Welcome'

export default function App() {
  const [convos, setConvos] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [tone, setTone] = useState('professional')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState(false)
  const endRef = useRef(null)

  const refresh = () => api.listConvos().then(setConvos).catch((e) => setError(e.message))
  useEffect(() => { refresh() }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const open = async (id) => {
    setError(''); setMenu(false)
    try {
      const c = await api.getConvo(id)
      setActiveId(id); setMessages(c.messages); setTone(c.tone)
    } catch (e) { setError(e.message) }
  }

  const newChat = () => { setActiveId(null); setMessages([]); setError(''); setMenu(false) }

  const remove = async (id) => {
    try {
      await api.deleteConvo(id)
      if (id === activeId) newChat()
      refresh()
    } catch (e) { setError(e.message) }
  }

  // Runs one streamed generation. `regenerate` reuses the stored last user prompt.
  const run = async (text, regenerate = false) => {
    setError(''); setStreaming(true)
    try {
      let id = activeId
      if (!id) {
        id = (await api.createConvo(tone)).id
        setActiveId(id)
      }
      setMessages((m) => {
        const base = regenerate && m[m.length - 1]?.role === 'assistant' ? m.slice(0, -1) : m
        return [...base, ...(regenerate ? [] : [{ role: 'user', content: text }]), { role: 'assistant', content: '' }]
      })
      await api.streamChat(id, { message: text, tone, regenerate }, {
        onChunk: (c) => setMessages((m) => {
          const copy = [...m]; const last = copy[copy.length - 1]
          copy[copy.length - 1] = { ...last, content: last.content + c }
          return copy
        }),
        onDone: () => {},
        onError: (msg) => {
          setError(msg)
          setMessages((m) => (m[m.length - 1]?.content === '' ? m.slice(0, -1) : m))
        },
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setStreaming(false)
      refresh()
    }
  }

  const lastIdx = messages.length - 1
  return (
    <div className="app">
      <Sidebar convos={convos} activeId={activeId} onSelect={open} onNew={newChat}
        onDelete={remove} open={menu} onClose={() => setMenu(false)} />
      <main className="main">
        <header className="topbar">
          <button className="burger" onClick={() => setMenu(true)} aria-label="Open history">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <span>{convos.find((c) => c.id === activeId)?.title || 'New chat'}</span>
        </header>
        <section className="scroll">
          {messages.length === 0 ? <Welcome onPick={(p) => run(p)} /> : (
            <div className="thread">
              {messages.map((m, i) => (
                <Message key={i} msg={m} isLast={i === lastIdx} streaming={streaming}
                  canRegenerate={!streaming} onRegenerate={() => run('', true)} />
              ))}
              <div ref={endRef} />
            </div>
          )}
        </section>
        {error && <div className="banner" role="alert">{error}<button onClick={() => setError('')}>Dismiss</button></div>}
        <Composer tone={tone} onTone={setTone} onSend={(t) => run(t)} disabled={streaming} />
      </main>
    </div>
  )
}
