# VidSage — Frontend UI/UX Blueprint
### Designed for Stitch by Google
**Project:** VidSage — AI Video Intelligence Platform  
**Stack:** React 18 · TailwindCSS · shadcn/ui · Zustand  
**Modes:** Viewer Mode · Scientist (Producer) Mode  

---

## Overview: Page Architecture

VidSage has **4 distinct pages/screens** and **2 overlay modes** that share the same video player layout.

```
/                    → Landing / Home Page
/upload              → Ingestion & Processing Page
/watch/:jobId        → Video Watch Page (Viewer Mode)
/session/:jobId      → Scientist / Producer Mode Page 
```

---

## Page 1 — Landing / Home (`/`)

**Purpose:** First impression. Explains what VidSage does and lets the user choose their path.

### Hero Section
- App name + tagline: *"AI intelligence layered on any video. Free. Local. Yours."*
- Two large CTA cards side by side:
  - **"I'm a Viewer / Learner"** → routes to Upload with Viewer mode pre-selected
  - **"I'm a Scientist / Creator"** → routes to Upload with Scientist mode pre-selected
- Brief icon-driven feature strip below the CTAs (4 icons max):
  - Auto-detects jargon | Voice commands | Export research brief | Works offline

### Mode Explainer (Two-column section)
| Viewer Mode | Scientist Mode |
|---|---|
| Watch with AI subtitle cards | Upload your own research video |
| Clickable term overlays | Voice assistant ("Hey VidSage") |
| Reference panel (Wikipedia, ArXiv) | Pin notes to timestamps |
| Works for EN + HI | Export full PDF session brief |

### Footer
- "Runs 100% locally · Zero API costs · Open source (MIT)"
- GitHub link

### Design Notes for Stitch
- Dark background preferred (deep navy or charcoal) — this is a technical/AI tool
- Two-mode card layout should be the dominant element — large, clear, clickable
- No carousels, no looping animations — clean and purposeful
- Mode cards should visually differ (e.g., different accent colors per mode)

---

## Page 2 — Ingestion & Processing (`/upload`)

**Purpose:** Accept a video file or YouTube URL, select mode, and show real-time processing status.

### Input Section
- Toggle at top: **"Paste YouTube URL"** | **"Upload Video File"**
- YouTube URL input: text field + "Load" button
- File upload: drag-and-drop zone + file browser button (accepts .mp4, .webm, .mkv)
- Mode selector (radio cards, not dropdown):
  - Viewer Mode
  - Scientist Mode
- Language hint (optional): "English" | "Hindi" | "Auto-detect"
- **"Start Processing"** primary button — disabled until input is valid

### Processing Status Panel
Appears after submission. Shows a vertical step tracker:

```
[✓] Video received
[⟳] Extracting audio via FFmpeg...
[  ] Transcribing with Whisper (EN/HI)...
[  ] Detecting complex terms...
[  ] Fetching references (Wikipedia, ArXiv, Web)...
[  ] Ready!
```

- Each step uses Server-Sent Events (SSE) from the backend to update live
- Estimated time indicator: "~2 min on CPU / ~20 sec on GPU"
- Cancel button visible during processing
- On completion: auto-redirect to `/watch/:jobId` or `/session/:jobId`

### Design Notes for Stitch
- Processing panel is the hero element — give it generous space, good animation
- Step tracker should feel like a progress narrative, not a loading bar
- Show a thumbnail/preview of the video as soon as it's received
- Spinner per step while active; checkmark when done; muted gray when pending

---

## Page 3 — Watch Page / Viewer Mode (`/watch/:jobId`)

**Purpose:** The main consumer-facing experience. Watch video with AI overlays, reference panel, and term glossary.

### Layout: Two-column

