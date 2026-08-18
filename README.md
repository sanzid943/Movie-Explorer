# 🎬 Movie Explorer

A movie discovery web app built with plain **HTML, CSS, and JavaScript** (no build
tools, no npm install needed) using data from **TMDB (The Movie Database)**.

## Features
- Home page: trending hero banner, popular / top-rated tabs, genre chips
- Movie search with results page
- Movie details page: poster, trailer, rating, release date, overview
- Cast & crew
- Genre-based filtering (genre list + dropdown)
- Sort by rating / release date
- Favorites / Watchlist (saved in your browser via localStorage)
- Movie recommendations on the details page
- Pagination via "Load More"
- Dark / Light mode toggle
- Fully responsive layout

## 1. Get a free TMDB API key
1. Create a free account at https://www.themoviedb.org/signup
2. Go to **Settings → API** and request a free "Developer" API key (v3 auth).
3. Copy the key.

## 2. Add the key to the project
Open `js/config.js` and replace:

```js
API_KEY: "YOUR_TMDB_API_KEY_HERE",
```

with your real key, e.g.:

```js
API_KEY: "a1b2c3d4e5f6...",
```

## 3. Run it in VS Code
No installation or build step is required — it's plain HTML/CSS/JS.

**Recommended:** install the **Live Server** extension in VS Code, then:
1. Open this folder (`movie-explorer`) in VS Code.
2. Right-click `index.html` → **Open with Live Server**.
3. The app opens in your browser at something like `http://127.0.0.1:5500`.

**Alternative (no extension):** run a tiny local server from the terminal:

```bash
# Python 3
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

> ⚠️ Opening `index.html` directly by double-clicking (`file://...`) also mostly
> works for this app since it only makes API calls, but a local server is the
> more reliable option.

## Project structure
```
movie-explorer/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── config.js     # <- put your TMDB API key here
│   ├── api.js        # TMDB API calls
│   ├── render.js      # HTML rendering helpers
│   └── app.js         # routing, state, page logic
└── README.md
```

## Notes
- Routing is a lightweight hash-based router (`#/`, `#/search?q=...`,
  `#/genre/:id`, `#/movie/:id`, `#/watchlist`) — everything runs in
  `index.html`, no server-side routing needed.
- The watchlist is stored per-browser in `localStorage`, so it persists
  between visits but isn't synced across devices.
- This project uses the TMDB API but is not endorsed or certified by TMDB.
