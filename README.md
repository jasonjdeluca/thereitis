# There It Is

Real-time earnings call bingo. Session 1 ships single-player, Hilton-only, no backend.

## Stack
- React + Vite + Tailwind CSS
- `html2canvas` for shareable result cards
- Mobile-first; dark navy + gold

## Run locally
```bash
npm install
npm run dev
```

Build for production:
```bash
npm run build
```

Deploy: connect this repo to Vercel.

## Notes
- Phrase bank, card generation, and bingo detection live in `src/lib/`.
- UI in `src/components/`.
- Card generator places the Holy Trinity as three consecutive cells in a single row or column so the first early bingo can ring; FREE is hardcoded to `[2][2]`; max 1–2 cold phrases per card.
- All copy is generic — no company logos, no real person names.
