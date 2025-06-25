import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 這裡應根據 userPublicKey 查詢鏈上資產，這裡先回傳假資料
    const tokens = [
        {
            mint: 'So11111111111111111111111111111111111111112',
            balance: 0.01,
            price: 150,
            value: 1.5,
            tokenAccountAddress: 'fake1',
            decimals: 9,
            name: 'Wrapped SOL',
            symbol: 'wSOL',
            logoURI: '',
        },
        {
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            balance: 10,
            price: 1,
            value: 10,
            tokenAccountAddress: 'fake2',
            decimals: 6,
            name: 'USD Coin',
            symbol: 'USDC',
            logoURI: '',
        },
    ];
    return NextResponse.json(tokens);
} 