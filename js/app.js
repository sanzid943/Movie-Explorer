//  APP - routing, state, page controllers

const appEl = document.getElementById("app");
const genreSelectEl = document.getElementById("genre-select");
const themeToggleEl = document.getElementById("theme-toggle");
const searchFormEl = document.getElementById("search-form");
const searchInputEl = document.getElementById("search-input");

let GENRES = [];
let GENRE_MAP = {};


// Watchlist (localStorage)

const WATCHLIST_KEY = "movieExplorer.watchlist";

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(WATCHLIST_KEY)) || [];
  } catch {
    return [];
  }
}
function saveWatchlist(list) {
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
}
function isInWatchlist(id) {
  return getWatchlist().some((m) => m.id === id);
}
function toggleWatchlist(movie) {
  const list = getWatchlist();
  const idx = list.findIndex((m) => m.id === movie.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push({
      id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
    });
  }
  saveWatchlist(list);
}
function favIdSet() {
  return new Set(getWatchlist().map((m) => m.id));
}


// Theme

function initTheme() {
  const saved = localStorage.getItem("movieExplorer.theme") || "dark";
  document.body.classList.toggle("dark", saved === "dark");
  themeToggleEl.textContent = saved === "dark" ? "☀️" : "🌙";
}
themeToggleEl.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  localStorage.setItem("movieExplorer.theme", isDark ? "dark" : "light");
  themeToggleEl.textContent = isDark ? "☀️" : "🌙";
});


// Search form

searchFormEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = searchInputEl.value.trim();
  if (q) location.hash = `#/search?q=${encodeURIComponent(q)}`;
});


// Genre dropdown (nav)

genreSelectEl.addEventListener("change", () => {
  const id = genreSelectEl.value;
  if (id) location.hash = `#/genre/${id}`;
});

async function loadGenresOnce() {
  if (GENRES.length) return GENRES;
  try {
    const data = await api.getGenres();
    GENRES = data.genres || [];
    GENRE_MAP = Object.fromEntries(GENRES.map((g) => [g.id, g.name]));
    genreSelectEl.innerHTML =
      `<option value="">Genres</option>` +
      GENRES.map((g) => `<option value="${g.id}">${g.name}</option>`).join("");
  } catch (e) {
    
  }
  return GENRES;
}

// Router
function parseHash() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const [pathPart, queryPart] = hash.split("?");
  const params = new URLSearchParams(queryPart || "");
  const segments = pathPart.split("/").filter(Boolean);
  return { segments, params };
}

async function router() {
  window.scrollTo(0, 0);
  appEl.innerHTML = loaderHTML();

  if (!CONFIG.API_KEY || CONFIG.API_KEY === "YOUR_TMDB_API_KEY_HERE") {
    appEl.innerHTML = apiKeyMissingHTML();
    return;
  }

  await loadGenresOnce();

  const { segments, params } = parseHash();

  try {
    if (segments.length === 0) {
      await renderHome();
    } else if (segments[0] === "search") {
      await renderSearch(params.get("q") || "");
    } else if (segments[0] === "genre" && segments[1]) {
      await renderGenre(segments[1]);
    } else if (segments[0] === "movie" && segments[1]) {
      await renderDetails(segments[1]);
    } else if (segments[0] === "watchlist") {
      renderWatchlist();
    } else {
      appEl.innerHTML = errorHTML("Page not found.");
    }
  } catch (err) {
    console.error(err);
    appEl.innerHTML = errorHTML(err.message || "Unable to load data.");
  }
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
  initTheme();
  router();
});


// Event delegation (cards, favorites, chips, tabs)

appEl.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "open-movie") {
    location.hash = `#/movie/${target.dataset.id}`;
  }

  if (action === "toggle-fav") {
    e.stopPropagation();
    const id = Number(target.dataset.id);
    
    let movie = target._movieData || window.MOVIE_CACHE[id];
    if (!movie) {
      
      const card = target.closest(".movie-card") || target.closest(".details-flex");
      const title = card?.querySelector(".movie-title")?.textContent || document.title;
      const img = card?.querySelector("img")?.getAttribute("src") || "";
      movie = { id, title, poster_path: img.includes("image.tmdb.org") ? img.split("/w500")[1] : null, vote_average: null, release_date: null };
    }
    toggleWatchlist(movie);
    const nowFav = isInWatchlist(id);

    if (target.id === "fav-toggle-btn") {
      target.innerHTML = nowFav ? "❤️ In Watchlist" : "🤍 Add to Watchlist";
      target.classList.toggle("secondary", !nowFav);
    } else {
      target.classList.toggle("active", nowFav);
      target.textContent = nowFav ? "❤️" : "🤍";
    }
  }

  if (action === "filter-genre") {
    const id = target.dataset.id;
    location.hash = id ? `#/genre/${id}` : "#/";
  }

  if (action === "home-tab") {
    renderHomeList(target.dataset.tab);
  }
});


