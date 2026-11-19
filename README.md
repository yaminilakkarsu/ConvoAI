# ConvoAI

Full-stack AI chat assistant: React + Vite frontend, Flask backend, MongoDB Atlas storage, OpenAI streaming over SSE.

## Problem-statement mapping
| Requirement (Quantiphi Vibe Coding) | Where |
|---|---|
| Scrollable chat with distinct user/AI bubbles | `App.jsx`, `Message.jsx`, `styles.css` |
| Streaming view, text appearing live | OpenAI `stream=True` -> Flask SSE -> `api.js` stream reader -> `App.jsx` appends each chunk |
| History sidebar of past threads | `Sidebar.jsx` + `GET /api/conversations` |
| OpenAI API integration | `backend/openai_service.py` |
| MongoDB persistence (timestamp, prompt, response) | `backend/conversations.py` (every message stores role, content, timestamp) |
| Tone Toggle sent as system-instruction modifier | `Composer.jsx` -> `routes.py` validates -> `openai_service.build_messages` |
| Two extra features | **Regenerate response** and **Copy response** (see below) |
| Business logic and validation on the server | validation, titles, context window, tone prompts, regenerate logic all in `backend/` |

**Extra feature 1, Regenerate response:** re-runs the last user prompt (optionally with a newly selected tone) and replaces the previous AI answer, so users can compare styles instantly.
**Extra feature 2, Copy response:** one-click copy of any AI answer to the clipboard.

## Run it
Prerequisites: Python 3.10+, Node 18+, an OpenAI API key, a MongoDB Atlas cluster (allow your IP in Network Access).

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # then fill in the values
python app.py                                         # http://localhost:5000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                                           # http://localhost:5173
```

## Environment variables (backend/.env)
| Name | Purpose |
|---|---|
| OPENAI_API_KEY | OpenAI key (server only, never in the frontend) |
| OPENAI_MODEL | Model name, default `gpt-4o-mini` |
| MONGODB_URI | Atlas connection string |
| MONGODB_DB | Database name, default `convoai` |
| FRONTEND_ORIGIN | CORS origin, default `http://localhost:5173` |
| PORT | Flask port, default 5000 |

## API
| Method | Path | Body | Result |
|---|---|---|---|
| GET | /api/health | | `{status:"ok"}` |
| GET | /api/conversations | | List (id, title, tone, timestamps) |
| POST | /api/conversations | `{tone}` | New conversation (201) |
| GET | /api/conversations/:id | | Full conversation with messages |
| DELETE | /api/conversations/:id | | `{deleted:true}` |
| POST | /api/conversations/:id/chat | `{message, tone, regenerate?}` | SSE stream |

SSE frames: `data: {"type":"chunk","content":"..."}`, then `{"type":"done"}` or `{"type":"error","error":"..."}`.
Errors are JSON `{error}` with 400 (validation), 404, 503 (database) or 500.

## Architecture
```
backend/
  app.py              app factory, CORS, startup DB ping
  config.py           env vars and limits
  routes.py           REST + SSE endpoints, input validation
  openai_service.py   tone-aware system prompt, streaming call, error mapping
  db.py               MongoDB client and indexes
  conversations.py    create/list/get/delete/add message/pop last AI message
  errors.py           AppError and global handlers
frontend/src
  App.jsx             state and orchestration
  api.js              fetch client and SSE parser
  components/         Sidebar, Message, Composer (tone toggle), Welcome
```
Flow: the browser POSTs to `/chat`; Flask saves the user message, loads the last 20 messages, builds the system prompt (`Tone: ...` for the selected tone), streams OpenAI deltas as SSE frames, and saves the full AI reply when the stream ends. Regenerate removes the last AI message server-side and reruns the stored last prompt. The SSE stream is read with fetch + ReadableStream because `EventSource` cannot send POST bodies.

## Manual test checklist
1. Send a message: tokens appear progressively, the bubble shows the typing indicator first.
2. Ask the same question under Professional, Casual and Concise: the style changes.
3. Refresh the page: the conversation is in the sidebar; click it to reopen with full history.
4. Ask a follow-up that depends on earlier context ("make that shorter").
5. New chat, then delete a conversation: it disappears from the sidebar and from Atlas.
6. Regenerate replaces the last answer; Copy puts it on the clipboard.
7. Set a wrong `OPENAI_API_KEY`: the UI shows a clear error and no crash.

## Publishing to GitHub
```bash
git remote add origin https://github.com/<you>/convoai.git
git push -u origin main
```
Make the repository public and submit the link before the deadline. Do not commit `.env`.
