import { CHAIN_NAMESPACES } from "@web3auth/base";

export const CLIENT_ID =
  "BOOSsxAbzwzM8QwHTddl1GHVfK4naj8224Y9zSQVhYmbpZTK44fDl-4xMbjOEVHMXPpyaF20dtM8ncHSEvcxFRQ";

export const CHAIN_ID = "0xaa36a7";

export const CHAIN_CONFIG = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: CHAIN_ID,
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

export const TABLE_NAME = "game_table_11155111_1795";
export const GALADRIEL_RPC_URL = "https://devnet.galadriel.com/";
export const GALADRIEL_CONTRACT_ADDRESS =
  "0xA793bBDfDeb15Fd9dC8Ba88f0531A03C97c161f4";
export const GALADRIEL_PRIVATE_KEY =
  "19d271c33253cbcc08c63025cc3fbefd6e9f0af875079518d5a4078187705049";
export const DEFAULT_QUESTION_PROMPT =
  "Ask me short question that relates to history. Formulate the question the way, so the answer for it will be one word.";
