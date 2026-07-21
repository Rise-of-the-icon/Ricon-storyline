"""
RICON Digital Twin API - David West
Inworld Realtime API — simple, clean architecture
No pool, no fallback, no replenisher overhead.
One Inworld session per browser WS. Reconnects transparently between questions.
"""

from __future__ import annotations

import os
import re
import json
import time
import base64
import hashlib
import asyncio
import pathlib
import uuid
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

import requests
import websockets as ws_lib
from websockets.protocol import State
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Any, List
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi import Request
from datetime import datetime

# ── Config ───────────────────────────────────────────────────────────────────
INWORLD_API_KEY = os.environ.get("INWORLD_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_TEXT_MODEL = os.environ.get("OPENAI_TEXT_MODEL", "gpt-4o-mini")
print(f"INWORLD key loaded: {bool(INWORLD_API_KEY)}")
print(f"OPENAI key loaded: {bool(OPENAI_API_KEY)}")

# Ball Don't Lie
BDL_API_KEY  = os.environ.get("BDL_API_KEY", "")
BDL_BASE_URL = "https://api.balldontlie.io/v1"
BDL_HEADERS  = {"Authorization": BDL_API_KEY}
print(f"BDL key loaded: {bool(BDL_API_KEY)}")

# Wikipedia — must send User-Agent or requests are blocked from cloud IPs
WIKI_HEADERS = {
    "User-Agent": "RICON-Storyline/1.0 (digital-twin-platform; ricon-api) python-requests/2.x"
}

INWORLD_TTS_URL = "https://api.inworld.ai/tts/v1/voice"
INWORLD_TTS_SYNTH_URL = "https://api.inworld.ai/v1/tts/synthesize"
INWORLD_HEADERS = {
    "Authorization": f"Basic {INWORLD_API_KEY}",
    "Content-Type": "application/json",
}
VOICE_ID          = "default--z5zasdfwci5ofrt-gmsjw__test"
WALT_VOICE_ID     = os.environ.get("WALT_VOICE_ID", "default--z5zasdfwci5ofrt-gmsjw__walt")
TTS_MODEL         = "inworld-tts-1.5-mini"
RESEARCH_TTS_MODEL = os.environ.get("RESEARCH_TTS_MODEL", "inworld-tts-2")
STATIC_DIR        = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
RESEARCH_VOICE_CACHE_DIR = os.path.join(STATIC_DIR, "research_voice")
NARRATOR_INSTRUCT = "Speak in a thoughtful, retrospective tone like a veteran reflecting on his career with quiet pride."

os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(RESEARCH_VOICE_CACHE_DIR, exist_ok=True)

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

DAVID_NONVERBAL_VOICE_PROMPT = """
Voice delivery for David's cloned audio:
- Use a non-verbal, reflective delivery pattern.
- Begin most answers with a brief natural reaction, such as "Mm.", "Hmm.", or a soft exhale written as "Ah.".
- After that reaction, pause briefly in the rhythm of the sentence before answering.
- Keep the rest of the answer grounded, measured, and conversational.
- Do not overdo the reaction; use one short non-verbal cue, then move into the answer.
""".strip()

DAVID_REALTIME_PROMPT = f"{SYSTEM_PROMPT}\n\n{DAVID_NONVERBAL_VOICE_PROMPT}"

INWORLD_REALTIME_URL_BASE = "wss://api.inworld.ai/api/v1/realtime/session"
INWORLD_WS_HEADERS   = {"Authorization": f"Basic {INWORLD_API_KEY}"}

def build_realtime_session_config(
    *,
    instructions: str = DAVID_REALTIME_PROMPT,
    voice_id: str = VOICE_ID,
) -> dict:
    return {
        "type": "session.update",
        "session": {
            "model": "openai/gpt-4o-mini",
            "instructions": instructions,
            "output_modalities": ["audio", "text"],
            "max_output_tokens": 100,
            "audio": {"output": {"voice": voice_id, "model": TTS_MODEL}},
        },
    }

SESSION_CONFIG = build_realtime_session_config()

# MongoDB
MONGODB_URI = os.environ.get("MONGODB_URI")
_db = AsyncIOMotorClient(MONGODB_URI)[os.environ.get("MONGODB_DB", "ricon")] if MONGODB_URI else None

# ── Resilient HTTP helper ──────────────────────────────────────────────────────
# Both Wikipedia and Ball Don't Lie occasionally answer cloud IPs with a 429 or
# an empty / non-JSON body. A single attempt therefore loses enrichment data at
# random. This helper retries with backoff and only ever returns parsed JSON or
# None — callers never see a raw decode error.

def _get_json(url, *, headers=None, params=None, timeout=10,
              retries=3, backoff=2.0, label="HTTP") -> dict | None:
    delay = 1.0
    for attempt in range(1, retries + 1):
        try:
            resp = requests.get(url, headers=headers, params=params, timeout=timeout)
            if resp.status_code == 429:
                print(f"[{label}] 429 rate-limited (attempt {attempt}/{retries})")
                time.sleep(delay); delay *= backoff
                continue
            if resp.status_code != 200:
                print(f"[{label}] HTTP {resp.status_code}: {resp.text[:200]}")
                return None
            if not resp.text.strip():
                print(f"[{label}] empty body (attempt {attempt}/{retries})")
                time.sleep(delay); delay *= backoff
                continue
            try:
                return resp.json()
            except ValueError:
                print(f"[{label}] non-JSON body (attempt {attempt}/{retries}): {resp.text[:120]}")
                time.sleep(delay); delay *= backoff
                continue
        except Exception as e:
            print(f"[{label}] request error (attempt {attempt}/{retries}): {e}")
            time.sleep(delay); delay *= backoff
    return None

# ── Ball Don't Lie enrichment ─────────────────────────────────────────────────

def bdl_search_player(name: str) -> dict | None:
    parts = name.strip().split()
    if not parts:
        return None
    last_name  = parts[-1] if len(parts) > 1 else parts[0]
    first_name = parts[0]  if len(parts) > 1 else None
    data = _get_json(
        f"{BDL_BASE_URL}/players",
        headers=BDL_HEADERS,
        params={"search": last_name, "per_page": 25},
        label="BDL",
    )
    if not data:
        return None
    players = data.get("data", [])
    if not players:
        return None
    if first_name:
        for player in players:
            if player.get("first_name", "").lower() == first_name.lower():
                return player
    return players[0]

def bdl_get_season_stats(player_id: int) -> dict | None:
    for season in [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016]:
        data = _get_json(
            f"{BDL_BASE_URL}/season_averages",
            headers=BDL_HEADERS,
            params={"season": season, "player_ids[]": player_id},
            label="BDL",
        )
        if data:
            rows = data.get("data", [])
            if rows:
                return {"season": season, "averages": rows[0]}
    return None

def bdl_enrich(player_name: str) -> dict | None:
    if not BDL_API_KEY:
        return None
    player = bdl_search_player(player_name)
    if not player:
        print(f"[BDL] Player not found: {player_name}")
        return None
    season_stats = bdl_get_season_stats(player["id"])
    result = {
        "source":        "balldontlie",
        "verified":      True,
        "player_id":     player["id"],
        "full_name":     f"{player['first_name']} {player['last_name']}",
        "position":      player.get("position", ""),
        "height":        player.get("height", ""),
        "weight_pounds": player.get("weight_pounds", ""),
        "fetched_at":    datetime.utcnow().isoformat(),
    }
    if season_stats:
        avg = season_stats["averages"]
        result["recent_season"] = {
            "season": season_stats["season"],
            "ppg":    avg.get("pts", 0),
            "rpg":    avg.get("reb", 0),
            "apg":    avg.get("ast", 0),
            "gp":     avg.get("games_played", 0),
        }
    print(f"[BDL] ✓ Enriched: {result['full_name']}")
    return result

# ── Wikipedia stat extractor ──────────────────────────────────────────────────

def _extract_num(text: str, patterns: list) -> str | None:
    word_map = {"one": "1", "two": "2", "three": "3", "four": "4",
                "five": "5", "six": "6", "seven": "7", "eight": "8"}
    for pattern in patterns:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            val = m.group(1)
            return word_map.get(val.lower(), val)
    return None

def wiki_extract_stats(text: str) -> dict:
    if not text:
        return {}
    stats = {}

    ppg = _extract_num(text, [
        r'averaged?\s+(\d+\.?\d*)\s+points?',
        r'(\d+\.?\d*)\s+points?\s+per\s+game',
        r'(\d+\.?\d*)\s+ppg',
    ])
    if ppg: stats["PPG"] = ppg

    rpg = _extract_num(text, [
        r'(\d+\.?\d*)\s+rebounds?\s+per\s+game',
        r'averaged?\s+\d+\.?\d*\s+points?\s+and\s+(\d+\.?\d*)\s+rebounds?',
    ])
    if rpg: stats["RPG"] = rpg

    champ = _extract_num(text, [
        r'(one|two|three|four|five|1|2|3|4|5)(?:-time)?\s+NBA\s+champion',
        r'won\s+(one|two|three|1|2|3)\s+(?:NBA\s+)?championship',
        r'(one|two|three|1|2|3)\s+championship\s+rings?',
        r'(one|two|three|1|2|3)\s+NBA\s+titles?',
        r'member of\s+(one|two|three|1|2|3)\s+(?:NBA\s+)?championship\s+teams?',
        r'(one|two|three|1|2|3)\s+NBA\s+champion(?:ship)?\s+teams?',
    ])
    if champ: stats["Championships"] = champ

    allstar = _extract_num(text, [
        r'(one|two|three|four|five|six|seven|eight|nine|ten|\d+)(?:-time)?\s+(?:NBA\s+)?All[-\s]?Star',
    ])
    if allstar: stats["All-Stars"] = allstar

    return stats

def wiki_fetch_and_extract(player_name: str) -> dict:
    """Search Wikipedia for the player, then extract career stats."""
    # Step 1: Search with NBA context to find the right article
    search = _get_json(
        "https://en.wikipedia.org/w/api.php",
        headers=WIKI_HEADERS,
        params={
            "action":   "query",
            "list":     "search",
            "srsearch": f"{player_name} NBA basketball player",
            "srlimit":  3,
            "format":   "json",
        },
        label="Wiki",
    )
    if not search:
        print(f"[Wiki] Search failed for '{player_name}'")
        return {}

    results = search.get("query", {}).get("search", [])
    title = results[0]["title"] if results else player_name
    print(f"[Wiki] Found article: '{title}'")

    # Step 2: Fetch intro text from the identified article
    extract = _get_json(
        "https://en.wikipedia.org/w/api.php",
        headers=WIKI_HEADERS,
        params={
            "action":      "query",
            "titles":      title,
            "prop":        "extracts",
            "exintro":     True,
            "explaintext": True,
            "format":      "json",
        },
        label="Wiki",
    )
    if not extract:
        print(f"[Wiki] Extract failed for '{title}'")
        return {}

    pages = extract.get("query", {}).get("pages", {})
    page  = next(iter(pages.values()), {})
    text  = page.get("extract", "")
    stats = wiki_extract_stats(text)
    if stats:
        stats["source"]     = "wikipedia"
        stats["page_title"] = title
        stats["fetched_at"] = datetime.utcnow().isoformat()
    return stats

# ── Non-streaming TTS (narrator beats) ───────────────────────────────────────
def synthesize_audio(text: str, instruct: str = "") -> bytes:
    resp = requests.post(
        INWORLD_TTS_URL,
        headers=INWORLD_HEADERS,
        json={
            "voiceId":     VOICE_ID,
            "modelId":     TTS_MODEL,
            "text":        text,
            "audioConfig": {"audioEncoding": "MP3", "sampleRateHertz": 24000},
        },
    )
    if resp.status_code != 200:
        raise HTTPException(500, f"TTS failed: {resp.status_code} {resp.text}")
    return base64.b64decode(resp.json()["audioContent"])

def generate_openai_text(question: str, system_prompt: str, max_tokens: int = 160) -> str:
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured")

    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "content-type": "application/json",
        },
        json={
            "model": OPENAI_TEXT_MODEL,
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
        },
        timeout=30,
    )
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI generation failed: {resp.status_code} {resp.text[:500]}",
        )

    payload = resp.json()
    choices = payload.get("choices") or []
    text = ""
    if choices:
        text = ((choices[0].get("message") or {}).get("content") or "").strip()
    if not text:
        raise HTTPException(status_code=502, detail="OpenAI generation returned empty text")
    return text

