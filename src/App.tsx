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
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import TermsPage from './pages/TermsPage';

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
    <Router>
      <ConnectionProvider>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </ConnectionProvider>
    </Router>
  );
}

function AppContent() {
  const { connectionState } = useConnection();
  const mobileBg = useShakeBackground();
  const isMobile = /iphone|ipad|ipod|android|blackberry|windows phone/i.test(navigator.userAgent.toLowerCase());

  // Two-step fade transition state
  const [currentBg, setCurrentBg] = useState(mobileBg);
  const [fadeOut, setFadeOut] = useState(false);
  const [pendingBg, setPendingBg] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const FADE_DURATION = 600;

  // When mobileBg changes, start fade out
  useEffect(() => {
    if (!isMobile) return;
    if (mobileBg !== currentBg) {
      setFadeOut(true);
      setPendingBg(mobileBg);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        setCurrentBg(mobileBg);
        setFadeOut(false);
        setPendingBg(null);
      }, FADE_DURATION);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [mobileBg, isMobile, currentBg]);

  return (
    <TransferProvider>
      <div className="relative min-h-screen pb-16"> {/* Add padding for footer */}
        {isMobile ? (
          <div className="absolute inset-0 w-full h-full">
            {/* Current background (fading out) */}
            <div
              className={`absolute inset-0 bg-cover bg-center blur-sm transition-opacity duration-[600ms] ease-in-out ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
              style={{ backgroundImage: `url('${currentBg}')`, zIndex: 1 }}
            ></div>
            {/* Pending background (fading in) - only render after fade out */}
            {fadeOut && pendingBg && (
              <div
                className="absolute inset-0 bg-cover bg-center blur-sm transition-opacity duration-[600ms] ease-in-out opacity-100"
                style={{ backgroundImage: `url('${pendingBg}')`, zIndex: 2 }}
              ></div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-custom-bg bg-cover bg-center blur-sm"></div>
        )}
        {/* Mini hovering note for mobile, only visible if isMobile and not connected to a room */}
        {isMobile && !connectionState.connected && (
          <div className="fixed bottom-6 right-6 z-50 flex items-end select-none pointer-events-none animate-bounce-smooth">
            <div className="relative bg-white text-blue-600 font-bold text-base px-4 py-2 rounded-2xl shadow-lg" style={{ maxWidth: '50vw', minWidth: '120px' }}>
              <span className="align-middle">Shake your Phone !😃</span>
              {/* Pointy chat bubble tail */}
              <span className="absolute -bottom-2 right-2 w-3 h-3 bg-white border-b border-r border-gray-200 shadow-lg" style={{ borderBottomRightRadius: '0.75rem', transform: 'rotate(45deg)' }}></span>
            </div>
          </div>
        )}
        {/* Add custom bounce animation to tailwind if not present */}
        <style>{`
          @keyframes bounce-smooth {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          .animate-bounce-smooth {
            animation: bounce-smooth 2s infinite;
          }
        `}</style>
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
        {/* T&C link: fixed and centered on desktop, left and at the bottom on mobile */}
        {/* Desktop: fixed, centered */}
        <div className="hidden md:block fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
          <Link to="/terms" className="text-sm font-semibold text-white hover:text-blue-300 underline transition-colors">T&amp;C</Link>
        </div>
        {/* Mobile: absolute, bottom left */}
        <div className="absolute bottom-4 left-4 z-20 md:hidden">
          <Link to="/terms" className="text-base font-semibold text-white underline">T&amp;C</Link>
        </div>
      </div>
    </TransferProvider>
  );
}

export default App;