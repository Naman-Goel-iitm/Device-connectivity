import { ConnectionProvider } from './context/ConnectionContext';
import { TransferProvider } from './context/TransferContext';
import AppHeader from './components/AppHeader';
import ConnectSection from './components/ConnectSection';
import { TransferSection } from './components/TransferSection';
import TransferHistory from './components/TransferHistory';
import { useState, useEffect } from 'react';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500); // 2.5 seconds
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-6"></div>
        <span className="text-blue-600 text-2xl font-bold tracking-wide">WindDrop</span>
        <span className="text-gray-500 mt-2">Connecting...</span>
      </div>
    );
  }

  return (
    <ConnectionProvider>
      <TransferProvider>
        <div className="min-h-screen bg-gray-50">
          <AppHeader />
          <main className="container mx-auto px-4 py-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div className="flex flex-col gap-6">
                <ConnectSection />
                <TransferSection />
              </div>
              <TransferHistory />
            </div>
          </main>
        </div>
      </TransferProvider>
    </ConnectionProvider>
  );
}

export default App;