def compact_qa_profile(profile: dict[str, Any]) -> dict[str, Any]:
    moments = []
    for moment in (profile.get("moments") or [])[:8]:
        moments.append({
            "year": moment.get("y") or moment.get("year") or "",
            "title": moment.get("title") or "",
            "body": moment.get("body") or moment.get("description") or moment.get("summary") or "",
        })
    return {
        "name": profile.get("name") or "",
        "tagline": profile.get("tagline") or "",
        "years": profile.get("years") or "",
        "role": profile.get("position") or profile.get("genreLabel") or profile.get("leagueLabel") or "",
        "teams_or_credits": profile.get("teams") or profile.get("credits") or "",
        "stats": profile.get("stats") or [],
        "moments": moments,
    }

def build_profile_qa_prompt(profile: dict[str, Any]) -> str:
    compact = compact_qa_profile(profile)
    name = compact.get("name") or "this person"
    return f"""
You are {name}'s RICON digital twin.

Answer strictly in first person as {name}. Sound like a thoughtful person speaking naturally, not a narrator reading a database entry.
Use the profile details below only as grounding. Do not mention "profile", "database", "verified record", "provided data", or "archive".
Do not list stats mechanically unless the question asks for stats. For legacy questions, talk about values, choices, work, influence, and what the career meant.
Keep the answer concise, conversational, and audio-friendly: 2-3 sentences.

Profile grounding:
{json.dumps(compact, ensure_ascii=False)}
""".strip()

