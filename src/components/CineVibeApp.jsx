import React, { useEffect, useMemo, useState } from "react";
import teluguMovies from "../data/TeluguMovies.json";
import rrrPoster from "../photo/RRR_Poster.jpg";
import pushpaPoster from "../photo/pushpa.jpg";
import baahubaliPoster from "../photo/Baahubali_pic.jpg";
import alaVaikunthaPoster from "../photo/alavaikunta_pic.jpg";
import salaarPoster from "../photo/salaar.avif";
import sitaRamamPoster from "../photo/sitaramam.webp";
import arjunPoster from "../photo/arjunreddy_movieposter.jpg";
import jerseyPoster from "../photo/jersey.jpg";

const GENRES = [
  "All",
  "Action",
  "Drama",
  "Romance",
  "Family",
  "Comedy",
  "Thriller",
  "Mass",
  "Epic",
];

const STORAGE_KEY = "cinevibe_favorites";

const POSTER_MAP = {
  RRR_Poster: rrrPoster,
  "RRR_Poster.jpg": rrrPoster,
  pushpa: pushpaPoster,
  "pushpa.jpg": pushpaPoster,
  Baahubali_pic: baahubaliPoster,
  "Baahubali_pic.jpg": baahubaliPoster,
  alavaikunta_pic: alaVaikunthaPoster,
  "alavaikunta_pic.jpg": alaVaikunthaPoster,
  salaar: salaarPoster,
  "salaar.avif": salaarPoster,
  sitaramam: sitaRamamPoster,
  "sitaramam.webp": sitaRamamPoster,
  arjunreddy_movieposter: arjunPoster,
  "arjunreddy_movieposter.jpg": arjunPoster,
  jersey: jerseyPoster,
  "jersey.jpg": jerseyPoster,
  
};

function resolvePoster(poster) {
  if (!poster) return "";
  if (poster.startsWith("http")) return poster;
  const fileName = poster.replace(/^.*[\\/]/, "");
  const baseName = fileName.replace(/\.[^.]+$/, "");
  return POSTER_MAP[fileName] || POSTER_MAP[baseName] || poster;
}

function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
}

function getGreetingInfo(date) {
  const hour = date.getHours();
  const day = date.getDay();
  const weekend = day === 0 || day === 6;

  if (hour >= 5 && hour < 12) {
    return {
      greeting: "Good Morning",
      slot: weekend ? "Morning • Weekend" : "Morning • Weekday",
      mood: "Start with something light & warm",
      key: "morning",
      emoji: "☀️",
    };
  } else if (hour >= 12 && hour < 17) {
    return {
      greeting: "Good Afternoon",
      slot: weekend ? "Afternoon • Weekend" : "Afternoon • Weekday",
      mood: "Perfect time for feel-good movies",
      key: "afternoon",
      emoji: "🌤️",
    };
  } else if (hour >= 17 && hour < 22) {
    return {
      greeting: "Good Evening",
      slot: weekend ? "Evening • Weekend" : "Evening • Weekday",
      mood: "Unwind with Telugu blockbusters",
      key: "evening",
      emoji: "🌇",
    };
  } else {
    return {
      greeting: "Good Night",
      slot: weekend ? "Night • Weekend" : "Night • Weekday",
      mood: "Relax with calm or emotional stories",
      key: "night",
      emoji: "🌙",
    };
  }
}

function extractYouTubeId(url) {
  if (!url) return null;
  const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  return null;
}

function toEmbedUrl(url) {
  const id = extractYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
}

