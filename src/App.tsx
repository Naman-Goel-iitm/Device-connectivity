import { ConnectionProvider } from './context/ConnectionContext';
import { TransferProvider } from './context/TransferContext';
import AppHeader from './components/AppHeader';
import ConnectSection from './components/ConnectSection';
import { TransferSection } from './components/TransferSection';
import TransferHistory from './components/TransferHistory';

function App() {
  return (
    <ConnectionProvider>
      <TransferProvider>
        <div className="min-h-screen bg-gray-50">
          <AppHeader />
          <main className="container mx-auto px-4 py-8">
            <div className="grid gap-8 md:grid-cols-2">
              <div>
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