//  HOME PAGE

let homeState = { tab: "trending" };

async function renderHome() {
  const [trendingData, genresList] = await Promise.all([
    api.getTrending(1),
    Promise.resolve(GENRES),
  ]);

  const heroMovie = trendingData.results[0];

  appEl.innerHTML = `
    ${heroMovie ? heroHTML(heroMovie) : ""}
    <div class="section-header">
      <h2>Browse by Genre</h2>
    </div>
    ${genreChipsHTML(genresList, null)}

    <div class="section-header">
      <div class="tabs" id="home-tabs">
        <button class="tab-btn active" data-action="home-tab" data-tab="trending">🔥 Trending</button>
        <button class="tab-btn" data-action="home-tab" data-tab="popular">⭐ Popular</button>
        <button class="tab-btn" data-action="home-tab" data-tab="top_rated">🏆 Top Rated</button>
      </div>
    </div>
    <div id="home-list">${movieGridHTML(trendingData.results.slice(1), favIdSet())}</div>
  `;

  document.getElementById("home-tabs").addEventListener("click", (e) => {
    const btn = e.target.closest(".tab-btn");
    if (!btn) return;
    document.querySelectorAll("#home-tabs .tab-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
}

async function renderHomeList(tab) {
  const listEl = document.getElementById("home-list");
  listEl.innerHTML = loaderHTML();
  const fetcher = tab === "popular" ? api.getPopular : tab === "top_rated" ? api.getTopRated : api.getTrending;
  const data = await fetcher(1);
  listEl.innerHTML = movieGridHTML(data.results, favIdSet());
}


//  SEARCH PAGE

async function renderSearch(query) {
  searchInputEl.value = query;
  if (!query) {
    appEl.innerHTML = `<div class="empty-state"><h3>Search for a movie</h3><p>Use the search bar above to find movies.</p></div>`;
    return;
  }

  let page = 1;
  let allResults = [];
  const first = await api.searchMovies(query, page);
  allResults = first.results;

  renderResultsPage({
    title: `Search results for "${query}"`,
    totalResults: first.total_results,
    results: allResults,
    hasMore: page < first.total_pages,
    loadMore: async () => {
      page += 1;
      const next = await api.searchMovies(query, page);
      return { results: next.results, hasMore: page < next.total_pages };
    },
    allowSort: true,
  });
}


//  GENRE PAGE

async function renderGenre(genreId) {
  let page = 1;
  let sortBy = "popularity.desc";
  const genreName = GENRE_MAP[genreId] || "Movies";

  const first = await api.discoverByGenre(genreId, sortBy, page);

  renderResultsPage({
    title: `${genreName} Movies`,
    totalResults: first.total_results,
    results: first.results,
    hasMore: page < first.total_pages,
    showGenreChips: true,
    activeGenre: genreId,
    sortBy,
    onSortChange: async (newSort) => {
      sortBy = newSort;
      page = 1;
      const data = await api.discoverByGenre(genreId, sortBy, page);
      return { results: data.results, hasMore: page < data.total_pages };
    },
    loadMore: async () => {
      page += 1;
      const next = await api.discoverByGenre(genreId, sortBy, page);
      return { results: next.results, hasMore: page < next.total_pages };
    },
    allowSort: true,
  });
}

// shared results-page renderer (search + genre)
function renderResultsPage(opts) {
  const {
    title,
    totalResults,
    results,
    hasMore,
    loadMore,
    onSortChange,
    allowSort,
    showGenreChips,
    activeGenre,
    sortBy,
  } = opts;

  let currentResults = [...results];
  let currentHasMore = hasMore;

  appEl.innerHTML = `
    ${showGenreChips ? genreChipsHTML(GENRES, activeGenre) : ""}
    <div class="results-toolbar">
      <div>
        <h2>${escapeHTML(title)}</h2>
        <div class="results-count">${totalResults?.toLocaleString() || currentResults.length} results</div>
      </div>
      ${allowSort ? sortSelectHTML(sortBy || "popularity.desc") : ""}
    </div>
    <div id="results-grid">${movieGridHTML(currentResults, favIdSet())}</div>
    <div class="load-more-wrap" id="load-more-wrap">
      ${currentHasMore ? `<button class="btn" id="load-more-btn">Load More</button>` : ""}
    </div>
  `;

  const gridEl = document.getElementById("results-grid");
  const loadMoreWrap = document.getElementById("load-more-wrap");

  function bindLoadMore() {
    const btn = document.getElementById("load-more-btn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      btn.textContent = "Loading…";
      btn.disabled = true;
      const { results: more, hasMore: newHasMore } = await loadMore();
      currentResults = [...currentResults, ...more];
      gridEl.innerHTML = movieGridHTML(currentResults, favIdSet());
      loadMoreWrap.innerHTML = newHasMore ? `<button class="btn" id="load-more-btn">Load More</button>` : "";
      bindLoadMore();
    });
  }
  bindLoadMore();

  if (allowSort) {
    const sortEl = document.getElementById("sort-select");
    sortEl.addEventListener("change", async () => {
      gridEl.innerHTML = loaderHTML();
      if (onSortChange) {
        const { results: newResults, hasMore: newHasMore } = await onSortChange(sortEl.value);
        currentResults = newResults;
        currentHasMore = newHasMore;
        gridEl.innerHTML = movieGridHTML(currentResults, favIdSet());
        loadMoreWrap.innerHTML = currentHasMore ? `<button class="btn" id="load-more-btn">Load More</button>` : "";
        bindLoadMore();
      } else {
        // client-side sort (used for search results, since TMDB search has no sort_by)
        const val = sortEl.value;
        currentResults.sort((a, b) => {
          if (val === "vote_average.desc") return b.vote_average - a.vote_average;
          if (val === "release_date.desc") return (b.release_date || "").localeCompare(a.release_date || "");
          if (val === "release_date.asc") return (a.release_date || "").localeCompare(b.release_date || "");
          return b.popularity - a.popularity;
        });
        gridEl.innerHTML = movieGridHTML(currentResults, favIdSet());
      }
    });
  }
}


//  MOVIE DETAILS PAGE

async function renderDetails(id) {
  const movieId = Number(id);
  const [details, credits, videos, recs] = await Promise.all([
    api.getMovieDetails(movieId),
    api.getCredits(movieId),
    api.getVideos(movieId),
    api.getRecommendations(movieId),
  ]);

  const isFav = isInWatchlist(movieId);
  const director = credits.crew.find((c) => c.job === "Director");

  appEl.innerHTML = `
    <div class="details-backdrop" style="background-image:url('${backdropUrl(details.backdrop_path)}')">
      <div class="details-flex">
        <div class="details-poster"><img src="${posterUrl(details.poster_path)}" alt="${escapeHTML(details.title)}" /></div>
        <div class="details-main">
          <h1>${escapeHTML(details.title)}</h1>
          ${details.tagline ? `<div class="details-tagline">"${escapeHTML(details.tagline)}"</div>` : ""}
          <div class="details-meta">
            <span>⭐ ${ratingOf(details.vote_average)} / 10</span>
            <span>📅 ${details.release_date || "—"}</span>
            <span>⏱ ${details.runtime ? details.runtime + " min" : "—"}</span>
            ${director ? `<span>🎬 ${escapeHTML(director.name)}</span>` : ""}
          </div>
          <div class="details-genres">${details.genres.map((g) => `<span>${escapeHTML(g.name)}</span>`).join("")}</div>
          <p class="details-overview">${escapeHTML(details.overview || "No overview available.")}</p>
          <div class="details-actions">
            <button class="btn ${isFav ? "secondary" : ""}" id="fav-toggle-btn" data-action="toggle-fav" data-id="${movieId}">
              ${isFav ? "❤️ In Watchlist" : "🤍 Add to Watchlist"}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="content-section">
      <h2>Trailer</h2>
      ${trailerHTML(videos.results || [])}
    </div>

    <div class="content-section">
      <h2>Cast</h2>
      ${castScrollHTML(credits.cast)}
    </div>

    <div class="content-section">
      <h2>Crew</h2>
      ${crewHTML(credits.crew)}
    </div>

    <div class="content-section">
      <h2>Recommended</h2>
      ${movieGridHTML((recs.results || []).slice(0, 12), favIdSet())}
    </div>
  `;

  // attach full movie data to the details fav button so toggleWatchlist saves complete info
  const favBtn = document.getElementById("fav-toggle-btn");
  favBtn._movieData = details;
}


//  WATCHLIST PAGE

function renderWatchlist() {
  const list = getWatchlist();
  appEl.innerHTML = `
    <div class="section-header"><h2>❤️ My Watchlist</h2></div>
    ${
      list.length === 0
        ? `<div class="empty-state"><h3>Your watchlist is empty</h3><p>Tap the heart icon on any movie to save it here.</p></div>`
        : movieGridHTML(list, favIdSet())
    }
  `;
}
