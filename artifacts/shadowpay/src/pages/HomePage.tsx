import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useCreateLink } from "@workspace/api-client-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

export default function HomePage() {
  const { publicKey, connected } = useWallet();
  const [amount, setAmount] = useState("0.1");
  const [token, setToken] = useState<"SOL" | "USDC">("SOL");
  const [note, setNote] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = useCreateLink();

  async function handleGenerate() {
    if (!publicKey) { setError("Please connect your wallet first."); return; }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { setError("Enter a valid amount."); return; }

    setError(null);
    setGeneratedLink(null);

    try {
      const result = await createLink.mutateAsync({
        data: {
          recipientAddress: publicKey.toBase58(),
          amountSol: amountNum,
          note: note.trim() || null,
          token,
        },
      });

      const origin = window.location.origin;
      const link = `${origin}${BASE_URL}/pay/${result.id}`;
      setGeneratedLink(link);
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

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <Header showClaimLink />

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-lg text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Live on Solana Devnet
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Create a Private<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              Payment Link
            </span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Connect your wallet, set an amount, and share the link. Anyone with the link can send you real SOL or USDC directly on-chain.
          </p>
        </div>

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-white mb-5">Payment Details</h2>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1.5 block">Token</label>
            <div className="grid grid-cols-2 gap-2">
              {(["SOL", "USDC"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setToken(t)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    token === t
                      ? "bg-purple-600/30 border-purple-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400 hover:border-white/20"
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    t === "SOL" ? "bg-gradient-to-br from-purple-500 to-pink-500" : "bg-blue-500"
                  }`}>
                    {t === "SOL" ? "◎" : "$"}
                  </div>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 mb-1.5 block">Amount ({token})</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0.000001"
              step="0.01"
              placeholder={token === "SOL" ? "0.1" : "10.00"}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-xl font-semibold outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm text-gray-400 mb-1.5 block">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. For dinner last night"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}

          {connected && publicKey && (
            <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className="font-mono truncate">Payments go to: {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}</span>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={createLink.isPending || !connected}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
          >
            {createLink.isPending ? (
              <>
                <Spinner />
                <span>Creating link...</span>
              </>
            ) : !connected ? (
              "Connect wallet to continue"
            ) : (
              "Generate Payment Link"
            )}
          </button>

          {generatedLink && (
            <div className="mt-5 p-4 bg-green-900/20 border border-green-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polyline points="10 3 4.5 8.5 2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="text-green-400 text-sm font-semibold">Payment link created!</p>
              </div>
              <div className="bg-black/30 rounded-lg px-3 py-2 mb-3 break-all">
                <p className="text-green-300 text-xs font-mono">{generatedLink}</p>
              </div>
              <button
                onClick={handleCopy}
                className="w-full bg-green-700 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <p className="text-gray-500 text-xs mt-2 text-center">Share this link. The sender pays you directly on-chain.</p>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { num: "1", title: "Connect & Create", desc: "Connect your wallet and set the amount you want to receive." },
            { num: "2", title: "Share the Link", desc: "Send the link to anyone — works in any browser, any device." },
            { num: "3", title: "Receive Instantly", desc: "They pay with their wallet. Funds arrive directly on-chain." },
          ].map((step) => (
            <div key={step.num} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div className="text-purple-400 font-bold text-sm mb-1 font-mono">Step {step.num}</div>
              <div className="text-white text-sm font-semibold mb-1">{step.title}</div>
              <div className="text-gray-500 text-xs leading-relaxed">{step.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
