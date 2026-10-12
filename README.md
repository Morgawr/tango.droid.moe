# tango.droid.moe

> A retro PC-98 styled vocabulary vault and visual archive for mined Japanese reading sessions.

Hosted at [tango.droid.moe](https://tango.droid.moe).

---

## Overview

`tango.droid.moe` is a high-performance, statically generated web application that catalogs vocabulary mined during Japanese visual novel playthroughs. Every mined word is preserved with:

- **Context Sentences**: In-game dialogue line with the target word highlighted.
- **Visual Capture**: In-game screenshots compressed to lightweight WebP files.
- **Twitch Stream Clips**: Synchronized Twitch clips captured at the exact moment of mining.
- **Dictionary Definitions**: English definitions and glosses.
- **VNDB Metadata**: Source visual novel catalog links, release years, and developer metadata.

## Aesthetic Guidelines (PC-98 Retro Terminal)

The interface adheres strictly to a retro PC-98 / classic visual novel terminal design language:
- **Palette**: Deep charcoal-brown canvas (`#171614`), dark taupe panels (`#1e1c19`, `#24211d`), 1px crisp borders (`#38342f`), and parchment off-white text (`#dcd5cc`).
- **Accent Colors**: Desaturated amber (`#c49c48`) for target word highlights, and desaturated brick red (`#b35e52`) for stream clips.
- **Strict Square Geometry**: All corners have `border-radius: 0px`. No rounded corners anywhere (`rounded-none`).
- **No Pill Labels or Status Dots**: No rounded badges, pill tags, or indicator dots (`●`). Labels are rendered with clean square bracket notation: `[ Interlude ]`, `[ Futae no Kage ]`, `[ CLIP ]`.
- **English UI Chrome**: All navigation, control labels, and metadata indicators are in English (`[ Words ]`, `[ Works ]`, `Search vocabulary...`). Authentic Japanese is preserved in headwords, readings, and dialogue sentences.

## Architecture

- **Framework**: [Astro 5](https://astro.build/) Static Site Generation (SSG).
- **Styling**: Tailwind CSS with custom PC-98 design tokens.
- **Search & Filter**: Instant client-side search across Kanji, Kana, dialogue sentences, and English glosses.
- **Modal & Deep Links**: In-page modal inspection with keyboard navigation (`Left`, `Right`, `Escape`), synchronized URL state (`?word=80`), and dedicated standalone static permalinks (`/words/80`) with OpenGraph cards.
- **Pipeline**: `extract.py` reads directly from the local michadame bank SQLite database (`bank.db`), compresses raw image BLOBs to WebP, and generates static JSON feeds.

## Getting Started

### Prerequisites

- Node.js (v18+)
- Python 3.10+ (with `Pillow` installed for image optimization)

### Installation

```bash
npm install
```

### Extracting Data from Michadame Bank

To extract mined words, screenshot BLOBs, and Twitch clips from your local database:

```bash
npm run extract
```

This reads `~/.config/michadame/bank/bank.db` and writes:
- `src/data/words.json`: Vocabulary metadata and clip URLs.
- `src/data/works.json`: Catalog of source visual novels.
- `public/media/*.webp`: Converted high-res screenshots and thumbnails.

### Running Locally

```bash
# Start Astro dev server
npm run dev

# Or build and preview static output
npm run build
npm run preview
```

### Building for GitHub Pages

```bash
npm run build
```

The output in `dist/` is ready to be deployed to GitHub Pages with the custom domain configured in `public/CNAME` (`tango.droid.moe`).
