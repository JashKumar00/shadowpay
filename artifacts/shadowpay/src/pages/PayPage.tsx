import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { WalletButton } from "@/components/WalletButton";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useWallet } from "@/components/WalletProvider";
import { getLink, PaymentLink } from "@/lib/links";
import { USDC_DECIMALS } from "@/lib/constants";

export default function PayPage() {
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;
  const { wallet, account } = useWallet();
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const found = getLink(linkId);
    if (!found) setNotFound(true);
    else setLink(found);
  }, [linkId]);

  const displayAmount = link
    ? (Number(link.amount) / 10 ** USDC_DECIMALS).toFixed(2)
    : "0";

  async function handlePay() {
    if (!wallet || !account) { setError("Please connect your wallet first."); return; }
    if (!link) return;

    setLoading(true);
    setError(null);
    setTxSig(null);

    try {
      setLoadingMsg("Connecting to Umbra protocol...");
      const { createUmbraClient } = await import("@/lib/umbra");
      const { client } = await createUmbraClient(wallet, account);

      setLoadingMsg("Registering your wallet with Umbra (sign the message in your wallet)...");
      const { getUserRegistrationFunction, getPublicBalanceToReceiverClaimableUtxoCreatorFunction } = await import("@umbra-privacy/sdk");
      const register = getUserRegistrationFunction({ client });
      await register({ confidential: true, anonymous: true });

      setLoadingMsg("Generating zero-knowledge proof... this may take 30-60 seconds");
      const { getPublicBalanceToReceiverClaimableUtxoCreatorProver } = await import("@umbra-privacy/web-zk-prover");
      const zkProver = getPublicBalanceToReceiverClaimableUtxoCreatorProver();
      const createUtxo = getPublicBalanceToReceiverClaimableUtxoCreatorFunction(
        { client },
        { zkProver },
      );

      setLoadingMsg("Submitting private transaction to Solana...");
      const result = await createUtxo({
        destinationAddress: link.recipientAddress as any,
        mint: link.mint as any,
        amount: BigInt(link.amount),
      });

      const sig = Array.isArray(result) ? result[0] : (result as any)?.signature || "confirmed";
      setTxSig(sig);
    } catch (e: any) {
      setError(e?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0a0a0f] text-white">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4 font-bold text-purple-400">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-400 mb-6">This payment link doesn't exist or has expired. Payment links are stored locally and only work on the device that created them.</p>
          <Link href="/" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors inline-block">
            Create Your Own Link
          </Link>
        </div>
      </main>
    );
  }

  if (!link) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Spinner />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#7c3aed" opacity="0.2"/>
            <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 4a2 2 0 110 4 2 2 0 010-4zm0 14c-2.76 0-5.2-1.4-6.674-3.54C10.865 18.88 13.38 18 16 18s5.136.88 6.674 2.46C21.2 22.6 18.76 24 16 24z" fill="#a855f7"/>
          </svg>
          <span className="text-lg font-bold text-white">ShadowPay</span>
        </Link>
        <WalletButton />
      </header>

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Private Payment Request</h1>
            <p className="text-gray-400">Someone is requesting a private payment. Your transaction will be completely anonymous on-chain.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
              <span className="text-gray-400">Amount</span>
              <span className="text-3xl font-bold text-white">{displayAmount} <span className="text-blue-400">USDC</span></span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Recipient</span>
              <span className="text-gray-300 text-xs font-mono">
                {link.recipientAddress.slice(0, 6)}...{link.recipientAddress.slice(-6)} (private)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Privacy</span>
              <span className="text-green-400 text-sm font-semibold">Zero-Knowledge Mixer</span>
            </div>
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}
          {!account && <div className="mb-4"><StatusMessage type="info" message="Connect your wallet to send this payment." /></div>}

          {txSig ? (
            <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-2">Payment Sent Privately!</h2>
              <p className="text-gray-400 text-sm mb-3">Your payment was routed through Umbra's zero-knowledge mixer. There is no on-chain link between you and the recipient.</p>
              <div className="bg-black/30 rounded px-3 py-2">
                <p className="text-gray-500 text-xs mb-1">Transaction</p>
                <p className="text-green-300 text-xs font-mono break-all">{txSig}</p>
              </div>
            </div>
          ) : (
            <button
              onClick={handlePay}
              disabled={loading || !account}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg"
            >
              {loading ? (
                <>
                  <Spinner />
                  <span className="text-sm">{loadingMsg}</span>
                </>
              ) : (
                `Send ${displayAmount} USDC Privately`
              )}
            </button>
          )}

          {loading && (
            <div className="mt-4">
              <StatusMessage type="info" message="ZK proof generation takes 30-60 seconds. Please don't close this tab." />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
