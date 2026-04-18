# VidSage — Complete IDE Build Plan (GPU + Ollama Cloud Edition)
# RTX 3050 Ti (4GB VRAM) + Ollama Cloud (LLaMA 3.3 70B) + Local GPU (LLaMA 3.2 3B)
# Give this file to your IDE as full context before starting any phase.

================================================================================
HARDWARE CONTEXT — READ BEFORE ANYTHING ELSE
================================================================================

GPU       : NVIDIA RTX 3050 Ti Laptop
VRAM      : 4GB GDDR6
CUDA      : 12.x (verify with: nvidia-smi)
Strategy  : Load Whisper large-v3 (~1.5GB) + LLaMA 3.2 3B Q4 (~2GB) simultaneously
            = ~3.5GB VRAM used, 0.5GB headroom for activations
            LLaMA 3.1/3.3 8B+ → routes to Ollama Cloud (does NOT fit in 4GB)

INFERENCE ROUTING RULE (implement this first — everything depends on it):
  FAST / LATENCY-SENSITIVE tasks → Local GPU (LLaMA 3.2 3B Q4_K_M)
    - Voice intent classification
    - Simple term summaries (after Cloud does initial detection)
    - Any task needing sub-3s response

  HEAVY / REASONING tasks → Ollama Cloud (LLaMA 3.3 70B)
    - Full transcript term detection
    - Multi-step research agent tool loops
    - Research brief generation
    - Long context analysis

  AUDIO → Always local GPU (faster-whisper CUDA float16)
  WAKE WORD → Always local (OpenWakeWord ONNX CUDA)


================================================================================
MODELS REFERENCE
================================================================================

Local (pull these before coding):
  ollama pull llama3.2:3b          # Fast model, ~2GB VRAM, Q4_K_M auto
  # DO NOT pull llama3.1:8b — 4.8GB, will OOM your 4GB GPU

Cloud (configure in .env):
  Model name : llama3.3:70b
  Endpoint   : https://api.ollama.com  (Ollama Cloud — sign up at ollama.com/cloud)
  Auth       : Bearer token in Authorization header

Whisper:
  Model      : large-v3
  Device     : cuda
  Compute    : float16  ← CRITICAL for GPU — int8 is CPU-only mode


================================================================================
REQUIREMENTS.TXT
================================================================================

fastapi==0.110.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
faster-whisper==1.0.1
yt-dlp==2024.3.10
ffmpeg-python==0.2.0
sqlalchemy[asyncio]==2.0.29
asyncpg==0.29.0
alembic==1.13.1
openwakeword==0.6.0
pyaudio==0.2.14
reportlab==4.1.0
httpx==0.27.0
wikipedia-api==0.6.0
arxiv==2.1.0
python-dotenv==1.0.1
pydantic==2.6.4
pydantic-settings==2.2.1
ollama==0.1.9
torch==2.2.0+cu121               # PyTorch CUDA 12.1 build — for OpenWakeWord GPU
torchaudio==2.2.0+cu121
onnxruntime-gpu==1.17.1          # ONNX Runtime GPU — for OpenWakeWord CUDA

# Install PyTorch CUDA build separately:
# pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121


================================================================================
CONFIG.PY
================================================================================

from pydantic_settings import BaseSettings
from enum import Enum

class InferenceTarget(str, Enum):
    LOCAL = "local"
    CLOUD = "cloud"

class Settings(BaseSettings):
    # Local Ollama (GPU)
    ollama_local_url: str = "http://localhost:11434"
    ollama_local_model: str = "llama3.2:3b"

    # Ollama Cloud (70B)
    ollama_cloud_url: str = "https://api.ollama.com"
    ollama_cloud_key: str = ""
    ollama_cloud_model: str = "llama3.3:70b"
    ollama_cloud_fallback: bool = True   # fall back to local if Cloud unavailable

    # Whisper — ALWAYS CUDA on this machine
    whisper_model: str = "large-v3"
    whisper_device: str = "cuda"
    whisper_compute_type: str = "float16"   # float16 = GPU mode, int8 = CPU mode

    # Database + Search
    database_url: str = "postgresql+asyncpg://vidsage_user:vidsage_pass@localhost:5432/vidsage"
    searxng_url: str = "http://localhost:8080"
    upload_dir: str = "./uploads"
    export_dir: str = "./exports"

    class Config:
        env_file = ".env"

