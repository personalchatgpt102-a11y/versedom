import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserTokenFields from "./UserTokenFields";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getDisplayName = (user) => {
  const fullName = user?.profile?.fullName?.trim();
  if (fullName) return fullName;

  const firstName = user?.profile?.firstName?.trim() || "";
  const lastName = user?.profile?.lastName?.trim() || "";
  const combined = `${firstName} ${lastName}`.trim();

  if (combined) return combined;

  return user?.email?.split("@")[0] || "Reader";
};

const getProfileImage = (user) => {
  const image = user?.profile?.image;

  if (!image) return "";
  if (image.startsWith("http")) return image;
  if (image.startsWith("/uploads/")) return `${BACKEND_URL}${image}`;
  if (image.startsWith("uploads/")) return `${BACKEND_URL}/${image}`;

  return `${BACKEND_URL}/uploads/${image}`;
};

function UserDropdown({ user, onLogout }) {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const profileImage = useMemo(() => getProfileImage(user), [user]);
  const initials = useMemo(() => {
    const words = displayName.split(" ").filter(Boolean);
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";
  }, [displayName]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const goToProfile = () => {
    setIsOpen(false);
    navigate("/profile#profile-section");
  };

  const goToSettings = () => {
    setIsOpen(false);
    navigate("/profile#settings-section");
  };

  const goToBookshelf = () => {
    setIsOpen(false);
    navigate("/bookshelf");
  };

  const handleLogoutClick = () => {
    setIsOpen(false);
    onLogout();
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white pl-2 pr-3 py-1.5 transition hover:border-[#6544ff] hover:shadow-sm"
      >
        <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-full bg-zinc-900 text-xs font-bold text-white">
          {profileImage && !useFallbackImage ? (
            <img
              src={profileImage}
              alt={displayName}
              className="h-full w-full object-cover"
              onError={() => setUseFallbackImage(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <span className="max-w-[110px] truncate text-sm font-semibold text-zinc-900">
          {displayName}
        </span>

        <svg
          className="h-4 w-4 text-zinc-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
          <div className="rounded-xl bg-zinc-50 p-3">
            <p className="text-sm font-black text-zinc-900">{displayName}</p>
            <p className="mt-1 truncate text-xs font-medium text-zinc-500">{user?.email}</p>
          </div>

          <UserTokenFields profile={user?.profile} className="mt-3" />

          <div className="mt-3 grid gap-1">
            <button
              onClick={goToBookshelf}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Bookshelf
            </button>

            <button
              onClick={goToProfile}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              Profile
            </button>

            <button
              onClick={goToSettings}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100"
            >
              User Settings
            </button>

            <button
              onClick={handleLogoutClick}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDropdown;
