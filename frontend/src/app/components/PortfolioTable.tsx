"use client";
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import Image from 'next/image';
import { useI18n } from '../../../i18n';

type SortKey = 'value' | 'balance' | 'price';

const PortfolioTable: React.FC = () => {
    const t = useI18n();
    const { walletTokens, addToCart, cart } = useAppStore();
    const [sortKey, setSortKey] = useState<SortKey>('value');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const sortedTokens = useMemo(() => {
        return [...walletTokens].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a[sortKey] - b[sortKey];
            }
            return b[sortKey] - a[sortKey];
        });
    }, [walletTokens, sortKey, sortOrder]);

    const handleSort = (key: SortKey) => {
        if (key === sortKey) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortOrder('desc');
        }
    };
    
    const getSortIndicator = (key: SortKey) => {
        if (key !== sortKey) return null;
        return sortOrder === 'desc' ? ' ▼' : ' ▲';
    };

    return (
        <div className="w-full max-w-4xl mt-8 overflow-x-auto">
            <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase bg-gray-800/50">
                    <tr>
                        <th className="p-3">{t('header_asset')}</th>
                        <th className="p-3 cursor-pointer" onClick={() => handleSort('balance')}>
                            {t('header_balance')}{getSortIndicator('balance')}
                        </th>
                        <th className="p-3 cursor-pointer" onClick={() => handleSort('price')}>
                            {t('header_price')}{getSortIndicator('price')}
                        </th>
                        <th className="p-3 cursor-pointer" onClick={() => handleSort('value')}>
                            {t('header_value_usd')}{getSortIndicator('value')}
                        </th>
                        <th className="p-3 text-center">{t('header_action')}</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedTokens.map(token => {
                        const isInCart = cart.some(item => item.mint === token.mint);
                        return (
                            <tr key={token.mint} className="border-b border-gray-800 hover:bg-gray-800/30">
                                <td className="p-3 flex items-center gap-3">
                                    <Image src={token.logoURI || '/default-logo.svg'} alt={token.name} width={32} height={32} className="rounded-full" />
                                    <div>
                                        <p className="font-bold">{token.symbol}</p>
                                        <p className="text-xs text-gray-500">{token.name}</p>
                                    </div>
                                </td>
                                <td className="p-3">{token.balance.toFixed(4)}</td>
                                <td className="p-3">${token.price.toPrecision(4)}</td>
                                <td className="p-3 font-bold">${token.value.toFixed(2)}</td>
                                <td className="p-3 text-center">
                                    <button 
                                        onClick={() => addToCart({ ...token, amountToSell: token.balance, valueToSell: token.value })}
                                        disabled={isInCart}
                                        className="px-3 py-1 text-sm bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
                                    >
                                        {isInCart ? t('action_added') : t('action_recycle')}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default PortfolioTable; 