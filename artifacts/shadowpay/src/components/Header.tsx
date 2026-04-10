import { Link } from "wouter";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

interface HeaderProps {
  showClaimLink?: boolean;
}

export function Header({ showClaimLink = false }: HeaderProps) {
  return (
    <header className="relative z-10 flex items-center justify-between px-5 py-3.5 border-b border-white/5"
      style={{ background: "rgba(6,6,16,0.8)", backdropFilter: "blur(20px)" }}>
      <Link href="/" className="flex items-center gap-2.5 group">
        <div className="relative w-8 h-8">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600 to-purple-800 group-hover:from-violet-500 group-hover:to-purple-700 transition-all" />
          <div className="absolute inset-0 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth="0.5" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ boxShadow: "0 0 15px rgba(124,58,237,0.7)" }} />
        </div>
        <span className="text-base font-bold text-white tracking-tight">ShadowPay</span>
        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-green-400 border border-green-800/50 bg-green-950/30 rounded-full px-2 py-0.5 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          Mainnet
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {showClaimLink && (
          <Link href="/claim"
            className="hidden sm:flex items-center gap-1.5 text-xs text-purple-300 hover:text-white border border-purple-800/40 hover:border-purple-600/60 bg-purple-950/20 hover:bg-purple-900/30 rounded-lg px-3 py-1.5 transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            My Payments
          </Link>
        )}
        <WalletMultiButton />
      </div>
    </header>
  );
}
