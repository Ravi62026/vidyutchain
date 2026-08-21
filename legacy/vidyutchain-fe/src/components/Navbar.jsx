import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const Navbar = () => {
  const [activeTab, setActiveTab] = useState('/');
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { connected } = useWallet();

  useEffect(() => {
    setActiveTab(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    document.addEventListener('scroll', handleScroll);
    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <nav 
      className={`px-4 sm:px-6 py-3 transition-all duration-300 ${
        scrolled 
          ? 'bg-gray-900/95 backdrop-blur-sm shadow-md' 
          : 'bg-transparent'
      } sticky top-0 z-50`}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          {/* Logo */}
          <div className="flex items-center">
            <svg
              className="w-10 h-10 md:w-12 md:h-12 text-purple-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <div className="ml-2">
              <div className="text-xl md:text-2xl font-bold text-white">VidyutChain</div>
              <div className="text-xs md:text-sm text-purple-300">Renewable Energy Platform</div>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <NavButton 
            label="Home" 
            path="/home" 
            active={activeTab === '/home'} 
            onClick={() => navigate('/home')} 
          />
          <NavButton 
            label="Energy Trading" 
            path="/energy-trading" 
            active={activeTab === '/energy-trading'} 
            onClick={() => navigate('/energy-trading')} 
          />
          <NavButton 
            label="Solar Plants" 
            path="/solar-installation" 
            active={activeTab === '/solar-installation'} 
            onClick={() => navigate('/solar-installation')} 
          />
          <NavButton 
            label="Theft Detection" 
            path="/theft-detection" 
            active={activeTab === '/theft-detection'} 
            onClick={() => navigate('/theft-detection')} 
          />
          <NavButton 
            label="Team" 
            path="/team" 
            active={activeTab === '/team'} 
            onClick={() => navigate('/team')} 
          />
          
          {/* Connect Button - Modified to not show wallet address */}
          <div className="ml-4">
            <WalletMultiButton />
          </div>
        </div>

        {/* Mobile Navigation Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-gray-300 hover:text-white focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDropdownOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isDropdownOpen && (
        <div className="md:hidden mt-3 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <MobileNavButton 
              label="Home" 
              active={activeTab === '/home'} 
              onClick={() => {
                navigate('/home');
                setIsDropdownOpen(false);
              }} 
            />
            <MobileNavButton 
              label="Energy Trading" 
              active={activeTab === '/energy-trading'} 
              onClick={() => {
                navigate('/energy-trading');
                setIsDropdownOpen(false);
              }} 
            />
            <MobileNavButton 
              label="Solar Plants" 
              active={activeTab === '/solar-installation'} 
              onClick={() => {
                navigate('/solar-installation');
                setIsDropdownOpen(false);
              }} 
            />
            <MobileNavButton 
              label="Theft Detection" 
              active={activeTab === '/theft-detection'} 
              onClick={() => {
                navigate('/theft-detection');
                setIsDropdownOpen(false);
              }} 
            />
            <MobileNavButton 
              label="Team" 
              active={activeTab === '/team'} 
              onClick={() => {
                navigate('/team');
                setIsDropdownOpen(false);
              }} 
            />
            <div className="py-2">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
      } transition-all duration-200`}
    >
      {label}
    </button>
  );
};

const MobileNavButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`block px-3 py-2 rounded-md text-base font-medium w-full text-left ${
        active
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      } transition-all duration-200`}
    >
      {label}
    </button>
  );
};

export default Navbar;