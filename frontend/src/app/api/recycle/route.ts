import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterApi = createJupiterApiClient();

// 重要的安全提示：在真實產品中，你不應該將服務器的私鑰暴露在這裡。
// 這裡僅為 MVP 演示。真實產品會用更安全的方式管理密鑰。
// 這個 API 的核心目標是：接收用戶的公鑰和要交換的代幣信息，然後返回一個需要用戶簽名的交易。

export async function POST(request: Request) {
    try {
        const { userPublicKey, tokensToRecycle } = await request.json();
        if (!userPublicKey || !tokensToRecycle || tokensToRecycle.length === 0) {
            return NextResponse.json({ error: '參數不完整' }, { status: 400 });
        }

        const user = new PublicKey(userPublicKey);
        const connection = new Connection(process.env.DEVNET_RPC_URL || 'https://api.devnet.solana.com');
        const SOL_MINT = 'So11111111111111111111111111111111111111112';

        // 1. 為每個代幣獲取 quote
        const quotes = await Promise.all(
            tokensToRecycle.map(token =>
                jupiterApi.quoteGet({
                    inputMint: token.mint,
                    outputMint: SOL_MINT,
                    amount: token.amountInLamports,
                    userPublicKey: user.toBase58(),
                    slippageBps: 100
                })
            )
        );

        // 2. 拿到 swap 交易
        const transactions = await Promise.all(
            quotes.map(quote =>
                jupiterApi.swapPost({
                    swapRequest: {
                        quoteResponse: quote,
                        userPublicKey: user.toBase58(),
                        wrapAndUnwrapSol: true,
                    }
                })
            )
        );

        const swapTransactions = transactions.map(t => t.swapTransaction);

        return NextResponse.json({ swapTransactions });

    } catch (error) {
        console.error('[RECYCLE API ERROR]', error);
        return NextResponse.json({ error: '回收失敗' }, { status: 500 });
    }
} 