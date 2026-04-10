import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
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

            transactions.push({
              signature: sigInfo.signature,
              amount: change,
              from: senderKey,
              timestamp: sigInfo.blockTime,
              confirmed: true,
            });
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

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <Header />

      <section className="flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">My Received Payments</h1>
            <p className="text-gray-400 text-sm">Scan the blockchain for incoming SOL transactions to your wallet.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-gray-300 text-sm mb-1 font-medium">How to receive a payment</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Create a payment link from the home page with the amount you want to receive. Share the link with your payer — they'll send you SOL directly to your wallet on-chain.
            </p>
            <Link href="/" className="inline-block mt-3 text-purple-400 hover:text-purple-300 text-xs font-medium transition-colors">
              Create a payment link →
            </Link>
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}
          {!connected && (
            <div className="mb-4">
              <StatusMessage type="info" message="Connect your wallet above to scan for received payments." />
            </div>
          )}

          {balance !== null && (
            <div className="mb-4 bg-purple-900/20 border border-purple-700/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-gray-400 text-sm">Current Balance</span>
              <span className="text-white font-bold">{balance.toFixed(4)} SOL</span>
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={loading || !connected}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mb-6 shadow-lg shadow-purple-900/20"
          >
            {loading ? (
              <>
                <Spinner />
                <span>Scanning blockchain...</span>
              </>
            ) : (
              "Scan for Received Payments"
            )}
          </button>

          {scanned && txHistory.length === 0 && (
            <div className="text-center py-10 bg-white/3 border border-white/8 rounded-2xl">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No incoming payments found in the last 20 transactions.</p>
              <p className="text-gray-600 text-xs mt-1">Payments may take a few seconds to confirm.</p>
            </div>
          )}

          {txHistory.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-white font-semibold text-sm text-gray-400">
                {txHistory.length} incoming payment{txHistory.length !== 1 ? "s" : ""} found
              </h2>
              {txHistory.map((tx) => (
                <div key={tx.signature} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400 font-bold">+{tx.amount.toFixed(4)} SOL</span>
                    <span className="text-xs text-gray-500">
                      {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleString() : "Pending"}
                    </span>
                  </div>
                  <div className="text-gray-500 text-xs font-mono mb-2">
                    From: {tx.from.slice(0, 8)}...{tx.from.slice(-8)}
                  </div>
                  <a
                    href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs transition-colors"
                  >
                    View on Explorer →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
