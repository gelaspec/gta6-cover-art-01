// Vice Coast Cover Studio — editor wiring.
// Owns the cover state, the controls, drag-to-pan on the preview, undo/redo
// and the export buttons. Painting itself lives in coverCanvas.js; this file
// only decides *what* to paint and *when*.

import { renderCover } from './coverCanvas.js';
import { LAYOUTS, panelsForLayout } from './layouts.js';
import { GRADES } from './gradeMaps.js';
import { defaultFraming, clampPan } from './photoCrop.js';
import { EXPORT_SIZES, exportCoverSize, exportAllSizes } from './exportPng.js';
import { makeHistory, pushHistory, undoCover, redoCover, canUndo, canRedo } from './historyUndo.js';
import { runShotScene } from './shotScenes.js';

// Loads an image from a URL (a bundled sample or an object URL from a file
// the user picked), resolving once it can be drawn on a canvas.
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${url}`));
    img.src = url;
  });
}

function freshState() {
  return {
    layout: 'heroAndThree',
    grade: 'viceSunset',
    title: 'VICE COAST',
    subtitle: 'chase the sunset',
    money: '$38,420',
    heat: 4,
    rep: 62,
    grain: true,
    vignette: true,
    frame: false,
    panels: [],
  };
}

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const state = freshState();
const photos = [null, null, null];
const history = makeHistory();
let selectedPanel = 0;
let captionTimer = null;

function setStatus(text) {
  statusEl.textContent = text;
}

function currentPanels() {
  return panelsForLayout(state.layout, canvas.width, canvas.height);
}

// Keeps one framing object per panel, reusing the old framing when the
// layout changes so a user's crop survives a layout switch.
function syncPanelFramings() {
  const panels = currentPanels();
  const next = panels.map((panel, i) => {
    const old = state.panels[i];
    if (old && typeof old.photo === 'number') return { ...old };
    return defaultFraming(panel.photo);
  });
  state.panels = next;
}

function redraw() {
  syncPanelFramings();
  renderCover(canvas, state, photos);
  document.getElementById('undo').disabled = !canUndo(history);
  document.getElementById('redo').disabled = !canRedo(history);
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  const selected = state.panels[selectedPanel];
  if (selected) {
    document.getElementById('zoom').value = selected.zoom;
    document.getElementById('zoomValue').textContent = `${Math.round(selected.zoom * 100)}%`;
    document.getElementById('panelLabel').textContent =
      `Panel ${selectedPanel + 1} of ${state.panels.length} — photo ${selected.photo + 1}`;
  }
}

// Records the state before a change, then applies the change and repaints.
function commit(mutator, label) {
  pushHistory(history, state);
  mutator();
  redraw();
  if (label) setStatus(label);
}

function buildPickerRows() {
  const layoutRow = document.getElementById('layoutRow');
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.layout = layout.id;
    btn.title = layout.hint;
    btn.textContent = layout.name;
    btn.addEventListener('click', () => commit(() => { state.layout = layout.id; selectedPanel = 0; }, `Layout: ${layout.name}`));
    layoutRow.appendChild(btn);
  }
  const gradeRow = document.getElementById('gradeRow');
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.grade = grade.id;
    btn.textContent = grade.name;
    btn.addEventListener('click', () => commit(() => { state.grade = grade.id; }, `Grade: ${grade.name}`));
    gradeRow.appendChild(btn);
  }
}

function wirePhotoSlots() {
  for (let slot = 0; slot < 3; slot++) {
    const input = document.getElementById(`photo${slot + 1}`);
    input.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        photos[slot] = await loadImage(URL.createObjectURL(file));
        commit(() => {}, `Photo ${slot + 1} loaded — ${file.name}`);
      } catch {
        setStatus(`Photo ${slot + 1} could not be read. Try another file.`);
      }
    });
    document.getElementById(`sample${slot + 1}`).addEventListener('click', async () => {
      const name = slot === 1 ? 'pier' : 'boulevard';
      photos[slot] = await loadImage(`samples/${name}.jpg`);
      commit(() => {}, `Photo ${slot + 1}: sample ${name} loaded`);
    });
  }
}

function wireCaptionControls() {
  const titleInput = document.getElementById('title');
  const subtitleInput = document.getElementById('subtitle');
  const moneyInput = document.getElementById('money');
  // Caption typing debounces the history push: the pre-change snapshot is
  // captured on the FIRST keystroke, before the state is mutated, and pushed
  // once the user pauses. (Pushing after the mutation would record the new
  // text as the "before" state and undo would restore nothing.)
  let captionBefore = null;
  let captionFlush = null;
  const debouncedCaption = (mutator) => {
    if (captionBefore === null) captionBefore = JSON.stringify(state);
    mutator();
    redraw();
    clearTimeout(captionTimer);
    captionTimer = setTimeout(() => {
      if (captionBefore !== null) {
        history.past.push(captionBefore);
        if (history.past.length > history.limit) history.past.shift();
        history.future.length = 0;
        captionBefore = null;
      }
      setStatus('Caption updated');
    }, 450);
  };
  captionFlush = () => {
    clearTimeout(captionTimer);
    if (captionBefore !== null) {
      history.past.push(captionBefore);
      if (history.past.length > history.limit) history.past.shift();
      history.future.length = 0;
      captionBefore = null;
    }
  };
  titleInput.addEventListener('input', () => debouncedCaption(() => { state.title = titleInput.value; }));
  subtitleInput.addEventListener('input', () => debouncedCaption(() => { state.subtitle = subtitleInput.value; }));
  moneyInput.addEventListener('input', () => debouncedCaption(() => { state.money = moneyInput.value; }));
  for (const input of [titleInput, subtitleInput, moneyInput]) {
    input.addEventListener('blur', captionFlush);
  }
  // Sliders mutate state live on every input event, so the pre-change
  // snapshot is captured when the drag starts, not when it ends.
  let sliderBefore = null;
  const captureBefore = () => { sliderBefore = JSON.stringify(state); };
  const pushCaptured = () => {
    if (sliderBefore === null) return;
    history.past.push(sliderBefore);
    if (history.past.length > history.limit) history.past.shift();
    history.future.length = 0;
    sliderBefore = null;
  };
  const heatInput = document.getElementById('heat');
  heatInput.addEventListener('pointerdown', captureBefore);
  heatInput.addEventListener('keydown', captureBefore);
  heatInput.addEventListener('input', () => {
    state.heat = Number(heatInput.value);
    document.getElementById('heatValue').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
    redraw();
  });
  heatInput.addEventListener('change', pushCaptured);
  const repInput = document.getElementById('rep');
  repInput.addEventListener('pointerdown', captureBefore);
  repInput.addEventListener('keydown', captureBefore);
  repInput.addEventListener('input', () => {
    state.rep = Number(repInput.value);
    document.getElementById('repValue').textContent = `${state.rep}%`;
    redraw();
  });
  repInput.addEventListener('change', pushCaptured);
}

function wirePanelControls() {
  const zoom = document.getElementById('zoom');
  let zoomBefore = null;
  zoom.addEventListener('pointerdown', () => { zoomBefore = JSON.stringify(state); });
  zoom.addEventListener('keydown', () => { zoomBefore = JSON.stringify(state); });
  zoom.addEventListener('input', () => {
    const framing = state.panels[selectedPanel];
    if (!framing) return;
    framing.zoom = Number(zoom.value);
    document.getElementById('zoomValue').textContent = `${Math.round(framing.zoom * 100)}%`;
    redraw();
  });
  zoom.addEventListener('change', () => {
    if (zoomBefore === null) return;
    history.past.push(zoomBefore);
    if (history.past.length > history.limit) history.past.shift();
    history.future.length = 0;
    zoomBefore = null;
  });
  document.getElementById('flip').addEventListener('click', () => {
    commit(() => {
      const framing = state.panels[selectedPanel];
      if (framing) framing.flip = !framing.flip;
    }, 'Panel flipped');
  });
  document.getElementById('cyclePhoto').addEventListener('click', () => {
    commit(() => {
      const framing = state.panels[selectedPanel];
      if (framing) framing.photo = (framing.photo + 1) % 3;
    }, 'Panel photo changed');
  });
  for (const id of ['grain', 'vignette', 'frame']) {
    document.getElementById(id).addEventListener('change', (event) => {
      commit(() => { state[id] = event.target.checked; }, `${id} ${event.target.checked ? 'on' : 'off'}`);
    });
  }
}

function syncInputsFromState() {
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('money').value = state.money;
  document.getElementById('heat').value = state.heat;
  document.getElementById('heatValue').textContent = '★'.repeat(state.heat) + '☆'.repeat(5 - state.heat);
  document.getElementById('rep').value = state.rep;
  document.getElementById('repValue').textContent = `${state.rep}%`;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  document.getElementById('frame').checked = state.frame;
}

function wireHistoryAndExport() {
  document.getElementById('undo').addEventListener('click', () => {
    const restored = undoCover(history, state);
    if (restored) {
      Object.assign(state, restored);
      syncInputsFromState();
      redraw();
      setStatus('Undone');
    }
  });
  document.getElementById('redo').addEventListener('click', () => {
    const restored = redoCover(history, state);
    if (restored) {
      Object.assign(state, restored);
      syncInputsFromState();
      redraw();
      setStatus('Redone');
    }
  });
  const sizeRow = document.getElementById('sizeRow');
  for (const size of EXPORT_SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = size.label;
    btn.addEventListener('click', async () => {
      setStatus(`Exporting ${size.label}…`);
      try {
        const result = await exportCoverSize(state, photos, size);
        setStatus(`Saved ${result.file} (${result.w} × ${result.h})`);
      } catch {
        setStatus('Export failed — try again.');
      }
    });
    sizeRow.appendChild(btn);
  }
  document.getElementById('exportAll').addEventListener('click', async () => {
    setStatus('Exporting all three sizes…');
    try {
      const done = await exportAllSizes(state, photos, (r) => setStatus(`Saved ${r.file}`));
      setStatus(`Saved ${done.length} covers — square, portrait, landscape.`);
    } catch {
      setStatus('Export failed — try again.');
    }
  });
}

// Drag on the preview pans the photo inside the clicked panel; the wheel
// zooms it. Clicking a panel selects it for the zoom / flip controls.
function wireCanvasPointer() {
  let drag = null;
  function panelAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const panels = currentPanels();
    for (let i = panels.length - 1; i >= 0; i--) {
      const p = panels[i];
      if (p.kind === 'titleBand') continue;
      if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) return i;
    }
    return 0;
  }
  canvas.addEventListener('pointerdown', (event) => {
    selectedPanel = panelAt(event.clientX, event.clientY);
    const framing = state.panels[selectedPanel];
    drag = { x: event.clientX, y: event.clientY, panX: framing.panX, panY: framing.panY };
    canvas.setPointerCapture(event.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const framing = state.panels[selectedPanel];
    if (!framing) return;
    const dx = (event.clientX - drag.x) / rect.width;
    const dy = (event.clientY - drag.y) / rect.height;
    framing.panX = clampPan(drag.panX - dx * 2);
    framing.panY = clampPan(drag.panY - dy * 2);
    redraw();
  });
  canvas.addEventListener('pointerup', () => {
    if (drag) pushHistory(history, state);
    drag = null;
  });
  canvas.addEventListener('wheel', (event) => {
    event.preventDefault();
    const framing = state.panels[selectedPanel];
    if (!framing) return;
    framing.zoom = Math.max(0.4, Math.min(3, framing.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    redraw();
  }, { passive: false });
}

// A shot scene replaces the whole state and the three photos at once. The
// scene may also carry its export size: the canvas is resized to it first,
// so a portrait or square cover paints at its own aspect.
function applyScene(sceneState, loadedPhotos) {
  pushHistory(history, state);
  if (sceneState.size) {
    canvas.width = sceneState.size.w;
    canvas.height = sceneState.size.h;
  }
  const scenePanels = sceneState.panels || null;
  Object.assign(state, sceneState, { panels: scenePanels ? scenePanels.map((p) => ({ ...p })) : [] });
  for (let i = 0; i < 3; i++) photos[i] = loadedPhotos[i] || null;
  syncInputsFromState();
  selectedPanel = 0;
  redraw();
}

async function loadFonts() {
  const faces = [
    new FontFace('Anton', 'url(./fonts/Anton-Regular.ttf)', { weight: '400' }),
    new FontFace('Pacifico', 'url(./fonts/Pacifico-Regular.ttf)', { weight: '400' }),
    new FontFace('Bebas Neue', 'url(./fonts/BebasNeue-Regular.ttf)', { weight: '400' }),
  ];
  for (const face of faces) {
    try {
      const loaded = await face.load();
      document.fonts.add(loaded);
    } catch {
      // The @font-face rules in style.css are the fallback; the cover still
      // paints with system fonts if a file fails to load.
    }
  }
  await document.fonts.ready;
}

buildPickerRows();
wirePhotoSlots();
wireCaptionControls();
wirePanelControls();
wireHistoryAndExport();
wireCanvasPointer();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  loadFonts().then(() => runShotScene(shot, applyScene)).catch(() => {
    window.__shotReady = true;
  });
} else {
  loadFonts().then(redraw);
  redraw();
}
