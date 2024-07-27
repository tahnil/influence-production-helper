// pages/_app.tsx
import './globals.css';
import { AppProps } from 'next/app';
import { NodeContextProvider } from '@/contexts/NodeContext';
import Link from 'next/link';

function InfluenceProductionHelper({ Component, pageProps }: AppProps) {
  return (
    <NodeContextProvider>
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/tree-view">Tree View</Link>
        <Link href="/tree-view-v2">Tree View V2</Link>
      </nav>
      <Component {...pageProps} />
    </>
    </NodeContextProvider>
  );
}

export default InfluenceProductionHelper;
