import { NextResponse } from 'next/server';
import axios from 'axios';

// 重要的安全提示：在真實產品中，你不應該將服務器的私鑰暴露在這裡。
// 這裡僅為 MVP 演示。真實產品會用更安全的方式管理密鑰。
// 這個 API 的核心目標是：接收用戶的公鑰和要交換的代幣信息，然後返回一個需要用戶簽名的交易。

export async function POST(request: Request) {
    try {
        const { userPublicKey, tokenToRecycle } = await request.json();

        if (!userPublicKey || !tokenToRecycle || !tokenToRecycle.mint || !tokenToRecycle.amountInLamports) {
            return NextResponse.json({ error: '請求參數不完整或格式錯誤' }, { status: 400 });
        }

        console.log(`[RECYCLE API] 收到回收請求: ${tokenToRecycle.amountInLamports} of ${tokenToRecycle.mint} for ${userPublicKey}`);

        const SOL_MINT = 'So11111111111111111111111111111111111111112';

        // 1. 從 Jupiter API 獲取報價
        const quoteResponse = await axios.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint: tokenToRecycle.mint,
                outputMint: SOL_MINT,
                amount: tokenToRecycle.amountInLamports,
                userPublicKey: userPublicKey,
                slippageBps: 150 // 滑點增加到 1.5%，提高 Devnet 成功率
            }
        }).then(res => res.data);

        // 2. 從 Jupiter API 獲取交換交易數據
        const { swapTransaction } = await axios.post('https://quote-api.jup.ag/v6/swap', {
            quoteResponse,
            userPublicKey: userPublicKey,
            wrapAndUnwrapSol: true,
        }).then(res => res.data);

        // 3. 將 base64 編碼的交易返回給前端
        return NextResponse.json({ swapTransaction });

    } catch (error: any) {
        // 提供更詳細的錯誤日誌
        console.error('[RECYCLE API ERROR]', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: '獲取交換數據失敗', details: error.response ? error.response.data : error.message }, { status: 500 });
    }
} 