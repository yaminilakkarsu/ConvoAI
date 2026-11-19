export default function Sidebar({ convos, activeId, onSelect, onNew, onDelete, open, onClose }) {
  return (
    <>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="mark">C</span>ConvoAI</div>
        <button className="new-chat" onClick={onNew}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
          New chat
        </button>
        <div className="history-label">Recent</div>
        <nav className="history">
          {convos.length === 0 && <p className="empty">Your conversations will appear here.</p>}
          {convos.map((c) => (
            <div key={c.id} className={`item ${c.id === activeId ? 'active' : ''}`} onClick={() => onSelect(c.id)}>
              <span className="title">{c.title}</span>
              <button className="del" aria-label={`Delete ${c.title}`}
                onClick={(e) => { e.stopPropagation(); onDelete(c.id) }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
              </button>
            </div>
          ))}
        </nav>
      </aside>
      {open && <div className="scrim" onClick={onClose} />}
    </>
  )
}
