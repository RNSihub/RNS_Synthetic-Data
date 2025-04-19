import React from 'react';
import { RefreshCw, PlusCircle } from 'lucide-react';
import { setActiveTab } from 'react';


const CleaningTab = ({ generatedData, setActiveTab }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Data Cleaning & Corrections</h1>
      {generatedData.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-medium">Edit Data</h2>
            <p className="text-sm text-gray-500 mt-1">Make manual corrections to your generated data.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {Object.keys(generatedData[0]).map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {key}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {generatedData.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.values(row).map((value, j) => (
                      <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {value}
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-orange-600 hover:text-orange-800">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              <button className="px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center space-x-1">
                <PlusCircle size={16} />
                <span>Add Row</span>
              </button>
            </div>
            <div>
              <button className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <RefreshCw size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data to Clean</h3>
          <p className="text-gray-500 mb-4">Generate data first to make corrections or edits.</p>
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

export default CleaningTab;
