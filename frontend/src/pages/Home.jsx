import React, { useState } from 'react';
import { Database, FileType, Settings, Download, RefreshCw, CheckCircle, AlertCircle, Trash2, PlusCircle, X } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generator');
  const [generatedData, setGeneratedData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataConfig, setDataConfig] = useState({
    rows: 10,
    dataTypes: ['names', 'emails', 'addresses', 'phone'],
    format: 'json'
  });
  
  const handleGenerate = () => {
    setIsGenerating(true);
    // In a real implementation, this would call the Django backend
    setTimeout(() => {
      const mockData = Array(dataConfig.rows).fill().map((_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        address: `${100 + i} Main St, City`,
        phone: `555-${String(1000 + i).slice(1)}`
      }));
      setGeneratedData(mockData);
      setIsGenerating(false);
    }, 1500);
  };
  
  const handleClearData = () => {
    setGeneratedData([]);
  };
  
  const handleConfigChange = (key, value) => {
    setDataConfig({
      ...dataConfig,
      [key]: value
    });
  };
  
  const handleExport = (format) => {
    // In a real implementation, this would call the Django backend to generate the file
    alert(`Exporting data in ${format} format...`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white">
        <div className="p-4 flex items-center space-x-2">
          <Database className="text-orange-500" size={24} />
          <span className="text-xl font-bold">SynthGenie</span>
        </div>
        <nav className="mt-8">
          <button 
            onClick={() => setActiveTab('generator')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'generator' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <Database size={18} />
            <span>Data Generator</span>
          </button>
          <button 
            onClick={() => setActiveTab('preview')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'preview' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <FileType size={18} />
            <span>Data Preview</span>
          </button>
          <button 
            onClick={() => setActiveTab('validation')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'validation' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <CheckCircle size={18} />
            <span>Validation</span>
          </button>
          <button 
            onClick={() => setActiveTab('cleaning')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'cleaning' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <RefreshCw size={18} />
            <span>Data Cleaning</span>
          </button>
          <button 
            onClick={() => setActiveTab('export')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'export' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <Download size={18} />
            <span>Export Data</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full text-left px-4 py-3 flex items-center space-x-3 ${activeTab === 'settings' ? 'bg-orange-600' : 'hover:bg-gray-700'}`}>
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>
        <div className="mt-auto p-4 border-t border-gray-700">
          <div className="flex items-center space-x-2">
            <img src="/api/placeholder/32/32" alt="User" className="rounded-full" />
            <div>
              <p className="font-medium">Demo User</p>
              <p className="text-xs text-gray-400">demo@synthgenie.com</p>
            </div>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Generator Tab */}
        {activeTab === 'generator' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Generate Synthetic Data</h1>
            
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-semibold mb-4">Configure Data Generation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
                  <input 
                    type="number" 
                    value={dataConfig.rows} 
                    onChange={(e) => handleConfigChange('rows', parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="1000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                  <select 
                    value={dataConfig.format}
                    onChange={(e) => handleConfigChange('format', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="json">JSON</option>
                    <option value="csv">CSV</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Types to Include</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['names', 'emails', 'addresses', 'phone', 'dob', 'ssn', 'credit_card', 'company'].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        if (dataConfig.dataTypes.includes(type)) {
                          handleConfigChange('dataTypes', dataConfig.dataTypes.filter(t => t !== type));
                        } else {
                          handleConfigChange('dataTypes', [...dataConfig.dataTypes, type]);
                        }
                      }}
                      className={`px-3 py-1 rounded-full text-sm ${
                        dataConfig.dataTypes.includes(type) 
                          ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-4 mb-6">
              <button 
                onClick={handleGenerate}
                disabled={isGenerating || dataConfig.dataTypes.length === 0}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  isGenerating || dataConfig.dataTypes.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    <span>Generate Data</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={handleClearData}
                disabled={generatedData.length === 0}
                className={`px-4 py-2 rounded-md flex items-center space-x-2 ${
                  generatedData.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Trash2 size={16} />
                <span>Clear Data</span>
              </button>
            </div>
            
            {generatedData.length > 0 && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-medium">Generated Data Preview</h3>
                  <span className="text-sm text-gray-500">{generatedData.length} rows</span>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {generatedData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((value, j) => (
                            <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {generatedData.length > 5 && (
                        <tr>
                          <td colSpan={Object.keys(generatedData[0]).length} className="px-6 py-4 text-center text-sm text-gray-500">
                            ... and {generatedData.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div>
            <h1 className="text-2xl font-bold mb-6">Data Preview</h1>
            
            {generatedData.length > 0 ? (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(generatedData[0]).map(key => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
        )}
        
        {/* Validation Tab */}
        {activeTab === 'validation' && (
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
        )}
        
        {/* Cleaning Tab */}
        {activeTab === 'cleaning' && (
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
        )}
        
        {/* Export Tab */}
        {activeTab === 'export' && (
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
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
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
        )}
      </main>
    </div>
  );
}