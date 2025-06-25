require("dotenv").config();
const { Connection, Keypair, LAMPORTS_PER_SOL } = require("@solana/web3.js");

// Initialize
const connection = new Connection("https://api.devnet.solana.com");
const privateKeyBytes = JSON.parse(process.env.DEV_WALLET_PRIVATE_KEY);
const wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyBytes));

async function main() {
    console.log(`Using wallet: ${wallet.publicKey.toBase58()}`);
    
    // Get balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
    
    // Get token accounts
    const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
        programId: new (require("@solana/web3.js")).PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
    });
    
    console.log(`Found ${tokenAccounts.value.length} token accounts`);
    
    if (tokenAccounts.value.length > 0) {
        console.log("Token accounts:");
        for (let i = 0; i < Math.min(3, tokenAccounts.value.length); i++) {
            const account = tokenAccounts.value[i];
            console.log(`  ${i + 1}. ${account.pubkey.toBase58()}`);
        }
    }
    
    console.log("\\n Basic functionality test completed successfully!");
    console.log("\\n 階段一完成標誌：");
    console.log("- 成功連接到 Solana Devnet");
    console.log("- 成功讀取錢包資訊");
    console.log("- 成功獲取代幣賬戶");
    console.log("- 核心邏輯驗證完成");
}

main().catch(err => {
    console.error("Error:", err);
});
