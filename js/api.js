//  API LAYER - all calls to TMDB go through here

async function tmdbFetch(endpoint, params = {}) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY === "YOUR_TMDB_API_KEY_HERE") {
    throw new Error("MISSING_API_KEY");
  }
  const url = new URL(CONFIG.BASE_URL + endpoint);
  url.searchParams.set("api_key", CONFIG.API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB request failed (${res.status})`);
  }
  return res.json();
}

const api = {
  getTrending: (page = 1) => tmdbFetch("/trending/movie/week", { page }),
  getPopular: (page = 1) => tmdbFetch("/movie/popular", { page }),
  getTopRated: (page = 1) => tmdbFetch("/movie/top_rated", { page }),
  getNowPlaying: (page = 1) => tmdbFetch("/movie/now_playing", { page }),

  getGenres: () => tmdbFetch("/genre/movie/list"),

  discoverByGenre: (genreId, sortBy = "popularity.desc", page = 1) =>
    tmdbFetch("/discover/movie", {
      with_genres: genreId || undefined,
      sort_by: sortBy,
      page,
      "vote_count.gte": sortBy.startsWith("vote_average") ? 100 : undefined,
    }),

  searchMovies: (query, page = 1) => tmdbFetch("/search/movie", { query, page }),

  getMovieDetails: (id) => tmdbFetch(`/movie/${id}`),
  getCredits: (id) => tmdbFetch(`/movie/${id}/credits`),
  getVideos: (id) => tmdbFetch(`/movie/${id}/videos`),
  getRecommendations: (id) => tmdbFetch(`/movie/${id}/recommendations`),
};