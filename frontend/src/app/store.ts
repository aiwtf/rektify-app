import { create } from 'zustand';

export interface TokenInfo {
    mint: string;
    balance: number;
    price: number;
    value: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI: string | null;
}

// 購物車中的物品
export interface CartItem extends TokenInfo {
    amountToSell: number; // 要賣出的數量 (UI amount)
    valueToSell: number;
}

interface AppState {
    // 錢包資產
    walletTokens: TokenInfo[];
    totalValue: number;
    setWalletTokens: (tokens: TokenInfo[]) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // 購物車
    cart: CartItem[];
    cartTotalValue: number;
    addToCart: (item: CartItem) => void;
    updateCartItem: (mint: string, amountToSell: number) => void;
    removeFromCart: (mint: string) => void;
    clearCart: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    // 錢包資產
    walletTokens: [],
    totalValue: 0,
    isLoading: false,
    setWalletTokens: (tokens) => {
        const totalValue = tokens.reduce((acc, token) => acc + token.value, 0);
        set({ walletTokens: tokens, totalValue });
    },
    setIsLoading: (loading) => set({ isLoading: loading }),

    // 購物車
    cart: [],
    cartTotalValue: 0,
    addToCart: (item) => set(state => {
        const newCart = [...state.cart, item];
        const newTotal = newCart.reduce((acc, i) => acc + i.valueToSell, 0);
        return { cart: newCart, cartTotalValue: newTotal };
    }),
    updateCartItem: (mint, amountToSell) => set(state => {
        const newCart = state.cart.map(item => {
            if (item.mint === mint) {
                return { ...item, amountToSell, valueToSell: amountToSell * item.price };
            }
            return item;
        });
        const newTotal = newCart.reduce((acc, i) => acc + i.valueToSell, 0);
        return { cart: newCart, cartTotalValue: newTotal };
    }),
    removeFromCart: (mint) => set(state => {
        const newCart = state.cart.filter(item => item.mint !== mint);
        const newTotal = newCart.reduce((acc, i) => acc + i.valueToSell, 0);
        return { cart: newCart, cartTotalValue: newTotal };
    }),
    clearCart: () => set({ cart: [], cartTotalValue: 0 }),
})); 