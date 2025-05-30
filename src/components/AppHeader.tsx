import React from 'react';
import { Wifi, Smartphone, Laptop } from 'lucide-react';

const AppHeader: React.FC = () => {
  return (
    <header className="py-4 px-6 border-b border-gray-200 bg-white">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Wifi className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-xl font-semibold text-gray-800">EasyConnect by BeingNotified</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Laptop className="h-5 w-5 text-gray-500" />
          <div className="h-1 w-1 rounded-full bg-gray-300"></div>
          <Smartphone className="h-5 w-5 text-gray-500" />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;