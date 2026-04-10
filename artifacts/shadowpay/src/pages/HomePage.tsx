import { useState } from "react";
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
    ComputeBudgetProgram.setComputeUnitLimit({ units: 300 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0 }),
    ...instructions
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

  const createLink = useCreateLink();
  const markFunded = useMarkLinkFunded();

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

      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-10">
        <div className="w-full max-w-lg text-center mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-xs font-medium text-green-300"
            style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live · Solana Mainnet · ~$0.0005 per tx
          </div>
          <h1 className="text-5xl font-black mb-3 leading-[1.1] tracking-tight">
            Private{" "}
            <span className="shimmer-text">Payment Links</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            Send SOL in escrow anyone can claim, or request payment directly on-chain. Zero friction, ultra-low fees.
          </p>
        </div>

        <div className="w-full max-w-md animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex rounded-xl p-1 mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
            {(["send", "receive"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setGeneratedLink(null); setError(null); setFunded(false); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === m
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white btn-glow-purple"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {m === "send" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Receive
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <div className="px-4 py-3 text-xs text-gray-500 leading-relaxed"
              style={{ background: "rgba(124,58,237,0.06)", borderBottom: "1px solid rgba(124,58,237,0.12)" }}>
              {mode === "send"
                ? "⚡ You fund the escrow now. Recipient claims any time. Fee: ~0.000005 SOL"
                : "📥 Share the link. Payer sends directly to your wallet. No escrow needed."}
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-semibold">Token</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["SOL", "USDC"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setToken(t)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        token === t
                          ? "border-violet-500/60 text-white"
                          : "border-white/8 text-gray-500 hover:border-white/15 hover:text-gray-300"
                      }`}
                      style={token === t ? { background: "rgba(124,58,237,0.15)" } : { background: "rgba(255,255,255,0.03)" }}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                        t === "SOL"
                          ? "bg-gradient-to-br from-purple-500 to-pink-600"
                          : "bg-gradient-to-br from-blue-500 to-cyan-500"
                      }`}>
                        {t === "SOL" ? "◎" : "$"}
                      </div>
                      <div>
                        <div className="text-sm">{t}</div>
                        <div className="text-[10px] text-gray-600">{t === "SOL" ? "Solana" : "USD Coin"}</div>
                      </div>
                      {token === t && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><polyline points="10 3 4.5 8.5 2 6" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-semibold">Amount ({token})</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.000001"
                    step="0.01"
                    className="w-full rounded-xl px-4 py-3.5 text-2xl font-black text-white outline-none transition-all pr-16 neon-text-purple"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(124,58,237,0.25)",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(124,58,237,0.25)"}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-400 font-bold">{token}</div>
                </div>
                {amount && !isNaN(parseFloat(amount)) && (
                  <div className="text-xs text-gray-600 mt-1 pl-1">
                    Fee: ≈0.000005 SOL · Total: {(parseFloat(amount) + 0.000005).toFixed(6)} SOL
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 block font-semibold">Note (optional)</label>
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
                  style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div className="w-2 h-2 rounded-full bg-green-400 shrink-0 animate-pulse" />
                  <span className="text-green-400/80 font-mono truncate">
                    {mode === "receive" ? "Receiving to: " : "Sending from: "}
                    {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-6)}
                  </span>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl px-3 py-3 text-sm"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span className="text-red-300">{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isPending || !connected}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isPending || !connected ? "rgba(124,58,237,0.4)" : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                  boxShadow: !isPending && connected ? "0 0 25px rgba(124,58,237,0.4), 0 4px 15px rgba(0,0,0,0.3)" : "none",
                }}
              >
                {isPending ? (
                  <>
                    <Spinner />
                    <span>{createLink.isPending ? "Creating link..." : "Funding escrow on-chain..."}</span>
                  </>
                ) : !connected ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Connect wallet to continue
                  </>
                ) : mode === "send" ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Send {amount || "0"} {token} & Get Link
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                    Generate Payment Request Link
                  </>
                )}
              </button>
            </div>
          </div>

          {generatedLink && (
            <div className={`mt-4 rounded-2xl overflow-hidden animate-fade-up ${
              mode === "send" && !funded
                ? "border border-amber-500/20"
                : "border border-green-500/20"
            }`} style={{ background: mode === "send" && !funded ? "rgba(245,158,11,0.06)" : "rgba(34,197,94,0.06)", backdropFilter: "blur(20px)" }}>
              <div className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b ${
                mode === "send" && !funded
                  ? "text-amber-400 border-amber-500/15"
                  : "text-green-400 border-green-500/15"
              }`}>
                {mode === "send" && !funded ? (
                  <>
                    <Spinner />
                    Confirming on-chain...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {mode === "send" ? "Escrow funded! Link ready to share." : "Payment request created!"}
                  </>
                )}
              </div>
              <div className="p-4 space-y-3">
                <div className="rounded-xl px-3 py-2.5 font-mono text-xs break-all leading-relaxed"
                  style={{ background: "rgba(0,0,0,0.3)", color: mode === "send" && !funded ? "#fbbf24" : "#4ade80" }}>
                  {generatedLink}
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white ${
                    mode === "send" && !funded
                      ? "bg-amber-700/70 hover:bg-amber-600/80"
                      : "bg-green-700/70 hover:bg-green-600/80"
                  }`}
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
                        <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Link
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-600">
                  {mode === "send"
                    ? funded
                      ? "Anyone with this link can claim the funds from escrow."
                      : "Waiting for blockchain confirmation..."
                    : "Share this link — payer sends directly to your wallet."}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex items-center gap-8 text-xs text-gray-600 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Non-custodial
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            Instant settlement
          </div>
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            ~$0.0005 fee
          </div>
        </div>
      </section>
    </div>
  );
}
