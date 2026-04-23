import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import type { WalletName } from "@solana/wallet-adapter-base";
import { WalletReadyState } from "@solana/wallet-adapter-base";

interface Props {
  open: boolean;
  onClose: () => void;
}

const FEATURED = ["Phantom", "Solflare", "Bitget Wallet", "Trust"];

export function WalletModal({ open, onClose }: Props) {
  const { wallets, select, connect } = useWallet();
  const [showMore, setShowMore] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setShowMore(false);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleSelect = useCallback(
    async (name: WalletName) => {
      select(name);
      onClose();
      try {
        await connect();
      } catch {
        /* wallet pop-up handles errors */
      }
    },
    [select, connect, onClose]
  );

  if (!open) return null;

  const detected = wallets.filter(
    (w) => w.readyState === WalletReadyState.Installed || w.readyState === WalletReadyState.Loadable
  );
  const notDetected = wallets.filter(
    (w) => w.readyState !== WalletReadyState.Installed && w.readyState !== WalletReadyState.Loadable
  );

  const featuredWallets = [
    ...FEATURED.map((name) => wallets.find((w) => w.adapter.name.includes(name))).filter(Boolean),
    ...detected.filter((w) => !FEATURED.some((n) => w.adapter.name.includes(n))),
  ].filter(Boolean).slice(0, 4) as typeof wallets;

  const moreWallets = wallets.filter((w) => !featuredWallets.includes(w));

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 99999, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={ref}
        className="relative rounded-2xl w-full overflow-hidden"
        style={{
          maxWidth: "440px",
          margin: "0 1rem",
          background: "linear-gradient(160deg,#0d0f1e 0%,#09090f 100%)",
          border: "1px solid rgba(124,58,237,0.3)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.8)",
        }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <div className="text-lg font-bold text-white tracking-tight">Connect a Wallet</div>
            <div className="text-sm mt-0.5" style={{ color: "#64748B" }}>
              Select a wallet to use on Solana Mainnet
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ background: "rgba(255,255,255,0.06)", color: "#94A3B8" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {featuredWallets.map((w) => {
              const isDetected =
                w.readyState === WalletReadyState.Installed ||
                w.readyState === WalletReadyState.Loadable;
              return (
                <WalletEntry
                  key={w.adapter.name}
                  name={w.adapter.name}
                  icon={w.adapter.icon}
                  detected={isDetected}
                  onClick={() => handleSelect(w.adapter.name)}
                />
              );
            })}
          </div>
        </div>

        {moreWallets.length > 0 && (
          <div className="px-4 pb-4 mt-1">
            <button
              onClick={() => setShowMore((s) => !s)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors"
              style={{
                color: "#94A3B8",
                background: showMore ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(124,58,237,0.08)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = showMore ? "rgba(124,58,237,0.08)" : "rgba(255,255,255,0.03)")
              }
            >
              <span className="font-medium">
                {showMore ? "Hide" : `More wallets`}
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ transform: showMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.18s" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showMore && (
              <div className="mt-2 space-y-1">
                {moreWallets.map((w) => {
                  const isDetected =
                    w.readyState === WalletReadyState.Installed ||
                    w.readyState === WalletReadyState.Loadable;
                  return (
                    <WalletRow
                      key={w.adapter.name}
                      name={w.adapter.name}
                      icon={w.adapter.icon}
                      detected={isDetected}
                      url={w.adapter.url}
                      onClick={() => handleSelect(w.adapter.name)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div
          className="px-6 py-3 text-xs text-center"
          style={{ color: "#334155", borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          By connecting you agree to ShadowPay's terms. Non-custodial — your keys, your funds.
        </div>
      </div>
    </div>,
    document.body
  );
}

function WalletEntry({
  name, icon, detected, onClick,
}: {
  name: string; icon: string; detected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-150 text-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: detected ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.07)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.1)";
        (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(124,58,237,0.55)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
        (e.currentTarget as HTMLButtonElement).style.border = detected
          ? "1px solid rgba(124,58,237,0.4)"
          : "1px solid rgba(255,255,255,0.07)";
      }}
    >
      {detected && (
        <div
          className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(74,222,128,0.15)", color: "#4ADE80", border: "1px solid rgba(74,222,128,0.3)" }}
        >
          Detected
        </div>
      )}
      <img src={icon} alt={name} className="w-10 h-10 rounded-xl" />
      <span className="text-sm font-semibold text-white leading-tight">{name}</span>
    </button>
  );
}

function WalletRow({
  name, icon, detected, url, onClick,
}: {
  name: string; icon: string; detected: boolean; url: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(124,58,237,0.08)";
        (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(124,58,237,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.02)";
        (e.currentTarget as HTMLButtonElement).style.border = "1px solid rgba(255,255,255,0.05)";
      }}
    >
      <img src={icon} alt={name} className="w-8 h-8 rounded-lg flex-shrink-0" />
      <span className="flex-1 text-sm font-medium text-white text-left">{name}</span>
      {detected ? (
        <span className="text-xs font-semibold" style={{ color: "#4ADE80" }}>Detected</span>
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs"
          style={{ color: "#64748B" }}
        >
          Install
        </a>
      )}
    </button>
  );
}
