import { Routes, Route } from "react-router-dom";

/* ================= AUTH ================= */
import Auth from "./components/Auth/Auth";
import InfluencerAuth from "./components/Auth/InfluencerAuth";
import BrandAuth from "./components/Auth/BrandAuth";
import AdminAuth from "./components/Auth/AdminAuth";

/* ================= SHARED ================= */
import NotFound from "./components/Shared/NotFound";

/* ================= PROTECTED ROUTES ================= */
import ProtectedRoute from "./routes/ProtectedRoute";

/* ================= DASHBOARD LAYOUTS ================= */
import InfluencerDashboard from "./components/Influencer/InfluencerDashboard";
import BrandDashboard from "./components/Brand/BrandDashboard";
import AdminLayout from "./components/Admin/AdminLayout";

/* ================= INFLUENCER PAGES ================= */
import InfluencerOverview from "./components/Influencer/InfluencerOverview";
import InfluencerCampaigns from "./components/Influencer/InfluencerCampaigns";
import InfluencerEarnings from "./components/Influencer/InfluencerEarnings";
import InfluencerSettings from "./components/Influencer/InfluencerSettings";
import InfluencerChat from "./components/Influencer/InfluencerChat";

/* ================= BRAND PAGES ================= */
import BrandOverview from "./components/Brand/BrandOverview";
import BrandCampaigns from "./components/Brand/BrandCampaigns";
import BrandInfluencers from "./components/Brand/BrandInfluencers";
import BrandPayments from "./components/Brand/BrandPayments";
import BrandSettings from "./components/Brand/BrandSettings";
import BrandAIMatch from "./components/Brand/BrandAIMatch";
import BrandChat from "./components/Brand/BrandChat";

/* ================= ADMIN PAGES ================= */
import AdminOverview from "./components/Admin/AdminOverview";
import AdminUsers from "./components/Admin/AdminUsers";
import AdminCampaigns from "./components/Admin/AdminCampaigns";
import AdminPayments from "./components/Admin/AdminPayments";
import AdminSettings from "./components/Admin/AdminSettings";
import AdminFraud from "./components/Admin/AdminFraud";
import AdminChat from "./components/Admin/AdminChat";
import AdminAuditLog from "./components/Admin/AdminAuditLog";

export default function App() {

  return (
    <Routes>

      {/* ================= LANDING ================= */}
      <Route path="/" element={<Auth />} />

      {/* ================= AUTH ROUTES ================= */}
      <Route
        path="/influencer/auth"
        element={<InfluencerAuth />}
      />

      <Route
        path="/brand/auth"
        element={<BrandAuth />}
      />

      <Route
        path="/admin/auth"
        element={<AdminAuth />}
      />

      {/* ================= INFLUENCER DASHBOARD ================= */}
      <Route
        path="/influencer/dashboard"
        element={
          <ProtectedRoute allowedRole="influencer">
            <InfluencerDashboard />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={<InfluencerOverview />}
        />

        <Route
          path="campaigns"
          element={<InfluencerCampaigns />}
        />

        <Route
          path="earnings"
          element={<InfluencerEarnings />}
        />

        <Route
          path="settings"
          element={<InfluencerSettings />}
        />

        <Route
          path="chat"
          element={<InfluencerChat />}
        />

      </Route>

      {/* ================= BRAND DASHBOARD ================= */}
      <Route
        path="/brand/dashboard"
        element={
          <ProtectedRoute allowedRole="brand">
            <BrandDashboard />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={<BrandOverview />}
        />

        <Route
          path="campaigns"
          element={<BrandCampaigns />}
        />

        <Route
          path="influencers"
          element={<BrandInfluencers />}
        />

        <Route
          path="payments"
          element={<BrandPayments />}
        />

        <Route
          path="settings"
          element={<BrandSettings />}
        />

        <Route
          path="ai-match"
          element={<BrandAIMatch />}
        />

        <Route
          path="chat"
          element={<BrandChat />}
        />

      </Route>

      {/* ================= ADMIN DASHBOARD ================= */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >

        <Route
          index
          element={<AdminOverview />}
        />

        <Route
          path="users"
          element={<AdminUsers />}
        />

        <Route
          path="campaigns"
          element={<AdminCampaigns />}
        />

        <Route
          path="payments"
          element={<AdminPayments />}
        />

        <Route
          path="settings"
          element={<AdminSettings />}
        />

        <Route
          path="fraud"
          element={<AdminFraud />}
        />

        <Route
          path="audit-log"
          element={<AdminAuditLog />}
        />

        <Route
          path="chat"
          element={<AdminChat />}
        />

      </Route>

      {/* ================= 404 PAGE ================= */}
      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}