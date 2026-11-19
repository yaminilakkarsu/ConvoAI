"""REST + SSE API routes."""
import json
from flask import Blueprint, Response, jsonify, request, stream_with_context, current_app
import conversations as store
import openai_service as ai
from config import Config
from errors import AppError

bp = Blueprint("api", __name__, url_prefix="/api")


def validate_tone(tone):
    if tone not in Config.TONES:
        raise AppError(f"Tone must be one of: {', '.join(Config.TONES)}.")
    return tone


def validate_message(text):
    if not isinstance(text, str) or not text.strip():
        raise AppError("Message cannot be empty.")
    text = text.strip()
    if len(text) > Config.MAX_MESSAGE_CHARS:
        raise AppError(f"Message is too long (max {Config.MAX_MESSAGE_CHARS} characters).")
    return text


def sse(payload):
    return f"data: {json.dumps(payload)}\n\n"


@bp.get("/health")
def health():
    return jsonify(status="ok")


@bp.get("/conversations")
def list_conversations():
    return jsonify(store.list_all())


@bp.post("/conversations")
def create_conversation():
    data = request.get_json(silent=True) or {}
    return jsonify(store.create(validate_tone(data.get("tone", "professional")))), 201


@bp.get("/conversations/<cid>")
def get_conversation(cid):
    return jsonify(store.get(cid))


@bp.delete("/conversations/<cid>")
def delete_conversation(cid):
    store.delete(cid)
    return jsonify(deleted=True)


@bp.post("/conversations/<cid>/chat")
def chat(cid):
    data = request.get_json(silent=True) or {}
    convo = store.get(cid)
    tone = validate_tone(data.get("tone", convo["tone"]))

    if data.get("regenerate"):
        store.pop_last_assistant(cid)
        convo = store.get(cid)
        if not convo["messages"] or convo["messages"][-1]["role"] != "user":
            raise AppError("There is no previous prompt to regenerate.")
        title = None
    else:
        text = validate_message(data.get("message"))
        store.add_message(cid, "user", text)
        convo = store.get(cid)
        title = (text[:48] + "…" if len(text) > 48 else text) if convo["title"] == store.DEFAULT_TITLE else None
    store.update_meta(cid, tone, title)
    history = convo["messages"][-Config.CONTEXT_MESSAGES:]

    def generate():
        parts = []
        try:
            for delta in ai.stream_reply(tone, history):
                parts.append(delta)
                yield sse({"type": "chunk", "content": delta})
            full = "".join(parts)
            if not full.strip():
                raise RuntimeError("Empty response from model")
            store.add_message(cid, "assistant", full)
            yield sse({"type": "done"})
        except Exception as exc:  # report over the stream; headers are already sent
            current_app.logger.error("Streaming failed: %s", exc)
            if parts:  # keep what was generated so the history stays consistent
                store.add_message(cid, "assistant", "".join(parts))
            yield sse({"type": "error", "error": ai.friendly_error(exc)})

    return Response(stream_with_context(generate()), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
