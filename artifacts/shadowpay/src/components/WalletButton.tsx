import { useState } from "react";
import { useWallet } from "./WalletProvider";

interface WalletButtonProps {
  onConnect?: (wallet: any, account: any) => void;
}

export function WalletButton({ onConnect }: WalletButtonProps) {
  const { account, setConnection, disconnect } = useWallet();
  const [connecting, setConnecting] = useState(false);

  async function handleConnect() {
    setConnecting(true);
    try {
      const { getWallets } = await import("@wallet-standard/app");
      const { wallets } = getWallets();
      const solanaWallets = wallets.filter((w) => {
        const features = Object.keys(w.features);
        return (
          features.includes("solana:signTransaction") ||
          features.includes("solana:signAndSendTransaction")
        );
      });

      const wallet = solanaWallets[0];
      if (!wallet) {
        alert("No Solana wallet found. Please install Phantom wallet.");
        return;
      }

      const connectFeature = (wallet.features as any)["standard:connect"];
      const { accounts } = await connectFeature.connect();
      const acc = accounts[0];
      setConnection(wallet, acc);
      onConnect?.(wallet, acc);
    } catch (e) {
      console.error("Wallet connection failed:", e);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    disconnect();
  }

  if (account) {
    return (
      <button
        onClick={handleDisconnect}
        className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-mono transition-colors"
      >
        {account.address.slice(0, 4)}...{account.address.slice(-4)} ✓
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
    >
      {connecting ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
