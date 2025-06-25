"use client";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { VersionedTransaction } from '@solana/web3.js';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
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

export default function HomePage() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const { tokens, setTokens, totalValue, isLoading, setIsLoading } = useAppStore();
    const [tokenMap, setTokenMap] = useState<Record<string, any>>({});
    const [lang, setLang] = useState<'en'|'zh'>('en');
    const t = LANGS[lang];

    // 拉取 Jupiter Token List
    useEffect(() => {
        const fetchTokenList = async () => {
            const res = await fetch('https://token.jup.ag/all');
            const list: any[] = await res.json();
            const map: Record<string, any> = {};
            list.forEach((token: any) => { map[token.address] = token; });
            setTokenMap(map);
        };
        fetchTokenList();
    }, []);

    // 假設這裡有一個獲取用戶資產的函數（你可根據實際情況替換）
    const fetchUserTokens = async () => {
        if (!publicKey) return;
        setIsLoading(true);
        try {
            // 這裡用假數據，實際應該從鏈上獲取
            const userTokens = [
                { mint: 'So11111111111111111111111111111111111111112', balance: 0.01, price: 150, value: 1.5, tokenAccountAddress: '', decimals: 9 },
                { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', balance: 10, price: 1, value: 10, tokenAccountAddress: '', decimals: 6 },
            ];
            // 補全 name, symbol, logoURI
            const tokensWithMeta = userTokens.map(t => ({
                ...t,
                name: tokenMap[t.mint]?.name || t.mint,
                symbol: tokenMap[t.mint]?.symbol || '',
                logoURI: tokenMap[t.mint]?.logoURI || '',
            }));
            setTokens(tokensWithMeta);
        } catch (e) {
            toast.error(t.fetchFail);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (publicKey && Object.keys(tokenMap).length > 0) {
            fetchUserTokens();
        }
        // eslint-disable-next-line
    }, [publicKey, tokenMap]);

    const handleRecycle = async () => {
        if (!publicKey || !sendTransaction) {
            toast.error(t.connectWallet);
            return;
        }
        setIsLoading(true);
        try {
            // 這裡只演示回收第一個 token
            const inputMint = tokens[0]?.mint;
            const outputMint = 'So11111111111111111111111111111111111111112'; // wSOL
            const amount = Math.floor(tokens[0]?.balance * Math.pow(10, tokens[0]?.decimals));
            const { data } = await axios.post('/api/recycle', {
                userPublicKey: publicKey.toBase58(),
                inputMint,
                outputMint,
                amount,
            });
            const { swapTransaction } = data;
            const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
            const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
            const txid = await sendTransaction(transaction, connection);
            const latestBlockHash = await connection.getLatestBlockhash();
            await connection.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txid,
            });
            toast.success(<span>{t.txSuccess}<a href={`https://explorer.solana.com/tx/${txid}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="underline ml-2">{t.viewTx}</a></span>);
        } catch (error) {
            console.error('回收失敗:', error);
            toast.error(t.txFail);
        }
        setIsLoading(false);
    };

    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-24 bg-gray-50">
            <div className="absolute top-8 right-8 flex items-center space-x-4">
                <ClientOnlyWalletButton />
                <div className="relative">
                  <button className="px-3 py-1 bg-white border rounded shadow hover:bg-gray-100" onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>
                    {t.lang}: {lang === 'en' ? t.en : t.zh}
                  </button>
                </div>
            </div>
            <div className="text-center w-full">
                <h1 className="text-4xl font-bold mb-4">{t.title}</h1>
                <p className="mb-8">{t.slogan}</p>
                {publicKey ? (
                    <>
                        <div className="mb-8 w-full max-w-2xl mx-auto">
                            <h2 className="text-2xl font-semibold mb-4">{t.myAssets}</h2>
                            {isLoading ? (
                                <div className="flex justify-center items-center h-32"><div className="loader"></div></div>
                            ) : (
                                <ul className="space-y-3">
                                    {tokens.map(token => (
                                        <li key={token.mint} className="flex items-center bg-white rounded-lg shadow p-3 w-full">
                                            {token.logoURI ? (
                                                <img src={token.logoURI} alt={token.symbol} className="w-12 h-12 mr-4 rounded-full border object-cover" />
                                            ) : (
                                                <div className="w-12 h-12 mr-4 rounded-full bg-gray-200" />
                                            )}
                                            <div className="flex-1 text-left">
                                                <div className="font-bold text-lg">{token.name} <span className="text-xs text-gray-500">{token.symbol}</span></div>
                                                <div className="text-sm text-gray-600">{t.balance}: {token.balance}，{t.value}: ${token.value.toFixed(2)}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button
                            onClick={handleRecycle}
                            className="px-6 py-3 font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            disabled={isLoading || tokens.length === 0}
                        >
                            {isLoading ? t.recycling : t.recycle}
                        </button>
                    </>
                ) : (
                    <p>{t.connectWallet}</p>
                )}
            </div>
            <style jsx>{`
                .loader {
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #3498db;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
