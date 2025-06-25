"use client";
import React from "react";

const WalletConnect: React.FC = () => {
    return (
        <div className="flex flex-col items-center space-y-4 p-4">
            <h2 className="text-2xl font-bold">Rektify App</h2>
            <p className="text-gray-600">Connect your wallet to start recycling tokens</p>

            <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Connect Wallet
            </button>

            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <p className="text-gray-800">
                    Wallet connection coming soon...
                </p>
            </div>
        </div>
    );
};

export default WalletConnect;