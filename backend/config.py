"""Central configuration, read from environment variables (.env)."""
import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    MONGODB_URI = os.getenv("MONGODB_URI", "")
    MONGODB_DB = os.getenv("MONGODB_DB", "convoai")
    FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    PORT = int(os.getenv("PORT", "5000"))
    MAX_MESSAGE_CHARS = 4000
    CONTEXT_MESSAGES = 20  # how many past messages are sent to OpenAI
    TONES = ("professional", "casual", "concise")

    @classmethod
    def validate(cls):
        missing = [k for k in ("OPENAI_API_KEY", "MONGODB_URI") if not getattr(cls, k)]
        if missing:
            raise RuntimeError(f"Missing environment variables: {', '.join(missing)}. Copy .env.example to .env.")
