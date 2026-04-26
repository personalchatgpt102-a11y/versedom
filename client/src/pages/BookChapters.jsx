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
      <main className="min-h-screen bg-[#f8f7fb] text-zinc-900">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-200 border-t-indigo-500"></div>
            <p className="text-sm text-zinc-600">Loading chapters...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f7fb] px-4 py-10 text-zinc-900">
        <section className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-black text-red-700">Failed to load chapters</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
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
      <main className="min-h-screen bg-[#f8f7fb] px-4 py-10 text-zinc-900">
        <section className="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white p-8 text-center">
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
  const cover = getCoverUrl(
    book.cover || book.img || book.image || book.coverImage || book.thumbnail
  );
  const chapters = data.chapters || [];
  const hasChapters = chapters.length > 0;
  const totalChapters = chapters.length;
  const currentChapter = hasChapters
    ? Number(data.progress?.currentChapter || chapters[0]?.number || 1)
    : 0;
  const readChapterNumbers = data.progress?.readChapters || [];

  return (
    <main className="min-h-screen bg-[#f8f7fb] text-zinc-900">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50"
        >
          Back
        </button>

        <section className="relative mb-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-indigo-50 via-blue-50 to-transparent" />

          <div className="relative grid gap-0 lg:grid-cols-[320px_1fr]">
            <div className="p-5 sm:p-6">
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
                <div className="relative aspect-[3/4]">
                  <img src={cover} alt={title} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full border border-indigo-300 bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700">
                  {book.genre || "Novel"}
                </span>
                <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  {book.language || "EN"}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-black leading-tight text-zinc-900 sm:text-4xl lg:text-[52px]">
                {title}
              </h1>

              <div className="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                <p className="max-w-4xl text-sm leading-7 text-zinc-600 sm:text-base">
                  {book.description || "No description available for this story yet."}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:max-w-2xl">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                    Current
                  </span>
                  <strong className="mt-2 block text-lg text-zinc-900">
                    {hasChapters ? `Chapter ${currentChapter}` : "No chapters"}
                  </strong>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                    Read
                  </span>
                  <strong className="mt-2 block text-lg text-zinc-900">
                    {readChapterNumbers.length} chapter{readChapterNumbers.length === 1 ? "" : "s"}
                  </strong>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                  <span className="block text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                    Total
                  </span>
                  <strong className="mt-2 block text-lg text-zinc-900">
                    {totalChapters} chapter{totalChapters === 1 ? "" : "s"}
                  </strong>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={() => hasChapters && openChapter(currentChapter)}
                  disabled={!hasChapters}
                  className="w-full rounded-2xl bg-indigo-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 disabled:shadow-none sm:w-auto sm:min-w-56"
                >
                  {hasChapters ? "Continue Reading" : "No Chapters Available"}
                </button>

                {!hasChapters && (
                  <button
                    onClick={() => navigate("/library")}
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-bold text-zinc-700 transition hover:bg-zinc-50 sm:w-auto"
                  >
                    Discover Other Stories
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Chapters</h2>
              <p className="mt-1 text-sm text-zinc-600">Pick any chapter and continue reading.</p>
            </div>
            <p className="text-sm text-zinc-500">{totalChapters} total chapters</p>
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
                        ? "border-indigo-300 bg-indigo-50"
                        : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                          Chapter {chapterNumber}
                        </span>
                        <h3 className="mt-2 line-clamp-2 text-base font-black text-zinc-900">
                          {chapter.title || `Chapter ${chapterNumber}`}
                        </h3>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${
                          isRead
                            ? "bg-emerald-100 text-emerald-700"
                            : isCurrent
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {isRead ? "Read" : isCurrent ? "Current" : "Unread"}
                      </span>
                    </div>

                    <div className="mt-5 text-sm font-bold text-indigo-600 transition group-hover:text-indigo-500">
                      Open Chapter
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
              No chapters are available for this book in the current database yet.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default BookChapters;
