import React from 'react';
import {
  Database,
  FileType,
  Settings,
  Download,
  RefreshCw,
  CheckCircle,
  Bot,
  BarChart3, // Using BarChart3 for Data Visualizer
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { icon: Database, label: 'Data Generator', value: 'generator' },
    { icon: FileType, label: 'Data Preview', value: 'preview' },
    { icon: BarChart3, label: 'Data Visualizer', value: 'visualizer' },
    { icon: Bot, label: 'Data Bot', value: 'bot' },
    { icon: CheckCircle, label: 'Validation', value: 'validation' },
    { icon: RefreshCw, label: 'Data Cleaning', value: 'cleaning' },
    { icon: Download, label: 'Export Data', value: 'export' },
    { icon: Settings, label: 'Settings', value: 'settings' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white flex flex-col min-h-screen">
      <div className="p-4 flex items-center space-x-2">
        <Database className="text-orange-500" size={24} />
        <span className="text-xl font-bold">RNS-SynthGenie</span>
      </div>
      <nav className="mt-8 flex-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${
              activeTab === tab.value ? 'bg-orange-600' : 'hover:bg-gray-700'
            }`}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2">
          <img
            src="https://cdn.pixabay.com/photo/2022/05/17/21/41/naruto-7203817_640.jpg"
            alt="User"
            className="rounded-[6px] max-w-14 max-h-14"
          />
          <div>
            <p className="font-medium">RNS</p>
            <p className="text-xs text-gray-400">sanjay@RNS-SynthGenie.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
