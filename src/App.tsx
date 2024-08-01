import { useEffect, useState, FC } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import WebAppSDK from '@twa-dev/sdk';
import { THEME, TonConnectUIProvider, useTonConnectModal } from "@tonconnect/ui-react";
import { Header } from "./Header.tsx";
import './App.css';
import MintInftPage from "./MintInftPage.tsx";
import MintTonPage from "./MintTonPage.tsx";
import exampleImage from './assets/sbt-moment.jpg'; 

declare global {
  interface Window {
    Telegram?: any;
  }
}

const Home: FC<{ setWalletAddress: (address: string | null) => void }> = ({ setWalletAddress }) => {
  const [walletAddress, setWalletAddressLocal] = useState<string | null>(null);
  const [friendlyAddress, setFriendlyAddress] = useState<string | null>(null);
  const { open } = useTonConnectModal();
  const navigate = useNavigate();

  useEffect(() => {
    if (walletAddress) {
      const friendly = walletAddress;
      setFriendlyAddress(friendly);
    } else {
      setFriendlyAddress(null);
    }
  }, [walletAddress]);

  useEffect(() => {
    setWalletAddress(walletAddress);
  }, [walletAddress, setWalletAddress]);

  const handleMintTonClick = () => {
    if (friendlyAddress) {
      navigate(`/mint-ton/${encodeURIComponent(friendlyAddress)}`);
    } else {
      open();
    }
  };

  const handleMintInftClick = () => {
    if (friendlyAddress) {
      navigate(`/mint-inft/${encodeURIComponent(friendlyAddress)}`);
    } else {
      open();
    }
  };

  return (
    <>
      <Header setWalletAddress={setWalletAddressLocal} />
      <div className="main-container">
        <h1 className='main-hh1'>SBT Moments</h1>
        <h2 className='main-h2'>Mint SBT for Every Taste</h2>
        <img src={exampleImage} alt="SBT Moments" className="example-image" />
      </div>
      <div className="button-container">
        <button className="button-1" onClick={handleMintTonClick}>Mint SBT via TON</button>
        <button className="button-2" onClick={handleMintInftClick}>Mint SBT via $INFT</button>
      </div>
    </>
  );
};

function App() {
  const [isTg, setIsTg] = useState<boolean>(false);

  useEffect(() => {
    const isTgCheck = window.Telegram?.WebApp?.initData !== '';

    if (isTgCheck) {
      WebAppSDK.ready();
      WebAppSDK.enableClosingConfirmation();
      WebAppSDK.expand();
      WebAppSDK.headerColor = "#000000";
      setIsTg(true);

      document.body.style.backgroundColor = 'var(--tg-theme-bg-color)';
      document.body.style.setProperty('background-color', 'var(--tg-theme-bg-color)', 'important');
    }
  }, []);

  return (
    <>
      {!isTg ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'black',
          color: 'white',
          textAlign: 'center',
          fontSize: '24px',
        }}>
          Access denied. Please open in Telegram.
        </div>
      ) : (
        <TonConnectUIProvider
          manifestUrl="https://burnlab.vercel.app/tonconnect-manifest.json"
          uiPreferences={{
            borderRadius: 'm',
            colorsSet: {
              [THEME.LIGHT]: {
                connectButton: {
                  background: '#e88335'
                },
                accent: '#e88335',
                telegramButton: '#2d2e2e',
                background: {
                  qr: '#fabf73',
                  tint: '#e88335',
                  primary: '#f2b15c',
                  secondary: '#e16ae6',
                  segment: '#e88335'
                },
                text: {
                  primary: '#000000',
                  secondary: '#000000'
                },
              }
            }
          }}
          actionsConfiguration={{
            modals: 'all',
            notifications: ['error'],
            twaReturnUrl: 'https://t.me/SbtMomentsBot/Mint'
          }}
        >
          <Router>
            <Routes>
              <Route path="/" element={<Home setWalletAddress={() => { }} />} />
              <Route path="/mint-ton/:friendlyAddress" element={<MintTonPage />} />
              <Route path="/mint-inft/:friendlyAddress" element={<MintInftPage />} />
              {/* Add other routes here */}
            </Routes>
          </Router>
        </TonConnectUIProvider>
      )}
    </>
  );
}

export default App;
