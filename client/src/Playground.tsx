/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { useEffect, useState } from "react";
import { Contract, ethers, TransactionReceipt } from "ethers";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { galadriel, GALADRIEL_CONFIG } from "./consts";

interface Message {
  id: number;
  role: string;
  content: string;
}

function Playground() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isPostMessageLoading, setIsPostMessageLoading] = useState(false);
  const { initModal, provider, web3Auth, isConnected, connect, logout } =
    useWeb3Auth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiChatId, setAiChatId] = useState<number>();

  const initGame = async () => {
    const chatId = localStorage.getItem("chatId");
    if (chatId) {
      setAiChatId(Number(chatId));
    } else {
      setAiChatId(await createChat());
    }
  };

  const createChat = async () => {
    setIsChatLoading(true);
    try {
      const transactionResponse = await galadriel.startChat(
        GALADRIEL_CONFIG.promptToAskQuestion
      );
      const receipt = await transactionResponse.wait();

      console.log(`Message sent, tx hash: ${receipt.hash}`);
      console.log(
        `Chat started with message: "${GALADRIEL_CONFIG.promptToAskQuestion}"`
      );

      // Get the chat ID from transaction receipt logs
      const chatId = getChatId(receipt, galadriel);

      console.log(`Created chat ID: ${chatId}`);
      if (!chatId && chatId !== 0) {
        return;
      }
      localStorage.setItem("chatId", chatId.toString());
      return chatId;
    } catch (e) {
      console.log(e);
    } finally {
      setIsChatLoading(false);
    }
  };

  const postMessage = async (message: string) => {
    setIsPostMessageLoading(true);

    try {
      const transactionResponse = await galadriel.addMessage(message, aiChatId);
      const receipt = await transactionResponse.wait();
      console.log(`Message sent, tx hash: ${receipt.hash}`);
      const data = await getNewMessages(galadriel, aiChatId!);
      setMessages(data);
    } catch (e) {
    } finally {
      setIsPostMessageLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (web3Auth) {
          await initModal();
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, [initModal, web3Auth]);

  useEffect(() => {
    if (walletAddress) {
      console.log("Wallet address: ", walletAddress);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && provider) {
      const getAddress = async () => {
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      };
      getAddress();
    }
  }, [isConnected, provider]);

  useEffect(() => {
    if (isConnected && walletAddress) {
      initGame();
    }
  }, [isConnected, walletAddress]);

  useEffect(() => {
    if (aiChatId) {
      getMessages();
    }
  }, [aiChatId]);

  const getMessages = async () => {
    try {
      setIsChatLoading(true);
      const data = await getNewMessages(galadriel, aiChatId!);
      setMessages(data);
    } catch (e) {
    } finally {
      setIsChatLoading(false);
    }
  };

  console.log(isChatLoading);

  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <h5 className="mt-3">
        Help Frodo to ask questions and burn ring in Morder!
      </h5>
      {isChatLoading ? (
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      ) : (
        <div className="chat-container">
          {messages.map((msg, index) => (
            <div key={index}>
              <span>{msg.role}</span>: <span>{msg.content}</span>
            </div>
          ))}
          {true && (
            <div className="chat-input">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
              />

              <button
                className="btn btn-primary"
                type="button"
                onClick={() => postMessage(currentAnswer)}
                disabled={isPostMessageLoading}
              >
                {isPostMessageLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      aria-hidden="true"
                    ></span>
                    <span role="status">Loading...</span>
                  </>
                ) : (
                  <>Answer</>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  const unloggedInView = (
    <button onClick={connect} className="card">
      Login
    </button>
  );

  return (
    <div className="container mt-3">
      <header className="header">
        <h1>Frodo AI</h1>
        {isConnected && (
          <div>
            <button onClick={() => logout()} className="card">
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
        // Second event argument
        chatId = ethers.toNumber(parsedLog.args[1]);
      }
    } catch (error) {
      // This log might not have been from your contract, or it might be an anonymous log
      console.log("Could not parse log:", log);
    }
  }
  return chatId;
}

async function getNewMessages(
  contract: Contract,
  chatId: number
): Promise<Message[]> {
  const messages = await contract.getMessageHistory(chatId);
  return messages.map((message: any, index: number) => {
    return {
      id: index,
      role: message[0],
      content: message.content[0].value,
    };
  });
}
