# VERTO // CLIENT-SIDE MEDIA TRANSDUCER

`VERTO` (Vertex 1.3 Primus / AUCTUS) is an immersive, local-first media transduction engine. It executes high-performance audio, video, and image conversions directly inside the browser sandbox utilizing WebAssembly-compiled FFmpeg. 

```mermaid
graph TD
    User([User Host]) -->|Runs| Batch[Vertex_Launch.bat]
    Batch -->|1. Probe Telemetry| PS[PowerShell Script]
    Batch -->|2. Start Engine| Vite[Vite Dev Server]
    PS -->|Output| SysInfo[public/sysinfo.json]
    Vite -->|3. Enable COOP/COEP Headers| WebApp[Verto Web Interface]
    WebApp -->|4. Read Telemetry| SysInfo
    WebApp -->|5. Load Local WASM| FFmpeg[Local FFmpeg WASM Core]
    User -->|6. Load Artifact| WebApp
    WebApp -->|7. Synthesize Media| FFmpeg
    WebApp -->|8. Terminate| KillSwitch[/api/kill Endpoint]
    KillSwitch -->|Terminates Process| Vite
```

---

## Key Capabilities

* **Offline Execution Substrate**: Configured to run 100% locally. The application fetches `@ffmpeg/core` binaries and WASM assets directly from local storage, bypassing external CDN latency and guaranteeing zero-telemetry operations.
* **Telemetry Teleportation**: On startup, a PowerShell harness gathers host CPU, RAM, and GPU statistics, injecting them dynamically into the frontend status HUD to provide live hardware specifications.
* **Low-Latency Synthesis**: Leverages browser-level `SharedArrayBuffer` support via custom `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers.
* **Stealth Kiosk Shell**: Launches inside an app-mode Edge window instance with hidden console terminals using silent Visual Basic Script (VBS) execution, terminating all processes upon window closure via a `/api/kill` middleware endpoint.
* **Omni-Format Matrix**: Modular transcode mappings for professional, web, lossless, and legacy targets across video, audio, and image arrays.

---

## Directory Structure

```text
├── Custos/              # Security configurations & local execution policies
├── Fundamentum/         # Core placeholders
├── Machina/             # The UI application environment
│   └── verto-core/      # React + Vite + Tailwind CSS v4 frontend project
├── Nuntius/             # Transcoding cmd configuration matrix mappings
├── Vertex_Launch.bat    # Kiosk app bootloader and telemetry probe script
├── Verto.lnk            # Desktop launcher link
└── CHANGELOG.md         # Activity log and maintenance register
```

---

## Getting Started

### Prerequisites
* **Node.js** (v18.x or higher)
* **Microsoft Edge** (or custom Chromium browser fallback)

### Bootstrapping the System
1. Clone the repository to your local workspace:
   ```bash
   git clone https://github.com/elyxis777/verto.git
   ```
2. Navigate to the bootloader directory and execute the launcher:
   - Double-click **`Vertex_Launch.bat`** (or use the desktop shortcut **`Verto.lnk`**).
   - The launcher will automatically fetch missing hardware modules (`npm install`), extract device specifications, configure the local Vite server, and boot the interface.

---

## Development

To modify the interface style or transcode parameters, execute Vite directly:

```bash
cd Machina/verto-core
npm run dev
```

The system will host locally at `http://localhost:5173`. Make sure your headers are set correctly if testing outside the launch script, or WebAssembly loading will halt due to SharedArrayBuffer restrictions.
