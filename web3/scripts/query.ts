import "@nomicfoundation/hardhat-ethers";
import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

async function main() {
  const privateKey = process.env.ETHEREUM_SEPOLIA_PRIVATE_KEY;
  if (!privateKey) throw Error("Missing PRIVATE_KEY in .env");

  const wallet = new Wallet(privateKey);

  // To avoid connecting to the browser wallet (locally, port 8545).
  // For example: "https://polygon-amoy.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
  const apikey = process.env.ETHEREUM_SEPOLIA_API_KEY;
  if (!apikey) throw Error("Missing ETHEREUM_SEPOLIA_API_KEY in .env");

  const provider = getDefaultProvider(
    `https://eth-sepolia.g.alchemy.com/v2/${apikey}`
  );
  const signer = wallet.connect(provider);

  // Connect to the database
  const db = new Database({ signer });
  const tableName = "game_table_11155111_1793";

  // Insert a row into the table
  console.log("Start test insert.");
  const { meta: insert } = await db
    .prepare(
      `INSERT INTO ${tableName} (wallet_address, mode, question_number, result, active) VALUES (?, ?, ?, ?, ?);`
    )
    .bind("0x3Df03C634FF941B73221b4baAcaaACE1D943fb22", "History", 1, 1, 1)
    .run();

  // Wait for transaction finality
  await insert.txn?.wait();
  console.log("Start test query.");
  const { results } = await db.prepare(`SELECT * FROM ${tableName};`).all();
  console.log(results);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
