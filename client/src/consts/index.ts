import CHAT_ABI from "../assets/ChatGpt.json";
import NFT_MINTER_ABI from "../assets/DalleNft.json";

export const GALADRIEL_CONFIG = {
  rpcUrl: "https://devnet.galadriel.com/",
  chatContractAddress: "0xE8775D4b4F016F0ED9Cc30B6fF604676371E8457",
  nftMinterContractAddress: "0xC59Df6A81bB91F71a08C092d8Bb21664498ceB01",
  chatAbi: CHAT_ABI,
  nftMinterAbi: NFT_MINTER_ABI,
};

export const ADVENTURE_OUTCOME_PROMPT = {
  "CORRECT-3":
    "Generate an NFT featuring Frodo from 'The Lord of the Rings' successfully destroying the One Ring. There should be a few words in Sindarin at the bottom of the image.",
  "CORRECT-2":
    "Generate an NFT featuring Frodo from 'The Lord of the Rings' successfully destroying the One Ring, but he is injured. There should be a few words in Sindarin at the bottom of the image.",
  "CORRECT-1":
    "Generate an NFT featuring the One Ring from 'The Lord of the Rings,' which has been lost along the way. There should be a few words in Sindarin at the bottom of the image.",
  "CORRECT-0":
    "Generate an NFT featuring Frodo from 'The Lord of the Rings' attempting to wear the Ring, becoming the new Dark Lord. There should be a few words in Sindarin at the bottom of the image.",
};
