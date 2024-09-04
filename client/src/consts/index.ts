import CHAT_ABI from "../assets/ChatGpt.json";
import NFT_MINTER_ABI from "../assets/DalleNft.json";
import { Contract, ethers, Wallet } from "ethers";

export const GALADRIEL_CONFIG = {
  rpcUrl: "https://devnet.galadriel.com/",
  chatContractAddress: "0xE8775D4b4F016F0ED9Cc30B6fF604676371E8457",
  nftMinterContractAddress: "0xC59Df6A81bB91F71a08C092d8Bb21664498ceB01",
  privateKey:
    "19d271c33253cbcc08c63025cc3fbefd6e9f0af875079518d5a4078187705049",
  chatAbi: CHAT_ABI,
  nftMinterAbi: NFT_MINTER_ABI,
};

const provider = new ethers.JsonRpcProvider(GALADRIEL_CONFIG.rpcUrl);
const wallet = new Wallet(GALADRIEL_CONFIG.privateKey, provider);
export const galadrielChat = new Contract(
  GALADRIEL_CONFIG.chatContractAddress,
  GALADRIEL_CONFIG.chatAbi,
  wallet
);
