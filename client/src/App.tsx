/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import { useEffect, useState } from "react";
import { Database } from "@tableland/sdk";
import RPC from "./ethersRPC";
import { CHAIN_CONFIG, CLIENT_ID, TABLE_NAME } from "./consts";
import { ethers } from "ethers";
import { GameStatus } from "./models";

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig: CHAIN_CONFIG },
});

const web3auth = new Web3Auth({
  clientId: CLIENT_ID,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [db, setDb] = useState<Database>();

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
      .bind(walletAddress, "Math", 1, GameStatus.IN_PROGRESS)
      .run();
    const response = await insert.txn?.wait();
    console.log("Create game response: ", response);
  };

  const login = async () => {
    // IMP START - Login
    const web3authProvider = await web3auth.connect();
    // IMP END - Login
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const logout = async () => {
    // IMP START - Logout
    await web3auth.logout();
    // IMP END - Logout
    setProvider(null);
    setLoggedIn(false);
  };

  const loggedInView = (
    <>
      <div>Wallet address: {walletAddress}</div>
      <div className="flex-container">
        {/* <div>
          <button onClick={() => insert()} className="card">
            DB insert
          </button>
        </div> */}
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
          <button onClick={logout} className="card">
            Log Out
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
      <h1>Gandalf AI</h1>
      <div className="grid">{loggedIn ? loggedInView : unloggedInView}</div>
      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </div>
  );
}

export default App;