settings = Settings()


================================================================================
DOCKER-COMPOSE.YML
================================================================================

version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: vidsage
      POSTGRES_USER: vidsage_user
      POSTGRES_PASSWORD: vidsage_pass
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  searxng:
    image: searxng/searxng:latest
    ports:
      - "8080:8080"
    volumes:
      - ./searxng:/etc/searxng
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080

volumes:
  pgdata:


================================================================================
PHASE 0 — CUDA VERIFICATION + GPU SETUP (Do this before Phase 1)
================================================================================

--- STEP 0.1: Verify CUDA is working ---

Run these commands. Every one must succeed before writing code:

  nvidia-smi
  # Expected: RTX 3050 Ti, CUDA Version 12.x, ~4096 MiB total memory

  nvcc --version
  # Expected: release 12.x

  python -c "import torch; print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0))"
  # Expected: True, NVIDIA GeForce RTX 3050 Ti Laptop GPU

  python -c "from faster_whisper import WhisperModel; m = WhisperModel('base', device='cuda', compute_type='float16'); print('Whisper CUDA OK')"
  # Expected: Whisper CUDA OK (no errors)


--- STEP 0.2: Verify Ollama GPU usage ---

  # Start Ollama service if not running
  ollama serve &

  # Run a prompt and watch GPU memory in another terminal
  watch -n1 nvidia-smi &
  ollama run llama3.2:3b "hello world"
  # You should see GPU memory jump by ~2GB in nvidia-smi


--- STEP 0.3: Verify Ollama Cloud access ---

  curl https://api.ollama.com/api/chat \
    -H "Authorization: Bearer YOUR_CLOUD_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model": "llama3.3:70b", "messages": [{"role":"user","content":"hello"}], "stream": false}'
  # Expected: JSON response with content field


================================================================================
PHASE 1 — VIDEO INGESTION + FASTER-WHISPER CUDA PIPELINE
Target: Weeks 1–2
================================================================================

--- STEP 1.1: agents/inference_router.py (THE MOST IMPORTANT FILE) ---

# This module routes every LLM call to either local GPU or Ollama Cloud.
# All agents import this — never call Ollama directly from agent files.
# The router also handles Cloud unavailability by falling back to local.

import httpx
import json
from config import settings

