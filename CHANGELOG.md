# Changelog

All notable changes to the Verto project will be documented in this file.

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
