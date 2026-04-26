import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import LibraryBookCard from "../components/LibraryBookCard";
import { Button } from "../components/ui/button";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Library() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState(["all"]);
  const [search, setSearch] = useState("");
  const [activeGenre, setActiveGenre] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [genreLoading, setGenreLoading] = useState(true);
  const [error, setError] = useState("");
  const genreScrollerRef = useRef(null);

  const getBooks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/books", {
        params: {
          search,
          genre: activeGenre,
          page,
          limit: 24,
        },
      });

      setBooks(res.data.books || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalBooks(res.data.total || 0);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to load books.");
    } finally {
      setLoading(false);
    }
  };

  const getGenres = async () => {
    try {
      setGenreLoading(true);

      const res = await api.get("/books/genres");

      setGenres(["all", ...(res.data.genres || [])]);
    } catch {
      setGenres(["all"]);
    } finally {
      setGenreLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    getBooks();
  };

  const handleGenreClick = (genre) => {
    setActiveGenre(genre);
    setPage(1);
  };

  const scrollGenres = (direction) => {
    if (!genreScrollerRef.current) return;

    const offset = direction === "left" ? -260 : 260;
    genreScrollerRef.current.scrollBy({
      left: offset,
      behavior: "smooth",
    });
  };

  const readableTotal = useMemo(() => {
    return new Intl.NumberFormat().format(totalBooks);
  }, [totalBooks]);

  useEffect(() => {
    getGenres();
  }, []);

  useEffect(() => {
    getBooks();
  }, [activeGenre, page]);

  return (
    <>
      <main className="min-h-screen bg-[#f8f7fb] text-zinc-950">
        <section className="mx-auto max-w-[1360px] px-5 py-8 lg:px-8">
          <div className="rounded-[32px] bg-gradient-to-br from-[#efe7ff] via-white to-[#fff4df] px-6 py-10 shadow-sm md:px-10">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#6544ff]">
              Versedom Library
            </p>

            <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-black tracking-tight text-zinc-950 md:text-6xl">
                  Explore all novels
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
                  Browse every imported book from the old database. Search by
                  title, filter by genre, and jump into any story.
                </p>
              </div>

              <div className="rounded-3xl bg-white/80 px-6 py-5 shadow-sm ring-1 ring-black/5">
                <span className="block text-sm font-semibold text-zinc-500">
                  Total books
                </span>
                <strong className="mt-1 block text-3xl font-black text-zinc-950">
                  {readableTotal}
                </strong>
              </div>
            </div>
          </div>

          <section className="mt-8 rounded-[30px] border border-zinc-200/70 bg-gradient-to-b from-white to-zinc-50/60 p-5 shadow-[0_10px_30px_rgba(24,24,27,0.06)]">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full gap-3 xl:max-w-[760px]"
              >
                <div className="relative flex-1">
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
                    />
                  </svg>

                  <input
                    type="text"
                    placeholder="Search books, genre, tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-[17px] font-medium text-zinc-700 outline-none transition placeholder:text-zinc-400 focus:border-[#6544ff] focus:ring-4 focus:ring-[#6544ff]/15"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-14 rounded-2xl bg-gradient-to-r from-[#6544ff] to-[#5a3cf1] px-8 text-base font-bold text-white shadow-[0_8px_24px_rgba(101,68,255,0.35)] transition hover:from-[#5b3ff1] hover:to-[#5031e8]"
                >
                  Search
                </Button>
              </form>

              <Button
                onClick={() => {
                  setSearch("");
                  setActiveGenre("all");
                  setPage(1);
                }}
                variant="outline"
                className="h-14 rounded-2xl border-zinc-200 bg-white px-7 text-base font-semibold text-zinc-600 transition hover:bg-zinc-100"
              >
                Reset
              </Button>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => scrollGenres("left")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
                aria-label="Scroll genres left"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m15 6-6 6 6 6" />
                </svg>
              </button>

              {genreLoading ? (
                <p className="text-sm text-zinc-500">Loading genres...</p>
              ) : (
                <div
                  ref={genreScrollerRef}
                  className="flex flex-1 gap-3 overflow-x-auto pb-2 [scrollbar-color:#8d8d8d_transparent] [scrollbar-width:thin]"
                >
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => handleGenreClick(genre)}
                      className={[
                        "shrink-0 whitespace-nowrap rounded-full border px-6 py-2.5 text-[15px] font-medium capitalize transition",
                        activeGenre === genre
                          ? "border-[#6544ff] bg-gradient-to-r from-[#6544ff] to-[#5b3ff1] text-white shadow-[0_8px_22px_rgba(101,68,255,0.35)]"
                          : "border-zinc-300 bg-white text-zinc-600 hover:border-[#6544ff]/40 hover:text-[#6544ff]",
                      ].join(" ")}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => scrollGenres("right")}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-zinc-300 bg-white text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-700"
                aria-label="Scroll genres right"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                </svg>
              </button>
            </div>
          </section>

          {error && (
            <section className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
              <p className="font-bold">{error}</p>
              <button
                onClick={getBooks}
                className="mt-4 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white"
              >
                Try again
              </button>
            </section>
          )}

          {loading && (
            <section className="grid min-h-[360px] place-items-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-[#6544ff]"></div>
                <p className="mt-4 text-sm font-semibold text-zinc-500">
                  Loading books...
                </p>
              </div>
            </section>
          )}

          {!loading && !error && books.length === 0 && (
            <section className="mt-8 rounded-[28px] bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
              <h2 className="text-2xl font-black">No books found</h2>
              <p className="mt-2 text-zinc-500">
                Try a different search or genre.
              </p>
            </section>
          )}

          {!loading && !error && books.length > 0 && (
            <>
              <section className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {books.map((book) => (
                  <LibraryBookCard
                    key={book._id}
                    book={book}
                    backendUrl={BACKEND_URL}
                    onRead={(slug) => navigate(`/books/${slug}/chapters`)}
                  />
                ))}
              </section>

              <section className="mt-10 flex items-center justify-center gap-3">
                <Button
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => prev - 1)}
                  variant="outline"
                  className="h-11 rounded-2xl border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </Button>

                <span className="rounded-2xl bg-white px-5 py-3 text-sm font-bold text-zinc-600 shadow-sm ring-1 ring-black/5">
                  Page {page} of {totalPages}
                </span>

                <Button
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                  variant="outline"
                  className="h-11 rounded-2xl border-zinc-200 bg-white px-5 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </Button>
              </section>
            </>
          )}
        </section>
      </main>
    </>
  );
}

export default Library;