class InferenceRouter:
    """
    Routes LLM inference requests to local GPU (LLaMA 3.2 3B)
    or Ollama Cloud (LLaMA 3.3 70B) based on task complexity.
    Implements automatic fallback: Cloud → Local if Cloud is down.
    """

    async def chat_cloud(
        self,
        prompt: str,
        system: str = None,
        tools: list = None,
        expect_json: bool = False,
        timeout: float = 120.0
    ) -> str | list:
        """Send request to Ollama Cloud (LLaMA 3.3 70B). Falls back to local on error."""
        try:
            result = await self._ollama_request(
                base_url=settings.ollama_cloud_url,
                model=settings.ollama_cloud_model,
                prompt=prompt,
                system=system,
                tools=tools,
                expect_json=expect_json,
                timeout=timeout,
                headers={"Authorization": f"Bearer {settings.ollama_cloud_key}"}
            )
            return result
        except Exception as e:
            if settings.ollama_cloud_fallback:
                print(f"[Router] Cloud failed ({e}), falling back to local model")
                return await self.chat_local(prompt, system, tools, expect_json)
            raise

    async def chat_local(
        self,
        prompt: str,
        system: str = None,
        tools: list = None,
        expect_json: bool = False,
        timeout: float = 60.0
    ) -> str | list:
        """Send request to local Ollama GPU (LLaMA 3.2 3B Q4_K_M)."""
        return await self._ollama_request(
            base_url=settings.ollama_local_url,
            model=settings.ollama_local_model,
            prompt=prompt,
            system=system,
            tools=tools,
            expect_json=expect_json,
            timeout=timeout,
            headers={}
        )

    async def _ollama_request(
        self,
        base_url: str,
        model: str,
        prompt: str,
        system: str,
        tools: list,
        expect_json: bool,
        timeout: float,
        headers: dict
    ) -> str | list:
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        payload = {"model": model, "messages": messages, "stream": False}
        if tools:
            payload["tools"] = tools
        if expect_json:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            response = await client.post(f"{base_url}/api/chat", json=payload)
            response.raise_for_status()
            data = response.json()

        message = data["message"]

        if tools and message.get("tool_calls"):
            return message["tool_calls"]

        return message["content"]

    async def chat_cloud_with_tools_loop(
        self,
        initial_messages: list,
        tools: list,
        tool_executor,           # callable: (tool_name, tool_args) -> result
        max_iterations: int = 5,
        system: str = None
    ) -> list:
        """
        Full agentic tool-calling loop via Ollama Cloud.
        Sends messages, executes returned tool calls, feeds results back.
        Returns list of all collected tool results.
        """
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.extend(initial_messages)

        all_results = []

        for i in range(max_iterations):
            payload = {
                "model": settings.ollama_cloud_model,
                "messages": messages,
                "tools": tools,
                "stream": False
            }
            headers = {"Authorization": f"Bearer {settings.ollama_cloud_key}"}

            async with httpx.AsyncClient(timeout=120.0, headers=headers) as client:
                response = await client.post(
                    f"{settings.ollama_cloud_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                data = response.json()

            message = data["message"]

            if not message.get("tool_calls"):
                break

            messages.append(message)

            for tool_call in message["tool_calls"]:
                fn = tool_call["function"]
                result = tool_executor(fn["name"], fn["arguments"])

                if isinstance(result, list):
                    all_results.extend([r for r in result if r])
                elif result:
                    all_results.append(result)

                messages.append({
                    "role": "tool",
                    "content": json.dumps(result)
                })

        return all_results

# Singleton router — import this everywhere
router = InferenceRouter()


--- STEP 1.2: processing/whisper_stt.py (CUDA float16) ---

from faster_whisper import WhisperModel
from config import settings

_model = None

def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(
            settings.whisper_model,       # large-v3
            device=settings.whisper_device,          # "cuda"
            compute_type=settings.whisper_compute_type  # "float16" — GPU mode
            # float16 on CUDA = maximum speed on RTX 3050 Ti
            # Do NOT use int8 on CUDA — int8 is designed for CPU only
            # float16 uses ~1.5GB VRAM for large-v3
        )
        print(f"[Whisper] Loaded {settings.whisper_model} on {settings.whisper_device} ({settings.whisper_compute_type})")
    return _model

def transcribe(audio_path: str) -> dict:
    model = get_model()
    segments_gen, info = model.transcribe(
        audio_path,
        word_timestamps=True,
        language=None,           # auto-detect EN/HI
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
        beam_size=5              # higher beam = better accuracy, slightly slower
    )

    full_text_parts, segments, words = [], [], []

    for segment in segments_gen:
        full_text_parts.append(segment.text.strip())
        segments.append({
            "start": round(segment.start, 3),
            "end": round(segment.end, 3),
            "text": segment.text.strip()
        })
        if segment.words:
            for word in segment.words:
                words.append({
                    "word": word.word.strip(),
                    "start": round(word.start, 3),
                    "end": round(word.end, 3),
                    "probability": round(word.probability, 3)
                })

    return {
        "full_text": " ".join(full_text_parts),
        "language": info.language,
        "language_probability": round(info.language_probability, 3),
        "duration": round(info.duration, 2),
        "segments": segments,
        "words": words
    }


--- STEP 1.3: processing/ffmpeg_extractor.py ---

import ffmpeg, os
from pathlib import Path

def extract_audio(video_path: str, output_dir: str = "./uploads") -> str:
    video_path = Path(video_path)
    output_path = Path(output_dir) / (video_path.stem + ".wav")
    os.makedirs(output_dir, exist_ok=True)
    (
        ffmpeg.input(str(video_path))
        .output(str(output_path), acodec='pcm_s16le', ac=1, ar='16000')
        .overwrite_output()
        .run(quiet=True)
    )
    return str(output_path)


--- STEP 1.4: processing/ytdlp_downloader.py ---

import yt_dlp, os

def download_youtube(url: str, output_dir: str = "./uploads") -> str:
    os.makedirs(output_dir, exist_ok=True)
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': os.path.join(output_dir, '%(id)s.%(ext)s'),
        'quiet': True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        return ydl.prepare_filename(info)

def search_youtube(query: str, max_results: int = 3) -> list[dict]:
    with yt_dlp.YoutubeDL({'quiet': True, 'extract_flat': True}) as ydl:
        result = ydl.extract_info(f"ytsearch{max_results}:{query}", download=False)
        return [
            {
                "source": "youtube",
                "title": e.get("title", ""),
                "url": f"https://youtube.com/watch?v={e.get('id', '')}",
                "channel": e.get("uploader", "")
            }
            for e in result.get('entries', []) if e
        ]


--- STEP 1.5: Phase 1 test ---

1. Run: watch -n1 nvidia-smi  (in a separate terminal)
2. Start server: uvicorn main:app --reload
3. POST /api/video/upload with a short MP4
4. While processing, confirm nvidia-smi shows Whisper using GPU memory
5. Confirm transcript JSON returned with words array

Phase 1 DONE when: MP4 → GPU-transcribed JSON, nvidia-smi shows VRAM usage ✅


================================================================================
PHASE 2 — TERM DETECTION AGENT (Ollama Cloud LLaMA 3.3 70B)
Target: Weeks 3–5
================================================================================

--- STEP 2.1: agents/term_detector.py ---

# Routes to Ollama Cloud (LLaMA 3.3 70B) for deep, nuanced term detection.
# 70B is significantly better than 3B for identifying subtle scientific jargon,
# understanding context, and generating high-quality beginner-friendly summaries.

import json
from agents.inference_router import router

SYSTEM_PROMPT = """You are an expert science communicator with deep knowledge across biology,
chemistry, physics, computer science, and medicine.

Given a video transcript, identify ALL domain-specific or uncommon technical terms
that a non-specialist would not understand.

Return ONLY a valid JSON array with this exact schema (no markdown, no explanation):
[
  {
    "term": "photosynthesis",
    "first_timestamp": 12.4,
    "summary": "The process by which plants use sunlight, water, and carbon dioxide to produce glucose sugar and oxygen. Think of it as the plant's way of cooking its own food using sunlight as the stove.",
    "complexity": "medium",
    "domain": "biology",
    "search_queries": ["photosynthesis explained simply", "how plants make food", "photosynthesis biology basics"]
  }
]

Rules:
- summary: 2-3 sentences, language a curious 12-year-old can understand
- complexity: "medium" (heard of it but don't know it) or "high" (never heard of it)
- domain: "biology", "chemistry", "physics", "computer science", "medicine", or "general"
- first_timestamp: seconds when term first spoken (your best estimate from text position)
- search_queries: 3 specific queries that would find good explainer content
- Include terms from Hindi text if transcript contains Hindi
- Return [] if no complex terms found"""

async def detect_terms(transcript: dict) -> list[dict]:
    """
    Detect complex terms using Ollama Cloud LLaMA 3.3 70B.
    Falls back to local LLaMA 3.2 3B automatically if Cloud unavailable.
    """
    full_text = transcript["full_text"]
    words = transcript["words"]

    # Build word → earliest timestamp lookup from Whisper output
    word_timestamps = {}
    for w in words:
        clean = w["word"].lower().strip(".,!?;:'\"")
        if clean and clean not in word_timestamps:
            word_timestamps[clean] = w["start"]

    # LLaMA 3.3 70B has 128K context — can handle very long transcripts
    # Still truncate at 12K chars to keep costs reasonable
    max_chars = 12000
    text_input = full_text[:max_chars] + ("...[truncated]" if len(full_text) > max_chars else "")

    # Cloud route for high-quality detection
    raw = await router.chat_cloud(
        prompt=f"Transcript:\n{text_input}",
        system=SYSTEM_PROMPT,
        expect_json=True
    )

    try:
        terms = json.loads(raw)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        terms = json.loads(match.group()) if match else []

    # Enrich timestamps from Whisper word-level data (more precise than LLM estimate)
    for term in terms:
        term_words = term["term"].lower().split()
        for tw in term_words:
            if tw in word_timestamps:
                term["first_timestamp"] = word_timestamps[tw]
                break

    return terms


--- STEP 2.2: Phase 2 test ---

1. Confirm Ollama Cloud credentials are in .env
2. Run detect_terms() on a transcript with scientific content
3. Compare output quality vs running with local 3B model — 70B should be noticeably better
4. Test Hindi transcript — confirm Hindi jargon detected alongside English

Phase 2 DONE when: transcript → high-quality term list with summaries via Cloud ✅


================================================================================
PHASE 3 — RESEARCH AGENT WITH TOOL CALLING (Cloud 70B)
Target: Weeks 6–8
================================================================================

--- STEP 3.1: mcp_tools/ (all four tools) ---

# wikipedia_tool.py
import wikipediaapi
wiki_en = wikipediaapi.Wikipedia(language='en', user_agent='VidSage/1.0')
wiki_hi = wikipediaapi.Wikipedia(language='hi', user_agent='VidSage/1.0')

def search_wikipedia(term: str, language: str = "en") -> dict | None:
    wiki = wiki_hi if language == "hi" else wiki_en
    page = wiki.page(term)
    if not page.exists():
        page = wiki_en.page(term.split()[0])
    if not page.exists():
        return None
    return {
        "source": "wikipedia",
        "title": page.title,
        "url": page.fullurl,
        "summary": page.summary[:300] + "..."
    }

# arxiv_tool.py
import arxiv

def search_arxiv(query: str, max_results: int = 2) -> list[dict]:
    client = arxiv.Client()
    search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)
    return [
        {
            "source": "arxiv",
            "title": p.title,
            "url": p.entry_id,
            "authors": [a.name for a in p.authors[:3]],
            "summary": p.summary[:200] + "..."
        }
        for p in client.results(search)
    ]

