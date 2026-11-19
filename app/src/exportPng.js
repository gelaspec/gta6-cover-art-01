// Exporting: renders the cover off-screen at a post size and downloads it
// as a PNG. The same renderCover paints the preview and the export, so what
// the user downloads is exactly what they saw on screen.

import { renderCover } from './coverCanvas.js';

export const EXPORT_SIZES = [
  { label: 'Square 1080 × 1080', w: 1080, h: 1080, file: 'vice-coast-cover-1080x1080.png' },
  { label: 'Portrait 1080 × 1350', w: 1080, h: 1350, file: 'vice-coast-cover-1080x1350.png' },
  { label: 'Landscape 1920 × 1080', w: 1920, h: 1080, file: 'vice-coast-cover-1920x1080.png' },
];

// Renders the cover at one size and resolves with the PNG blob.
export function renderCoverBlob(state, photos, size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  renderCover(canvas, state, photos);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG render failed'))), 'image/png');
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// One size, one file.
export async function exportCoverSize(state, photos, size) {
  const blob = await renderCoverBlob(state, photos, size);
  downloadBlob(blob, size.file);
  return { file: size.file, bytes: blob.size, w: size.w, h: size.h };
}

// All three post sizes, one after another, so the downloads do not collide.
export async function exportAllSizes(state, photos, onEach) {
  const done = [];
  for (const size of EXPORT_SIZES) {
    const result = await exportCoverSize(state, photos, size);
    done.push(result);
    if (onEach) onEach(result);
  }
  return done;
}
