import type { Wallet, WalletAccount } from "@wallet-standard/base";
import { NETWORK, RPC_URL, RPC_WS_URL, INDEXER_URL } from "./constants";

export async function createUmbraClient(wallet: Wallet, account: WalletAccount) {
  const { getUmbraClient, createSignerFromWalletAccount } = await import("@umbra-privacy/sdk");
  const signer = createSignerFromWalletAccount(wallet, account);
  const client = await getUmbraClient({
    signer,
    network: NETWORK,
    rpcUrl: RPC_URL,
    rpcSubscriptionsUrl: RPC_WS_URL,
    indexerApiEndpoint: INDEXER_URL,
    deferMasterSeedSignature: true,
  });
  return { client, signer };
}
