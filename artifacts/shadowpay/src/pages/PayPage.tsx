import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
  Keypair,
} from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Background } from "@/components/Background";
import { Spinner } from "@/components/Spinner";
import { useGetLink, useMarkLinkPaid, useClaimLink } from "@workspace/api-client-react";
import { deriveStealthKeypair, encodePrivateKey } from "@/lib/stealth";

const EXPLORER_BASE = "https://explorer.solana.com/tx";

function buildMinFeeTx(...instructions: any[]) {
  return new Transaction().add(
    ComputeBudgetProgram.setComputeUnitLimit({ units: 3000 }),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
    ...instructions
  );
}

type SweepState = "idle" | "sweeping" | "done";

export default function PayPage() {
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [secret, setSecret] = useState<string | null>(null);
  const [stealthKeypair, setStealthKeypair] = useState<Keypair | null>(null);
  const [stealthBalance, setStealthBalance] = useState<number | null>(null);

  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [claimSig, setClaimSig] = useState<string | null>(null);
  const [claimedAmount, setClaimedAmount] = useState<number | null>(null);

  const [sweepState, setSweepState] = useState<SweepState>("idle");
  const [sweepDest, setSweepDest] = useState("");
  const [sweepSig, setSweepSig] = useState<string | null>(null);
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);

  const [escrowOnChainBalance, setEscrowOnChainBalance] = useState<number | null>(null);
  const [escrowBalanceChecking, setEscrowBalanceChecking] = useState(false);

  const { data: link, isLoading, isError, refetch } = useGetLink(linkId, {
    query: { enabled: !!linkId, refetchInterval: (claimed || !!txSig) ? false : 4000 },
  });
  const markPaid = useMarkLinkPaid();
  const claimLink = useClaimLink();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash && hash.length === 64) {
      setSecret(hash);
    }
  }, []);

  useEffect(() => {
    if (!secret || !linkId) return;
    deriveStealthKeypair(secret, linkId).then(setStealthKeypair).catch(() => {});
  }, [secret, linkId]);

  useEffect(() => {
    if (!stealthKeypair || !claimed) return;
    const poll = async () => {
      const bal = await connection.getBalance(stealthKeypair.publicKey).catch(() => 0);
      setStealthBalance(bal / LAMPORTS_PER_SOL);
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [stealthKeypair, claimed, connection]);

  // Poll live escrow balance so receiver sees real on-chain status before claiming
  useEffect(() => {
    if (!link?.escrowPublicKey || !link.funded || claimed) return;
    let cancelled = false;
    const check = async () => {
      try {
        const pub = new PublicKey(link.escrowPublicKey!);
        const bal = await connection.getBalance(pub);
        if (!cancelled) setEscrowOnChainBalance(bal / LAMPORTS_PER_SOL);
      } catch {
        if (!cancelled) setEscrowOnChainBalance(null);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [link?.escrowPublicKey, link?.funded, claimed, connection]);

  async function refreshEscrowBalance() {
    if (!link?.escrowPublicKey) return;
    setEscrowBalanceChecking(true);
    try {
      const pub = new PublicKey(link.escrowPublicKey);
      const bal = await connection.getBalance(pub);
      setEscrowOnChainBalance(bal / LAMPORTS_PER_SOL);
      setError(null);
    } catch (e: any) {
      setEscrowOnChainBalance(null);
    } finally {
      setEscrowBalanceChecking(false);
    }
  }

  async function handleStealthClaim() {
    if (!stealthKeypair || !link) return;
    setClaiming(true);
    setError(null);
    try {
      const result = await claimLink.mutateAsync({
        linkId,
        data: { claimantAddress: stealthKeypair.publicKey.toBase58() },
      });
      setClaimSig(result.txSignature);
      setClaimedAmount(result.amountSol);
      setClaimed(true);
      setSweepDest(publicKey?.toBase58() ?? "");
      refetch();
    } catch (e: any) {
      setError(e?.data?.error || e?.message || "Claim failed. Please try again.");
    } finally {
      setClaiming(false);
    }
  }

  async function handleSweep() {
    if (!stealthKeypair || !sweepDest.trim()) return;
    setSweepState("sweeping");
    setError(null);
    try {
      const destPubkey = new PublicKey(sweepDest.trim());
      const balance = await connection.getBalance(stealthKeypair.publicKey);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");

      // Measure the exact fee using the real transaction shape
      const probeTx = buildMinFeeTx(
        SystemProgram.transfer({
          fromPubkey: stealthKeypair.publicKey,
          toPubkey: destPubkey,
          lamports: 1,
        })
      );
      probeTx.recentBlockhash = blockhash;
      probeTx.feePayer = stealthKeypair.publicKey;
      const feeResponse = await connection.getFeeForMessage(probeTx.compileMessage(), "confirmed");
      const exactFee = feeResponse.value ?? 6000;

      const transferAmount = balance - exactFee;
      if (transferAmount <= 0) throw new Error("Insufficient balance in stealth address to cover fees");

      const tx = buildMinFeeTx(
        SystemProgram.transfer({
          fromPubkey: stealthKeypair.publicKey,
          toPubkey: destPubkey,
          lamports: transferAmount,
        })
      );
      tx.recentBlockhash = blockhash;
      tx.feePayer = stealthKeypair.publicKey;
      tx.sign(stealthKeypair);

      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
        maxRetries: 3,
      });
      const result = await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
      if (result.value.err) {
        throw new Error(`Sweep transaction failed on-chain: ${JSON.stringify(result.value.err)}`);
      }
      setSweepSig(sig);
      setSweepState("done");
      setStealthBalance(0);
    } catch (e: any) {
      setError(e?.message || "Sweep failed. Please try again.");
      setSweepState("idle");
    }
  }

  async function handleDirectPay() {
    if (!publicKey || !link) return;
    setSending(true);
    setError(null);
    try {
      const recipientPubkey = new PublicKey(link.recipientAddress!);
      const lamports = Math.round(link.amountSol * LAMPORTS_PER_SOL);
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      const transaction = buildMinFeeTx(
        SystemProgram.transfer({ fromPubkey: publicKey, toPubkey: recipientPubkey, lamports })
      );
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;
      const signature = await sendTransaction(transaction, connection, {
        skipPreflight: true,
        maxRetries: 3,
      });
      const result = await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
      if (result.value.err) {
        throw new Error(`Transaction failed on-chain: ${JSON.stringify(result.value.err)}`);
      }
      await markPaid.mutateAsync({ linkId, data: { txSignature: signature, payerAddress: publicKey.toBase58() } });
      setTxSig(signature);
      refetch();
    } catch (e: any) {
      if (e?.name === "WalletSignTransactionError" || e?.message?.includes("rejected")) {
        setError("Transaction rejected in your wallet.");
      } else {
        setError(e?.message || "Transaction failed. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  async function copyText(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <Background />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <Spinner /><p className="text-gray-500 text-sm">Loading payment link...</p>
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
          <div className="text-6xl font-black text-violet-500/20 mb-4">404</div>
          <h1 className="text-2xl font-bold mb-2">Link Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm">This payment link doesn't exist or has expired.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
            Create Your Own Link →
          </Link>
        </div>
      </div>
    );
  }

  const isSendType = link.type === "send";
  const isStealthMode = isSendType && !!secret && !!stealthKeypair;
  const isNotFundedYet = isSendType && !link.funded;
  const isDirectPaid = !isSendType && (link.paid || !!txSig);

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      <Background />
      <Header />

      <section className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 py-8">
        <div className="w-full max-w-md animate-fade-up">

          {/* ── RECEIVE: Payment already sent ── */}
          {isDirectPaid && (
            <div className="text-center mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#22c55e", animationDuration: "2s" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              </div>
              <h1 className="text-3xl font-black text-white mb-1">Payment Sent!</h1>
              <p className="text-gray-400 text-sm">Confirmed on Solana Mainnet.</p>
            </div>
          )}

          {/* ── STEALTH: Sweep done ── */}
          {isStealthMode && sweepState === "done" && (
            <div className="text-center mb-6">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: "#8b5cf6", animationDuration: "2s" }} />
                <div className="relative w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
              </div>
              <h1 className="text-3xl font-black neon-text-purple mb-1">Privately Received!</h1>
              <p className="text-gray-400 text-sm">Funds swept to your wallet. No on-chain identity revealed.</p>
            </div>
          )}

          {/* ── Header for non-complete states ── */}
          {!isDirectPaid && !(isStealthMode && sweepState === "done") && (
            <div className="text-center mb-6">
              {isNotFundedYet ? (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  </div>
                  <h1 className="text-2xl font-bold text-amber-400 mb-1">Awaiting Funds</h1>
                  <p className="text-gray-500 text-sm">The sender hasn't funded this link yet.</p>
                </>
              ) : isStealthMode ? (
                <>
                  <div className="relative w-14 h-14 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full animate-glow" style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.35)" }} />
                    <div className="relative w-14 h-14 rounded-full flex items-center justify-center">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                    </div>
                  </div>
                  <h1 className="text-3xl font-black neon-text-purple mb-1">
                    {claimed ? "Funds in Stealth Address" : "Private Claim"}
                  </h1>
                  <p className="text-gray-500 text-sm">
                    {claimed
                      ? "Sweep to your wallet — no identity revealed on-chain."
                      : "Claim to a one-time stealth address. Your wallet stays private."}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </div>
                  <h1 className="text-3xl font-black neon-text-purple mb-1">Payment Request</h1>
                  <p className="text-gray-500 text-sm">Pay directly on-chain. ~$0.001 in fees.</p>
                </>
              )}
            </div>
          )}

          {/* ── Amount card ── */}
          <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(24px)" }}>
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="text-gray-500 text-xs uppercase tracking-widest font-bold">Amount</span>
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
                <span className="text-gray-600 text-xs">Privacy</span>
                {isStealthMode ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full text-violet-300 flex items-center gap-1.5"
                    style={{ background: "rgba(124,58,237,0.12)", border: "1px solid rgba(124,58,237,0.3)" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Stealth Address
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 px-2.5 py-1 rounded-full border border-white/8">Direct / On-chain visible</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">Network</span>
                <span className="text-green-400 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />Solana Mainnet
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-xs">Fee</span>
                <span className="text-gray-500 text-xs">~0.0000051 SOL</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl px-3 py-3 text-sm mb-4"
              style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* ── STEALTH CLAIM FLOW ── */}
          {isStealthMode && !claimed && !isNotFundedYet && (
            <div className="space-y-3">

              {/* Live escrow balance indicator */}
              {escrowOnChainBalance !== null && (
                <div className="flex items-center justify-between rounded-xl px-4 py-3 text-xs"
                  style={{
                    background: escrowOnChainBalance > 0 ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
                    border: `1px solid ${escrowOnChainBalance > 0 ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>
                  <span className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${escrowOnChainBalance > 0 ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                    <span className={escrowOnChainBalance > 0 ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                      {escrowOnChainBalance > 0 ? "Escrow funded on-chain" : "Escrow has no funds on-chain"}
                    </span>
                  </span>
                  <span className={`font-mono font-bold ${escrowOnChainBalance > 0 ? "text-green-300" : "text-red-300"}`}>
                    {escrowOnChainBalance.toFixed(6)} SOL
                  </span>
                </div>
              )}

              {/* Empty escrow warning with refresh */}
              {escrowOnChainBalance !== null && escrowOnChainBalance === 0 && (
                <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <div className="flex items-start gap-2.5">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div>
                      <p className="text-red-300 text-xs font-semibold mb-1">Escrow account is empty on-chain</p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        The sender's funding transaction may still be confirming, or it was rejected. Wait a few seconds and refresh — funds typically appear within 1–2 seconds on Solana.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={refreshEscrowBalance}
                    disabled={escrowBalanceChecking}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold text-red-300 transition-all disabled:opacity-40"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
                  >
                    {escrowBalanceChecking ? (
                      <><Spinner /><span>Checking...</span></>
                    ) : (
                      <>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Refresh escrow balance
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="rounded-xl p-4 text-sm space-y-2.5" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)" }}>
                <div className="flex items-center gap-2 text-violet-300 font-bold text-xs uppercase tracking-wider">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  How stealth claiming works
                </div>
                <div className="space-y-1.5">
                  {[
                    "A one-time stealth address is derived from this link's secret — your real wallet is never used",
                    "Funds move from escrow → stealth address (on-chain: just two random-looking addresses)",
                    "You then sweep from the stealth address to your real wallet privately",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                      <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black text-violet-400" style={{ background: "rgba(124,58,237,0.2)" }}>{i + 1}</span>
                      {step}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleStealthClaim}
                disabled={claiming || (escrowOnChainBalance !== null && escrowOnChainBalance === 0)}
                className="w-full text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: "0 0 25px rgba(124,58,237,0.4)" }}
              >
                {claiming ? (
                  <><Spinner /><span>Claiming to stealth address...</span></>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Claim Privately (No Wallet Needed)
                  </>
                )}
              </button>
              <p className="text-center text-xs text-gray-700">No wallet connection required to claim</p>
            </div>
          )}

          {/* ── STEALTH: After claim — sweep UI ── */}
          {isStealthMode && claimed && sweepState !== "done" && (
            <div className="space-y-3">
              <div className="rounded-xl p-4" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="flex items-center gap-2 text-green-400 font-bold text-sm mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  Claimed to stealth address
                </div>
                <div className="text-xs text-gray-600 mb-1 font-semibold uppercase tracking-wider">Stealth Address</div>
                <div className="flex items-center gap-2">
                  <div className="text-green-300 text-xs font-mono break-all flex-1">{stealthKeypair!.publicKey.toBase58()}</div>
                  <button onClick={() => copyText(stealthKeypair!.publicKey.toBase58(), "addr")} className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:text-green-400 transition-colors" style={{ background: "rgba(255,255,255,0.05)" }}>
                    {copied === "addr" ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                  </button>
                </div>
                {stealthBalance !== null && (
                  <div className="mt-2 text-xs text-green-400/60">Balance: {stealthBalance.toFixed(6)} SOL</div>
                )}
                {claimSig && (
                  <a href={`${EXPLORER_BASE}/${claimSig}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-violet-400 hover:text-violet-300 text-xs transition-colors">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    View claim tx on Explorer
                  </a>
                )}
              </div>

              <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)" }}>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Step 2 — Sweep to your wallet</div>

                {connected && publicKey && sweepDest === "" && (
                  <button onClick={() => setSweepDest(publicKey.toBase58())} className="w-full text-xs text-violet-400 hover:text-violet-300 border border-violet-800/40 hover:border-violet-600/60 rounded-lg px-3 py-2 mb-3 transition-all text-left"
                    style={{ background: "rgba(124,58,237,0.06)" }}>
                    ← Use connected wallet: {publicKey.toBase58().slice(0,8)}...{publicKey.toBase58().slice(-6)}
                  </button>
                )}

                <input
                  type="text"
                  value={sweepDest}
                  onChange={(e) => setSweepDest(e.target.value)}
                  placeholder="Destination wallet address (any Solana address)"
                  className="w-full rounded-xl px-4 py-3 text-xs text-white outline-none transition-all placeholder:text-gray-700 font-mono mb-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.25)" }}
                  onFocus={(e) => e.target.style.borderColor = "rgba(124,58,237,0.6)"}
                  onBlur={(e) => e.target.style.borderColor = "rgba(124,58,237,0.25)"}
                />
                <button
                  onClick={handleSweep}
                  disabled={sweepState === "sweeping" || !sweepDest.trim()}
                  className="w-full text-white font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: sweepDest.trim() ? "0 0 20px rgba(124,58,237,0.35)" : "none" }}
                >
                  {sweepState === "sweeping" ? (
                    <><Spinner /><span>Sweeping privately...</span></>
                  ) : (
                    <>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      Sweep to Destination
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <button onClick={() => setShowPrivKey(!showPrivKey)} className="w-full flex items-center justify-between px-4 py-3 text-xs text-gray-600 hover:text-gray-400 transition-colors">
                  <span className="flex items-center gap-2">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Export private key (advanced — import into any wallet)
                  </span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showPrivKey ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {showPrivKey && (
                  <div className="px-4 pb-4">
                    <div className="rounded-lg p-3 mb-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
                      <p className="text-red-400/80 text-[10px] leading-relaxed">⚠️ Keep this private. Anyone with this key controls the stealth address funds. Use only to import into a wallet app.</p>
                    </div>
                    <div className="relative">
                      <div className="text-[10px] font-mono text-gray-600 break-all leading-relaxed select-all pr-8">
                        {encodePrivateKey(stealthKeypair!)}
                      </div>
                      <button onClick={() => copyText(encodePrivateKey(stealthKeypair!), "privkey")} className="absolute top-0 right-0 p-1 text-gray-600 hover:text-violet-400 transition-colors">
                        {copied === "privkey" ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEALTH SWEEP DONE ── */}
          {isStealthMode && sweepState === "done" && sweepSig && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.2)" }}>
              <p className="text-gray-500 text-xs mb-1.5">Sweep Transaction</p>
              <p className="text-violet-300 text-xs font-mono break-all">{sweepSig}</p>
              <a href={`${EXPLORER_BASE}/${sweepSig}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-violet-400 hover:text-violet-300 text-xs transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View on Explorer
              </a>
            </div>
          )}

          {/* ── AWAITING FUNDING ── */}
          {isNotFundedYet && (
            <div className="text-center">
              <button onClick={() => refetch()} className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 text-sm transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh status
              </button>
            </div>
          )}

          {/* ── RECEIVE: Direct payment ── */}
          {!isSendType && !isDirectPaid && (
            <>
              {!connected && (
                <div className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm mb-4"
                  style={{ background: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.18)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="shrink-0"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span className="text-violet-300 text-xs">Connect your wallet above to pay.</span>
                </div>
              )}
              <button
                onClick={handleDirectPay}
                disabled={sending || !connected || !publicKey}
                className="w-full text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: connected ? "0 0 25px rgba(124,58,237,0.4)" : "none" }}
              >
                {sending ? (
                  <><Spinner /><span>Confirming on Mainnet...</span></>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Pay {link.amountSol} {link.token}
                  </>
                )}
              </button>
            </>
          )}

          {/* ── RECEIVE: Success ── */}
          {isDirectPaid && (txSig || link.txSignature) && (
            <div className="rounded-xl p-4 mb-3" style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <p className="text-gray-500 text-xs mb-1.5">Transaction</p>
              <p className="text-green-300 text-xs font-mono break-all">{txSig || link.txSignature}</p>
              <a href={`${EXPLORER_BASE}/${txSig || link.txSignature}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-violet-400 hover:text-violet-300 text-xs transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                View on Solana Explorer
              </a>
            </div>
          )}

          <div className="text-center mt-4">
            <Link href="/" className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
              Create your own payment link →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