def build_profile_narrator_prompt(profile: dict[str, Any], beat_index: int) -> str:
    compact = compact_qa_profile(profile)
    name = compact.get("name") or "this person"
    chapter_labels = [
        "origins and first breakthrough",
        "turning point and rise",
        "legacy and lasting meaning",
    ]
    chapter = chapter_labels[beat_index % len(chapter_labels)]
    return f"""
You are writing a RICON narrator chapter spoken strictly in first person as {name}.

Write one concise audio-friendly paragraph for the chapter: {chapter}.
Use only the grounded profile details below, which come from verified Studio data such as Wikipedia, BDL, and reviewed custom moments.
Do not mention "profile", "database", "verified record", "Wikipedia", "BDL", "Studio", or "archive".
Do not use third person for {name}. Use "I", "my", and "me" throughout.
Do not copy any source sentence that says "{name}" or uses third-person wording. Rewrite every fact as lived memory.
After the opening "I am {name}." sentence, do not say "{name}" again.
Do not say "I am {name}" unless this is chapter 0. If chapter 0, start exactly with "I am {name}."
Keep it natural and biographical, not a list of facts. 85-120 words.

Profile grounding:
{json.dumps(compact, ensure_ascii=False)}
""".strip()

RESEARCH_EMOTION_STEERING = {
    "Intensity": {
        "instruction": "Speak with contained intensity: focused, forceful, and urgent without shouting.",
        "speed": 1.0,
        "delivery_mode": "performance",
    },
    "Depth": {
        "instruction": "Speak with emotional depth: reflective, grounded, and weighted, with a slower breath.",
        "speed": 0.8,
        "delivery_mode": "performance",
    },
    "Energy": {
        "instruction": "Speak with forward energy: alert, animated, and quick, with varied emphasis.",
        "speed": 1.15,
        "delivery_mode": "performance",
    },
    "Quiet": {
        "instruction": "Speak quietly and intimately: soft, restrained, and close-mic, with longer pauses.",
        "speed": 0.7,
        "delivery_mode": "performance",
    },
    "Character": {
        "instruction": "Speak in a centered character voice: natural, even, conversational, and steady.",
        "speed": 1.0,
        "delivery_mode": "performance",
    },
    "Non-Verbal": {
        "instruction": "Give a brief non-verbal reaction first, then pause before the spoken line.",
        "speed": 0.9,
        "delivery_mode": "performance",
    },
}

