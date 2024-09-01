import { Database } from "@tableland/sdk";
import type { IProvider } from "@web3auth/base";
import { ethers } from "ethers";

export const initDbClient = async (provider: IProvider | null) => {
  if (!provider) {
    throw Error("No provider");
  }
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  console.log("signed");

  const db = new Database({ signer });
  const tableName = "game_table_11155111_1793";

  console.log("Start test insert.");
  const { meta: insert } = await db
    .prepare(
      `INSERT INTO ${tableName} (owner_address, mode, question_number, result, active) VALUES (?, ?, ?, ?, ?);`
    )
    .bind("0xC6c21DcA4Fa722f0d389894225C4E74918931867", "Geography", 1, 1, 1)
    .run();
  await insert.txn?.wait();

  console.log("Start test query.");
  const { results } = await db.prepare(`SELECT * FROM ${tableName};`).all();
  console.log(results);
};
