import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Background } from "@/components/Background";
import { Spinner } from "@/components/Spinner";
import { Link } from "wouter";

interface TxInfo {
  signature: string;
  amount: number;
  from: string;
  timestamp: number | null;
  confirmed: boolean;
}

export default function ClaimPage() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [loading, setLoading] = useState(false);
  const [txHistory, setTxHistory] = useState<TxInfo[]>([]);
  const [scanned, setScanned] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!publicKey) { setError("Please connect your wallet first."); return; }
    setLoading(true);
    setError(null);
    setTxHistory([]);
    setScanned(false);

    try {
      const [bal, sigs] = await Promise.all([
        connection.getBalance(publicKey),
        connection.getSignaturesForAddress(publicKey, { limit: 20 }),
      ]);
      setBalance(bal / LAMPORTS_PER_SOL);

      const transactions: TxInfo[] = [];
      for (const sigInfo of sigs.slice(0, 10)) {
        try {
          const tx = await connection.getParsedTransaction(sigInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });
          if (!tx?.meta || tx.meta.err) continue;
          const myIndex = tx.transaction.message.accountKeys.findIndex(
            (k) => k.pubkey.toBase58() === publicKey.toBase58()
          );
          if (myIndex === -1) continue;
          const pre = tx.meta.preBalances[myIndex] ?? 0;
          const post = tx.meta.postBalances[myIndex] ?? 0;
          const change = (post - pre) / LAMPORTS_PER_SOL;
          if (change > 0) {
            const senderIndex = tx.transaction.message.accountKeys.findIndex(
              (_, i) => i !== myIndex && (tx.meta!.preBalances[i] ?? 0) > (tx.meta!.postBalances[i] ?? 0)
            );
            const senderKey = senderIndex >= 0
              ? tx.transaction.message.accountKeys[senderIndex].pubkey.toBase58()
              : "Unknown";
            transactions.push({ signature: sigInfo.signature, amount: change, from: senderKey, timestamp: sigInfo.blockTime, confirmed: true });
          }
        } catch {}
      }
      setTxHistory(transactions);
      setScanned(true);
    } catch (e: any) {
      setError(e?.message || "Failed to scan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(ts: number | null) {
    if (!ts) return "Pending";
    const d = new Date(ts * 1000);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      <Background />
      <Header />

      <section className="relative z-10 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-lg animate-fade-up">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full animate-glow"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }} />
              <div className="relative w-16 h-16 rounded-full flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white mb-2 neon-text-purple">My Received Payments</h1>
            <p className="text-gray-500 text-sm">Scan the blockchain for incoming SOL transactions to your wallet.</p>
          </div>

          {balance !== null && (
            <div className="rounded-2xl p-4 mb-4 flex items-center justify-between animate-fade-up"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)", backdropFilter: "blur(20px)" }}>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-0.5 font-semibold">Wallet Balance</div>
                <div className="text-2xl font-black text-white neon-text-purple">
                  {balance.toFixed(4)} <span className="text-violet-400 text-lg">SOL</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.2)" }}>
                <div className="text-lg font-black text-violet-400">◎</div>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-4 mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "rgba(124,58,237,0.15)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <div>
                <p className="text-gray-300 text-sm font-semibold mb-1">How payments work</p>
                <p className="text-gray-600 text-xs leading-relaxed">
                  Create a Receive link from the home page and share it. When someone pays, the SOL goes directly to your wallet on-chain.
                </p>
                <Link href="/" className="inline-flex items-center gap-1 mt-2 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors">
                  Create a payment link
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-3 text-sm mb-4"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-red-300">{error}</span>
            </div>
          )}
          {!connected && (
            <div className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm mb-4"
              style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="shrink-0">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-violet-300 text-xs">Connect your wallet above to scan for received payments.</span>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={loading || !connected}
            className="w-full text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mb-6 text-sm disabled:opacity-40 disabled:cursor-not-allowed btn-glow-purple"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)" }}
          >
            {loading ? (
              <>
                <Spinner />
                Scanning blockchain...
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Scan for Received Payments
              </>
            )}
          </button>

          {scanned && txHistory.length === 0 && (
            <div className="text-center py-10 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: "rgba(255,255,255,0.04)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">No incoming payments found in recent transactions.</p>
              <p className="text-gray-700 text-xs mt-1">Payments confirm in ~1–2 seconds on Solana.</p>
            </div>
          )}

          {txHistory.length > 0 && (
            <div className="space-y-3 animate-fade-up">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
                <span className="text-xs text-gray-600 font-medium px-2">
                  {txHistory.length} payment{txHistory.length !== 1 ? "s" : ""} found
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.05)" }} />
              </div>
              {txHistory.map((tx, i) => (
                <div key={tx.signature}
                  className="rounded-2xl p-4 transition-all hover:border-violet-700/30"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-green-400 font-black text-lg neon-text-green">+{tx.amount.toFixed(4)} SOL</div>
                        <div className="text-gray-600 text-xs">{formatTime(tx.timestamp)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-green-500/80 font-medium mb-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Confirmed
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-700 text-xs font-mono mb-3 px-1">
                    From: {tx.from.slice(0, 10)}...{tx.from.slice(-10)}
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View on Explorer
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
