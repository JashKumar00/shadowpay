import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Background } from "@/components/Background";
import { Spinner } from "@/components/Spinner";
import { useCreateLink, useMarkLinkFunded } from "@workspace/api-client-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
type Mode = "send" | "receive";

function buildMinFeeTx(...instructions: any[]) {
  return new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 2000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 50000 }),
    ...instructions
  );
}

const TICKER_ITEMS = [
  { label: "SOL/USD", value: "$148.20", change: "+2.4%" },
  { label: "24h Vol", value: "$3.2B", change: null },
  { label: "TPS", value: "4,200", change: null },
  { label: "Block Time", value: "400ms", change: null },
  { label: "Validators", value: "1,728", change: null },
  { label: "Epoch", value: "723", change: null },
  { label: "Fee", value: "0.0000051 SOL", change: null },
];

function NetworkTicker() {
  return (
    <div className="relative z-10 border-b border-white/5 overflow-hidden"
      style={{ background: "rgba(6,6,16,0.9)", backdropFilter: "blur(10px)" }}>
      <div className="flex items-center">
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 border-r border-white/8"
          style={{ background: "rgba(124,58,237,0.15)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Live</span>
        </div>
        <div className="flex overflow-hidden">
          <div className="flex gap-6 px-4 py-1.5 animate-[ticker-slide_30s_linear_infinite]"
            style={{ width: "max-content" }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">{item.label}</span>
                <span className="text-[11px] text-gray-300 font-bold">{item.value}</span>
                {item.change && (
                  <span className="text-[10px] text-green-400 font-semibold">{item.change}</span>
                )}
                <span className="text-gray-800 ml-2">·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "rgba(124,58,237,0.15)" }}>
        {icon}
      </div>
      <div>
        <div className="text-[10px] text-gray-600 font-semibold uppercase tracking-wider">{label}</div>
        <div className="text-xs text-white font-bold">{value}</div>
      </div>
    </div>
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
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingFunds, setSendingFunds] = useState(false);
  const [funded, setFunded] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);

  const createLink = useCreateLink();
  const markFunded = useMarkLinkFunded();

  useEffect(() => {
    if (!publicKey || !connection) return;
    connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
  }, [publicKey, connection]);

  async function handleGenerate() {
    if (!publicKey) { setError("Please connect your wallet first."); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Enter a valid amount."); return; }
    setError(null);
    setGeneratedLink(null);
    setFunded(false);

    try {
      const result = await createLink.mutateAsync({
        data: {
          type: mode,
          recipientAddress: mode === "receive" ? publicKey.toBase58() : null,
          amountSol: amountNum,
          note: note.trim() || null,
          token,
        },
      });

      const origin = window.location.origin;
      const link = `${origin}${BASE_URL}/pay/${result.id}`;
      setGeneratedLink(link);

      if (mode === "send" && result.escrowPublicKey) {
        setSendingFunds(true);
        try {
          const escrowPubkey = new PublicKey(result.escrowPublicKey);
          const lamports = Math.round(amountNum * LAMPORTS_PER_SOL);
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
          const transaction = buildMinFeeTx(
            SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: escrowPubkey, lamports })
          );
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;

          const signature = await sendTransaction(transaction, connection, {
            skipPreflight: false,
            preflightCommitment: "processed",
            maxRetries: 5,
          });
          await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
          await markFunded.mutateAsync({ linkId: result.id, data: { txSignature: signature } });
          setFunded(true);
          if (publicKey) connection.getBalance(publicKey).then((b) => setSolBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
        } catch (e: any) {
          if (e?.name === "WalletSignTransactionError" || e?.message?.includes("rejected")) {
            setError("Transaction rejected. The link was created but not funded.");
          } else {
            setError(e?.message || "Failed to fund escrow. Link created but not funded.");
          }
        } finally {
          setSendingFunds(false);
        }
      }
    } catch (e: any) {
      setError(e?.data?.error || e?.message || "Something went wrong. Please try again.");
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isPending = createLink.isPending || sendingFunds;

  return (
    <div className="min-h-screen flex flex-col text-white relative">
      <Background />
      <Header showClaimLink />
      <NetworkTicker />

      <section className="relative z-10 flex flex-col items-center flex-1 px-4 py-8">

        <div className="w-full max-w-lg text-center mb-7 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 text-xs font-semibold text-green-300"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.18)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Solana Mainnet · 400ms block time · ~$0.001 fee
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-3 leading-[1.05] tracking-tight">
            Private{" "}
            <span className="shimmer-text">Payment Links</span>
          </h1>
          <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
            Send SOL in escrow or request payments — all on-chain, near-instant, non-custodial.
          </p>
        </div>

        {connected && publicKey && (
          <div className="w-full max-w-md mb-5 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                label="Balance"
                value={solBalance !== null ? `${solBalance.toFixed(4)} SOL` : "—"}
              />
              <StatCard
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                label="Network"
                value="Mainnet"
              />
              <StatCard
                icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
                label="Tx Fee"
                value="0.0000051 SOL"
              />
            </div>
          </div>
        )}

        <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex rounded-xl p-1 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {(["send", "receive"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setGeneratedLink(null); setError(null); setFunded(false); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-black transition-all flex items-center justify-center gap-2 ${
                  mode === m
                    ? "text-white"
                    : "text-gray-600 hover:text-gray-400"
                }`}
                style={mode === m ? {
                  background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: "0 0 20px rgba(124,58,237,0.4)",
                } : {}}
              >
                {m === "send" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Receive
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            backdropFilter: "blur(24px)",
          }}>
            <div className="px-4 py-2.5 flex items-center gap-2 text-xs"
              style={{ background: "rgba(124,58,237,0.08)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <span className="text-violet-300/70">
                {mode === "send"
                  ? "Fund escrow now · recipient claims any time · no time limit"
                  : "Payer sends directly to your wallet · zero custody"}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 block font-bold">Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["SOL", "USDC"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setToken(t)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-all text-left"
                      style={token === t ? {
                        background: "rgba(124,58,237,0.12)",
                        borderColor: "rgba(124,58,237,0.45)",
                        boxShadow: "0 0 12px rgba(124,58,237,0.15)",
                      } : {
                        background: "rgba(255,255,255,0.03)",
                        borderColor: "rgba(255,255,255,0.07)",
                      }}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${
                        t === "SOL"
                          ? "bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600"
                          : "bg-gradient-to-br from-blue-500 to-cyan-400"
                      }`}
                        style={{ boxShadow: t === "SOL" ? "0 0 12px rgba(124,58,237,0.5)" : "0 0 12px rgba(6,182,212,0.4)" }}>
                        {t === "SOL" ? "◎" : "$"}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${token === t ? "text-white" : "text-gray-500"}`}>{t}</div>
                        <div className="text-[10px] text-gray-700">{t === "SOL" ? "Solana" : "USD Coin"}</div>
                      </div>
                      {token === t && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                          <svg width="8" height="8" viewBox="0 0 12 12"><polyline points="10 3 4.5 8.5 2 6" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 block font-bold">Amount ({token})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.000001"
                    step="0.01"
                    className="w-full rounded-xl px-4 py-4 text-3xl font-black text-white outline-none transition-all pr-20"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(124,58,237,0.3)",
                      textShadow: "0 0 20px rgba(167,139,250,0.4)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.7)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(124,58,237,0.3)"}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-violet-400 font-black">{token}</div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
                  <div className="flex items-center justify-between mt-1.5 px-1">
                    <span className="text-[10px] text-gray-700">Network fee: ~0.0000051 SOL</span>
                    <span className="text-[10px] text-gray-700">Total: {(parseFloat(amount) + 0.0000051).toFixed(7)} SOL</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] text-gray-600 uppercase tracking-widest mb-2 block font-bold">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={mode === "send" ? "e.g. For dinner last night" : "e.g. Payment for design work"}
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-gray-700"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.4)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.07)"}
                />
              </div>

              {connected && publicKey && (
                <div className="flex items-center gap-2 text-xs rounded-lg px-3 py-2"
                  style={{ background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.12)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
                  <span className="text-green-500/80 font-mono truncate">
                    {mode === "receive" ? "→ " : "← "}
                    {publicKey.toBase58().slice(0, 10)}...{publicKey.toBase58().slice(-6)}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-3 py-3"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isPending || !connected}
                className="w-full text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: connected && !isPending
                    ? "linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)"
                    : "rgba(124,58,237,0.3)",
                  boxShadow: connected && !isPending
                    ? "0 0 30px rgba(124,58,237,0.45), 0 4px 20px rgba(0,0,0,0.4)"
                    : "none",
                  letterSpacing: "0.02em",
                }}
              >
                {isPending ? (
                  <>
                    <Spinner />
                    <span>{createLink.isPending ? "Creating link..." : "Funding escrow on-chain..."}</span>
                  </>
                ) : !connected ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Connect wallet to continue
                  </>
                ) : mode === "send" ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    Send {amount || "0"} {token} & Generate Link
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Generate Payment Request Link
                  </>
                )}
              </button>
            </div>
          </div>

          {generatedLink && (
            <div className={`mt-4 rounded-2xl overflow-hidden animate-fade-up`}
              style={mode === "send" && !funded ? {
                background: "rgba(245,158,11,0.06)",
                border: "1px solid rgba(245,158,11,0.2)",
              } : {
                background: "rgba(34,197,94,0.06)",
                border: "1px solid rgba(34,197,94,0.2)",
              }}>
              <div className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b ${
                mode === "send" && !funded
                  ? "text-amber-400 border-amber-500/12"
                  : "text-green-400 border-green-500/12"
              }`}>
                {mode === "send" && !funded ? (
                  <><Spinner />Confirming on Solana...</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {mode === "send" ? "Escrow funded · Link ready!" : "Payment request ready!"}
                  </>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-xl px-3 py-3 font-mono text-xs break-all leading-relaxed select-all"
                  style={{
                    background: "rgba(0,0,0,0.35)",
                    color: mode === "send" && !funded ? "#fbbf24" : "#4ade80",
                  }}>
                  {generatedLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white ${
                    mode === "send" && !funded
                      ? "bg-amber-700/60 hover:bg-amber-600/70"
                      : "bg-green-700/60 hover:bg-green-600/70"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-md animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {[
            { icon: "🔒", title: "Non-Custodial", desc: "Your keys, your funds" },
            { icon: "⚡", title: "~1s Confirm", desc: "Solana block speed" },
            { icon: "💎", title: "No Middleman", desc: "Peer-to-peer on-chain" },
          ].map((f) => (
            <div key={f.title} className="text-center p-3 rounded-xl transition-all hover:border-white/10"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="text-lg mb-1">{f.icon}</div>
              <div className="text-xs text-gray-300 font-bold">{f.title}</div>
              <div className="text-[10px] text-gray-700 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
