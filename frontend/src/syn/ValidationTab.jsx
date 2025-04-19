import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { setActiveTab } from 'react';


const ValidationTab = ({ generatedData, setActiveTab }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Data Validation</h1>
      {generatedData.length > 0 ? (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4">Validation Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle size={20} className="text-green-500 mr-2" />
                  <span className="font-medium text-green-700">Valid Records</span>
                </div>
                <p className="text-2xl font-bold mt-2">{generatedData.length}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle size={20} className="text-yellow-500 mr-2" />
                  <span className="font-medium text-yellow-700">Warnings</span>
                </div>
                <p className="text-2xl font-bold mt-2">0</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <X size={20} className="text-red-500 mr-2" />
                  <span className="font-medium text-red-700">Errors</span>
                </div>
                <p className="text-2xl font-bold mt-2">0</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="font-medium mb-2">Data Quality Checks</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-green-700">
                  <CheckCircle size={16} className="mr-2" />
                  <span>No duplicate records found</span>
                </li>
                <li className="flex items-center text-green-700">
                  <CheckCircle size={16} className="mr-2" />
                  <span>All required fields are present</span>
                </li>
                <li className="flex items-center text-green-700">
                  <CheckCircle size={16} className="mr-2" />
                  <span>Email formats are valid</span>
                </li>
                <li className="flex items-center text-green-700">
                  <CheckCircle size={16} className="mr-2" />
                  <span>Phone number formats are valid</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data to Validate</h3>
          <p className="text-gray-500 mb-4">Generate data first to run validation checks.</p>
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

export default ValidationTab;
