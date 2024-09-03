/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { useEffect, useState } from "react";
import { Contract, ethers, TransactionReceipt } from "ethers";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";
import { galadriel, GALADRIEL_CONFIG } from "./consts";

interface Message {
  role: string;
  content: string;
}

function Playground() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isGameCreationLoading, setIsGameCreationLoading] = useState(false);
  const { initModal, provider, web3Auth, isConnected, connect, logout } =
    useWeb3Auth();

  const initGame = async (auto: boolean) => {
    let chatId: any;
    if (auto) {
      chatId = localStorage.getItem("chatId");
      if (chatId) {
        chatId = Number(chatId);
      } else {
        chatId = createChat();
      }
      initChatLoop(chatId);
    } else {
      chatId = createChat();
      initChatLoop(chatId);
    }
  };

  const createChat = async () => {
    // Call the startChat function
    setIsGameCreationLoading(true);
    const transactionResponse = await galadriel.startChat(
      GALADRIEL_CONFIG.promptToAskQuestion
    );
    const receipt = await transactionResponse.wait();
    setIsGameCreationLoading(false);
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
  };

  const initChatLoop = async (chatId: number) => {
    const allMessages: Message[] = [];
    // Run the chat loop: read messages and send messages
    while (true) {
      const newMessages: Message[] = await getNewMessages(
        galadriel,
        chatId,
        allMessages.length
      );
      if (newMessages) {
        for (const message of newMessages) {
          console.log(`${message.role}: ${message.content}`);
          allMessages.push(message);
          if (allMessages.at(-1)?.role === "assistant") {
            const message = currentAnswer;
            const transactionResponse = await galadriel.addMessage(
              message,
              chatId
            );
            const receipt = await transactionResponse.wait();
            console.log(`Message sent, tx hash: ${receipt.hash}`);
          }
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const getQuestion = async () => {};

  const answerQuestion = async (answer: string) => {};

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
      initGame(true);
    }
  }, [isConnected, walletAddress]);

  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <div className="mt-3">
        Help Frodo to ask questions and burn ring in Morder!
      </div>
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
  chatId: number,
  currentMessagesCount: number
): Promise<Message[]> {
  const messages = await contract.getMessageHistory(chatId);

  const newMessages: Message[] = [];
  messages.forEach((message: any, i: number) => {
    if (i >= currentMessagesCount) {
      newMessages.push({
        role: message[0],
        content: message.content[0].value,
      });
    }
  });
  return newMessages;
}
