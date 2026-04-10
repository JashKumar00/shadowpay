import { useState, useCallback, createContext, useContext } from "react";
import { WalletModal } from "./WalletModal";

interface WalletModalCtx {
  visible: boolean;
  setVisible: (v: boolean) => void;
}

const WalletModalContext = createContext<WalletModalCtx>({
  visible: false,
  setVisible: () => {},
});

export function useWalletModal() {
  return useContext(WalletModalContext);
}

export function WalletModalProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisibleRaw] = useState(false);
  const setVisible = useCallback((v: boolean) => setVisibleRaw(v), []);

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <WalletModal open={visible} onClose={() => setVisibleRaw(false)} />
    </WalletModalContext.Provider>
  );
}
