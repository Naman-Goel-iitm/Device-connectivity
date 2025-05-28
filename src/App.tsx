import React from 'react';
import AppHeader from './components/AppHeader';
import ConnectSection from './components/ConnectSection';
import TransferSection from './components/TransferSection';
import TransferHistory from './components/TransferHistory';
import { ConnectionProvider } from './context/ConnectionContext';
import { TransferProvider } from './context/TransferContext';

function App() {
  return (
    <ConnectionProvider>
      <TransferProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <AppHeader />
          
          <main className="flex-1 py-8 px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Quick Device Connectivity
                </h2>
                <p className="text-gray-600 max-w-md mx-auto">
                  Connect your devices and share files, text, and links instantly with a simple room code.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <ConnectSection />
                </div>
                
                <div className="space-y-6">
                  <TransferSection />
                  <TransferHistory />
                </div>
              </div>
            </div>
          </main>
          
          <footer className="py-4 text-center text-sm text-gray-500 border-t border-gray-200 bg-white">
            <p>ConnectSwift &copy; {new Date().getFullYear()} - Securely connect your devices</p>
          </footer>
        </div>
      </TransferProvider>
    </ConnectionProvider>
  );
}

export default App;