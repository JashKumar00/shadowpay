import { useMemo } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
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
import LandingPage from "@/pages/LandingPage";
import HomePage from "@/pages/HomePage";
import PayPage from "@/pages/PayPage";
import ClaimPage from "@/pages/ClaimPage";
import DonatePage from "@/pages/DonatePage";

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
    <div className="min-h-screen w-full flex items-center justify-center text-white" style={{ background: "var(--bg-void)" }}>
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 text-purple-400">404</h1>
        <p className="text-gray-400">Page not found.</p>
      </div>
    </div>
  );
}

function DonateButton() {
  const [location, navigate] = useLocation();
  if (location === "/") return null;
  return (
    <button
      onClick={() => navigate("/donate")}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-300"
      style={{
        background: "rgba(10,10,26,0.85)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(124,58,237,0.4)",
        color: "var(--purple-light)",
        boxShadow: "0 0 20px rgba(124,58,237,0.25)",
        animation: "donate-pulse 3s ease-in-out infinite",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 40px rgba(124,58,237,0.5), 0 0 80px rgba(6,182,212,0.2)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1.06)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.7)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(124,58,237,0.25)";
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(124,58,237,0.4)";
      }}
    >
      ☕ <span>Donate</span>
    </button>
  );
}

function Router() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/app" component={HomePage} />
        <Route path="/pay/:linkId" component={PayPage} />
        <Route path="/claim" component={ClaimPage} />
        <Route path="/donate" component={DonatePage} />
        <Route component={NotFound} />
      </Switch>
      <DonateButton />
    </>
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
