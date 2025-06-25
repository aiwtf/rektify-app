import { create } from 'zustand';

export interface TokenInfo {
    mint: string;
    balance: number;
    price: number;
    value: number;
    tokenAccountAddress: string;
    decimals: number;
    name?: string;
    symbol?: string;
    logoURI?: string;
    // 你可以添加 name, symbol, logoURI 等
}

interface AppState {
    tokens: TokenInfo[];
    totalValue: number;
    setTokens: (tokens: TokenInfo[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    tokens: [],
    totalValue: 0,
    isLoading: false,
    setTokens: (tokens) => {
        const totalValue = tokens.reduce((acc, token) => acc + token.value, 0);
        set({ tokens, totalValue });
    },
    setIsLoading: (loading) => set({ isLoading: loading }),
})); 