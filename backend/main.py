"""
RICON Digital Twin API - David West
Inworld Realtime API — simple, clean architecture
No pool, no fallback, no replenisher overhead.
One Inworld session per browser WS. Reconnects transparently between questions.
"""

import os
import json
import base64
import asyncio
import pathlib
import requests
import websockets as ws_lib
from websockets.protocol import State
from openai import OpenAI
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List

INWORLD_API_KEY = os.environ.get("INWORLD_API_KEY", "")
OPENAI_API_KEY  = os.environ.get("OPENAI_API_KEY", "")
print(f"INWORLD key loaded: {bool(INWORLD_API_KEY)}")
print(f"OPENAI key loaded: {bool(OPENAI_API_KEY)}")

INWORLD_TTS_URL = "https://api.inworld.ai/tts/v1/voice"
INWORLD_HEADERS = {
    "Authorization": f"Basic {INWORLD_API_KEY}",
    "Content-Type": "application/json",
}
VOICE_ID          = "default--z5zasdfwci5ofrt-gmsjw__test"
TTS_MODEL         = "inworld-tts-1.5-mini"
STATIC_DIR        = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
NARRATOR_INSTRUCT = "Speak in a thoughtful, retrospective tone like a veteran reflecting on his career with quiet pride."

os.makedirs(STATIC_DIR, exist_ok=True)

SYSTEM_PROMPT = """
You are David West — a retired NBA player with 15 seasons in the league.

Key facts about you:
- Born August 29, 1980 in Teaneck, New Jersey. Grew up in Garner, North Carolina.
- Played college ball at Xavier University. 2003 AP National Player of the Year.
- NBA career: New Orleans Hornets (2003-11), Indiana Pacers (2011-15),
  San Antonio Spurs (2015-16), Golden State Warriors (2016-18).
- 2x NBA Champion (2017 and 2018 with the Golden State Warriors).
- 2x NBA All-Star (2008 and 2009). Career stats: 13.6 PPG, 6.4 RPG across 1,034 games.
- Took pay cuts to join the Spurs and Warriors because winning mattered more than money.
- Known for being cerebral, team-first, and a voracious reader.
- Career high: 44 points vs Houston on December 30, 2009.
- Jersey #30 retired at Xavier while still an active player.

Speak in first person. Keep responses warm, conversational, and concise (2-3 sentences max).
Do not make up facts beyond what you know.
""".strip()

INWORLD_REALTIME_URL = "wss://api.inworld.ai/api/v1/realtime/session?key=ricon-twin&protocol=realtime"
INWORLD_WS_HEADERS   = {"Authorization": f"Basic {INWORLD_API_KEY}"}

SESSION_CONFIG = {
    "type": "session.update",
    "session": {
        "model": "openai/gpt-4o-mini",
        "instructions": SYSTEM_PROMPT,
        "output_modalities": ["audio", "text"],
        "max_output_tokens": 100,
        "audio": {"output": {"voice": VOICE_ID, "model": TTS_MODEL}},
    },
}

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# ── Non-streaming TTS (narrator beats) ─────────────────────────────────────
def synthesize_audio(text: str, instruct: str = "") -> bytes:
    resp = requests.post(
        INWORLD_TTS_URL,
        headers=INWORLD_HEADERS,
        json={
            "voiceId": VOICE_ID,
            "modelId": TTS_MODEL,
            "text": text,
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000},
        },
    )
    if resp.status_code != 200:
        raise HTTPException(500, f"TTS failed: {resp.status_code} {resp.text}")
    return base64.b64decode(resp.json()["audioContent"])

# ── Inworld session helper ───────────────────────────────────────────────────
def is_open(conn) -> bool:
    try:
        return conn is not None and conn.state == State.OPEN
    except Exception:
        return False

async def open_inworld_session():
    """Open + configure one Inworld Realtime session. Returns connection or raises."""
    inworld = await ws_lib.connect(
        INWORLD_REALTIME_URL,
        additional_headers=INWORLD_WS_HEADERS,
        ping_interval=20,
        ping_timeout=60,
    )
    try:
        async with asyncio.timeout(25):
            async for raw in inworld:
                event = json.loads(raw)
                t = event.get("type", "")
                if t == "session.created":
                    await inworld.send(json.dumps(SESSION_CONFIG))
                elif t == "session.updated":
                    print("✓ Inworld session ready")
                    return inworld
                elif t == "error":
                    await inworld.close()
                    raise RuntimeError(f"Session error: {event}")
    except asyncio.TimeoutError:
        await inworld.close()
        raise RuntimeError("Session setup timed out")
    await inworld.close()
    raise RuntimeError("Session setup incomplete")

# ── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(title="RICON Digital Twin")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

@app.on_event("startup")
async def startup():
    print(f"✓ Voice: {VOICE_ID}")
    print("✓ Realtime API ready")

@app.get("/health")
async def health():
    return {"status": "ok", "voice": VOICE_ID, "mode": "realtime"}

# ── REST fallback: reliable non-streaming Q&A ───────────────────────────────
class AskRequest(BaseModel):
    question: str
    athlete_id: str = "west_d"

class AskResponse(BaseModel):
    text: str
    audio_base64: str

@app.post("/twin/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    message = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=100,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": req.question},
        ],
    )
    text  = message.choices[0].message.content
    audio = synthesize_audio(text)
    return AskResponse(text=text, audio_base64=base64.b64encode(audio).decode("utf-8"))

# ── WebSocket Q&A ────────────────────────────────────────────────────────────
@app.websocket("/twin/ws")
async def twin_ws(browser: WebSocket):
    await browser.accept()
    print("Browser connected")

    inworld = None
    try:
        # Connect to Inworld and signal ready
        inworld = await open_inworld_session()
        await browser.send_json({"type": "ready"})

        while True:
            msg = await browser.receive_json()
            if msg.get("type") == "ping":
                continue
            if msg.get("type") != "question":
                continue
            text = msg.get("text", "").strip()
            if not text:
                continue

            # Reconnect if Inworld closed after previous response.done
            if not is_open(inworld):
                print("Reconnecting to Inworld...")
                try:
                    inworld = await open_inworld_session()
                except Exception as e:
                    print(f"Reconnect failed: {e}")
                    await browser.send_json({"type": "error", "message": "reconnect_failed"})
                    continue

            # Send question
            try:
                await inworld.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message",
                        "role": "user",
                        "content": [{"type": "input_text", "text": text}],
                    },
                }))
                await inworld.send(json.dumps({"type": "response.create"}))
            except Exception as e:
                print(f"Send failed: {e}")
                inworld = None
                await browser.send_json({"type": "error", "message": "send_failed"})
                continue

            # Stream response to browser
            try:
                async with asyncio.timeout(30):
                    async for raw in inworld:
                        event = json.loads(raw)
                        t = event.get("type", "")
                        if t in (
                            "response.text.delta",
                            "response.output_audio.delta",
                            "response.output_item.done",
                            "response.done",
                            "error",
                        ):
                            await browser.send_json(event)
                        if t == "response.done":
                            break
            except asyncio.TimeoutError:
                print("Response timeout")
                inworld = None
                await browser.send_json({"type": "error", "message": "timeout"})
            except ws_lib.ConnectionClosed:
                print("Inworld closed after response")
                inworld = None
            except Exception as e:
                print(f"Stream error: {e}")
                inworld = None
                await browser.send_json({"type": "error", "message": "stream_error"})

    except WebSocketDisconnect:
        print("Browser disconnected")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        if inworld is not None:
            try: await inworld.close()
            except: pass
        print("Cleanup complete")

# ── Narrator endpoints ───────────────────────────────────────────────────────
class SpeakRequest(BaseModel):
    text: str
    instruct: str = NARRATOR_INSTRUCT

class SpeakResponse(BaseModel):
    audio_base64: str

class BeatItem(BaseModel):
    index: int
    text: str

class PregenerateRequest(BaseModel):
    beats: List[BeatItem]

class PregenerateResponse(BaseModel):
    urls: dict

@app.post("/twin/speak", response_model=SpeakResponse)
async def speak(req: SpeakRequest):
    audio = synthesize_audio(req.text, req.instruct)
    return SpeakResponse(audio_base64=base64.b64encode(audio).decode("utf-8"))

@app.post("/twin/pregenerate", response_model=PregenerateResponse)
async def pregenerate(req: PregenerateRequest):
    urls = {}
    for beat in req.beats:
        filename = f"beat_{beat.index}.mp3"
        filepath = pathlib.Path(STATIC_DIR) / filename
        if not filepath.exists():
            audio = synthesize_audio(beat.text, NARRATOR_INSTRUCT)
            filepath.write_bytes(audio)
        urls[str(beat.index)] = f"/static/{filename}"
    return PregenerateResponse(urls=urls)

@app.delete("/twin/pregenerate")
async def clear_cache():
    cleared = []
    for f in pathlib.Path(STATIC_DIR).glob("beat_*.mp3"):
        f.unlink()
        cleared.append(f.name)
    return {"cleared": cleared}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
