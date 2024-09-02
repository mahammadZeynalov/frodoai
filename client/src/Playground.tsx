/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { IProvider } from "@web3auth/base";
import { useEffect, useState } from "react";
import { Database } from "@tableland/sdk";
import { GALADRIEL_CONFIG, TABLE_NAME } from "./consts";
import { Contract, ethers, Wallet } from "ethers";
import { AnswerType, Game, GameStatus } from "./models";
import { useWeb3Auth } from "@web3auth/modal-react-hooks";

const provider = new ethers.JsonRpcProvider(GALADRIEL_CONFIG.rpcUrl);
const wallet = new Wallet(GALADRIEL_CONFIG.privateKey, provider);
const contract = new Contract(
  GALADRIEL_CONFIG.contractAddress,
  GALADRIEL_CONFIG.abi,
  wallet
);

function Playground() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [dbClient, setDbClient] = useState<Database>();
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isAnswerLoading, setIsAnswerLoading] = useState(false);
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [isGameCreationLoading, setIsGameCreationLoading] = useState(false);
  const { initModal, provider, web3Auth, isConnected, connect, logout } =
    useWeb3Auth();

  const initDbClient = async (provider: IProvider) => {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const db = new Database({ signer });
    setDbClient(db);
  };

  const getUserGames = async () => {
    if (dbClient) {
      const response: any = await dbClient
        .prepare(
          `SELECT * FROM ${TABLE_NAME} where wallet_address='${walletAddress}';`
        )
        .all();
      const games = response.results as Game[];
      console.log("user games: ", games);
      const activeGame = games.find((i) => i.status === GameStatus.IN_PROGRESS);
      console.log("active game: ", activeGame);
      if (activeGame) {
        setActiveGame(activeGame);
      }
    }
  };

  const startNewGame = async () => {
    setIsGameCreationLoading(true);
    const { meta: insert } = await dbClient!
      .prepare(
        `INSERT INTO ${TABLE_NAME} (wallet_address, status) VALUES (?, ?);`
      )
      .bind(walletAddress, GameStatus.IN_PROGRESS)
      .run();
    const response = await insert.txn?.wait();
    console.log("Create game response: ", response);
    setIsGameCreationLoading(false);
    // Getting first question
    getQuestion();
  };

  const setQuestionInDb = async (npcName: string, questionText: string) => {
    const updateQuery = `
          UPDATE ${TABLE_NAME}
          SET npc_name = '${npcName}'
          current_question_text = '${questionText}'
          WHERE wallet_address='${walletAddress}';
    `;
    const { meta: insert } = await dbClient!.prepare(updateQuery).run();
    return insert.txn?.wait();
  };

  const getQuestion = async () => {
    console.log("Init question: ", GALADRIEL_CONFIG.promptToAskQuestion);
    setIsQuestionLoading(true);
    const transactionResponse = await contract.sendMessage(
      GALADRIEL_CONFIG.promptToAskQuestion
    );
    const receipt = await transactionResponse.wait();
    console.log(`Message sent, tx hash: ${receipt.hash}`);
    console.log(
      `Chat started with message: "${GALADRIEL_CONFIG.promptToAskQuestion}"`
    );

    // Read the LLM response on-chain
    while (true) {
      const current_question_text: string = await contract.response();
      console.log(current_question_text);
      if (current_question_text) {
        console.log("Galadriel ask following question:", current_question_text);
        console.log("updateGame start");
        const setQuestionInDbResponse = await setQuestionInDb(
          "Bilbo",
          current_question_text
        );
        console.log("setQuestionInDbResponse: ", setQuestionInDbResponse);
        setIsQuestionLoading(false);
        // should update values TODO
        setActiveGame((prev) => ({
          ...prev!,
          npc_name: "Bilbo",
          current_question_text,
        }));
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  const updateCounterInDb = async (isPreviousAnswerCorrect: boolean) => {
    const updateQuestionNumber = "question_number = question_number + 1";
    const updateCorrectAnswered = isPreviousAnswerCorrect
      ? "correct_answered = correct_answered + 1"
      : "";
    const updateStatus =
      activeGame?.question_number === 3
        ? `status = '${GameStatus.COMPLETED}'`
        : "";
    const fields = [
      updateQuestionNumber,
      updateCorrectAnswered,
      updateStatus,
    ].join(" ,");
    const updateQuery = `
          UPDATE ${TABLE_NAME}
          SET ${fields}
          WHERE wallet_address='${walletAddress}';
    `;
    console.log("query: ", updateQuery);
    const { meta: insert } = await dbClient!.prepare(updateQuery).run();
    return insert.txn?.wait();
  };

  const answerQuestion = async (answer: string) => {
    setIsAnswerLoading(true);
    const transactionResponse = await contract.sendMessage(
      `You asked me following question: ${activeGame?.current_question_text}. My answer is ${answer}. If the answer is correct send CORRECT. If the answer is not correct send NOT_CORRECT. Do not send anything besides CORRECT or NOT_CORRECT.`
    );
    await transactionResponse.wait();

    // Read the LLM response on-chain
    while (true) {
      const response: AnswerType = await contract.response();
      console.log(response);
      if (response) {
        setIsAnswerLoading(false);
        console.log("Your answer is:", response);
        const isCorrectAnswer = response === AnswerType.CORRECT;
        const updateCounterInDbResponse = await updateCounterInDb(
          isCorrectAnswer
        );
        console.log("updateCounterInDbResponse: ", updateCounterInDbResponse);
        setCurrentAnswer("");
        // should update values TODO
        setActiveGame((prev) => ({ ...prev!, current_question_text: "" }));
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
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
        console.log("called");
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const address = await signer.getAddress();
        setWalletAddress(address);
      };
      getAddress();
      initDbClient(provider);
    }
  }, [isConnected, provider]);

  useEffect(() => {
    if (dbClient) {
      getUserGames();
    }
  }, [dbClient]);

  useEffect(() => {
    if (activeGame?.status === GameStatus.COMPLETED) {
      console.log("Game completed.");
    } else if (activeGame && !activeGame.current_question_text) {
      getQuestion();
    }
  }, [activeGame]);

  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <div className="mt-3">
        Help Frodo to ask questions and burn ring in Morder!
      </div>

      {!activeGame && (
        <div className="mt-3">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => startNewGame()}
            disabled={isGameCreationLoading}
          >
            Start Game
          </button>
        </div>
      )}

      {activeGame && (
        <div className="mt-3">
          <div className="question">
            {isQuestionLoading ? (
              <span>Loading...</span>
            ) : (
              <h5>{activeGame.current_question_text}</h5>
            )}
          </div>
          <div className="mt-3">
            <div>
              <label className="form-label">Answer: </label>
              <input
                type="text"
                className="form-control"
                value={currentAnswer}
                onChange={(event) => setCurrentAnswer(event.target.value)}
                disabled={isQuestionLoading || isAnswerLoading}
              />
            </div>
            <button
              className="btn btn-primary mt-2"
              onClick={() => answerQuestion(currentAnswer)}
            >
              Submit answer
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
