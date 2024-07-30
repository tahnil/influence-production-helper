// pages/_app.tsx
import './globals.css';
import { AppProps } from 'next/app';
import Link from 'next/link';

function InfluenceProductionHelper({ Component, pageProps }: AppProps) {
  return (
    <div>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/treeView">Tree View</Link>
      </nav>
      <Component {...pageProps} />
    </div>
  );
}

export default InfluenceProductionHelper;