```
┌────────────────────────────────┬─────────────────────┐
│                                │                     │
│      VIDEO PLAYER              │   REFERENCE PANEL   │
│      (16:9 aspect ratio)       │   (scrollable)      │
│                                │                     │
│  ┌──────────────────────────┐  │  ─ Term cards       │
│  │ SUBTITLE OVERLAY AREA    │  │  ─ Wikipedia links  │
│  │  [TermCard: CRISPR]      │  │  ─ ArXiv papers     │
│  └──────────────────────────┘  │  ─ YouTube explainers│
│                                │  ─ Web links         │
│  ─── Seekbar ────────────────  │                     │
│  ▶  0:34 / 12:04   🔊  ⛶      │  ─ Glossary List    │
└────────────────────────────────┴─────────────────────┘
```

### Video Player Area (Left / Main)
- Custom-styled HTML5 video player (via react-player)
- Controls: Play/Pause, Seekbar with timestamp markers (one dot per detected term), Volume, Fullscreen, Playback speed
- **Subtitle Overlay** (bottom third of video):
  - Shows regular transcript subtitles
  - Highlighted words are terms detected by the AI (different color/underline)
  - Clicking a highlighted word opens the TermCard

### TermCard (Popup overlay on the video)
Appears when a detected term enters the current timestamp OR is clicked. Contains:
- **Term name** (large)
- **Plain-English summary** (2–3 sentences from LLaMA)
- **Tab row**: Wikipedia | ArXiv | YouTube | Web
- Quick reference cards under each tab
- Close (×) button
- "Pin to panel →" button (moves it to the Reference Panel permanently)

### Reference Panel (Right column)
- **Header**: "References" with a count badge
- **Active Term** section: currently highlighted term + its references
- **Glossary List** (collapsible): all terms detected in this video, in timestamp order
  - Each entry: Term name · Timestamp chip · Click to seek
- **Pinned Terms** section: terms pinned by the user during viewing

### Design Notes for Stitch
- Video player takes 65% width; reference panel takes 35%
- On mobile: stack vertically — video on top, panel below (collapsible)
- TermCard appears as a bottom-sheet overlay on the video, not a modal
- Glossary timestamps should be clickable (seek to that point in video)
- Seekbar should show colored tick marks at term timestamps (like chapters)
- Reference panel tabs (Wikipedia/ArXiv/YouTube/Web) use icon + label

---

## Page 4 — Scientist / Producer Mode (`/session/:jobId`)

**Purpose:** The research-first experience. Same video player, but with a full notes panel, timeline view, voice indicator, and PDF export.

### Layout: Three-column

```
┌──────────────────┬─────────────────┬──────────────────┐
│                  │                 │                  │
│  VIDEO PLAYER    │   NOTES PANEL   │  TIMELINE VIEW   │
│  (with overlays) │   (real-time)   │  (scrollable)    │
│                  │                 │                  │
│  [VoiceIndicator]│  + Add Note     │  ── 0:00         │
│                  │  ────────────── │     [note]       │
│  ─── Seekbar ─── │  [Note entries] │  ── 1:23         │
│  ▶  0:34 / 12:04 │  with timestamp │     ⭐ important  │
│                  │  chips          │  ── 3:45         │
└──────────────────┴─────────────────┴──────────────────┘
```

### Video Player Area (Left)
- Same player as Viewer Mode
- **Voice Indicator** — floating pill at top-right of video:
  - Idle: microphone icon, gray, "Say 'Hey VidSage'..."
  - Listening: animated pulse ring, blue
  - Processing: spinner, purple
  - Confirmed: green flash + command transcript shown briefly
- TermCard overlays still appear (same as Viewer Mode)
- Subtitle overlays still visible

### Notes Panel (Center column)
- **Add Note manually**: text area + timestamp auto-filled + "Save Note" button
- **Note entries** in reverse-chronological order:
  - Timestamp chip (clickable, seeks to that point)
  - Note type badge: 🔔 Reminder · ⭐ Important · 📝 General
  - Note text
  - Delete button
- **Voice-added notes** appear here automatically (pushed via SSE from backend)
- Filter bar: All | Reminders | Important | General

