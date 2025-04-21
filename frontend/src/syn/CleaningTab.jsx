import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw, PlusCircle, AlertCircle, Check, Loader,
  FileCheck, Download, Upload, AlertTriangle, BarChart2,
  Edit2, Trash2, Save, X
} from 'lucide-react';
import ExportImportTab from './ExportTab';

const CleaningTab = ({ generatedData }) => {
  const [data, setData] = useState(generatedData || []);
  const [importedFile, setImportedFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataReport, setDataReport] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('export'); // State to manage active tab

  // Function to get CSRF token from cookies
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const csrftoken = getCookie('csrftoken');

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
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
      alert('Invalid file type. Please upload a CSV, JSON, or Excel file.');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setImportedFile(file);

    // Preview the file
    previewFileContents(file);
  };

  // Preview file contents
  const previewFileContents = (file) => {
    const reader = new FileReader();

    if (file.type === 'application/json' || file.name.match(/\.json$/i)) {
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setPreviewData(Array.isArray(data) ? data.slice(0, 20) : data);
          if (Array.isArray(data)) {
            setData(data);
            analyzeData(data);
          }
          setShowPreview(true);
        } catch (error) {
          alert('Could not parse JSON file: ' + error.message);
        }
      };
      reader.readAsText(file);
    } else if (file.type === 'text/csv' || file.name.match(/\.csv$/i)) {
      reader.onload = (e) => {
        try {
          const lines = e.target.result.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          const parsedData = [];
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            const values = lines[i].split(',').map(v => v.trim());
            const row = {};

            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });

            parsedData.push(row);
          }

          setPreviewData(parsedData.slice(0, 20));
          setData(parsedData);
          analyzeData(parsedData);
          setShowPreview(true);
        } catch (error) {
          alert('Could not parse CSV file: ' + error.message);
        }
      };
      reader.readAsText(file);
    } else {
      alert('This file type requires server-side processing. Please click "Upload" to process it.');
    }
  };

  // Upload file to server
  const handleUpload = async () => {
    if (!importedFile) return;

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', importedFile);

      const response = await fetch('http://127.0.0.1:8000/api/import-data-clean/', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRFToken': csrftoken,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        setData(result.data);
        analyzeData(result.data);
        setShowPreview(true);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert(`Import failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze data for quality issues
  const analyzeData = (data) => {
    if (!data || !data.length) return;

    let totalMissingValues = 0;
    let totalInvalidValues = 0;
    let rowsWithIssues = 0;
    const columns = Object.keys(data[0]);
    const columnStats = {};

    // Initialize stats for each column
    columns.forEach(column => {
      columnStats[column] = {
        missing: 0,
        invalid: 0,
        validationRules: detectValidationRules(data, column)
      };
    });

    // Analyze each row
    data.forEach(row => {
      let rowHasIssue = false;

      columns.forEach(column => {
        const value = row[column];

        // Check for missing values
        if (value === null || value === undefined || value === '') {
          columnStats[column].missing++;
          totalMissingValues++;
          rowHasIssue = true;
        }

        // Check for invalid values based on detected rules
        else if (!validateValue(value, columnStats[column].validationRules)) {
          columnStats[column].invalid++;
          totalInvalidValues++;
          rowHasIssue = true;
        }
      });

      if (rowHasIssue) rowsWithIssues++;
    });

    setDataReport({
      totalRows: data.length,
      totalColumns: columns.length,
      totalMissingValues,
      totalInvalidValues,
      rowsWithIssues,
      columnStats,
      completeness: Math.round((1 - totalMissingValues / (data.length * columns.length)) * 100),
      accuracy: Math.round((1 - totalInvalidValues / (data.length * columns.length)) * 100)
    });
  };

  // Detect validation rules for a column
  const detectValidationRules = (data, column) => {
    const values = data.map(row => row[column]).filter(val => val !== null && val !== undefined && val !== '');
    const sampleSize = Math.min(values.length, 100);
    const samples = values.slice(0, sampleSize);

    const rules = {
      type: 'string',
      isNumeric: false,
      isDate: false,
      isEmail: false,
      isPhone: false,
      min: null,
      max: null,
      allowedValues: null
    };

    // Check if values are numeric
    const numericCount = samples.filter(val => !isNaN(val) && !isNaN(parseFloat(val))).length;
    if (numericCount / sampleSize > 0.8) {
      rules.type = 'number';
      rules.isNumeric = true;
      rules.min = Math.min(...samples.map(val => parseFloat(val)));
      rules.max = Math.max(...samples.map(val => parseFloat(val)));
    }

    // Check if values are dates
    const dateRegex = /^\d{1,4}[-./]\d{1,2}[-./]\d{1,4}$/;
    const dateCount = samples.filter(val => dateRegex.test(String(val))).length;
    if (dateCount / sampleSize > 0.8) {
      rules.type = 'date';
      rules.isDate = true;
    }

    // Check if values are emails
    const emailRegex = /\S+@\S+\.\S+/;
    const emailCount = samples.filter(val => emailRegex.test(String(val))).length;
    if (emailCount / sampleSize > 0.8) {
      rules.type = 'email';
      rules.isEmail = true;
    }

    // Check if values are phone numbers
    const phoneRegex = /^[\d\s\-+()]{7,20}$/;
    const phoneCount = samples.filter(val => phoneRegex.test(String(val))).length;
    if (phoneCount / sampleSize > 0.8) {
      rules.type = 'phone';
      rules.isPhone = true;
    }

    // Check if column has a limited set of values (enum)
    const uniqueValues = [...new Set(samples)];
    if (uniqueValues.length <= 10 && uniqueValues.length / sampleSize < 0.5) {
      rules.allowedValues = uniqueValues;
    }

    return rules;
  };

  // Validate a value based on rules
  const validateValue = (value, rules) => {
    if (rules.isNumeric && (isNaN(value) || isNaN(parseFloat(value)))) {
      return false;
    }

    if (rules.isDate) {
      const dateRegex = /^\d{1,4}[-./]\d{1,2}[-./]\d{1,4}$/;
      if (!dateRegex.test(String(value))) return false;
    }

    if (rules.isEmail) {
      const emailRegex = /\S+@\S+\.\S+/;
      if (!emailRegex.test(String(value))) return false;
    }

    if (rules.isPhone) {
      const phoneRegex = /^[\d\s\-+()]{7,20}$/;
      if (!phoneRegex.test(String(value))) return false;
    }

    if (rules.allowedValues && !rules.allowedValues.includes(value)) {
      return false;
    }

    return true;
  };

  // Process data using Gemini API
  const processData = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/process-data-clean/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({
          data,
          report: dataReport
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      const result = await response.json();
      clearInterval(progressInterval);
      setProcessingProgress(100);

      if (result.processed_data) {
        const processedData = result.processed_data;
        setData(processedData);
        analyzeData(processedData);

        setTimeout(() => {
          setProcessingProgress(0);
          setIsProcessing(false);
        }, 1000);
      } else {
        throw new Error('Invalid processed data format');
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Processing failed: ${error.message}`);
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Handle cell editing
  const startEditing = (rowIndex, columnName, value) => {
    setEditingCell({ rowIndex, columnName });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingCell) return;

    const newData = [...data];
    newData[editingCell.rowIndex][editingCell.columnName] = editValue;

    setData(newData);
    setEditingCell(null);
    analyzeData(newData);
  };

  const cancelEdit = () => {
    setEditingCell(null);
  };

  // Add a new row
  const addRow = () => {
    if (!data.length) return;

    const newRow = {};
    Object.keys(data[0]).forEach(key => {
      newRow[key] = '';
    });

    const newData = [...data, newRow];
    setData(newData);
    analyzeData(newData);
  };

  // Delete a row
  const deleteRow = (rowIndex) => {
    const newData = data.filter((_, i) => i !== rowIndex);
    setData(newData);
    analyzeData(newData);
  };

  // Move to export tab
  const moveToExport = () => {
    setActiveTab('export');
  };

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Data Cleaning & Quality Enhancement</h1>

      {!showPreview && !data.length ? (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <Upload size={20} className="mr-2 text-orange-600" />
              Import Data for Cleaning
            </h2>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${dragActive ? 'border-orange-400 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {importedFile ? (
              <div className="flex flex-col items-center">
                <div className="bg-orange-100 p-3 rounded-full mb-3">
                  <FileCheck size={24} className="text-orange-600" />
                </div>
                <p className="font-medium text-gray-700 mb-1">{importedFile.name}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {Math.round(importedFile.size / 1024)} KB • {importedFile.type || 'Unknown type'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setImportedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                  >
                    Change File
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md flex items-center text-sm"
                  >
                    {isLoading ? (
                      <>
                        <Loader size={16} className="mr-1 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={16} className="mr-1" />
                        Upload File
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-orange-100 p-3 rounded-full mb-3">
                  <Upload size={24} className="text-orange-600" />
                </div>
                <p className="font-medium text-gray-700 mb-1">Drag & drop your data file here</p>
                <p className="text-sm text-gray-500 mb-4">or</p>
                <label className="cursor-pointer px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center text-sm shadow-sm">
                  <span>Browse Files</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv,.json,.xlsx,.xls"
                    onChange={(e) => handleFileSelection(e.target.files[0])}
                  />
                </label>
                <p className="text-xs text-gray-400 mt-4">
                  Supported formats: CSV, JSON, Excel (.xlsx, .xls) • Max 10MB
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Data Quality Report */}
          {dataReport && (
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                  <BarChart2 size={20} className="mr-2 text-orange-600" />
                  Data Quality Report
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="px-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs flex items-center">
                    {dataReport.totalRows} rows
                  </div>
                  <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs flex items-center">
                    {dataReport.totalColumns} columns
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Completeness</div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">{dataReport.completeness}%</div>
                    <div className="text-xs text-gray-500">{dataReport.totalMissingValues} missing values</div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-green-500 rounded-full" style={{width: `${dataReport.completeness}%`}}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Accuracy</div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">{dataReport.accuracy}%</div>
                    <div className="text-xs text-gray-500">{dataReport.totalInvalidValues} invalid values</div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{width: `${dataReport.accuracy}%`}}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Records with Issues</div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.round((dataReport.rowsWithIssues / dataReport.totalRows) * 100)}%
                    </div>
                    <div className="text-xs text-gray-500">{dataReport.rowsWithIssues} rows</div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-yellow-500 rounded-full"
                      style={{width: `${(dataReport.rowsWithIssues / dataReport.totalRows) * 100}%`}}></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Overall Quality</div>
                  <div className="flex items-end justify-between">
                    <div className="text-2xl font-bold text-gray-800">
                      {Math.round((dataReport.completeness + dataReport.accuracy) / 2)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {dataReport.totalMissingValues + dataReport.totalInvalidValues} issues
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                    <div className="h-full bg-orange-500 rounded-full"
                      style={{width: `${(dataReport.completeness + dataReport.accuracy) / 2}%`}}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Column Issues</h3>
                  <div className="flex items-center space-x-3">
                    {Object.entries(dataReport.columnStats)
                      .filter(([_, stats]) => stats.missing > 0 || stats.invalid > 0)
                      .slice(0, 3)
                      .map(([column, stats]) => (
                        <div key={column} className="px-2 py-1 text-xs rounded-full flex items-center gap-1 bg-gray-100">
                          <span className="font-medium">{column}:</span>
                          {stats.missing > 0 && (
                            <span className="text-orange-600">{stats.missing} missing</span>
                          )}
                          {stats.missing > 0 && stats.invalid > 0 && <span>,</span>}
                          {stats.invalid > 0 && (
                            <span className="text-red-600">{stats.invalid} invalid</span>
                          )}
                        </div>
                      ))}
                    {Object.entries(dataReport.columnStats).filter(([_, stats]) => stats.missing > 0 || stats.invalid > 0).length > 3 && (
                      <div className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        +{Object.entries(dataReport.columnStats).filter(([_, stats]) => stats.missing > 0 || stats.invalid > 0).length - 3} more
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={processData}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md flex items-center text-sm shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Processing... {processingProgress}%
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="mr-2" />
                      Process & Clean Data
                    </>
                  )}
                </button>
              </div>

              {/* Processing progress bar */}
              {isProcessing && (
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-800">Edit Data</h2>
                <p className="text-sm text-gray-500 mt-1">Fix missing or incorrect values manually</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={addRow}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center text-sm"
                >
                  <PlusCircle size={14} className="mr-1" />
                  Add Row
                </button>
                <button
                  onClick={activeTab === 'export' && (
                    <ExportImportTab generatedData={generatedData} setActiveTab={setActiveTab} />
                  )}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md flex items-center text-sm"
                >
                  <Download size={14} className="mr-1" />
                  Export Data
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {data.length > 0 && Object.keys(data[0]).map((key) => (
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
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.entries(row).map(([columnName, value]) => {
                        // Check if this cell has an issue
                        const hasIssue = dataReport && (
                          (value === '' && dataReport.columnStats[columnName]?.missing > 0) ||
                          (value !== '' && !validateValue(value, dataReport.columnStats[columnName]?.validationRules || {}))
                        );

                        return (
                          <td key={columnName} className={`px-6 py-4 whitespace-nowrap text-sm ${hasIssue ? 'bg-red-50' : ''}`}>
                            {editingCell && editingCell.rowIndex === rowIndex && editingCell.columnName === columnName ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="text"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="border border-gray-300 rounded px-2 py-1 w-full"
                                  autoFocus
                                />
                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                  <Save size={14} />
                                </button>
                                <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                                  <X size={14} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <span className={`${hasIssue ? 'text-red-600' : 'text-gray-700'}`}>
                                  {value === '' ? <span className="italic text-gray-400">empty</span> : value}
                                </span>
                                {hasIssue && (
                                  <AlertCircle size={14} className="text-red-500 ml-2" />
                                )}
                                <button
                                  onClick={() => startEditing(rowIndex, columnName, value)}
                                  className="ml-2 opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700"
                                >
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleaningTab;
