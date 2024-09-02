/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { Web3AuthProvider } from "@web3auth/modal-react-hooks";
import { web3AuthContextConfig } from "./web3AuthConfig";
import Playground from "./Playground";

function App() {
  return (
    <Web3AuthProvider config={web3AuthContextConfig}>
      <Playground></Playground>
    </Web3AuthProvider>
  );
}

export default App;
