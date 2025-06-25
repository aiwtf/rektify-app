require("dotenv").config();
const { Connection, Keypair, VersionedTransaction, PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID } = require("@solana/spl-token");
const axios = require("axios");
const bs58 = require("bs58");

// 1. Initialize
const connection = new Connection("https://api.devnet.solana.com");
const privateKeyBytes = JSON.parse(process.env.DEV_WALLET_PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));

// Target: Convert "Wrapped SOL" to "USDC" for testing
const INPUT_MINT_ADDRESS = "So11111111111111111111111111111111111111112"; // Wrapped SOL
const OUTPUT_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

async function main() {
    console.log(`Using wallet: ${wallet.publicKey.toBase58()}`);

    // 2. Get token accounts using getTokenAccountsByOwner
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_PROGRAM_ID
    });
    
    console.log(`Found ${tokenAccounts.value.length} token accounts`);
    
    // For now, let's just test with a small amount of SOL
    console.log("Testing with 0.1 SOL...");
    
    // 3. Get quote from Jupiter API for 0.1 SOL
    const amountInLamports = 0.1 * 1e9; // 0.1 SOL in lamports
    console.log("Getting Jupiter quote...");
    
    try {
        const quoteResponse = await axios.get("https://quote-api.jup.ag/v6/quote", {
            params: {
                inputMint: INPUT_MINT_ADDRESS,
                outputMint: OUTPUT_MINT_ADDRESS,
                amount: amountInLamports.toString(),
                slippageBps: 50
            }
        });
        
        console.log("Quote received:", quoteResponse.data);

        // 4. Get swap transaction data from Jupiter API
        console.log("Getting swap transaction...");
        const { data } = await axios.post("https://quote-api.jup.ag/v6/swap", {
            quoteResponse: quoteResponse.data,
            userPublicKey: wallet.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
        });
        
        // 5. Deserialize, sign and send transaction
        const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
        var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        
        transaction.sign([wallet]);

        console.log("Sending transaction...");
        const rawTransaction = transaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });
        
        await connection.confirmTransaction(txid);
        console.log(`Transaction successful! TX ID: ${txid}`);
        console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${txid}?cluster=devnet`);
    } catch (error) {
        console.error("Error during swap:", error.response?.data || error.message);
    }
}

main().catch(err => {
    console.error("Error:", err);
});
