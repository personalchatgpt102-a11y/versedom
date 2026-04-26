import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api/axios";

function ReadChapter() {
  const { slug, chapter } = useParams();
  const navigate = useNavigate();

  const [chapterData, setChapterData] = useState(null);
  const [bookTitle, setBookTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const chapterNumber = Number(chapter);

  const getChapter = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `/books/${encodeURIComponent(slug)}/chapters/${chapterNumber}`
      );

      setChapterData(res.data.chapter || null);
      setBookTitle(res.data.book?.title || "");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load this chapter.");
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    try {
      await api.patch(`/books/${encodeURIComponent(slug)}/progress`, {
        chapter: chapterNumber,
      });
    } catch {
      // Ignore silently for users without auth or when progress sync fails.
    }
  };

  useEffect(() => {
    if (!Number.isFinite(chapterNumber) || chapterNumber < 1) {
      setError("Invalid chapter number.");
      setLoading(false);
      return;
    }

    getChapter();
    updateProgress();
  }, [slug, chapterNumber]);

  const goToChapter = (nextChapter) => {
    if (nextChapter < 1) return;
    navigate(`/books/${slug}/chapter/${nextChapter}`);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white">
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-zinc-700 border-t-indigo-500"></div>
            <p className="text-sm text-zinc-300">Opening chapter...</p>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-red-400/20 bg-red-500/10 p-6 text-center">
          <h1 className="text-xl font-black text-red-200">Chapter not found</h1>
          <p className="mt-2 text-sm text-red-100/80">{error}</p>
          <button
            onClick={() => navigate(`/books/${slug}/chapters`)}
            className="mt-5 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white"
          >
            Back to Chapters
          </button>
        </section>
      </main>
    );
  }

  const rawText =
    chapterData?.content || chapterData?.text || chapterData?.body || "";
  const paragraphs = rawText.split("\n").filter((line) => line.trim().length > 0);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          onClick={() => navigate(`/books/${slug}/chapters`)}
          className="mb-6 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/10"
        >
          Back to Chapters
        </button>

        <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur sm:p-8 lg:p-10">
          <span className="inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">
            Chapter {chapterNumber}
          </span>

          <h1 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
            {chapterData?.title || `Chapter ${chapterNumber}`}
          </h1>

          {bookTitle && <p className="mt-2 text-sm font-medium text-zinc-400">{bookTitle}</p>}

          <div className="mt-8 space-y-5 text-base leading-8 text-zinc-200 sm:text-lg sm:leading-9">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
            ) : (
              <p className="text-zinc-400">No chapter content available.</p>
            )}
          </div>
        </article>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => goToChapter(chapterNumber - 1)}
            disabled={chapterNumber <= 1}
            className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous Chapter
          </button>

          <button
            onClick={() => goToChapter(chapterNumber + 1)}
            className="rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-400"
          >
            Next Chapter
          </button>
        </div>
      </div>
    </main>
  );
}

export default ReadChapter;
