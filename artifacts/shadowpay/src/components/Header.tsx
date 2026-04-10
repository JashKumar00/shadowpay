import { Link } from "wouter";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Logo } from "./Logo";

interface HeaderProps {
  showClaimLink?: boolean;
}

export function Header({ showClaimLink = false }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2.5 group">
        <Logo size={30} />
        <span className="text-lg font-bold text-white">ShadowPay</span>
        <span className="text-xs text-green-400 border border-green-800/60 rounded-full px-2 py-0.5 hidden sm:inline">
          Mainnet
        </span>
      </Link>
      <div className="flex items-center gap-3">
        {showClaimLink && (
          <Link href="/claim" className="text-sm text-purple-300 hover:text-purple-100 transition-colors">
            My Payments →
          </Link>
        )}
        <WalletMultiButton style={{
          background: "rgba(124, 58, 237, 0.9)",
          borderRadius: "10px",
          fontSize: "14px",
          padding: "8px 16px",
          height: "auto",
        }} />
      </div>
    </header>
  );
}
