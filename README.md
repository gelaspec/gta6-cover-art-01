[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/gelaspec/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/gelaspec/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Coast Cover Studio

Turn your own photos into a GTA-style poster cover — multi-panel layouts,
sunset and neon colour grades, bold gradient lettering, and a full HUD of
original ornaments (mission panel, wanted stars, police units, minimap, REP
bar, dialog strip). Export as a PNG in the three common post sizes.

Everything runs offline in the browser: photos are read on your machine and
never uploaded. All fonts are vendored under `app/fonts/` under the SIL Open
Font License (Anton, Pacifico, Bebas Neue). The city, characters and artwork
are original — no Rockstar logo, wordmark, artwork or font.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step and no network: every script, font and sample is a file
under `app/`, and photos stay on the machine that opens the page.

## How to use it

1. Pick up to three photos (or use the bundled samples).
2. Choose one of 7 layouts: Full Bleed Hero, Hero + Three, Four Grid,
   Nine Grid, Tilted Snapshots, Diagonal Split, Story Strip.
3. Pick one of 6 grades: Vice Sunset, Neon Night, Golden Hour, Palm Dusk,
   Teal Tide, Mono Noir.
4. Type the title and subtitle, set the cash, heat stars and REP.
5. Click a panel to select it, then drag the photo inside it to reposition,
   scroll to zoom, or use Flip / Next photo.
6. Export one size (1080×1080, 1080×1350, 1920×1080) or all three at once.
   Undo and redo cover every change.

## Files

- `app/index.html` — editor structure and preview canvas.
- `app/style.css` — dark editor chrome and screenshot mode.
- `app/src/main.js` — editor wiring: uploads, controls, drag/zoom, export.
- `app/src/coverCanvas.js` — `renderCover`: panels, grade, lettering, HUD.
- `app/src/layouts.js` — the 7 panel geometries per export size.
- `app/src/gradeMaps.js` — the 6 grade recipes (filter + overlays).
- `app/src/photoCrop.js` — cover-fit, pan, zoom and flip per panel.
- `app/src/exportPng.js` — `exportCoverSize` / `exportAllSizes`.
- `app/src/historyUndo.js` — undo / redo history stack.
- `app/src/shotScenes.js` — fixed `?shot=` scenes for screenshots.
- `main.ts` — hands the app in: copies `app/` + `screenshots/` and writes
  `dossier.json` with the vendored make.fun library.
- `serve.ts` — tiny static server for local development.

## License

MIT — see `LICENSE`. Fonts under `app/fonts/` are SIL OFL 1.1 (see the
`OFL-*.txt` files next to each font).
