// Cover-fit photo placement inside a panel, with per-panel zoom, pan and flip.
// A panel remembers which photo slot it shows and how the user framed it;
// this module turns that into the exact source/destination rectangles for
// drawImage, so the same framing works at preview size and at export size.

// Returns { sx, sy, sw, sh, dx, dy, dw, dh } for ctx.drawImage.
// zoom 1 = cover-fit exactly; zoom > 1 crops tighter into the photo.
// panX / panY are fractions of the spare room (-1..1): 0 centres the photo.
export function cropPhotoTransform(panel, img, zoom, panX, panY, flip) {
  const pw = panel.w;
  const ph = panel.h;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(pw / iw, ph / ih);
  const scale = base * Math.max(0.4, zoom || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  // Spare room after cover-fit: how far the photo can slide before an edge shows.
  const spareX = Math.max(0, (dw - pw) / 2);
  const spareY = Math.max(0, (dh - ph) / 2);
  const dx = panel.x + (pw - dw) / 2 - (panX || 0) * spareX;
  const dy = panel.y + (ph - dh) / 2 - (panY || 0) * spareY;
  return { dx, dy, dw, dh, flip: !!flip };
}

// Draws one photo into a panel, honouring the transform above. The clip is
// the caller's job: the renderer clips to the panel rect (and to the diagonal
// edge for diagonalSplit) before calling this.
export function drawPhotoInPanel(ctx, panel, img, framing) {
  const t = cropPhotoTransform(panel, img, framing.zoom, framing.panX, framing.panY, framing.flip);
  ctx.save();
  if (t.flip) {
    ctx.translate(panel.x + panel.w / 2, 0);
    ctx.scale(-1, 1);
    ctx.translate(-(panel.x + panel.w / 2), 0);
  }
  ctx.drawImage(img, t.dx, t.dy, t.dw, t.dh);
  ctx.restore();
}

// Default framing for a fresh panel: centred, no zoom, no flip. A different
// photo can fill several panels at once because each panel keeps its own copy
// of this object, so the same photo crops differently per panel.
export function defaultFraming(photoIdx) {
  return { photo: photoIdx, zoom: 1, panX: 0, panY: 0, flip: false };
}

// Clamps a pan value so a drag can never pull the photo past its own edge.
export function clampPan(value) {
  return Math.max(-1, Math.min(1, value));
}
