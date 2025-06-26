"use client";
import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import ClientWalletMultiButton from './components/ClientWalletMultiButton';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { useAppStore, TokenInfo, CartItem } from './store';
import toast, { Toaster } from 'react-hot-toast';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import PortfolioTable from './components/PortfolioTable';

const LANGS = {
  en: {
    title: 'REKTIFY',
    slogan: 'Turn your junk tokens into hope!',
    myAssets: 'My Assets',
    balance: 'Balance',
    value: 'Value',
    recycle: 'Recycle All',
    recycling: 'Recycling...',
    connectWallet: 'Please connect your wallet to start',
    txSuccess: 'Recycle Success!',
    viewTx: 'View Transaction',
    txFail: 'Recycle failed, please check console log.',
    fetchFail: 'Failed to fetch assets',
    lang: 'Language',
    en: 'English',
    zh: '简体中文',
  },
  zh: {
    title: 'REKTIFY',
    slogan: '把你的垃圾币变成希望！',
    myAssets: '我的资产',
    balance: '余额',
    value: '价值',
    recycle: '一键回收',
    recycling: '回收中...',
    connectWallet: '请先连接钱包以开始',
    txSuccess: '回收成功！',
    viewTx: '查看交易',
    txFail: '回收失败，请查看控制台日志。',
    fetchFail: '获取资产失败',
    lang: '语言',
    en: '英文',
    zh: '简体中文',
  }
};

const ClientOnlyWalletButton = dynamic(() => import('./components/ClientOnlyWalletButton'), { ssr: false });

const AssetRow: React.FC<{ token: TokenInfo }> = ({ token }) => {
    const { addToCart, cart } = useAppStore();
    const isInCart = cart.some(item => item.mint === token.mint);

    const handleAdd = () => {
        addToCart({ ...token, amountToSell: token.balance, valueToSell: token.value });
    };

    return (
        <li className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center gap-3">
                <Image src={token.logoURI || '/default-logo.svg'} alt={token.name} width={40} height={40} className="rounded-full" />
                <div>
                    <p className="font-bold">{token.symbol}</p>
                    <p className="text-sm text-gray-400">{token.balance.toFixed(4)}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold">${token.value.toFixed(2)}</p>
                <button 
                    onClick={handleAdd} 
                    disabled={isInCart}
                    className="mt-1 px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                >
                    {isInCart ? '已添加' : '添加'}
                </button>
            </div>
        </li>
    );
};

