import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import toast from "react-hot-toast";

import { useAuth } from "../../context/AuthContext";

export default function AdminAuth() {

  const navigate = useNavigate();

  const { signup, login, loading, user } = useAuth();

  // Only redirect if already logged in as admin
  useEffect(() => {
    if (user?.role === "admin") navigate("/admin/dashboard", { replace: true });
  }, [user, navigate]);

  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // ================= HANDLE CHANGE =================
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ================= HANDLE SUBMIT =================
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (isSignup && formData.name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // ================= SIGNUP =================
    if (isSignup) {

      const result = await signup({
        ...formData,
        role: "admin",
      });

      if (result.success) {
        toast.success(result.message);
        setIsSignup(false);
        setFormData({ name: "", email: "", password: "" });
      } else {
        toast.error(result.message);
      }

      return;
    }

    // ================= LOGIN =================
    const result = await login(formData.email, formData.password, "admin");

    if (result.success) {
      toast.success(result.message);
      navigate("/admin/dashboard");
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 px-4">

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200 p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-lg font-semibold">
            <span className="text-indigo-600">Syncluence</span>{" "}
            <span className="text-slate-500 font-normal">Admin Panel</span>
          </h2>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold mb-2 text-center">
          {isSignup ? "Create Admin Account" : "Admin Login"}
        </h1>

        <p className="text-slate-500 text-sm mb-8 text-center">
          Secure access to system controls,
          users, campaigns, and payments.
        </p>

        {/* ================= FORM ================= */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ================= NAME ================= */}
          {isSignup && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                className="w-full rounded-lg border border-slate-300 px-4 py-3
                           focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          {/* ================= EMAIL ================= */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Admin email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@syncluence.com"
              className="w-full rounded-lg border border-slate-300 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* ================= PASSWORD ================= */}
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
              className="w-full rounded-lg border border-slate-300 px-4 py-3
                         focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* ================= BUTTON ================= */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition
                       text-white rounded-lg py-3 font-medium shadow-sm"
          >
            {loading
              ? "Please wait..."
              : isSignup
              ? "Create Admin Account"
              : "Log in as Admin"}
          </button>

        </form>

        {/* ================= TOGGLE ================= */}
        <div className="mt-5 text-sm text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-indigo-600 hover:underline"
          >
            {isSignup ? "Already have an account?" : "Create new admin account"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-sm text-slate-500 text-center">
          Looking for Brand access?{" "}
          <span
            onClick={() => navigate("/brand/auth")}
            className="text-indigo-600 cursor-pointer hover:underline"
          >
            Log in as Brand
          </span>
        </div>

      </div>
    </div>
  );
}
