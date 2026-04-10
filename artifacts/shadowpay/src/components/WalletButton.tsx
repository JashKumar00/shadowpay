import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

function shorten(address: string) {
  return address.slice(0, 4) + ".." + address.slice(-4);
}

export function WalletButton() {
  const { connected, connecting, publicKey, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        disabled={connecting}
        className="flex items-center gap-2 text-sm font-semibold text-white rounded-xl px-4 py-2 transition-all duration-200 active:scale-95"
        style={{ background: "rgba(124,58,237,0.85)", border: "1px solid rgba(124,58,237,0.6)" }}
      >
        {connecting ? (
          <>
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Connecting...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Select Wallet
          </>
        )}
      </button>
    );
  }

  const addr = publicKey.toBase58();

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(addr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  function handleChangeWallet() {
    setOpen(false);
    setVisible(true);
  }

  async function handleDisconnect() {
    setOpen(false);
    try {
      await disconnect();
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={ref} className="relative" style={{ zIndex: 9999 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-all duration-200 active:scale-95"
        style={{
          background: open ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.35)",
          border: "1px solid rgba(124,58,237,0.55)",
        }}
      >
        {wallet?.adapter.icon ? (
          <img src={wallet.adapter.icon} alt="" className="w-4 h-4 rounded-full" />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        )}
        <span>{shorten(addr)}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 rounded-xl overflow-hidden"
          style={{
            top: "calc(100% + 8px)",
            minWidth: "180px",
            background: "rgba(12,14,26,0.97)",
            border: "1px solid rgba(124,58,237,0.35)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.12)",
            zIndex: 9999,
          }}
        >
          <div
            className="px-3 py-2 text-xs font-mono"
            style={{ color: "#64748B", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            {addr.slice(0, 8)}...{addr.slice(-8)}
          </div>
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors duration-150"
            style={{ color: copied ? "#4ADE80" : "#E2E8F0" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
            {copied ? "Copied!" : "Copy address"}
          </button>
          <button
            onClick={handleChangeWallet}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors duration-150"
            style={{ color: "#E2E8F0" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.12)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Change wallet
          </button>
          <button
            onClick={handleDisconnect}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left transition-colors duration-150"
            style={{ color: "#F87171", borderTop: "1px solid rgba(255,255,255,0.06)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
