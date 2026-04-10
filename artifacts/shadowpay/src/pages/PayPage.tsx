import { useState } from "react";
import { useParams, Link } from "wouter";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL, ComputeBudgetProgram } from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Background } from "@/components/Background";
import { Spinner } from "@/components/Spinner";
import { useGetLink, useMarkLinkPaid, useClaimLink } from "@workspace/api-client-react";

const EXPLORER_BASE = "https://explorer.solana.com/tx";

function buildMinFeeTx(...instructions: any[]) {
  return new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 300 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 0 }),
    ...instructions
  );
}

export default function PayPage() {
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [sending, setSending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: link, isLoading, isError, refetch } = useGetLink(linkId, {
    query: { enabled: !!linkId, refetchInterval: txSig ? false : 4000 },
  });
  const markPaid = useMarkLinkPaid();
  const claimLink = useClaimLink();

  async function handlePay() {
    if (!publicKey || !link) return;
    setSending(true);
    setError(null);
    try {
      const recipientPubkey = new PublicKey(link.recipientAddress!);
      const lamports = Math.round(link.amountSol * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      const transaction = buildMinFeeTx(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipientPubkey, lamports })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "processed",
        maxRetries: 5,
      });
      await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      await markPaid.mutateAsync({ linkId, data: { txSignature: signature, payerAddress: publicKey.toBase58() } });
      setTxSig(signature);
      refetch();
    } catch (e: any) {
      if (e?.name === "WalletSignTransactionError" || e?.message?.includes("rejected")) {
        setError("Transaction was rejected in your wallet.");
      } else {
        setError(e?.message || "Transaction failed. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function handleClaim() {
    if (!publicKey || !link) return;
    setSending(true);
    setError(null);
    try {
      const result = await claimLink.mutateAsync({ linkId, data: { claimantAddress: publicKey.toBase58() } });
      setTxSig(result.txSignature);
      setClaimedAmount(result.amountSol);
      refetch();
    } catch (e: any) {
      setError(e?.data?.error || e?.message || "Claim failed. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Background />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-gray-500 text-sm">Loading payment link...</p>
        </div>
      </div>
    );
  }

  if (isError || !link) {
    return (
      <div className="min-h-screen flex flex-col relative text-white">
        <Background />
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center relative z-10">
          <div className="text-6xl font-black text-violet-500/30 mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-500 mb-6 max-w-sm text-sm">This payment link doesn't exist or has expired.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all btn-glow-purple">
            Create Your Own Link →
          </Link>
        </div>
      </div>
    );
  }

  const isSendType = link.type === "send";
  const isComplete = link.paid || !!txSig;
  const displaySig = txSig || link.txSignature;
  const isNotFundedYet = isSendType && !link.funded;

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      <Background />
      <Header />

      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">

          {isComplete ? (
            <div className="text-center mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-1 neon-text-green">
                {isSendType ? "Funds Claimed!" : "Payment Sent!"}
              </h1>
              <p className="text-gray-400 text-sm">
                {isSendType
                  ? `${(claimedAmount ?? link.amountSol).toFixed(6)} SOL transferred to your wallet.`
                  : "Confirmed on Solana Mainnet."}
              </p>
            </div>
          ) : isNotFundedYet ? (
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-amber-400 mb-1">Awaiting Funds</h1>
              <p className="text-gray-500 text-sm">The sender hasn't deposited funds yet. Check back soon.</p>
            </div>
          ) : (
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isSendType ? "border border-green-500/30" : "border border-violet-500/30"
              }`} style={{ background: isSendType ? "rgba(34,197,94,0.08)" : "rgba(124,58,237,0.08)" }}>
                {isSendType ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                )}
              </div>
              <h1 className="text-3xl font-black text-white mb-1 neon-text-purple">
                {isSendType ? "Claim Your Funds" : "Payment Request"}
              </h1>
              <p className="text-gray-500 text-sm">
                {isSendType
                  ? "Funds are held in escrow. Connect your wallet to claim."
                  : "Pay directly on-chain. ~$0.0005 in fees."}
              </p>
            </div>
          )}

          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
            <div className="px-5 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Amount</span>
              <span className="text-3xl font-black text-white neon-text-purple">
                {link.amountSol} <span className="text-violet-400">{link.token}</span>
              </span>
            </div>

            <div className="px-5 py-3 space-y-2.5">
              {link.note && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs">Note</span>
                  <span className="text-gray-300 text-sm italic">"{link.note}"</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">Type</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isSendType
                    ? "text-green-400 border border-green-700/40"
                    : "text-violet-400 border border-violet-700/40"
                }`} style={{ background: isSendType ? "rgba(34,197,94,0.08)" : "rgba(124,58,237,0.08)" }}>
                  {isSendType ? "⚡ Escrow Claimable" : "📨 Direct Payment"}
                </span>
              </div>
              {!isSendType && link.recipientAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 text-xs">Recipient</span>
                  <span className="text-gray-400 text-xs font-mono">
                    {link.recipientAddress.slice(0, 6)}...{link.recipientAddress.slice(-6)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">Network</span>
                <span className="text-green-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Solana Mainnet
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">Fee</span>
                <span className="text-gray-400 text-xs">~0.000005 SOL</span>
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

          {isComplete ? (
            <div className="space-y-3">
              {displaySig && (
                <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-gray-600 text-xs mb-1.5">Transaction Signature</p>
                  <p className="text-green-300 text-xs font-mono break-all leading-relaxed">{displaySig}</p>
                  <a
                    href={`${EXPLORER_BASE}/${displaySig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2.5 text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View on Solana Explorer
                  </a>
                </div>
              )}
              <Link href="/" className="block text-center text-violet-400 hover:text-violet-300 text-sm transition-colors py-2">
                Create your own payment link →
              </Link>
            </div>
          ) : isNotFundedYet ? (
            <div className="text-center">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                Refresh status
              </button>
            </div>
          ) : (
            <>
              {!connected && (
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm mb-4"
                  style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="shrink-0">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span className="text-violet-300 text-xs">
                    {isSendType ? "Connect your wallet above to claim these funds." : "Connect your wallet above to send this payment."}
                  </span>
                </div>
              )}
              <button
                onClick={isSendType ? handleClaim : handlePay}
                disabled={sending || !connected || !publicKey}
                className={`w-full text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2.5 text-base disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSendType ? "btn-glow-green" : "btn-glow-purple"
                }`}
                style={{
                  background: isSendType
                    ? "linear-gradient(135deg, #16a34a, #15803d)"
                    : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                }}
              >
                {sending ? (
                  <>
                    <Spinner />
                    <span className="text-sm">
                      {isSendType ? "Claiming from escrow..." : "Confirming on Mainnet..."}
                    </span>
                  </>
                ) : isSendType ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Claim {link.amountSol} {link.token}
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Pay {link.amountSol} {link.token}
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
