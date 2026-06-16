import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";

const AuthContext = createContext();

// ================= AUTH PROVIDER =================
function AuthProvider({ children }) {

  // ================= CURRENT USER =================
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const [loading, setLoading] = useState(false);

  // ================= LOAD USER ON REFRESH =================
  useEffect(() => {
    const saved = localStorage.getItem("currentUser");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  // ================= SIGNUP =================
  const signup = async (userData) => {
    setLoading(true);
    try {
      await api.post("/auth/register", userData);
      setLoading(false);
      return { success: true, message: "Account created! Please log in." };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || "Signup failed. Try again.",
      };
    }
  };

  // ================= LOGIN =================
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });

      // Role mismatch check
      if (role && data.role !== role) {
        setLoading(false);
        return { success: false, message: "Invalid credentials for this role" };
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data));
      setUser(data);
      setLoading(false);
      return { success: true, message: "Login successful", user: data };
    } catch (err) {
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.message || "Invalid email or password",
      };
    }
  };

  // ================= GOOGLE LOGIN (sets user directly) =================
  const loginGoogle = (userData) => {
    localStorage.setItem("token", userData.token);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    setUser(userData);
  };

  // ================= UPDATE USER (after profile save) =================
  const updateUser = (newData) => {
    const updated = { ...user, ...newData };
    localStorage.setItem("currentUser", JSON.stringify(updated));
    setUser(updated);
  };

  // ================= LOGOUT =================
  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signup, login, logout, loginGoogle, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ================= CUSTOM HOOK =================
const useAuth = () => useContext(AuthContext);

export { useAuth };
export default AuthProvider;
