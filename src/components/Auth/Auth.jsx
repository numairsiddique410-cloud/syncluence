import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ================= ANIMATION VARIANTS ================= */

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const scaleUp = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

/* ================= SVG ICONS ================= */

const Icons = {
  AI: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  Chart: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  Chat: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  ChevronDown: () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  ArrowRight: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  ),
};

/* ================= ANIMATED SECTION WRAPPER ================= */

function AnimatedSection({ children, className = "", delay = 0, variant = fadeUp }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={variant}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedStagger({ children, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================= MAIN COMPONENT ================= */

export default function Auth() {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setShowDropdown(false);
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#0C1F26] text-white overflow-x-hidden">

      {/* ================= TOP INFO BAR ================= */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-[#E6F4EF] text-[#0C1F26] text-center py-2 text-sm font-medium"
      >
        The future of commerce is powered by word-of-mouth
      </motion.div>

      {/* ================= NAVBAR ================= */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`sticky top-0 z-50 flex justify-between items-center px-4 sm:px-8 lg:px-10 py-4 border-b border-white/10
                    transition-all duration-300 ${scrolled ? "bg-[#0C1F26]/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}
      >
        <div
          className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-teal-300 via-cyan-400 to-blue-400
                     bg-clip-text text-transparent cursor-pointer select-none"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Syncluence
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-gray-300">
          {["Platform", "Why Us", "Stories", "Company"].map((label, i) => (
            <button
              key={label}
              onClick={() => scrollTo(["features", "stats", "testimonials", "footer"][i])}
              className="hover:text-white transition relative group"
            >
              {label}
              {label === "Stories" && (
                <span className="ml-1.5 bg-lime-200 text-black text-xs px-1.5 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              )}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop: sign in + get started */}
          <button
            onClick={() => navigate("/influencer/auth")}
            className="hidden md:block px-4 py-2 text-sm text-gray-300 hover:text-white transition"
          >
            Sign in
          </button>

          <div className="relative hidden md:block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="px-4 sm:px-5 py-2 rounded-md font-semibold text-white text-sm
                         bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-400 hover:to-blue-400
                         transition shadow-lg flex items-center gap-2"
            >
              Get Started
              <motion.span animate={{ rotate: showDropdown ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <Icons.ChevronDown />
              </motion.span>
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute right-0 mt-3 w-64 bg-white text-black rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Login</p>
                  </div>
                  {[
                    { label: "Login as Brand", sub: "Manage campaigns & creators", path: "/brand/auth", letter: "B", bg: "bg-sky-100", text: "text-sky-600" },
                    { label: "Login as Creator", sub: "Find brand deals & earn", path: "/influencer/auth", letter: "C", bg: "bg-cyan-100", text: "text-cyan-600" },
                    { label: "Admin Portal", sub: "Platform management", path: "/admin/auth", letter: "A", bg: "bg-indigo-100", text: "text-indigo-600" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { setShowDropdown(false); navigate(item.path); }}
                      className="w-full px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-left transition"
                    >
                      <span className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center ${item.text} font-bold text-sm`}>
                        {item.letter}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.sub}</p>
                      </div>
                    </button>
                  ))}
                  <div className="border-t bg-gray-50 px-4 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Create Account</p>
                    <div className="flex gap-2">
                      <button onClick={() => { setShowDropdown(false); navigate("/brand/auth"); }}
                        className="flex-1 py-2 bg-sky-500 text-white rounded-lg text-xs font-semibold hover:bg-sky-600 transition">
                        Brand
                      </button>
                      <button onClick={() => { setShowDropdown(false); navigate("/influencer/auth"); }}
                        className="flex-1 py-2 bg-cyan-500 text-white rounded-lg text-xs font-semibold hover:bg-cyan-600 transition">
                        Creator
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden text-gray-300 hover:text-white p-1"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenu
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu dropdown */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#0C1F26]/98 border-b border-white/10 overflow-hidden sticky top-[65px] z-40"
          >
            <div className="px-5 py-4 space-y-1">
              {["Platform", "Why Us", "Stories", "Company"].map((label, i) => (
                <button key={label} onClick={() => scrollTo(["features", "stats", "testimonials", "footer"][i])}
                  className="w-full text-left py-2.5 text-gray-300 hover:text-white text-sm transition">
                  {label}
                </button>
              ))}
              <div className="border-t border-white/10 pt-3 mt-3 flex flex-col gap-2">
                <button onClick={() => { navigate("/influencer/auth"); setMobileMenu(false); }}
                  className="py-2.5 text-sm text-gray-300 hover:text-white text-left transition">
                  Sign in
                </button>
                <div className="flex gap-2">
                  <button onClick={() => { navigate("/brand/auth"); setMobileMenu(false); }}
                    className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition">
                    Brand
                  </button>
                  <button onClick={() => { navigate("/influencer/auth"); setMobileMenu(false); }}
                    className="flex-1 py-2.5 bg-cyan-500 text-black rounded-lg text-sm font-semibold hover:bg-cyan-400 transition">
                    Creator
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(showDropdown || mobileMenu) && (
        <div className="fixed inset-0 z-30" onClick={() => { setShowDropdown(false); setMobileMenu(false); }} />
      )}

      {/* ================= HERO ================= */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 pt-14 pb-12 sm:pt-24 sm:pb-20 overflow-hidden">

        {/* Animated background orbs */}
        <motion.div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full
                     bg-gradient-to-br from-cyan-500/10 to-blue-600/10 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 -left-20 w-[400px] h-[400px] rounded-full
                     bg-gradient-to-br from-teal-500/8 to-emerald-500/8 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative"
        >
          {/* Badge */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-7"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-gray-300">AI-Powered Influencer Matching</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-5xl lg:text-6xl font-semibold leading-tight mb-6"
          >
            Influencer commerce
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              built for authentic growth
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-xl text-base sm:text-lg text-gray-300 mb-8 sm:mb-10 leading-relaxed"
          >
            Discover creators, manage campaigns, detect fraud, and track performance
            in one unified AI-powered platform.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-wrap gap-4"
          >
            <motion.button
              onClick={() => navigate("/brand/auth")}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3 rounded-lg font-semibold text-white
                         bg-gradient-to-r from-cyan-500 to-blue-500
                         hover:from-cyan-400 hover:to-blue-400
                         transition shadow-lg shadow-cyan-500/20 text-sm flex items-center gap-2"
            >
              Start as Brand
              <Icons.ArrowRight />
            </motion.button>
            <motion.button
              onClick={() => navigate("/influencer/auth")}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="px-7 py-3 rounded-lg font-semibold border border-white/30
                         text-white hover:bg-white/10 transition text-sm"
            >
              Join as Creator
            </motion.button>
            <motion.button
              onClick={() => scrollTo("features")}
              whileHover={{ y: 2 }}
              className="px-7 py-3 rounded-lg font-semibold text-gray-400
                         hover:text-white transition text-sm"
            >
              See how it works ↓
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={stagger}
            className="grid grid-cols-2 sm:flex sm:flex-wrap gap-6 sm:gap-10 mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-white/10"
          >
            {[
              { value: "10K+", label: "Active Creators" },
              { value: "2.4K+", label: "Brand Partners" },
              { value: "$5.2M+", label: "Creator Earnings" },
              { value: "98%", label: "Fraud Detection Rate" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                variants={fadeUp}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <p className="text-3xl font-bold text-cyan-300">{s.value}</p>
                <p className="text-sm text-gray-400 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ================= FEATURE CARDS ================= */}
      <section id="features" className="pb-24 overflow-hidden">
        <AnimatedStagger className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 mb-10 text-center">
          <motion.h2 variants={fadeUp} transition={{ duration: 0.6 }} className="text-3xl font-semibold mb-2">
            Everything you need, in one place
          </motion.h2>
          <motion.p variants={fadeUp} transition={{ duration: 0.6, delay: 0.05 }} className="text-gray-400">
            From discovery to payment — all automated.
          </motion.p>
        </AnimatedStagger>

        <div className="relative">
          <AnimatedStagger className="flex gap-4 sm:gap-6 px-4 sm:px-8 lg:px-10 overflow-x-auto pb-4 snap-x snap-mandatory">
            {[
              { Icon: Icons.AI,     title: "AI Matchmaking",   desc: "Our AI scores influencer-brand compatibility using niche match, engagement, and fraud analysis.", color: "from-cyan-500/20 to-blue-500/20", accent: "text-cyan-400", border: "hover:border-cyan-500/40" },
              { Icon: Icons.Shield, title: "Fraud Detection",  desc: "Z-score anomaly detection flags fake followers and bot engagement automatically.", color: "from-emerald-500/20 to-teal-500/20", accent: "text-emerald-400", border: "hover:border-emerald-500/40" },
              { Icon: Icons.Lock,   title: "Escrow Payments",  desc: "Stripe-powered escrow holds funds securely until campaign milestones are met.", color: "from-violet-500/20 to-purple-500/20", accent: "text-violet-400", border: "hover:border-violet-500/40" },
              { Icon: Icons.Chart,  title: "Live Analytics",   desc: "Real-time ROI tracking, campaign performance, and earnings dashboards.", color: "from-amber-500/20 to-orange-500/20", accent: "text-amber-400", border: "hover:border-amber-500/40" },
              { Icon: Icons.Chat,   title: "In-App Chat",      desc: "Negotiate deliverables, timelines, and contracts directly on the platform.", color: "from-rose-500/20 to-pink-500/20", accent: "text-rose-400", border: "hover:border-rose-500/40" },
            ].map(({ Icon, title, desc, color, accent, border }) => (
              <motion.div
                key={title}
                variants={scaleUp}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className={`min-w-[260px] bg-gradient-to-br ${color} border border-white/10 ${border}
                            rounded-2xl p-6 backdrop-blur transition-colors duration-300 cursor-default`}
              >
                <div className={`w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center mb-4 ${accent}`}>
                  <Icon />
                </div>
                <h4 className="font-semibold text-white mb-2">{title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </AnimatedStagger>
        </div>
      </section>

      {/* ================= STATS SECTION ================= */}
      <section id="stats" className="bg-[#F4FAF8] py-16 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 text-center">
          <AnimatedSection className="mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-semibold text-[#0C1F26] mb-4">
              The future of commerce is powered by word-of-mouth
            </h2>
            <p className="text-gray-500">
              Brands and creators are choosing authentic relationships over ads.
            </p>
          </AnimatedSection>

          <AnimatedStagger className="grid md:grid-cols-3 gap-8">
            {[
              { value: "88%", text: "of people trust recommendations from people they know", cta: "Start as Brand", onClick: () => navigate("/brand/auth") },
              { value: "$5.78", text: "earned for every $1 spent on influencer marketing", cta: "See ROI Calculator", onClick: () => scrollTo("testimonials") },
              { value: "73%", text: "say user-generated content increases purchase confidence", cta: "Join as Creator", onClick: () => navigate("/influencer/auth") },
            ].map((card) => (
              <motion.div
                key={card.value}
                variants={scaleUp}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.12)" }}
                className="bg-white rounded-2xl p-10 shadow-lg text-left group cursor-default transition-shadow duration-300"
              >
                <h3 className="text-5xl font-bold text-[#0C1F26] mb-4">{card.value}</h3>
                <p className="text-gray-700 text-lg mb-6">{card.text}</p>
                <button
                  onClick={card.onClick}
                  className="text-sm font-semibold text-cyan-600 hover:text-cyan-500 transition
                             flex items-center gap-1.5 group-hover:gap-2.5"
                >
                  {card.cta}
                  <Icons.ArrowRight />
                </button>
              </motion.div>
            ))}
          </AnimatedStagger>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="bg-[#0F2A33] py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10">
          <AnimatedSection className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-semibold">How it works</h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Brands */}
            <AnimatedSection variant={slideLeft}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-lg font-bold">B</span>
                <h3 className="text-xl font-semibold">For Brands</h3>
              </div>
              <div className="space-y-5">
                {[
                  "Create your campaign with budget & target niche",
                  "AI recommends verified influencers with match scores",
                  "Accept applications, negotiate via in-app chat",
                  "Pay securely via escrow — release on completion",
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-gray-300">{text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate("/brand/auth")}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 px-6 py-2.5 rounded-lg bg-sky-500 text-white font-semibold text-sm hover:bg-sky-400 transition flex items-center gap-2"
              >
                Create Brand Account
                <Icons.ArrowRight />
              </motion.button>
            </AnimatedSection>

            {/* For Creators */}
            <AnimatedSection variant={slideRight}>
              <div className="flex items-center gap-3 mb-8">
                <span className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-lg font-bold">C</span>
                <h3 className="text-xl font-semibold">For Creators</h3>
              </div>
              <div className="space-y-5">
                {[
                  "Set up your profile with niche & engagement stats",
                  "Browse active campaigns from verified brands",
                  "Apply, chat, and finalize your deliverables",
                  "Earn securely — funds released on campaign approval",
                ].map((text, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <span className="w-7 h-7 rounded-full bg-cyan-500 text-black text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-gray-300">{text}</p>
                  </motion.div>
                ))}
              </div>
              <motion.button
                onClick={() => navigate("/influencer/auth")}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 px-6 py-2.5 rounded-lg bg-cyan-500 text-black font-semibold text-sm hover:bg-cyan-400 transition flex items-center gap-2"
              >
                Join as Creator
                <Icons.ArrowRight />
              </motion.button>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS ================= */}
      <section id="testimonials" className="bg-[#0F2A33] border-t border-white/10 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 text-center">
          <AnimatedSection className="mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-4xl font-semibold mb-4">Trusted by modern brands</h2>
            <p className="text-gray-400">See what brands and creators are saying about Syncluence.</p>
          </AnimatedSection>

          <AnimatedStagger className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { quote: "Syncluence helped us scale influencer campaigns effortlessly. The AI matching saved us 10+ hours per campaign.", name: "Ayesha Khan", role: "Brand Manager, FashionX" },
              { quote: "Everything from creator discovery to analytics is extremely smooth. The fraud detection alone is worth it.", name: "Daniel Lee", role: "Founder, TechStartup" },
              { quote: "One platform replaced multiple tools for our team. The escrow payments give us total peace of mind.", name: "Sarah Ahmed", role: "Marketing Lead, BeautyBrand" },
            ].map((t) => (
              <motion.div
                key={t.name}
                variants={scaleUp}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, borderColor: "rgba(255,255,255,0.25)" }}
                className="bg-white/5 p-6 rounded-2xl border border-white/10 transition-colors duration-300 cursor-default"
              >
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.3 }}
                      className="text-amber-400 text-base"
                    >
                      ★
                    </motion.span>
                  ))}
                </div>
                <p className="text-gray-200 mb-5 text-sm leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatedStagger>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative bg-gradient-to-br from-cyan-900 to-[#0C1F26] py-28 overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
        />
        <motion.div
          className="absolute top-10 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-3xl mx-auto px-4 sm:px-8 lg:px-10 text-center relative">
          <AnimatedSection>
            <motion.h2
              className="text-2xl sm:text-4xl font-semibold mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              Ready to grow with authentic influence?
            </motion.h2>
            <motion.p
              className="text-gray-300 mb-10 text-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Join thousands of brands and creators already using Syncluence.
            </motion.p>
            <motion.div
              className="flex justify-center flex-wrap gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.button
                onClick={() => navigate("/brand/auth")}
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-lg font-semibold text-white bg-sky-500 hover:bg-sky-400 transition shadow-lg shadow-sky-500/25 flex items-center gap-2"
              >
                Start as Brand — Free
                <Icons.ArrowRight />
              </motion.button>
              <motion.button
                onClick={() => navigate("/influencer/auth")}
                whileHover={{ scale: 1.04, y: -3 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 rounded-lg font-semibold border border-white/40 text-white hover:bg-white/10 transition"
              >
                Join as Creator
              </motion.button>
            </motion.div>
          </AnimatedSection>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer id="footer" className="bg-[#08181E] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-10 py-10 sm:py-14 grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 text-sm text-gray-400">
          <div>
            <h3 className="text-white font-semibold mb-4">Syncluence</h3>
            <p className="mb-4 leading-relaxed">The AI-powered influencer commerce platform for authentic growth.</p>
            <div className="flex gap-3 mt-4">
              {["Twitter", "LinkedIn", "Instagram"].map((s) => (
                <motion.button
                  key={s}
                  whileHover={{ y: -2, backgroundColor: "rgba(255,255,255,0.2)" }}
                  className="px-3 py-1 bg-white/10 rounded text-xs transition"
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => scrollTo("features")} className="hover:text-white transition">Platform</button></li>
              <li><button onClick={() => navigate("/brand/auth")} className="hover:text-white transition">For Brands</button></li>
              <li><button onClick={() => navigate("/influencer/auth")} className="hover:text-white transition">For Creators</button></li>
              <li><button onClick={() => navigate("/admin/auth")} className="hover:text-white transition">Admin</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Features</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => scrollTo("features")} className="hover:text-white transition">AI Matching</button></li>
              <li><button onClick={() => scrollTo("features")} className="hover:text-white transition">Fraud Detection</button></li>
              <li><button onClick={() => scrollTo("features")} className="hover:text-white transition">Escrow Payments</button></li>
              <li><button onClick={() => scrollTo("features")} className="hover:text-white transition">Analytics</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><button onClick={() => scrollTo("stats")} className="hover:text-white transition">About</button></li>
              <li><button onClick={() => scrollTo("testimonials")} className="hover:text-white transition">Stories</button></li>
              <li><button className="hover:text-white transition">Blog</button></li>
              <li><button className="hover:text-white transition">Privacy Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="text-center py-5 text-xs text-gray-500 border-t border-white/5">
          &copy; {new Date().getFullYear()} Syncluence. All rights reserved.
        </div>
      </footer>

    </div>
  );
}
