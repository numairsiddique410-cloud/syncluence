import { motion } from "framer-motion";
import { useState, useEffect } from "react";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";


export default function InfluencerSettings() {
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: "",
    niche: "",
    followerCount: "",
    instagram: "",
    tiktok: "",
    youtube: "",
    avgLikes: "",
    avgComments: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [notifications, setNotifications] = useState({
    paymentNotify: true,
    campaignNotify: true,
    updatesNotify: false,
    messageNotify: true,
  });

  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        niche: user.influencerDetails?.niche || "",
        followerCount: user.influencerDetails?.followerCount || "",
        instagram: user.influencerDetails?.socialLinks?.instagram || "",
        tiktok: user.influencerDetails?.socialLinks?.tiktok || "",
        youtube: user.influencerDetails?.socialLinks?.youtube || "",
        avgLikes: user.influencerDetails?.stats?.avgLikes || "",
        avgComments: user.influencerDetails?.stats?.avgComments || "",
      });
      if (user.preferences) {
        setNotifications({
          paymentNotify: user.preferences.paymentNotify ?? true,
          campaignNotify: user.preferences.campaignNotify ?? true,
          updatesNotify: user.preferences.updatesNotify ?? false,
          messageNotify: user.preferences.messageNotify ?? true,
        });
      }
    }
  }, [user]);

  const handleChange = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // ================= SAVE PROFILE =================
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", {
        name: form.name,
        influencerDetails: {
          niche: form.niche,
          followerCount: Number(form.followerCount) || 0,
          socialLinks: {
            instagram: form.instagram,
            tiktok: form.tiktok,
            youtube: form.youtube,
          },
          stats: {
            avgLikes: Number(form.avgLikes) || 0,
            avgComments: Number(form.avgComments) || 0,
          },
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

  const handleCancel = () => {
    if (user) {
      setForm({
        name: user.name || "",
        niche: user.influencerDetails?.niche || "",
        followerCount: user.influencerDetails?.followerCount || "",
        instagram: user.influencerDetails?.socialLinks?.instagram || "",
        tiktok: user.influencerDetails?.socialLinks?.tiktok || "",
        youtube: user.influencerDetails?.socialLinks?.youtube || "",
        avgLikes: user.influencerDetails?.stats?.avgLikes || "",
        avgComments: user.influencerDetails?.stats?.avgComments || "",
      });
    }
    toast("Changes discarded");
  };

  return (
    <motion.div
      className="space-y-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-100">Influencer Settings</h2>
        <p className="text-slate-400 mt-1">Manage your profile, payouts, and preferences</p>
      </div>

      {/* PROFILE */}
      <SettingsCard title="Profile Information">
        <Grid>
          <Input label="Display Name" value={form.name} onChange={(v) => handleChange("name", v)} />
          <Input label="Niche" value={form.niche} onChange={(v) => handleChange("niche", v)} placeholder="e.g. Fashion, Tech" />
          <Input label="Follower Count" value={form.followerCount} onChange={(v) => handleChange("followerCount", v)} type="number" />
        </Grid>
      </SettingsCard>

      {/* SOCIAL MEDIA */}
      <SettingsCard title="Social Media Links">
        <Grid>
          <Input label="Instagram" value={form.instagram} onChange={(v) => handleChange("instagram", v)} placeholder="@username" />
          <Input label="TikTok" value={form.tiktok} onChange={(v) => handleChange("tiktok", v)} placeholder="@username" />
          <Input label="YouTube" value={form.youtube} onChange={(v) => handleChange("youtube", v)} placeholder="Channel URL" />
        </Grid>
      </SettingsCard>

      {/* STATS (for AI matching) */}
      <SettingsCard title="Engagement Stats (for AI Matching)">
        <Grid>
          <Input label="Avg. Likes per Post" value={form.avgLikes} onChange={(v) => handleChange("avgLikes", v)} type="number" />
          <Input label="Avg. Comments per Post" value={form.avgComments} onChange={(v) => handleChange("avgComments", v)} type="number" />
        </Grid>
        <p className="text-slate-500 text-xs mt-2">
          Accurate stats improve your AI match score with brands.
        </p>
      </SettingsCard>

      {/* NOTIFICATIONS */}
      <SettingsCard title="Notifications">
        <Toggle
          title="Payment Notifications"
          description="Get notified when payments are processed"
          enabled={notifications.paymentNotify}
          onToggle={() => setNotifications({ ...notifications, paymentNotify: !notifications.paymentNotify })}
        />
        <Toggle
          title="Campaign Invitations"
          description="Alerts for new brand campaigns"
          enabled={notifications.campaignNotify}
          onToggle={() => setNotifications({ ...notifications, campaignNotify: !notifications.campaignNotify })}
        />
        <Toggle
          title="Platform Updates"
          description="Product updates and announcements"
          enabled={notifications.updatesNotify}
          onToggle={() => setNotifications({ ...notifications, updatesNotify: !notifications.updatesNotify })}
        />
      </SettingsCard>

      {/* SECURITY */}
      <SettingsCard title="Security — Change Password">
        <Grid>
          <Input label="Current Password" type="password" value={passwords.currentPassword} onChange={(v) => setPasswords({ ...passwords, currentPassword: v })} />
          <Input label="New Password" type="password" value={passwords.newPassword} onChange={(v) => setPasswords({ ...passwords, newPassword: v })} />
        </Grid>
        <button
          onClick={handleChangePassword}
          disabled={savingPwd}
          className="mt-4 px-5 py-2 rounded-lg bg-cyan-500 text-black font-semibold
                     hover:bg-cyan-400 disabled:opacity-60 transition text-sm"
        >
          {savingPwd ? "Updating..." : "Change Password"}
        </button>
      </SettingsCard>

      {/* SAVE / CANCEL */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-400 disabled:opacity-60 transition"
        >
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </motion.div>
  );
}

/* ================= COMPONENTS ================= */

function SettingsCard({ title, children }) {
  return (
    <div className="bg-slate-900/70 border border-slate-700 rounded-2xl p-6 space-y-6">
      <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      {children}
    </div>
  );
}

function Grid({ children }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>;
}

function Input({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="block text-sm text-slate-400 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700
                   text-slate-100 focus:ring-2 focus:ring-cyan-500 outline-none"
      />
    </div>
  );
}

function Toggle({ title, description, enabled, onToggle }) {
  return (
    <div
      onClick={onToggle}
      className="flex items-center justify-between border border-slate-700 rounded-xl p-4 cursor-pointer hover:bg-slate-800 transition"
    >
      <div>
        <p className="text-slate-100 font-medium">{title}</p>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
      <div className={`w-11 h-6 rounded-full relative transition ${enabled ? "bg-cyan-500" : "bg-slate-600"}`}>
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${enabled ? "left-6" : "left-1"}`} />
      </div>
    </div>
  );
}
