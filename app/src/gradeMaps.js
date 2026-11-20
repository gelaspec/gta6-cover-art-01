// Six colour grades for the Vice Coast sunset / neon look.
//
// A grade is data, not baked pixels: a canvas filter for the base shift,
// then two translucent gradient washes painted with blend modes, then an
// optional flat tint for the duotone grade. The same recipe paints every
// panel at every export size, so the preview and the PNG always agree.

function wash(from, to, mode, down) {
  // One gradient wash: two colours, a blend mode, and its direction.
  return { from, to, mode, vertical: down };
}

export const GRADES = [
  {
    id: 'viceSunset', name: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.04)',
    overlays: [
      wash('rgba(255, 41, 117, 0.34)', 'rgba(255, 160, 60, 0.10)', 'overlay', true),
      wash('rgba(140, 30, 255, 0.16)', 'rgba(255, 211, 25, 0.05)', 'soft-light', false),
    ],
    tint: null,
  },
  {
    id: 'neonNight', name: 'Neon Night',
    filter: 'saturate(1.6) contrast(1.18) brightness(0.94) hue-rotate(-12deg)',
    overlays: [
      wash('rgba(0, 229, 255, 0.26)', 'rgba(255, 41, 117, 0.30)', 'overlay', true),
      wash('rgba(10, 10, 60, 0.28)', 'rgba(0, 0, 0, 0)', 'multiply', true),
    ],
    tint: null,
  },
  {
    id: 'goldenHour', name: 'Golden Hour',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.08) sepia(0.22)',
    overlays: [
      wash('rgba(255, 190, 80, 0.30)', 'rgba(255, 120, 40, 0.08)', 'soft-light', true),
      wash('rgba(255, 240, 200, 0.10)', 'rgba(120, 40, 0, 0.12)', 'overlay', true),
    ],
    tint: null,
  },
  {
    id: 'palmDusk', name: 'Palm Dusk',
    filter: 'saturate(1.3) contrast(1.14) brightness(0.97) hue-rotate(14deg)',
    overlays: [
      wash('rgba(255, 90, 60, 0.28)', 'rgba(90, 20, 120, 0.34)', 'overlay', true),
      wash('rgba(255, 120, 180, 0.08)', 'rgba(20, 0, 50, 0.20)', 'multiply', true),
    ],
    tint: null,
  },
  {
    id: 'tealTide', name: 'Teal Tide',
    filter: 'saturate(1.4) contrast(1.1) brightness(1.0) hue-rotate(28deg)',
    overlays: [
      wash('rgba(0, 200, 190, 0.26)', 'rgba(255, 210, 90, 0.14)', 'overlay', false),
      wash('rgba(0, 60, 80, 0.18)', 'rgba(0, 0, 0, 0)', 'multiply', true),
    ],
    tint: null,
  },
  {
    id: 'monoNoir', name: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(1.02)',
    overlays: [
      wash('rgba(255, 41, 117, 0.20)', 'rgba(0, 229, 255, 0.14)', 'overlay', true),
      wash('rgba(0, 0, 0, 0.22)', 'rgba(0, 0, 0, 0)', 'multiply', true),
    ],
    tint: 'rgba(255, 41, 117, 0.06)',
  },
];

export function gradeById(id) {
  for (const grade of GRADES) if (grade.id === id) return grade;
  return GRADES[0];
}

export function paintGradeOverlay(ctx, rect, overlay) {
  const gradient = overlay.vertical
    ? ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h)
    : ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y);
  gradient.addColorStop(0, overlay.from);
  gradient.addColorStop(1, overlay.to);
  ctx.save();
  ctx.globalCompositeOperation = overlay.mode;
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

// Paints the washes (and the duotone tint, when the recipe has one) over a
// panel whose photo is already drawn.
export function applyGrade(ctx, rect, grade) {
  for (const overlay of grade.overlays) paintGradeOverlay(ctx, rect, overlay);
  if (!grade.tint) return;
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}
