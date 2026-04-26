import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Bookshelf() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCoverUrl = (cover) => {
    if (!cover) {
      return "https://placehold.co/400x600/18181b/a1a1aa?text=No+Cover";
    }

    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("/uploads/")) return `${BACKEND_URL}${cover}`;
    if (cover.startsWith("uploads/")) return `${BACKEND_URL}/${cover}`;

    return `${BACKEND_URL}/uploads/${cover}`;
  };

  const getBookshelf = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/bookshelf/me");
      setBooks(res.data.books || []);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to load bookshelf.";

      setError(message);

      if (error.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/library");
  };

  const genres = useMemo(() => {
    const uniqueGenres = books
      .map((item) => item.book?.genre)
      .filter(Boolean)
      .map((genre) => genre.toLowerCase());

    return ["all", ...new Set(uniqueGenres)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((item) => {
      const title = item.book?.title || item.sid || "";
      const genre = item.book?.genre || "";

      const matchesSearch = title.toLowerCase().includes(search.toLowerCase());

      const matchesGenre =
        activeGenre === "all" || genre.toLowerCase() === activeGenre;

      return matchesSearch && matchesGenre;
    });
  }, [books, search, activeGenre]);

  useEffect(() => {
    getBookshelf();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500"></div>
            <p className="text-sm font-medium text-zinc-300 sm:text-base">
              Loading your bookshelf...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                My Library
              </span>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                Bookshelf
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                You have{" "}
                <strong className="font-semibold text-white">
                  {books.length}
                </strong>{" "}
                saved {books.length === 1 ? "book" : "books"}.
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 md:w-auto"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="text"
              placeholder="Search novels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10 lg:max-w-md"
            />

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition sm:text-sm ${
                    activeGenre === genre
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                      : "border border-white/10 bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error && (
          <section className="rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center">
            <h2 className="text-lg font-bold text-red-200">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-red-100/80">{error}</p>

            <button
              onClick={getBookshelf}
              className="mt-5 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-400"
            >
              Try again
            </button>
          </section>
        )}

        {!error && filteredBooks.length === 0 && (
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-10 text-center">
            <h2 className="text-2xl font-black">No books found</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Try changing your search or filter.
            </p>
          </section>
        )}

        {!error && filteredBooks.length > 0 && (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBooks.map((item) => {
              const book = item.book;
              const title = book?.title || item.sid;
              const cover = getCoverUrl(book?.cover || book?.img);
              const readChapters = item.verses?.length || 0;
              const currentChapter = item.reading || 1;
              const key = item._id || item.id || item.oldId;
              const slug = book?.slug || book?.url || item.sid;

              return (
                <article
                  key={key}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/20 backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 hover:bg-white/[0.07]"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-zinc-900">
                    <img
                      src={cover}
                      alt={title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-500 hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

                    <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
                      <span className="rounded-full bg-black/50 px-3 py-1 text-xs font-bold capitalize text-zinc-100 backdrop-blur">
                        {book?.genre || "Novel"}
                      </span>

                      <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-zinc-950">
                        ★ {book?.rating || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h2 className="line-clamp-2 text-xl font-black leading-tight">
                      {title}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                      {book?.description || "No description available."}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                        <span className="block text-xs font-medium text-zinc-500">
                          Current
                        </span>
                        <strong className="mt-1 block text-sm">
                          Chapter {currentChapter}
                        </strong>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-3">
                        <span className="block text-xs font-medium text-zinc-500">
                          Read
                        </span>
                        <strong className="mt-1 block text-sm">
                          {readChapters} chapters
                        </strong>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/books/${slug}/chapters`)}
                      className="mt-5 w-full rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-indigo-400 active:translate-y-0"
                    >
                      Start Reading
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default Bookshelf;