function recommendSimilar(movie, pool = [], limit = 4) {
  return pool
    .filter((m) => m.id !== movie.id)
    .map((m) => {
      const overlap = (m.tags || []).filter((t) => (movie.tags || []).includes(t)).length;
      const score = overlap * 10 + (m.score || 0) * 0.2;
      return { movie: m, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.movie);
}

function ringBackground(score) {
  const pct = Math.max(0, Math.min(100, Number(score || 0)));
  const degrees = (pct / 100) * 360;
  return `conic-gradient(#ff7e95 ${degrees}deg, rgba(21,24,38,0.9) ${degrees}deg)`;
}

export default function CineVibeApp() {
  const [now, setNow] = useState(new Date());
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [ottFilter, setOttFilter] = useState("All");
  const [showTrailer, setShowTrailer] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [heroHover, setHeroHover] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") {
        setSelectedMovie(null);
        setShowTrailer(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleFavorite = (id) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const { greeting, slot, mood, key, emoji } = getGreetingInfo(now);
  const timeStr = formatTime(now);

  const movies = useMemo(
    () => teluguMovies.map((movie) => ({ ...movie, isFavorite: favorites.includes(movie.id) })),
    [favorites]
  );

  const moviesWithPosters = useMemo(
    () => movies.map((movie) => ({ ...movie, poster: resolvePoster(movie.poster) })),
    [movies]
  );

  let rightNowMovies = [...moviesWithPosters];
  if (key === "evening" || key === "night") {
    rightNowMovies.sort((a, b) => b.score - a.score);
  } else if (key === "morning") {
    rightNowMovies.sort((a, b) => (b.tags.includes("Drama") ? 1 : 0) - (a.tags.includes("Drama") ? 1 : 0));
  } else if (key === "afternoon") {
    rightNowMovies.sort((a, b) => (b.tags.includes("Family") ? 1 : 0) - (a.tags.includes("Family") ? 1 : 0));
  }
  rightNowMovies = rightNowMovies.slice(0, 6);

  const browseAll = moviesWithPosters;

  const OTT_OPTIONS = useMemo(() => {
    const set = new Set();
    teluguMovies.forEach((movie) => (movie.ott || []).forEach((platform) => set.add(platform)));
    return ["All", ...Array.from(set)];
  }, []);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchesFilters = (movie) => {
    const genreOk = selectedGenre === "All" || (movie.tags || []).includes(selectedGenre);
    const searchOk =
      normalizedQuery === "" ||
      (movie.title || "").toLowerCase().includes(normalizedQuery) ||
      (movie.cast || []).some((castMember) => castMember.toLowerCase().includes(normalizedQuery));
    const ottOk = ottFilter === "All" || (movie.ott || []).includes(ottFilter);
    return genreOk && searchOk && ottOk;
  };

  const rightNowFiltered = rightNowMovies.filter(matchesFilters);
  const browseFiltered = browseAll.filter(matchesFilters);

  const heroList = rightNowFiltered.length ? rightNowFiltered : rightNowMovies.length ? rightNowMovies : moviesWithPosters;

  useEffect(() => {
    if (heroIndex >= heroList.length) setHeroIndex(0);
    if (heroList.length === 0) setHeroIndex(0);
  }, [heroIndex, heroList.length]);

  const hero = heroList.length ? heroList[heroIndex % heroList.length] : moviesWithPosters[0] || null;

  useEffect(() => {
    if (!autoplay) return;
    if (heroHover) return;
    if (selectedMovie) return;

    const id = setInterval(() => {
      setHeroIndex((prev) => {
        const len = heroList.length || 1;
        return (prev + 1) % len;
      });
    }, 3000);

    return () => clearInterval(id);
  }, [autoplay, heroHover, selectedMovie, heroList.length]);

  const similar = useMemo(() => {
    if (!selectedMovie) return [];
    return recommendSimilar(selectedMovie, moviesWithPosters, 4);
  }, [selectedMovie, moviesWithPosters]);

  const openMovie = (movie) => {
    setSelectedMovie(movie);
    setShowTrailer(false);
    setTimeout(() => {
      const modal = document.querySelector(".st-modal");
      if (modal) modal.scrollTop = 0;
    }, 120);
  };

  return (
    <div className="st-root">
      <header className="st-header">
        <div className="st-logo">
          <div className="st-logo-icon">🧳</div>
          <div className="st-logo-text">
            <span className="st-logo-main">
              Cine<span>Vibe</span>
            </span>
            <span className="st-logo-sub">{greeting}</span>
          </div>
        </div>

        <div className="st-time-pill">
          <div className="st-time-clock">{timeStr}</div>
          <div className="st-time-sub">{slot}</div>
        </div>

        <div className="st-header-actions">
          <button className="st-icon-btn">🔍</button>
          <button className="st-icon-btn">👤</button>
        </div>
      </header>

      <main className="st-main">
        <section
          className="st-hero st-hero-advanced"
          onMouseEnter={() => setHeroHover(true)}
          onMouseLeave={() => setHeroHover(false)}
        >
          <div
            className="st-hero-poster"
            style={{
              backgroundImage: `url(${hero?.poster})`,
              alignSelf: "start",
            }}
          />

          <div className="st-hero-content">
            <div className="st-hero-tags">
              <span className="st-tag st-tag-primary">Right Now For You</span>
              <span className="st-tag">Telugu • {slot}</span>
            </div>

            <h1 className="st-hero-title">{hero?.title}</h1>

            <div className="st-hero-meta">
              <span>⭐ {hero?.rating}</span>
              <span>• {hero?.year}</span>
              <span>• {hero?.duration}</span>
            </div>

            <div className="st-hero-chips">
              {(hero?.tags || []).map((t) => (
                <span className="st-chip" key={t}>
                  {t}
                </span>
              ))}
            </div>

            <p className="st-hero-desc">{hero?.synopsis}</p>

            <div className="st-hero-extra">
              <div className="st-hero-cast">
                <strong>Cast:</strong> {(hero?.cast || []).join(", ")}
              </div>
              <div className="st-hero-director">
                <strong>Director:</strong> {hero?.director}
              </div>
              <div className="st-hero-ott">
                <strong>OTT:</strong>{" "}
                {(hero?.ott || []).map((o) => (
                  <span key={o} className="st-ott-badge">
                    {o}
                  </span>
                ))}
              </div>
              <div className="st-hero-why">
                • <em>Why this now:</em> {mood}.
              </div>
            </div>

            <div className="st-hero-buttons">
              <button className="st-btn st-btn-primary">▶ Watch Now</button>

              <button className="st-btn st-btn-outline" onClick={() => openMovie(hero)}>
                More Info
              </button>

              <button
                className="st-btn st-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setAutoplay((s) => !s);
                }}
                title={autoplay ? "Pause autoplay" : "Play autoplay"}
                style={{ marginLeft: 10 }}
              >
                {autoplay ? "⏸ Pause" : "▶ Autoplay"}
              </button>
            </div>
          </div>

          <div className="st-hero-score" style={{ alignSelf: "center", justifySelf: "center" }}>
            <div
              className="st-score-ring"
              style={{
                width: 140,
                height: 140,
                borderRadius: 999,
                display: "grid",
                placeItems: "center",
                background: ringBackground(hero?.score),
                border: "6px solid rgba(12,12,22,0.6)",
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 999,
                  background: "#050713",
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontWeight: 700,
                  fontSize: 22,
                }}
              >
                {hero?.score ?? "-"}
              </div>
            </div>
            <span className="st-score-caption">CineVibe Score</span>
          </div>
        </section>

        <section className="st-mood-card">
          <div className="st-mood-left">
            <span className="st-mood-title">
              {greeting}! <span style={{ marginLeft: 8 }}>{emoji}</span>
            </span>
            <span className="st-mood-sub">{mood}</span>
          </div>

          <div className="st-mood-right">
            <span className="st-mood-badge">Time-aware mode</span>
            <div className="st-mood-tags">
              <span className="st-chip small">Trending</span>
              <span className="st-chip small">Telugu</span>
              <span className="st-chip small">Smart Picks</span>
            </div>
          </div>
        </section>

        <section className="st-section">
          <div className="st-section-header st-personal-header">
            <h2>Personalize Your Feed</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <select
                value={ottFilter}
                onChange={(e) => setOttFilter(e.target.value)}
                className="st-search-input"
                style={{ minWidth: 140 }}
              >
                {OTT_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>

              <input
                className="st-search-input"
                type="text"
                placeholder="Search movies or cast..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="st-genre-row">
            {GENRES.map((g) => (
              <button
                key={g}
                className={`st-genre-pill ${selectedGenre === g ? "active" : ""}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </section>

        <section className="st-section">
          <div className="st-section-header">
            <h2>Right Now For You</h2>
            <span className="st-section-sub">
              Based on time, OTT, genre & search • {rightNowFiltered.length} movies
            </span>
          </div>

          <div className="st-movie-row">
            {rightNowFiltered.map((m) => (
              <article key={m.id} className="st-movie-card" onClick={() => openMovie(m)}>
                <div className="st-movie-poster" style={{ backgroundImage: `url(${m.poster})` }} />
                <button
                  className={`st-fav-btn ${m.isFavorite ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(m.id);
                  }}
                >
                  {m.isFavorite ? "❤" : "♡"}
                </button>
                <span className="st-movie-score">{m.score}%</span>
                <div className="st-movie-body">
                  <h3 className="st-movie-title">{m.title}</h3>
                  <div className="st-movie-meta">
                    <span>⭐ {m.rating}</span>
                    <span>• {m.year}</span>
                    <span>• {m.duration}</span>
                  </div>
                  <div className="st-movie-tags">
                    {(m.tags || []).map((t) => (
                      <span key={t} className="st-chip tiny">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
            {rightNowFiltered.length === 0 && (
              <p style={{ color: "#a7adc6", fontSize: 13 }}>No movies match your current filters.</p>
            )}
          </div>
        </section>

        <section className="st-section">
          <h2>
            Trending Telugu Blockbusters <span className="st-live-pill">LIVE</span>
          </h2>
          <div className="st-trending-row">
            {movies.slice(0, 6).map((m, i) => (
              <div
                key={m.id}
                className="st-trending-item"
                onClick={() => openMovie(m)}
                style={{ cursor: "pointer" }}
              >
                <div className="st-trending-rank">{i + 1}</div>
                <span className="st-trending-title">{m.title}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="st-section">
          <h2>Browse All Telugu Movies</h2>
          <span className="st-section-sub">Fully offline dataset • {browseFiltered.length} movies</span>

          <div className="st-browse-grid">
            {browseFiltered.map((m) => (
              <article key={m.id} className="st-browse-card" onClick={() => openMovie(m)}>
                <div className="st-movie-poster" style={{ backgroundImage: `url(${m.poster})` }} />
                <button
                  className={`st-fav-btn st-fav-btn-small ${m.isFavorite ? "active" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(m.id);
                  }}
                >
                  {m.isFavorite ? "❤" : "♡"}
                </button>
                <div className="st-movie-body">
                  <h3 className="st-movie-title small">{m.title}</h3>
                  <div className="st-movie-meta">
                    <span>⭐ {m.rating}</span>
                    <span>• {m.year}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="st-footer">
        <div className="st-footer-left">
          <span className="st-logo-main">Cine<span>Vibe</span></span>
          <span className="st-footer-sub">Time-Aware Telugu Movie Recommendations</span>
        </div>
        <div className="st-footer-right">
          <span>{browseAll.length} Movies</span>
          <span>• Powered by CineVibe</span>
        </div>
      </footer>

      {selectedMovie && (
        <div
          className="st-modal-backdrop"
          onClick={() => {
            setSelectedMovie(null);
            setShowTrailer(false);
          }}
        >
          <div className="st-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="st-modal-close"
              onClick={() => {
                setSelectedMovie(null);
                setShowTrailer(false);
              }}
              aria-label="Close movie modal"
            >
              ✕
            </button>

            <div className="st-modal-header-advanced">
              <div
                className="st-modal-poster"
                style={{
                  backgroundImage: `url(${selectedMovie.poster})`,
                }}
              />

              <div className="st-modal-title-block">
                <h2>{selectedMovie.title}</h2>

                <div className="st-modal-meta">
                  <span>⭐ {selectedMovie.rating}</span>
                  <span>• {selectedMovie.year}</span>
                  <span>• {selectedMovie.duration}</span>
                </div>

                <div className="st-modal-tags">
                  {(selectedMovie.tags || []).map((t) => (
                    <span key={t} className="st-chip tiny">
                      {t}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: 8, color: "var(--st-muted)", fontSize: 13 }}>
                  <strong>Cast:</strong> {(selectedMovie.cast || []).join(", ")}
                  <br />
                  <strong>Director:</strong> {selectedMovie.director}
                  <br />
                  <strong>OTT:</strong>{" "}
                  {(selectedMovie.ott || []).map((o) => (
                    <span key={o} className="st-ott-badge">
                      {o}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="st-modal-text">{selectedMovie.synopsis}</p>

            <div className="st-modal-actions" style={{ justifyContent: "flex-start", gap: 12 }}>
              <button className="st-btn st-btn-primary">▶ Watch Now</button>

              <button
                className="st-btn st-btn-outline"
                onClick={() => {
                  toggleFavorite(selectedMovie.id);
                }}
              >
                {selectedMovie.isFavorite ? "Remove Favourite" : "Add Favourite"}
              </button>

              {selectedMovie.trailer && (
                <button className="st-btn st-btn-outline" onClick={() => setShowTrailer((s) => !s)}>
                  {showTrailer ? "Hide Trailer" : "Watch Trailer"}
                </button>
              )}
            </div>

            {showTrailer && selectedMovie.trailer && (
              <div style={{ marginTop: 12 }}>
                <div className="st-trailer-wrapper">
                  {(() => {
                    const embed = toEmbedUrl(selectedMovie.trailer);
                    if (!embed) {
                      return (
                        <div style={{ padding: 24, color: "var(--st-muted)", textAlign: "center" }}>
                          Trailer unavailable - invalid link.
                        </div>
                      );
                    }
                    return (
                      <iframe
                        title="trailer"
                        src={embed}
                        frameBorder="0"
                        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: "100%", height: 360, borderRadius: 10 }}
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {similar.length > 0 && (
              <>
                <h3 style={{ marginTop: 16, marginBottom: 8 }}>Similar Movies</h3>
                <div style={{ display: "flex", gap: 12 }}>
                  {similar.map((s) => (
                    <div
                      key={s.id}
                      className="st-browse-card"
                      style={{ width: 120, cursor: "pointer" }}
                      onClick={() => openMovie(s)}
                    >
                      <div
                        className="st-movie-poster"
                        style={{
                          height: 140,
                          borderRadius: 10,
                          backgroundImage: `url(${s.poster})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      />
                      <div style={{ padding: 8 }}>
                        <div style={{ fontSize: 13, color: "var(--st-text)" }}>{s.title}</div>
                        <div style={{ fontSize: 12, color: "var(--st-muted)" }}>⭐ {s.rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
