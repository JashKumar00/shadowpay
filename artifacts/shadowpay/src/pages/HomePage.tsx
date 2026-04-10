import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  Transaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useCreateLink, useMarkLinkFunded } from "@workspace/api-client-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

type Mode = "send" | "receive";

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
          const transaction = new Transaction().add(
            SystemProgram.transfer({
              fromPubkey: publicKey,
              toPubkey: escrowPubkey,
              lamports,
            })
          );
          const { blockhash } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;

          const signature = await sendTransaction(transaction, connection);
          await connection.confirmTransaction(signature, "confirmed");

          await markFunded.mutateAsync({ linkId: result.id, data: { txSignature: signature } });
          setFunded(true);
        } catch (e: any) {
          if (e?.name === "WalletSignTransactionError" || e?.message?.includes("rejected")) {
            setError("Transaction rejected. The link was created but not funded. Please try again.");
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
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <Header showClaimLink />

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-lg text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-900/30 border border-purple-700/40 text-purple-300 text-xs font-medium mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Live on Solana Devnet
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            Private{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">
              Payment Links
            </span>
          </h1>
          <p className="text-gray-400 text-base max-w-md mx-auto">
            Send funds via an escrow link anyone can claim, or request payment from anyone by sharing a link.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-5">
            {(["send", "receive"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setGeneratedLink(null); setError(null); setFunded(false); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                {m === "send" ? "💸 Send" : "📥 Receive"}
              </button>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="mb-3 px-3 py-2.5 bg-white/3 border border-white/8 rounded-lg text-xs text-gray-400 leading-relaxed">
              {mode === "send"
                ? "You specify how much to send, pay it upfront, and share the link. The receiver connects their wallet and claims the funds."
                : "You request a specific amount. The payer opens the link, connects their wallet, and pays directly to you."}
            </div>

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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-xl font-semibold outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
              />
            </div>

            <div className="mb-5">
              <label className="text-sm text-gray-400 mb-1.5 block">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={mode === "send" ? "e.g. For dinner last night" : "e.g. Payment for design work"}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
              />
            </div>

            {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}

            {connected && publicKey && (
              <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 bg-white/3 border border-white/8 rounded-lg px-3 py-2">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="font-mono truncate">
                  {mode === "receive"
                    ? `Payments go to: ${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`
                    : `Funds sent from: ${publicKey.toBase58().slice(0, 8)}...${publicKey.toBase58().slice(-8)}`}
                </span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isPending || !connected}
              className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20"
            >
              {isPending ? (
                <>
                  <Spinner />
                  <span>{createLink.isPending ? "Creating link..." : "Sending funds to escrow..."}</span>
                </>
              ) : !connected ? (
                "Connect wallet to continue"
              ) : mode === "send" ? (
                `Send ${amount || "0"} ${token} & Create Link`
              ) : (
                "Generate Payment Request Link"
              )}
            </button>

            {generatedLink && (
              <div className={`mt-5 p-4 border rounded-xl ${
                mode === "send" && !funded
                  ? "bg-yellow-900/20 border-yellow-500/30"
                  : "bg-green-900/20 border-green-500/30"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    mode === "send" && !funded ? "bg-yellow-500" : "bg-green-500"
                  }`}>
                    {mode === "send" && !funded ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 2v5M6 9v.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <polyline points="10 3 4.5 8.5 2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <p className={`text-sm font-semibold ${
                    mode === "send" && !funded ? "text-yellow-400" : "text-green-400"
                  }`}>
                    {mode === "send" && !funded
                      ? "Link created — awaiting funding confirmation"
                      : mode === "send"
                      ? "Link funded! Ready to share."
                      : "Payment request created!"}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg px-3 py-2 mb-3 break-all">
                  <p className={`text-xs font-mono ${mode === "send" && !funded ? "text-yellow-300" : "text-green-300"}`}>
                    {generatedLink}
                  </p>
                </div>
                <button
                  onClick={handleCopy}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors text-white ${
                    mode === "send" && !funded
                      ? "bg-yellow-700 hover:bg-yellow-600"
                      : "bg-green-700 hover:bg-green-600"
                  }`}
                >
                  {copied ? "Copied!" : "Copy Link"}
                </button>
                <p className="text-gray-500 text-xs mt-2 text-center">
                  {mode === "send"
                    ? funded
                      ? "Share this link. The receiver can claim their funds anytime."
                      : "Funds are being confirmed. Share when fully funded."
                    : "Share this link. The sender pays you directly on-chain."}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
