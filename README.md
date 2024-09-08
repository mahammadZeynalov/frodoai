# FrodoAI - Interactive Quiz Game

FrodoAI is an interactive quiz game where you embark on an adventure as Frodo Baggins from The Lord of the Rings.
Answer questions posed by characters from Middle-earth and influence the fate of the One Ring. Will you destroy it, or will it remain lost?

The application leverages the Galadriel to interact directly with OpenAI from smart contracts. Instead of making requests to OpenAI through a backend server, the smart contracts communicate with OpenAI, allowing seamless integration and interaction with the AI model within the decentralized ecosystem. This approach enhances security and decentralization by eliminating the need for a centralized backend for AI requests.

Additionally, the Web3Auth library is integrated to simplify user onboarding. Its embedded accounts feature allows Web2 users to seamlessly create accounts and start engaging with the application without requiring prior knowledge of Web3, making it accessible to a broader audience.

## Features:

- **Character-driven Questions:** Each question is presented by a unique character from The Lord of the Rings.
- **Dynamic Outcomes:** Your answers determine the fate of the One Ring.
- **Engaging Storyline:** Every question comes with a short introduction connected to Frodo's adventure.

## Tech Stack

- **Frontend:** React
- **Blockchain** Solidity contracts using the Galadriel.
- **Authentication** Integration with Web3Auth for seamless login and embedded accounts.

## Smart Contracts

- Chat (Galadriel devnet): `0xE8775D4b4F016F0ED9Cc30B6fF604676371E8457`
- NFT minting (Galadriel devnet): `0xC59Df6A81bB91F71a08C092d8Bb21664498ceB01`

You can use them, or deploy contract by your own. You can find contracts in web3 folder.

## Run application

1. Checkout client folder

   ```bash
   cd client
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Run the application

   ```bash
   npm run start
   ```