### Timeline View (Right column)
- Vertical timeline (top = start, bottom = end of video)
- Tick marks at every 30s or 1min interval
- **Markers**:
  - Blue dot: a note exists at this timestamp
  - Star: marked important
  - Bell: a reminder
  - Purple diamond: a detected term
- Hovering a marker shows a tooltip with the note/term preview
- Clicking seeks video to that timestamp

### Research Brief Bar (Bottom strip across all columns)
- Always visible at the bottom of this page
- Shows: "Session: 3 notes · 12 terms detected · 0:34 active"
- **"Generate Brief"** button → triggers PDF export
  - Shows a loading state ("Generating PDF...")
  - On completion: download link appears + success toast

### Design Notes for Stitch
- Three-column layout with clear visual hierarchy
- Voice Indicator must always be visible — it's a key UX affordance
- Timeline markers should be color-coded and consistent across all panels
- Notes panel and timeline should stay in sync — adding a note auto-adds a timeline marker
- "Generate Brief" should be prominent but not distracting during active research

---

## Shared Components (Appear Across Pages)

### Global Navigation Bar
- App logo + name "VidSage" (top-left)
- Current mode indicator (top-right): "Viewer Mode" | "Scientist Mode" pill badge
- No other nav items — keep it minimal

### SSE Connection Status Indicator
- A tiny dot in the corner (green = connected, yellow = reconnecting, red = disconnected)
- Tooltip on hover: "Live updates active"

### Toast / Notification System
- Non-blocking toasts (bottom-right):
  - "Term detected: CRISPR"
  - "Voice command captured: Mark as important"
  - "PDF export ready — Download"
  - "Processing complete — Watch now"

### Mode Switcher (on Watch/Session pages only)
- Small toggle button in the nav bar
- Switches between `/watch/:jobId` ↔ `/session/:jobId` for the same video
- Preserves video playback position via Zustand store

---

## State Management (Zustand Store) — UI Implications

The frontend needs these Zustand slices, each driving a UI concern:

| Store Slice | What it powers |
|---|---|
| `videoStore` | currentTime, duration, isPlaying, jobId |
| `termsStore` | detectedTerms[], activeTermId, pinnedTerms[] |
| `notesStore` | notes[], filterType |
| `sessionStore` | sessionId, mode ("viewer"/"scientist") |
| `voiceStore` | voiceState ("idle"/"listening"/"processing") |
| `uiStore` | sidePanelOpen, activeTab, toasts[] |

All SSE events from the backend update these stores in real time.

---

## SSE Event → UI Mapping

These are the backend events the frontend listens to and how each affects the UI:

| SSE Event | UI Reaction |
|---|---|
| `term_detected` | TermCard appears at current timestamp; glossary list updates |
| `transcript_chunk` | Subtitle overlay updates |
| `note_added` (voice) | New entry appears in Notes Panel; Timeline marker added |
| `voice_state` | Voice Indicator pill changes state |
| `job_status` | Processing step tracker updates (Upload page) |
| `brief_ready` | Toast notification + download link appears |

---

## Responsive Behavior

| Screen | Viewer Mode | Scientist Mode |
|---|---|---|
| Desktop (>1280px) | 2-column layout | 3-column layout |
| Tablet (768–1280px) | Video full-width; panel below | Video + Notes stacked; Timeline as drawer |
| Mobile (<768px) | Video top; panel as bottom sheet | Video top; Notes as bottom sheet; Timeline hidden (button to expand) |

## Summary: Page Count & Purpose

| # | Page | Route | Core Purpose |
|---|---|---|---|
| 1 | Landing / Home | `/` | Mode selection + product pitch |
| 2 | Upload & Processing | `/upload` | Video input + live status tracker |
| 3 | Viewer Mode | `/watch/:jobId` | AI-overlaid video with reference panel |
| 4 | Scientist Mode | `/session/:jobId` | Research video with notes + timeline + voice + PDF export |

**Shared across 3 & 4:** Video player, TermCard overlay, subtitle system, SSE connection, global nav, toast system, mode switcher.
