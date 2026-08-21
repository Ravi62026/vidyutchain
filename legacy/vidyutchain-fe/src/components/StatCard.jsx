import React from 'react';

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`bg-gray-800 rounded-lg shadow-lg p-6 border-t-4 ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

export default StatCard;
