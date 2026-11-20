// Seven panel arrangements for the cover.
//
// A layout is a function of the canvas size, so the same arrangement works
// for the square, portrait and landscape exports. Each panel is a rectangle
// in canvas pixels, the photo slot it shows by default, a tilt in degrees
// (only the snapshot cards use it) and a kind the painter uses to decide
// what goes on top: hero, side, cell, strip, card or the title band that
// carries the lettering instead of a photo.

export const LAYOUTS = [
  { id: 'heroFullBleed', name: 'Full Bleed Hero', hint: 'One photo, edge to edge' },
  { id: 'heroAndThree', name: 'Hero + Three', hint: 'Big hero, three stacked' },
  { id: 'gridFour', name: 'Four Grid', hint: 'Two by two panels' },
  { id: 'gridNine', name: 'Nine Grid', hint: 'Three by three + title band' },
  { id: 'tiltedSnapshots', name: 'Tilted Snapshots', hint: 'Three tilted cards' },
  { id: 'diagonalSplit', name: 'Diagonal Split', hint: 'Hero cut on a diagonal' },
  { id: 'storyStrip', name: 'Story Strip', hint: 'Hero on top, two below' },
];

const GAP = 10;

function panel(x, y, w, h, photo, kind, tilt = 0, diagonal = false) {
  // One rectangle plus the slot it shows by default; the painter reads
  // kind/tilt/diagonal to decide the clip and the frame.
  return { x, y, w, h, photo, kind, tilt, diagonal };
}

export function panelsForLayout(layoutId, w, h) {
  if (layoutId === 'heroFullBleed') {
    return [panel(0, 0, w, h, 0, 'hero')];
  }

  if (layoutId === 'heroAndThree') {
    const heroW = Math.round(w * 0.62);
    const sideX = heroW + GAP;
    const sideW = w - sideX;
    const third = Math.round((h - GAP * 2) / 3);
    return [
      panel(0, 0, heroW, h, 0, 'hero'),
      panel(sideX, 0, sideW, third, 1, 'side'),
      panel(sideX, third + GAP, sideW, third, 0, 'side'),
      panel(sideX, (third + GAP) * 2, sideW, h - (third + GAP) * 2, 2, 'side'),
    ];
  }

  if (layoutId === 'gridFour') {
    const cw = Math.round((w - GAP) / 2);
    const ch = Math.round((h - GAP) / 2);
    return [
      panel(0, 0, cw, ch, 0, 'cell'),
      panel(cw + GAP, 0, w - cw - GAP, ch, 1, 'cell'),
      panel(0, ch + GAP, cw, h - ch - GAP, 2, 'cell'),
      panel(cw + GAP, ch + GAP, w - cw - GAP, h - ch - GAP, 1, 'cell'),
    ];
  }

  if (layoutId === 'gridNine') {
    const bandH = Math.round(h * 0.16);
    const gridH = h - bandH - GAP;
    const cw = Math.round((w - GAP * 2) / 3);
    const ch = Math.round((gridH - GAP * 2) / 3);
    const slots = [0, 1, 2, 1, 0, 2, 0, 2, 1];
    const cells = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * (cw + GAP);
        const y = row * (ch + GAP);
        cells.push(panel(
          x, y,
          col === 2 ? w - x : cw,
          row === 2 ? gridH - y : ch,
          slots[row * 3 + col], 'cell',
        ));
      }
    }
    cells.push(panel(0, gridH + GAP, w, bandH, -1, 'titleBand'));
    return cells;
  }

  if (layoutId === 'tiltedSnapshots') {
    const cardW = Math.round(w * 0.34);
    const cardH = Math.round(h * 0.62);
    const top = Math.round((h - cardH) / 2) - Math.round(h * 0.04);
    return [
      panel(Math.round(w * 0.06), top + 26, cardW, cardH, 0, 'card', -4),
      panel(Math.round(w * 0.33), top - 14, cardW, cardH, 1, 'card', 2),
      panel(Math.round(w * 0.60), top + 22, cardW, cardH, 2, 'card', 5),
    ];
  }

  if (layoutId === 'diagonalSplit') {
    const heroW = Math.round(w * 0.58);
    const stripH = Math.round((h - GAP) / 2);
    return [
      panel(0, 0, heroW, h, 0, 'hero', 0, true),
      panel(heroW + GAP, 0, w - heroW - GAP, stripH, 1, 'strip'),
      panel(heroW + GAP, stripH + GAP, w - heroW - GAP, h - stripH - GAP, 2, 'strip'),
    ];
  }

  if (layoutId === 'storyStrip') {
    const heroH = Math.round(h * 0.62);
    const halfW = Math.round((w - GAP) / 2);
    return [
      panel(0, 0, w, heroH, 0, 'hero'),
      panel(0, heroH + GAP, halfW, h - heroH - GAP, 1, 'cell'),
      panel(halfW + GAP, heroH + GAP, w - halfW - GAP, h - heroH - GAP, 2, 'cell'),
    ];
  }

  return [panel(0, 0, w, h, 0, 'hero')];
}

// White poster frame around each panel, in pixels, scaled from the canvas
// width so it stays proportional at every export size.
export function panelFrameWidth(canvasW) {
  return Math.max(3, Math.round(canvasW / 320));
}

export function inset(rect, pad) {
  return { x: rect.x + pad, y: rect.y + pad, w: rect.w - pad * 2, h: rect.h - pad * 2 };
}
