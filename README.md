# Visual Spectrum Maker PRO V1

Professional music visualizer video maker software. Creates stunning visual spectrum videos (MP4/WebM without audio) ready to be combined with your MP3 in CapCut, Premiere Pro, or DaVinci Resolve.

## Features

### Audio Engine PRO
- FFT Analyzer with configurable FFT size
- Beat Detection (kick, snare, overall)
- BPM Detection (auto-calculated)
- Frequency Band Isolation (Bass / Mid / Treble)
- Audio Smoothing, Sensitivity, Gain controls
- Peak Hold with decay
- Dynamic Range analysis

### Spectrum Visualizers (7 Types)
- **Vertical Bars** - Classic spectrum analyzer with rounded bars
- **Mirror Bars** - Symmetric bars from center
- **Circular Spectrum** - Radial audio ring with rotation
- **Waveform** - Oscilloscope-style time domain display
- **Neon Spectrum** - Multi-pass glowing neon bars with reflections
- **Particle Burst** - Explosive particle-based visualization
- **Energy Ring** - Pulsating concentric energy rings

### Particle Engine (13 Types)
Dust, Snow, Rain, Fireflies, Bubbles, Sparks, Stars, Galaxy, Smoke, Fog, Shapes, Hearts, Music Notes - all reactive to music

### Background System
- Solid Color
- Linear/Radial Gradient
- Image Upload (cover/contain/stretch)
- Animated Gradient
- Frosted Glass / Blur
- Ken Burns Effect
- Music-reactive zoom

### Lighting Effects
- Vignette
- Bloom
- Lens Flare (bass-reactive)
- Ambient Light (customizable color)

### Camera Animations
- Auto Zoom (breathing)
- Bass Zoom
- Beat Punch
- Shake
- Rotate

### Overlay Effects
- Film Grain
- VHS Glitch
- CRT Monitor
- Scanlines
- Noise
- Bokeh

### Text Overlay
- Song Title & Artist layers
- 8 Animation types: Fade, Slide, Zoom, Bounce, Typewriter, Glitch, Neon, Pulse
- Customizable font, color, glow, shadow, position

### 14 Visual Templates
Spotify, Trap Nation, NCS, Monstercat, LoFi Girl, EDM, Chill, Podcast, Worship, Ambient, Cinematic, Gaming, Synthwave, Vaporwave

### AI Assistant
- Analyzes audio characteristics in real-time
- Detects genre, mood, energy level
- Recommends best template, visualizer, colors, particles
- Generates YouTube title, hashtags, description

### Export Engine
- WebM (VP8/VP9) and MP4 format
- 720p to 4K resolution
- 24/30/60 FPS
- Quality control
- **Output: Video WITHOUT audio** - ready for video editor merge

## Tech Stack

- **TypeScript** - Full type safety
- **Web Audio API** - Real-time audio analysis
- **Canvas 2D** - Hardware-accelerated rendering
- **MediaRecorder API** - Video export
- **Bun** - Ultra-fast bundling

## Getting Started

```bash
# Build
bun run build

# Type check
bun run typecheck

# Serve (any static server)
# Open index.html in browser
```

## Usage

1. Open `index.html` in a modern browser
2. Drag & drop an MP3 file onto the canvas
3. Choose a visualizer from the Spectrum panel
4. Customize colors, particles, effects
5. Or select a preset template
6. Click Export > Start Recording
7. When done, click Stop - video downloads automatically
8. Combine the video with your MP3 in your video editor

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| S | Stop |
| R | Start/Stop Recording |
| 1-7 | Switch Visualizer |

## Architecture

```
src/
├── main.ts              # App orchestrator (806 lines)
├── audio/
│   └── AudioEngine.ts   # FFT, beat detection, BPM
├── visualizers/
│   ├── BaseVisualizer.ts
│   ├── VerticalBars.ts
│   ├── CircularSpectrum.ts
│   ├── WaveformVisualizer.ts
│   ├── NeonSpectrum.ts
│   ├── MirrorBars.ts
│   ├── ParticleBurst.ts
│   └── EnergyRing.ts
├── particles/
│   └── ParticleEngine.ts
├── effects/
│   ├── BackgroundEngine.ts
│   ├── LightingEffects.ts
│   ├── CameraEffects.ts
│   └── OverlayEffects.ts
├── ui/
│   ├── PanelManager.ts
│   └── TextOverlay.ts
├── templates/
│   └── TemplateManager.ts
├── export/
│   └── ExportEngine.ts
├── ai/
│   └── AIAssistant.ts
└── styles/
    └── main.css
```

## Output

- **MP4/WebM without audio** - clean video-only output
- Ready for CapCut, Premiere Pro, DaVinci Resolve
- Supports batch rendering workflow
- Presets can be saved and shared

## License

MIT
