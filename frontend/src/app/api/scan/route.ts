import { NextResponse } from 'next/server';
import axios from 'axios';

// 定義 token 型別，確保有 name, symbol, logoURI
interface TokenInfo {
    mint: string;
    balance: number;
    value: number;
    name: string;
    symbol: string;
    logoURI: string | null;
}

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

    const tokenListResponse = await axios.get('https://token.jup.ag/all');
    const tokenMap = new Map(tokenListResponse.data.map((t: any) => [t.address, t]));

    const updatedTokens: TokenInfo[] = tokens.map((info: any) => {
        const tokenInfo: any = tokenMap.get(info.mint);
        return {
            ...info,
            name: tokenInfo && typeof tokenInfo === 'object' ? tokenInfo.name || 'Unknown Token' : 'Unknown Token',
            symbol: tokenInfo && typeof tokenInfo === 'object' ? tokenInfo.symbol || 'UNKNOWN' : 'UNKNOWN',
            logoURI: tokenInfo && typeof tokenInfo === 'object' ? tokenInfo.logoURI || null : null,
        };
    });

    return NextResponse.json(updatedTokens);
} 