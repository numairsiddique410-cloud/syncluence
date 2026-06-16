import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

export default function BrandSettings() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    name: "",
    companyName: "",
    industry: "",
    website: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [notifications, setNotifications] = useState({
    campaignNotify: true,
    paymentNotify: true,
    messageNotify: false,
    updatesNotify: false,
  });

  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        companyName: user.brandDetails?.companyName || "",
        industry: user.brandDetails?.industry || "",
        website: user.brandDetails?.website || "",
      });
      if (user.preferences) {
        setNotifications({
          campaignNotify: user.preferences.campaignNotify ?? true,
          paymentNotify: user.preferences.paymentNotify ?? true,
          messageNotify: user.preferences.messageNotify ?? false,
          updatesNotify: user.preferences.updatesNotify ?? false,
        });
      }
    }
  }, [user]);

  // ================= SAVE PROFILE =================
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", {
        name: profile.name,
        brandDetails: {
          companyName: profile.companyName,
          industry: profile.industry,
          website: profile.website,
        },
        preferences: notifications,
      });
      updateUser(data);
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ================= CHANGE PASSWORD =================
  const handleChangePassword = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) {
      toast.error("Fill both password fields");
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSavingPwd(true);
    try {
      await api.put("/users/password", passwords);
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Password change failed");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Brand Settings</h2>
        <p className="text-slate-400 mt-1">
          Manage your brand profile, preferences, and security
        </p>
      </div>

      {/* PROFILE */}
      <section className="bg-[#0F1C24] border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Brand Profile</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Brand Name"
            value={profile.name}
            onChange={(v) => setProfile({ ...profile, name: v })}
          />
          <Input
            label="Company Name"
            value={profile.companyName}
            onChange={(v) => setProfile({ ...profile, companyName: v })}
          />
          <Input
            label="Industry"
            value={profile.industry}
            onChange={(v) => setProfile({ ...profile, industry: v })}
          />
          <Input
            label="Website"
            value={profile.website}
            onChange={(v) => setProfile({ ...profile, website: v })}
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-6 px-6 py-2 rounded-md bg-cyan-500 text-black font-semibold
                     hover:bg-cyan-400 disabled:opacity-60 transition"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </section>

      {/* SECURITY */}
      <section className="bg-[#0F1C24] border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Security</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <Input
            label="Current Password"
            type="password"
            value={passwords.currentPassword}
            onChange={(v) => setPasswords({ ...passwords, currentPassword: v })}
          />
          <Input
            label="New Password"
            type="password"
            value={passwords.newPassword}
            onChange={(v) => setPasswords({ ...passwords, newPassword: v })}
          />
        </div>

        <button
          onClick={handleChangePassword}
          disabled={savingPwd}
          className="mt-6 px-6 py-2 rounded-md bg-cyan-500 text-black font-semibold
                     hover:bg-cyan-400 disabled:opacity-60 transition"
        >
          {savingPwd ? "Updating..." : "Change Password"}
        </button>
      </section>

      {/* NOTIFICATIONS */}
      <section className="bg-[#0F1C24] border border-white/10 rounded-2xl p-8">
        <h3 className="text-lg font-semibold text-slate-100 mb-6">Notifications</h3>

        <Toggle
          label="Campaign updates"
          value={notifications.campaignNotify}
          onChange={() => setNotifications({ ...notifications, campaignNotify: !notifications.campaignNotify })}
        />
        <Toggle
          label="Payment alerts"
          value={notifications.paymentNotify}
          onChange={() => setNotifications({ ...notifications, paymentNotify: !notifications.paymentNotify })}
        />
        <Toggle
          label="Messages from influencers"
          value={notifications.messageNotify}
          onChange={() => setNotifications({ ...notifications, messageNotify: !notifications.messageNotify })}
        />
        <Toggle
          label="Platform updates"
          value={notifications.updatesNotify}
          onChange={() => setNotifications({ ...notifications, updatesNotify: !notifications.updatesNotify })}
        />
      </section>
    </motion.div>
  );
}

/* ================= COMPONENTS ================= */

function Input({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-md bg-[#0B141A] border border-white/10
                   text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
      />
    </div>
  );
}

function Toggle({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-none">
      <span className="text-slate-300">{label}</span>
      <button
        onClick={onChange}
        className={`w-11 h-6 rounded-full relative transition ${
          value ? "bg-cyan-500" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-black rounded-full transition ${
            value ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
