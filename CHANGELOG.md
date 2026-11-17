# Changelog

All notable changes to the Verto project will be documented in this file.

## [1.2.2] - 2026-11-17 18:32

### Added
- Integrated official GitHub repository link (`https://github.com/elyxis777/verto/`) into the persistent top HUD navigation bar and the post-transduction success footer.
- Updated canonical live web app URL in README to `https://verto.elyxis.vercel.app/`.

## [1.2.1] - 2026-11-17 17:50

### Added
- Integrated official Elyxis central portal (`https://elyxis.pages.dev/`) into the persistent top HUD navigation bar (`ELYXIS.DEV`), interactive sidebar branding, success view footer, and documentation.

## [1.2.0] - 2026-11-17 17:35

### Added
- Multi-File Batch Queue Pipeline: support dropping and staging multiple files with individual and batch status tracking.
- Sequential FIFO WASM Execution: automated queue processing ensuring single-threaded in-memory execution with zero tab memory exhaustion (OOM protection via immediate `FS.unlink` file recycling).
- High-Clarity Processing Telemetry HUD: live parsing of `speed`, `fps`, `time`, and `size` directly from FFmpeg log streams with dynamic elapsed timer.
- Sub-second Pulsating Freeze-Guard Heartbeat: animated indicator providing visual feedback that the background WebAssembly worker is active.
- Batch Export & ZIP Integration: integrated `jszip` for client-side bundle generation ("Download All as ZIP") alongside individual file retrieval.

## [1.1.0] - 2026-11-17 01:45

### Added
- Implemented `SettingsDrawer` accordion component enabling format-specific tuning directly from the synthesis viewport.
- Added quick optimization presets (`Fast Delivery`, `Web Optimized`, `Archival Master`, `Hi-Fi Master`, `Speech/Podcast`) for instant one-click calibration.
- Parameterized video transduction: custom resolution scaling (1080p, 720p, 480p), CRF quality slider (18–35), encoder presets (`ultrafast`, `veryfast`, `medium`), ProRes profiles (Proxy, LT, Standard, HQ), and audio stripping (`-an`).
- Parameterized audio transduction: custom bitrates (128k–320k), sample rate selection (44.1k–96k), channel downmixing (mono/stereo), and gain adjustments (-6dB to +6dB).
- Parameterized image/GIF transduction: resolution downscaling, GIF frame rates (10–30 fps), and quality compression curves (10–100%).

## [1.0.14] - 2026-11-17 17:21

### Changed
- Rewrote `PLAN.md` from scratch consolidating all real-world Reddit community requirements: Multi-file Batch Queueing, Granular Format Controls (ProRes/CRF/Bitrate), and High-Clarity Processing Telemetry (FPS, ETA, Speed pulse).

## [1.0.13] - 2026-11-17 01:37

### Added
- Formulated `PLAN.md` detailing the granular parameterization engine (CRF quality sliders, ProRes profiles, audio bitrates/channels, GIF resolution/framerates) in response to initial community feedback.

## [1.0.12] - 2026-11-16 22:28

### Added
- Added `LICENSE` file adhering to GNU General Public License v3.0 (GPL-3.0) preventing closed-source commercial forks.

### Security
- Untracked `GEMINI.md` and added `.gemini/` and `GEMINI.md` to `.gitignore` to sanitize public repository of internal agent configurations.

## [1.0.11] - 2026-11-16 22:25

### Changed
- Replaced technical internal architecture README with an accessible, consumer-friendly landing homepage for GitHub visitors.
- Fixed Mermaid flowchart syntax error that was breaking GitHub markdown rendering.

## [1.0.10] - 2026-11-16 21:22

### Changed
- Elevated Ko-fi support link into the top persistent HUD header with a high-contrast amber pill badge.
- Removed crowded and clipped footer text from the format sidebar.

## [1.0.9] - 2026-11-16 20:04

### Added
- Integrated live Ko-fi monetization conduits (`https://ko-fi.com/elyxis`) in both the sidebar footer and the post-transduction success screen (`Artifact Stabilized`).

## [1.0.8] - 2026-11-15 21:26

### Removed
- Expunged static host telemetry payload (`sysinfo.json`).

### Changed
- Refactored hardware telemetry in `App.jsx` to dynamically query the visiting client's browser environment using `navigator.hardwareConcurrency`, `navigator.deviceMemory`, and unmasked WebGL rendering context.

## [1.0.7] - 2026-11-15 21:06

### Fixed
- Appended `-vn` (disable video/cover art stream) to all audio transduction presets in `matrix.js`. Resolves MP3 embedded cover art collision failing M4A/AAC, WAV, FLAC, and OGG container creation.

## [1.0.6] - 2026-11-15 20:56

### Added
- Linked GitHub repository `elyxis777/verto` to Vercel team `elyxis`.
- Deployed production release to Vercel with automated Vite build pipeline.
- Production domains active: `https://verto-eta.vercel.app` and `https://verto-elyxis.vercel.app`.

## [1.0.5] - 2026-11-15 15:26

### Added
- Integrated privacy, zero-upload, and uncapped RAM processing trust badges directly above the central ingestion dropzone.
- Added responsive quick-format pills for mobile viewports alongside the existing desktop format stream.
- Injected placeholder sponsor button in the application sidebar footer.
- Updated HTML document metadata, open graph tags, and page titles for search engine indexation.

## [1.0.4] - 2026-11-15 15:20

### Added
- Created `vercel.json` with strict Cross-Origin Isolation headers (`COOP: same-origin`, `COEP: require-corp`) for production deployment.

### Fixed
- Hardened unload beacon dispatch in `App.jsx` with exception suppression for cross-origin or standalone web clients.
- Corrected path mapping in `DEPLOYMENT_PLAN.md` referencing `Machina/verto-core`.

## [1.0.3] - 2026-11-08 10:10

### Fixed
- Enforced `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Opener-Policy: same-origin` globally across all Vite dev server response streams via dedicated middleware.
- Excised redundant `window.crossOriginIsolated` guard in `App.jsx` that prematurely failed single-threaded WebAssembly execution.

## [1.0.2] - 2026-11-08 10:05

### Fixed
- Fixed `ready.tmp` file handle lock collision during engine shutdown by piping stdout/stderr directly instead of maintaining an unread disk buffer.
- Corrected terminal window stealth suppression in `Vertex_Launch.bat` to target the active console hierarchy (conhost & Windows Terminal) without creating orphan VBS scripts.
- Hardened exit monitoring loop to perform immediate PID cleanup upon port deallocation.

## [1.0.1] - 2026-07-22 00:40

### Added
- Created a comprehensive root-level `README.md` containing a Mermaid system flow schematic, interface metrics, and build guidelines.

### Removed
- Expunged the redundant boilerplate `README.md` from the `Machina/verto-core/` directory.

## [1.0.0] - 2026-07-22 00:35

### Added
- Created root-level `.gitignore` file to isolate local node modules, temporary system logs, and development databases from Git tracking.
- Initialized local Git repository in the project root directory, decoupling it from the parent workspace scope.
- Configured local Git metadata (`user.name` as `elyxis777` and `user.email` as `elyxis777@gmail.com`).
- Configured GitHub remote origin pointing to `https://github.com/elyxis777/verto.git`.
- Synchronized initial project codebase to remote `main` branch.
