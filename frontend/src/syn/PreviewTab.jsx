import React from 'react';
import { Database, ChevronsDown } from 'lucide-react';

const PreviewTab = ({ generatedData, setActiveTab }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Data Preview</h1>

      {generatedData.length > 0 ? (
        <div className="relative bg-white rounded-lg shadow-md overflow-hidden">
          {/* Swipe Down Hint */}
          

          {/* Scrollable Table */}
          <div className="overflow-auto max-h-[540px] border-t ">
            <table className="min-w-full">
              <thead className="bg-gray-50 sticky top-0 z-10 rounded-[15px]">
                <tr>
                  {Object.keys(generatedData[0]).map((key) => (
                    <th
                      key={key}
                      className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-300 "
                    >
                      {key}
                    </th>
                  ))}
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
                  </tr>
                ))}
              </tbody>
              
            </table>
            
          </div>
          <div className="absolute top-120 left-239 transform -translate-x-1/2  flex flex-col items-center bg-gray-50 rounded-lg shadow-md p-2">
            <ChevronsDown className="text-orange-500 animate-bounce" size={15} />
            <span className="text-[10px] text-gray-400">Scroll down</span>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Generated Yet</h3>
          <p className="text-gray-500 mb-4">Go to the Data Generator tab to create some synthetic data.</p>
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

export default PreviewTab;
