import React from 'react';
import { Database, FileType, Settings, Download, RefreshCw, CheckCircle } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { icon: Database, label: 'Data Generator', value: 'generator' },
    { icon: FileType, label: 'Data Preview', value: 'preview' },
    { icon: CheckCircle, label: 'Validation', value: 'validation' },
    { icon: RefreshCw, label: 'Data Cleaning', value: 'cleaning' },
    { icon: Download, label: 'Export Data', value: 'export' },
    { icon: Settings, label: 'Settings', value: 'settings' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white">
      <div className="p-4 flex items-center space-x-2">
        <Database className="text-orange-500" size={24} />
        <span className="text-xl font-bold">RNS-SynthGenie</span>
      </div>
      <nav className="mt-8">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === tab.value ? 'bg-orange-600' : 'hover:bg-gray-700'}`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <img src="/api/placeholder/32/32" alt="User" className="rounded-full" />
          <div>
            <p className="font-medium">Demo User</p>
            <p className="text-xs text-gray-400">sanjay@RNS-SynthGenie.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
