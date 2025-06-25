"use client";
import React, { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import ClientWalletMultiButton from './components/ClientWalletMultiButton';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import { useAppStore } from './store';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

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

const TokenRow: React.FC<{ token: any; lang: 'en' | 'zh'; t: any }> = ({ token, lang, t }) => {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [isRecycling, setIsRecycling] = useState(false);

    const handleRecycleOne = async () => {
        if (!publicKey || !sendTransaction) {
            toast.error(t.connectWallet);
            return;
        }
        setIsRecycling(true);

        try {
            const amountInLamports = Math.floor(token.balance * Math.pow(10, token.decimals));

            const { data } = await axios.post('/api/recycle', {
                userPublicKey: publicKey.toBase58(),
                tokenToRecycle: {
                    mint: token.mint,
                    amountInLamports: amountInLamports.toString(), // 確保是大數安全字符串
                },
            });

            const { swapTransaction } = data;
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            const txid = await sendTransaction(transaction, connection);
            
            console.log(`交易發送中... ${txid}`);
            await connection.confirmTransaction(txid, 'confirmed');
            
            toast.success(<span>{t.txSuccess}<a href={`https://explorer.solana.com/tx/${txid}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline ml-2">{t.viewTx}</a></span>);
            // 你可以在這裡觸發重新掃描錢包的函數
        } catch (error) {
            console.error(`回收 ${token.mint} 失敗:`, error);
            toast.error(t.txFail);
        } finally {
            setIsRecycling(false);
        }
    };

    return (
        <li className="flex flex-col items-center p-3 bg-gray-800 rounded-lg">
            <div className="w-full flex flex-col items-center">
                <p className="font-bold">{token.mint.slice(0, 4)}...{token.mint.slice(-4)}</p>
                <p className="text-sm text-gray-400">{token.balance.toFixed(4)}</p>
                <p className="font-semibold mt-1">${token.value.toFixed(2)}</p>
                <button
                    onClick={handleRecycleOne}
                    disabled={isRecycling}
                    className="mt-2 px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500 transition-colors w-32 text-center"
                >
                    {isRecycling ? t.recycling : t.recycle}
                </button>
            </div>
        </li>
    );
};

const TokenList: React.FC<{ lang: 'en' | 'zh'; t: any }> = ({ lang, t }) => {
    const { tokens, totalValue } = useAppStore();
    if (tokens.length === 0) return <p className="mt-8 text-center">{t.fetchFail}</p>;
    return (
        <div className="w-full max-w-lg mt-8 mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-center">
                {t.myAssets} ({t.value}: ${totalValue.toFixed(2)})
            </h2>
            <ul className="space-y-3">
                {tokens.map(token => <TokenRow key={token.mint} token={token} lang={lang} t={t} />)}
            </ul>
        </div>
    );
};

export default function HomePage() {
    const { publicKey } = useWallet();
    const { setTokens, isLoading, setIsLoading } = useAppStore();
    const [lang, setLang] = useState<'en'|'zh'>('en');
    const t = LANGS[lang];

    useEffect(() => {
        const fetchTokens = async () => {
            if (!publicKey) {
                setTokens([]);
                return;
            }
            setIsLoading(true);
            try {
                const { data } = await axios.post('/api/scan', { userPublicKey: publicKey.toBase58() });
                setTokens(data);
            } catch (error) {
                console.error("獲取代幣列表失敗:", error);
                setTokens([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTokens();
        // 設置定時器，每30秒刷新一次
        const interval = setInterval(fetchTokens, 30000);
        return () => clearInterval(interval);
    }, [publicKey, setTokens, setIsLoading]);

    return (
        <main className="flex flex-col items-center justify-start min-h-screen p-8 pt-24 bg-gray-900">
            <div className="absolute top-8 right-8">
                <ClientWalletMultiButton />
            </div>
            <div className="text-center w-full">
                <h1 className="text-5xl font-extrabold mb-3">{t.title}</h1>
                <p className="text-lg text-gray-400">{t.slogan}</p>
            </div>
            {publicKey ? (
                isLoading ? <p className="mt-8 text-xl text-center">{t.recycling}</p> : <TokenList lang={lang} t={t} />
            ) : (
                <p className="mt-8 text-xl text-center">{t.connectWallet}</p>
            )}
        </main>
    );
}
