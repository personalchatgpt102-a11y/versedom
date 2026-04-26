import { Eye, PenLine } from "lucide-react";

const getCoverUrl = (cover, backendUrl) => {
  if (!cover) {
    return "https://placehold.co/400x600/f4f4f5/71717a?text=No+Cover";
  }

  if (cover.startsWith("http")) {
    return cover;
  }

  if (cover.startsWith("/uploads/")) {
    return `${backendUrl}${cover}`;
  }

  if (cover.startsWith("uploads/")) {
    return `${backendUrl}/${cover}`;
  }

  return `${backendUrl}/uploads/${cover}`;
};

function LibraryBookCard({ book, backendUrl, onRead }) {
  const bookSlug = book.slug || book.url;
  const coverUrl = getCoverUrl(book.cover || book.img, backendUrl);

  const title = book.title || "Untitled Novel";
  const views = Number(book.views || 0).toLocaleString();

  const ageTag =
    book.ageLimit || book.age || book.cat || (book.genre ? "16+" : "13+");

  const authorName =
    book.author?.penName ||
    book.authorName ||
    book.pen_name ||
    book.penName ||
    "Unknown Author";

  const handleRead = () => {
    if (!bookSlug) return;
    onRead(bookSlug);
  };

  return (
    <article className="group">
      <button
        type="button"
        onClick={handleRead}
        disabled={!bookSlug}
        className="block w-full text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="relative overflow-hidden rounded-[10px] border border-zinc-200 bg-zinc-100 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
          <div className="aspect-[2/3]">
            <img
              src={coverUrl}
              alt={title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          </div>

          <div className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full bg-[#ff3048] text-sm font-black text-white shadow-md">
            {String(ageTag).includes("+") ? ageTag : "16+"}
          </div>
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-tight text-zinc-900">
          {title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
          <PenLine size={15} strokeWidth={2.2} className="text-zinc-400" />
          <span className="line-clamp-1">{authorName}</span>
        </div>

        <div className="mt-1 flex items-center gap-2 text-sm text-zinc-500">
          <Eye size={16} strokeWidth={2.2} className="text-zinc-400" />
          <span>{views}</span>
        </div>
      </button>
    </article>
  );
}

export default LibraryBookCard;