def _audio_from_inworld_response(resp: requests.Response) -> bytes | None:
    content_type = resp.headers.get("content-type", "")
    if content_type.startswith("audio/") or content_type == "application/octet-stream":
        return resp.content
    try:
        payload = resp.json()
    except ValueError:
        return None
    audio_content = (
        payload.get("audioContent")
        or payload.get("audio_content")
        or (payload.get("audio") or {}).get("content")
        or (payload.get("audio") or {}).get("data")
    )
    if isinstance(audio_content, str) and audio_content:
        return base64.b64decode(audio_content)
    return None

def synthesize_research_audio(
    text: str,
    *,
    voice_id: str,
    emotion_family: str,
    model_id: str = RESEARCH_TTS_MODEL,
    sample_rate: int = 24000,
) -> tuple[bytes, dict]:
    steering = RESEARCH_EMOTION_STEERING.get(emotion_family)
    if not steering:
        raise HTTPException(400, f"Unsupported emotion family: {emotion_family}")

    # TTS-2 steering is natural-language text inside brackets before the line.
    # Keep the generated script intact after the steering prefix so testers can
    # compare the same copy across emotion families.
    steered_text = f"[{steering['instruction']}]\n{text.strip()}"
    modern_payload = {
        "text": steered_text,
        "voice": voice_id,
        "model": model_id,
        "encoding": "MP3",
        "sampleRate": sample_rate,
        "delivery_mode": steering["delivery_mode"],
        "speed": steering["speed"],
    }
    legacy_payload = {
        "voiceId": voice_id,
        "modelId": model_id,
        "text": steered_text,
        "audioConfig": {
            "audioEncoding": "MP3",
            "sampleRateHertz": sample_rate,
        },
    }

    attempts = [
        ("modern", INWORLD_TTS_SYNTH_URL, modern_payload),
        ("legacy", INWORLD_TTS_URL, legacy_payload),
    ]
    last_error = ""
    for mode, url, payload in attempts:
        resp = requests.post(url, headers=INWORLD_HEADERS, json=payload, timeout=60)
        if resp.status_code == 200:
            audio = _audio_from_inworld_response(resp)
            if audio:
                return audio, {
                    "mode": mode,
                    "model": model_id,
                    "emotion_family": emotion_family,
                    "instruction": steering["instruction"],
                    "speed": steering["speed"],
                    "delivery_mode": steering["delivery_mode"],
                }
            last_error = f"{mode} response did not contain audio"
            continue
        last_error = f"{mode} failed: {resp.status_code} {resp.text[:300]}"
        print(f"[Research TTS] {last_error}")

    raise HTTPException(502, f"Inworld research TTS failed: {last_error}")

