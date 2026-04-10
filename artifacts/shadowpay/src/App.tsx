import { Switch, Route, Router as WouterRouter } from "wouter";
import { WalletProvider } from "@/components/WalletProvider";
import HomePage from "@/pages/HomePage";
import PayPage from "@/pages/PayPage";
import ClaimPage from "@/pages/ClaimPage";

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0a0a0f] text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">404</h1>
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
  return (
    <WalletProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </WalletProvider>
  );
}

export default App;
