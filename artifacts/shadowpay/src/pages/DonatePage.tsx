import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Background } from "@/components/Background";

const EVM_ADDRESS = "0x44b3A9D938fbA6f0E4D545e1FC35dF3767d46eF4";
const SOL_ADDRESS = "FifvwoGhAtiNgJFjd86JHBVWZhQVwBC3W2rvMfVr53U7";

function CopyButton({ text, color }: { text: string; color: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
      style={{
        background: copied ? "rgba(16,185,129,0.15)" : `${color}18`,
        border: `1px solid ${copied ? "rgba(16,185,129,0.5)" : `${color}55`}`,
        color: copied ? "var(--green)" : color,
      }}
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Address
        </>
      )}
    </button>
  );
}

function AddressPill({ address, color }: { address: string; color: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      title="Click to copy"
      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all duration-200 group"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${copied ? "rgba(16,185,129,0.5)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <span
        className="font-mono text-xs flex-1 truncate transition-colors"
        style={{ color: copied ? "var(--green)" : "var(--text-secondary)" }}
      >
        {copied ? "✓ Copied!" : address}
      </span>
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="shrink-0 opacity-40 group-hover:opacity-80 transition-opacity"
        style={{ color }}
      >
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

function DonateCard({
  title,
  label,
  address,
  qrSrc,
  accentColor,
  chains,
  delay,
}: {
  title: string;
  label: string;
  address: string;
  qrSrc: string;
  accentColor: string;
  chains?: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex-1 min-w-0 rounded-2xl overflow-hidden"
      style={{
        background: "rgba(10,10,26,0.75)",
        backdropFilter: "blur(24px)",
        border: `1px solid ${accentColor}30`,
        boxShadow: `0 0 40px ${accentColor}12`,
      }}
      whileHover={{ y: -4, boxShadow: `0 8px 60px ${accentColor}25` } as any}
    >
      <div className="p-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />

      <div className="p-6 flex flex-col items-center gap-4">
        {chains && <div className="flex items-center gap-2 mb-1">{chains}</div>}

        <div className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: accentColor }}>
          {label}
        </div>

        <h3 className="text-base font-bold text-center" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>

        <div
          className="rounded-xl overflow-hidden p-3"
          style={{ background: "white", boxShadow: `0 0 30px ${accentColor}30` }}
        >
          <img src={qrSrc} alt={`${title} QR`} className="w-48 h-48 object-contain" />
        </div>

        <AddressPill address={address} color={accentColor} />
        <CopyButton text={address} color={accentColor} />
      </div>
    </motion.div>
  );
}

const ChainIcon = ({ label, color }: { label: string; color: string }) => (
  <div
    className="flex items-center justify-center rounded-full text-[10px] font-black font-mono w-7 h-7 shrink-0"
    style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
  >
    {label}
  </div>
);

export default function DonatePage() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col text-white relative" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      <Background />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="px-6 py-4 flex items-center" style={{ borderBottom: "1px solid var(--border)" }}>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
              (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to ShadowPay
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="text-4xl mb-4">☕</div>
            <h1 className="text-4xl font-black mb-3">
              <span className="text-white">Support </span>
              <span className="shimmer-text">ShadowPay</span>
            </h1>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Buy me a coffee with crypto — every contribution keeps privacy payments alive on Solana.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="w-full max-w-2xl flex flex-col sm:flex-row gap-5">
            <DonateCard
              title="EVM Compatible Chains"
              label="All Chains"
              address={EVM_ADDRESS}
              qrSrc="/qr-allchain.png"
              accentColor="#7C3AED"
              delay={0.1}
              chains={
                <>
                  {[
                    { label: "E", color: "#627EEA" },
                    { label: "B", color: "#F3BA2F" },
                    { label: "M", color: "#8247E5" },
                    { label: "A", color: "#28A0F0" },
                    { label: "O", color: "#FF0420" },
                  ].map((c) => (
                    <ChainIcon key={c.label} label={c.label} color={c.color} />
                  ))}
                  <span className="text-[10px] font-mono ml-1" style={{ color: "var(--text-muted)" }}>ETH · BNB · MATIC · ARB · OP</span>
                </>
              }
            />

            <DonateCard
              title="Solana Chain"
              label="SOL / USDC"
              address={SOL_ADDRESS}
              qrSrc="/qr-solana.png"
              accentColor="#06B6D4"
              delay={0.2}
              chains={
                <img src="/sol-logo.png" alt="Solana" className="w-7 h-7 rounded-full" style={{ boxShadow: "0 0 12px rgba(6,182,212,0.5)" }} />
              }
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-xs text-center max-w-md"
            style={{ color: "var(--text-muted)" }}
          >
            Scan the QR code or click the address to copy. Send any amount on the correct chain. Thank you for supporting open-source crypto tools. 🙏
          </motion.p>
        </div>
      </div>
    </div>
  );
}
