import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminSettings() {
  const navigate = useNavigate();

  /* Platform */
  const [platformName, setPlatformName] = useState("Syncluence");
  const [supportEmail, setSupportEmail] = useState("support@syncluence.com");
  const [platformPublic, setPlatformPublic] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  /* Security */
  const [twoFactor, setTwoFactor] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [ipRestriction, setIpRestriction] = useState(false);

  /* User Controls */
  const [brandRegistration, setBrandRegistration] = useState(true);
  const [influencerRegistration, setInfluencerRegistration] = useState(true);
  const [autoSuspendInactive, setAutoSuspendInactive] = useState(false);

  /* Automation */
  const [weeklyReports, setWeeklyReports] = useState(true);
  const [autoCampaignExpiry, setAutoCampaignExpiry] = useState(true);
  const [commissionRate, setCommissionRate] = useState(10);

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800">
          Platform Settings
        </h2>
        <p className="text-slate-500 mt-1">
          Configure system-wide behavior and administrative controls
        </p>
      </div>

      {/* PLATFORM CONFIG */}
      <Section title="Platform Configuration">
        <Input label="Platform Name" value={platformName} onChange={setPlatformName} />
        <Input label="Support Email" value={supportEmail} onChange={setSupportEmail} />

        <Toggle
          label="Public Platform"
          desc="Allow public access to landing and signup"
          enabled={platformPublic}
          setEnabled={setPlatformPublic}
        />

        <Toggle
          label="Maintenance Mode"
          desc="Temporarily disable access for all users"
          enabled={maintenanceMode}
          setEnabled={setMaintenanceMode}
        />
      </Section>

      {/* SECURITY */}
      <Section title="Security & Access Control">
        <Toggle
          label="Two-Factor Authentication"
          desc="Require OTP for admin login"
          enabled={twoFactor}
          setEnabled={setTwoFactor}
        />

        <Toggle
          label="IP Restriction"
          desc="Allow admin access only from whitelisted IPs"
          enabled={ipRestriction}
          setEnabled={setIpRestriction}
        />

        <Select
          label="Admin Session Timeout"
          value={sessionTimeout}
          onChange={setSessionTimeout}
          options={[15, 30, 60]}
          suffix="minutes"
        />

        <button className="btn-outline">
          Force Logout All Users
        </button>
      </Section>

      {/* USER MANAGEMENT */}
      <Section title="User Registration & Control">
        <Toggle
          label="Brand Registration"
          desc="Allow new brands to sign up"
          enabled={brandRegistration}
          setEnabled={setBrandRegistration}
        />

        <Toggle
          label="Influencer Registration"
          desc="Allow new influencers to sign up"
          enabled={influencerRegistration}
          setEnabled={setInfluencerRegistration}
        />

        <Toggle
          label="Auto-Suspend Inactive Users"
          desc="Suspend users inactive for 90 days"
          enabled={autoSuspendInactive}
          setEnabled={setAutoSuspendInactive}
        />
      </Section>

      {/* AUTOMATION */}
      <Section title="Automation & Revenue">
        <Toggle
          label="Weekly Admin Reports"
          desc="Receive weekly performance reports"
          enabled={weeklyReports}
          setEnabled={setWeeklyReports}
        />

        <Toggle
          label="Auto Campaign Expiry"
          desc="Automatically close expired campaigns"
          enabled={autoCampaignExpiry}
          setEnabled={setAutoCampaignExpiry}
        />

        <div>
          <label className="text-sm font-medium">
            Platform Commission (%)
          </label>
          <input
            type="number"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
            className="mt-1 w-32 border rounded-lg px-3 py-2"
          />
        </div>
      </Section>

      {/* SYSTEM LOGS — link to dedicated Audit Log page */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-center justify-between gap-6">
        <div>
          <h3 className="font-semibold text-slate-800">System Activity Log</h3>
          <p className="text-sm text-slate-500 mt-1">
            View real-time platform events, 7-day charts, and a full filterable activity feed.
          </p>
        </div>
        <button
          onClick={() => navigate("../audit-log")}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600
                     text-white text-sm font-medium hover:bg-indigo-700 transition"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2
                 M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Open Audit Log
        </button>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-white border border-red-200 rounded-xl p-6">
        <h3 className="text-red-600 font-semibold mb-4">
          Danger Zone
        </h3>

        <div className="flex flex-wrap gap-4">
          <button className="btn-danger">
            Lock Platform Immediately
          </button>

          <button className="btn-danger-outline">
            Emergency Maintenance
          </button>
        </div>
      </div>

    </div>
  );
}

/* ================= REUSABLE UI ================= */

function Section({ title, children }) {
  return (
    <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
      <h3 className="font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

function Input({ label, value, onChange }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full max-w-sm border rounded-lg px-4 py-2"
      />
    </div>
  );
}

function Select({ label, value, onChange, options, suffix }) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 border rounded-lg px-3 py-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o} {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}

function Toggle({ label, desc, enabled, setEnabled }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-12 h-6 rounded-full flex items-center transition
          ${enabled ? "bg-indigo-600" : "bg-slate-300"}`}
      >
        <span
          className={`w-5 h-5 bg-white rounded-full shadow transition
            ${enabled ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
