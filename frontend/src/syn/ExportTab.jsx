import React from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { setActiveTab } from 'react';


const ExportTab = ({ generatedData, handleExport }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Export Your Data</h1>
      {generatedData.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Export Options</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Download size={24} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium">JSON Format</h3>
                </div>
                <p className="text-gray-500 mb-4">Export your data as a JSON file for easy integration with JavaScript applications.</p>
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full"
                >
                  Export as JSON
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Download size={24} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium">CSV Format</h3>
                </div>
                <p className="text-gray-500 mb-4">Export your data as a CSV file for easy use with spreadsheet applications.</p>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full"
                >
                  Export as CSV
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Download size={24} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium">SQL Format</h3>
                </div>
                <p className="text-gray-500 mb-4">Export your data as SQL INSERT statements for database integration.</p>
                <button
                  onClick={() => handleExport('sql')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full"
                >
                  Export as SQL
                </button>
              </div>
              <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-lg mr-4">
                    <Download size={24} className="text-orange-600" />
                  </div>
                  <h3 className="text-lg font-medium">Excel Format</h3>
                </div>
                <p className="text-gray-500 mb-4">Export your data as an Excel spreadsheet for advanced analysis.</p>
                <button
                  onClick={() => handleExport('excel')}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full"
                >
                  Export as Excel
                </button>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <AlertCircle size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-1">Data Privacy Note</h3>
                <p className="text-blue-700 text-sm">
                  Remember that even synthetic data may need to comply with relevant data protection regulations in your region.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Download size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data to Export</h3>
          <p className="text-gray-500 mb-4">Generate data first to export it in various formats.</p>
          <button
            onClick={() => setActiveTab('generator')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Generate Data
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportTab;
