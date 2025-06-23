import { ConnectionProvider } from './context/ConnectionContext';
import { TransferProvider } from './context/TransferContext';
import AppHeader from './components/AppHeader';
import ConnectSection from './components/ConnectSection';
import { TransferSection } from './components/TransferSection';
import TransferHistory from './components/TransferHistory';
import Instructions from './components/Instructions';
import { useState, useEffect, useRef } from 'react';
import { useConnection } from './context/ConnectionContext';
import { useShakeBackground } from './hooks/useShakeBackground';

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
      <AppContent />
    </ConnectionProvider>
  );
}

function AppContent() {
  const { connectionState } = useConnection();
  const mobileBg = useShakeBackground();
  const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());

  // Fade transition state for mobile background
  const [prevBg, setPrevBg] = useState(mobileBg);
  const [fade, setFade] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;
    if (mobileBg !== prevBg) {
      setFade(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setPrevBg(mobileBg);
        setFade(false);
      }, 1200); // 1200ms fade duration
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mobileBg, isMobile, prevBg]);

  return (
    <TransferProvider>
      <div className="relative min-h-screen">
        {isMobile ? (
          <div className="absolute inset-0 w-full h-full">
            {/* Previous background (fading out) */}
            <div
              className={`absolute inset-0 bg-cover bg-center blur-sm transition-opacity duration-[1200ms] ease-in-out ${fade ? 'opacity-0' : 'opacity-100'}`}
              style={{ backgroundImage: `url('${prevBg}')`, zIndex: 1 }}
            ></div>
            {/* New background (fading in) */}
            <div
              className={`absolute inset-0 bg-cover bg-center blur-sm transition-opacity duration-[1200ms] ease-in-out ${fade ? 'opacity-100' : 'opacity-0'}`}
              style={{ backgroundImage: `url('${mobileBg}')`, zIndex: 2 }}
            ></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-custom-bg bg-cover bg-center blur-sm"></div>
        )}
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative z-10">
          <AppHeader />
          <main className="container mx-auto px-4 py-8 grid md:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-6">
              <ConnectSection />
              <TransferSection />
            </div>
            <div>
              {!connectionState.connected ? (
                <div className="relative h-full flex items-center">
                  <div className="absolute left-0 h-4/5 w-px bg-gray-300"></div>
                  <div className="pl-8 bg-black bg-opacity-20 backdrop-blur-sm p-6 rounded-lg">
                    <Instructions />
                  </div>
                </div>
              ) : (
                <TransferHistory />
              )}
            </div>
          </main>
        </div>
      </div>
    </TransferProvider>
  );
}

export default App;