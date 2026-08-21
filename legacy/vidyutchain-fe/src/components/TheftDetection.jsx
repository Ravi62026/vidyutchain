import React, { useState } from 'react';
import Navbar from './Navbar';
import { useAuth } from './AuthCheck';

// Energy Flow Diagram Component
const EnergyFlowDiagram = () => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">Energy Flow Monitoring</h3>

      {/* Energy Flow Diagram with IoT Monitoring */}
      <div className="relative bg-gray-900 rounded-lg p-4 mb-4 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#8b5cf6" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="flex flex-col items-center">
          <div className="text-center mb-4">
            <span className="bg-purple-900/30 text-purple-400 text-xs px-2 py-1 rounded">Energy Flow Direction</span>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 py-6 relative">
            {/* Homes Group - Starting point */}
            <div className="flex flex-col items-center">
              <div className="grid grid-cols-2 gap-3">
                {/* Home 1 - Normal */}
                <div className="flex flex-col items-center group">
                  <div className="relative w-14 h-14 group-hover:border-purple-500 transition-all duration-300">
                    <div className="w-14 h-10 bg-gray-800 border border-gray-700 rounded-sm shadow-lg"></div>
                    <div className="w-14 h-6 bg-gray-800 border border-gray-700 -mt-1 rounded-t-lg shadow-lg"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                    <div className="absolute -bottom-1 left-5 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                      <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
                    </div>
                  </div>
                </div>
                {/* Home 2 - Normal */}
                <div className="flex flex-col items-center group">
                  <div className="relative w-14 h-14 group-hover:border-purple-500 transition-all duration-300">
                    <div className="w-14 h-10 bg-gray-800 border border-gray-700 rounded-sm shadow-lg"></div>
                    <div className="w-14 h-6 bg-gray-800 border border-gray-700 -mt-1 rounded-t-lg shadow-lg"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  </div>
                </div>
                {/* Home 3 - Theft Detected */}
                <div className="flex flex-col items-center group">
                  <div className="relative w-14 h-14 group-hover:border-purple-500 transition-all duration-300">
                    <div className="w-14 h-10 bg-gray-800 border border-gray-700 rounded-sm shadow-lg"></div>
                    <div className="w-14 h-6 bg-gray-800 border border-gray-700 -mt-1 rounded-t-lg shadow-lg"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></div>
                    <div className="absolute bottom-1 left-1 w-6 h-6 opacity-70">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" className="w-6 h-6">
                        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                {/* Home 4 - Normal */}
                <div className="flex flex-col items-center group">
                  <div className="relative w-14 h-14 group-hover:border-purple-500 transition-all duration-300">
                    <div className="w-14 h-10 bg-gray-800 border border-gray-700 rounded-sm shadow-lg"></div>
                    <div className="w-14 h-6 bg-gray-800 border border-gray-700 -mt-1 rounded-t-lg shadow-lg"></div>
                    <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                  </div>
                </div>
              </div>
              <div className="mt-2 text-gray-300 text-sm font-medium">Consumer Homes</div>
              <div className="text-xs text-gray-500">Energy Source/Sink</div>
            </div>

            {/* Arrow with IoT sensor */}
            <div className="flex items-center relative">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-0 border-l-8 border-t-transparent border-b-transparent border-l-purple-500"></div>
              <div className="w-12 h-1 bg-purple-500"></div>
              <div className="absolute -top-3 left-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
              </div>
            </div>

            {/* Utility Pole */}
            <div className="flex flex-col items-center group">
              <div className="relative w-20 h-20 flex items-center justify-center group-hover:border-purple-500 transition-all duration-300">
                <div className="h-20 w-4 bg-gray-700 rounded-t-sm"></div>
                <div className="h-4 w-16 bg-gray-700 rounded-sm absolute top-4"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                <div className="absolute -bottom-1 right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                  <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
                </div>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                  500 kWh
                </div>
              </div>
              <div className="mt-2 text-gray-300 text-sm font-medium">Utility Poles</div>
              <div className="text-xs text-gray-500">Power Lines</div>
            </div>

            {/* Arrow with IoT sensor */}
            <div className="flex items-center relative">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-0 border-l-8 border-t-transparent border-b-transparent border-l-purple-500"></div>
              <div className="w-12 h-1 bg-purple-500"></div>
              <div className="absolute -top-3 left-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
              </div>
            </div>

            {/* Transformer */}
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center shadow-lg group-hover:border-purple-500 transition-all duration-300">
                <div className="w-12 h-12 border-4 border-gray-600 rounded-md flex items-center justify-center">
                  <div className="text-xs text-gray-400">T</div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                  480 kWh
                </div>
                <div className="absolute -right-3 bottom-1/2 transform translate-y-1/2 bg-red-900/30 px-2 py-1 rounded-full text-xs text-red-400 animate-pulse">
                  -20 kWh
                </div>
              </div>
              <div className="mt-2 text-gray-300 text-sm font-medium">Transformer</div>
              <div className="text-xs text-gray-500">Voltage Conversion</div>
            </div>

            {/* Arrow with IoT sensor */}
            <div className="flex items-center relative">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-0 border-l-8 border-t-transparent border-b-transparent border-l-purple-500"></div>
              <div className="w-12 h-1 bg-purple-500"></div>
              <div className="absolute -top-3 left-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
              </div>
            </div>

            {/* Substation */}
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 bg-gray-800 rounded-lg border border-gray-700 flex flex-col justify-center items-center shadow-lg group-hover:border-purple-500 transition-all duration-300">
                <div className="w-16 h-3 bg-gray-600 mb-1 rounded-sm"></div>
                <div className="w-16 h-3 bg-gray-600 mb-1 rounded-sm"></div>
                <div className="w-16 h-3 bg-gray-600 rounded-sm"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                  450 kWh
                </div>
                <div className="absolute -right-3 bottom-1/2 transform translate-y-1/2 bg-red-900/30 px-2 py-1 rounded-full text-xs text-red-400 animate-pulse">
                  -30 kWh
                </div>
              </div>
              <div className="mt-2 text-gray-300 text-sm font-medium">Substation</div>
              <div className="text-xs text-gray-500">Distribution Point</div>
            </div>

            {/* Arrow with IoT sensor */}
            <div className="flex items-center relative">
              <div className="w-0 h-0 border-t-4 border-b-4 border-r-0 border-l-8 border-t-transparent border-b-transparent border-l-purple-500"></div>
              <div className="w-12 h-1 bg-purple-500"></div>
              <div className="absolute -top-3 left-4 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-500/50">
                <span className="absolute -top-5 -left-3 text-xs text-blue-400">IoT</span>
              </div>
            </div>

            {/* Grid - End point */}
            <div className="flex flex-col items-center group">
              <div className="w-20 h-20 relative bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center shadow-lg group-hover:border-purple-500 transition-all duration-300">
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    <line x1="0" y1="0" x2="100" y2="100" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="100" y1="0" x2="0" y2="100" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="#8b5cf6" strokeWidth="2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="#8b5cf6" strokeWidth="2" />
                  </svg>
                </div>
                <div className="text-purple-400 text-xs font-semibold">GRID</div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 px-2 py-1 rounded text-xs text-gray-400">
                  400 kWh
                </div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-red-900/30 px-2 py-1 rounded-full text-xs text-red-400 animate-pulse">
                  Total Loss: -100 kWh
                </div>
              </div>
              <div className="mt-2 text-gray-300 text-sm font-medium">Power Grid</div>
              <div className="text-xs text-gray-500">Main Distribution Network</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-300 text-xs">Normal Flow</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-300 text-xs">Theft Detected</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
            <span className="text-gray-300 text-xs">IoT Monitoring Point</span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-purple-400 mr-2">
              <path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-300 text-xs">Energy Flow Direction</span>
          </div>
        </div>
      </div>

      {/* Energy Measurement Explanation */}
      <div className="bg-gray-900 rounded-lg p-4">
        <h4 className="text-white text-sm font-medium mb-2">How Energy Theft Detection Works:</h4>
        <p className="text-gray-400 text-sm mb-2">Our IoT devices measure energy at each point in the distribution network. The system compares expected vs. actual energy values to detect theft.</p>
        <div className="flex flex-wrap gap-4 justify-center text-center">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Source Energy (Homes)</div>
            <div className="text-lg font-bold text-green-400">500 kWh</div>
          </div>
          <div className="flex items-center text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Expected at Grid</div>
            <div className="text-lg font-bold text-green-400">500 kWh</div>
          </div>
          <div className="flex items-center text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Actual at Grid</div>
            <div className="text-lg font-bold text-red-400">400 kWh</div>
          </div>
          <div className="flex items-center text-purple-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="bg-red-900/30 p-3 rounded-lg">
            <div className="text-xs text-red-400 mb-1">Total Theft</div>
            <div className="text-lg font-bold text-red-400">100 kWh</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Validation Table Component