# searxng_tool.py
import httpx
from config import settings

def web_search(query: str, max_results: int = 3) -> list[dict]:
    with httpx.Client(timeout=10.0) as client:
        r = client.get(f"{settings.searxng_url}/search", params={"q": query, "format": "json"})
        r.raise_for_status()
        data = r.json()
    return [
        {
            "source": "web",
            "title": r.get("title", ""),
            "url": r.get("url", ""),
            "snippet": r.get("content", "")[:200]
        }
        for r in data.get("results", [])[:max_results]
    ]

# youtube_tool.py → uses search_youtube() from ytdlp_downloader.py


--- STEP 3.2: agents/research_agent.py ---

# Uses InferenceRouter.chat_cloud_with_tools_loop() for full agentic tool calling
# via LLaMA 3.3 70B on Ollama Cloud. 70B is significantly better than 3B at
# deciding WHICH tools to call, in what order, and when to stop.

from agents.inference_router import router
from mcp_tools.wikipedia_tool import search_wikipedia
from mcp_tools.arxiv_tool import search_arxiv
from mcp_tools.searxng_tool import web_search
from processing.ytdlp_downloader import search_youtube

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_wikipedia",
            "description": "Get a Wikipedia summary and article URL for a term. Use for definitions and overviews.",
            "parameters": {
                "type": "object",
                "properties": {
                    "term": {"type": "string"},
                    "language": {"type": "string", "enum": ["en", "hi"], "default": "en"}
                },
                "required": ["term"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_arxiv",
            "description": "Search ArXiv for academic papers. Use for scientific and technical terms.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "max_results": {"type": "integer", "default": 2}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for general explainers, tutorials, and educational content.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "max_results": {"type": "integer", "default": 3}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_youtube",
            "description": "Find YouTube video explainers for a term. Use to get video references.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "max_results": {"type": "integer", "default": 2}
                },
                "required": ["query"]
            }
        }
    }
]

