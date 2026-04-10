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
  LedgerWalletAdapter,
  NightlyWalletAdapter,
  Coin98WalletAdapter,
  TorusWalletAdapter,
  CoinbaseWalletAdapter,
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

function App() {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new BitgetWalletAdapter(),
      new TrustWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new Coin98WalletAdapter(),
      new LedgerWalletAdapter(),
      new NightlyWalletAdapter(),
      new TorusWalletAdapter(),
      new TokenPocketWalletAdapter(),
      new SafePalWalletAdapter(),
    ],
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionProvider endpoint={RPC_ENDPOINT}>
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
