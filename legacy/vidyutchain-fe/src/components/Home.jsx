import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import StatCard from './StatCard';
import Testimonial from './Testimonial';
import 'animate.css/animate.min.css';

const Home = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('trading');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/profile`, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          if (response.status === 401) {
            navigate('/');
            return;
          }
          throw new Error('Failed to load user data');
        }

        const data = await response.json();
        if (data.success) {
          setUserData(data.user);
        } else {
          throw new Error(data.error || 'Failed to load user data');
        }
      } catch (error) {
        console.error('Home error:', error);
        setError(error.message || 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    if (connected) {
      fetchUserData();
    } else {
      navigate('/');
    }
  }, [connected, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-72px)]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-purple-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div className="text-white text-lg">Loading your dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch(activeSection) {
      case 'trading':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Peer-to-Peer Energy Trading</h2>
              <p className="text-gray-300 mb-6">
                Our decentralized marketplace allows consumers and producers to trade renewable energy directly,
                eliminating intermediaries and reducing costs. With blockchain-verified transactions,
                you can trust every kilowatt-hour traded on our platform.
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Transparent pricing and real-time settlements
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Smart contracts ensure fair and secure transactions
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Reduce your carbon footprint by choosing renewable sources
                </li>
              </ul>
              <button
                onClick={() => navigate('/energy-trading')}
                className="bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg text-lg font-medium transform transition duration-200 hover:scale-105"
              >
                Start Trading Energy
              </button>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl transform transition duration-500 hover:scale-[1.02]">
              <img
                src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                alt="Energy Trading Platform"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        );
      case 'solar':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1 rounded-lg overflow-hidden shadow-xl transform transition duration-500 hover:scale-[1.02]">
              <img
                src="https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1744&q=80"
                alt="Solar Panel Installation"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-bold text-white mb-4">Solar Plant Management</h2>
              <p className="text-gray-300 mb-6">
                Manage your solar installations efficiently with our comprehensive platform.
                From monitoring performance to maintenance scheduling, we provide all the tools
                you need to maximize your renewable energy investment.
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Real-time monitoring of energy production
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Predictive maintenance alerts
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Automated energy distribution optimization
                </li>
              </ul>
              <button
                onClick={() => navigate('/solar-installation')}
                className="bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg text-lg font-medium transform transition duration-200 hover:scale-105"
              >
                Explore Solar Solutions
              </button>
            </div>
          </div>
        );
      case 'theft':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-4">Advanced Theft Detection</h2>
              <p className="text-gray-300 mb-6">
                Our IoT-powered grid monitoring system detects electricity theft in real-time.
                Using advanced algorithms and blockchain verification, we ensure the integrity
                of the energy distribution network and reduce losses.
              </p>
              <ul className="text-gray-300 space-y-2 mb-6">
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> IoT devices monitor energy flow at critical points
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Summation algorithms detect discrepancies instantly
                </li>
                <li className="flex items-start">
                  <span className="text-green-400 mr-2">✓</span> Immutable blockchain records for evidence
                </li>
              </ul>
              <button
                onClick={() => navigate('/theft-detection')}
                className="bg-purple-600 hover:bg-purple-500 text-white py-3 px-6 rounded-lg text-lg font-medium transform transition duration-200 hover:scale-105"
              >
                Learn About Theft Prevention
              </button>
            </div>
            <div className="rounded-lg overflow-hidden shadow-xl transform transition duration-500 hover:scale-[1.02]">
              <img
                src="https://images.unsplash.com/photo-1581084349663-5199d29d2a11?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
                alt="IoT Grid Monitoring"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="space-y-16">
            {/* Hero Section with User Welcome */}
            <div className="relative">
              {/* Background elements */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl blur-xl"></div>
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl"></div>
              <div className="absolute w-full h-full opacity-20">
                <div className="absolute top-0 left-1/4 w-1 h-20 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="absolute top-1/3 left-3/4 w-2 h-2 bg-purple-500 rounded-full animate-ping"></div>
                <div className="absolute bottom-1/4 left-1/2 w-2 h-2 bg-cyan-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                <div className="absolute bottom-10 left-1/4 w-3 h-3 bg-indigo-500 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
              </div>
              
              {/* Content */}
              <div className="relative z-10 p-8 rounded-3xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 overflow-hidden">
                {/* Moving particles background */}
                <div className="absolute inset-0 overflow-hidden opacity-20">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.random() * 6 + 1}px`,
                        height: `${Math.random() * 6 + 1}px`,
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animation: `moveUpDown ${Math.random() * 10 + 10}s linear infinite`,
                        animationDelay: `${Math.random() * 10}s`
                      }}
                    ></div>
                  ))}
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="text-left mb-6 md:mb-0">
                    <div className="overflow-hidden mb-2">
                      <h1 className="text-4xl md:text-5xl font-bold mb-2 animate__animated animate__fadeInUp animate__slow">
                        <span className="bg-gradient-to-r from-purple-500 via-blue-400 to-purple-500 bg-clip-text text-transparent animate-gradient-x inline-block">Welcome to</span>
                      </h1>
                      <div className="relative">
                        <h1 className="text-5xl md:text-6xl font-bold relative z-10 animate__animated animate__fadeInUp animate__slow animate__delay-1s">
                          <span className="inline-block overflow-hidden">
                            {/* Wrap each letter for individual animation */}
                            {"VidyutChain".split('').map((letter, index) => (
                              <span 
                                key={index} 
                                className="inline-block animate__animated animate__bounceIn" 
                                style={{ 
                                  animationDelay: `${1 + (index * 0.1)}s`,
                                  background: 'linear-gradient(90deg, #8a2be2, #4169e1, #9400d3)',
                                  backgroundSize: '200% 200%',
                                  color: 'transparent',
                                  WebkitBackgroundClip: 'text',
                                  backgroundClip: 'text',
                                  animation: 'gradient 8s ease infinite'
                                }}
                              >
                                {letter}
                              </span>
                            ))}
                          </span>
                        </h1>
                        {/* Glowing underline effect */}
                        <div 
                          className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 rounded-full animate__animated animate__fadeInLeft animate__delay-2s"
                          style={{ 
                            width: '100%', 
                            boxShadow: '0 0 10px 1px rgba(138, 43, 226, 0.7)',
                            animation: 'pulse 2s infinite, gradient 8s ease infinite'
                          }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xl text-gray-300 max-w-2xl animate__animated animate__fadeIn animate__delay-2s relative">
                      <span className="typing-text inline-block overflow-hidden border-r-4 border-purple-500 pr-1 animate-typing-cursor">
                        Revolutionizing renewable energy trading with blockchain technology
                      </span>
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={() => navigate('/dashboard')} 
                      className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/30 animate__animated animate__fadeIn animate__delay-2s transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Go to Dashboard
                    </button>
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="border border-gray-600 hover:border-purple-500 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition-all duration-200 hover:bg-gray-700/50 animate__animated animate__fadeIn animate__delay-2s transform hover:scale-105"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div 
                className="bg-gradient-to-br from-blue-900/80 to-blue-700/40 p-6 rounded-xl border border-blue-600/30 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-600/20"
                onClick={() => navigate('/energy-trading')}
              >
                <div className="bg-blue-500/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Energy Trading</h3>
                <p className="text-gray-300 text-sm">Buy and sell renewable energy in our P2P marketplace</p>
              </div>
              
              <div 
                className="bg-gradient-to-br from-yellow-900/80 to-yellow-700/40 p-6 rounded-xl border border-yellow-600/30 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-600/20"
                onClick={() => navigate('/solar-installation')}
              >
                <div className="bg-yellow-500/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Solar Management</h3>
                <p className="text-gray-300 text-sm">Monitor and manage your solar installations</p>
              </div>
              
              <div 
                className="bg-gradient-to-br from-green-900/80 to-green-700/40 p-6 rounded-xl border border-green-600/30 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-green-600/20"
                onClick={() => navigate('/theft-detection')}
              >
                <div className="bg-green-500/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Theft Prevention</h3>
                <p className="text-gray-300 text-sm">Monitor grid integrity and prevent energy theft</p>
              </div>
              
              <div 
                className="bg-gradient-to-br from-purple-900/80 to-purple-700/40 p-6 rounded-xl border border-purple-600/30 cursor-pointer transform transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/20"
                onClick={() => navigate('/grid-tendering')}
              >
                <div className="bg-purple-500/20 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Grid Tendering</h3>
                <p className="text-gray-300 text-sm">Participate in transparent grid tender processes</p>
              </div>
            </div>

            {/* Feature Tabs Navigation */}
            <div className="py-6">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Platform Features</h2>
              
              <div className="flex flex-wrap justify-center space-x-0 space-y-2 sm:space-x-2 sm:space-y-0 mb-8">
                <button 
                  onClick={() => setActiveSection('trading')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeSection === 'trading' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  Energy Trading
                </button>
                <button 
                  onClick={() => setActiveSection('solar')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeSection === 'solar' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  Solar Plants
                </button>
                <button 
                  onClick={() => setActiveSection('theft')}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeSection === 'theft' 
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  Theft Detection
                </button>
              </div>
              
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700">
                {renderTabContent()}
              </div>
            </div>

            {/* Partners Section */}
            <div className="py-8">
              <h2 className="text-3xl font-bold text-white mb-4 text-center">Our Partners</h2>
              <p className="text-center text-gray-300 mb-8 max-w-3xl mx-auto">Working with industry leaders to revolutionize the renewable energy ecosystem</p>
              
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                <div className="bg-gray-800/70 hover:bg-gray-700/70 transition-all duration-300 p-6 rounded-xl border border-gray-700 transform hover:scale-105">
                  <div className="text-white text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    SolarTech
                  </div>
                </div>
                <div className="bg-gray-800/70 hover:bg-gray-700/70 transition-all duration-300 p-6 rounded-xl border border-gray-700 transform hover:scale-105">
                  <div className="text-white text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                    </svg>
                    GridInnovate
                  </div>
                </div>
                <div className="bg-gray-800/70 hover:bg-gray-700/70 transition-all duration-300 p-6 rounded-xl border border-gray-700 transform hover:scale-105">
                  <div className="text-white text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    EnergyDAO
                  </div>
                </div>
                <div className="bg-gray-800/70 hover:bg-gray-700/70 transition-all duration-300 p-6 rounded-xl border border-gray-700 transform hover:scale-105">
                  <div className="text-white text-xl font-bold flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    PowerChain
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-8">
              <h2 className="text-3xl font-bold text-white mb-4 text-center">What Our Users Say</h2>
              <p className="text-center text-gray-300 mb-8 max-w-3xl mx-auto">Trusted by energy producers and consumers across the country</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Testimonial
                  quote="VidyutChain has transformed how we manage our solar farm. The real-time monitoring and energy trading features have increased our revenue by 22%."
                  author="Priya Sharma"
                  role="Solar Farm Owner"
                  image="https://randomuser.me/api/portraits/women/45.jpg"
                />
                <Testimonial
                  quote="As a grid operator, the theft detection system has been revolutionary. We've reduced losses by 15% in just three months of implementation."
                  author="Rajesh Kumar"
                  role="Grid Manager"
                  image="https://randomuser.me/api/portraits/men/32.jpg"
                />
                <Testimonial
                  quote="The transparency of the bidding process for our recent solar installation project was impressive. We saved significantly compared to traditional procurement methods."
                  author="Ananya Patel"
                  role="Energy Consultant"
                  image="https://randomuser.me/api/portraits/women/68.jpg"
                />
              </div>
            </div>

            {/* CTA Section */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl opacity-90"></div>
              <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
                <svg className="absolute right-0 top-0 h-full opacity-20" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="star" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M15 0 L18 10 L30 10 L20 15 L24 30 L15 20 L6 30 L10 15 L0 10 L12 10 Z" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#star)" />
                </svg>
              </div>
              
              <div className="relative z-10 p-8 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to join the renewable energy revolution?</h2>
                <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
                  Access your personalized dashboard to start trading energy, manage your solar installations,
                  and contribute to a sustainable future.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="bg-white text-purple-900 hover:bg-gray-100 py-3 px-8 rounded-lg text-lg font-medium transform transition duration-200 hover:scale-105 hover:shadow-lg"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/theft-detection')}
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 py-3 px-8 rounded-lg text-lg font-medium transform transition duration-200 hover:scale-105"
                  >
                    Explore Theft Detection
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add styles for the new animations */}
      <style>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes moveUpDown {
          0% {
            transform: translateY(0) translateX(0);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
          }
          75% {
            transform: translateY(-60px) translateX(5px);
          }
          100% {
            transform: translateY(-100vh) translateX(0);
            opacity: 0;
          }
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        .animate-typing-cursor {
          animation: cursor 1s step-end infinite;
        }
        
        @keyframes cursor {
          from, to { border-color: transparent }
          50% { border-color: rgba(139, 92, 246, 1); }
        }
        
        .typing-text {
          display: inline-block;
          white-space: nowrap;
          width: 0;
          animation: typing 3.5s steps(40, end) forwards;
          animation-delay: 2.5s;
        }
      `}</style>
    </div>
  );
};

export default Home;
