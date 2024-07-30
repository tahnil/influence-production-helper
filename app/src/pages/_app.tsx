// pages/_app.tsx
import './globals.css';
import { AppProps } from 'next/app';
import { DataStoreProvider } from '@/contexts/DataStore';
import Link from 'next/link';

function InfluenceProductionHelper({ Component, pageProps }: AppProps) {
  return (
    <DataStoreProvider>
      <div>
        <nav>
          <Link href="/">Home</Link>
          <Link href="/treeView">Tree View</Link>
        </nav>
        <Component {...pageProps} />
      </div>
    </DataStoreProvider>
  );
}

export default InfluenceProductionHelper;