def execute_tool(name: str, args: dict):
    if name == "search_wikipedia":
        return search_wikipedia(args["term"], args.get("language", "en"))
    elif name == "search_arxiv":
        return search_arxiv(args["query"], args.get("max_results", 2))
    elif name == "web_search":
        return web_search(args["query"], args.get("max_results", 3))
    elif name == "search_youtube":
        return search_youtube(args["query"], args.get("max_results", 2))

async def fetch_references(term: str, summary: str, domain: str = "general") -> list[dict]:
    """
    Agentic reference fetching via Ollama Cloud LLaMA 3.3 70B.
    The 70B model makes better decisions about which tools to call for each domain.
    e.g. biology terms → Wikipedia + ArXiv + YouTube
         CS terms → web_search + ArXiv + YouTube
         General terms → Wikipedia + YouTube + web_search
    """
    initial_messages = [
        {
            "role": "user",
            "content": (
                f'Find 3-5 high-quality references for the term: "{term}"\n'
                f'Domain: {domain}\n'
                f'Context: {summary}\n\n'
                f'Use tools strategically based on the domain. '
                f'For scientific terms, prioritise ArXiv + Wikipedia. '
                f'Always include at least one YouTube explainer. '
                f'Prefer beginner-friendly sources.'
            )
        }
    ]

    all_results = await router.chat_cloud_with_tools_loop(
        initial_messages=initial_messages,
        tools=TOOLS,
        tool_executor=execute_tool,
        max_iterations=5,
        system="You are a research assistant. Use the provided tools to find educational references. Stop when you have 3-5 good references."
    )

    # Deduplicate by URL
    seen = set()
    unique = []
    for ref in all_results:
        if ref and ref.get("url") not in seen:
            seen.add(ref.get("url"))
            unique.append(ref)

    return unique[:5]


