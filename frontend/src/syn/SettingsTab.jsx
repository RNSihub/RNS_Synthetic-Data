import React from 'react';
import { setActiveTab } from 'react';


const SettingsTab = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-medium">Application Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your SynthGenie preferences.</p>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-md font-medium mb-3">General Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-gray-500">Switch between light and dark themes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-gray-500">Receive alerts when operations complete</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" value="" className="sr-only peer" checked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium mb-3">Data Generation Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Format</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="sql">SQL</option>
                  <option value="excel">Excel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Row Count</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  defaultValue="100"
                  min="1"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locale Settings</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2">
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (United Kingdom)</option>
                  <option value="fr-FR">French (France)</option>
                  <option value="de-DE">German (Germany)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                </select>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-md font-medium mb-3">API Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <div className="relative">
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    value="••••••••••••••••••••••••••••••"
                    readOnly
                  />
                  <button className="absolute right-2 top-2 text-orange-600 hover:text-orange-800">
                    Show
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Used for programmatic access to your data</p>
              </div>
              <div>
                <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
                  Regenerate API Key
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
          <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
