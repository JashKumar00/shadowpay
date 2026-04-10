import { useState } from "react";
import { nanoid } from "nanoid";
import { Link } from "wouter";
import { WalletButton } from "@/components/WalletButton";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useWallet } from "@/components/WalletProvider";
import { saveLink } from "@/lib/links";
import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";

export default function HomePage() {
  const { wallet, account } = useWallet();
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!wallet || !account) { setError("Please connect your wallet first."); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Enter a valid amount."); return; }

    setLoading(true);
    setError(null);
    setGeneratedLink(null);

    try {
      setLoadingMsg("Connecting to Umbra protocol...");
      const { createUmbraClient } = await import("@/lib/umbra");
      const { client } = await createUmbraClient(wallet, account);

      setLoadingMsg("Registering your wallet with Umbra (sign the message in your wallet)...");
      const { getUserRegistrationFunction } = await import("@umbra-privacy/sdk");
      const register = getUserRegistrationFunction({ client });
      await register({ confidential: true, anonymous: true });

      setLoadingMsg("Generating your private payment link...");
      const linkId = nanoid(12);
      const amountRaw = BigInt(Math.round(amountNum * 10 ** USDC_DECIMALS)).toString();

      saveLink({
        linkId,
        recipientAddress: account.address,
        mint: USDC_MINT,
        amount: amountRaw,
        createdAt: Date.now(),
      });

      const link = `${window.location.origin}/pay/${linkId}`;
      setGeneratedLink(link);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setLoadingMsg("");
    }
  }

  async function handleCopy() {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#7c3aed" opacity="0.2"/>
            <path d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 4a2 2 0 110 4 2 2 0 010-4zm0 14c-2.76 0-5.2-1.4-6.674-3.54C10.865 18.88 13.38 18 16 18s5.136.88 6.674 2.46C21.2 22.6 18.76 24 16 24z" fill="#a855f7"/>
          </svg>
          <span className="text-xl font-bold text-white">ShadowPay</span>
          <span className="text-xs text-purple-400 border border-purple-800 rounded px-2 py-0.5">Private Payments</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/claim" className="text-sm text-purple-300 hover:text-purple-100 transition-colors">
            Claim Payments →
          </Link>
          <WalletButton />
        </div>
      </header>

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-16 text-center">
        <div className="mb-6">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto mb-4">
            <circle cx="40" cy="40" r="40" fill="#7c3aed" opacity="0.15"/>
            <path d="M40 16C27.85 16 18 25.85 18 38c0 7.18 3.56 13.52 9.04 17.42L25 58h30l-2.04-2.58C58.44 51.52 62 45.18 62 38c0-12.15-9.85-22-22-22zm0 6a4 4 0 110 8 4 4 0 010-8zm0 34c-5.52 0-10.4-2.8-13.35-7.08 2.73-2.46 7.56-4.92 13.35-4.92s10.62 2.46 13.35 4.92C50.4 53.2 45.52 56 40 56z" fill="#a855f7"/>
          </svg>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Send Money.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">Leave No Trace.</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Create a private payment link. Share it with anyone. They pay you — completely onchain, completely private. No one can see who paid who.
          </p>
        </div>

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
          <h2 className="text-lg font-semibold text-white mb-4">Create Payment Link</h2>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1 block">Token</label>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">$</div>
              <span className="text-white font-medium">USDC</span>
              <span className="text-gray-500 text-xs ml-auto font-mono">EPjFW...t1v</span>
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm text-gray-400 mb-1 block">Amount (USDC)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.01"
              step="0.01"
              placeholder="10.00"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-lg font-semibold outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}

          {!account && (
            <div className="mb-4">
              <StatusMessage type="info" message="Connect your wallet to generate a link." />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !account}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Spinner />
                <span className="text-sm">{loadingMsg}</span>
              </>
            ) : (
              "Generate Private Payment Link"
            )}
          </button>

          {generatedLink && (
            <div className="mt-5 p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
              <p className="text-green-400 text-sm font-semibold mb-2">Your private payment link is ready!</p>
              <p className="text-white text-xs font-mono break-all bg-black/30 rounded px-2 py-2 mb-3">{generatedLink}</p>
              <button
                onClick={handleCopy}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <p className="text-gray-400 text-xs mt-2 text-center">Share this link with your payer. Their payment cannot be traced to you.</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {[
            { title: "1. Create Link", desc: "You generate a payment link. Your wallet address is stored only in your browser — not on-chain." },
            { title: "2. Payer Sends", desc: "The sender pays through Umbra's zero-knowledge mixer. No on-chain link between sender and receiver." },
            { title: "3. You Claim", desc: "Claim your payment into a private encrypted balance. Only you can see your balance." },
          ].map((step) => (
            <div key={step.title} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-white font-semibold mb-1">{step.title}</div>
              <div className="text-gray-400 text-sm">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
