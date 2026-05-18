# VidSage Architecture & Directory Structure

Here is a high-level overview of the VidSage project architecture, showing the relationship between the React frontend and the FastAPI backend, along with their internal directory structures.

```mermaid
graph TB
    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef backend fill:#009688,stroke:#333,stroke-width:2px,color:#fff
    classDef database fill:#ff9800,stroke:#333,stroke-width:2px,color:#fff
    classDef agent fill:#9c27b0,stroke:#333,stroke-width:2px,color:#fff
    classDef processor fill:#e91e63,stroke:#333,stroke-width:2px,color:#fff

    subgraph Workspace["VidSage Project"]
        direction TB

        %% Frontend
        subgraph Client["Frontend (React + Vite)"]
            direction TB
            UI["User Interface"]:::frontend
            Pages["pages/\n(Session, Library, Upload)"]
            Comps["components/\n(Transcript, VideoPlayer, Timeline)"]
            Store["store/\n(State Management)"]
            Hooks["hooks/\n(useSSE)"]

            UI --> Pages
            Pages --> Comps
            Comps --> Store
            Comps --> Hooks
        end

        %% Backend
        subgraph Server["Backend (FastAPI)"]
            direction TB
            API["main.py (API Gateway)"]:::backend
            Routes["routes/\n(video, notes, terms, reports)"]
            
            subgraph Intelligence["AI Agents & Processing"]
                direction TB
                Agents["agents/\n(Research, Voice, Term Detector)"]:::agent
                Proc["processing/\n(Whisper STT, yt-dlp, Wake Word)"]:::processor
                MCP["mcp_tools/\n(External AI Tools)"]
                
                Agents --> MCP
            end

            subgraph Data["Database Layer"]
                DB["db/\n(SQLAlchemy Models)"]:::database
                SQLite[("vidsage.db")]:::database
                
                DB -.-> SQLite
            end

            API --> Routes
            Routes --> Agents
            Routes --> Proc
            Routes --> DB
            
            Proc -.->|Transcriptions & Segments| DB
        end

        %% Connections
        Hooks -.->|Server-Sent Events| API
        Comps -.->|REST HTTP| API
    end
```

### Key Components:
- **Frontend**: A modern React application utilizing Tailwind CSS and Framer Motion for dynamic animations. It consumes SSE (Server-Sent Events) for real-time status updates and manages state across components like the VideoPlayer, ActiveTranscript, and TermPanel.
- **Backend API**: Built with FastAPI, acting as the orchestrator. It handles routing and background tasks.
- **AI Agents**: Specialized Python modules (e.g., Voice Agent, Research Agent) that route intent and analyze transcripts.
- **Processing Layer**: Heavy-lifting pipelines including Faster-Whisper for STT with word-level timestamps and yt-dlp for video ingestion.
- **Database**: SQLite with SQLAlchemy ORM handling persistent storage for videos, notes, terms, and transcripts.
