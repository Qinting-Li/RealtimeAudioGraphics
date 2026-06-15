# RealtimeAudioGraphics

A browser-native real-time audio-reactive graphics engine prototype built with Three.js, Web Audio, GLSL-style shader visualizers, and modular visualizer scenes.

The project started as a computer graphics audio visualizer and is being upgraded toward a more mature browser-side real-time graphics engine: shared audio analysis, reliable visualizer lifecycle management, reusable visualizer modules, and low-latency interactive rendering.

## Current Status

This version focuses on the foundation needed before larger WebGPU, AI-assisted preset, or advanced plugin work:

- one shared browser audio engine instead of repeated microphone creation
- stable visualizer switching with cancellable animation loops
- consistent `start`, `stop`, and `dispose` lifecycle methods
- cleanup for WebGL renderers, GUI panels, controls, materials, geometries, and event listeners
- fixed missing resource references that previously caused page/runtime errors
- restored Cubes visualizer support

## Features

- Microphone-driven real-time visual response through the Web Audio API
- Multiple visualizers:
  - 2D waveform/ring visualization
  - Sphere deformation
  - Cubes grid visualizer
  - Orbs terrain and geometry visualizer
  - Raymarching shader visualizer
  - Jelly Shader Park visualizer
  - Galaxy particle visualizer
- GUI controls for visualizer-specific parameters
- Auto-run mode for cycling visualizers
- Procedural fallback preview/assets where missing media previously caused errors

## Project Structure

```text
RealtimeAudioGraphics/
  README.md
  README(Galaxy).md
  Audio-Visualizer-final/
    index.html
    package.json
    microphone.js
    controller.js
    autorun.js
    2D.js
    sphere.js
    cube.js
    orbs.js
    raymarching.js
    jelly.js
    sp-code.js
    style.css
    galaxy/
    images/
    previews/
```

## Quick Start

```bash
cd Audio-Visualizer-final
npm install
npm start
```

Then open:

```text
http://127.0.0.1:8080
```

The browser will ask for microphone permission when audio input is initialized.

## Development Notes

The current codebase still uses plain JavaScript and browser script loading. The next major engineering step should be a Vite + TypeScript migration with a formal engine structure:

```text
src/
  audio/
  core/
  render/
  visualizers/
  ui/
  assets/
```

Recommended future interface:

```ts
interface Visualizer {
  id: string;
  name: string;
  init(ctx: VisualizerContext): Promise<void> | void;
  start(): void;
  update(frame: EngineFrame): void;
  stop(): void;
  dispose(): void;
}
```

## Roadmap

1. Migrate to Vite + TypeScript.
2. Replace global script dependencies with npm imports.
3. Extract `AudioEngine`, `FeatureAnalyzer`, `RenderEngine`, and `VisualizerRegistry`.
4. Move audio analysis toward music-structure features such as onset, beat, spectral flux, and BPM.
5. Add WebGPU-ready backend detection and a GPU particle flagship visualizer.
6. Add benchmark, recording/export, shareable presets, and browser compatibility documentation.

## Validation Performed

- JavaScript syntax checks with `node --check` over project source files
- Local server smoke check with HTTP `200` from `http://127.0.0.1:8080`
- Static scan for removed missing resources:
  - `Orbs_preview.mp4`
  - `Galaxy_preview.mp4`
  - `assets/candy_matcap.png`
  - `galaxysAnimationId`
  - repeated `new Microphone`

## Known Technical Debt

- The project still depends on `live-server`, which brings old transitive dependencies and npm audit warnings.
- The Galaxy folder still contains legacy helper scripts and bundled library files.
- Browser-level visual regression testing is not yet automated.
- WebGPU support is planned but not implemented in this foundation pass.

## License

ISC, matching the current `package.json`.
