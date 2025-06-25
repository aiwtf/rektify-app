"use client";
import React, { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const ClientWalletMultiButton = () => {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);
  return isClient ? <WalletMultiButton /> : null;
};

export default ClientWalletMultiButton; 