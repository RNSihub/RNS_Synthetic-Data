import { useState, useEffect } from 'react';
import { Upload, Database, ArrowRight, Download, Table, FileSpreadsheet, RotateCcw, Check } from 'lucide-react';
import axios from 'axios';
import PreviewTab from '../components/PreSam'; // Import the PreviewTab component

export default function SyntheticDataGenerator() {
  const [step, setStep] = useState(1);
  const [inputMethod, setInputMethod] = useState(null);
  const [val, setVal] = useState('');
  const [tableName, setTableName] = useState(null);
  const [sampleFile, setSampleFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [columns, setColumns] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [originalRowCount, setOriginalRowCount] = useState(0);
  const [generatedData, setGeneratedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('generator'); // State to manage active tab

  const MAX_ROWS = 15000;

  const handleSubmit = () => {
    setTableName(val); // Set the table name immediately
  };

  const handleTableNameSelection = async () => {
    setInputMethod('table');
    try {
      await handleTableNameSubmit();
      setStep(2);
    } catch (err) {
      // Handle error if needed
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setInputMethod('file');
    setSampleFile(file);

    if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {

      const formData = new FormData();
      formData.append('file', file);

      try {
        setLoading(true);
        const response = await axios.post('http://127.0.0.1:8000/api/preview-file/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setFilePreview(response.data.preview);
        setColumns(response.data.columns);
        setOriginalRowCount(response.data.row_count);
        setRowCount(response.data.row_count);

        const recResponse = await axios.post('http://127.0.0.1:8000/api/column-recommendations/', {
          columns: response.data.columns,
          sample_data: response.data.preview,
        });

        setRecommendations(recResponse.data.recommendations);
        setLoading(false);
        setStep(2);
      } catch (err) {
        setError('Error processing file. Please try again.');
        setLoading(false);
      }
    } else {
      setError('Please upload a CSV or Excel file.');
    }
  };

  const handleTableNameSubmit = async () => {
    if (!val.trim()) {
      setError('Please enter a table name');
      throw new Error('Missing table name');
    }

    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/api/get-table-columns/', {
        table_name: val.trim()
      });

      setColumns(response.data.columns);
      setRecommendations(response.data.recommendations);
      setLoading(false);
    } catch (err) {
      setError('Error fetching table columns. Please check the table name and try again.');
      setLoading(false);
      throw err; // Important to let handleTableNameSelection know it failed
    }
  };

  const addRecommendedColumn = (recommendation) => {
    if (!columns.some(col => col.name === recommendation.name)) {
      setColumns([...columns, recommendation]);
    }
  };

  const removeColumn = (columnName) => {
    setColumns(columns.filter(col => col.name !== columnName));
  };

  const generateData = async () => {
    if (columns.length === 0) {
      setError('Please add at least one column');
      return;
    }

    if (rowCount <= 0 || rowCount > MAX_ROWS) {
      setError(`Please enter a valid number of rows (1-${MAX_ROWS})`);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://127.0.0.1:8000/api/generate-data/', {
        columns: columns,
        row_count: rowCount,
        input_method: inputMethod,
        table_name: tableName || null,
        original_row_count: originalRowCount || 0,
      });

      setGeneratedData(response.data.generated_data);
      setLoading(false);
      setStep(4);
    } catch (err) {
      setError('Error generating data. Please try again.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setInputMethod(null);
    setTableName('');
    setSampleFile(null);
    setFilePreview(null);
    setColumns([]);
    setRowCount(0);
    setOriginalRowCount(0);
    setGeneratedData(null);
    setError(null);
    setRecommendations([]);
    setActiveTab('generator'); // Reset to generator tab
  };

  const downloadData = (format) => {
    if (!generatedData) return;

    const blob = new Blob([format === 'json' ? JSON.stringify(generatedData, null, 2) : generatedData.map(row => Object.values(row).join(',')).join('\n')], {
      type: format === 'json' ? 'application/json' : 'text/csv',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetic_data.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const updateData = (newData) => {
    setGeneratedData(newData);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gray-800 text-white py-4 px-6 rounded-[15px]">
        <h1 className="text-2xl font-bold">Synthetic Data Generator</h1>
        <p className="text-sm opacity-80">Generate unique synthetic data with Gemini API</p>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {activeTab === 'generator' && (
          <>
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Step {step} of 4</span>
                <span className="text-xs font-medium text-gray-500">{Math.round((step / 4) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="h-full bg-orange-600 rounded-full"
                  style={{ width: `${(step / 4) * 100}%` }}
                ></div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
                <button
                  className="ml-auto text-red-700 hover:text-red-900"
                  onClick={() => setError(null)}
                >
                  &times;
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Choose Your Input Method</h2>
                <p className="text-gray-600 mb-6">Select how you'd like to define your data structure</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className="border rounded-lg p-6 cursor-pointer hover:border-orange-500 transition-all"
                    onClick={handleSubmit}
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-full mr-4">
                        <Database className="text-orange-600" size={24} />
                      </div>
                      <h3 className="text-lg font-medium">Use Table Name</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Enter a database table name to generate synthetic data based on its structure</p>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                        value={val}
                        onChange={(e) => setVal(e.target.value)}
                        placeholder="e.g. customers, orders, etc."
                      />
                    </div>

                    <button
                      className="mt-4 w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableNameSelection();
                      }}
                    >
                      Continue
                    </button>
                  </div>

                  <div className="border rounded-lg p-6 cursor-pointer hover:border-orange-500 transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-full mr-4">
                        <Upload className="text-orange-600" size={24} />
                      </div>
                      <h3 className="text-lg font-medium">Upload Sample File</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">Upload a CSV or Excel file to use as a template for generating synthetic data</p>

                    <label className="block mt-4">
                      <span className="sr-only">Choose file</span>
                      <input
                        type="file"
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-orange-50 file:text-orange-700
                          hover:file:bg-orange-100"
                        accept=".csv,.xls,.xlsx"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Define Data Columns</h2>
                <p className="text-gray-600 mb-6">
                  {inputMethod === 'table'
                    ? `Columns from table "${tableName}"`
                    : 'Columns from your uploaded file'}
                </p>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Current Columns</h3>
                  {columns.length === 0 ? (
                    <p className="text-gray-500 italic">No columns defined yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {columns.map((column, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{column.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{column.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{column.description}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-red-600 hover:text-red-900"
                                  onClick={() => removeColumn(column.name)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {recommendations.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Recommended Additional Columns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{rec.name}</h4>
                            <button
                              className="text-orange-600 hover:text-orange-800 flex items-center text-sm"
                              onClick={() => addRecommendedColumn(rec)}
                            >
                              <span>Add</span>
                              <ArrowRight size={16} className="ml-1" />
                            </button>
                          </div>
                          <p className="text-gray-600 text-sm mb-1">Type: {rec.type}</p>
                          <p className="text-gray-600 text-sm">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Add Custom Column</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Column Name</label>
                      <input
                        type="text"
                        id="custom-column-name"
                        className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. first_name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
                      <select
                        id="custom-column-type"
                        className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="float">Float</option>
                        <option value="boolean">Boolean</option>
                        <option value="date">Date</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone Number</option>
                        <option value="address">Address</option>
                        <option value="name">Name</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        id="custom-column-desc"
                        className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                        placeholder="e.g. Customer's first name"
                      />
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 text-sm bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200"
                    onClick={() => {
                      const name = document.getElementById('custom-column-name').value;
                      const type = document.getElementById('custom-column-type').value;
                      const description = document.getElementById('custom-column-desc').value;

                      if (name) {
                        setColumns([...columns, { name, type, description }]);
                        document.getElementById('custom-column-name').value = '';
                        document.getElementById('custom-column-desc').value = '';
                      }
                    }}
                  >
                    Add Column
                  </button>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    onClick={() => setStep(3)}
                    disabled={columns.length === 0}
                  >
                    Next: Define Row Count
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Set Number of Rows to Generate</h2>

                {inputMethod === 'file' && originalRowCount > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-blue-700">
                      Your sample file contains {originalRowCount} rows. How many rows would you like to generate?
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Rows</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500"
                    value={rowCount}
                    onChange={(e) => setRowCount(parseInt(e.target.value) || 0)}
                    min="1"
                    max={MAX_ROWS}
                  />
                  <p className="mt-2 text-sm text-gray-500">Maximum: {MAX_ROWS} rows (Gemini API limitation)</p>
                </div>

                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium mb-2">Data Generation Settings</h3>

                  <div className="flex items-center mb-3">
                    <div className="flex items-center h-5">
                      <input
                        id="no-duplicates"
                        type="checkbox"
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        defaultChecked
                        disabled
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="no-duplicates" className="font-medium text-gray-700">Ensure No Duplicate Records</label>
                      <p className="text-gray-500">Generated data will be unique across all records</p>
                    </div>
                  </div>

                  <div className="flex items-center mb-3">
                    <div className="flex items-center h-5">
                      <input
                        id="data-cleaning"
                        type="checkbox"
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        defaultChecked
                        disabled
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="data-cleaning" className="font-medium text-gray-700">Perform Data Cleaning</label>
                      <p className="text-gray-500">Clean and format data according to column types</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between mt-8">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    onClick={() => setStep(2)}
                  >
                    Back
                  </button>
                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    onClick={generateData}
                    disabled={rowCount <= 0 || rowCount > MAX_ROWS}
                  >
                    Generate Data
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Generated Data</h2>

                <div className="mb-6 p-4 bg-green-50 rounded-lg flex items-center">
                  <Check className="text-green-500 mr-2" size={20} />
                  <p className="text-green-700">
                    Successfully generated {generatedData?.length || 0} rows of synthetic data
                  </p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">Data Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {columns.map((column, index) => (
                            <th
                              key={index}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {generatedData && generatedData.slice(0, 5).map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {columns.map((column, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                              >
                                {String(row[column.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {generatedData && generatedData.length > 5 && (
                      <p className="mt-2 text-sm text-gray-500 text-center">
                        Showing 5 of {generatedData.length} rows
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center"
                    onClick={() => downloadData('json')}
                  >
                    <Download className="mr-2" size={18} />
                    Download JSON
                  </button>

                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center"
                    onClick={() => downloadData('csv')}
                  >
                    <FileSpreadsheet className="mr-2" size={18} />
                    Download CSV
                  </button>

                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    onClick={resetForm}
                  >
                    <RotateCcw className="mr-2" size={18} />
                    Start Over
                  </button>

                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center"
                    onClick={() => setActiveTab('preview')}
                  >
                    <Table className="mr-2" size={18} />
                    Show Full Data Preview
                  </button>
                </div>
              </div>
            )}

            {loading && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Processing</h3>
                    <p className="text-gray-500 text-center">
                      {step === 1 ? 'Analyzing your table structure...' :
                       step === 2 ? 'Processing columns and recommendations...' :
                       step === 3 ? 'Generating unique synthetic data...' :
                       'Please wait...'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'preview' && (
          <PreviewTab generatedData={generatedData} setActiveTab={setActiveTab} updateData={updateData} />
        )}
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-sm text-gray-500">
        Synthetic Data Generator powered by Gemini API • No real data is used or stored
      </footer>
    </div>
  );
}
