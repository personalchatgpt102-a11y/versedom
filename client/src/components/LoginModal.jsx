import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("options");
  const [accepted, setAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const closeModal = () => {
    setMode("options");
    setError("");
    setSuccess("");
    setLoading(false);
    setShowPassword(false);
    setShowResetPassword(false);
    onClose();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleResetChange = (e) => {
    setResetData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const goToEmailLogin = () => {
    setMode("email");
    setError("");
    setSuccess("");

    if (!formData.email && resetData.email) {
      setFormData((prev) => ({ ...prev, email: resetData.email }));
    }
  };

  const goToReset = () => {
    setMode("reset");
    setError("");
    setSuccess("");

    if (!resetData.email && formData.email) {
      setResetData((prev) => ({ ...prev, email: formData.email }));
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!accepted) {
      setError("Please agree to the Terms of Service and Privacy Policy.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.post("/auth/login", {
        email: formData.email.trim(),
        password: formData.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("auth-changed"));

      closeModal();
      navigate("/bookshelf");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    const email = resetData.email.trim();

    if (!email || !resetData.newPassword || !resetData.confirmPassword) {
      setError("Email, new password, and confirm password are required.");
      return;
    }

    if (resetData.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const res = await api.post("/auth/reset-test-password", {
        email,
        newPassword: resetData.newPassword,
      });

      setSuccess(res.data?.message || "Password reset successful. Please log in.");
      setFormData((prev) => ({ ...prev, email, password: "" }));
      setResetData((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));

      setTimeout(() => {
        setMode("email");
      }, 800);
    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={closeModal}
        >
          <motion.div
            className="relative w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 sm:px-10">
              <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                {mode === "reset" ? "RESET PASSWORD" : "LOG IN"}
              </h2>

              <button
                onClick={closeModal}
                className="grid h-10 w-10 place-items-center rounded-full text-3xl leading-none text-zinc-900 transition hover:bg-zinc-100"
                aria-label="Close login modal"
              >
                x
              </button>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              {mode === "options" && (
                <motion.div
                  className="mx-auto flex max-w-[330px] flex-col items-center"
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#4f86ed] text-base font-bold text-white shadow-sm transition hover:scale-[1.02]"
                    onClick={() => setError("Google login is coming soon.")}
                  >
                    <span className="text-2xl font-black">G</span>
                    Log In With Google
                  </button>

                  <button
                    type="button"
                    className="mt-5 flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#1795e8] text-base font-bold text-white shadow-sm transition hover:scale-[1.02]"
                    onClick={() => setError("Facebook login is coming soon.")}
                  >
                    <span className="text-3xl font-black">f</span>
                    Log In With Facebook
                  </button>

                  <button
                    type="button"
                    onClick={goToEmailLogin}
                    className="mt-6 text-base font-medium text-[#6544ff] underline underline-offset-2 transition hover:text-purple-700"
                  >
                    Log In With Email
                  </button>

                  <button
                    type="button"
                    onClick={goToReset}
                    className="mt-3 text-sm font-semibold text-zinc-600 underline underline-offset-2 transition hover:text-zinc-900"
                  >
                    Reset Password
                  </button>

                  {error && (
                    <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-600">
                      {error}
                    </p>
                  )}

                  <label className="mt-10 flex cursor-pointer items-start gap-3 text-sm text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setAccepted((prev) => !prev)}
                      className={[
                        "mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                        accepted ? "border-[#6544ff] bg-[#6544ff]" : "border-zinc-300 bg-white",
                      ].join(" ")}
                    >
                      {accepted && <span className="h-2 w-2 rounded-full bg-white"></span>}
                    </button>

                    <span>
                      I have read and agree to the <a href="#" className="text-zinc-600 underline underline-offset-2">Terms Of Service</a> and <a href="#" className="text-zinc-600 underline underline-offset-2">Privacy Policy</a>
                    </span>
                  </label>
                </motion.div>
              )}

              {mode === "email" && (
                <motion.form
                  onSubmit={handleEmailLogin}
                  className="mx-auto max-w-[380px]"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMode("options");
                      setError("");
                      setSuccess("");
                    }}
                    className="mb-5 text-sm font-bold text-[#6544ff] transition hover:text-purple-700"
                  >
                    {"< Back"}
                  </button>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-zinc-700">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Enter your email"
                        className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-zinc-900 outline-none transition focus:border-[#6544ff] focus:ring-4 focus:ring-purple-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-zinc-700">Password</span>

                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          placeholder="Enter your password"
                          className="h-12 w-full rounded-xl border border-zinc-200 px-4 pr-20 text-zinc-900 outline-none transition focus:border-[#6544ff] focus:ring-4 focus:ring-purple-100"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-3 py-2 text-sm font-bold text-[#6544ff] transition hover:bg-purple-50"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={goToReset}
                    className="mt-3 text-sm font-semibold text-zinc-600 underline underline-offset-2 transition hover:text-zinc-900"
                  >
                    Forgot password?
                  </button>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-zinc-500">
                    <button
                      type="button"
                      onClick={() => setAccepted((prev) => !prev)}
                      className={[
                        "mt-[2px] grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
                        accepted ? "border-[#6544ff] bg-[#6544ff]" : "border-zinc-300 bg-white",
                      ].join(" ")}
                    >
                      {accepted && <span className="h-2 w-2 rounded-full bg-white"></span>}
                    </button>

                    <span>
                      I agree to the <a href="#" className="underline">Terms Of Service</a> and <a href="#" className="underline">Privacy Policy</a>
                    </span>
                  </label>

                  {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                  {success && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 h-12 w-full rounded-full bg-[#6544ff] text-base font-black text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] hover:bg-[#5435e8] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading ? "Logging in..." : "Log In"}
                  </button>
                </motion.form>
              )}

              {mode === "reset" && (
                <motion.form
                  onSubmit={handleResetPassword}
                  className="mx-auto max-w-[380px]"
                  initial={{ opacity: 0, x: 18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMode("email");
                      setError("");
                      setSuccess("");
                    }}
                    className="mb-5 text-sm font-bold text-[#6544ff] transition hover:text-purple-700"
                  >
                    {"< Back to Login"}
                  </button>

                  <div className="space-y-4">
                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-zinc-700">Email</span>
                      <input
                        type="email"
                        name="email"
                        value={resetData.email}
                        onChange={handleResetChange}
                        required
                        placeholder="Enter your account email"
                        className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-zinc-900 outline-none transition focus:border-[#6544ff] focus:ring-4 focus:ring-purple-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-zinc-700">New Password</span>
                      <input
                        type={showResetPassword ? "text" : "password"}
                        name="newPassword"
                        value={resetData.newPassword}
                        onChange={handleResetChange}
                        required
                        placeholder="Enter new password"
                        className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-zinc-900 outline-none transition focus:border-[#6544ff] focus:ring-4 focus:ring-purple-100"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-sm font-bold text-zinc-700">Confirm Password</span>
                      <input
                        type={showResetPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={resetData.confirmPassword}
                        onChange={handleResetChange}
                        required
                        placeholder="Confirm new password"
                        className="h-12 w-full rounded-xl border border-zinc-200 px-4 text-zinc-900 outline-none transition focus:border-[#6544ff] focus:ring-4 focus:ring-purple-100"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="mt-3 text-sm font-bold text-[#6544ff] transition hover:text-[#5435e8]"
                  >
                    {showResetPassword ? "Hide Passwords" : "Show Passwords"}
                  </button>

                  {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</p>}
                  {success && <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">{success}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-6 h-12 w-full rounded-full bg-[#6544ff] text-base font-black text-white shadow-lg shadow-purple-500/25 transition hover:scale-[1.02] hover:bg-[#5435e8] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </motion.form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