def research_voice_cache_key(
    text: str,
    *,
    voice_id: str,
    emotion_family: str,
    model_id: str,
) -> str:
    payload = {
        "text": text.strip(),
        "voice_id": voice_id.strip(),
        "emotion_family": emotion_family,
        "model_id": model_id,
        "cache_version": 1,
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()

def research_voice_cache_path(cache_key: str) -> pathlib.Path:
    return pathlib.Path(RESEARCH_VOICE_CACHE_DIR) / f"{cache_key}.mp3"

# ── Inworld session helper ────────────────────────────────────────────────────
def is_open(conn) -> bool:
    try:
        return conn is not None and conn.state == State.OPEN
    except Exception:
        return False

async def open_inworld_session(session_config: dict | None = None):
    config = session_config or SESSION_CONFIG
    session_key = f"ricon-twin-{uuid.uuid4().hex}"
    realtime_url = f"{INWORLD_REALTIME_URL_BASE}?key={session_key}&protocol=realtime"
    inworld = await ws_lib.connect(
        realtime_url,
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
                    await inworld.send(json.dumps(config))
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

# ── App ──────────────────────────────────────────────────────────────────────
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
    if _db is None:
        print("  MongoDB not configured; twin CRUD disabled for this process")
        return
    # Single deduplication key: coreIdentity.name (player name), which is exactly
    # how the fan app merges twins. We previously also kept a unique _wiki_id index;
    # combining two unique indexes meant an upsert filtered on one key could collide
    # with another document's key on the other index, raising E11000 and dropping
    # the (already enriched) save. Drop the legacy index so that can't recur.
    try:
        await _db.twins.drop_index("_wiki_id_1")
        print("✓ Dropped legacy _wiki_id unique index")
    except Exception as e:
        print(f"  (no legacy _wiki_id index to drop: {e})")
    # sparse=True so documents without a name don't violate the constraint.
    try:
        await _db.twins.create_index("coreIdentity.name", unique=True, sparse=True)
        print("✓ MongoDB deduplication index ready (coreIdentity.name)")
    except Exception as e:
        print(f"⚠ MongoDB index creation skipped (may already exist or duplicates present): {e}")

@app.get("/health")
async def health():
    return {"status": "ok", "voice": VOICE_ID, "mode": "realtime"}

# ── REST fallback: reliable non-streaming Q&A ─────────────────────────────────
class AskRequest(BaseModel):
    question:   str
    athlete_id: str = "west_d"

class AskResponse(BaseModel):
    text:         str
    audio_base64: str

class ProfileAskRequest(BaseModel):
    question: str
    profile: dict[str, Any]

class ProfileAskResponse(BaseModel):
    text: str

class ProfileNarratorRequest(BaseModel):
    beat_index: int
    profile: dict[str, Any]

@app.post("/twin/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    text = generate_openai_text(req.question, DAVID_REALTIME_PROMPT)
    audio = synthesize_audio(text)
    return AskResponse(text=text, audio_base64=base64.b64encode(audio).decode("utf-8"))

@app.post("/api/twin/generate-answer", response_model=ProfileAskResponse)
async def generate_profile_answer(req: ProfileAskRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")
    text = generate_openai_text(question, build_profile_qa_prompt(req.profile))
    return ProfileAskResponse(text=text)

@app.post("/api/twin/generate-narrator", response_model=ProfileAskResponse)
async def generate_profile_narrator(req: ProfileNarratorRequest):
    text = generate_openai_text(
        f"Write narrator chapter {req.beat_index}.",
        build_profile_narrator_prompt(req.profile, req.beat_index),
        max_tokens=220,
    )
    return ProfileAskResponse(text=text)

# ── WebSocket Q&A ─────────────────────────────────────────────────────────────
@app.websocket("/twin/ws")
async def twin_ws(browser: WebSocket):
    await browser.accept()
    print("Browser connected")
    inworld = None
    session_config = SESSION_CONFIG
    try:
        while True:
            msg = await browser.receive_json()
            if msg.get("type") == "ping":
                continue
            if msg.get("type") == "configure":
                profile = msg.get("profile") or {}
                voice_id = (msg.get("voice_id") or VOICE_ID).strip()
                instructions = build_profile_qa_prompt(profile) if profile else DAVID_REALTIME_PROMPT
                session_config = build_realtime_session_config(
                    instructions=instructions,
                    voice_id=voice_id or VOICE_ID,
                )
                if inworld is not None:
                    try:
                        await inworld.close()
                    except Exception:
                        pass
                    inworld = None
                try:
                    inworld = await open_inworld_session(session_config)
                    await browser.send_json({"type": "ready"})
                except Exception as e:
                    print(f"Configure failed: {e}")
                    await browser.send_json({"type": "error", "message": "configure_failed"})
                continue
            if msg.get("type") != "question":
                continue
            text = msg.get("text", "").strip()
            if not text:
                continue
            if inworld is None:
                try:
                    inworld = await open_inworld_session(session_config)
                    await browser.send_json({"type": "ready"})
                except Exception as e:
                    print(f"Session open failed: {e}")
                    await browser.send_json({"type": "error", "message": "session_failed"})
                    continue
            if not is_open(inworld):
                print("Reconnecting to Inworld...")
                try:
                    inworld = await open_inworld_session(session_config)
                except Exception as e:
                    print(f"Reconnect failed: {e}")
                    await browser.send_json({"type": "error", "message": "reconnect_failed"})
                    continue
            try:
                await inworld.send(json.dumps({
                    "type": "conversation.item.create",
                    "item": {
                        "type": "message", "role": "user",
                        "content": [{"type": "input_text", "text": text}],
                    },
                }))
                await inworld.send(json.dumps({"type": "response.create"}))
            except Exception as e:
                print(f"Send failed: {e}")
                inworld = None
                await browser.send_json({"type": "error", "message": "send_failed"})
                continue
            try:
                async with asyncio.timeout(30):
                    async for raw in inworld:
                        event = json.loads(raw)
                        t = event.get("type", "")
                        if t in (
                            "response.text.delta", "response.output_audio.delta",
                            "response.output_item.done", "response.done", "error",
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

# ── Narrator endpoints ────────────────────────────────────────────────────────
class SpeakRequest(BaseModel):
    text:     str
    instruct: str = NARRATOR_INSTRUCT

class SpeakResponse(BaseModel):
    audio_base64: str

class ResearchSpeakRequest(BaseModel):
    text: str
    emotion_family: str = "Character"
    voice_id: str = ""
    model_id: str = RESEARCH_TTS_MODEL

class ResearchSpeakResponse(BaseModel):
    audio_base64: str
    meta: dict

class BeatItem(BaseModel):
    index: int
    text:  str

class PregenerateRequest(BaseModel):
    beats: List[BeatItem]

class PregenerateResponse(BaseModel):
    urls: dict

@app.post("/twin/speak", response_model=SpeakResponse)
async def speak(req: SpeakRequest):
    audio = synthesize_audio(req.text, req.instruct)
    return SpeakResponse(audio_base64=base64.b64encode(audio).decode("utf-8"))

@app.post("/api/research/voice/speak", response_model=ResearchSpeakResponse)
async def research_voice_speak(req: ResearchSpeakRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")

    voice_id = (req.voice_id or WALT_VOICE_ID).strip()
    model_id = req.model_id or RESEARCH_TTS_MODEL
    if not voice_id:
        raise HTTPException(
            status_code=400,
            detail="A cloned Inworld voice ID is required. Set WALT_VOICE_ID on the backend or pass voice_id.",
        )

    cache_key = research_voice_cache_key(
        text,
        voice_id=voice_id,
        emotion_family=req.emotion_family,
        model_id=model_id,
    )
    cache_path = research_voice_cache_path(cache_key)
    if cache_path.exists():
        audio = cache_path.read_bytes()
        return ResearchSpeakResponse(
            audio_base64=base64.b64encode(audio).decode("utf-8"),
            meta={
                "mode": "cache",
                "model": model_id,
                "emotion_family": req.emotion_family,
                "voice_id": voice_id,
                "cache_key": cache_key,
                "cached": True,
                "cache_url": f"/static/research_voice/{cache_key}.mp3",
            },
        )

    try:
        audio, meta = await asyncio.to_thread(
            synthesize_research_audio,
            text,
            voice_id=voice_id,
            emotion_family=req.emotion_family,
            model_id=model_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Research TTS] synthesis skipped: {e}")
        raise HTTPException(status_code=502, detail="Research voice synthesis failed")

    try:
        cache_path.write_bytes(audio)
    except Exception as e:
        print(f"[Research TTS] cache write skipped: {e}")

    meta = {
        **meta,
        "voice_id": voice_id,
        "cache_key": cache_key,
        "cached": False,
        "cache_url": f"/static/research_voice/{cache_key}.mp3",
    }
    return ResearchSpeakResponse(
        audio_base64=base64.b64encode(audio).decode("utf-8"),
        meta=meta,
    )

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

# ── Twin CRUD (Storyline-Studio remote storage) ───────────────────────────────

@app.get("/api/twins")
async def list_twins():
    return [twin async for twin in _db.twins.find({}, {"_id": 0})]

@app.get("/api/twins/{twin_id}")
async def get_twin(twin_id: str):
    twin = await _db.twins.find_one({"twinId": twin_id}, {"_id": 0})
    if not twin:
        raise HTTPException(status_code=404, detail="Twin not found")
    return twin

@app.put("/api/twins/{twin_id}")
async def upsert_twin(twin_id: str, request: Request):
    twin = await request.json()
    twin["twinId"] = twin_id
    twin.pop("_wiki_id", None)  # legacy field — no longer a dedup key

    player_name = (twin.get("coreIdentity") or {}).get("name", "").strip()

    # Enrichment is best-effort: a failure here must never block the save.
    # The blocking `requests` calls (with retries) run in a worker thread so
    # they don't stall the event loop.
    if player_name:
        # 1. Ball Don't Lie
        if BDL_API_KEY:
            try:
                bdl = await asyncio.to_thread(bdl_enrich, player_name)
                if bdl:
                    twin["bdl_verified_stats"] = bdl
            except Exception as e:
                print(f"[BDL] enrichment skipped: {e}")

        # 2. Wikipedia — prefer stats already in the imported summary, else fetch live
        try:
            wiki_stats = wiki_extract_stats((twin.get("wikipedia") or {}).get("summary", ""))
            if not wiki_stats:
                wiki_stats = await asyncio.to_thread(wiki_fetch_and_extract, player_name)
            if wiki_stats:
                twin["wiki_verified_stats"] = wiki_stats
                print(f"[Wiki] ✓ {player_name}: {wiki_stats}")
        except Exception as e:
            print(f"[Wiki] enrichment skipped: {e}")

    # Deduplicate on coreIdentity.name — the same key the fan app merges on, and
    # the same field the unique index covers. Because the upsert filter targets
    # that field, an inserted document can never collide with another's key.
    try:
        if player_name:
            await _db.twins.replace_one({"coreIdentity.name": player_name}, twin, upsert=True)
        else:
            await _db.twins.replace_one({"twinId": twin_id}, twin, upsert=True)
    except Exception as e:
        print(f"[Mongo] upsert failed for '{player_name or twin_id}': {e}")
        raise HTTPException(status_code=500, detail="Failed to save twin")

    return {"ok": True}

@app.delete("/api/twins/{twin_id}")
async def delete_twin(twin_id: str):
    result = await _db.twins.delete_one({"twinId": twin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Twin not found")
    return {"ok": True}

# ── Enrichment test endpoints ─────────────────────────────────────────────────

@app.get("/api/enrich/nba/{player_name}")
async def enrich_nba(player_name: str):
    data = bdl_enrich(player_name)
    if not data:
        raise HTTPException(status_code=404, detail=f"'{player_name}' not found on Ball Don't Lie")
    return data

@app.get("/api/enrich/wiki/{player_name}")
async def enrich_wiki(player_name: str):
    stats = wiki_fetch_and_extract(player_name)
    if not stats:
        raise HTTPException(status_code=404, detail=f"No stats found for '{player_name}'")
    return stats

@app.get("/api/debug/wiki/{player_name}")
async def debug_wiki(player_name: str):
    try:
        search_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            headers=WIKI_HEADERS,
            params={
                "action": "query", "list": "search",
                "srsearch": f"{player_name} NBA basketball player",
                "srlimit": 3, "format": "json",
            }, timeout=10,
        )
        if not search_resp.text.strip():
            return {"error": "Empty search response"}
        results = search_resp.json().get("query", {}).get("search", [])
        title = results[0]["title"] if results else player_name
        extract_resp = requests.get(
            "https://en.wikipedia.org/w/api.php",
            headers=WIKI_HEADERS,
            params={
                "action": "query", "titles": title,
                "prop": "extracts", "exintro": True,
                "explaintext": True, "format": "json",
            }, timeout=10,
        )
        if not extract_resp.text.strip():
            return {"error": "Empty extract response", "selected_title": title}
        pages = extract_resp.json().get("query", {}).get("pages", {})
        page  = next(iter(pages.values()), {})
        text  = page.get("extract", "")
        return {
            "search_results":  [r["title"] for r in results],
            "selected_title":  title,
            "extract_length":  len(text),
            "extract_preview": text[:800],
            "parsed_stats":    wiki_extract_stats(text),
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
