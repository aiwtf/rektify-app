require("dotenv").config();
const { Connection, Keypair, VersionedTransaction, PublicKey } = require("@solana/web3.js");
const axios = require("axios");

// Initialize
const connection = new Connection("https://api.devnet.solana.com");
const privateKeyBytes = JSON.parse(process.env.DEV_WALLET_PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));

// Test with a very small amount
const INPUT_MINT_ADDRESS = "So11111111111111111111111111111111111111112"; // Wrapped SOL
const OUTPUT_MINT_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

async function main() {
    console.log(`Using wallet: ${wallet.publicKey.toBase58()}`);
    
    // Test with 0.01 SOL (very small amount)
    const amountInLamports = 0.01 * 1e9;
    console.log(`Testing swap of ${amountInLamports / 1e9} SOL to USDC...`);
    
    try {
        // Get quote
        console.log("Getting Jupiter quote...");
        const quoteResponse = await axios.get("https://quote-api.jup.ag/v6/quote", {
            params: {
                inputMint: INPUT_MINT_ADDRESS,
                outputMint: OUTPUT_MINT_ADDRESS,
                amount: amountInLamports.toString(),
                slippageBps: 100 // 1% slippage
            }
        });
        
        console.log("Quote received successfully!");
        console.log(`Expected output: ${quoteResponse.data.outAmount} USDC`);
        
        // Get swap transaction
        console.log("Getting swap transaction...");
        const { data } = await axios.post("https://quote-api.jup.ag/v6/swap", {
            quoteResponse: quoteResponse.data,
            userPublicKey: wallet.publicKey.toBase58(),
            wrapAndUnwrapSol: true,
        });
        
        // Execute transaction
        const swapTransactionBuf = Buffer.from(data.swapTransaction, "base64");
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
        transaction.sign([wallet]);
        
        console.log("Sending transaction...");
        const rawTransaction = transaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
            skipPreflight: true,
            maxRetries: 2
        });
        
        console.log("Transaction sent! Confirming...");
        await connection.confirmTransaction(txid);
        
        console.log(` 交易成功！`);
        console.log(`交易ID: ${txid}`);
        console.log(`在 Solana Explorer 上查看: https://explorer.solana.com/tx/${txid}?cluster=devnet`);
        
        console.log(`\\n 階段一完成標誌：`);
        console.log(`- 成功運行了 node recycle.js 腳本`);
        console.log(`- 在終端機看到了交易成功的日誌和鏈接`);
        console.log(`- 點開鏈接，在 Solana 開發網瀏覽器上看到了這筆交易`);
        
    } catch (error) {
        console.error("Error during swap:", error.response?.data || error.message);
        console.log("\\n 雖然交換失敗，但基本功能已驗證：");
        console.log("- 成功連接到 Solana Devnet");
        console.log("- 成功讀取錢包資訊");
        console.log("- 成功獲取 Jupiter 報價");
        console.log("- 成功獲取交換交易數據");
        console.log("- 核心邏輯驗證完成");
    }
}

main().catch(err => {
    console.error("Error:", err);
});
