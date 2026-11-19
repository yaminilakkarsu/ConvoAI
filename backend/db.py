"""MongoDB Atlas connection (single shared client)."""
from pymongo import MongoClient, DESCENDING
from config import Config

_client = None


def get_db():
    global _client
    if _client is None:
        _client = MongoClient(Config.MONGODB_URI, serverSelectionTimeoutMS=5000)
    return _client[Config.MONGODB_DB]


def init_db():
    """Verify connectivity at startup and create indexes."""
    db = get_db()
    db.command("ping")
    db.conversations.create_index("id", unique=True)
    db.conversations.create_index([("updated_at", DESCENDING)])
