import { useLocation } from "wouter";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface HeaderProps {
  showClaimLink?: boolean;
}

export function Header({ showClaimLink = false }: HeaderProps) {
  const [, navigate] = useLocation();

  return (
    <header className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/5"
      style={{ background: "rgba(6,6,16,0.85)", backdropFilter: "blur(24px)" }}>
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2.5 group cursor-pointer"
      >
        <div className="relative w-9 h-9 shrink-0">
          <div className="absolute inset-0 rounded-xl transition-all duration-300"
            style={{ background: "rgba(124,58,237,0.18)", border: "1px solid rgba(124,58,237,0.35)" }} />
          <div className="absolute -inset-0.5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
            style={{ background: "rgba(124,58,237,0.5)" }} />
          <img
            src="/logo-nobg.png"
            alt="ShadowPay"
            className="absolute inset-0 w-full h-full object-contain rounded-xl p-0.5"
            style={{ filter: "brightness(0) invert(1) opacity(0.85)" }}
          />
        </div>
        <span className="text-base font-black text-white tracking-tight group-hover:text-violet-200 transition-colors">
          ShadowPay
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-green-400 border border-green-800/50 bg-green-950/30 rounded-full px-2 py-0.5 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Mainnet
        </span>
      </button>

      <div className="flex items-center gap-3">
        {showClaimLink && (
          <button
            onClick={() => navigate("/claim")}
            className="hidden sm:flex items-center gap-1.5 text-xs text-purple-300 hover:text-white border border-purple-800/40 hover:border-purple-600/60 bg-purple-950/20 hover:bg-purple-900/30 rounded-lg px-3 py-1.5 transition-all duration-200"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            My Payments
          </button>
        )}
        <WalletMultiButton />
      </div>
    </header>
  );
}
