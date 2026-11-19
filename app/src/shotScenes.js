// Fixed scenes for screenshots and for the finalist review's first look.
// A `?shot=` query puts the app into one of these states instead of the
// empty editor: photos are loaded from the bundled samples, the layout,
// grade and caption are fixed, and window.__shotReady is set once the fonts
// are ready and the cover has painted twice. The editor scene keeps the
// controls visible; the cover scenes hide them so the poster fills the frame.

import { loadImage } from './main.js';

const SCENES = {
  cover: {
    coverOnly: true,
    size: { w: 1920, h: 1080 },
    state: {
      layout: 'heroAndThree', grade: 'viceSunset',
      title: 'VICE COAST', subtitle: 'chase the sunset',
      money: '$38,420', heat: 4, rep: 62,
      grain: true, vignette: true, frame: false,
      // Same photo in two side panels, cropped to different regions so the
      // cover does not repeat one framing.
      panels: [
        { photo: 0, zoom: 1, panX: 0, panY: 0, flip: false },
        { photo: 1, zoom: 1.1, panX: 0.2, panY: 0, flip: false },
        { photo: 0, zoom: 1.25, panX: 0.7, panY: -0.2, flip: false },
        { photo: 2, zoom: 1.2, panX: -0.6, panY: 0.1, flip: false },
      ],
    },
    photos: ['pier', 'boulevard', 'pier'],
  },
  editor: {
    coverOnly: false,
    size: { w: 1920, h: 1080 },
    state: {
      layout: 'heroAndThree', grade: 'viceSunset',
      title: 'VICE COAST', subtitle: 'chase the sunset',
      money: '$38,420', heat: 4, rep: 62,
      grain: true, vignette: true, frame: false,
      panels: [
        { photo: 0, zoom: 1, panX: 0, panY: 0, flip: false },
        { photo: 1, zoom: 1.1, panX: 0.2, panY: 0, flip: false },
        { photo: 0, zoom: 1.25, panX: 0.7, panY: -0.2, flip: false },
        { photo: 2, zoom: 1.2, panX: -0.6, panY: 0.1, flip: false },
      ],
    },
    photos: ['boulevard', 'pier', 'boulevard'],
  },
  'cover-portrait': {
    coverOnly: true,
    size: { w: 1080, h: 1350 },
    state: {
      layout: 'gridNine', grade: 'palmDusk',
      title: 'VICE COAST', subtitle: 'chase the sunset',
      money: '$38,420', heat: 4, rep: 62,
      grain: true, vignette: true, frame: false,
      panels: [
        { photo: 0, zoom: 1.2, panX: -0.5, panY: 0, flip: false },
        { photo: 1, zoom: 1.15, panX: 0.3, panY: 0, flip: false },
        { photo: 2, zoom: 1.3, panX: 0.5, panY: -0.3, flip: false },
        { photo: 1, zoom: 1.25, panX: -0.4, panY: 0.2, flip: false },
        { photo: 0, zoom: 1.4, panX: 0.6, panY: 0.2, flip: false },
        { photo: 2, zoom: 1.2, panX: -0.7, panY: -0.1, flip: false },
        { photo: 0, zoom: 1.3, panX: 0.2, panY: 0.4, flip: false },
        { photo: 2, zoom: 1.15, panX: -0.2, panY: -0.4, flip: false },
        { photo: 1, zoom: 1.3, panX: 0.6, panY: -0.2, flip: false },
        { photo: -1, zoom: 1, panX: 0, panY: 0, flip: false },
      ],
    },
    photos: ['pier', 'boulevard', 'pier'],
  },
  'cover-square': {
    coverOnly: true,
    size: { w: 1080, h: 1080 },
    state: {
      layout: 'tiltedSnapshots', grade: 'neonNight',
      title: 'VICE COAST', subtitle: 'chase the sunset',
      money: '$38,420', heat: 4, rep: 62,
      grain: true, vignette: true, frame: false,
      panels: [
        { photo: 0, zoom: 1.1, panX: -0.3, panY: 0, flip: false },
        { photo: 1, zoom: 1.05, panX: 0.2, panY: -0.1, flip: false },
        { photo: 2, zoom: 1.15, panX: 0.4, panY: 0, flip: false },
      ],
    },
    photos: ['boulevard', 'pier', 'boulevard'],
  },
};

export function shotSceneNames() {
  return Object.keys(SCENES);
}

// Applies a scene through the editor's own `applyScene` hook, then signals
// readiness. `applyScene` is supplied by main.js so this file never touches
// the DOM controls itself.
export async function runShotScene(shot, applyScene) {
  const scene = SCENES[shot];
  if (!scene) return false;
  if (scene.coverOnly) document.body.classList.add('shot-cover');
  const loaded = [];
  for (const name of scene.photos) {
    loaded.push(await loadImage(`samples/${name}.jpg`));
  }
  // The scene carries its own export size, so a portrait or square cover
  // paints at its own aspect instead of being letterboxed in a landscape
  // canvas.
  applyScene({ ...scene.state, size: scene.size }, loaded);
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
  return true;
}
