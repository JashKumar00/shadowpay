import { ReactNode, createContext, useContext, useState } from "react";

interface WalletContextValue {
  wallet: any | null;
  account: any | null;
  setConnection: (wallet: any, account: any) => void;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  wallet: null,
  account: null,
  setConnection: () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<any | null>(null);
  const [account, setAccount] = useState<any | null>(null);

  function setConnection(w: any, a: any) {
    setWallet(w);
    setAccount(a);
  }

  function disconnect() {
    setWallet(null);
    setAccount(null);
  }

  return (
    <WalletContext.Provider value={{ wallet, account, setConnection, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
