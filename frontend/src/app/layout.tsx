import { Inter } from "next/font/google";
import "./globals.css";
import WalletContextProvider from './components/WalletProvider';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Rektify App",
  description: "Solana Token Recycling App",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <WalletContextProvider>
          {children}
          <Toaster position="top-center" />
        </WalletContextProvider>
      </body>
    </html>
  );
}
