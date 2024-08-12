// pages/_app.tsx
import './globals.css';
import { AppProps } from 'next/app';
import Link from 'next/link';

function InfluenceProductionHelper({ Component, pageProps }: AppProps) {
  return (
    <div className="h-screen w-screen flex flex-col">
      <nav className="bg-gray-800 text-white p-4 fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-around">
          <Link href="/" className="text-lg font-semibold hover:text-gray-400">Home</Link>
          <Link href="/treeView" className="text-lg font-semibold hover:text-gray-400">Tree View</Link>
        </div>
      </nav>
      <div className="flex-grow pt-16"> {/* Add padding to account for the fixed nav */}
      <Component {...pageProps} />
    </div>
    </div>
  );
}

export default InfluenceProductionHelper;
