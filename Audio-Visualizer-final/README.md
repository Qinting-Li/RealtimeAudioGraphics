# RealtimeAudioGraphics App

This directory contains the browser application for RealtimeAudioGraphics: a real-time audio-reactive graphics prototype built with Three.js, Web Audio, and shader-driven visualizers.

## Run

```bash
npm install
npm start
```

Open:

```text
http://127.0.0.1:8080
```

## Visualizers

- 2D
- Sphere
- Cubes
- Orbs
- Raymarching
- Jelly
- Galaxy

## Current Foundation Fixes

- Shared `AudioEngine` instance for visualizers
- No repeated microphone creation in `2D.js`
- Added missing `cube.js`
- Removed missing Orbs/Galaxy preview video references
- Replaced missing raymarching matcap image with a procedural texture
- Fixed frequency-band smoothing state
- Fixed Galaxy animation-frame cancellation
- Added `start`, `stop`, and `dispose` lifecycle coverage for visualizers
- Added cleanup for renderers, GUI panels, event listeners, controls, materials, and geometries
