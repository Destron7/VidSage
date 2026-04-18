# 🎬 VidSage — AI Video Intelligence Platform

> Transform any video into an intelligent, interactive learning and research experience.
> **100% open-source · Hybrid local GPU + Ollama Cloud inference · Zero proprietary APIs**

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)
![GPU](https://img.shields.io/badge/GPU-CUDA%20%2B%20RTX%203050Ti-76B900?style=flat-square&logo=nvidia)
![LLM](https://img.shields.io/badge/LLM-LLaMA%203.3%2070B%20%2B%203.2%203B-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 📌 What is VidSage?

VidSage is a full-stack AI-powered video intelligence platform with two distinct user modes.
It uses a **hybrid inference strategy** — fast local GPU inference for latency-sensitive tasks
and Ollama Cloud for heavyweight reasoning tasks requiring a 70B model.

### 🔬 For the Scientist / Content Creator (Producer Mode)
- **Auto-generates a research brief** summarising every idea, term, and concept discussed
- **Pins spoken thoughts to timestamps** — so your "I should revisit that paper" moment is never lost
- **Voice-activated assistant** ("Hey VidSage") lets you set reminders, flag timestamps, log notes — hands-free
- **Exports a full session report** as PDF with timeline, notes, and auto-detected concepts

### 👁️ For the Viewer / Learner (Viewer Mode)
- **Complex terms auto-detected** from speech with plain-English summaries as subtitle cards
- **Clickable term overlays** — tap any highlighted term to expand references
- **Curated reference panel** — Wikipedia, ArXiv papers, YouTube explainers, web links
- **Works for English and Hindi** videos out of the box

---

## 🖥️ Inference Architecture — Hybrid GPU + Cloud

```
Task                          Where it runs              Model
─────────────────────────────────────────────────────────────────────
Audio transcription (EN+HI)   Local GPU (CUDA)           Whisper large-v3
Wake word detection            Local GPU (CUDA/CPU)       OpenWakeWord
Voice intent parsing           Local GPU (CUDA)           LLaMA 3.2 3B Q4_K_M
Simple term summaries          Local GPU (CUDA)           LLaMA 3.2 3B Q4_K_M
Deep term detection            Ollama Cloud               LLaMA 3.3 70B
Multi-step research agent      Ollama Cloud               LLaMA 3.3 70B
Research brief generation      Ollama Cloud               LLaMA 3.3 70B
Complex agentic tool loops     Ollama Cloud               LLaMA 3.3 70B
```

**Why this split?**
- RTX 3050 Ti has 4GB VRAM. Whisper large-v3 (~1.5GB) + LLaMA 3.2 3B Q4 (~2GB) fit together.
- LLaMA 3.1 8B Q4 needs ~4.8GB — it would cause OOM on 4GB VRAM.
- LLaMA 3.3 70B running on Ollama Cloud gives much higher reasoning quality for complex tasks.
- A routing layer automatically directs each request to the right endpoint.

---

## 🧠 Key AI/ML Concepts

| Concept | Tool | Where Used |
|---|---|---|
| **CUDA GPU inference** | Ollama + CUDA + CTranslate2 | All local model tasks |
| **Model quantization** | Q4_K_M (4-bit) | Fitting LLaMA 3.2 3B in 4GB VRAM |
| **Cloud LLM inference** | Ollama Cloud (LLaMA 3.3 70B) | Complex reasoning, long contexts |
| **Inference routing** | Custom router layer | Deciding local vs cloud per task |
| **Multilingual STT** | faster-whisper CUDA | EN + HI transcription |
| **LLM function calling** | LLaMA 3.3 70B + 3.2 3B | Agentic research tool loops |
| **Structured JSON output** | Ollama format=json | Schema-enforced LLM responses |
| **Wake word detection** | OpenWakeWord (ONNX) | "Hey VidSage" trigger |
| **RAG-lite glossary cache** | PostgreSQL | Avoid re-running LLM for seen terms |
| **SSE streaming** | FastAPI StreamingResponse | Real-time frontend updates |

---

## ⚙️ Tech Stack

| Layer | Technology | Runs On |
|---|---|---|
| Frontend | React 18 + TailwindCSS + shadcn/ui | Browser |
| Backend | Python 3.11 + FastAPI | CPU |
| LLM — heavy tasks | Ollama Cloud · LLaMA 3.3 70B | Ollama Cloud |
| LLM — fast tasks | Ollama local · LLaMA 3.2 3B Q4_K_M | RTX 3050 Ti GPU |
| Speech-to-text | faster-whisper large-v3 (CUDA) | RTX 3050 Ti GPU |
| Wake word | OpenWakeWord (ONNX Runtime CUDA) | RTX 3050 Ti GPU |
| Video processing | FFmpeg + yt-dlp | CPU |
| Web search | SearXNG (self-hosted Docker) | CPU |
| Database | PostgreSQL + SQLAlchemy + Alembic | CPU |
| PDF export | ReportLab | CPU |
| State management | Zustand | Browser |
| Containers | Docker + Docker Compose | CPU |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker + Docker Compose
- NVIDIA RTX 3050 Ti with CUDA 12.x drivers
- Ollama installed with CUDA support
- FFmpeg

### 1. Verify CUDA setup

```bash
nvidia-smi                          # Should show RTX 3050 Ti, CUDA version
nvcc --version                      # Should show CUDA 12.x
```

### 2. Install Ollama with CUDA

```bash
curl -fsSL https://ollama.com/install.sh | sh

# Verify GPU is detected
ollama run llama3.2:3b "hello"      # Should show GPU memory usage in nvidia-smi

# Pull local model (fits in 4GB VRAM alongside Whisper)
ollama pull llama3.2:3b             # ~2GB download, Q4_K_M quantized
```

### 3. Configure Ollama Cloud

```bash
# Sign up at: https://ollama.com/cloud (early access)
# Get your Cloud API key and endpoint URL

# Test Cloud access
curl https://api.ollama.com/api/chat \
  -H "Authorization: Bearer YOUR_KEY" \
  -d '{"model": "llama3.3:70b", "messages": [{"role":"user","content":"hello"}]}'
```

### 4. Start Docker services

```bash
docker-compose up -d
# PostgreSQL → localhost:5432
# SearXNG    → localhost:8080
```

### 5. Backend setup

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn main:app --reload --port 8000
```

### 6. Frontend setup

```bash
cd frontend && npm install && npm run dev
```

### 7. Environment variables

```env
# Local Ollama (GPU)
OLLAMA_LOCAL_URL=http://localhost:11434
OLLAMA_LOCAL_MODEL=llama3.2:3b

# Ollama Cloud (70B)
OLLAMA_CLOUD_URL=https://api.ollama.com
OLLAMA_CLOUD_KEY=your_cloud_api_key_here
OLLAMA_CLOUD_MODEL=llama3.3:70b

# Whisper (CUDA)
WHISPER_MODEL=large-v3
WHISPER_DEVICE=cuda
WHISPER_COMPUTE_TYPE=float16

# Database + Search
DATABASE_URL=postgresql+asyncpg://vidsage_user:vidsage_pass@localhost:5432/vidsage
SEARXNG_URL=http://localhost:8080

# Fallback: if Cloud is unavailable, use local model
OLLAMA_CLOUD_FALLBACK=true
```

---

## 🔄 How It Works — End to End

```
User uploads MP4 / pastes YouTube URL
        ↓
FFmpeg extracts audio
        ↓
faster-whisper large-v3 (CUDA, float16) transcribes → word-level timestamps
        ↓
[Router] Term detection → Ollama Cloud LLaMA 3.3 70B → flags complex terms + summaries
        ↓
[Router] Research agent → Ollama Cloud 70B + tool loop → Wikipedia, ArXiv, YouTube, SearXNG
        ↓
Results cached in PostgreSQL glossary + streamed via SSE to React
        ↓
Video plays → term cards at correct timestamps → side panel shows references
        ↓
Viewer: subtitle overlays + reference panel
Scientist: timeline + voice commands + PDF export
```

---

## 🎤 Voice Assistant — "Hey VidSage"

Wake word: **OpenWakeWord** (ONNX Runtime, CUDA accelerated, Apache 2.0)
Command transcription: **faster-whisper base** (GPU, near real-time)
Intent parsing: **LLaMA 3.2 3B** (local GPU — fast response for voice UX)

| Command | Action |
|---|---|
| "Hey VidSage, remind me to attach references here" | Pins reminder to timestamp |
| "Hey VidSage, mark this as important" | Flags timestamp in timeline |
| "Hey VidSage, note down — check Kumar et al. 2021" | Saves note to DB |
| "Hey VidSage, generate my brief" | Triggers PDF export via Cloud 70B |
| "Hey VidSage, what have I noted so far" | Reads back session notes |

---

## 🖥️ Performance Expectations — RTX 3050 Ti

| Task | Model | Speed |
|---|---|---|
| Audio transcription | Whisper large-v3 (float16 CUDA) | ~10 min video in ~60–90 sec |
| Term detection | LLaMA 3.3 70B Cloud | ~15–30 sec per transcript |
| Reference fetch | LLaMA 3.3 70B Cloud + tools | ~20–40 sec total |
| Voice command parse | LLaMA 3.2 3B local GPU | ~1–3 sec |
| Wake word detection | OpenWakeWord CUDA | Real-time, ~0% GPU load |

---

## 🗺️ Roadmap

- [x] Phase 1 — Video ingestion + faster-whisper CUDA transcription
- [ ] Phase 2 — Term detection via Ollama Cloud LLaMA 3.3 70B
- [ ] Phase 3 — Research agent + tool loop (Cloud 70B)
- [ ] Phase 4 — React frontend + timestamp-synced overlays
- [ ] Phase 5 — OpenWakeWord CUDA + voice pipeline + PDF export
- [ ] v2 — Live stream support
- [ ] v2 — Fine-tune a domain model on scientific terminology
- [ ] v2 — Browser extension

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

## 👤 Author

Built by **[Your Name]**
Stack: React · FastAPI · Ollama Cloud · LLaMA 3.3 70B · LLaMA 3.2 3B · faster-whisper CUDA · OpenWakeWord · SearXNG · PostgreSQL

> *VidSage uses a hybrid inference strategy — local GPU for speed-critical tasks,
> Ollama Cloud for reasoning-heavy tasks. Best of both worlds.*
