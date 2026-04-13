import { useState, useEffect, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { motion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import { Toaster, toast } from "react-hot-toast";
import { Header } from "@/components/Header";
import { Background } from "@/components/Background";
import { Spinner } from "@/components/Spinner";
import { useCreateLink, useMarkLinkFunded } from "@workspace/api-client-react";
import { generateSecret } from "@/lib/stealth";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
type Mode = "send" | "receive";

function buildMinFeeTx(...instructions: any[]) {
  return new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 3000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
    ...instructions
  );
}

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.3 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return inView;
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="glass-card flex items-center gap-2.5 px-4 py-3 rounded-xl">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-muted)" }}>{label}</div>
        <div className="text-xs font-bold font-mono" style={{ color: "var(--text-primary)" }}>{value}</div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      num: "01", icon: "🔗", title: "Generate Link", desc: "Connect wallet, pick amount and token. One click funds the escrow on-chain.",
      badge: "Sender funds escrow", badgeColor: "var(--gold)",
    },
    {
      num: "02", icon: "📤", title: "Share the Link", desc: "Send the link to anyone. The secret stays in the URL fragment — never hits our servers.",
      badge: "No address in URL", badgeColor: "var(--purple-light)",
    },
    {
      num: "03", icon: "🔒", title: "Claim Privately", desc: "Recipient opens link, claims to a stealth address, sweeps to any wallet. On-chain shows only random addresses.",
      badge: "Wallet never revealed", badgeColor: "var(--cyan)",
    },
  ];

  return (
    <section className="relative z-10 w-full max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3" style={{ color: "var(--text-primary)" }}>
          Three Steps to Total Privacy
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Stealth addresses. On-chain anonymity. No data collected.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden cursor-default"
            whileHover={{ y: -8 }}
          >
            <div className="absolute top-2 right-4 text-7xl font-black select-none pointer-events-none"
              style={{ color: "rgba(255,255,255,0.04)", lineHeight: 1 }}>
              {step.num}
            </div>
            <div className="text-3xl mb-3" style={{ animation: `float ${8 + i * 2}s ease-in-out infinite`, display: "inline-block" }}>
              {step.icon}
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{step.desc}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold rounded-full px-3 py-1"
              style={{ background: `${step.badgeColor}18`, border: `1px solid ${step.badgeColor}40`, color: step.badgeColor }}>
              {step.badge}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref as React.RefObject<HTMLElement>);
  return (
    <section ref={ref} className="relative z-10 w-full max-w-4xl mx-auto px-4 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass-card p-8 rounded-2xl text-center">
          <div className="text-6xl font-black font-mono glow-purple mb-1" style={{ color: "var(--purple)" }}>
            {inView ? <CountUp end={400} duration={2} suffix="ms" /> : "400ms"}
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>block time</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Claim + sweep in under 2 seconds</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-2xl text-center"
          style={{ boxShadow: "0 0 40px rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.2)" }}>
          <div className="text-6xl font-black font-mono glow-gold mb-1" style={{ color: "var(--gold)" }}>
            {inView ? <CountUp end={0.001} decimals={3} prefix="$" duration={2} /> : "$0.001"}
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>per transaction</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Cheaper than a text message</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="glass-card p-8 rounded-2xl text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img src="/sol-logo.png" alt="SOL" className="w-10 h-10 rounded-full" />
            <img src="/usdc-logo.png" alt="USDC" className="w-10 h-10 rounded-full" />
          </div>
          <div className="text-base font-bold font-mono mb-1" style={{ color: "var(--cyan)" }}>SOL + USDC</div>
          <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>non-custodial</div>
          <div className="text-xs font-semibold" style={{ color: "var(--green)" }}>Your keys. Your funds.</div>
        </motion.div>
      </div>
    </section>
  );
}

