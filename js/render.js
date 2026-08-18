// ============================================================
//  RENDER HELPERS - pure functions that return HTML strings
// ============================================================

function posterUrl(path) {
  return path ? CONFIG.IMG_BASE + path : "https://placehold.co/500x750?text=No+Poster";
}
function backdropUrl(path) {
  return path ? CONFIG.BACKDROP_BASE + path : "https://placehold.co/1280x720?text=Movie+Explorer";
}
function profileUrl(path) {
  return path ? CONFIG.PROFILE_BASE + path : "https://placehold.co/300x450?text=No+Photo";
}
function yearOf(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : "—";
}
function ratingOf(vote) {
  return vote ? vote.toFixed(1) : "N/A";
}

// cache full movie objects by id so favorite/watchlist actions always
// have complete data (title, poster, rating, release date) to store
window.MOVIE_CACHE = window.MOVIE_CACHE || {};

function movieCardHTML(movie, isFav) {
  window.MOVIE_CACHE[movie.id] = movie;
  return `
    <div class="movie-card" data-id="${movie.id}" data-action="open-movie">
      <div class="movie-poster-wrap">
        <img src="${posterUrl(movie.poster_path)}" alt="${escapeHTML(movie.title)}" loading="lazy" />
        <span class="rating-badge">⭐ ${ratingOf(movie.vote_average)}</span>
        <button class="fav-btn ${isFav ? "active" : ""}" data-action="toggle-fav" data-id="${movie.id}" title="Toggle watchlist">
          ${isFav ? "❤️" : "🤍"}
        </button>
      </div>
      <div class="movie-info">
        <div class="movie-title">${escapeHTML(movie.title)}</div>
        <div class="movie-sub">${yearOf(movie.release_date)}</div>
      </div>
    </div>
  `;
}

function movieGridHTML(movies, favIds) {
  if (!movies || movies.length === 0) {
    return `<div class="empty-state"><h3>No movies found</h3><p>Try a different search or filter.</p></div>`;
  }
  return `<div class="movie-grid">${movies
    .map((m) => movieCardHTML(m, favIds.has(m.id)))
    .join("")}</div>`;
}

function heroHTML(movie) {
  window.MOVIE_CACHE[movie.id] = movie;
  return `
    <div class="hero" style="background-image:url('${backdropUrl(movie.backdrop_path)}')" data-id="${movie.id}" data-action="open-movie">
      <div class="hero-content">
        <span class="hero-badge">🔥 Trending</span>
        <h1>${escapeHTML(movie.title)}</h1>
        <div class="hero-meta">
          <span>⭐ ${ratingOf(movie.vote_average)}</span>
          <span>${yearOf(movie.release_date)}</span>
        </div>
        <p>${escapeHTML(movie.overview || "")}</p>
        <button class="btn" data-action="open-movie" data-id="${movie.id}">View Details</button>
      </div>
    </div>
  `;
}

function genreChipsHTML(genres, activeId) {
  const all = `<span class="chip ${!activeId ? "active" : ""}" data-action="filter-genre" data-id="">All</span>`;
  const chips = genres
    .map(
      (g) =>
        `<span class="chip ${String(activeId) === String(g.id) ? "active" : ""}" data-action="filter-genre" data-id="${g.id}">${escapeHTML(g.name)}</span>`
    )
    .join("");
  return `<div class="genre-chips">${all}${chips}</div>`;
}

function sortSelectHTML(current) {
  const options = [
    { value: "popularity.desc", label: "Most Popular" },
    { value: "vote_average.desc", label: "Highest Rated" },
    { value: "release_date.desc", label: "Newest First" },
    { value: "release_date.asc", label: "Oldest First" },
  ];
  return `
    <select id="sort-select" class="sort-select">
      ${options
        .map(
          (o) =>
            `<option value="${o.value}" ${o.value === current ? "selected" : ""}>${o.label}</option>`
        )
        .join("")}
    </select>
  `;
}

function castScrollHTML(cast) {
  if (!cast || cast.length === 0) return `<p class="no-trailer">No cast information available.</p>`;
  return `<div class="cast-scroll">${cast
    .slice(0, 14)
    .map(
      (c) => `
      <div class="cast-card">
        <div class="cast-photo"><img src="${profileUrl(c.profile_path)}" alt="${escapeHTML(c.name)}" loading="lazy"/></div>
        <div class="cast-name">${escapeHTML(c.name)}</div>
        <div class="cast-role">${escapeHTML(c.character || "")}</div>
      </div>`
    )
    .join("")}</div>`;
}

function crewHTML(crew) {
  const key = crew.filter((c) => ["Director", "Writer", "Screenplay", "Producer"].includes(c.job)).slice(0, 6);
  if (key.length === 0) return "";
  return `<div class="cast-scroll">${key
    .map(
      (c) => `
      <div class="cast-card">
        <div class="cast-photo"><img src="${profileUrl(c.profile_path)}" alt="${escapeHTML(c.name)}" loading="lazy"/></div>
        <div class="cast-name">${escapeHTML(c.name)}</div>
        <div class="cast-role">${escapeHTML(c.job)}</div>
      </div>`
    )
    .join("")}</div>`;
}

function trailerHTML(videos) {
  const trailer =
    videos.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
    videos.find((v) => v.site === "YouTube");
  if (!trailer) return `<p class="no-trailer">No trailer available for this movie.</p>`;
  return `
    <div class="trailer-wrap">
      <iframe src="${CONFIG.YT_EMBED_BASE}${trailer.key}" title="Trailer" allowfullscreen></iframe>
    </div>
  `;
}

function escapeHTML(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function loaderHTML() {
  return `<div class="loader">Loading…</div>`;
}

function apiKeyMissingHTML() {
  return `
    <div class="empty-state">
      <h3>🔑 TMDB API key required</h3>
      <p>Open <code>js/config.js</code> and paste your free TMDB API key into the <code>API_KEY</code> field.</p>
      <p>Get one at <a href="https://www.themoviedb.org/settings/api" target="_blank" rel="noopener">themoviedb.org/settings/api</a>, then refresh this page.</p>
    </div>
  `;
}

function errorHTML(message) {
  return `<div class="error-box"><h3>Something went wrong</h3><p>${escapeHTML(message)}</p></div>`;
}