================================================================================
PHASE 4 — REACT FRONTEND + VIDEO OVERLAY UI
Target: Weeks 9–11
================================================================================

--- STEP 4.1: Frontend setup ---

cd frontend
npm create vite@latest . -- --template react
npm install axios zustand react-player tailwindcss @tailwindcss/vite
npx tailwindcss init
npx shadcn-ui@latest init
npx shadcn-ui@latest add card button badge tabs


--- STEP 4.2: src/hooks/useVideoSync.js ---

// Filter terms visible at current playback position
const useVideoSync = (terms, currentTime) => {
  return terms.filter(term =>
    term.first_timestamp >= currentTime - 0.3 &&
    term.first_timestamp <= currentTime + 3.0
  );
};
export default useVideoSync;


--- STEP 4.3: src/hooks/useSSE.js ---

import { useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';

const useSSE = (jobId) => {
  const addTerm = useSessionStore(s => s.addTerm);
  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`http://localhost:8000/api/terms/detect/${jobId}`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.status === 'complete') data.terms?.forEach(addTerm);
    };
    return () => es.close();
  }, [jobId]);
};
export default useSSE;


--- STEP 4.4: src/store/sessionStore.js ---

import { create } from 'zustand';

export const useSessionStore = create((set) => ({
  jobId: null,
  videoUrl: null,
  terms: [],
  notes: [],
  selectedTerm: null,
  mode: 'viewer',

  setJobId: (id) => set({ jobId: id }),
  addTerm: (term) => set((s) => ({ terms: [...s.terms, term] })),
  addNote: (note) => set((s) => ({ notes: [...s.notes, note] })),
  setSelectedTerm: (term) => set({ selectedTerm: term }),
  setMode: (mode) => set({ mode }),
}));


================================================================================
PHASE 5 — OPENWAKEWORD (CUDA) + VOICE PIPELINE + PDF EXPORT
Target: Weeks 12–14
================================================================================

--- STEP 5.1: Wake word with OpenWakeWord on CUDA ---

# OpenWakeWord uses ONNX Runtime. Install the GPU version:
# pip install onnxruntime-gpu openwakeword pyaudio

# OpenWakeWord auto-uses GPU via onnxruntime-gpu if CUDA is available.
# This leaves the GPU mostly idle between wake word checks — negligible VRAM.

import openwakeword
from openwakeword.model import Model
import pyaudio, numpy as np, wave, tempfile

oww_model = Model(
    wakeword_models=["hey_jarvis"],   # placeholder — train custom "Hey VidSage" later
    inference_framework="onnx"        # onnxruntime-gpu will use CUDA automatically
)

def listen_for_wake_word(on_command_detected, get_current_timestamp):
    """
    Runs in a background thread.
    Detects wake word → records 5s → transcribes with faster-whisper (GPU) → calls callback.
    """
    from processing.whisper_stt import get_model as get_whisper

    pa = pyaudio.PyAudio()
    stream = pa.open(rate=16000, channels=1, format=pyaudio.paInt16,
                     input=True, frames_per_buffer=1280)

    while True:
        chunk = stream.read(1280)
        audio_array = np.frombuffer(chunk, dtype=np.int16).astype(np.float32) / 32768.0
        oww_model.predict(audio_array)

        scores = list(oww_model.prediction_buffer.values())
        if scores and max(max(s) for s in scores) > 0.5:
            oww_model.reset()
            frames = [stream.read(1280) for _ in range(int(16000 / 1280 * 5))]

            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                wf = wave.open(f.name, 'wb')
                wf.setnchannels(1)
                wf.setsampwidth(pa.get_sample_size(pyaudio.paInt16))
                wf.setframerate(16000)
                wf.writeframes(b''.join(frames))
                wf.close()

                # Use already-loaded Whisper GPU model — no extra VRAM
                whisper = get_whisper()
                segments, _ = whisper.transcribe(f.name)
                text = " ".join(s.text for s in segments).strip()

                if text:
                    on_command_detected(text, get_current_timestamp())


