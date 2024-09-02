// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10 <0.9.0;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {TablelandController} from "@tableland/evm/contracts/TablelandController.sol";
import {TablelandPolicy} from "@tableland/evm/contracts/TablelandPolicy.sol";
import {TablelandDeployments} from "@tableland/evm/contracts/utils/TablelandDeployments.sol";
import {SQLHelpers} from "@tableland/evm/contracts/utils/SQLHelpers.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

// Game template for contract owned and controlled tables
contract Game is TablelandController, ERC721Holder {
    uint256 private tableId; // Unique table ID
    string private constant _TABLE_PREFIX = "game_table"; // Custom table prefix

    // Constructor that creates a table, sets the controller, and inserts data
    constructor() {
        // Create a table
        tableId = TablelandDeployments.get().create(
            address(this),
            SQLHelpers.toCreateFromSchema(
                "id integer primary key, wallet_address text, npc_name text, question_number integer, current_question_text text, correct_answered integer, status text",
                _TABLE_PREFIX
            )
        );
        // Set the ACL controller to enable writes to others besides the table owner
        TablelandDeployments.get().setController(
            address(this), // Table owner, i.e., this contract
            tableId,
            address(this) // Set the controller address—also this contract
        );
    }

    // Sample getter to retrieve the table name
    function tableName() external view returns (string memory) {
        return SQLHelpers.toNameFromId(_TABLE_PREFIX, tableId);
    }

    function insertVal(string memory walletAddress) external {
        TablelandDeployments.get().mutate(
            address(this),
            tableId,
            SQLHelpers.toInsert(
                _TABLE_PREFIX,
                tableId,
                "walletAddress",
                SQLHelpers.quote(walletAddress)
            )
        );
    }

    function getPolicy(
        address,
        uint256
    ) public payable override returns (TablelandPolicy memory) {
        // Return allow-all policy
        return
            TablelandPolicy({
                allowInsert: true,
                allowUpdate: true,
                allowDelete: true,
                whereClause: "",
                withCheck: "",
                updatableColumns: new string[](0)
            });
    }
}
