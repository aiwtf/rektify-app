"use client";
import { useAppStore } from '../store';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useState } from 'react';
import { useI18n } from '../../i18n';
import Image from 'next/image';
import toast from 'react-hot-toast';
import axios from 'axios';
import { VersionedTransaction } from '@solana/web3.js';

const ShoppingCart: React.FC = () => {
    const t = useI18n();
    const { cart, cartTotalValue, updateCartItem, removeFromCart, clearCart } = useAppStore();
    const { publicKey, sendTransaction, signAllTransactions } = useWallet();
    const { connection } = useConnection();
    const [isRecycling, setIsRecycling] = useState(false);

    const handleCheckout = async () => {
        if (!publicKey || !sendTransaction || !signAllTransactions) return;
        setIsRecycling(true);
        const loadingToast = toast.loading(t('toast_recycling'));
        try {
            const { data } = await axios.post('/api/recycle', {
                userPublicKey: publicKey.toBase58(),
                cartItems: cart,
            });
            const { swapTransactions } = data;
            toast.dismiss(loadingToast);
            const transactions = swapTransactions.map((txString: string) => {
                const buf = Buffer.from(txString, 'base64');
                return VersionedTransaction.deserialize(buf);
            });
            const signedTransactions = await signAllTransactions(transactions);
            toast.loading(t('cart_recycling'));
            const txids = [];
            for (const signedTx of signedTransactions) {
                const rawTx = signedTx.serialize();
                const txid = await connection.sendRawTransaction(rawTx, { skipPreflight: true });
                txids.push(txid);
            }
            toast.dismiss();
            toast.success(t('toast_success'), { duration: 8000 });
            clearCart();
        } catch (error) {
            toast.dismiss();
            toast.error(t('toast_error'));
            console.error('結算失敗:', error);
        } finally {
            setIsRecycling(false);
        }
    };

    if (cart.length === 0) return null;

    return (
        <div className="w-full max-w-lg p-4 mt-8 bg-green-900/20 rounded-xl border border-green-500/30">
            <h3 className="text-xl font-bold mb-4">{t('cart_title')}</h3>
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
                    <p className="text-lg font-bold">{t('cart_total')}: ${cartTotalValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">{t('cart_fee_note')}</p>
                </div>
                <button 
                    onClick={handleCheckout} 
                    disabled={isRecycling}
                    className="px-6 py-2 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-500 transition-colors"
                >
                    {isRecycling ? t('cart_recycling') : t('cart_checkout')}
                </button>
            </div>
        </div>
    );
};

export default ShoppingCart; 