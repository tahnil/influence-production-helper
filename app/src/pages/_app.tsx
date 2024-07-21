// pages/_app.tsx
import './globals.css';
import './../components/TreeVisualizer.module.css';
import { AppProps } from 'next/app';
import Link from 'next/link';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/tree-view">Tree View</Link>
        <Link href="/tree-view-v2">Tree View V2</Link>
      </nav>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
