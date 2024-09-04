/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */
import "./App.css";
import { Web3AuthProvider } from "@web3auth/modal-react-hooks";
import { web3AuthContextConfig, web3AuthOptions } from "./web3AuthConfig";
import Playground from "./Playground";
import { useEffect, useState } from "react";
import { getDefaultExternalAdapters } from "@web3auth/default-evm-adapter";

function App() {
  const [config, setConfig] = useState(web3AuthContextConfig);

  useEffect(() => {
    const getAdapters = async () => {
      const adapters = await getDefaultExternalAdapters({
        options: web3AuthOptions,
      });
      setConfig((prev) => ({
        ...prev,
        adapters,
      }));
    };
    getAdapters();
  }, []);
  return (
    <Web3AuthProvider config={config}>
      <Playground></Playground>
    </Web3AuthProvider>
  );
}

export default App;
