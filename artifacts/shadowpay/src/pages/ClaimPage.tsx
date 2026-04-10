import { useState } from "react";
import { Link } from "wouter";
import { WalletButton } from "@/components/WalletButton";
import { Spinner } from "@/components/Spinner";
import { StatusMessage } from "@/components/StatusMessage";
import { useWallet } from "@/components/WalletProvider";
import { USDC_DECIMALS, RELAYER_URL } from "@/lib/constants";

export default function ClaimPage() {
  const { wallet, account } = useWallet();
  const [scanning, setScanning] = useState(false);
  const [utxos, setUtxos] = useState<any[]>([]);
  const [scanned, setScanned] = useState(false);
  const [claimingIndex, setClaimingIndex] = useState<number | null>(null);
  const [claimedSigs, setClaimedSigs] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!wallet || !account) { setError("Please connect your wallet first."); return; }
    setScanning(true);
    setError(null);
    setUtxos([]);
    setScanned(false);

    try {
      const { createUmbraClient } = await import("@/lib/umbra");
      const { client } = await createUmbraClient(wallet, account);

      const { getUserRegistrationFunction, getClaimableUtxoScannerFunction } = await import("@umbra-privacy/sdk");
      const register = getUserRegistrationFunction({ client });
      await register({ confidential: true, anonymous: true });

      const fetchUtxos = getClaimableUtxoScannerFunction({ client });
      const { received } = await fetchUtxos(0, 0);
      setUtxos(received);
      setScanned(true);
    } catch (e: any) {
      setError(e?.message || "Scan failed. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  async function handleClaim(utxo: any, index: number) {
    if (!wallet || !account) return;
    setClaimingIndex(index);
    setError(null);

    try {
      const { createUmbraClient } = await import("@/lib/umbra");
      const { client } = await createUmbraClient(wallet, account);

      const { getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction, getUmbraRelayer } = await import("@umbra-privacy/sdk");
      const { getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver } = await import("@umbra-privacy/web-zk-prover");

      const zkProver = getClaimReceiverClaimableUtxoIntoEncryptedBalanceProver();
      const relayer = getUmbraRelayer({ apiEndpoint: RELAYER_URL });
      const claim = getReceiverClaimableUtxoToEncryptedBalanceClaimerFunction(
        { client },
        { zkProver, relayer },
      );
      const result = await claim([utxo]);
      const sig = Array.isArray(result) ? result[0] : (result as any)?.signature || "confirmed";
      setClaimedSigs((prev) => ({ ...prev, [index]: sig }));
    } catch (e: any) {
      setError(e?.message || "Claim failed. Please try again.");
    } finally {
      setClaimingIndex(null);
    }
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

      <section className="flex flex-col items-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-900/30 border border-purple-700/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Claim Incoming Payments</h1>
            <p className="text-gray-400">Scan the Umbra mixer for payments sent to your wallet. Claim them into your private encrypted balance.</p>
          </div>

          {error && <div className="mb-4"><StatusMessage type="error" message={error} /></div>}
          {!account && <div className="mb-4"><StatusMessage type="info" message="Connect your wallet to scan for payments." /></div>}

          <button
            onClick={handleScan}
            disabled={scanning || !account}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mb-6"
          >
            {scanning ? (
              <>
                <Spinner />
                <span>Scanning Umbra mixer for your payments...</span>
              </>
            ) : (
              "Scan for Incoming Payments"
            )}
          </button>

          {scanned && utxos.length === 0 && (
            <div className="text-center py-12 bg-white/5 border border-white/10 rounded-2xl">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <p className="text-gray-400">No claimable payments found for this wallet.</p>
              <p className="text-gray-500 text-sm mt-1">Payments may take a few minutes to appear after being sent.</p>
            </div>
          )}

          {utxos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-white font-semibold text-lg mb-3">Found {utxos.length} Claimable Payment{utxos.length !== 1 ? "s" : ""}</h2>
              {utxos.map((utxo, i) => {
                const amountDisplay = utxo.amount
                  ? (Number(utxo.amount) / 10 ** USDC_DECIMALS).toFixed(2)
                  : "?";
                const isClaiming = claimingIndex === i;
                const isClaimed = !!claimedSigs[i];

                return (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold">{amountDisplay} USDC</div>
                      <div className="text-gray-500 text-xs mt-0.5">Private UTXO #{i + 1}</div>
                      {isClaimed && (
                        <div className="text-green-400 text-xs mt-1 font-mono break-all">
                          Claimed: {claimedSigs[i].slice(0, 20)}...
                        </div>
                      )}
                    </div>
                    {isClaimed ? (
                      <span className="text-green-400 font-semibold text-sm whitespace-nowrap">Claimed</span>
                    ) : (
                      <button
                        onClick={() => handleClaim(utxo, i)}
                        disabled={isClaiming || claimingIndex !== null}
                        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap"
                      >
                        {isClaiming ? (
                          <>
                            <Spinner />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          "Claim"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {claimingIndex !== null && (
            <div className="mt-4">
              <StatusMessage type="info" message="Generating ZK proof and submitting claim... this may take 30-60 seconds. Do not close this tab." />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
