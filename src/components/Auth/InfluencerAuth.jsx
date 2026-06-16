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

export default function InfluencerAuth() {

  const navigate = useNavigate();

  const { signup, login, loading, loginGoogle, user } = useAuth();

  // Only redirect if already logged in as influencer
  useEffect(() => {
    if (user?.role === "influencer") navigate("/influencer/dashboard", { replace: true });
  }, [user, navigate]);

  const [isSignup, setIsSignup] = useState(true);

  // ================= FORM STATE =================
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

  // ================= HANDLE AUTH =================
  const handleSignup = async (e) => {

    e.preventDefault();

    // ================= SIGNUP =================
    if (isSignup) {

      if (!formData.name.trim()) {
        toast.error("Full name is required");
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
        role: "influencer",
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
    const result = await login(formData.email, formData.password, "influencer");

    if (result.success) {
      toast.success(result.message);
      navigate("/influencer/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  // ================= GOOGLE SIGNUP =================
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const { data } = await api.post("/auth/google", {
        credential: credentialResponse.credential,
        role: "influencer",
      });
      if (data.role !== "influencer") {
        toast.error(
          data.role === "admin"
            ? "This Google account is registered as Admin. Use the admin login page."
            : "This Google account is registered as a Brand, not a Creator."
        );
        return;
      }
      loginGoogle(data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">

      {/* ================= LEFT SIDE (FORM) ================= */}
      <div className="flex flex-col justify-center px-6 sm:px-10 md:px-16 py-10 md:py-0">

        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Syncluence
            </span>{" "}
            <span className="text-gray-400 font-medium">
              for Creators
            </span>
          </h1>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">
          {isSignup ? "Create a Creator account" : "Creator Login"}
        </h2>

        <p className="text-gray-500 mb-8 max-w-md">
          Sign up to Syncluence and collaborate with brands that align with
          your audience and values.
        </p>

        {/* GOOGLE SIGN UP */}
        <div className="max-w-md mb-6">
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
                         py-3 rounded-md font-semibold text-white
                         bg-[#4285F4] hover:bg-[#357ae8] transition shadow-md"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5 bg-white rounded-sm p-0.5" />
              {isSignup ? "Sign up with Google" : "Login with Google"}
            </button>
          )}
        </div>

        {/* DIVIDER */}
        <div className="flex items-center max-w-md mb-6">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* FORM */}
        <form onSubmit={handleSignup} className="space-y-5 max-w-md">

          {/* FULL NAME (signup only) */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g. Alex Morgan"
                className="w-full px-4 py-3 rounded-md border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g. john.doe@example.com"
              className="w-full px-4 py-3 rounded-md border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-md border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            {isSignup && (
              <div className="flex gap-4 text-xs text-gray-400 mt-2">
                <span>● Uppercase</span>
                <span>● Number</span>
                <span>● Min. 8 chars</span>
              </div>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
                className="w-full px-4 py-3 rounded-md border border-gray-300
                           focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-md font-semibold text-white
                       bg-gradient-to-r from-cyan-500 to-blue-600
                       hover:from-cyan-400 hover:to-blue-500
                       disabled:opacity-60 transition shadow-md"
          >
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Login"}
          </button>

        </form>

        {/* FOOTER LINKS */}
        <div className="mt-8 text-sm text-gray-500 space-y-2 max-w-md">
          <p>
            {isSignup
              ? "Already have a creator account?"
              : "Don't have a creator account?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="text-cyan-600 cursor-pointer hover:underline"
            >
              {isSignup ? "Sign in" : "Create account"}
            </span>
          </p>

          <p>
            Trying to log in as a brand?{" "}
            <span
              onClick={() => navigate("/brand/auth")}
              className="text-cyan-600 cursor-pointer hover:underline"
            >
              Sign in
            </span>
          </p>
        </div>

      </div>

      {/* ================= RIGHT SIDE (IMAGE) ================= */}
      <div className="hidden md:block relative">
        <img
          src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e"
          alt="Creator lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>

    </div>
  );
}
