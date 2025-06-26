import { NextResponse } from 'next/server';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';

// 建立一個全局的、帶時間戳的緩存
const tokenListCache = {
    data: new Map(),
    timestamp: 0,
};

const CACHE_TTL = 15 * 60 * 1000; // 15分鐘

async function getJupiterTokenMap() {
    const now = Date.now();
    if (now - tokenListCache.timestamp < CACHE_TTL && tokenListCache.data.size > 0) {
        return tokenListCache.data;
    }
    try {
        const response = await axios.get('https://token.jup.ag/all');
        const tokenMap = new Map(response.data.map((token: any) => [token.address, token]));
        tokenListCache.data = tokenMap;
        tokenListCache.timestamp = now;
        return tokenMap;
    } catch (error) {
        console.error("獲取 Jupiter 代幣列表失敗:", error);
        return tokenListCache.data; // 返回舊的緩存數據（如果有的話）
    }
}

export async function POST(request: Request) {
    try {
        const { userPublicKey } = await request.json();
        if (!userPublicKey) {
            return NextResponse.json({ error: '缺少用戶公鑰' }, { status: 400 });
        }

        const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!, 'confirmed');
        const owner = new PublicKey(userPublicKey);
        const tokenMap = await getJupiterTokenMap();

        // 1. 獲取用戶的代幣賬戶
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { 
            programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') 
        });
        
        const userMints = tokenAccounts.value
            .map(acc => acc.account.data.parsed.info)
            .filter(info => info.tokenAmount.uiAmount > 0)
            .map(info => ({
                mint: info.mint,
                balance: info.tokenAmount.uiAmount,
                decimals: info.tokenAmount.decimals,
            }));

        if (userMints.length === 0) {
            return NextResponse.json([]);
        }

        // 2. 批量獲取價格
        const pricesResponse = await axios.get(`https://price.jup.ag/v4/price?ids=${userMints.map(t => t.mint).join(',')}`);
        const prices = pricesResponse.data.data;

        // 3. 組合所有信息
        const portfolio = userMints.map(token => {
            const price = prices[token.mint]?.price || 0;
            const value = token.balance * price;
            const tokenMeta = tokenMap.get(token.mint) || {};

            return {
                mint: token.mint,
                name: tokenMeta.name || 'Unknown Token',
                symbol: tokenMeta.symbol || token.mint.slice(0, 6),
                logoURI: tokenMeta.logoURI || null,
                balance: token.balance,
                decimals: token.decimals,
                price: price,
                value: value,
                // **為未來功能預留的字段，現在用默認值**
                unrealizedPnl: 0, 
                realizedPnl: 0,
                totalPnl: 0,
                costBasis: 0,
                holdDuration: 'N/A',
                tradeCount30d: 0,
            };
        });
        
        // 4. 按價值排序
        const sortedPortfolio = portfolio.sort((a, b) => b.value - a.value);

        return NextResponse.json(sortedPortfolio);

    } catch (error: any) {
        console.error('[SCAN API ERROR]', error.response ? error.response.data : error.message);
        return NextResponse.json({ error: '掃描錢包資產失敗', details: error.response?.data?.error || error.message }, { status: 500 });
    }
} 