import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";

const BG_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4";

function NavLink({ label, onClick, external }: { label: string; onClick: () => void; external?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="hidden md:flex items-center gap-1.5 text-sm font-medium text-white/75 hover:text-white transition-colors"
    >
      {label}
      {external ? (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </button>
  );
}

function PillButton({
  children,
  onClick,
  variant = "outline",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "outline" | "solid";
  className?: string;
}) {
  if (variant === "solid") {
    return (
      <button
        onClick={onClick}
        className={`relative inline-flex items-center justify-center rounded-full text-sm font-medium px-7 py-2.5 overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${className}`}
        style={{
          background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
          border: "0.6px solid rgba(255,255,255,0.3)",
          color: "white",
          boxShadow: "0 0 30px rgba(124,58,237,0.5), 0 0 60px rgba(6,182,212,0.2)",
        }}
      >
        <span
          className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px blur-sm"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)" }}
        />
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center rounded-full text-sm font-medium overflow-hidden transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] ${className}`}
      style={{
        border: "0.6px solid rgba(255,255,255,0.35)",
        color: "white",
        padding: "10px 28px",
      }}
    >
      <span className="absolute inset-[1px] rounded-full" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} />
      <span
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px blur-sm"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
      />
      <span className="relative z-10">{children}</span>
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-medium"
      style={{
        background: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse shrink-0" />
      {children}
    </div>
  );
}

function ProblemCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-3 p-6 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="text-lg md:text-xl font-semibold text-white">{title}</h3>
      <p className="text-base md:text-[17px] leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{desc}</p>
    </motion.div>
  );
}

function FeatureRow({ icon, title, desc, accent }: { icon: React.ReactNode; title: string; desc: string; accent: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className="flex items-start gap-4"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
      >
        {icon}
      </div>
      <div>
        <div className="text-base md:text-lg font-semibold text-white mb-1">{title}</div>
        <div className="text-sm md:text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</div>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 120]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-4"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2.5 group"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.5)" }}
          >
            <img src="/logo-nobg.png" alt="" className="w-full h-full object-contain p-1" style={{ filter: "brightness(0) invert(1) opacity(0.9)" }} />
          </div>
          <span className="text-base font-bold">
            <span className="text-white">Shadow</span>
            <span style={{ color: "#7C3AED" }}>Pay</span>
          </span>
        </button>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-7">
          <NavLink label="The Problem"  onClick={() => document.getElementById("privacy")?.scrollIntoView({ behavior: "smooth" })} />
          <NavLink label="The Solution" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} />
          <NavLink label="Developers"   onClick={() => window.open("https://github.com/JashKumar00/shadowpay", "_blank")} external />
        </div>

        {/* CTA */}
        <PillButton variant="solid" onClick={() => navigate("/app")} className="text-sm px-6 py-2">
          Open App →
        </PillButton>
      </nav>

      {/* ── HERO ── */}
      <div ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Video BG */}
        <video
          ref={videoRef}
          src={BG_VIDEO}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
          style={{ opacity: videoLoaded ? 1 : 0 }}
        />
        {/* Overlays */}
        <div className="absolute inset-0 bg-black/60" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(124,58,237,0.18) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, black)" }}
        />

        {/* Content */}
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-12 gap-7 max-w-5xl mx-auto"
        >
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Badge>Private payments live on Solana Mainnet</Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="font-bold leading-[1.12] tracking-tight"
            style={{ fontSize: "clamp(52px, 8vw, 110px)", maxWidth: 960 }}
          >
            <span
              style={{
                backgroundImage: "linear-gradient(144.5deg, #ffffff 28%, #a78bfa 65%, transparent 115%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Pay Anyone.
            </span>
            <br />
            <span
              style={{
                backgroundImage: "linear-gradient(144.5deg, #ffffff 28%, #06B6D4 75%, transparent 115%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Leave No Trace.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="text-base md:text-lg lg:text-xl leading-relaxed font-normal max-w-2xl"
            style={{ color: "rgba(255,255,255,0.62)" }}
          >
            Every on-chain transaction is public by default — anyone can trace who paid whom, how much, and when.
            ShadowPay flips this with stealth address escrow: the blockchain shows only{" "}
            <span className="text-white/80 font-medium font-mono">escrow → random_address</span>.
            Your identity stays yours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          >
            <PillButton variant="solid" onClick={() => navigate("/app")} className="px-8 py-3 text-base gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Open App
            </PillButton>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-2"
          >
            {[
              { icon: "⚡", label: "400ms settlement" },
              { icon: "🔒", label: "Non-custodial" },
              { icon: "🌑", label: "Stealth addresses" },
              { icon: "💸", label: "~$0.001 fees" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-sm md:text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* ── THE PROBLEM ── */}
      <section id="privacy" className="relative bg-black py-24 px-6 md:px-16">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="text-sm font-semibold uppercase tracking-widest mb-4 font-mono" style={{ color: "rgba(124,58,237,0.8)" }}>
              The Problem
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5">
              Crypto is public.{" "}
              <span style={{ color: "rgba(255,255,255,0.35)" }}>Your finances shouldn't be.</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              Every transaction on Solana is permanently recorded and publicly viewable. Anyone with your wallet address can see your entire financial history.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ProblemCard
              icon="🔍"
              title="Anyone can trace you"
              desc="Paste a wallet address into any explorer and see every payment — amounts, timestamps, counterparties — in full."
            />
            <ProblemCard
              icon="🏷️"
              title="Addresses get labeled"
              desc="Exchanges, analytics firms, and governments tag wallets. Once labeled, every future transaction is deanonymized."
            />
            <ProblemCard
              icon="🎯"
              title="You become a target"
              desc="Visible wealth on-chain invites phishing, social engineering, and worse. Financial privacy is personal safety."
            />
          </div>
        </div>
      </section>

      {/* ── THE SOLUTION ── */}
      <section id="features" className="relative py-24 px-6 md:px-16" style={{ background: "linear-gradient(180deg, #000 0%, #06010f 100%)" }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)" }}
        />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="text-sm font-semibold uppercase tracking-widest mb-4 font-mono" style={{ color: "rgba(6,182,212,0.8)" }}>
              The Solution
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-5">
              Stealth links. On-chain privacy.
            </h2>
            <p className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
              ShadowPay generates a private payment link with a one-time secret embedded only in the URL fragment — it never touches any server.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Feature list */}
            <div className="flex flex-col gap-7">
              <FeatureRow
                accent="#7C3AED"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                title="Secret lives in the URL fragment"
                desc="The #fragment is never sent to any server — not ours, not Solana's. Only the sender and recipient ever know the secret."
              />
              <FeatureRow
                accent="#06B6D4"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>}
                title="On-chain shows nothing useful"
                desc="The blockchain records only: escrow → random_address. No names, no amounts linked to your identity, no pattern."
              />
              <FeatureRow
                accent="#F59E0B"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>}
                title="Instant settlement on Solana"
                desc="400ms block times. ~$0.001 fees. Send SOL or USDC. No bridges, no L2, no waiting — just fast, cheap, private."
              />
              <FeatureRow
                accent="#10B981"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/></svg>}
                title="Non-custodial, always"
                desc="ShadowPay never holds your funds. Escrow is a program-derived address — only you can authorize the release."
              />
            </div>

            {/* How it works card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              className="rounded-2xl p-6 flex flex-col gap-4"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(124,58,237,0.25)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="text-xs font-semibold uppercase tracking-widest font-mono mb-2" style={{ color: "rgba(124,58,237,0.7)" }}>
                How it works
              </div>
              {[
                { step: "01", title: "Generate a link", desc: "Connect wallet → pick SOL or USDC → set amount → click Send or Receive.", color: "#7C3AED" },
                { step: "02", title: "Share privately", desc: "Copy the link. The secret in the #fragment derives a stealth keypair — nothing is stored.", color: "#06B6D4" },
                { step: "03", title: "Recipient claims", desc: "Recipient opens the link, the escrow auto-sweeps to their wallet. On-chain: just escrow → address.", color: "#10B981" },
              ].map((s) => (
                <div key={s.step} className="flex gap-3 items-start">
                  <div
                    className="text-[10px] font-black font-mono w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${s.color}18`, color: s.color, border: `1px solid ${s.color}30` }}
                  >
                    {s.step}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white mb-0.5">{s.title}</div>
                    <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="relative bg-black py-16 px-6 md:px-16 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: "400ms", label: "Block time" },
            { val: "$0.001", label: "Avg. tx fee" },
            { val: "0", label: "Servers touched" },
            { val: "100%", label: "Non-custodial" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl lg:text-6xl font-black mb-2" style={{ color: "white" }}>{s.val}</div>
              <div className="text-sm md:text-base font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative bg-black py-28 px-6 md:px-16 text-center overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(124,58,237,0.15) 0%, transparent 70%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <Badge>Live on Solana Mainnet · Zero setup</Badge>
          <h2
            className="text-5xl md:text-6xl lg:text-7xl font-bold max-w-3xl"
            style={{
              backgroundImage: "linear-gradient(144.5deg, #ffffff 28%, #a78bfa 70%, #06B6D4 110%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Privacy is a right, not a feature.
          </h2>
          <p className="text-base md:text-lg lg:text-xl max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            Connect your wallet and start sending private payment links in under 30 seconds. No account. No KYC. No trace.
          </p>
          <PillButton variant="solid" onClick={() => navigate("/app")} className="px-10 py-3.5 text-base">
            Open ShadowPay →
          </PillButton>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-black border-t px-6 md:px-16 py-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}>
            <img src="/logo-nobg.png" alt="" className="w-full h-full object-contain p-0.5" style={{ filter: "brightness(0) invert(1) opacity(0.8)" }} />
          </div>
          <span className="text-sm font-semibold">
            <span className="text-white">Shadow</span>
            <span style={{ color: "#7C3AED" }}>Pay</span>
          </span>
          <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.25)" }}>
            Private payments on Solana
          </span>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => window.open("https://github.com/JashKumar00/shadowpay", "_blank")}
            className="text-xs font-medium transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            GitHub
          </button>
          <button
            onClick={() => navigate("/app")}
            className="text-xs font-medium transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Open App
          </button>
          <button
            onClick={() => navigate("/donate")}
            className="text-xs font-medium transition-colors hover:text-white"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Donate
          </button>
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          © 2026 ShadowPay · Open source · Non-custodial
        </div>
      </footer>
    </div>
  );
}
