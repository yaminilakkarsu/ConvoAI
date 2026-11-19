"""OpenAI integration: tone-aware system prompt + real streaming completion."""
from openai import OpenAI, AuthenticationError, RateLimitError, APIConnectionError, APIStatusError
from config import Config

_client = None

BASE_PROMPT = "You are ConvoAI, a helpful, accurate AI assistant. Use the conversation history for context."
TONE_INSTRUCTIONS = {
    "professional": "Tone: Professional. Respond in a formal, well-structured way. Use clear paragraphs or lists, precise vocabulary and no slang.",
    "casual": "Tone: Casual. Respond in a friendly, relaxed, conversational voice, like chatting with a smart friend. Contractions are fine.",
    "concise": "Tone: Concise. Respond as briefly and directly as possible: the answer first, no filler, ideally 1-3 sentences.",
}


def _get_client():
    global _client
    if _client is None:
        _client = OpenAI(api_key=Config.OPENAI_API_KEY)
    return _client


def build_messages(tone, history):
    system = f"{BASE_PROMPT}\n{TONE_INSTRUCTIONS[tone]}"
    return [{"role": "system", "content": system}] + [
        {"role": m["role"], "content": m["content"]} for m in history
    ]


def stream_reply(tone, history):
    """Yield text deltas from OpenAI as they arrive."""
    stream = _get_client().chat.completions.create(
        model=Config.OPENAI_MODEL, messages=build_messages(tone, history), stream=True)
    for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


def friendly_error(exc):
    if isinstance(exc, AuthenticationError):
        return "OpenAI rejected the API key. Check OPENAI_API_KEY on the server."
    if isinstance(exc, RateLimitError):
        return "OpenAI rate limit or quota reached. Wait a moment or check your billing."
    if isinstance(exc, APIConnectionError):
        return "Could not reach OpenAI. Check the server's internet connection."
    if isinstance(exc, APIStatusError):
        return f"OpenAI returned an error ({exc.status_code}). Try again."
    return "Something went wrong while generating the response."
