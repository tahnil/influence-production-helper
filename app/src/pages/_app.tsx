// pages/_app.tsx
import { AppProps } from 'next/app';
import Link from 'next/link';
import './globals.css';

function InfluenceProductionHelper({ Component, pageProps }: AppProps) {
  return (
    <div className="flex flex-col h-screen">
      <nav className="p-7 h-7 bg-lunarBlack text-white flex items-center space-x-4">
        <Link href="/" className="hover:underline">Home</Link>
      </nav>
      <div className="flex-1">
        <Component {...pageProps} />
      </div>
    </div>
  );
}

export default InfluenceProductionHelper;
