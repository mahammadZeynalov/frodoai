import "./App.css";
import { useEffect, useState } from "react";
import { Contract, ethers, TransactionReceipt } from "ethers";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { galadriel } from "./consts";
import promptFile from "./assets/prompt.txt";
import TypingEffect from "./helpers";

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
  const [prompt, setPrompt] = useState<string>("");

  const initializeGame = async () => {
    const chatId = localStorage.getItem("chatId");
    if (chatId) {
      setAiChatId(Number(chatId));
    } else {
      createChat().then((newChatId) => setAiChatId(newChatId));
    }
  };

  const createChat = async () => {
    setIsChatLoading(true);
    try {
      const transactionResponse = await galadriel.startChat(prompt);
      const receipt = await transactionResponse.wait();
      console.log(`Message sent, tx hash: ${receipt.hash}`);
      console.log(`Chat started with message: "${prompt}"`);

      const chatId = getChatId(receipt, galadriel);
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
    if (!aiChatId) return;
    setIsPostMessageLoading(true);
    try {
      const transactionResponse = await galadriel.addMessage(message, aiChatId);
      const receipt = await transactionResponse.wait();
      console.log(`Message sent, tx hash: ${receipt.hash}`);
      const newMessages = await getNewMessages(galadriel, aiChatId);
      console.log("newMessages: ", newMessages);
      setMessages(newMessages.filter((message) => message.id !== 0));
    } catch (error) {
      console.error(error);
    } finally {
      setIsPostMessageLoading(false);
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
      console.log("Wallet address: ", walletAddress);
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
      fetchAddress();
    }
  }, [isConnected, provider]);

  useEffect(() => {
    if (isConnected && walletAddress && prompt) {
      initializeGame();
    }
  }, [isConnected, walletAddress, prompt]);

  useEffect(() => {
    if (aiChatId) {
      getMessages(aiChatId);
    }
  }, [aiChatId]);

  const getMessages = async (aiChatId: number) => {
    setIsChatLoading(true);
    try {
      let ms = [];
      while (ms.length < 2) {
        const newMessages = await getNewMessages(galadriel, aiChatId);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log("newMessages: ", newMessages);
        ms = [...newMessages];
        setMessages(newMessages.filter((message) => message.id !== 0));
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

  console.log(messages);
  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <h5 className="mt-4">
        Help Frodo to ask questions and burn the ring in Mordor!
      </h5>
      {isChatLoading ? (
        <div className="loading-indicator">
          <div className="spinner-border text-primary mt-4" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="loading-text">Loading the game...</div>
        </div>
      ) : (
        <div className="mt-4">
          {messages.map((msg, index) => {
            // we only need to mimic the typing effect for the last message
            if (index === messages.length - 1) {
              return (
                <div key={msg.id} className="typing-effect">
                  <span>{msg.role}: </span>
                  <TypingEffect text={msg.content} speed={50} />
                </div>
              );
            } else {
              return (
                <div key={msg.id} className="typing-effect">
                  <span>{msg.role}: </span>
                  <span>{msg.content}</span>
                </div>
              );
            }
          })}
          <div className="chat-input">
            <input
              type="text"
              className="form-control"
              placeholder="Write your answer here..."
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
  return messages.map((message: any, index: number) => ({
    id: index,
    role: message[0],
    content: message.content[0].value,
  }));
}
