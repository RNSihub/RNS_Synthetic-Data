import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, X, FileText, Download, BarChart2, FileSpreadsheet,
  List, Database, ArrowRight, FileCheck, Loader, Filter, PieChart, Eye, Clipboard,
  Share2, Mail, Calendar, ChevronDown, ChevronUp, Search, Trash2, Plus, Save } from 'lucide-react';

const ValidationTab = ({ setActiveTab }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileInput, setFileInput] = useState(null);
  const [processedData, setProcessedData] = useState([]);
  const [dataStats, setDataStats] = useState({
    totalRecords: 0,
    validRecords: 0,
    warnings: 0,
    errors: 0,
    duplicates: 0,
    missingFields: 0
  });
  const [showAnimation, setShowAnimation] = useState(false);
  const [activeSection, setActiveSection] = useState('validation');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [savedReports, setSavedReports] = useState([]);

  // Load saved reports from localStorage on mount
  useEffect(() => {
    const reports = JSON.parse(localStorage.getItem('savedReports') || '[]');
    setSavedReports(reports);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileInput(file);
      setIsProcessing(true);
      setShowAnimation(true);

      setTimeout(() => {
        setIsProcessing(false);
        setShowAnimation(false);
        processFile(file);
      }, 2000);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let data = [];
        if (file.type === 'application/json') {
          data = JSON.parse(event.target.result);
        } else if (file.type === 'text/csv') {
          data = parseCSV(event.target.result);
        }
        setProcessedData(data);
        analyzeData(data);
      } catch (error) {
        console.error('Error processing file:', error);
        setProcessedData([]);
        setDataStats({
          totalRecords: 0,
          validRecords: 0,
          warnings: 0,
          errors: 0,
          duplicates: 0,
          missingFields: 0
        });
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (csvText) => {
    const rows = csvText.split('\n').filter(row => row.trim() !== '');
    const headers = rows[0].split(',').map(header => header.trim());
    return rows.slice(1).map(row => {
      const values = row.split(',').map(value => value.trim());
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      return obj;
    });
  };

  const analyzeData = (data) => {
    if (!data || data.length === 0) {
      setDataStats({
        totalRecords: 0,
        validRecords: 0,
        warnings: 0,
        errors: 0,
        duplicates: 0,
        missingFields: 0
      });
      return;
    }

    let duplicates = 0;
    let missingFields = 0;
    let errors = 0;
    let warnings = 0;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    const seen = new Set();

    data.forEach(item => {
      // Check for duplicates based on email
      if (item.email && seen.has(item.email)) {
        duplicates++;
        errors++;
      } else if (item.email) {
        seen.add(item.email);
      }

      // Check for missing fields
      if (!item.name || !item.email || !item.phone) {
        missingFields++;
        errors++;
      }

      // Validate email format
      if (item.email && !emailRegex.test(item.email)) {
        warnings++;
      }

      // Validate phone format
      if (item.phone && !phoneRegex.test(item.phone)) {
        warnings++;
      }
    });

    setDataStats({
      totalRecords: data.length,
      validRecords: data.length - errors,
      warnings,
      errors,
      duplicates,
      missingFields
    });
  };

  const downloadReport = (format) => {
    if (!processedData.length) return;

    let content;
    let mimeType;
    let extension;

    switch (format) {
      case 'csv':
        content = convertToCSV(processedData);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(processedData, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      default:
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const fileName = `data-validation-report.${extension}`;
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);

    const reportElement = document.getElementById(`report-${format}`);
    if (reportElement) {
      reportElement.classList.add('scale-105');
      setTimeout(() => {
        reportElement.classList.remove('scale-105');
      }, 300);
    }
  };

  const convertToCSV = (data) => {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(obj => headers.map(header => `"${obj[header] || ''}"`).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const saveReport = () => {
    if (!processedData.length) return;

    const now = new Date();
    const newReport = {
      id: Date.now(),
      name: `Data Report ${now.toISOString().split('T')[0]}`,
      date: now.toISOString().split('T')[0],
      type: 'CSV',
      data: processedData
    };

    const updatedReports = [...savedReports, newReport];
    setSavedReports(updatedReports);
    localStorage.setItem('savedReports', JSON.stringify(updatedReports));
  };

  const filteredData = processedData.filter(item =>
    (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
    (item.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '')
  );

  const StatusIndicator = ({ status }) => {
    switch (status) {
      case 'valid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" /> Valid
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle size={12} className="mr-1" /> Warning
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X size={12} className="mr-1" /> Error
          </span>
        );
      default:
        return null;
    }
  };

  const getRecordStatus = (item) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?[\d\s-]{10,}$/;

    if (!item.name || !item.email || !item.phone) return 'error';
    if (!emailRegex.test(item.email) || !phoneRegex.test(item.phone)) return 'warning';
    return 'valid';
  };

  return (
    <div className="max-w-6xl mx-auto bg-white">
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'validation' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('validation')}
        >
          Validation
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'data' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('data')}
        >
          Data Explorer
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'reports' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('reports')}
        >
          Reports
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeSection === 'history' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          onClick={() => setActiveSection('history')}
        >
          Report History
        </button>
      </div>

      {activeSection === 'validation' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Data Validation</h1>
            <div className="flex space-x-2">
              <button
                onClick={saveReport}
                className="flex items-center px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                disabled={!processedData.length}
              >
                <Save size={16} className="mr-1" />
                <span>Save</span>
              </button>
              <button className="flex items-center px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
                <Share2 size={16} className="mr-1" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Upload Data File</h2>
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="w-full md:w-1/2">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-orange-300 rounded-lg cursor-pointer bg-orange-50 hover:bg-orange-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Database className="w-8 h-8 mb-2 text-orange-500" />
                    <p className="mb-2 text-sm text-gray-600">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">CSV or JSON files</p>
                  </div>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".csv,.json" />
                </label>
              </div>

              <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-medium mb-2 text-gray-700">File Processing</h3>
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <Loader className="animate-spin text-orange-500" />
                    <span className="text-gray-600">Processing file...</span>
                  </div>
                ) : fileInput ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FileCheck className="text-green-500 mr-2" />
                      <span className="text-gray-700">{fileInput.name} processed</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Database className="mr-1 w-4 h-4" />
                      <span>{dataStats.totalRecords} records found</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated: {new Date().toLocaleString()}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    No file uploaded yet. Upload a CSV or JSON file to begin validation.
                  </div>
                )}
              </div>
            </div>
          </div>

          {processedData.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-800">Validation Results</h2>
              <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6 ${showAnimation ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'} transition-all duration-500`}>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 col-span-2">
                  <div className="flex items-center">
                    <Database size={20} className="text-orange-500 mr-2" />
                    <span className="font-medium text-orange-700">Total Records</span>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{dataStats.totalRecords}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 col-span-1">
                  <div className="flex items-center">
                    <CheckCircle size={20} className="text-green-500 mr-2" />
                    <span className="font-medium text-green-700">Valid</span>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{dataStats.validRecords}</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 col-span-1">
                  <div className="flex items-center">
                    <AlertCircle size={20} className="text-yellow-500 mr-2" />
                    <span className="font-medium text-yellow-700">Warnings</span>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{dataStats.warnings}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 col-span-1">
                  <div className="flex items-center">
                    <X size={20} className="text-red-500 mr-2" />
                    <span className="font-medium text-red-700">Errors</span>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{dataStats.errors}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 col-span-1">
                  <div className="flex items-center">
                    <PieChart size={20} className="text-blue-500 mr-2" />
                    <span className="font-medium text-blue-700">Completeness</span>
                  </div>
                  <p className="text-3xl font-bold mt-2 text-gray-800">{Math.round((dataStats.validRecords / dataStats.totalRecords) * 100) || 0}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium mb-3 text-gray-700">Data Quality Checks</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-gray-700">
                      <CheckCircle size={16} className={`mr-2 ${dataStats.duplicates === 0 ? 'text-green-700' : 'text-yellow-700'}`} />
                      <span>{dataStats.duplicates === 0 ? 'No duplicates found' : `${dataStats.duplicates} duplicate records detected`}</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <CheckCircle size={16} className={`mr-2 ${dataStats.missingFields === 0 ? 'text-green-700' : 'text-yellow-700'}`} />
                      <span>{dataStats.missingFields === 0 ? 'All required fields present' : `${dataStats.missingFields} records with missing fields`}</span>
                    </li>
                    <li className="flex items-center text-gray-700">
                      <CheckCircle size={16} className={`mr-2 ${dataStats.warnings === 0 ? 'text-green-700' : 'text-yellow-700'}`} />
                      <span>{dataStats.warnings === 0 ? 'All email formats valid' : `${dataStats.warnings} invalid email/phone formats`}</span>
                    </li>
                  </ul>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium mb-3 text-gray-700">Data Quality Metrics</h3>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Completeness</span>
                        <span className="text-sm text-gray-600">{Math.round((dataStats.validRecords / dataStats.totalRecords) * 100) || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${(dataStats.validRecords / dataStats.totalRecords) * 100 || 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div 
              className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors"
              onClick={() => downloadReport('csv')}
            >
              <div className="flex items-center">
                <FileSpreadsheet className="text-orange-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">Export to CSV</h3>
                  <p className="text-xs text-gray-500">Download all records as CSV</p>
                </div>
              </div>
              <ArrowRight className="text-orange-500" />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors">
              <div className="flex items-center">
                <BarChart2 className="text-orange-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">Generate Report</h3>
                  <p className="text-xs text-gray-500">Create validation report</p>
                </div>
              </div>
              <ArrowRight className="text-orange-500" />
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-orange-100 transition-colors">
              <div className="flex items-center">
                <Mail className="text-orange-500 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-800">Share Results</h3>
                  <p className="text-xs text-gray-500">Email report to team</p>
                </div>
              </div>
              <ArrowRight className="text-orange-500" />
            </div>
          </div>
        </>
      )}

      {activeSection === 'data' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Data Explorer</h1>
            <div className="flex space-x-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
              <button
                className="flex items-center px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                onClick={() => setFilterOpen(!filterOpen)}
              >
                <Filter size={16} className="mr-1" />
                <span>Filter</span>
                {filterOpen ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
            </div>
          </div>

          {filterOpen && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full p-2 border border-gray-300 rounded-md">
                  <option value="all">All</option>
                  <option value="valid">Valid</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div className="flex items-end">
                <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors">
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-orange-50 text-gray-700">
                    {processedData.length > 0 && Object.keys(processedData[0]).map((header, index) => (
                      <th key={index} className="py-3 px-4 text-left font-medium">{header}</th>
                    ))}
                    <th className="py-3 px-4 text-left font-medium">Status</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 10).map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {Object.values(item).map((value, i) => (
                        <td key={i} className="py-3 px-4 border-t border-gray-200">{value}</td>
                      ))}
                      <td className="py-3 px-4 border-t border-gray-200">
                        <StatusIndicator status={getRecordStatus(item)} />
                      </td>
                      <td className="py-3 px-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800"><Eye size={16} /></button>
                          <button className="p-1 text-gray-600 hover:text-gray-800"><Clipboard size={16} /></button>
                          <button className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(10, filteredData.length)}</span> of <span className="font-medium">{filteredData.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border border-orange-500 rounded-md bg-orange-500 text-white hover:bg-orange-600">Next</button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'reports' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Report Generation</h1>
            <button className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors flex items-center">
              <Plus size={16} className="mr-1" />
              New Custom Report
            </button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Available Report Formats</h2>
            <p className="text-gray-600 mb-6">
              Select a format to download your validated data
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                id="report-csv"
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => downloadReport('csv')}
              >
                <div className="flex items-center mb-3">
                  <FileText size={24} className="text-blue-600 mr-2" />
                  <h3 className="font-medium text-gray-800">CSV Export</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Simple comma-separated values</p>
                <div className="text-xs text-gray-500">Format: .csv</div>
              </div>
              <div
                id="report-json"
                className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => downloadReport('json')}
              >
                <div className="flex items-center mb-3">
                  <FileText size={24} className="text-purple-600 mr-2" />
                  <h3 className="font-medium text-gray-800">JSON Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-2">Structured data in JSON format</p>
                <div className="text-xs text-gray-500">Format: .json</div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeSection === 'history' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Report History</h1>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-orange-50 text-gray-700">
                    <th className="py-3 px-4 text-left font-medium">Report Name</th>
                    <th className="py-3 px-4 text-left font-medium">Date</th>
                    <th className="py-3 px-4 text-left font-medium">Type</th>
                    <th className="py-3 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {savedReports.map((report, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 border-t border-gray-200">{report.name}</td>
                      <td className="py-3 px-4 border-t border-gray-200">{report.date}</td>
                      <td className="py-3 px-4 border-t border-gray-200">{report.type}</td>
                      <td className="py-3 px-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button className="p-1 text-blue-600 hover:text-blue-800"><Eye size={16} /></button>
                          <button className="p-1 text-gray-600 hover:text-gray-800"><Download size={16} /></button>
                          <button className="p-1 text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{savedReports.length}</span> of <span className="font-medium">{savedReports.length}</span> results
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50">Previous</button>
                <button className="px-3 py-1 border border-orange-500 rounded-md bg-orange-500 text-white hover:bg-orange-600">Next</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ValidationTab;