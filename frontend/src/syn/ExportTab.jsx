import React, { useState } from 'react';
import {
  Download, AlertCircle, FileSpreadsheet, Database, FileJson,
  Code, HardDrive, Split, Brain, Upload, Check, Loader
} from 'lucide-react';

const ExportImportTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isImportActive, setIsImportActive] = useState(true); // New state variable

  // Handle file selection for import
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStatus({ type: 'info', message: `${file.name} selected. Click Import to proceed.` });
    }
  };

  // Handle the file import
  const handleImport = async () => {
    if (!importFile) return;

    setIsLoading(true);
    setImportStatus({ type: 'info', message: 'Importing data...' });

    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('http://127.0.0.1:8000/api/import-data/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setTableData(result.data);
        setImportStatus({
          type: 'success',
          message: `Successfully imported ${result.data.length} records!`,
        });
        setIsImportActive(false); // Disable import section
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ type: 'error', message: `Import failed: ${error.message}` });
    } finally {
      setIsLoading(false);
      setImportFile(null);

      // Clear file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';

      // Clear status after 5 seconds
      setTimeout(() => {
        setImportStatus(null);
      }, 5000);
    }
  };

  // Handle the export functionality
  const handleExport = async (format, options = {}) => {
    if (!tableData.length) {
      setExportStatus({ type: 'error', message: 'No data to export. Please import data first.' });
      setTimeout(() => setExportStatus(null), 5000);
      return;
    }

    setIsLoading(true);
    setExportStatus({ type: 'info', message: `Preparing ${format} export...` });

    try {
      const payload = {
        format,
        data: tableData,
        options,
      };

      const response = await fetch('http://127.0.0.1:8000/api/export-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      let filename = 'processed_data';
      switch (format) {
        case 'json': filename += '.json'; break;
        case 'csv': filename += '.csv'; break;
        case 'excel': filename += '.xlsx'; break;
        case 'sql': filename += '.sql'; break;
        case 'jsonl': filename += '.jsonl'; break;
        case 'parquet': filename += '.parquet'; break;
        case 'tfrecord': filename += '.tfrecord'; break;
        case 'pickle': filename += '.pkl'; break;
        case 'train_test_split': filename += '_train_test_split.zip'; break;
        case 'bundle': filename += '_bundle.zip'; break;
        default: filename += '.txt';
      }

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({ type: 'success', message: `${format} export completed successfully!` });
      setIsImportActive(true); // Enable import section
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsLoading(false);

      setTimeout(() => {
        setExportStatus(null);
      }, 5000);
    }
  };

  // Render status message
  const StatusMessage = ({ status }) => {
    if (!status) return null;

    const bgColor = status.type === 'success' ? 'bg-green-50 border-green-200' :
                    status.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200';

    const textColor = status.type === 'success' ? 'text-green-700' :
                      status.type === 'error' ? 'text-red-700' :
                      'text-blue-700';

    const iconColor = status.type === 'success' ? 'text-green-600' :
                      status.type === 'error' ? 'text-red-600' :
                      'text-blue-600';

    const Icon = status.type === 'success' ? Check :
                 status.type === 'error' ? AlertCircle :
                 isLoading ? Loader : AlertCircle;

    return (
      <div className={`${bgColor} border rounded-lg p-3 mb-4 flex items-start`}>
        <div className={`p-1 rounded-full mr-2 ${status.type === 'success' ? 'bg-green-100' : status.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon size={16} className={`${iconColor} ${isLoading ? 'animate-spin' : ''}`} />
        </div>
        <p className={`${textColor} text-sm`}>{status.message}</p>
      </div>
    );
  };

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold mb-6">Data Import & Export</h1>

      {/* Show status messages */}
      {importStatus && <StatusMessage status={importStatus} />}
      {exportStatus && <StatusMessage status={exportStatus} />}

      <div className="space-y-6">
        {/* Import Section */}
        <div className={`bg-white rounded-lg shadow-md p-6 ${isImportActive ? '' : 'opacity-50 pointer-events-none'}`}>
          <h2 className="text-lg font-semibold mb-4">Import Data</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <label className="cursor-pointer px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-md hover:bg-orange-50 flex items-center">
              <Upload size={18} className="mr-2" />
              <span>Select File</span>
              <input
                type="file"
                className="hidden"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading || !isImportActive}
              />
            </label>

            {importFile && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-sm">{importFile.name}</span>
                <button
                  onClick={handleImport}
                  disabled={isLoading || !isImportActive}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-orange-300 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="mr-2 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} className="mr-2" />
                      <span>Import File</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p>Supported formats: CSV, JSON, Excel (.xlsx, .xls)</p>
            <p>Data will be imported and available for export in various formats.</p>
          </div>
        </div>

        {/* Export Options (shown only after import) */}
        {tableData.length > 0 && (
          <>
            {/* Basic Export Options */}
            <div className={`bg-white rounded-lg shadow-md p-6 ${!isImportActive ? '' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-lg font-semibold mb-4">Basic Export Options</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <FileJson size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">JSON Format</h3>
                  </div>
                  <p className="text-gray-500 mb-4">Export as JSON for JavaScript applications.</p>
                  <button
                    onClick={() => handleExport('json')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                    disabled={isLoading || isImportActive}
                  >
                    {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>{isLoading ? 'Exporting...' : 'Export as JSON'}</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <FileSpreadsheet size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">CSV Format</h3>
                  </div>
                  <p className="text-gray-500 mb-4">Export as CSV for spreadsheets.</p>
                  <button
                    onClick={() => handleExport('csv')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                    disabled={isLoading || isImportActive}
                  >
                    {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>{isLoading ? 'Exporting...' : 'Export as CSV'}</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <FileSpreadsheet size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">Excel Format</h3>
                  </div>
                  <p className="text-gray-500 mb-4">Export as Excel (.xlsx).</p>
                  <button
                    onClick={() => handleExport('excel')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                    disabled={isLoading || isImportActive}
                  >
                    {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>{isLoading ? 'Exporting...' : 'Export as Excel'}</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <Database size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">SQL Format</h3>
                  </div>
                  <p className="text-gray-500 mb-4">Export as SQL INSERT statements.</p>
                  <button
                    onClick={() => handleExport('sql')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                    disabled={isLoading || isImportActive}
                  >
                    {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>{isLoading ? 'Exporting...' : 'Export as SQL'}</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <Code size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">JSONL Format</h3>
                  </div>
                  <p className="text-gray-500 mb-4">JSON Lines for NLP tasks.</p>
                  <button
                    onClick={() => handleExport('jsonl')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                    disabled={isLoading || isImportActive}
                  >
                    {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                    <span>{isLoading ? 'Exporting...' : 'Export as JSONL'}</span>
                  </button>
                </div>

                <div
                  className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <Brain size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-lg font-medium">ML Options</h3>
                  </div>
                  <p className="text-gray-500 mb-4">Advanced formats for ML.</p>
                  <button
                    className={`px-4 py-2 ${showAdvanced ? 'bg-orange-700' : 'bg-orange-600'} text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2`}
                  >
                    {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
                  </button>
                </div>
              </div>
            </div>

            {/* Advanced ML Export Options */}
            {showAdvanced && (
              <div className={`bg-white rounded-lg shadow-md p-6 ${!isImportActive ? '' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-lg font-semibold mb-4">Machine Learning Export Options</h2>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Train/Test Split Ratio</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0.5"
                      max="0.9"
                      step="0.05"
                      value={splitRatio}
                      onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                      className="w-full accent-orange-600"
                      disabled={isImportActive}
                    />
                    <span className="text-gray-700 font-medium">{Math.round(splitRatio * 100)}% / {Math.round((1 - splitRatio) * 100)}%</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Training data / Testing data</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <Split size={24} className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium">Train/Test Split</h3>
                    </div>
                    <p className="text-gray-500 mb-4">Export CSV files with train/test split.</p>
                    <button
                      onClick={() => handleExport('train_test_split', { splitRatio })}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                      disabled={isLoading || isImportActive}
                    >
                      {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isLoading ? 'Exporting...' : 'Export Split CSV'}</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <HardDrive size={24} className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium">Parquet Format</h3>
                    </div>
                    <p className="text-gray-500 mb-4">Columnar format for big data.</p>
                    <button
                      onClick={() => handleExport('parquet')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                      disabled={isLoading || isImportActive}
                    >
                      {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isLoading ? 'Exporting...' : 'Export as Parquet'}</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <Brain size={24} className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium">TensorFlow Format</h3>
                    </div>
                    <p className="text-gray-500 mb-4">TFRecord for TensorFlow training.</p>
                    <button
                      onClick={() => handleExport('tfrecord')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                      disabled={isLoading || isImportActive}
                    >
                      {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isLoading ? 'Exporting...' : 'Export as TFRecord'}</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <Download size={24} className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium">Complete Dataset Bundle</h3>
                    </div>
                    <p className="text-gray-500 mb-4">ZIP with multiple formats.</p>
                    <button
                      onClick={() => handleExport('bundle', { splitRatio })}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                      disabled={isLoading || isImportActive}
                    >
                      {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isLoading ? 'Exporting...' : 'Export Complete Bundle'}</span>
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 hover:shadow-md transition-all">
                    <div className="flex items-center mb-4">
                      <div className="bg-orange-100 p-3 rounded-lg mr-4">
                        <Code size={24} className="text-orange-600" />
                      </div>
                      <h3 className="text-lg font-medium">Python Pickle (.pkl)</h3>
                    </div>
                    <p className="text-gray-500 mb-4">Python format for Pandas.</p>
                    <button
                      onClick={() => handleExport('pickle')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 w-full flex justify-center items-center gap-2 disabled:bg-orange-300"
                      disabled={isLoading || isImportActive}
                    >
                      {isLoading ? <Loader size={18} className="animate-spin" /> : <Download size={18} />}
                      <span>{isLoading ? 'Exporting...' : 'Export as Pickle'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExportImportTab;
