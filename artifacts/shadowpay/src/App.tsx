import { useMemo } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  BitgetWalletAdapter,
  TrustWalletAdapter,
  CoinbaseWalletAdapter,
  Coin98WalletAdapter,
  NightlyWalletAdapter,
  TokenPocketWalletAdapter,
  SafePalWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";

import { WalletModalProvider } from "@/components/WalletModalProvider";
import HomePage from "@/pages/HomePage";
import PayPage from "@/pages/PayPage";
import ClaimPage from "@/pages/ClaimPage";

const RPC_ENDPOINT =
  (import.meta.env.VITE_SOLANA_RPC_URL as string) ||
  "https://rpc.ankr.com/solana";

const CONNECTION_CONFIG = {
  commitment: "confirmed" as const,
  confirmTransactionInitialTimeout: 30_000,
  disableRetryOnRateLimit: false,
};

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0f] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-purple-400">404</h1>
        <p className="text-gray-400">Page not found.</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/pay/:linkId" component={PayPage} />
      <Route path="/claim" component={ClaimPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function buildAdapters() {
  const safe = [];
  const attempts = [
    () => new PhantomWalletAdapter(),
    () => new SolflareWalletAdapter(),
    () => new BitgetWalletAdapter(),
    () => new TrustWalletAdapter(),
    () => new CoinbaseWalletAdapter(),
    () => new Coin98WalletAdapter(),
    () => new NightlyWalletAdapter(),
    () => new TokenPocketWalletAdapter(),
    () => new SafePalWalletAdapter(),
  ];
  for (const make of attempts) {
    try {
      safe.push(make());
    } catch {
      /* skip adapters that fail to initialize */
    }
  }
  return safe;
}

function App() {
  const wallets = useMemo(() => buildAdapters(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={RPC_ENDPOINT} config={CONNECTION_CONFIG}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </QueryClientProvider>
  );
}

export default App;
