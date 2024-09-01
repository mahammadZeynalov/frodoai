import { CHAIN_NAMESPACES } from "@web3auth/base";

export const CLIENT_ID =
  "BOOSsxAbzwzM8QwHTddl1GHVfK4naj8224Y9zSQVhYmbpZTK44fDl-4xMbjOEVHMXPpyaF20dtM8ncHSEvcxFRQ";

export const CHAIN_CONFIG = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

export const TABLE_NAME = "game_table_11155111_1793";
