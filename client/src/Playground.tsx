import "./App.css";
import { useEffect, useState } from "react";
import { Contract, ethers, TransactionReceipt, Wallet } from "ethers";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { GALADRIEL_CONFIG } from "./consts";
import promptFile from "./assets/prompt.txt";
import TypingEffect from "./helpers";
import landingImage from "./assets/frodo_ai.png";
import { ulid } from "ulid";
import EthereumRPC from "./web3RPC";

enum Role {
  assistant = "assistant",
  user = "user",
}

enum PageMode {
  game = "game",
  gallery = "gallery",
}

interface Message {
  id: string;
  role: Role;
  content: string;
}

export interface Nft {
  tokenUri: string;
  txHash?: string;
}

const GAME_OVER_INDICATOR = "GAME IS OVER";
const HTML_REGULAR =
  /<(?!img|table|\/table|thead|\/thead|tbody|\/tbody|tr|\/tr|td|\/td|th|\/th|br|\/br).*?>/gi;

function Playground() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPostMessageLoading, setIsPostMessageLoading] = useState(false);
  const {
    initModal,
    provider,
    web3Auth,
    isConnected,
    connect,
    logout,
    status,
  } = useWeb3Auth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiChatId, setAiChatId] = useState<number>();
  const [prompt, setPrompt] = useState<string>("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [pageMode, setPageMode] = useState(PageMode.game);
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [isMinting, setIsMinting] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [balance, setBalance] = useState("");
  const [isGameStarted, setIsGameStarted] = useState(false);

  const initializeGame = async () => {
    const chatId = localStorage.getItem("chatId");
    if (chatId) {
      setAiChatId(Number(chatId));
    } else {
      createChat().then((newChatId) => setAiChatId(newChatId));
    }
  };

  const createChat = async () => {
    if (!provider) return;
    setIsChatLoading(true);
    try {
      console.log("Start Chat initiated");
      const chatContract = getConnectionContract(
        privateKey,
        GALADRIEL_CONFIG.chatContractAddress,
        GALADRIEL_CONFIG.chatAbi
      );
      const transactionResponse = await chatContract.startChat(prompt);
      const receipt = await transactionResponse.wait();
      console.log(`Message sent, tx hash: ${receipt.hash}`);

      const chatId = getChatId(receipt, chatContract);
      if (chatId !== undefined) {
        localStorage.setItem("chatId", chatId.toString());
      }
      return chatId;
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const postMessage = async (message: string) => {
    if (!aiChatId || !provider) return;
    setIsPostMessageLoading(true);
    try {
      console.log("addMessage started");
      setMessages((prev) => [
        ...prev,
        { role: Role.user, content: message, id: ulid() },
      ]);
      const chatContract = getConnectionContract(
        privateKey,
        GALADRIEL_CONFIG.chatContractAddress,
        GALADRIEL_CONFIG.chatAbi
      );
      const transactionResponse = await chatContract.addMessage(
        message,
        aiChatId
      );
      const receipt = await transactionResponse.wait();
      console.log(`Message sent, tx hash: ${receipt.hash}`);

      let ms: Message[] = [];
      while (!ms.length || ms[ms.length - 1]?.role === Role.user) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const newMessages = await getNewMessages(chatContract, aiChatId);
        ms = [...newMessages];
        setMessages(newMessages);
        setCurrentAnswer("");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPostMessageLoading(false);
    }
  };

  const restart = () => {
    localStorage.removeItem("chatId");
    window.location.reload();
  };

  const onMint = async (val: string) => {
    const input = (val.replace(HTML_REGULAR, "") || "").replace(
      /(<br\s*\/?>\s*)+$/,
      ""
    );
    if (!provider || !input) return;

    setIsMinting(true);
    try {
      const nftContract = getConnectionContract(
        privateKey,
        GALADRIEL_CONFIG.nftMinterContractAddress,
        GALADRIEL_CONFIG.nftMinterAbi
      );
      console.log("initializeMint started");
      const tx = await nftContract.initializeMint(input);
      const receipt = await tx.wait();
      console.log("initializeMint ended: ", receipt);
      localStorage.removeItem("chatId");
      setAiChatId(undefined);
      const tokenId = getNftId(receipt, nftContract);
      if (tokenId !== undefined) {
        const tokenUri = await pollTokenUri(nftContract, tokenId);
        console.log("token uri: ", tokenUri);
        if (tokenUri) {
          setNfts((prev) => {
            return prev.map((i) => {
              if (i.tokenUri === tokenUri) {
                return { tokenUri, txHash: receipt.hash };
              } else {
                return i;
              }
            });
          });
        }
      }
      getUserNfts();
      setPageMode(PageMode.gallery);
      setAiChatId(undefined);
      setIsGameStarted(false);
      setIsGameOver(false);
      localStorage.removeItem("chatId");
    } catch (e) {
      console.log(e);
    } finally {
      setIsMinting(false);
    }
  };

  const getNftId = (
    receipt: TransactionReceipt,
    contract: Contract
  ): number | undefined => {
    let nftId;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === "MintInputCreated") {
          // Second event argument
          nftId = ethers.toNumber(parsedLog.args[1]);
        }
      } catch (error) {
        // This log might not have been from your contract, or it might be an anonymous log
        console.log("Could not parse log:", log);
      }
    }
    return nftId;
  };

  const pollTokenUri = async (
    contract: Contract,
    tokenId: number
  ): Promise<string | undefined> => {
    // max amount of time to wait
    for (let i = 0; i < 120; i++) {
      try {
        const uri = await contract.tokenURI(tokenId);
        if (uri) return uri;
      } catch (e) {}
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        if (web3Auth) {
          await initModal();
        }
      } catch (error) {
        console.error(error);
      }
    };

    initialize();
  }, [initModal, web3Auth]);

  useEffect(() => {
    if (walletAddress) {
      getUserNfts();
      getBalance();
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && provider) {
      const fetchAddress = async () => {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      };
      const getPrivateKey = async () => {
        const ethereumRPC = new EthereumRPC(provider);
        const key = await ethereumRPC.getPrivateKey();
        setPrivateKey(key);
      };
      fetchAddress();
      getPrivateKey();
    }
  }, [isConnected, provider]);

  useEffect(() => {
    if (aiChatId) {
      getMessages(aiChatId);
    }
  }, [aiChatId]);

  const getMessages = async (aiChatId: number) => {
    setIsChatLoading(true);
    const chatContract = getConnectionContract(
      privateKey,
      GALADRIEL_CONFIG.chatContractAddress,
      GALADRIEL_CONFIG.chatAbi
    );
    try {
      let ms: Message[] = [];
      while (!ms.length || ms[ms.length - 1]?.role === Role.user) {
        const newMessages = await getNewMessages(chatContract, aiChatId);
        ms = [...newMessages];
        setMessages(newMessages);
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  useEffect(() => {
    // Fetching the text file content
    fetch(promptFile)
      .then((response) => response.text())
      .then((prompt) => {
        setPrompt(prompt);
      })
      .catch((error) => {
        console.error("Error fetching the text file:", error);
      });
  }, []);

  useEffect(() => {
    if (
      messages.length &&
      messages[messages.length - 1].content.includes(GAME_OVER_INDICATOR)
    ) {
      setIsGameOver(true);
    }
  }, [messages]);

  useEffect(() => {
    if (isGameStarted) {
      initializeGame();
    }
  }, [isGameStarted]);

  const getUserNfts = async () => {
    const nftContract = getConnectionContract(
      privateKey,
      GALADRIEL_CONFIG.nftMinterContractAddress,
      GALADRIEL_CONFIG.nftMinterAbi
    );
    let indexedUserNfts: Nft[] = [];
    for (let i = 0; i < 10; i++) {
      try {
        const token = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
        if (token !== undefined) {
          const tokenUri = await nftContract.tokenURI(token);
          if (tokenUri) indexedUserNfts = [{ tokenUri }, ...indexedUserNfts];
        }
      } catch (e) {
        break;
      }
    }
    console.log(indexedUserNfts);
    setNfts(indexedUserNfts);
  };

  const getConnectionContract = (
    privateKey: string,
    contractAddress: string,
    abi: any
  ) => {
    const provider = new ethers.JsonRpcProvider(GALADRIEL_CONFIG.rpcUrl);
    const wallet = new Wallet(privateKey, provider);
    const contract = new Contract(contractAddress, abi, wallet);
    return contract;
  };

  const openImg = (link: string) => {
    window.open(link, "_blank");
  };

  const getBalance = async () => {
    const rpc = new EthereumRPC(provider!);
    const balance = await rpc.getBalance();
    setBalance(balance);
  };

  const isEnoughBalance =
    canBeParsedToNumber(balance) && Number(balance) >= 0.01;

  const loggedInView = (
    <>
      <div className="mt-4">
        <div>Wallet address: {walletAddress}</div>
        <div>Balance: {balance}</div>
      </div>

      {pageMode === PageMode.game && (
        <>
          {isEnoughBalance ? (
            isGameStarted &&
            (isChatLoading ? (
              <div className="loading-indicator">
                <div className="spinner-border text-primary mt-4" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <div className="loading-text">Loading the game...</div>
              </div>
            ) : (
              <div className="mt-4 chat">
                {messages.map((msg, index) => {
                  // we only need to mimic the typing effect for the last message
                  if (
                    index === messages.length - 1 &&
                    msg.role === Role.assistant
                  ) {
                    return (
                      <div key={msg.id} className="typing-effect mb-2">
                        <span style={{ fontWeight: "bold" }}>
                          {"Galadriel: "}
                        </span>
                        <TypingEffect text={msg.content} speed={40} />
                      </div>
                    );
                  } else {
                    return (
                      <div key={msg.id} className="typing-effect mb-2">
                        <span style={{ fontWeight: "bold" }}>
                          {msg.role === Role.assistant ? "Galadriel" : "Frodo"}:{" "}
                        </span>
                        <span>{msg.content}</span>
                      </div>
                    );
                  }
                })}
                {!isGameOver ? (
                  <div className="chat-input-wrapper mt-3">
                    <div style={{ width: "100%" }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write your answer here..."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        disabled={isPostMessageLoading}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => postMessage(currentAnswer)}
                        disabled={isPostMessageLoading}
                      >
                        Answer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {isMinting ? (
                      <div>
                        Minting NFT... You'll be able to find it in Gallery soon
                      </div>
                    ) : (
                      <button
                        className="btn btn-outline-secondary mt-3"
                        type="button"
                        onClick={() => {
                          const message = messages[messages.length - 1].content
                            .split("\n")
                            .join(" ");

                          onMint(message);
                        }}
                      >
                        Mint NFT
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="mt-4">
              <div>
                To play the game, you'll need at least 0.01 GAL (the native
                token).
              </div>
              <div>
                Follow this guide to claim your tokens:<span> </span>
                <span>
                  <a
                    href="https://docs.galadriel.com/faucet"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://docs.galadriel.com/faucet
                  </a>
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {pageMode === PageMode.gallery && (
        <div>
          {isMinting && (
            <div className="mt-3">NFT is generating right now...</div>
          )}

          <div
            style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}
            className="mt-4"
          >
            {nfts.map((i) => (
              <div key={i.tokenUri}>
                <img
                  src={i.tokenUri}
                  className="img-thumbnail"
                  style={{ width: "200px", cursor: "pointer" }}
                  alt={i.txHash}
                  onClick={() => openImg(i.tokenUri)}
                ></img>

                {i?.txHash && (
                  <div>
                    <a
                      className="underline"
                      href={`https://explorer.galadriel.com/tx/${i.txHash}`}
                      target="_blank"
                      style={{ color: "grey" }}
                    >
                      {i?.txHash?.slice(0, 12)}...
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
          {!!nfts.length && (
            <div className="mt-2">
              <a
                className="underline"
                href={`https://explorer.galadriel.com/address/${walletAddress}?tab=token_transfers`}
                target="_blank"
                style={{ color: "grey" }}
              >
                Check NFTs in Galadriel Block Explorer
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );

  const unloggedInView = (
    <div className="login-view">
      <div style={{ textAlign: "center" }}>
        Help Frodo on his adventure by answering questions that decide the fate
        of the Ring.
      </div>
      <div>
        <img className="frodo-img" src={landingImage} alt="frodo" />
      </div>
      <div>
        <button
          className="btn btn-outline-secondary"
          onClick={connect}
          disabled={status === "connecting" || status === "not_ready"}
        >
          Start journey
        </button>
      </div>
    </div>
  );

  return (
    <div className="container mt-3">
      <header className="header">
        <h1>Frodo AI</h1>
        {isConnected && (
          <div style={{ display: "flex", gap: "20px" }}>
            {pageMode === PageMode.game ? (
              <>
                {isEnoughBalance &&
                  (!aiChatId ? (
                    <button
                      onClick={() => setIsGameStarted(true)}
                      className="btn btn-outline-primary"
                      disabled={isMinting}
                    >
                      Start/Continue
                    </button>
                  ) : (
                    <button
                      onClick={restart}
                      className="btn btn-outline-secondary"
                      disabled={isChatLoading || isMinting}
                    >
                      Restart
                    </button>
                  ))}

                <button
                  onClick={() => setPageMode(PageMode.gallery)}
                  className="btn btn-outline-secondary"
                  disabled={isMinting}
                >
                  Switch to Gallery
                </button>
              </>
            ) : (
              <button
                onClick={() => setPageMode(PageMode.game)}
                className="btn btn-outline-secondary"
              >
                Switch to Game
              </button>
            )}
            <button
              onClick={() => {
                localStorage.removeItem("chatId");
                logout();
              }}
              className="btn btn-outline-secondary"
            >
              Log Out
            </button>
          </div>
        )}
      </header>

      <div>{isConnected ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </div>
  );
}

export default Playground;

function getChatId(receipt: TransactionReceipt, contract: Contract) {
  let chatId;
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog && parsedLog.name === "ChatCreated") {
        chatId = ethers.toNumber(parsedLog.args[1]);
      }
    } catch (error) {
      console.log("Could not parse log:", log);
    }
  }
  return chatId;
}

async function getNewMessages(
  contract: Contract,
  chatId: number
): Promise<Message[]> {
  const messages: Message[] = await contract.getMessageHistory(chatId);
  return messages
    .map((message: any) => ({
      id: ulid(),
      role: message[0],
      content: message.content[0].value.trim(),
    }))
    .filter((i, index) => index !== 0);
}

function canBeParsedToNumber(str: any) {
  return !isNaN(str) && !isNaN(parseFloat(str));
}