--- STEP 5.2: agents/voice_agent.py (local GPU — fast response) ---

# Voice intent parsing uses LOCAL LLaMA 3.2 3B (GPU) — not Cloud.
# Reason: voice UX needs sub-3s response. Cloud adds network latency.
# LLaMA 3.2 3B is perfectly capable for simple intent classification.

import json
from agents.inference_router import router

SYSTEM_PROMPT = """Parse voice commands for a research assistant app.
Return ONLY a JSON object with:
- intent: "add_reminder" | "mark_important" | "add_note" | "generate_brief" | "read_notes"
- text: cleaned content of the note/reminder
- note_type: "reminder" | "important" | "general"
No explanation. JSON only."""

async def parse_voice_command(command: str, current_timestamp: float) -> dict:
    # LOCAL GPU — fast, no network latency for voice UX
    raw = await router.chat_local(
        prompt=f'Voice command: "{command}"\nTimestamp: {current_timestamp}s',
        system=SYSTEM_PROMPT,
        expect_json=True
    )
    try:
        result = json.loads(raw)
        result["timestamp"] = current_timestamp
        result["raw_command"] = command
        return result
    except:
        return {"intent": "add_note", "text": command, "note_type": "general",
                "timestamp": current_timestamp, "raw_command": command}


--- STEP 5.3: db/models.py ---

from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

class Session(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    mode = Column(String, default="scientist")

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, ForeignKey("sessions.id"))
    timestamp = Column(Float)
    text = Column(Text)
    note_type = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class TermGlossary(Base):
    __tablename__ = "term_glossary"
    term = Column(String, primary_key=True)
    summary = Column(Text)
    references_json = Column(Text)
    language = Column(String, default="en")
    last_updated = Column(DateTime, default=datetime.utcnow)
    # Cache avoids re-calling Cloud LLM for terms already seen in other videos


--- STEP 5.4: reports/pdf_generator.py ---

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.lib import colors
from datetime import datetime

def generate_session_report(session_data: dict, output_path: str) -> str:
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("VidSage — Research Session Brief", styles["Title"]))
    story.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    story.append(Paragraph("Detected Terms", styles["Heading1"]))
    for term in session_data.get("terms", []):
        story.append(Paragraph(f"{term['term']} @ {term.get('first_timestamp', 0):.1f}s — {term.get('domain','')}", styles["Heading2"]))
        story.append(Paragraph(term["summary"], styles["Normal"]))
        story.append(Spacer(1, 0.3*cm))

    story.append(Paragraph("Research Notes & Reminders", styles["Heading1"]))
    rows = [["Timestamp", "Type", "Note"]]
    for note in session_data.get("notes", []):
        rows.append([f"{note['timestamp']:.1f}s", note.get("note_type", "general"), note["text"]])
    if len(rows) > 1:
        t = Table(rows, colWidths=[2.5*cm, 3*cm, 11*cm])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        story.append(t)

    doc.build(story)
    return output_path


================================================================================
GPU MEMORY MANAGEMENT — KEEP VRAM HEALTHY
================================================================================

RULE 1 — Load Whisper once at startup, keep in memory:
  Whisper large-v3 on CUDA = ~1.5GB VRAM
  Load it once in whisper_stt.py (_model singleton)
  Never unload between requests — reloading costs 5-10 seconds

RULE 2 — Load LLaMA 3.2 3B via Ollama (Ollama manages its own VRAM):
  Ollama keeps model loaded between requests automatically
  Set OLLAMA_KEEP_ALIVE=5m in environment to keep model hot
  ollama ps  →  shows what's loaded and how much VRAM it's using

RULE 3 — Monitor VRAM during development:
  watch -n1 nvidia-smi
  Expected steady state: ~3.5GB used (Whisper 1.5 + Ollama LLaMA 3.5 ~2.0)
  If you see >3.8GB: something is double-loaded, restart Ollama

