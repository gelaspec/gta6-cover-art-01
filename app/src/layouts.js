// Seven panel geometries for the Vice Coast cover.
// Every layout is a function of the canvas size, so the same layout works for
// the square, portrait and landscape export sizes. Each panel is a rectangle
// in canvas pixels plus which photo slot feeds it by default and a label the
// editor shows in its thumbnail strip.

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

function inset(rect, pad) {
  return { x: rect.x + pad, y: rect.y + pad, w: rect.w - pad * 2, h: rect.h - pad * 2 };
}

// Panels are returned in draw order. `tilt` (degrees) is honoured by the
// renderer for snapshot-style layouts; plain layouts leave it at 0.
export function panelsForLayout(layoutId, w, h) {
  const full = { x: 0, y: 0, w, h };
  switch (layoutId) {
    case 'heroFullBleed':
      return [{ ...full, photo: 0, tilt: 0, kind: 'hero' }];

    case 'heroAndThree': {
      const heroW = Math.round(w * 0.62);
      const sideX = heroW + GAP;
      const sideW = w - sideX;
      const third = Math.round((h - GAP * 2) / 3);
      return [
        { x: 0, y: 0, w: heroW, h, photo: 0, tilt: 0, kind: 'hero' },
        { x: sideX, y: 0, w: sideW, h: third, photo: 1, tilt: 0, kind: 'side' },
        { x: sideX, y: third + GAP, w: sideW, h: third, photo: 0, tilt: 0, kind: 'side' },
        { x: sideX, y: (third + GAP) * 2, w: sideW, h: h - (third + GAP) * 2, photo: 2, tilt: 0, kind: 'side' },
      ];
    }

    case 'gridFour': {
      const cw = Math.round((w - GAP) / 2);
      const ch = Math.round((h - GAP) / 2);
      return [
        { x: 0, y: 0, w: cw, h: ch, photo: 0, tilt: 0, kind: 'cell' },
        { x: cw + GAP, y: 0, w: w - cw - GAP, h: ch, photo: 1, tilt: 0, kind: 'cell' },
        { x: 0, y: ch + GAP, w: cw, h: h - ch - GAP, photo: 2, tilt: 0, kind: 'cell' },
        { x: cw + GAP, y: ch + GAP, w: w - cw - GAP, h: h - ch - GAP, photo: 1, tilt: 0, kind: 'cell' },
      ];
    }

    case 'gridNine': {
      const bandH = Math.round(h * 0.16);
      const gridH = h - bandH - GAP;
      const cw = Math.round((w - GAP * 2) / 3);
      const ch = Math.round((gridH - GAP * 2) / 3);
      const cells = [];
      const photos = [0, 1, 2, 1, 0, 2, 0, 2, 1];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const x = col * (cw + GAP);
          const y = row * (ch + GAP);
          cells.push({
            x, y,
            w: col === 2 ? w - x : cw,
            h: row === 2 ? gridH - y : ch,
            photo: photos[row * 3 + col], tilt: 0, kind: 'cell',
          });
        }
      }
      cells.push({ x: 0, y: gridH + GAP, w, h: bandH, photo: -1, tilt: 0, kind: 'titleBand' });
      return cells;
    }

    case 'tiltedSnapshots': {
      const cardW = Math.round(w * 0.34);
      const cardH = Math.round(h * 0.62);
      const y = Math.round((h - cardH) / 2) - Math.round(h * 0.04);
      return [
        { x: Math.round(w * 0.06), y: y + 26, w: cardW, h: cardH, photo: 0, tilt: -4, kind: 'card' },
        { x: Math.round(w * 0.33), y: y - 14, w: cardW, h: cardH, photo: 1, tilt: 2, kind: 'card' },
        { x: Math.round(w * 0.60), y: y + 22, w: cardW, h: cardH, photo: 2, tilt: 5, kind: 'card' },
      ];
    }

    case 'diagonalSplit': {
      // The hero occupies the left ~58% and the diagonal is drawn by the
      // renderer as a clipped edge; the two strips fill the right column.
      const heroW = Math.round(w * 0.58);
      const stripH = Math.round((h - GAP) / 2);
      return [
        { x: 0, y: 0, w: heroW, h, photo: 0, tilt: 0, kind: 'hero', diagonal: true },
        { x: heroW + GAP, y: 0, w: w - heroW - GAP, h: stripH, photo: 1, tilt: 0, kind: 'strip' },
        { x: heroW + GAP, y: stripH + GAP, w: w - heroW - GAP, h: h - stripH - GAP, photo: 2, tilt: 0, kind: 'strip' },
      ];
    }

    case 'storyStrip': {
      const heroH = Math.round(h * 0.62);
      const halfW = Math.round((w - GAP) / 2);
      return [
        { x: 0, y: 0, w, h: heroH, photo: 0, tilt: 0, kind: 'hero' },
        { x: 0, y: heroH + GAP, w: halfW, h: h - heroH - GAP, photo: 1, tilt: 0, kind: 'cell' },
        { x: halfW + GAP, y: heroH + GAP, w: w - halfW - GAP, h: h - heroH - GAP, photo: 2, tilt: 0, kind: 'cell' },
      ];
    }

    default:
      return [{ ...full, photo: 0, tilt: 0, kind: 'hero' }];
  }
}

// The white frame the renderer draws around every photo panel, in pixels,
// scaled from the canvas width so it stays proportional at every export size.
export function panelFrameWidth(canvasW) {
  return Math.max(3, Math.round(canvasW / 320));
}

export { inset };