const ShoppingCart: React.FC = () => {
    const { cart, cartTotalValue, updateCartItem, removeFromCart, clearCart } = useAppStore();
    const { publicKey, sendTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();
    const [isRecycling, setIsRecycling] = useState(false);

    const handleCheckout = async () => {
        if (!publicKey || !sendTransaction || !signAllTransactions) return;
        setIsRecycling(true);
        const loadingToast = toast.loading('正在準備交易...');
        try {
            // 1. 調用後端 API 獲取交易數組
            const { data } = await axios.post('/api/recycle', {
                userPublicKey: publicKey.toBase58(),
                cartItems: cart,
            });
            const { swapTransactions } = data; // 這是一個 base64 字符串數組
            toast.dismiss(loadingToast);
            // 2. 反序列化所有交易
            const transactions = swapTransactions.map((txString: string) => {
                const buf = Buffer.from(txString, 'base64');
                return VersionedTransaction.deserialize(buf);
            });
            // **關鍵：讓用戶一次性簽署所有交易**
            const signedTransactions = await signAllTransactions(transactions);
            toast.loading('正在發送交易...請勿關閉頁面');
            // 3. 循環發送已簽名的交易
            const txids = [];
            for (const signedTx of signedTransactions) {
                const rawTx = signedTx.serialize();
                const txid = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
                txids.push(txid);
            }
            toast.dismiss();
            toast.success(`成功發送 ${txids.length} 筆回收交易！`, { duration: 8000 });
            console.log("交易ID:", txids);
            clearCart(); // 清空購物車
            // 可以在這裡延遲幾秒後觸發錢包刷新
        } catch (error) {
            toast.dismiss();
            toast.error('結算失敗，可能是您拒絕了簽名或發生了網絡錯誤。');
            console.error('結算失敗:', error);
        } finally {
            setIsRecycling(false);
        }
    };

    if (cart.length === 0) return null;

    return (
        <div className="w-full max-w-lg p-4 mt-8 bg-green-900/20 rounded-xl border border-green-500/30">
            <h3 className="text-xl font-bold mb-4">回收購物車</h3>
            <ul className="space-y-3 mb-4">
                {cart.map(item => (
                    <li key={item.mint} className="flex items-center justify-between gap-2 p-2 bg-gray-800 rounded">
                        <Image src={item.logoURI || '/default-logo.svg'} alt={item.name} width={32} height={32} className="rounded-full" />
                        <span className="font-bold flex-1">{item.symbol}</span>
                        <input 
                            type="number"
                            max={item.balance}
                            min={0}
                            value={item.amountToSell}
                            onChange={(e) => updateCartItem(item.mint, parseFloat(e.target.value) || 0)}
                            className="w-24 p-1 bg-gray-900 rounded text-right"
                        />
                        <button onClick={() => removeFromCart(item.mint)} className="text-red-500 hover:text-red-400">×</button>
                    </li>
                ))}
            </ul>
            <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
                <div>
                    <p className="text-lg font-bold">總計: ${cartTotalValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">預計手續費: 5%</p>
                </div>
                <button 
                    onClick={handleCheckout} 
                    disabled={isRecycling}
                    className="px-6 py-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
                >
                    {isRecycling ? '结算中...' : '確認回收'}
                </button>
            </div>
        </div>
    );
};

export default function HomePage() {
    const { publicKey } = useWallet();
    const { walletTokens, setWalletTokens, isLoading, setIsLoading } = useAppStore();
    const [lang, setLang] = useState<'en'|'zh'>('en');
    const t = LANGS[lang];

    useEffect(() => {
        const fetchTokens = async () => {
            if (!publicKey) {
                setWalletTokens([]);
                return;
            }
            setIsLoading(true);
            try {
                const { data } = await axios.post('/api/scan', { userPublicKey: publicKey.toBase58() });
                setWalletTokens(data);
            } catch (error) {
                console.error("獲取代幣列表失敗:", error);
                setWalletTokens([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTokens();
        // 設置定時器，每30秒刷新一次
        const interval = setInterval(fetchTokens, 30000);
        return () => clearInterval(interval);
    }, [publicKey, setWalletTokens, setIsLoading]);

    return (
        <main className="flex flex-col items-center justify-start min-h-screen p-8 pt-24 bg-gray-900">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="absolute top-8 right-8">
                <ClientWalletMultiButton />
            </div>
            <div className="text-center w-full">
                <h1 className="text-5xl font-extrabold mb-3">{t.title}</h1>
                <p className="text-lg text-gray-400">{t.slogan}</p>
            </div>
            <div className="mt-10 w-full max-w-lg p-4 bg-gray-800/50 rounded-xl">
                <h3 className="text-center text-2xl font-bold mb-4">社區獎池</h3>
                <div className="flex justify-around">
                    <div className="text-center">
                        <p className="text-sm text-gray-400">每日 SOL 獎池</p>
                        <p className="text-2xl font-bold text-green-400">0.125 SOL</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-400">終極 wBTC 大獎</p>
                        <p className="text-2xl font-bold text-orange-400">0.001 wBTC</p>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-lg mt-8">
                <h2 className="text-2xl font-bold mb-4">我的資產</h2>
                {publicKey ? (
                    isLoading 
                        ? <p className="mt-8 text-xl">正在掃描您的錢包...</p> 
                        : (walletTokens.length > 0 ? (
                            <PortfolioTable />
                          ) : (
                            <p className="mt-8">您的錢包中沒有找到可回收資產。</p>
                          ))
                ) : (
                    <p className="mt-8 text-xl">請先連接錢包以掃描資產。</p>
                )}
            </div>
            <ShoppingCart />
        </main>
    );
}
