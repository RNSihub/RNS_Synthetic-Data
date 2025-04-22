import React, { useState } from 'react';
import { Send, Download, FileText, Settings, X, Loader, Eye, Table, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Cookies from 'js-cookie';

// Sample data for visualization
const sampleChartData = [
  { name: 'Day 1', rows: 300 },
  { name: 'Day 2', rows: 450 },
  { name: 'Day 3', rows: 200 },
  { name: 'Day 4', rows: 670 },
  { name: 'Day 5', rows: 320 },
  { name: 'Day 6', rows: 550 },
  { name: 'Day 7', rows: 400 },
];

// Sample table data - this would be replaced with actual generated data
const getInitialSampleData = () => {
  const data = [];
  for (let i = 0; i < 5; i++) {
    data.push({
      id: i + 1,
      name: `Person ${i + 1}`,
      email: `person${i + 1}@example.com`,
      age: 25 + i,
      city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'][i],
      timestamp: new Date().toISOString()
    });
  }
  return data;
};

export default function SyntheticDataGenerator() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [dataPreview, setDataPreview] = useState(false);
  const [generatedData, setGeneratedData] = useState(getInitialSampleData());
  const [rows, setRows] = useState(100);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [dataFormat, setDataFormat] = useState('json');
  const [requestStatus, setRequestStatus] = useState(null);
  const [batchSize, setBatchSize] = useState(1000);
  const [tableSchema, setTableSchema] = useState([
    { name: 'id', type: 'number', include: true },
    { name: 'name', type: 'string', include: true },
    { name: 'email', type: 'string', include: true },
    { name: 'age', type: 'number', include: true },
    { name: 'city', type: 'string', include: true },
    { name: 'timestamp', type: 'datetime', include: true }
  ]);

  const generateData = async () => {
    setLoading(true);
    setRequestStatus('processing');

    try {
      const response = await fetch('http://127.0.0.1:8000/api/bot-chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': Cookies.get('csrftoken') // Include the CSRF token
        },
        body: JSON.stringify({
          prompt,
          rows,
          format: dataFormat,
          batchSize,
          schema: tableSchema.filter(field => field.include)
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedData(data);
        setDataPreview(true);
        setRequestStatus('success');
      } else {
        setRequestStatus('error');
      }
    } catch (error) {
      console.error("Error generating data:", error);
      setRequestStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSchemaChange = (index, field, value) => {
    const newSchema = [...tableSchema];
    newSchema[index][field] = value;
    setTableSchema(newSchema);
  };

  const handleAddField = () => {
    setTableSchema([...tableSchema, { name: '', type: 'string', include: true }]);
  };

  const handleRemoveField = (index) => {
    const newSchema = tableSchema.filter((_, i) => i !== index);
    setTableSchema(newSchema);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-orange-500 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Table className="h-6 w-6" />
            <h1 className="text-xl font-bold">Synthetic Data Generator</h1>
          </div>
          <div className="text-sm">
            API Key: •••••••••••••••••••••{requestStatus === 'success' ? <CheckCircle className="inline ml-2 h-4 w-4 text-green-300" /> : null}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Controls Panel */}
        <div className="w-1/4 bg-white border-r border-gray-200 p-4 flex flex-col">
          <div className="flex flex-col flex-1 overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Data Configuration</h2>

            {/* Basic Settings */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt Description</label>
              <textarea
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                placeholder="Describe the data you want to generate..."
                rows="3"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                  value={rows}
                  onChange={(e) => setRows(Math.min(15000, Math.max(1, parseInt(e.target.value) || 0)))}
                  min="1"
                  max="15000"
                />
                <span className="text-sm text-gray-500 flex items-center">/15000</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">Advanced Settings</label>
                <button
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="text-orange-500 hover:text-orange-600 text-sm font-medium"
                >
                  {isAdvancedOpen ? 'Hide' : 'Show'}
                </button>
              </div>

              {isAdvancedOpen && (
                <div className="mt-3 space-y-3 bg-gray-50 p-3 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Format</label>
                    <select
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      value={dataFormat}
                      onChange={(e) => setDataFormat(e.target.value)}
                    >
                      <option value="json">JSON</option>
                      <option value="csv">CSV</option>
                      <option value="sql">SQL Insert Statements</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Size (for large datasets)</label>
                    <input
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                      value={batchSize}
                      onChange={(e) => setBatchSize(Math.min(5000, Math.max(100, parseInt(e.target.value) || 0)))}
                      min="100"
                      max="5000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Schema</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {tableSchema.map((field, index) => (
                        <div key={index} className="flex items-center space-x-2 bg-white p-2 rounded border border-gray-200">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                            checked={field.include}
                            onChange={(e) => handleSchemaChange(index, 'include', e.target.checked)}
                          />
                          <input
                            type="text"
                            className="w-1/3 p-1 text-sm border border-gray-300 rounded"
                            value={field.name}
                            onChange={(e) => handleSchemaChange(index, 'name', e.target.value)}
                            placeholder="Field name"
                          />
                          <select
                            className="w-1/3 p-1 text-sm border border-gray-300 rounded"
                            value={field.type}
                            onChange={(e) => handleSchemaChange(index, 'type', e.target.value)}
                          >
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="datetime">Date/Time</option>
                          </select>
                          <button
                            onClick={() => handleRemoveField(index)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleAddField}
                      className="mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
                    >
                      + Add Field
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-4">
              <button
                onClick={generateData}
                disabled={loading}
                className={`w-full flex items-center justify-center py-2 px-4 rounded-md text-white font-medium ${
                  loading ? 'bg-orange-400' : 'bg-orange-500 hover:bg-orange-600'
                } transition-colors duration-150`}
              >
                {loading ? (
                  <>
                    <Loader className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Send className="-ml-1 mr-2 h-4 w-4" />
                    Generate Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Data Generation Status */}
          {requestStatus && (
            <div className="mb-4">
              {requestStatus === 'processing' && (
                <div className="bg-blue-50 border-blue-200 p-4 rounded-md text-blue-800">
                  <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                  <div className="text-blue-600">
                    Processing: Generating {rows} rows of synthetic data...
                  </div>
                </div>
              )}

              {requestStatus === 'success' && (
                <div className="bg-green-50 border-green-200 p-4 rounded-md text-green-800">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="text-green-600">
                    Success: Successfully generated {generatedData.length} rows of data.
                  </div>
                </div>
              )}

              {requestStatus === 'error' && (
                <div className="bg-red-50 border-red-200 p-4 rounded-md text-red-800">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <div className="text-red-600">
                    Error: Failed to generate data. Please try again.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Visualization */}
          {!dataPreview && (
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4 flex-1">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Data Usage</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sampleChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="rows"
                      stroke="#f97316"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800">Total Datasets</h3>
                  <p className="text-2xl font-bold text-orange-600">24</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800">API Requests</h3>
                  <p className="text-2xl font-bold text-orange-600">156</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-orange-800">Total Rows</h3>
                  <p className="text-2xl font-bold text-orange-600">45,231</p>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {dataPreview && (
            <div className="bg-white p-4 rounded-lg shadow-sm flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Data Preview</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setDataPreview(false)}
                    className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" /> Close
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center"
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </button>
                  <button
                    className="px-2 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(generatedData[0] || {}).map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {generatedData.map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((cell, cellIndex) => (
                          <td
                            key={cellIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Showing {generatedData.length} of {rows} rows</span>
                <div className="flex items-center">
                  <button className="px-2 py-1 border border-gray-300 rounded-l hover:bg-gray-50">
                    Previous
                  </button>
                  <span className="px-4 py-1 border-t border-b border-gray-300">
                    1
                  </span>
                  <button className="px-2 py-1 border border-gray-300 rounded-r hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Gemini API Synthetic Data Generator
          </div>
          <div className="text-sm text-gray-500">
            Max Rows: 15,000 • Batch Size: {batchSize}
          </div>
        </div>
      </div>
    </div>
  );
}
