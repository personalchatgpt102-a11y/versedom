import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function BookChapters() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getCoverUrl = (cover) => {
    if (!cover) return "https://placehold.co/400x600/18181b/a1a1aa?text=No+Cover";
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("/uploads/")) return `${BACKEND_URL}${cover}`;
    if (cover.startsWith("uploads/")) return `${BACKEND_URL}/${cover}`;
    return `${BACKEND_URL}/uploads/${cover}`;
  };

  const loadChapters = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/books/${encodeURIComponent(slug)}/chapters`);
      setData(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load chapters.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChapters();
  }, [slug]);

  const openChapter = (chapterNumber) => {
    const bookSlug = data?.slug || slug;
    navigate(`/books/${bookSlug}/chapter/${chapterNumber}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500"></div>
            <p className="text-sm text-zinc-300">Loading chapters...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center">
          <h1 className="text-xl font-black text-red-200">Failed to load chapters</h1>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <button
            onClick={loadChapters}
            className="mt-5 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (!data?.book) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-2xl font-black">Book not found</h1>
          <button
            onClick={() => navigate("/library")}
            className="mt-6 rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-bold text-white"
          >
            Back to Library
          </button>
        </section>
      </main>
    );
  }

  const book = data.book;
  const title = book.title || "Book";
  const cover = getCoverUrl(book.cover);
  const chapters = data.chapters || [];
  const hasChapters = chapters.length > 0;
  const currentChapter = Number(data.progress?.currentChapter || chapters[0]?.number || 1);
  const readChapterNumbers = data.progress?.readChapters || [];

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/10"
        >
          Back
        </button>

        <section className="mb-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[300px_1fr]">
            <div className="relative aspect-[3/4] max-h-[420px] overflow-hidden bg-zinc-900 lg:aspect-auto lg:h-full">
              <img src={cover} alt={title} className="h-full w-full object-cover" />
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <span className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
                {book.genre || "Novel"}
              </span>

              <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                {book.description || "No description available."}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                  <span className="block text-xs text-zinc-500">Current</span>
                  <strong className="mt-1 block text-lg">Chapter {currentChapter}</strong>
                </div>

                <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-4">
                  <span className="block text-xs text-zinc-500">Read</span>
                  <strong className="mt-1 block text-lg">{readChapterNumbers.length} chapters</strong>
                </div>
              </div>

              <button
                onClick={() => hasChapters && openChapter(currentChapter)}
                disabled={!hasChapters}
                className="mt-6 w-full rounded-2xl bg-indigo-500 px-5 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-300 disabled:shadow-none sm:w-auto sm:min-w-52"
              >
                {hasChapters ? "Read Current Chapter" : "No Chapters Available"}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Chapters</h2>
              <p className="mt-1 text-sm text-zinc-400">Pick any chapter and continue reading.</p>
            </div>
            <p className="text-sm text-zinc-500">{chapters.length} total chapters</p>
          </div>

          {hasChapters ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chapters.map((chapter) => {
                const chapterNumber = Number(chapter.number);
                const isRead = readChapterNumbers.includes(chapterNumber);
                const isCurrent = chapterNumber === currentChapter;

                return (
                  <button
                    key={chapterNumber}
                    onClick={() => openChapter(chapterNumber)}
                    className={`group rounded-3xl border p-5 text-left transition hover:-translate-y-0.5 ${
                      isCurrent
                        ? "border-indigo-400/50 bg-indigo-500/15"
                        : "border-white/10 bg-white/[0.04] hover:border-indigo-400/40 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Chapter {chapterNumber}
                        </span>
                        <h3 className="mt-2 line-clamp-2 text-base font-black text-white">
                          {chapter.title || `Chapter ${chapterNumber}`}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          isRead
                            ? "bg-emerald-400 text-zinc-950"
                            : isCurrent
                            ? "bg-indigo-400 text-zinc-950"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {isRead ? "Read" : isCurrent ? "Current" : "Unread"}
                      </span>
                    </div>

                    <div className="mt-5 text-sm font-bold text-indigo-300 transition group-hover:text-indigo-200">
                      Open Chapter
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-400/30 bg-amber-500/10 p-6 text-sm text-amber-100">
              No chapters are available for this book in the current database yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default BookChapters;
