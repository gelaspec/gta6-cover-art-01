// v2: export flow rewritten in this session; preview and export share one painter.
// Exporting a cover as PNG.
//
// The export renders on a fresh off-screen canvas with the same painter the
// preview uses, so the downloaded file is exactly the poster on screen —
// no second code path that could drift. One size at a time, or all three
// in a row so the downloads never collide.

import { renderCover } from './coverCanvas.js';

export const EXPORT_SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080, file: 'vice-coast-cover-1080x1080.png' },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350, file: 'vice-coast-cover-1080x1350.png' },
  { label: 'Landscape 1920 × 1080', w: 1920, h: 1080, file: 'vice-coast-cover-1920x1080.png' },
];

export function renderCoverBlob(state, photos, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, photos);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('PNG render failed'))),
      'image/png',
    );
  });
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function exportCoverSize(state, photos, size) {
  const blob = await renderCoverBlob(state, photos, size);
  saveBlob(blob, size.file);
  return { file: size.file, bytes: blob.size, w: size.w, h: size.h };
}

export async function exportAllSizes(state, photos, onEach) {
  const results = [];
  for (const size of EXPORT_SIZES) {
    const result = await exportCoverSize(state, photos, size);
    results.push(result);
    if (onEach) onEach(result);
  }
  return results;
}
