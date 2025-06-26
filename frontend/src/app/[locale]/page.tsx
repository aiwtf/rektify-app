"use client";
import { useI18n } from '../../i18n';
import LocaleSwitcher from '../components/LocaleSwitcher';
import PortfolioTable from '../components/PortfolioTable';
import ShoppingCart from '../components/ShoppingCart';
import ClientWalletMultiButton from '../components/ClientWalletMultiButton';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAppStore } from '../store';
import { Toaster } from 'react-hot-toast';
import React from 'react';

export default function HomePage() {
    const t = useI18n();
    const { publicKey } = useWallet();
    const { walletTokens, isLoading } = useAppStore();

    return (
        <main className="flex flex-col items-center justify-start min-h-screen p-8 pt-24">
            <Toaster position="top-center" reverseOrder={false} />
            <div className="absolute top-8 right-8 flex items-center gap-4">
                <LocaleSwitcher />
                <ClientWalletMultiButton />
            </div>
            <div className="text-center w-full">
                <h1 className="text-5xl font-extrabold mb-3">{t('hero_title')}</h1>
                <p className="text-lg text-gray-400">{t('hero_tagline')}</p>
            </div>
            {publicKey ? (
                isLoading 
                    ? <p className="mt-8 text-xl">{t('portfolio_scanning')}</p> 
                    : (walletTokens.length > 0 ? (
                        <PortfolioTable />
                      ) : (
                        <p className="mt-8">{t('portfolio_no_assets')}</p>
                      ))
            ) : (
                <p className="mt-8 text-xl">{t('wallet_prompt')}</p>
            )}
            <ShoppingCart />
        </main>
    );
} 