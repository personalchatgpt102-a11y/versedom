import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import UserTokenFields from "../components/UserTokenFields";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

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

function Profile() {
  const location = useLocation();
  const [user, setUser] = useState(() => getStoredUser());
  const [useFallbackImage, setUseFallbackImage] = useState(false);

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-changed", syncUser);
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const section = document.querySelector(location.hash);
    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.hash]);

  const displayName = useMemo(() => getDisplayName(user), [user]);
  const profileImage = useMemo(() => getProfileImage(user), [user]);
  const initials = useMemo(() => {
    const words = displayName.split(" ").filter(Boolean);
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "U";
  }, [displayName]);

  const profile = user?.profile || {};

  return (
    <main className="min-h-screen bg-[#f8f7fb] text-zinc-900">
      <div className="mx-auto max-w-[1120px] px-5 py-8 lg:px-8">
        <section id="profile-section" className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
          <h1 className="text-3xl font-black tracking-tight md:text-4xl">Profile</h1>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-zinc-900 text-2xl font-black text-white">
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

            <div>
              <p className="text-2xl font-black">{displayName}</p>
              <p className="mt-1 text-sm font-medium text-zinc-600">{user?.email}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Category: {profile.cat || "N/A"}
              </p>
            </div>
          </div>

          <UserTokenFields profile={profile} className="mt-6 max-w-md" />
        </section>

        <section id="settings-section" className="mt-6 rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5 md:p-8">
          <h2 className="text-2xl font-black">User Settings</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">First Name</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{profile.firstName || "Not set"}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Last Name</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{profile.lastName || "Not set"}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Nation</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{profile.nation || "Not set"}</p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Mode</p>
              <p className="mt-1 text-sm font-bold text-zinc-900">{user?.mode ?? "N/A"}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Profile;
