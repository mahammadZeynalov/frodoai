import GALADRIEL_ABI from "../assets/ChatGpt.json";
import { Contract, ethers, Wallet } from "ethers";

export const GALADRIEL_CONFIG = {
  rpcUrl: "https://devnet.galadriel.com/",
  contractAddress: "0x77dAC2431273c5200E243e044EAfBBcB6A21069D",
  privateKey:
    "19d271c33253cbcc08c63025cc3fbefd6e9f0af875079518d5a4078187705049",
  abi: GALADRIEL_ABI,
};

const provider = new ethers.JsonRpcProvider(GALADRIEL_CONFIG.rpcUrl);
const wallet = new Wallet(GALADRIEL_CONFIG.privateKey, provider);
export const galadriel = new Contract(
  GALADRIEL_CONFIG.contractAddress,
  GALADRIEL_CONFIG.abi,
  wallet
);
