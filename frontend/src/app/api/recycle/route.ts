import { NextResponse } from 'next/server';
import axios from 'axios';

// 重要的安全提示：在真實產品中，你不應該將服務器的私鑰暴露在這裡。
// 這裡僅為 MVP 演示。真實產品會用更安全的方式管理密鑰。
// 這個 API 的核心目標是：接收用戶的公鑰和要交換的代幣信息，然後返回一個需要用戶簽名的交易。

// **注意：這個 API 現在接收一個購物車數組**
export async function POST(request: Request) {
    try {
        const { userPublicKey, cartItems } = await request.json();

        if (!userPublicKey || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            return NextResponse.json({ error: '請求參數不完整或格式錯誤' }, { status: 400 });
        }
        
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        // **演示用的固定獎池地址，記得換成你自己的**
        const POOL_ADDRESS = "84Yf6W8BbZDBpMrbXM8R9yNJrV1sVf1k8xjsskFMPdVt"; 
        const FEE_BPS = 500; // 5%

        // 1. 並行獲取所有代幣的報價
        const quotePromises = cartItems.map(item => {
            const amountInLamports = Math.floor(item.amountToSell * Math.pow(10, item.decimals));
            return axios.get('https://quote-api.jup.ag/v6/quote', {
                params: {
                    inputMint: item.mint,
                    outputMint: SOL_MINT,
                    amount: amountInLamports.toString(),
                    userPublicKey: userPublicKey,
                    slippageBps: 150,
                }
            }).then(res => res.data);
        });

        const quotes = await Promise.all(quotePromises);

        // 2. 並行獲取所有交換交易
        const swapPromises = quotes.map(quote => {
            const feeAmount = Math.floor(parseInt(quote.outAmount) * FEE_BPS / 10000);
            return axios.post('https://quote-api.jup.ag/v6/swap', {
                quoteResponse: quote,
                userPublicKey: userPublicKey,
                wrapAndUnwrapSol: true,
                feeAccount: POOL_ADDRESS,
                feeAmount: feeAmount.toString(),
            }).then(res => res.data.swapTransaction);
        });

        const swapTransactions = await Promise.all(swapPromises);

        // 3. 將 base64 編碼的交易數組返回給前端
        return NextResponse.json({ swapTransactions });

    } catch (error: any) {
         // ... (詳細的錯誤處理)
         return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
    }
} 