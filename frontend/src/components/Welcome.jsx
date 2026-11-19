const PROMPTS = [
  'Explain how HTTPS keeps a connection secure',
  'Draft a polite email asking for a deadline extension',
  'Give me a 3-day study plan for learning SQL',
  'What are the trade-offs of SQL vs NoSQL?',
]

export default function Welcome({ onPick }) {
  return (
    <div className="welcome">
      <h1>What can I help you work through?</h1>
      <p>Pick a tone below the message box, then ask anything.</p>
      <div className="prompts">
        {PROMPTS.map((p) => <button key={p} onClick={() => onPick(p)}>{p}</button>)}
      </div>
    </div>
  )
}
