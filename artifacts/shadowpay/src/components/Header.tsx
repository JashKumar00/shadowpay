import { useLocation } from "wouter";
import { WalletButton } from "./WalletButton";

const TICKER_ITEMS = [
  { label: "SOL/USD", value: "$148.20", change: "+2.4%" },
  { label: "24h Vol", value: "$3.2B", change: null },
  { label: "TPS", value: "4,200", change: null },
  { label: "Block Time", value: "400ms", change: null },
  { label: "Validators", value: "1,728", change: null },
  { label: "Fee", value: "0.0000051 SOL", change: null },
];

interface HeaderProps {
  showClaimLink?: boolean;
}

export function Header({ showClaimLink = false }: HeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="relative z-50">
      {/* Main navbar */}
      <header
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: "rgba(3, 3, 10, 0.85)",
          backdropFilter: "blur(30px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 group cursor-pointer">
          <div className="relative w-9 h-9 shrink-0">
            <div
              className="absolute inset-0 rounded-xl transition-all duration-300"
              style={{ background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
            />
            <div
              className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
              style={{ background: "rgba(124,58,237,0.5)" }}
            />
            <img
              src="/logo-nobg.png"
              alt="ShadowPay"
              className="absolute inset-0 w-full h-full object-contain rounded-xl p-0.5"
              style={{ filter: "brightness(0) invert(1) opacity(0.9)" }}
            />
          </div>
          <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            <span className="text-white">Shadow</span>
            <span style={{ color: "var(--purple)" }}>Pay</span>
          </span>
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-semibold"
            style={{
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              color: "var(--green)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Mainnet
          </span>
        </button>

        {/* Right */}
        <div className="flex items-center gap-3">
          {showClaimLink && (
            <button
              onClick={() => navigate("/claim")}
              className="hidden sm:flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all duration-200"
              style={{
                color: "var(--purple-light)",
                border: "1px solid rgba(124,58,237,0.35)",
                background: "rgba(124,58,237,0.08)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.2)";
                (e.currentTarget as HTMLElement).style.color = "white";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.08)";
                (e.currentTarget as HTMLElement).style.color = "var(--purple-light)";
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              My Payments
            </button>
          )}
          <WalletButton />
        </div>
      </header>

      {/* Live ticker */}
      <div
        className="border-b overflow-hidden"
        style={{
          background: "rgba(3,3,10,0.9)",
          backdropFilter: "blur(10px)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center">
          <div
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-r"
            style={{ background: "rgba(124,58,237,0.12)", borderColor: "var(--border)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "var(--green)" }}>
              LIVE
            </span>
          </div>
          <div className="flex overflow-hidden">
            <div
              className="flex gap-6 px-4 py-1.5"
              style={{ width: "max-content", animation: "ticker-slide 30s linear infinite" }}
            >
              {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                <div key={i} className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: "var(--text-secondary)" }}>
                    {item.value}
                  </span>
                  {item.change && (
                    <span className="text-[10px] font-semibold font-mono" style={{ color: "var(--green)" }}>
                      {item.change}
                    </span>
                  )}
                  <span style={{ color: "var(--text-muted)" }} className="ml-2">·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}