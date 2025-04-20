import React, { useState, useEffect } from 'react';
import {
  Download, AlertCircle, FileSpreadsheet, Database, FileJson,
  Code, HardDrive, Split, Brain, Upload, Check, Loader, ChevronDown, ChevronUp,
  X, FileInput, FileOutput, FileArchive, FileCode, FileText, FileBarChart2,
  FileSearch, FileCheck, FileX, FilePlus, FileMinus, FileUp, FileDown, RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ExportImportTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [splitRatio, setSplitRatio] = useState(0.8);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState(null); // 'import' or 'export-format'

  // Handle file drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
    }
  };

  // Handle file selection
  const handleFileSelection = (file) => {
    if (!file) return;

    // Check file type
    const validTypes = [
      'text/csv', 
      'application/json', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(csv|json|xlsx|xls)$/i)) {
      setImportStatus({ 
        type: 'error', 
        message: 'Invalid file type. Please upload a CSV, JSON, or Excel file.' 
      });
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setImportStatus({ 
        type: 'error', 
        message: 'File too large. Maximum size is 10MB.' 
      });
      return;
    }

    setImportFile(file);
    setImportStatus({ 
      type: 'info', 
      message: `${file.name} selected. Click Import to proceed.` 
    });

    // Preview the first few lines
    previewFileContents(file);
  };

  // Preview file contents
  const previewFileContents = (file) => {
    const reader = new FileReader();
    
    if (file.type === 'application/json' || file.name.match(/\.json$/i)) {
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setPreviewData({
            type: 'json',
            content: JSON.stringify(Array.isArray(data) ? data.slice(0, 3) : data, null, 2)
          });
        } catch (error) {
          setPreviewData({
            type: 'error',
            content: 'Could not parse JSON file'
          });
        }
      };
      reader.readAsText(file);
    } else if (file.type === 'text/csv' || file.name.match(/\.csv$/i)) {
      reader.onload = (e) => {
        const lines = e.target.result.split('\n').slice(0, 5).join('\n');
        setPreviewData({
          type: 'csv',
          content: lines
        });
      };
      reader.readAsText(file);
    } else {
      setPreviewData({
        type: 'binary',
        content: 'Preview not available for this file type'
      });
    }
  };

  // Handle file selection via input
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelection(file);
  };

  // Handle the file import
  const handleImport = async () => {
    if (!importFile) return;

    setIsLoading(true);
    setCurrentOperation('import');
    setImportStatus({ type: 'info', message: 'Importing data...' });

    try {
      // Simulate progress for demo
      const simulateProgress = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(simulateProgress);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const formData = new FormData();
      formData.append('file', importFile);

      const response = await fetch('http://127.0.0.1:8000/api/import-data/', {
        method: 'POST',
        body: formData,
      });

      clearInterval(simulateProgress);
      setExportProgress(100);

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
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus({ type: 'error', message: `Import failed: ${error.message}` });
    } finally {
      setIsLoading(false);
      setCurrentOperation(null);
      setExportProgress(0);

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
    setSelectedFormat(format);
    setCurrentOperation(`export-${format}`);
    setExportStatus({ type: 'info', message: `Preparing ${format} export...` });

    try {
      const payload = {
        format,
        data: tableData,
        options,
      };

      // Simulate progress for demo
      const simulateProgress = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(simulateProgress);
            return prev;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch('http://127.0.0.1:8000/api/export-data/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearInterval(simulateProgress);
      setExportProgress(100);

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
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: `Export failed: ${error.message}` });
    } finally {
      setIsLoading(false);
      setCurrentOperation(null);
      setExportProgress(0);
      setTimeout(() => {
        setExportStatus(null);
        setSelectedFormat(null);
      }, 5000);
    }
  };

  // Clear selected file
  const clearFile = () => {
    setImportFile(null);
    setPreviewData(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Start over function
  const handleStartOver = () => {
    setTableData([]);
    setImportFile(null);
    setPreviewData(null);
    setImportStatus(null);
    setExportStatus(null);
    setShowAdvanced(false);
    
    // Clear file input
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Check if a specific operation is loading
  const isOperationLoading = (operation) => {
    return isLoading && currentOperation === operation;
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
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`${bgColor} border rounded-lg p-3 mb-4 flex items-start`}
      >
        <div className={`p-1 rounded-full mr-2 ${status.type === 'success' ? 'bg-green-100' : status.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon size={16} className={`${iconColor} ${isLoading ? 'animate-spin' : ''}`} />
        </div>
        <p className={`${textColor} text-sm`}>{status.message}</p>
        {exportProgress > 0 && (
          <div className="ml-auto w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        )}
      </motion.div>
    );
  };

  // Format icons mapping
  const formatIcons = {
    json: <FileJson size={24} className="text-purple-600" />,
    csv: <FileSpreadsheet size={24} className="text-green-600" />,
    excel: <FileBarChart2 size={24} className="text-blue-600" />,
    sql: <FileText size={24} className="text-indigo-600" />,
    jsonl: <FileCode size={24} className="text-yellow-600" />,
    parquet: <HardDrive size={24} className="text-red-600" />,
    tfrecord: <Brain size={24} className="text-pink-600" />,
    pickle: <FileArchive size={24} className="text-gray-600" />,
    train_test_split: <Split size={24} className="text-teal-600" />,
    bundle: <FileArchive size={24} className="text-orange-600" />,
  };

  return (
    <div className="pb-8">
      <motion.h1 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl font-bold mb-6 text-gray-800"
      >
        Data Import & Export
      </motion.h1>

      {/* Show status messages */}
      <AnimatePresence>
        {importStatus && <StatusMessage status={importStatus} />}
        {exportStatus && <StatusMessage status={exportStatus} />}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Import Section - Always shown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileInput size={20} className="mr-2 text-orange-600" />
              Import Data
            </h2>
            {tableData.length > 0 && (
              <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <FileCheck size={14} className="mr-1" />
                {tableData.length} records loaded
              </div>
            )}
          </div>

          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {importFile ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="bg-orange-100 p-3 rounded-full mb-3">
                  <FileCheck size={24} className="text-orange-600" />
                </div>
                <p className="font-medium text-gray-700 mb-1">{importFile.name}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {Math.round(importFile.size / 1024)} KB • {importFile.type || 'Unknown type'}
                </p>
                
                {previewData && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="w-full bg-gray-50 rounded-md p-3 mb-4 text-left overflow-auto max-h-40"
                  >
                    <pre className="text-xs text-gray-600 font-mono">
                      {previewData.content}
                    </pre>
                    <div className="text-xs text-gray-400 mt-1">
                      {previewData.type === 'error' ? '' : 'Preview of first few lines'}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={clearFile}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                    disabled={isOperationLoading('import')}
                  >
                    <X size={16} className="mr-1" />
                    Change File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isOperationLoading('import') || tableData.length > 0}
                    className={`px-4 py-1.5 ${tableData.length > 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'} text-white rounded-md disabled:bg-orange-300 flex items-center text-sm`}
                  >
                    {isOperationLoading('import') ? (
                      <>
                        <Loader size={16} className="mr-1 animate-spin" />
                        Importing...
                      </>
                    ) : tableData.length > 0 ? (
                      <>
                        <Check size={16} className="mr-1" />
                        Imported
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-1" />
                        Import File
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="bg-orange-100 p-3 rounded-full mb-3">
                  <Upload size={24} className="text-orange-600" />
                </div>
                <p className="font-medium text-gray-700 mb-1">Drag & drop your file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center text-sm shadow-sm">
                  <FileUp size={16} className="mr-2" />
                  <span>Browse Files</span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: CSV, JSON, Excel (.xlsx, .xls) • Max 10MB
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Export Options (shown only when there's data) */}
        {tableData.length > 0 && (
          <>
            {/* Start Over Button */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <button
                onClick={handleStartOver}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm shadow-sm"
                disabled={isLoading}
              >
                <RotateCcw size={16} className="mr-2" />
                Start Over
              </button>
            </motion.div>

            {/* Basic Export Options */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <FileOutput size={20} className="mr-2 text-orange-600" />
                  Export Options
                </h2>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-sm text-orange-600 hover:text-orange-700 flex items-center"
                >
                  {showAdvanced ? (
                    <>
                      <ChevronUp size={16} className="mr-1" />
                      Hide Advanced
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} className="mr-1" />
                      Show Advanced
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['json', 'csv', 'excel', 'sql', 'jsonl'].map((format) => (
                  <motion.div
                    key={format}
                    whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    className={`border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-all ${selectedFormat === format ? 'ring-2 ring-orange-400' : ''}`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="bg-orange-50 p-2 rounded-lg mr-3">
                        {formatIcons[format]}
                      </div>
                      <h3 className="text-md font-medium capitalize">
                        {format === 'jsonl' ? 'JSON Lines' : 
                         format === 'excel' ? 'Excel' : 
                         format.toUpperCase()}
                      </h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-4">
                      {format === 'json' && 'Structured data for web applications'}
                      {format === 'csv' && 'Comma-separated values for spreadsheets'}
                      {format === 'excel' && 'Microsoft Excel spreadsheet format'}
                      {format === 'sql' && 'SQL INSERT statements for databases'}
                      {format === 'jsonl' && 'JSON Lines for machine learning tasks'}
                    </p>
                    <button
                      onClick={() => handleExport(format)}
                      disabled={isLoading}
                      className={`w-full py-2 rounded-md flex justify-center items-center gap-2 text-sm ${
                        isOperationLoading(`export-${format}`) 
                          ? 'bg-orange-300 text-white' 
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {isOperationLoading(`export-${format}`) ? (
                        <Loader size={16} className="animate-spin" />
                      ) : (
                        <Download size={16} />
                      )}
                      <span>
                        {isOperationLoading(`export-${format}`) ? 'Exporting...' : 'Export'}
                      </span>
                    </button>
                  </motion.div>
                ))}

                {/* ML Options Card */}
                <motion.div
                  whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  className="border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-all cursor-pointer"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <div className="flex items-center mb-3">
                    <div className="bg-orange-50 p-2 rounded-lg mr-3">
                      <Brain size={24} className="text-orange-600" />
                    </div>
                    <h3 className="text-md font-medium">Machine Learning</h3>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">
                    Advanced formats for data science and ML workflows
                  </p>
                  <button
                    className={`w-full py-2 rounded-md flex justify-center items-center gap-2 text-sm ${
                      showAdvanced ? 'bg-orange-700 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    {showAdvanced ? 'Hide Options' : 'Show Options'}
                  </button>
                </motion.div>
              </div>
            </motion.div>

            {/* Advanced ML Export Options */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Brain size={20} className="mr-2 text-orange-600" />
                    Machine Learning Export Options
                  </h2>

                  <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <span>Train/Test Split Ratio</span>
                      <span className="text-gray-700 font-medium">
                        {Math.round(splitRatio * 100)}% Train / {Math.round((1 - splitRatio) * 100)}% Test
                      </span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="0.9"
                      step="0.05"
                      value={splitRatio}
                      onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>More training data</span>
                      <span>More testing data</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { format: 'train_test_split', name: 'Train/Test Split', icon: <Split size={24} className="text-teal-600" />, desc: 'CSV files with train/test split' },
                      { format: 'parquet', name: 'Parquet', icon: <HardDrive size={24} className="text-red-600" />, desc: 'Columnar format for big data' },
                      { format: 'tfrecord', name: 'TFRecord', icon: <Brain size={24} className="text-pink-600" />, desc: 'TensorFlow training format' },
                      { format: 'bundle', name: 'Complete Bundle', icon: <FileArchive size={24} className="text-orange-600" />, desc: 'ZIP with multiple formats' },
                      { format: 'pickle', name: 'Python Pickle', icon: <FileArchive size={24} className="text-gray-600" />, desc: 'Serialized Python objects' },
                    ].map(({ format, name, icon, desc }) => (
                      <motion.div
                        key={format}
                        whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                        className={`border border-gray-200 rounded-xl p-5 hover:border-orange-300 transition-all ${selectedFormat === format ? 'ring-2 ring-orange-400' : ''}`}
                      >
                        <div className="flex items-center mb-3">
                          <div className="bg-orange-50 p-2 rounded-lg mr-3">
                            {icon}
                          </div>
                          <h3 className="text-md font-medium">{name}</h3>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">{desc}</p>
                        <button
                          onClick={() => handleExport(format, format === 'train_test_split' || format === 'bundle' ? { splitRatio } : {})}
                          disabled={isLoading}
                          className={`w-full py-2 rounded-md flex justify-center items-center gap-2 text-sm ${
                            isOperationLoading(`export-${format}`) 
                              ? 'bg-orange-300 text-white' 
                              : 'bg-orange-600 hover:bg-orange-700 text-white'
                          }`}
                        >
                          {isOperationLoading(`export-${format}`) ? (
                            <Loader size={16} className="animate-spin" />
                          ) : (
                            <Download size={16} />
                          )}
                          <span>
                            {isOperationLoading(`export-${format}`) ? 'Exporting...' : 'Export'}
                          </span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportImportTab