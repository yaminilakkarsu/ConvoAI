"""Conversation management: all MongoDB reads/writes for chats."""
from datetime import datetime, timezone
from uuid import uuid4
from db import get_db
from errors import AppError

DEFAULT_TITLE = "New chat"


def _now():
    return datetime.now(timezone.utc).isoformat()


def _col():
    return get_db().conversations


def create(tone):
    now = _now()
    doc = {"id": str(uuid4()), "title": DEFAULT_TITLE, "tone": tone,
           "created_at": now, "updated_at": now, "messages": []}
    _col().insert_one(doc)
    doc.pop("_id", None)
    return doc


def list_all():
    return list(_col().find({}, {"_id": 0, "messages": 0}).sort("updated_at", -1).limit(100))


def get(cid):
    doc = _col().find_one({"id": cid}, {"_id": 0})
    if not doc:
        raise AppError("Conversation not found.", 404)
    return doc


def delete(cid):
    if _col().delete_one({"id": cid}).deleted_count == 0:
        raise AppError("Conversation not found.", 404)


def add_message(cid, role, content):
    msg = {"role": role, "content": content, "timestamp": _now()}
    _col().update_one({"id": cid}, {"$push": {"messages": msg}, "$set": {"updated_at": msg["timestamp"]}})
    return msg


def update_meta(cid, tone, title=None):
    fields = {"tone": tone}
    if title:
        fields["title"] = title
    _col().update_one({"id": cid}, {"$set": fields})


def pop_last_assistant(cid):
    """Remove the final AI message (used by Regenerate). No-op if last message is the user's."""
    msgs = get(cid)["messages"]
    if msgs and msgs[-1]["role"] == "assistant":
        _col().update_one({"id": cid}, {"$pop": {"messages": 1}})
