"use client";
import '../globals.css';
import WalletContextProvider from '../components/WalletProvider';
import { I18nProvider } from '../../../i18n';

export default function RootLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>
        <I18nProvider locale={locale}>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </I18nProvider>
      </body>
    </html>
  );
} 