import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LibraryBookCard from "../components/LibraryBookCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Bookshelf() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getBookshelf = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/bookshelf/me");
      setBooks(res.data.books || []);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load bookshelf.";

      setError(message);

      if (error.response?.status === 401) {
        navigate("/library");
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
      const matchesGenre = activeGenre === "all" || genre.toLowerCase() === activeGenre;

      return matchesSearch && matchesGenre;
    });
  }, [books, search, activeGenre]);

  useEffect(() => {
    getBookshelf();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f7fb] text-zinc-900">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-500"></div>
            <p className="text-sm font-medium text-zinc-600 sm:text-base">Loading your bookshelf...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7fb] text-zinc-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="mb-8 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="mb-3 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                My Library
              </span>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Bookshelf</h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                You have <strong className="font-semibold text-zinc-900">{books.length}</strong>{" "}
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

        <section className="mb-8 rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              type="text"
              placeholder="Search novels..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-500 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10 lg:max-w-md"
            />

            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap lg:justify-end lg:overflow-visible">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setActiveGenre(genre)}
                  className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition sm:text-sm ${
                    activeGenre === genre
                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
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
            <h2 className="text-lg font-bold text-red-200">Something went wrong</h2>
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
          <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-center">
            <h2 className="text-2xl font-black">No books found</h2>
            <p className="mt-2 text-sm text-zinc-600">Try changing your search or filter.</p>
          </section>
        )}

        {!error && filteredBooks.length > 0 && (
          <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredBooks.map((item) => {
              const book = item.book || {};
              const slug = book.slug || book.url || item.sid;
              const key = item._id || item.id || item.oldId || slug;

              const normalizedBook = {
                ...book,
                title: book.title || item.sid || "Untitled Novel",
                cover: book.cover || book.img,
                slug,
                url: slug,
              };

              return (
                <LibraryBookCard
                  key={key}
                  book={normalizedBook}
                  backendUrl={BACKEND_URL}
                  onRead={(bookSlug) => navigate(`/books/${bookSlug}/chapters`)}
                />
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export default Bookshelf;