function SuccessModal({ link, onClose }: { link: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  }
  const displayLink = link.replace(/https?:\/\/[^/]+/, "shadowpay.app").replace(/#.*/, "#") + "••••••••";
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{ background: "rgba(3,3,10,0.88)", backdropFilter: "blur(30px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="glass-card p-8 rounded-3xl w-full max-w-xl relative"
        style={{ borderColor: "rgba(124,58,237,0.4)", boxShadow: "0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(6,182,212,0.1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-all"
          style={{ color: "var(--text-muted)", background: "rgba(255,255,255,0.05)" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(90deg)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
        >✕</button>

        <div className="flex flex-col items-center text-center">
          {/* Animated checkmark */}
          <div className="relative w-20 h-20 mb-5">
            <div className="absolute inset-0 rounded-full animate-pulse" style={{ background: "rgba(16,185,129,0.15)" }} />
            <div className="absolute inset-2 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.2)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <svg width="32" height="32" viewBox="0 0 50 50">
                <polyline points="8,25 20,37 42,13" stroke="var(--green)" strokeWidth="4" strokeLinecap="round" fill="none"
                  strokeDasharray="100" strokeDashoffset="0" style={{ animation: "draw-check 0.6s ease forwards" }} />
              </svg>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-2 shimmer-text">Link Generated!</h3>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Your private payment link is ready to share</p>

          {/* Link pill */}
          <div className="w-full px-4 py-3 rounded-xl mb-5 font-mono text-xs text-left break-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>
            {displayLink}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 w-full mb-5">
            <button onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{
                border: "1px solid rgba(124,58,237,0.4)",
                background: copied ? "rgba(16,185,129,0.15)" : "rgba(124,58,237,0.08)",
                color: copied ? "var(--green)" : "var(--purple-light)",
                borderColor: copied ? "rgba(16,185,129,0.4)" : "rgba(124,58,237,0.4)",
              }}
            >
              {copied ? "✓ Copied!" : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={() => { if (navigator.share) navigator.share({ url: link, title: "ShadowPay" }); else handleCopy(); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ border: "1px solid rgba(6,182,212,0.4)", background: "rgba(6,182,212,0.08)", color: "var(--cyan)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--green)" }}>
            <span>🔒</span>
            <span>Stealth address created · Wallet hidden on-chain</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [mode, setMode] = useState<Mode>("send");
  const [amount, setAmount] = useState("0.1");
  const [token, setToken] = useState<"SOL" | "USDC">("SOL");
  const [note, setNote] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingFunds, setSendingFunds] = useState(false);
  const [funded, setFunded] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null);
  const [pendingEscrowKey, setPendingEscrowKey] = useState<string | null>(null);
  const [pendingAmount, setPendingAmount] = useState<number>(0);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [sendStatus, setSendStatus] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);

  const createLink = useCreateLink();
  const markFunded = useMarkLinkFunded();

  useEffect(() => {
    if (!publicKey || !connection) return;
    connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
  }, [publicKey, connection]);

  // 3D tilt on card
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const dx = e.clientX - rect.left - rect.width / 2;
    const dy = e.clientY - rect.top - rect.height / 2;
    cardRef.current.style.transform = `perspective(1000px) rotateX(${-dy * 0.008}deg) rotateY(${dx * 0.008}deg)`;
  }
  function handleMouseLeave() {
    if (!cardRef.current) return;
    cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
  }

  async function fundEscrow(linkId: string, escrowPublicKey: string, amountNum: number) {
    if (!publicKey) return;
    setSendingFunds(true);
    setCancelled(false);
    setError(null);
    setSendStatus("Building transaction…");
    const MAX_ATTEMPTS = 3;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const escrowPubkey = new PublicKey(escrowPublicKey);
        const lamports = Math.round(amountNum * LAMPORTS_PER_SOL);
        setSendStatus(attempt > 1 ? `Retrying (${attempt}/${MAX_ATTEMPTS})…` : "Fetching latest block…");
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
        const transaction = buildMinFeeTx(SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: escrowPubkey, lamports }));
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;
        setSendStatus("Approve in your wallet…");
        const signature = await sendTransaction(transaction, connection, { skipPreflight: true, maxRetries: 3 });
        setSendStatus("Confirming on Solana…");
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
        setSendStatus("Confirmed! Marking link ready…");
        await markFunded.mutateAsync({ linkId, data: { txSignature: signature } });
        setFunded(true);
        setCancelled(false);
        setError(null);
        setSendStatus("");
        setSendingFunds(false);
        if (publicKey) connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
        return;
      } catch (e: any) {
        const msg: string = e?.message || "";
        const isExpiry = msg.toLowerCase().includes("block height exceeded") || msg.toLowerCase().includes("blockhash not found") || msg.toLowerCase().includes("expired");
        const isRejection = e?.name === "WalletSignTransactionError" || msg.toLowerCase().includes("rejected") || msg.toLowerCase().includes("cancelled") || msg.toLowerCase().includes("user rejected") || e?.code === 4001;
        if (isRejection) { setCancelled(true); setError(null); setSendStatus(""); setSendingFunds(false); return; }
        if (isExpiry && attempt < MAX_ATTEMPTS) { setSendStatus(`Block expired — retrying (${attempt + 1}/${MAX_ATTEMPTS})…`); await new Promise((r) => setTimeout(r, 400)); continue; }
        setError(msg || "Failed to fund escrow. Try again.");
        setCancelled(false); setSendStatus(""); setSendingFunds(false); return;
      }
    }
    setSendingFunds(false); setSendStatus("");
  }

  async function handleGenerate() {
    if (!publicKey) { setError("Please connect your wallet first."); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Enter a valid amount."); return; }
    setError(null); setGeneratedLink(null); setFunded(false); setCancelled(false);
    setPendingLinkId(null); setPendingEscrowKey(null);
    try {
      const result = await createLink.mutateAsync({ data: { type: mode, recipientAddress: mode === "receive" ? publicKey.toBase58() : null, amountSol: amountNum, note: note.trim() || null, token } });
      const origin = window.location.origin;
      const secret = mode === "send" ? generateSecret() : null;
      const link = secret ? `${origin}${BASE_URL}/pay/${result.id}#${secret}` : `${origin}${BASE_URL}/pay/${result.id}`;
      setGeneratedLink(link);
      if (mode === "send" && result.escrowPublicKey) {
        setPendingLinkId(result.id); setPendingEscrowKey(result.escrowPublicKey); setPendingAmount(amountNum);
        await fundEscrow(result.id, result.escrowPublicKey, amountNum);
        setShowModal(true);
      } else {
        setShowModal(true);
      }
    } catch (e: any) {
      setError(e?.data?.error || e?.message || "Something went wrong. Please try again.");
    }
  }

  async function handleRetryFunding() {
    if (!pendingLinkId || !pendingEscrowKey) return;
    await fundEscrow(pendingLinkId, pendingEscrowKey, pendingAmount);
  }

  const isPending = createLink.isPending || sendingFunds;

  return (
    <div className="min-h-screen flex flex-col text-white relative" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Toaster position="top-right" toastOptions={{
        style: { background: "var(--bg-elevated)", color: "var(--text-primary)", border: "1px solid var(--border)", fontFamily: "'Space Grotesk', sans-serif" }
      }} />
      <Background />
      <Header showClaimLink />

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center px-4 pt-12 pb-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-semibold"
          style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "var(--green)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Solana Mainnet · 400ms block time · ~$0.001 fee
        </motion.div>

        <motion.h1
          className="text-center font-black leading-[1.1] tracking-tight mb-4 whitespace-nowrap"
          style={{ fontSize: "clamp(36px, 6vw, 72px)" }}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          <span className="text-white">Private </span>
          <span className="shimmer-text">Payment </span>
          <span className="glow-purple" style={{ color: "var(--purple)" }}>Links</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
          className="text-sm text-center max-w-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
          Send SOL in escrow or request payments — all on-chain, near-instant, non-custodial.
        </motion.p>

        {/* Stat pills */}
        {connected && publicKey && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="w-full max-w-xl grid grid-cols-3 gap-2 mb-6">
            <StatPill
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cyan)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
              label="Balance" value={solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "—"} color="var(--cyan)"
            />
            <StatPill
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              label="Network" value="Mainnet" color="var(--green)"
            />
            <StatPill
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
              label="Tx Fee" value="0.0000051 SOL" color="var(--gold)"
            />
          </motion.div>
        )}
      </section>

      {/* PAYMENT CARD */}
      <section className="relative z-10 flex justify-center px-4 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="w-full max-w-xl"
          style={{ transformStyle: "preserve-3d", transition: "transform 0.15s ease" }}
        >
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
            {(["send", "receive"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setGeneratedLink(null); setError(null); setFunded(false); setCancelled(false); setShowModal(false); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                style={mode === m ? {
                  background: "linear-gradient(135deg, var(--purple), var(--cyan))",
                  color: "white",
                  boxShadow: "0 0 20px var(--purple-glow)",
                } : { color: "var(--text-muted)" }}>
                {m === "send" ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Receive</>
                )}
              </button>
            ))}
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(10,10,26,0.75)",
              border: "1px solid var(--border)",
              backdropFilter: "blur(24px)",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Info banner */}
            <div className="px-4 py-2.5 flex items-center gap-2 text-xs"
              style={{ background: "rgba(124,58,237,0.07)", borderBottom: "1px solid rgba(124,58,237,0.12)", borderLeft: "3px solid var(--purple)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shrink-0" />
              <span style={{ color: "rgba(196,181,253,0.7)", fontStyle: "italic" }}>
                {mode === "send" ? "Fund escrow now · recipient claims any time · no time limit" : "Payer sends directly to your wallet · zero custody"}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Token selector */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block font-mono" style={{ color: "var(--text-muted)" }}>Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["SOL", "USDC"] as const).map((t) => (
                    <button key={t} onClick={() => setToken(t)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left relative overflow-hidden"
                      style={token === t ? {
                        background: "rgba(124,58,237,0.12)",
                        borderColor: "var(--purple)",
                        boxShadow: "0 0 20px var(--purple-glow)",
                      } : {
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "var(--border)",
                      }}>
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0"
                        style={{ boxShadow: t === "SOL" ? "0 0 12px rgba(124,58,237,0.55)" : "0 0 12px rgba(6,182,212,0.45)" }}>
                        <img src={t === "SOL" ? "/sol-logo.png" : "/usdc-logo.png"} alt={t} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold" style={{ color: token === t ? "var(--text-primary)" : "var(--text-muted)" }}>{t}</div>
                        <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{t === "SOL" ? "Solana" : "USD Coin"}</div>
                      </div>
                      {token === t && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 animate-[scale-in_0.2s_ease]"
                          style={{ background: "var(--green)", boxShadow: "0 0 10px var(--green-glow)" }}>
                          <svg width="9" height="9" viewBox="0 0 12 12"><polyline points="10 3 4.5 8.5 2 6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block font-mono" style={{ color: "var(--text-muted)" }}>Amount ({token})</label>
                <div className="relative">
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)} min="0.000001" step="0.01"
                    className="w-full rounded-xl px-4 py-4 text-3xl font-black outline-none transition-all pr-20 font-mono"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                      color: "var(--text-primary)",
                      caretColor: "var(--purple)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--purple)", e.target.style.boxShadow = "0 0 0 3px rgba(124,58,237,0.15), 0 0 20px rgba(124,58,237,0.1)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)", e.target.style.boxShadow = "none")}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black font-mono" style={{ color: "var(--purple)" }}>{token}</div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Network fee: ~0.0000051 SOL</span>
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>Total: {(parseFloat(amount) + 0.0000051).toFixed(7)} {token}</span>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest mb-2 block font-mono" style={{ color: "var(--text-muted)" }}>Note (optional)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder={mode === "send" ? "e.g. For dinner last night" : "e.g. Payment for design work"}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(124,58,237,0.4)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>

              {/* Wallet row */}
              {connected && publicKey && (
                <div className="flex items-center gap-2 text-xs rounded-xl px-3 py-2"
                  style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", animation: "pulse-green 3s infinite" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" style={{ animation: "pulse-green 2s infinite" }} />
                  <span className="font-mono truncate" style={{ color: "rgba(52,211,153,0.8)" }}>
                    {mode === "receive" ? "→ " : "← "}
                    {publicKey.toBase58().slice(0, 10)}...{publicKey.toBase58().slice(-6)}
                  </span>
                  <span className="ml-auto text-[10px] font-semibold" style={{ color: "var(--green)" }}>Connected</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-3 py-3"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-sm" style={{ color: "#fca5a5" }}>{error}</span>
                </div>
              )}

              {/* Cancelled */}
              {cancelled && generatedLink && !funded && (
                <div className="flex flex-col gap-2 rounded-xl px-3 py-3"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <span className="text-xs" style={{ color: "rgb(252,211,77)" }}>Transaction cancelled. Fund to activate the link.</span>
                  <button onClick={handleRetryFunding}
                    className="text-xs py-2 rounded-lg font-semibold"
                    style={{ background: "rgba(245,158,11,0.15)", color: "var(--gold)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    Retry Funding
                  </button>
                </div>
              )}

              {/* Send status */}
              {sendStatus && (
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Spinner />
                  <span className="font-mono">{sendStatus}</span>
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={handleGenerate}
                disabled={isPending || !connected}
                className="w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: connected && !isPending ? "linear-gradient(135deg, var(--purple), var(--cyan))" : "rgba(124,58,237,0.3)",
                  boxShadow: connected && !isPending ? "0 4px 30px rgba(124,58,237,0.4)" : "none",
                  height: 56,
                  borderRadius: 14,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                }}
                onMouseEnter={(e) => {
                  if (!isPending && connected) {
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 50px rgba(124,58,237,0.7)";
                    (e.currentTarget as HTMLElement).style.transform = "scale(1.02)";
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 30px rgba(124,58,237,0.4)";
                  (e.currentTarget as HTMLElement).style.transform = "scale(1)";
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.99)")}
                onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.02)")}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-600"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)", backgroundSize: "200% 100%", animation: "shimmer 0.6s ease" }} />
                {isPending ? (
                  <><Spinner /><span>{createLink.isPending ? "Creating link…" : (sendStatus || "Funding escrow…")}</span></>
                ) : !connected ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Connect wallet to continue</>
                ) : mode === "send" ? (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Send {amount || "0"} {token} & Generate Link</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>Generate Payment Request Link</>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works + Stats */}
      <HowItWorksSection />
      <StatsSection />

      {/* FOOTER */}
      <footer className="relative z-10 px-6 py-10" style={{ background: "rgba(3,3,10,0.95)", borderTop: "1px solid var(--border)" }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <img src="/logo-nobg.png" alt="ShadowPay" className="w-6 h-6 opacity-80" style={{ filter: "brightness(0) invert(1)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                <span>Shadow</span><span style={{ color: "var(--purple)" }}>Pay</span>
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>· Private payment links on Solana</span>
            </div>
            <span className="text-sm font-mono" style={{ color: "var(--purple)" }}>shadowpay.replit.app</span>
            <div className="flex items-center gap-3">
              <img src="/sol-logo.png" alt="SOL" className="w-6 h-6 rounded-full" />
              <img src="/usdc-logo.png" alt="USDC" className="w-6 h-6 rounded-full" />
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" }}>Mainnet</span>
            </div>
          </div>
          <div className="text-center text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            Built on Solana · Powered by Stealth Addresses · Non-custodial · No data collected
          </div>
        </div>
      </footer>

      {/* Success Modal */}
      <AnimatePresence>
        {showModal && generatedLink && (funded || mode === "receive") && (
          <SuccessModal link={generatedLink} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}