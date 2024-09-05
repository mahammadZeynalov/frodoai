import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3AuthOptions } from "@web3auth/modal";
import { Web3AuthContextConfig } from "@web3auth/modal-react-hooks";

export const WEB3_AUTH_CLIENT_ID =
  "BOOSsxAbzwzM8QwHTddl1GHVfK4naj8224Y9zSQVhYmbpZTK44fDl-4xMbjOEVHMXPpyaF20dtM8ncHSEvcxFRQ";

export const CHAIN_ID = "0xaa289";

export const CHAIN_CONFIG = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa289",
  tickerName: "Galadriel Devnet",
  ticker: "GAL",
  blockExplorerUrl: "https://explorer.galadriel.com",
  rpcTarget: "https://devnet.galadriel.com/",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: CHAIN_CONFIG },
});

export const web3AuthOptions: Web3AuthOptions = {
  chainConfig: CHAIN_CONFIG,
  clientId: WEB3_AUTH_CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET,
  privateKeyProvider,
};

export const web3AuthContextConfig: Web3AuthContextConfig = {
  web3AuthOptions,
};
