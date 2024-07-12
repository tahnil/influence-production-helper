// pages/_app.tsx
import './globals.css';
import { AppProps } from 'next/app';
import Link from 'next/link';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/tree-view">Tree View</Link>
      </nav>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
