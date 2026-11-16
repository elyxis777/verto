# Verto: Granular Format Configuration Engine (PLAN.md)
**Document Target:** Parameterized Transduction Controls  
**Objective:** Evolve Verto from fixed preset mappings to an extensible, two-tier architecture (One-Click Default + Configurable Settings Drawer) without degrading WASM throughput or introducing UI clutter.

---

## 1. Architectural Philosophy
* **Zero-Friction Default:** Casual users retain instant one-click conversion without having to touch technical dials.
* **Progressive Disclosure:** An expandable "Tune Parameters" drawer surfaces format-specific sliders and dropdowns only when commanded.
* **Deterministic Flags:** Dynamically interpolate user UI state directly into the FFmpeg command argument array via modular builder functions.

---

## 2. Format Configuration Matrix Specification

### 2.1 Video Controls (MP4, MKV, WebM, MOV, AVI)

| Parameter | Options / Range | Flag Mapping | Default |
| :--- | :--- | :--- | :--- |
| **Resolution Scaling** | Original, 1080p, 720p, 480p, Custom | `-vf scale=-2:720` | Original |
| **Encoding Speed (Preset)** | `ultrafast`, `veryfast`, `medium` | `-preset [val]` | `ultrafast` |
| **Quality Constant (CRF)** | Slider 18 (Visually Lossless) – 35 (Low) | `-crf [val]` | 23 |
| **ProRes Profile (MOV)** | Proxy (0), LT (1), Standard 422 (2), HQ (3) | `-profile:v [0-3]` | Standard (2) |
| **Audio Channel Strip** | Keep Original Audio, Mute Video | `-an` (if mute) | Pass-through |

### 2.2 Audio Controls (MP3, M4A, WAV, FLAC, OGG, AIFF, AC3)

| Parameter | Options / Range | Flag Mapping | Default |
| :--- | :--- | :--- | :--- |
| **Audio Bitrate** | 128k, 192k, 256k, 320k | `-b:a [val]` | 256k / 320k |
| **Sample Rate** | 44.1 kHz, 48.0 kHz, 96.0 kHz | `-ar [val]` | Original (Pass-through) |
| **Channels** | Stereo, Mono Downmix | `-ac 1` / `-ac 2` | Stereo |
| **Volume Normalization** | Baseline, +3dB Boost, -3dB Attenuation | `-filter:a "volume=[val]dB"` | 0dB |

### 2.3 Image & Animation Controls (GIF, WebP, PNG, JPG)

| Parameter | Options / Range | Flag Mapping | Default |
| :--- | :--- | :--- | :--- |
| **GIF Framerate** | 10 fps, 15 fps, 24 fps, 30 fps | `-r [val]` | 15 fps |
| **GIF Resolution** | 320px, 480px, 640px, Original | `-vf scale=[val]:-1` | 480px |
| **Compression Level / Quality** | 1 (Fast) – 100 (Max Quality) | `-q:v [val]` | 80 |

---

## 3. UI/UX Implementation Blueprint

```
┌─────────────────────────────────────────────────────────────┐
│ [Target: MP4 (H.264/AAC)]     [v] Tune Parameters (Expand)  │
├─────────────────────────────────────────────────────────────┤
│  RESOLUTION       QUALITY (CRF)       SPEED PRESET          │
│  [ 1080p (FHD) ]  [===●=========] 23  [ ultrafast (Fastest)│
│                                                             │
│  AUDIO BITRATE    CHANNELS                                  │
│  [ 192 kbps    ]  [ Stereo     ]                            │
└─────────────────────────────────────────────────────────────┘
```

1. **Compact Accordion Drawer:** Positioned directly below the target format selector in the main synthesis panel.
2. **Preset Profiles:**
   - `Fast Delivery` (low CRF, ultrafast preset)
   - `Archival Master` (high CRF, medium preset, lossless audio)
   - `Web Optimized` (720p / 1080p, 192k AAC)

---

## 4. Phase-by-Phase Execution Roadmap

### Phase 1: Engine Parametrization (`matrix.js`)
- [ ] Refactor `FORMAT_MATRIX` command generators from static arrays into parameterized function closures:
  ```javascript
  cmd: (input, options) => buildVideoArgs(input, options)
  ```
- [ ] Implement validation guardrails to prevent incompatible codec/container combinations (e.g., forbidding ProRes profiles inside MP4 wrappers).

### Phase 2: Configuration State & UI Drawer (`App.jsx`)
- [ ] Create `SettingsDrawer.jsx` component adhering to the existing Stark / dark-mode design system.
- [ ] Implement reactive state persistence (`activeSettings`) resetting safely on format switches.

### Phase 3: Verification & Load Testing
- [ ] Adversarial testing across large assets (e.g., verifying ProRes Proxy vs HQ memory ceilings inside in-browser WebAssembly).
- [ ] Test mobile responsive drawer rendering to avoid overflowing smaller screens.
