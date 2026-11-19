// Six sunset / neon colour grades, each a recipe the renderer applies to a
// photo: a canvas `filter` string for the base shift, then two translucent
// gradient overlays with blend modes, then an optional duotone tint.
// Keeping the recipe as data (not baked pixels) means the same grade works
// on every panel at every export size.

export const GRADES = [
  {
    id: 'viceSunset', name: 'Vice Sunset',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.04)',
    overlays: [
      { from: 'rgba(255, 41, 117, 0.34)', to: 'rgba(255, 160, 60, 0.10)', mode: 'overlay', vertical: true },
      { from: 'rgba(140, 30, 255, 0.16)', to: 'rgba(255, 211, 25, 0.05)', mode: 'soft-light', vertical: false },
    ],
    tint: null,
  },
  {
    id: 'neonNight', name: 'Neon Night',
    filter: 'saturate(1.6) contrast(1.18) brightness(0.94) hue-rotate(-12deg)',
    overlays: [
      { from: 'rgba(0, 229, 255, 0.26)', to: 'rgba(255, 41, 117, 0.30)', mode: 'overlay', vertical: true },
      { from: 'rgba(10, 10, 60, 0.28)', to: 'rgba(0, 0, 0, 0)', mode: 'multiply', vertical: true },
    ],
    tint: null,
  },
  {
    id: 'goldenHour', name: 'Golden Hour',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.08) sepia(0.22)',
    overlays: [
      { from: 'rgba(255, 190, 80, 0.30)', to: 'rgba(255, 120, 40, 0.08)', mode: 'soft-light', vertical: true },
      { from: 'rgba(255, 240, 200, 0.10)', to: 'rgba(120, 40, 0, 0.12)', mode: 'overlay', vertical: true },
    ],
    tint: null,
  },
  {
    id: 'palmDusk', name: 'Palm Dusk',
    filter: 'saturate(1.3) contrast(1.14) brightness(0.97) hue-rotate(14deg)',
    overlays: [
      { from: 'rgba(255, 90, 60, 0.28)', to: 'rgba(90, 20, 120, 0.34)', mode: 'overlay', vertical: true },
      { from: 'rgba(255, 120, 180, 0.08)', to: 'rgba(20, 0, 50, 0.20)', mode: 'multiply', vertical: true },
    ],
    tint: null,
  },
  {
    id: 'tealTide', name: 'Teal Tide',
    filter: 'saturate(1.4) contrast(1.1) brightness(1.0) hue-rotate(28deg)',
    overlays: [
      { from: 'rgba(0, 200, 190, 0.26)', to: 'rgba(255, 210, 90, 0.14)', mode: 'overlay', vertical: false },
      { from: 'rgba(0, 60, 80, 0.18)', to: 'rgba(0, 0, 0, 0)', mode: 'multiply', vertical: true },
    ],
    tint: null,
  },
  {
    id: 'monoNoir', name: 'Mono Noir',
    filter: 'grayscale(1) contrast(1.25) brightness(1.02)',
    overlays: [
      { from: 'rgba(255, 41, 117, 0.20)', to: 'rgba(0, 229, 255, 0.14)', mode: 'overlay', vertical: true },
      { from: 'rgba(0, 0, 0, 0.22)', to: 'rgba(0, 0, 0, 0)', mode: 'multiply', vertical: true },
    ],
    tint: 'rgba(255, 41, 117, 0.06)',
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Paints one overlay gradient over a panel rectangle. `vertical` picks the
// gradient direction; the blend mode comes from the recipe.
export function paintGradeOverlay(ctx, rect, overlay) {
  const { x, y, w, h } = rect;
  const grad = overlay.vertical
    ? ctx.createLinearGradient(x, y, x, y + h)
    : ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, overlay.from);
  grad.addColorStop(1, overlay.to);
  ctx.save();
  ctx.globalCompositeOperation = overlay.mode;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

// Applies a full grade to a panel that already has its photo drawn:
// overlays first, then the flat duotone tint if the recipe has one.
export function applyGrade(ctx, rect, grade) {
  for (const overlay of grade.overlays) paintGradeOverlay(ctx, rect, overlay);
  if (grade.tint) {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grade.tint;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}
