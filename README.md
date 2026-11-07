# PicMon Booth

A photobooth that puts your photo inside a collectible trading-card frame.

1. **Pull**: hit PULL to shuffle and draw a random card (frame colour, finish, rarity, stats).
2. **Booth**: live camera with a 3‑2‑1 countdown, single snaps or a burst of 4, or upload photos.
3. **Pick**: choose the shot for the card window.
4. **Decorate**: edit name, stats and caption (or tap them on the card), switch frame/finish/rarity,
   add and arrange stickers, frame the photo, and save a 900×1200 PNG.

Built with React 18, TypeScript, Vite, plain CSS and the Canvas 2D API. No other runtime dependencies.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-checks, then outputs static files to dist/
npm run preview    # serves dist/ locally
```

The live camera needs HTTPS (or localhost). Anywhere else the booth falls back to uploads.

## Deploy

`dist/` is a static site. On Vercel, import the repo (framework preset: **Vite**) or run `npx vercel --prod`
from this folder. Netlify, Cloudflare Pages and GitHub Pages work the same way.

## Layout

```
src/
  App.tsx                 stage flow (pull → booth → pick → edit) and shared state
  card/
    data.ts               themes, finishes, rarities, sticker catalogue, card state + pull logic
    drawCard.ts           renders the whole card to a canvas; photo layout; tap-to-edit zones
    stickers.ts            sticker drawing, hit-testing, selection handle
    shapes.ts              vector shapes (star, heart, bow, moon…) and the kawaii face
    draw-utils.ts          seeded RNG, rounded rects, gradients
  components/
    PullStage.tsx          card backs, shuffle, flip reveal, holo tilt, sparkle burst
    BoothStage.tsx         camera viewfinder, countdown, burst, uploads, shot strip
    PickStage.tsx          choose a shot
    EditStage.tsx          editor layout, tabs, save
    CardEditor.tsx         interactive canvas: drag/resize/spin stickers, pan photo, tap text
    panels.tsx             Details, Frame, Stickers and Photo panels
  hooks/useCamera.ts       getUserMedia lifecycle
  lib/                     font loading, PNG saving
  styles.css
```
