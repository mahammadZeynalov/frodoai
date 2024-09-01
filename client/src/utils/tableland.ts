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
    .bind("0x3Df03C634FF941B73221b4baAcaaACE1D943fb22", "Geography", 1, 1, 1)
    .run();
  await insert.txn?.wait();

  console.log("Start test query.");
  const { results } = await db.prepare(`SELECT * FROM ${tableName};`).all();
  console.log(results);
};
