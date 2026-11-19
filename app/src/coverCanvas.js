// The cover painter: one function, renderCover, draws the whole poster onto
// any canvas at any size — the live preview and every export share it, so the
// PNG a user downloads is exactly what they saw. Panels, grade, lettering,
// HUD ornaments, grain and vignette are all drawn here, in that order.

import { panelsForLayout, panelFrameWidth } from './layouts.js';
import { gradeById, applyGrade } from './gradeMaps.js';
import { drawPhotoInPanel } from './photoCrop.js';

// A tiny deterministic pseudo-random generator so the grain looks the same
// on every render of the same cover (exports stay reproducible).
function seededRandom(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function fitFont(ctx, text, maxWidth, startSize, family, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function halftoneBand(ctx, x, y, w, h, colour) {
  const step = Math.max(7, Math.round(w / 90));
  ctx.save();
  ctx.fillStyle = colour;
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const r = (step * 0.28) * (1 - (row * step) / (h * 1.4));
      if (r <= 0.4) continue;
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPanel(ctx, panel, img, framing, grade, frameW) {
  ctx.save();
  ctx.beginPath();
  const cx = panel.x + panel.w / 2;
  const cy = panel.y + panel.h / 2;
  if (panel.diagonal) {
    const cut = panel.w * 0.12;
    ctx.moveTo(panel.x, panel.y);
    ctx.lineTo(panel.x + panel.w, panel.y);
    ctx.lineTo(panel.x + panel.w - cut, panel.y + panel.h);
    ctx.lineTo(panel.x, panel.y + panel.h);
    ctx.closePath();
  } else if (panel.tilt) {
    ctx.translate(cx, cy);
    ctx.rotate((panel.tilt * Math.PI) / 180);
    ctx.rect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.clip();
  // Tilted cards paint in local coordinates (origin at the card centre) so
  // the photo, the grade and the clip share the same rotated frame.
  const local = panel.tilt ? { ...panel, x: -panel.w / 2, y: -panel.h / 2 } : panel;
  if (img) {
    ctx.filter = grade.filter;
    drawPhotoInPanel(ctx, local, img, framing);
    ctx.filter = 'none';
    applyGrade(ctx, local, grade);
  } else {
    const g = ctx.createLinearGradient(local.x, local.y, local.x, local.y + local.h);
    g.addColorStop(0, '#3a1445');
    g.addColorStop(1, '#12081f');
    ctx.fillStyle = g;
    ctx.fillRect(local.x, local.y, local.w, local.h);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(14, local.w * 0.045)}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD PHOTO', local.x + local.w / 2, local.y + local.h / 2);
  }
  ctx.restore();
  // White poster frame around the panel.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = frameW;
  if (panel.tilt) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((panel.tilt * Math.PI) / 180);
    ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  } else if (panel.diagonal) {
    const cut = panel.w * 0.12;
    ctx.beginPath();
    ctx.moveTo(panel.x, panel.y);
    ctx.lineTo(panel.x + panel.w, panel.y);
    ctx.lineTo(panel.x + panel.w - cut, panel.y + panel.h);
    ctx.lineTo(panel.x, panel.y + panel.h);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.restore();
}

function drawTitleBlock(ctx, state, x, y, w, u, maxH) {
  const title = (state.title || 'VICE COAST').toUpperCase();
  const subtitle = state.subtitle || 'chase the sunset';
  // Halftone strip behind the title.
  const bandH = 34 * u;
  const subSize = Math.max(20, 44 * u);
  // Keep the whole block inside maxH (the title band for gridNine is short).
  const heightCap = Math.max(28, (maxH || 260 * u) - bandH - subSize * 1.4);
  halftoneBand(ctx, x, y, w, bandH, 'rgba(255, 211, 25, 0.9)');
  ctx.fillStyle = '#ffd319';
  ctx.fillRect(x, y + bandH - 4 * u, w, 4 * u);
  const fitted = fitFont(ctx, title, w, 150 * u, "'Anton', sans-serif");
  const titleSize = Math.min(fitted, heightCap);
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ffd319');
  grad.addColorStop(0.5, '#ff2975');
  grad.addColorStop(1, '#8c1eff');
  ctx.save();
  ctx.font = `${titleSize}px 'Anton', sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = Math.max(4, 10 * u);
  ctx.strokeStyle = '#0b0614';
  ctx.lineJoin = 'round';
  const ty = y + bandH + titleSize * 0.95;
  ctx.strokeText(title, x, ty);
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 18 * u;
  ctx.shadowOffsetY = 6 * u;
  ctx.fillText(title, x, ty);
  ctx.restore();
  // Neon script subtitle.
  ctx.save();
  ctx.font = `${subSize}px 'Pacifico', cursive`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#7df9ff';
  ctx.shadowColor = '#ff2975';
  ctx.shadowBlur = 22 * u;
  ctx.fillText(subtitle, x + 6 * u, ty + subSize * 1.15);
  ctx.restore();
  return ty + subSize * 1.3;
}

function drawStars(ctx, x, y, filled, u) {
  const r = 18 * u;
  // A dark pill behind the stars so the gold reads against any photo.
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 18, 0.78)';
  roundRect(ctx, x - 14 * u, y - r - 12 * u, 5 * r * 2.4 + 28 * u, r * 2 + 24 * u, 10 * u);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 5; i++) {
    const cx = x + i * r * 2.4;
    ctx.save();
    ctx.translate(cx, y);
    ctx.beginPath();
    // A proper five-point star: ten vertices alternating outer / inner.
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      const rad = k % 2 === 0 ? r : r * 0.45;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < filled ? '#ffd319' : 'rgba(255,255,255,0.22)';
    ctx.strokeStyle = '#0b0614';
    ctx.lineWidth = 2 * u;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  return x + 5 * r * 2.4;
}

function drawMinimap(ctx, cx, cy, r, u) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#0d1b2a';
  ctx.fill();
  ctx.clip();
  // Generic streets: a few crossing lines, no real map copied.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3 * u;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy - r * 0.3); ctx.lineTo(cx + r, cy + r * 0.2);
  ctx.moveTo(cx - r * 0.4, cy - r); ctx.lineTo(cx + r * 0.3, cy + r);
  ctx.moveTo(cx - r, cy + r * 0.6); ctx.lineTo(cx + r, cy - r * 0.55);
  ctx.stroke();
  ctx.strokeStyle = '#7df9ff';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0.4, 2.4);
  ctx.stroke();
  // Player dot + north tick.
  ctx.fillStyle = '#ffd319';
  ctx.beginPath();
  ctx.arc(cx + r * 0.15, cy - r * 0.1, 6 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2975';
  ctx.beginPath();
  ctx.arc(cx - r * 0.45, cy + r * 0.4, 5 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3 * u;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${Math.round(15 * u)}px 'Bebas Neue', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('N', cx, cy - r - 8 * u);
}

// state: { layout, grade, title, subtitle, money, heat, rep, grain,
//          vignette, frame, panels: [framing per panel index] }
// photos: array of HTMLImageElement | null, indexed by photo slot.
export function renderCover(canvas, state, photos) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const u = w / 1920;
  const grade = gradeById(state.grade);
  const frameW = panelFrameWidth(w);

  // Sunset sky behind everything (shows through gaps and tilted cards).
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#2b0a4e');
  sky.addColorStop(0.45, '#ff2975');
  sky.addColorStop(0.75, '#ff7a3d');
  sky.addColorStop(1, '#ffd319');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  const panels = panelsForLayout(state.layout, w, h);
  const titleBand = panels.find((p) => p.kind === 'titleBand');
  panels.forEach((panel, i) => {
    if (panel.kind === 'titleBand') return;
    const framing = (state.panels && state.panels[i]) || { photo: panel.photo, zoom: 1, panX: 0, panY: 0, flip: false };
    const img = framing.photo >= 0 ? photos[framing.photo] || null : null;
    drawPanel(ctx, panel, img, framing, grade, frameW);
  });

  const pad = 42 * u;
  const hud = (txt, x, y, size, colour = '#ffffff', align = 'left') => {
    ctx.save();
    ctx.font = `600 ${size}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = align;
    ctx.fillStyle = colour;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6 * u;
    ctx.fillText(txt, x, y);
    ctx.restore();
  };

  // Mission panel, top-left.
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 18, 0.78)';
  roundRect(ctx, pad, pad, 500 * u, 132 * u, 10 * u);
  ctx.fill();
  ctx.strokeStyle = '#ffd319';
  ctx.lineWidth = 2 * u;
  ctx.stroke();
  ctx.restore();
  hud('CHAPTER 5  —  SUNSET RUN', pad + 18 * u, pad + 34 * u, 26 * u, '#ffd319');
  hud('Get the crew across the bridge before dark', pad + 18 * u, pad + 66 * u, 24 * u);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(pad + 18 * u, pad + 84 * u, 464 * u, 10 * u);
  ctx.fillStyle = '#ff2975';
  ctx.fillRect(pad + 18 * u, pad + 84 * u, 464 * u * 0.75, 10 * u);
  hud('STAGE 3 / 4   ·   NEXT: LOSE THE TAIL', pad + 18 * u, pad + 122 * u, 20 * u, '#cfe8ff');

  // Wanted stars + IN SIGHT + money, top-right.
  const starsX = w - pad - 5 * 18 * u * 2.4;
  drawStars(ctx, starsX, pad + 30 * u, state.heat ?? 4, u);
  hud('IN SIGHT', w - pad, pad + 96 * u, 24 * u, '#ff5b7a', 'right');
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 18, 0.78)';
  roundRect(ctx, w - pad - 250 * u, pad + 116 * u, 250 * u, 52 * u, 10 * u);
  ctx.fill();
  ctx.restore();
  hud(state.money || '$38,420', w - pad - 18 * u, pad + 152 * u, 34 * u, '#ffd319', 'right');

  // Police response panel, right edge under the money.
  const units = [
    ['UNIT 12', '84 m', 'PURSUIT'],
    ['UNIT 07', '210 m', 'RAMMING'],
    ['HELI 2', '310 m', 'SPOTLIGHT'],
  ];
  const upY = pad + 188 * u;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 18, 0.72)';
  roundRect(ctx, w - pad - 300 * u, upY, 300 * u, 128 * u, 10 * u);
  ctx.fill();
  ctx.restore();
  hud('VICE COAST PD  ·  CODE 3', w - pad - 282 * u, upY + 30 * u, 22 * u, '#7df9ff');
  units.forEach((row, i) => {
    const y = upY + 58 * u + i * 26 * u;
    hud(row[0], w - pad - 282 * u, y, 21 * u);
    hud(row[1], w - pad - 152 * u, y, 21 * u, '#cfe8ff');
    hud(row[2], w - pad - 18 * u, y, 19 * u, '#ff8fa3', 'right');
  });

  // Title block: bottom-left, or inside the title band for gridNine.
  if (titleBand) {
    drawTitleBlock(ctx, state, titleBand.x + 30 * u, titleBand.y + 8 * u, titleBand.w - 60 * u, u, titleBand.h - 8 * u);
  } else {
    const blockW = Math.min(w * 0.58, 1050 * u);
    const blockX = pad;
    const blockY = h - pad - 250 * u;
    drawTitleBlock(ctx, state, blockX, blockY, blockW, u, 250 * u);
  }

  // Ribbon badge, tilted, over the title block's top-right. The gridNine
  // title band already carries the brand, so it gets no ribbon.
  if (!titleBand) {
    ctx.save();
    ctx.translate(w * 0.52, h - pad - 218 * u);
    ctx.rotate(-0.06);
    ctx.fillStyle = '#ff2975';
    ctx.fillRect(-150 * u, -18 * u, 300 * u, 36 * u);
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.round(21 * u)}px 'Bebas Neue', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('VICE COAST  •  EST. 2026', 0, 7 * u);
    ctx.restore();
  }

  // REP bar under the mission panel, left column (kept clear of the title
  // block at the bottom).
  const repW = 448 * u;
  const repX = pad;
  const repY = pad + 150 * u;
  hud('REP', repX, repY + 2 * u, 20 * u, '#ffd319');
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(repX + 52 * u, repY - 8 * u, repW, 10 * u);
  ctx.fillStyle = '#7df9ff';
  ctx.fillRect(repX + 52 * u, repY - 8 * u, repW * ((state.rep ?? 62) / 100), 10 * u);
  hud(`LVL 7  ·  ${state.rep ?? 62}%`, repX + 52 * u + repW + 12 * u, repY + 2 * u, 20 * u, '#cfe8ff');

  // Dialog strip, top-centre between the mission panel and the stars.
  const dlgW = 560 * u;
  const dlgX = (w - dlgW) / 2;
  const dlgY = pad;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 6, 18, 0.82)';
  roundRect(ctx, dlgX, dlgY, dlgW, 78 * u, 10 * u);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.5 * u;
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(dlgX + 44 * u, dlgY + 39 * u, 26 * u, 0, Math.PI * 2);
  ctx.fillStyle = '#ff7a3d';
  ctx.fill();
  ctx.fillStyle = '#0b0614';
  ctx.font = `${Math.round(26 * u)}px 'Anton', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('L', dlgX + 44 * u, dlgY + 48 * u);
  ctx.restore();
  hud('LENA VOSS  —  WHEELWOMAN', dlgX + 84 * u, dlgY + 32 * u, 21 * u, '#ffd319');
  hud('“Sunset is ours if we make the bridge.”', dlgX + 84 * u, dlgY + 62 * u, 23 * u);

  // Minimap + speed, bottom-right. The speed sits to the LEFT of the
  // minimap so it can never collide with the district label under it.
  const mapR = 74 * u;
  const mapCx = w - pad - mapR;
  const mapCy = h - pad - mapR - 90 * u;
  drawMinimap(ctx, mapCx, mapCy, mapR, u);
  hud('PALM ROW', mapCx, mapCy + mapR + 26 * u, 20 * u, '#ffffff', 'center');
  const speedX = mapCx - mapR - 24 * u;
  hud('128', speedX, h - pad - 34 * u, 54 * u, '#ffffff', 'right');
  hud('MPH', speedX + 8 * u, h - pad - 34 * u, 22 * u, '#cfe8ff');
  hud('COAST RUNNER GT', speedX, h - pad - 8 * u, 20 * u, '#cfe8ff', 'right');

  // Grain + vignette.
  if (state.grain) {
    const rnd = seededRandom(20261119);
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#ffffff';
    const dots = Math.round((w * h) / 9000);
    for (let i = 0; i < dots; i++) {
      ctx.fillRect(rnd() * w, rnd() * h, 2, 2);
    }
    ctx.restore();
  }
  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(5,2,12,0.5)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  // Optional white poster frame around the whole cover.
  if (state.frame) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(8, 22 * u);
    ctx.strokeRect(0, 0, w, h);
    ctx.restore();
  }
}
