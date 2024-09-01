/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import { useEffect, useState } from "react";
import { Database } from "@tableland/sdk";
import RPC from "./ethersRPC";
import {
  CHAIN_CONFIG,
  CLIENT_ID,
  DEFAULT_QUESTION_PROMPT,
  GALADRIEL_CONTRACT_ADDRESS,
  GALADRIEL_PRIVATE_KEY,
  GALADRIEL_RPC_URL,
  TABLE_NAME,
} from "./consts";
import { Contract, ethers, Wallet } from "ethers";
import { GameStatus } from "./models";
import GALADRIEL_ABI from "../../web3/ai/abis/OpenAiSimpleLLM.json";

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: CHAIN_CONFIG },
});

const web3auth = new Web3Auth({
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

const provider = new ethers.JsonRpcProvider(GALADRIEL_RPC_URL);
const wallet = new Wallet(GALADRIEL_PRIVATE_KEY, provider);
const contract = new Contract(
  GALADRIEL_CONTRACT_ADDRESS,
  GALADRIEL_ABI,
  wallet
);

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [db, setDb] = useState<Database>();
  const [isGaladrielLoading, setIsGaladrielLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();

        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const initDbClient = async (provider: IProvider) => {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const db = new Database({ signer });
    setDb(db);
  };

  useEffect(() => {
    if (walletAddress) {
      console.log("Wallet address: ", walletAddress);
    }
  }, [walletAddress]);
  useEffect(() => {
    if (loggedIn) {
      RPC.getAccounts(provider!).then((address) => setWalletAddress(address));
      initDbClient(provider!);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (db) {
      getUserGames();
    }
  }, [db]);

  const getUserGames = async () => {
    if (db) {
      const { results } = await db
        .prepare(
          `SELECT * FROM ${TABLE_NAME} where wallet_address='${walletAddress}';`
        )
        .all();
      console.log("games: ", results);
    }
  };

  const createGame = async () => {
    const { meta: insert } = await db!
      .prepare(
        `INSERT INTO ${TABLE_NAME} (wallet_address, mode, question_number, status) VALUES (?, ?, ?, ?);`
      )
      .bind(walletAddress, "History", 1, GameStatus.IN_PROGRESS)
      .run();
    const response = await insert.txn?.wait();
    console.log("Create game response: ", response);
  };

  const getQuestion = async () => {
    console.log("Init question: ", DEFAULT_QUESTION_PROMPT);
    setIsGaladrielLoading(true);
    const transactionResponse = await contract.sendMessage(
      DEFAULT_QUESTION_PROMPT
    );
    const receipt = await transactionResponse.wait();
    console.log(`Message sent, tx hash: ${receipt.hash}`);
    console.log(`Chat started with message: "${DEFAULT_QUESTION_PROMPT}"`);

    // Read the LLM response on-chain
    while (true) {
      const response = await contract.response();
      console.log(response);
      if (response) {
        setIsGaladrielLoading(false);
        setCurrentQuestion(response);
        console.log("Response from contract:", response);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const answerQuestion = async (answer: string) => {
    setIsGaladrielLoading(true);
    const transactionResponse = await contract.sendMessage(
      `You asked me following question: ${currentQuestion}. My answer is ${answer}. If the answer is correct send YES. If the answer is not correct send NO. Do not send anything besides YES or NO.`
    );
    const receipt = await transactionResponse.wait();
    console.log(`Message sent, tx hash: ${receipt.hash}`);

    // Read the LLM response on-chain
    while (true) {
      const response = await contract.response();
      console.log(response);
      if (response) {
        setIsGaladrielLoading(false);
        console.log("Response from contract:", response);
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const login = async () => {
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
  };

  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <div className="flex-container">
        <div>
          <button onClick={() => getUserGames()} className="card">
            Get games
          </button>
        </div>
        <div>
          <button onClick={() => createGame()} className="card">
            Create game
          </button>
        </div>
        <div>
          <button onClick={getQuestion} className="card">
            Ask Question
          </button>
        </div>
        <div>
          <button onClick={logout} className="card">
            Log Out
          </button>
        </div>
      </div>
      <div>
        <div className="question">
          {isGaladrielLoading ? (
            <span>Loading...</span>
          ) : (
            <span>{currentQuestion}</span>
          )}
        </div>
        <div className="answer">
          <div className="mb-3">
            <label className="form-label">Answer: </label>
            <input
              type="text"
              className="form-control"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              disabled={isGaladrielLoading}
            />
          </div>
          <button onClick={() => answerQuestion(answer)} className="card">
            Answer
          </button>
        </div>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={login} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1>Frodo AI</h1>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </div>
  );
}

export default App;
