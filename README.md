# The Memory Bookshelf

A private, responsive bookshelf and journal built with vanilla JavaScript and CSS. It has no build step and runs entirely in the browser until Supabase is configured.

## Run locally

From this folder, start any static web server. For example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. Use a local HTTP server; ES modules and the service worker do not work reliably from `file://`.

## Phases in this build

### Phase 1 — Reader prototype

The warm room, time-based lighting, paused rain/dust, user-started ambient noise, empty shelf, page curl, arrows, keyboard and touch controls are included. Photo/GIF/video shapes and copy are generated in CSS; audio clicks play a synthesized tone. The first launch clears any previously saved local books and media once; books added afterward are saved normally. Reader progress is stored in localStorage, keyed per book and spread.

### Phase 2 — Writer desk

Choose froggiee or kyuu on the room entry screen, then open the discreet keyhole to enter writer mode; there is no writer password. Each story, text note, caption, and keepsake retains its own author and ink/accent colors. Editing or moving another character’s item does not recolor it; their text remains intact, and new notes use the current writer’s color. froggiee uses dark green ink and muted sage borders/tape; kyuu uses dark blue ink and muted blue borders/tape. The writer shows the same two-page layout as the reader. Click blank paper to add a text block there, type directly on the page, and use the inspector to set alignment, size, position, and rotation. Empty photo frames can be added and filled with the attach control; uploaded pictures display without a landscape overlay. The desk can add/rename/archive/reorder/lock journals, manage spreads, and undo/redo up to 100 snapshots. Add optional character portraits as `assets/froggie-avatar.svg` and `assets/kyuu-avatar.svg`; missing files leave the portrait area blank. Changes autosave after 800 ms to IndexedDB; writer activity locks after 10 minutes.

### Phase 3 — Sync

The sync adapter writes a plain JSON document per book to a Supabase `books` table and stores media as regular files in the `memory-media` bucket. Share links open the collection without a key fragment. Supabase values are intentionally blank in `js/config.js`; the live multi-device path needs a Supabase project and the SQL/policies below. Without configuration, the app remains local-only and links work only in that browser. Offline changes and media stay in IndexedDB and retry on the next online event.

Run [supabase-setup.sql](./supabase-setup.sql) in the Supabase SQL editor to create a starter table and storage policies. These broad anonymous policies make the collection’s book text and media readable to anyone who can reach the project API. Character selection only identifies the writer; it does not encrypt or protect synced data. Do not use these public policies for private relationship content. To make backend sharing private, add authenticated access control before enabling sync.

Configure `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/config.js`. The anon key is intended to be public and must be constrained by RLS. Content is deliberately unencrypted in IndexedDB and Supabase. Decrypt-only migration helpers remain for earlier encrypted recordings/books; they are not used by new writer sessions.

### Phase 4 — Extras

Timeline, constellation, optional coordinate entry, an on-demand map view, voice recording, batch photo grouping, browser print-to-PDF, and an offline app shell are included. JPEG EXIF date/GPS is read in the browser; GPS is unchecked by default and only added to spread/book data if you opt to keep it. Other photo types use their file date. Voice recording asks for microphone permission only after you press Record, shows a recording indicator, and can be discarded. The print layout includes captions for audio/video because browser-print export cannot embed their playback; real media images are not currently placed into the print pages. The map view requests OpenStreetMap tiles only when a book has coordinates and the map is opened. The service worker never caches the Supabase storage endpoint. After the first book opens on a phone, an install hint appears and uses the browser install prompt where supported.

## Ambience and room files

The room is styled as a night study: teal wall, walnut bookcase, brass, an amber lamp and moonlight.

- `assets/song.mp3`: optional room song. The **Music** button in the header is greyed out until this file exists.
- `assets/room-bg.jpg`: optional room photo, blended softly into the wall.
- `assets/fonts/`: Cormorant Garamond (headline) and Caveat, bundled locally so they work offline.
- `styles/ambience.css`: the whole visual design (wall, floor, window, bookcase, props, lamp, panels). Edit it to restyle the scene. It only changes how things look.
- `js/ambience.js`: the lamp switch (click it, or focus it and press Enter or Space), the cursor-reactive particles, and the Music button.

The lamp: with it on, the room is warm and the particles glow softly. With it off, the room turns moonlit blue and the particles glow much more.
The particles drift slowly toward your cursor, then scatter in random directions a little later. The Atmosphere button pauses all the motion.

## Tradeoffs and swappable parts

- `js/sync.js` is the storage adapter. Replace it with another implementation of `load`, `list`, `save`, `uploadMedia`, and `getMedia` without changing the UI.
- `js/crypto.js` contains decrypt-only helpers for one-time migration from an earlier build. New book documents and media are plain data; character selection identifies the writer but does not protect or encrypt content.
- Writer snapshots and offline media use IndexedDB, not localStorage. Only reader progress is in localStorage.
- The base theme still loads DM Sans and Caveat from Google Fonts with web-safe fallbacks. The new headline and Caveat files are bundled in `assets/fonts/`. The app has no analytics or trackers.
- PDF output uses the browser print dialog, so it needs no PDF library or external script. Choose “Save as PDF” in the print dialog.
- Room, paper, cover, and media placeholder artwork are CSS shapes and gradients. The shelf starts empty; add books in writer mode. No media files are needed to run the app.

## Quick test checklist

1. Start the local server and open the shelf. Verify the warm room and book spines render.
2. Confirm the shelf starts empty, create a journal in writer mode, and verify it remains after refreshing. Turn through its pages with arrows, keyboard, clicks, and a phone swipe.
3. Click the photo, audio, video, and note placeholders. Confirm flip, synthesized tone, animation, and unfold behavior.
4. Refresh and confirm read highlights have cleared for the spreads you opened.
5. Choose froggiee, enter writer mode, add story text and a keepsake, and confirm green ink/tints plus froggiee corner labels. Lock the room, choose kyuu, add a separate note/caption, and confirm the existing froggiee content remains green while new content is blue. Try undo/redo, voice recording, and photo sorting; check that GPS defaults off.
6. Use Timeline/Constellation. Add coordinates to a book before opening Map to request tiles.
7. With Supabase configured, create a link and open it in another browser. The data is plain JSON/media; restrict the project API before using it for private content.

## Current limits

The local reader/writer flows, reader margin notes, JPEG EXIF grouping, voice recording, and plain media queue are implemented. Live Supabase sync/share cannot be exercised until you add your project URL and anon key to `js/config.js`. The optional share PIN and PDF media images remain unfinished. The browser printout lists media captions. Since content is unencrypted, use local mode unless your Supabase access policies are private.
