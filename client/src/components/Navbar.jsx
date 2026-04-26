import { useEffect, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import LoginModal from "./LoginModal";
import UserDropdown from "./UserDropdown";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
};

function Navbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());

  const token = localStorage.getItem("token");

  useEffect(() => {
    const syncUser = () => setUser(getStoredUser());

    window.addEventListener("storage", syncUser);
    window.addEventListener("auth-changed", syncUser);

    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("auth-changed", syncUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/");
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Ranking", path: "/ranking" },
    { label: "Become a Writer", path: "/become-writer", highlight: true },
    { label: "Writer Benefits", path: "/writer-benefits" },
    { label: "Download", path: "/download" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <nav className="mx-auto flex h-[78px] max-w-[1360px] items-center justify-between px-5 lg:px-8">
          <button
            onClick={() => navigate("/")}
            className="font-serif text-[38px] font-light italic tracking-wide text-[#39206f]"
          >
            Dreame
          </button>

          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  [
                    "relative text-[16px] font-semibold transition hover:text-[#6544ff]",
                    isActive ? "text-[#6544ff]" : "text-black",
                  ].join(" ")
                }
              >
                <span className="relative z-10">{link.label}</span>

                {link.highlight && (
                  <span className="absolute bottom-[2px] left-0 z-0 h-[7px] w-full -rotate-1 rounded-full bg-yellow-300/90"></span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="hidden items-center gap-6 lg:flex">
            <button className="grid h-10 w-10 place-items-center rounded-full text-black transition hover:bg-zinc-100">
              <svg
                className="h-[22px] w-[22px]"
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
            </button>

            <Link
              to="/library"
              className="text-[16px] font-medium text-black transition hover:text-[#6544ff]"
            >
              Library
            </Link>

            <div className="h-7 w-px bg-black"></div>

            <button className="flex items-center gap-1 text-[16px] font-medium text-black transition hover:text-[#6544ff]">
              English
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </button>

            {token ? (
              <UserDropdown user={user} onLogout={handleLogout} />
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="rounded-full bg-gradient-to-r from-[#7b2cff] to-[#d84dff] px-6 py-2 text-sm font-black text-white shadow-lg shadow-purple-500/25 transition hover:scale-105"
              >
                Login
              </button>
            )}
          </div>

          <button
            onClick={() => setOpen((prev) => !prev)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-200 text-black lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? (
              <span className="text-xl font-bold leading-none">X</span>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </nav>

        {open && (
          <div className="border-t border-zinc-100 bg-white px-5 py-4 lg:hidden">
            <div className="grid gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-[15px] font-semibold text-black hover:bg-zinc-100"
                >
                  {link.label}
                </NavLink>
              ))}

              <button
                onClick={() => {
                  setOpen(false);

                  if (token) {
                    navigate("/library");
                  } else {
                    setLoginOpen(true);
                  }
                }}
                className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-black hover:bg-zinc-100"
              >
                Library
              </button>

              {token && (
                <>
                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/profile#profile-section");
                    }}
                    className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-black hover:bg-zinc-100"
                  >
                    Profile
                  </button>

                  <button
                    onClick={() => {
                      setOpen(false);
                      navigate("/profile#settings-section");
                    }}
                    className="rounded-xl px-4 py-3 text-left text-[15px] font-semibold text-black hover:bg-zinc-100"
                  >
                    User Settings
                  </button>
                </>
              )}

              {token ? (
                <button
                  onClick={handleLogout}
                  className="mt-2 rounded-xl bg-red-500 px-4 py-3 text-[15px] font-bold text-white"
                >
                  Logout
                </button>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    setLoginOpen(true);
                  }}
                  className="mt-2 rounded-xl bg-[#6544ff] px-4 py-3 text-[15px] font-bold text-white"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default Navbar;
