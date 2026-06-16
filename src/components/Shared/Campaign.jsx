import SideBar from "./SideBar";

export default function Campaign({ setScreen }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#020617] via-[#020024] to-[#0f172a]">
      <SideBar role="brand" setScreen={setScreen} />

      <main className="flex-1 p-8 text-white">
        <h1 className="text-3xl font-bold mb-6">Create Campaign</h1>

        <div className="max-w-xl bg-white/10 p-6 rounded-2xl border border-white/20 space-y-4">
          <input className="input" placeholder="Campaign Title" />
          <textarea className="input h-24" placeholder="Description" />
          <input className="input" placeholder="Budget" />
          <input className="input" placeholder="Target Niche" />

          <button
            onClick={() => setScreen("brand")}
            className="w-full py-3 rounded-xl font-semibold
              bg-gradient-to-r from-sky-600 to-cyan-500"
          >
            Save Campaign
          </button>
        </div>
      </main>
    </div>
  );
}
