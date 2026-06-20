import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const GOOGLE_CONFIGURED =
  import.meta.env.VITE_GOOGLE_CLIENT_ID &&
  import.meta.env.VITE_GOOGLE_CLIENT_ID !== "YOUR_GOOGLE_CLIENT_ID_HERE" &&
  String(import.meta.env.VITE_GOOGLE_CLIENT_ID).length > 20;

import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function BrandAuth() {

  const navigate = useNavigate();

  const { signup, login, loading, loginGoogle, user } = useAuth();

  // Only redirect if already logged in as brand
  useEffect(() => {
    if (user?.role === "brand") navigate("/brand/dashboard", { replace: true });
  }, [user, navigate]);

  const [isSignup, setIsSignup] = useState(false);

  // ================= FORM DATA =================
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= GOOGLE LOGIN/SIGNUP =================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
        role: "brand",
      });
      if (data.role === "admin") {
        toast.error("This Google account is registered as Admin. Use the admin login page.");
        return;
      }
      loginGoogle(data);
      if (data.role === "influencer") {
        toast.success("Logged in as Creator");
        navigate("/influencer/dashboard");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };

  // ================= HANDLE AUTH =================
  const handleAuth = async (e) => {

    e.preventDefault();

    // ================= SIGNUP =================
    if (isSignup) {

      if (!formData.name.trim()) {
        toast.error("Company name is required");
        return;
      }

      if (formData.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }

      if (!/[A-Z]/.test(formData.password)) {
        toast.error("Password must contain uppercase letter");
        return;
      }

      if (!/[0-9]/.test(formData.password)) {
        toast.error("Password must contain a number");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "brand",
      });

      if (result.success) {
        toast.success(result.message);
        setIsSignup(false);
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
      } else {
        toast.error(result.message);
      }

      return;
    }

    // ================= LOGIN =================
    const result = await login(formData.email, formData.password, "brand");

    if (result.success) {
      toast.success(result.message);
      navigate("/brand/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white text-slate-800">

      {/* LEFT SIDE */}
      <div className="flex items-center justify-center px-6 sm:px-10 py-10 md:py-0">
        <div className="w-full max-w-md">

          {/* Logo / Brand */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold">
              <span className="text-sky-500">Syncluence</span>{" "}
              <span className="text-slate-500 font-normal">for Brands</span>
            </h2>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-semibold mb-2">
            {isSignup
              ? "Create your Brand account"
              : "Login to your Brand account"}
          </h1>

          <p className="text-slate-500 mb-8">
            Manage campaigns and collaborate with creators that align with your brand.
          </p>

          {/* GOOGLE SIGN IN */}
          <div className="flex justify-center mb-6">
            {GOOGLE_CONFIGURED ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error("Google login failed")}
                text={isSignup ? "signup_with" : "signin_with"}
                shape="rectangular"
                theme="filled_blue"
                width="400"
              />
            ) : (
              <button
                type="button"
                onClick={() => toast("Configure VITE_GOOGLE_CLIENT_ID in .env to enable Google login", { icon: "ℹ️" })}
                className="flex items-center justify-center gap-3 w-full
                           py-3 rounded-lg font-semibold text-white
                           bg-[#4285F4] hover:bg-[#357ae8] transition shadow-md"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-sm p-0.5" />
                {isSignup ? "Sign up with Google" : "Sign in with Google"}
              </button>
            )}
          </div>

          {/* DIVIDER */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="px-3 text-sm text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* FORM */}
          <form onSubmit={handleAuth} className="space-y-5">

            {/* COMPANY NAME (signup only) */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Nike Inc."
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Company email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. brand@company.com"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                required
              />
            </div>

            {/* CONFIRM PASSWORD */}
            {isSignup && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-60 transition text-white rounded-lg py-3 font-medium shadow-md"
            >
              {loading
                ? "Please wait..."
                : isSignup
                ? "Create Account"
                : "Log in"}
            </button>

          </form>

          {/* FOOTER LINKS */}
          <div className="mt-6 text-sm text-slate-500 space-y-2">
            <div>
              {isSignup
                ? "Already have a brand account?"
                : "Don't have a brand account?"}{" "}
              <span
                onClick={() => setIsSignup(!isSignup)}
                className="text-sky-500 cursor-pointer hover:underline"
              >
                {isSignup ? "Log in" : "Create account"}
              </span>
            </div>

            <div>
              Already a creator?{" "}
              <span
                onClick={() => navigate("/influencer/auth")}
                className="text-sky-500 cursor-pointer hover:underline"
              >
                Log in as Creator
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT SIDE IMAGE */}
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d"
          alt="Brand workspace"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>

    </div>
  );
}