const ValidationTable = () => {
  const [activeTab, setActiveTab] = useState('transformer');

  // Sample data for different monitoring points
  const transformerData = [
    { id: 'T1', expected: '500 kWh', actual: '500 kWh', status: 'normal' },
    { id: 'T2', expected: '450 kWh', actual: '450 kWh', status: 'normal' },
    { id: 'T3', expected: '600 kWh', actual: '520 kWh', status: 'theft' },
    { id: 'T4', expected: '550 kWh', actual: '550 kWh', status: 'normal' },
  ];

  const substationData = [
    { id: 'S1', expected: '2100 kWh', actual: '2020 kWh', status: 'theft' },
    { id: 'S2', expected: '1800 kWh', actual: '1800 kWh', status: 'normal' },
  ];

  const displayData = activeTab === 'transformer' ? transformerData : substationData;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Validation Report</h3>

      <div className="flex mb-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('transformer')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'transformer' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Transformer Points
        </button>
        <button
          onClick={() => setActiveTab('substation')}
          className={`px-4 py-2 text-sm font-medium ${activeTab === 'substation' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
        >
          Substation Points
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs uppercase bg-gray-700 text-gray-400">
            <tr>
              <th scope="col" className="px-6 py-3">Point ID</th>
              <th scope="col" className="px-6 py-3">Expected Energy</th>
              <th scope="col" className="px-6 py-3">Actual Measurement</th>
              <th scope="col" className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((point) => (
              <tr key={point.id} className="border-b bg-gray-800 border-gray-700">
                <td className="px-6 py-4">{point.id}</td>
                <td className="px-6 py-4">{point.expected}</td>
                <td className="px-6 py-4">{point.actual}</td>
                <td className="px-6 py-4">
                  {point.status === 'normal' ? (
                    <span className="text-green-400">Normal</span>
                  ) : (
                    <span className="text-red-500 font-medium">Theft Suspected</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Alert Panel Component
const AlertPanel = () => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Active Alerts</h3>
      <div className="space-y-4">
        <div className="border-l-4 border-red-500 bg-gray-700 p-4 rounded">
          <div className="flex justify-between">
            <h4 className="text-white font-medium">Energy Discrepancy Detected</h4>
            <span className="text-red-400 text-sm">Critical</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">Location: Transformer T3</p>
          <p className="text-gray-300 text-sm mt-1">Expected: 600 kWh, Actual: 520 kWh</p>
          <p className="text-gray-400 text-xs mt-2">Detected 2 hours ago</p>
        </div>

        <div className="border-l-4 border-red-500 bg-gray-700 p-4 rounded">
          <div className="flex justify-between">
            <h4 className="text-white font-medium">Energy Discrepancy Detected</h4>
            <span className="text-red-400 text-sm">Critical</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">Location: Substation S1</p>
          <p className="text-gray-300 text-sm mt-1">Expected: 2100 kWh, Actual: 2020 kWh</p>
          <p className="text-gray-400 text-xs mt-2">Detected 3 hours ago</p>
        </div>

        <div className="border-l-4 border-yellow-500 bg-gray-700 p-4 rounded">
          <div className="flex justify-between">
            <h4 className="text-white font-medium">Suspicious Connection Pattern</h4>
            <span className="text-yellow-400 text-sm">Warning</span>
          </div>
          <p className="text-gray-300 text-sm mt-1">Location: Distribution Hub #87</p>
          <p className="text-gray-400 text-xs mt-2">Detected 6 hours ago</p>
        </div>
      </div>
    </div>
  );
};

// Summation Method Explanation Component
const SummationMethodExplanation = () => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">The Summation Method</h3>
      <div className="space-y-6 text-gray-300">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-purple-900/30 text-purple-400 text-sm px-3 py-1 rounded-full">
            Advanced Mathematical Detection
          </div>
        </div>

        <p className="text-center">
          Our theft detection system uses the <strong className="text-purple-400">Summation Method</strong> to identify energy theft in the distribution network. This mathematical approach is based on the principle of energy conservation.
        </p>

        {/* Formula Card */}
        <div className="bg-gray-900 p-6 rounded-lg border border-purple-900/50 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

          <h4 className="text-white font-semibold mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
            </svg>
            Conservation of Energy Principle
          </h4>

          <div className="bg-gray-800/80 p-4 rounded-lg text-center mb-4 shadow-inner backdrop-blur-sm">
            <p className="text-xl font-semibold text-white tracking-wide">
              Energy Input = Energy Output + Losses
            </p>
          </div>

          <p className="mb-4">
            At each node in the distribution network, we measure the energy flowing in and out. The sum of energy flowing out should equal the energy flowing in, minus known technical losses.
          </p>

          <div className="bg-gray-800/80 p-4 rounded-lg shadow-inner backdrop-blur-sm">
            <p className="font-semibold text-white mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Mathematical Representation:
            </p>

            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center justify-center bg-gray-900/70 px-6 py-3 rounded-lg shadow-inner border border-purple-900/30 w-fit animate-pulse">
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">in</span>
                <span className="text-white text-2xl font-mono mr-2">=</span>
                <span className="text-purple-400 text-2xl font-mono mr-1">Σ</span>
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">out</span>
                <span className="text-white text-2xl font-mono mr-2">+</span>
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">losses</span>
              </div>

              <div className="flex items-center justify-center bg-red-900/30 px-6 py-3 rounded-lg shadow-inner border border-red-900/20 w-fit">
                <span className="text-white text-base font-mono">When</span>
                <span className="mx-2"></span>
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">in</span>
                <span className="text-white text-2xl font-mono mr-2">-</span>
                <span className="text-purple-400 text-2xl font-mono mr-1">Σ</span>
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">out</span>
                <span className="text-white text-2xl font-mono mr-2">-</span>
                <span className="text-purple-400 text-2xl font-mono mr-2">E</span>
                <span className="text-purple-400 text-sm font-mono relative -top-2 mr-2">losses</span>
                <span className="text-white text-2xl font-mono mr-2">{'>'}</span>
                <span className="text-red-400 text-2xl font-mono">Θ</span>
                <span className="mx-2"></span>
                <span className="text-red-400 text-base font-mono">→ Theft Detected</span>
              </div>
            </div>
          </div>

          <div className="flex items-center mt-4 border-t border-purple-900/20 pt-4">
            <div className="bg-purple-900/20 rounded-full p-1 mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs text-purple-300 italic">Where Θ is the detection threshold calibrated based on historical data</span>
          </div>
        </div>

        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-blue-400 font-medium">How It Works in Practice</span>
          </div>
          <p className="text-sm">
            Our IoT devices continuously monitor energy flows at transformers, substations, and distribution points. When a significant discrepancy is detected, the system generates an alert for investigation. The blockchain records all measurements immutably, providing evidence for any legal proceedings.
          </p>
        </div>
      </div>
    </div>
  );
};

// Full Report Modal Component
const FullReportModal = ({ isOpen, onClose, reportData }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const exportReport = () => {
    setLoading('export');
    
    // Simulate API call/processing
    setTimeout(() => {
      // Create a sample report
      const report = {
        title: "Energy Theft Detection Report",
        date: new Date().toISOString(),
        summary: {
          totalPoints: 128,
          activeAlerts: 3,
          estimatedLoss: "180 kWh"
        },
        alerts: [
          {
            id: "A-2023-0042",
            location: "Transformer T3",
            type: "Energy Discrepancy",
            expected: "600 kWh",
            actual: "520 kWh",
            discrepancy: "-80 kWh",
            timestamp: "2023-06-15 14:32:18",
            status: "Active"
          },
          {
            id: "A-2023-0043",
            location: "Substation S1",
            type: "Energy Discrepancy",
            expected: "2100 kWh",
            actual: "2020 kWh",
            discrepancy: "-80 kWh",
            timestamp: "2023-06-15 15:45:22",
            status: "Active"
          }
        ]
      };
      
      // Convert to JSON string
      const jsonString = JSON.stringify(report, null, 2);
      
      // Create a blob and download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'theft_detection_report.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setLoading(false);
      setSuccess('export');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 1500);
  };

  const generateInvestigation = () => {
    setLoading('investigation');
    
    // Simulate API call/processing
    setTimeout(() => {
      // In a real app, this would send the request to a blockchain or backend service
      
      setLoading(false);
      setSuccess('investigation');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Theft Detection Full Report</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Summary Section */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">Detection Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-xs">Total Monitoring Points</p>
                  <p className="text-white text-lg font-bold">128</p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-xs">Active Alerts</p>
                  <p className="text-white text-lg font-bold">3</p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                  <p className="text-gray-400 text-xs">Estimated Energy Loss</p>
                  <p className="text-white text-lg font-bold">180 kWh</p>
                </div>
              </div>
            </div>

            {/* Detailed Alerts Table */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Detailed Alert Log</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                  <thead className="text-xs uppercase bg-gray-700 text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-3">Alert ID</th>
                      <th scope="col" className="px-4 py-3">Location</th>
                      <th scope="col" className="px-4 py-3">Type</th>
                      <th scope="col" className="px-4 py-3">Expected</th>
                      <th scope="col" className="px-4 py-3">Actual</th>
                      <th scope="col" className="px-4 py-3">Discrepancy</th>
                      <th scope="col" className="px-4 py-3">Timestamp</th>
                      <th scope="col" className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-gray-800 border-gray-700">
                      <td className="px-4 py-3">A-2023-0042</td>
                      <td className="px-4 py-3">Transformer T3</td>
                      <td className="px-4 py-3">Energy Discrepancy</td>
                      <td className="px-4 py-3">600 kWh</td>
                      <td className="px-4 py-3">520 kWh</td>
                      <td className="px-4 py-3 text-red-500">-80 kWh</td>
                      <td className="px-4 py-3">2023-06-15 14:32:18</td>
                      <td className="px-4 py-3">
                        <span className="bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded">Active</span>
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-800 border-gray-700">
                      <td className="px-4 py-3">A-2023-0043</td>
                      <td className="px-4 py-3">Substation S1</td>
                      <td className="px-4 py-3">Energy Discrepancy</td>
                      <td className="px-4 py-3">2100 kWh</td>
                      <td className="px-4 py-3">2020 kWh</td>
                      <td className="px-4 py-3 text-red-500">-80 kWh</td>
                      <td className="px-4 py-3">2023-06-15 15:45:22</td>
                      <td className="px-4 py-3">
                        <span className="bg-red-900/30 text-red-400 text-xs px-2 py-1 rounded">Active</span>
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-800 border-gray-700">
                      <td className="px-4 py-3">A-2023-0044</td>
                      <td className="px-4 py-3">Distribution Hub #87</td>
                      <td className="px-4 py-3">Suspicious Pattern</td>
                      <td className="px-4 py-3">N/A</td>
                      <td className="px-4 py-3">N/A</td>
                      <td className="px-4 py-3">N/A</td>
                      <td className="px-4 py-3">2023-06-15 18:12:05</td>
                      <td className="px-4 py-3">
                        <span className="bg-yellow-900/30 text-yellow-400 text-xs px-2 py-1 rounded">Investigating</span>
                      </td>
                    </tr>
                    <tr className="border-b bg-gray-800 border-gray-700">
                      <td className="px-4 py-3">A-2023-0041</td>
                      <td className="px-4 py-3">Transformer T7</td>
                      <td className="px-4 py-3">Energy Discrepancy</td>
                      <td className="px-4 py-3">320 kWh</td>
                      <td className="px-4 py-3">300 kWh</td>
                      <td className="px-4 py-3 text-red-500">-20 kWh</td>
                      <td className="px-4 py-3">2023-06-14 09:18:42</td>
                      <td className="px-4 py-3">
                        <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded">Resolved</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Historical Data */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-3">Historical Theft Detection</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-white font-medium mb-2">Monthly Detection Trend</h4>
                  <div className="h-40 flex items-end justify-between space-x-2">
                    {[15, 22, 18, 25, 30, 37].map((value, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div
                          className="bg-purple-600 w-8"
                          style={{ height: `${value * 2}px` }}
                        ></div>
                        <span className="text-xs text-gray-400 mt-1">Month {index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-white font-medium mb-2">Detection by Location Type</h4>
                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Transformers</span>
                        <span className="text-sm text-gray-400">65%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Substations</span>
                        <span className="text-sm text-gray-400">25%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-400">Distribution Hubs</span>
                        <span className="text-sm text-gray-400">10%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Success messages */}
            {success && (
              <div className={`bg-green-900/30 border border-green-600/30 text-green-400 px-4 py-3 rounded flex items-center justify-between`}>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {success === 'export' && <span>Report exported successfully!</span>}
                  {success === 'investigation' && <span>Investigation request submitted successfully!</span>}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className={`${loading === 'export' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'} text-white py-2 px-4 rounded flex items-center`}
                onClick={exportReport}
                disabled={loading === 'export'}
              >
                {loading === 'export' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Export Report
                  </>
                )}
              </button>
              <button 
                className={`${loading === 'investigation' ? 'bg-purple-500' : 'bg-purple-600 hover:bg-purple-500'} text-white py-2 px-4 rounded flex items-center`}
                onClick={generateInvestigation}
                disabled={loading === 'investigation'}
              >
                {loading === 'investigation' ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                    </svg>
                    Generate Investigation Request
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main TheftDetection Component
const TheftDetection = () => {
  const { user } = useAuth();
  const [showFullReport, setShowFullReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [showReportLoading, setShowReportLoading] = useState(false);
  const isAdmin = user?.isAdmin || user?.role === 'admin';

  const fetchReport = () => {
    setShowReportLoading(true);
    
    // Simulate API call to fetch report data
    setTimeout(() => {
      const data = {
        summary: {
          totalPoints: 128,
          activeAlerts: 3,
          estimatedLoss: "180 kWh"
        },
        details: {
          alerts: [
            {
              id: "A-2023-0042",
              location: "Transformer T3",
              type: "Energy Discrepancy",
              expected: "600 kWh",
              actual: "520 kWh",
              discrepancy: "-80 kWh",
              timestamp: "2023-06-15 14:32:18",
              status: "Active"
            }
          ]
        }
      };
      
      setReportData(data);
      setShowReportLoading(false);
      setShowFullReport(true);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Energy Theft Detection (Validation via Summation Method)</h2>

        {/* Energy Flow Diagram */}
        <EnergyFlowDiagram />

        {/* Summation Method Explanation */}
        <SummationMethodExplanation />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Validation Table */}
          <ValidationTable />

          {/* Alert Panel */}
          <AlertPanel />
        </div>

        <div className="mt-6 bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <h4 className="text-white font-medium">Monitoring Status</h4>
              <div className="flex items-center mt-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-400 text-sm">Active - Monitoring 128 nodes</span>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="text-white font-medium">Detection Statistics</h4>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-gray-400 text-xs">This Week</p>
                  <p className="text-white text-lg font-bold">12</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">This Month</p>
                  <p className="text-white text-lg font-bold">37</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded">
              <h4 className="text-white font-medium">Actions</h4>
              <div className="mt-3">
                {isAdmin ? (
                  <button
                    onClick={fetchReport}
                    className="bg-purple-600 hover:bg-purple-500 text-white py-2 px-4 rounded text-sm w-full flex items-center justify-center"
                    disabled={showReportLoading}
                  >
                    {showReportLoading ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        View Full Report
                      </>
                    )}
                  </button>
                ) : (
                  <div className="text-center py-2 text-gray-400 text-sm">
                    Full reports available to admin users only
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Full Report Modal */}
        <FullReportModal
          isOpen={showFullReport}
          onClose={() => setShowFullReport(false)}
          reportData={reportData} 
        />
      </div>
    </div>
  );
};

export default TheftDetection;
