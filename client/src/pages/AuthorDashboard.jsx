import {
  BookOpen,
  Eye,
  FileText,
  LogOut,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const PROGRESS_CYCLE = ["Pending", "Completed", "Ongoing", "Ongoing"];
const REVIEW_CYCLE = ["Pending", "Reviewed", "Pending", "Pending"];

const getCoverUrl = (cover) => {
  if (!cover) return "https://placehold.co/90x120/f4f4f5/71717a?text=No+Cover";
  if (cover.startsWith("http")) return cover;
  if (cover.startsWith("/uploads/")) return `${BACKEND_URL}${cover}`;
  if (cover.startsWith("uploads/")) return `${BACKEND_URL}/${cover}`;
  return `${BACKEND_URL}/uploads/${cover}`;
};

const getBadgeClasses = (value, type) => {
  if (type === "progress") {
    if (value === "Completed") return "bg-blue-50 text-blue-600";
    if (value === "Ongoing") return "bg-red-50 text-red-500";
    return "bg-rose-50 text-rose-500";
  }

  if (value === "Reviewed") return "bg-blue-50 text-blue-600";
  return "bg-rose-50 text-rose-500";
};

function AuthorDashboard() {
  const navigate = useNavigate();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("accountMode");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const booksRes = await api.get("/author/my-books");
      setBooks(booksRes.data.books || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load author dashboard.");
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const rows = useMemo(() => {
    const sortedBooks = [...books].sort((a, b) =>
      (a.title || "").localeCompare(b.title || "", undefined, {
        sensitivity: "base",
        numeric: true,
      })
    );

    const normalized = sortedBooks.map((book, index) => {
      const chapterCount = Number(book.chapterCount || 0);
      const readers = index % 2 === 0 ? 0 : ((index + 3) * 2) % 10;

      return {
        ...book,
        chapterCount,
        readers,
        progress: PROGRESS_CYCLE[index % PROGRESS_CYCLE.length],
        review: REVIEW_CYCLE[index % REVIEW_CYCLE.length],
      };
    });

    if (!search.trim()) return normalized;

    const q = search.toLowerCase();
    return normalized.filter((book) => (book.title || "").toLowerCase().includes(q));
  }, [books, search]);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f3f4f6]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-500" />
          <p className="mt-4 text-sm font-bold text-zinc-500">Loading author dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f4f6] px-3 py-4 text-zinc-900 sm:px-5 sm:py-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1440px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
        <header className="border-b border-slate-200 bg-[#f8fafc] px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={logout}
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-400 hover:text-red-600"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>

            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-blue-500 px-6 text-sm font-bold text-white transition hover:bg-blue-600">
              <Plus size={18} />
              New Story
            </button>
          </div>
        </header>

        {error && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 sm:m-6">
            {error}
          </div>
        )}

        {!error && rows.length === 0 ? (
          <div className="px-4 py-14 text-center sm:px-6">
            <BookOpen className="mx-auto text-slate-300" size={42} />
            <h2 className="mt-4 text-2xl font-bold text-slate-800">No stories found</h2>
            <p className="mt-2 text-sm text-slate-500">
              {books.length === 0
                ? "No books are linked to this author account yet."
                : "Try a different search term."}
            </p>
          </div>
        ) : (
          <div className="px-2 py-4 sm:px-6 sm:py-6">
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#f8fafc] text-left">
                    <th className="rounded-l-xl border-y border-slate-200 px-4 py-4 text-base font-extrabold text-slate-800">
                      #
                    </th>
                    <th className="border-y border-slate-200 px-4 py-4 text-base font-extrabold text-slate-800">
                      Title
                    </th>
                    <th className="border-y border-slate-200 px-4 py-4 text-center text-base font-extrabold text-slate-800">
                      Chapters
                    </th>
                    <th className="border-y border-slate-200 px-4 py-4 text-center text-base font-extrabold text-slate-800">
                      Readers
                    </th>
                    <th className="border-y border-slate-200 px-4 py-4 text-center text-base font-extrabold text-slate-800">
                      Progress
                    </th>
                    <th className="border-y border-slate-200 px-4 py-4 text-center text-base font-extrabold text-slate-800">
                      Review
                    </th>
                    <th className="rounded-r-xl border-y border-slate-200 px-4 py-4 text-center text-base font-extrabold text-slate-800">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map((book, index) => {
                    const slug = book.slug || book.url;
                    return (
                      <tr key={book._id || slug || index} className="group">
                        <td className="border-b border-slate-200 px-4 py-4 text-center text-lg font-normal text-slate-900">
                          {index + 1}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={getCoverUrl(book.cover || book.img)}
                              alt={book.title || "Story cover"}
                              className="h-14 w-11 rounded-md border border-slate-200 object-cover"
                              loading="lazy"
                            />
                            <p className="line-clamp-1 text-[17px] font-medium tracking-[0.01em] text-slate-900">
                              {book.title || "Untitled Story"}
                            </p>
                          </div>
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-center text-lg font-medium text-slate-900">
                          {book.chapterCount}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-center text-lg font-medium text-slate-900">
                          {book.readers}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-center">
                          <span
                            className={`inline-flex min-w-24 items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold ${getBadgeClasses(book.progress, "progress")}`}
                          >
                            {book.progress}
                          </span>
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4 text-center">
                          <span
                            className={`inline-flex min-w-24 items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold ${getBadgeClasses(book.review, "review")}`}
                          >
                            {book.review}
                          </span>
                        </td>

                        <td className="border-b border-slate-200 px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => slug && navigate(`/books/${slug}/chapters`)}
                              className="grid h-11 w-11 place-items-center rounded-full bg-blue-500 text-white transition hover:bg-blue-600"
                              title="View"
                            >
                              <Eye size={19} />
                            </button>

                            <button
                              className="grid h-11 w-11 place-items-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600"
                              title="Edit"
                            >
                              <FileText size={18} />
                            </button>

                            <button
                              className="grid h-11 w-11 place-items-center rounded-full bg-red-500 text-white transition hover:bg-red-600"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

export default AuthorDashboard;
