// v2: framing math kept, variable names and flow rewritten in this session.
// How one photo sits inside one panel.
//
// A framing remembers the slot, the zoom and the pan. Zoom 1 fills the
// panel exactly (cover fit); a bigger zoom dives deeper into the photo, a
// smaller one pulls back. Pan is measured in halves of the spare room, so
// -1..1 can never slide a photo edge into view. Flip mirrors it.
//
// The renderer clips to the panel before calling here, so this module only
// has to place the image — it never worries about panel borders.

export function frameFor(panel, img, framing) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const fit = Math.max(panel.w / iw, panel.h / ih);
  const zoom = Math.max(0.4, Math.min(3, framing.zoom || 1));
  const drawnW = iw * fit * zoom;
  const drawnH = ih * fit * zoom;
  const slackX = Math.max(0, (drawnW - panel.w) / 2);
  const slackY = Math.max(0, (drawnH - panel.h) / 2);
  return {
    x: panel.x + (panel.w - drawnW) / 2 - (framing.panX || 0) * slackX,
    y: panel.y + (panel.h - drawnH) / 2 - (framing.panY || 0) * slackY,
    w: drawnW,
    h: drawnH,
    mirror: !!framing.flip,
  };
}

export function drawPhotoInPanel(ctx, panel, img, framing) {
  const f = frameFor(panel, img, framing);
  ctx.save();
  if (f.mirror) {
    const centre = panel.x + panel.w / 2;
    ctx.translate(centre, 0);
    ctx.scale(-1, 1);
    ctx.translate(-centre, 0);
  }
  ctx.drawImage(img, f.x, f.y, f.w, f.h);
  ctx.restore();
}

// A panel that has never been touched: centred, unzoomed, unflipped.
// Every panel owns its own copy, so one photo can appear in several panels
// with a different crop in each.
export function defaultFraming(photoIdx) {
  return { photo: photoIdx, zoom: 1, panX: 0, panY: 0, flip: false };
}

export function clampPan(value) {
  if (value < -1) return -1;
  if (value > 1) return 1;
  return value;
}
