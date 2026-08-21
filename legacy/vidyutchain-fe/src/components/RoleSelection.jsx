import React from 'react';

// Role selection component for registration
const RoleSelection = ({ value, onChange }) => {
  const roles = [
    { value: 'producer', label: 'Producer', description: 'Entities that generate and supply energy to the grid.' },
    { value: 'consumer', label: 'Consumer', description: 'End-users who purchase and consume energy from the grid.' },
    { value: 'bidder', label: 'Bidder', description: 'Participants who bid on energy grid projects and tenders.' },
    { value: 'industry', label: 'Industry/Company', description: 'Large industrial entities requiring ESC certificates and specialized energy services.' }
  ];

  return (
    <div className="rounded-md border border-gray-700 bg-gray-800 p-4 my-4">
      <div className="mb-3">
        <h3 className="text-white font-medium text-lg mb-2">
          Select Your Role
        </h3>
      </div>
      
      <div className="space-y-3">
        {roles.map((role) => (
          <div 
            key={role.value}
            className={`p-3 rounded-md border ${
              value === role.value 
                ? 'border-purple-500 bg-purple-900/30' 
                : 'border-gray-700 bg-gray-700 hover:bg-gray-600'
            } cursor-pointer transition-colors`}
            onClick={() => onChange(role.value)}
          >
            <div className="flex items-center">
              <input
                type="radio"
                id={`role-${role.value}`}
                name="role"
                value={role.value}
                checked={value === role.value}
                onChange={() => onChange(role.value)}
                className="mr-3 accent-purple-500 cursor-pointer"
              />
              <label htmlFor={`role-${role.value}`} className="cursor-pointer flex-1">
                <span className="text-white font-medium block text-base">
                  {role.label}
                </span>
                <span className="text-gray-400 text-sm block mt-1">
                  {role.description}
                </span>
              </label>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-yellow-400 bg-yellow-900/30 rounded-md p-3">
        <strong>Note:</strong> Admin accounts require special authorization and can only be created through the designated admin wallet.
      </div>
    </div>
  );
};

export default RoleSelection; 