RULE 4 — OpenWakeWord uses negligible GPU memory:
  ONNX Runtime GPU for wake word ≈ ~50–100MB VRAM
  Runs in a background thread, doesn't interfere with Whisper or Ollama

RULE 5 — Never load LLaMA 3.1 8B or larger locally:
  8B Q4 = ~4.8GB VRAM → will OOM and crash
  Any model >3B params → route to Ollama Cloud

ENVIRONMENT VARIABLES for Ollama GPU:
  OLLAMA_NUM_PARALLEL=1        # one request at a time (avoids OOM on 4GB)
  OLLAMA_MAX_LOADED_MODELS=1   # keep only LLaMA 3.2 3B loaded at once
  OLLAMA_KEEP_ALIVE=5m         # keep model hot for 5 minutes after last use
  CUDA_VISIBLE_DEVICES=0       # ensure Ollama uses your RTX 3050 Ti

Set these in your shell before starting Ollama:
  export OLLAMA_NUM_PARALLEL=1
  export OLLAMA_MAX_LOADED_MODELS=1
  export CUDA_VISIBLE_DEVICES=0
  ollama serve


================================================================================
WHAT YOU WILL LEARN — PER PHASE
================================================================================

Phase 0 (Setup):
  - CUDA driver stack: nvidia-smi, nvcc, CUDA versions, driver vs toolkit
  - PyTorch CUDA builds: why you install +cu121 separately from pip
  - ONNX Runtime GPU: what it is, why it's different from PyTorch

Phase 1 (Whisper CUDA):
  - CTranslate2 quantization: float16 vs int8, when each is used, why float16 on GPU
  - VAD (Voice Activity Detection): how Whisper filters silence before transcription
  - VRAM profiling: reading nvidia-smi output while model runs
  - FFmpeg audio pipeline in Python

Phase 2 (Cloud LLM):
  - LLM routing architecture: why you separate fast/slow tasks across model sizes
  - Automatic fallback patterns: try/except with graceful degradation
  - JSON mode in Ollama: how format=json works internally
  - Quality difference between 3B and 70B for structured extraction tasks

Phase 3 (Agentic tool loop):
  - LLM function calling protocol: how tool schemas work in Ollama API
  - Agentic loops: max_iterations, convergence, detecting when model is "done"
  - Multi-source data aggregation + deduplication logic
  - Self-hosted search: SearXNG vs paid APIs

Phase 4 (React frontend):
  - Timestamp-synced UI rendering: EventSource API + requestAnimationFrame pattern
  - Zustand vs Redux: why Zustand is better for this project
  - react-player programmatic control

Phase 5 (Voice + GPU + DB):
  - ONNX Runtime GPU: loading ONNX models on CUDA via onnxruntime-gpu
  - Wake word model internals: how OpenWakeWord uses prediction buffers + thresholds
  - GPU memory management: keeping multiple models loaded without OOM
  - async SQLAlchemy: session management in FastAPI lifespan


================================================================================
CV BULLET POINTS
================================================================================

• Built VidSage, a hybrid-inference AI video platform (React + FastAPI) routing tasks
  between local CUDA GPU (LLaMA 3.2 3B) and Ollama Cloud (LLaMA 3.3 70B) based on
  latency and reasoning complexity requirements

• Implemented GPU-optimised faster-whisper (large-v3, float16 CUDA) transcription
  pipeline for English + Hindi with word-level timestamps via FFmpeg audio extraction

• Engineered an agentic research loop using LLaMA 3.3 70B function calling on Ollama
  Cloud with custom tool servers for Wikipedia, ArXiv, YouTube (yt-dlp), and SearXNG

• Built an OpenWakeWord voice assistant with ONNX Runtime GPU inference, real-time
  PyAudio streaming, and LLaMA 3.2 3B local intent classification for sub-2s response

• Designed a VRAM-aware inference architecture for RTX 3050 Ti (4GB), simultaneously
  loading Whisper large-v3 (1.5GB) + LLaMA 3.2 3B Q4 (2GB) with headroom for activations

Stack: React 18 · FastAPI · Ollama Cloud · LLaMA 3.3 70B · LLaMA 3.2 3B Q4 ·
       faster-whisper CUDA · OpenWakeWord · ONNX Runtime GPU · SearXNG ·
       PostgreSQL · SQLAlchemy · ReportLab · Zustand · Docker · CUDA 12.x
