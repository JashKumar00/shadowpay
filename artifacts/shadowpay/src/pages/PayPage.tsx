import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Header } from "@/components/Header";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useGetLink, useMarkLinkPaid } from "@workspace/api-client-react";

export default function PayPage() {
  const params = useParams<{ linkId: string }>();
  const linkId = params.linkId;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [sending, setSending] = useState(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: link, isLoading, isError } = useGetLink(linkId, {
    query: { enabled: !!linkId, refetchInterval: txSig ? false : 5000 },
  });
  const markPaid = useMarkLinkPaid();

  async function handlePay() {
    if (!publicKey || !link) return;
    setSending(true);
    setError(null);

    try {
      const recipientPubkey = new PublicKey(link.recipientAddress);

      if (link.token === "SOL") {
        const lamports = Math.round(link.amountSol * LAMPORTS_PER_SOL);
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports,
          })
        );

        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signature = await sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, "confirmed");

        await markPaid.mutateAsync({
          linkId,
          data: {
            txSignature: signature,
            payerAddress: publicKey.toBase58(),
          },
        });

        setTxSig(signature);
      } else {
        setError("USDC transfers require an SPL token account. Please use SOL for now.");
      }
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

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <Spinner />
      </main>
    );
  }

  if (isError || !link) {
    return (
      <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="text-5xl font-bold text-purple-400 mb-4">404</div>
          <h1 className="text-2xl font-bold text-white mb-2">Link Not Found</h1>
          <p className="text-gray-400 mb-6 max-w-sm">This payment link doesn't exist or has been removed.</p>
          <a href="/" className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
            Create Your Own Link
          </a>
        </div>
      </main>
    );
  }

  const explorerUrl = `https://explorer.solana.com/tx/${txSig}?cluster=devnet`;
  const isPaid = link.paid || !!txSig;
  const displaySig = txSig || link.txSignature;

  return (
    <main className="min-h-screen flex flex-col bg-[#0a0a0f] text-white">
      <Header />

      <section className="flex flex-col items-center justify-center flex-1 px-4 py-12">
        <div className="w-full max-w-md">
          {isPaid ? (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-green-400 mb-2">Payment Complete!</h1>
              <p className="text-gray-400">This payment has been confirmed on-chain.</p>
            </div>
          ) : (
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Request</h1>
              <p className="text-gray-400">Connect your wallet to send payment directly on-chain.</p>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-5">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/8">
              <span className="text-gray-400 text-sm">Amount</span>
              <span className="text-3xl font-bold text-white">
                {link.amountSol} <span className="text-purple-400">{link.token}</span>
              </span>
            </div>
            {link.note && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Note</span>
                <span className="text-gray-200 text-sm italic">"{link.note}"</span>
              </div>
            )}
            <div className="flex items-start justify-between mb-3">
              <span className="text-gray-400 text-sm shrink-0">Recipient</span>
              <span className="text-gray-300 text-xs font-mono ml-3 text-right break-all">
                {link.recipientAddress.slice(0, 6)}...{link.recipientAddress.slice(-6)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Network</span>
              <span className="text-purple-400 text-sm font-semibold">Solana Devnet</span>
            </div>
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}

          {isPaid ? (
            <div className="space-y-3">
              {displaySig && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
                  <p className="text-gray-500 text-xs mb-1">Transaction Signature</p>
                  <p className="text-green-300 text-xs font-mono break-all">{displaySig}</p>
                  <a
                    href={`https://explorer.solana.com/tx/${displaySig}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-purple-400 hover:text-purple-300 text-xs transition-colors"
                  >
                    View on Solana Explorer →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <>
              {!connected && (
                <div className="mb-4">
                  <StatusMessage type="info" message="Connect your wallet above to send this payment." />
                </div>
              )}
              <button
                onClick={handlePay}
                disabled={sending || !connected || !publicKey}
                className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-lg shadow-lg shadow-purple-900/20"
              >
                {sending ? (
                  <>
                    <Spinner />
                    <span className="text-sm">Sending transaction...</span>
                  </>
                ) : (
                  `Pay ${link.amountSol} ${link.token}`
                )}
              </button>
              {sending && (
                <div className="mt-3">
                  <StatusMessage type="info" message="Confirm the transaction in your wallet. Do not close this tab." />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
