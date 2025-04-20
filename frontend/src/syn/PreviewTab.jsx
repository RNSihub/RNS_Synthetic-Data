import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database, ChevronsDown, ArrowUp, ArrowDown, Search, Copy,
  Info, AlertCircle, BarChart2, ChevronLeft, ChevronRight,
  Upload, FileText, X, Download, Menu, Filter, Settings,
  PieChart, LineChart, BarChart, Maximize2, Globe
} from 'lucide-react';
import { updateData } from './updateData'; // Correct import statement

const PreviewTab = ({ generatedData, setActiveTab }) => {
  // Core state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [copiedCell, setCopiedCell] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, content: '', x: 0, y: 0 });

  // Mobile responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setLocalActiveTab] = useState('table'); // table, stats, import

  // Import related state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('csv');
  const [importError, setImportError] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const fileInputRef = useRef(null);

  // Chart related state
  const [showChartModal, setShowChartModal] = useState(false);
  const [chartColumn, setChartColumn] = useState(null);
  const [chartType, setChartType] = useState('bar'); // bar, line, pie

  // Check for mobile view on mount and resize
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  // Set all columns visible on initial render
  useEffect(() => {
    if (generatedData && generatedData.length > 0) {
      setVisibleColumns(Object.keys(generatedData[0]));
    }
  }, [generatedData]);

  // Infer data types for columns
  const columnTypes = useMemo(() => {
    if (!generatedData || generatedData.length === 0) return {};

    const types = {};
    const firstRow = generatedData[0];

    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      if (typeof value === 'number') types[key] = 'Number';
      else if (typeof value === 'boolean') types[key] = 'Boolean';
      else if (value instanceof Date) types[key] = 'Date';
      else if (!isNaN(Date.parse(value)) && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}|.*T.*Z\$/)) {
        types[key] = 'Date';
      }
      else types[key] = 'String';
    });

    return types;
  }, [generatedData]);

  // Calculate data quality indicators
  const dataQuality = useMemo(() => {
    if (!generatedData || generatedData.length === 0) return {};

    const quality = {};
    const columns = Object.keys(generatedData[0] || {});

    columns.forEach(col => {
      const totalRows = generatedData.length;
      const missingValues = generatedData.filter(row =>
        row[col] === null || row[col] === undefined || row[col] === ''
      ).length;

      quality[col] = {
        missingCount: missingValues,
        missingPercentage: (missingValues / totalRows) * 100,
        status: missingValues > 0 ? (missingValues / totalRows > 0.2 ? 'poor' : 'fair') : 'good'
      };
    });

    return quality;
  }, [generatedData]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!generatedData || generatedData.length === 0) return {};

    const stats = {};
    const columns = Object.keys(generatedData[0] || {});

    columns.forEach(col => {
      // Get non-null values
      const values = generatedData
        .map(row => row[col])
        .filter(val => val !== null && val !== undefined && val !== '');

      // Count of unique values
      const uniqueValues = [...new Set(values)];

      // Frequency count
      const frequency = {};
      values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
      });

      // Sort by frequency
      const sortedFreq = Object.entries(frequency).sort((a, b) => b[1] - a[1]);

      stats[col] = {
        count: values.length,
        unique: uniqueValues.length,
        mostCommon: sortedFreq.slice(0, 5),
      };

      // Add number-specific stats
      if (columnTypes[col] === 'Number') {
        const numericValues = values.map(v => Number(v));
        stats[col].min = Math.min(...numericValues);
        stats[col].max = Math.max(...numericValues);
        stats[col].avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
        stats[col].median = calculateMedian(numericValues);
        stats[col].stdDev = calculateStdDev(numericValues, stats[col].avg);
      }
    });

    return stats;
  }, [generatedData, columnTypes]);

  // Helper function to calculate median
  const calculateMedian = (values) => {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
  };

  // Helper function to calculate standard deviation
  const calculateStdDev = (values, mean) => {
    if (values.length <= 1) return 0;

    const squareDiffs = values.map(value => {
      const diff = value - mean;
      return diff * diff;
    });

    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  };

  // Sort and filter data
  const processedData = useMemo(() => {
    if (!generatedData || !generatedData.length) return [];

    let filteredData = [...generatedData];

    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row =>
        Object.entries(row).some(([key, value]) =>
          visibleColumns.includes(key) &&
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply sorting
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [generatedData, sortConfig, searchTerm, visibleColumns]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(processedData.length / rowsPerPage);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Copy cell content to clipboard
  const copyToClipboard = (content, rowIndex, colIndex) => {
    navigator.clipboard.writeText(content);
    setCopiedCell(`${rowIndex}-${colIndex}`);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  // Handle tooltip display
  const showTooltip = (content, e) => {
    if (String(content).length > 20) {
      setTooltipInfo({
        visible: true,
        content: String(content),
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const hideTooltip = () => {
    setTooltipInfo({ ...tooltipInfo, visible: false });
  };

  // Mini chart generator for numeric columns
  const renderMiniChart = (colName) => {
    if (!generatedData || generatedData.length === 0) return null;
    if (columnTypes[colName] !== 'Number') return null;

    const values = generatedData.map(row => row[colName]).filter(val => val !== null && val !== undefined);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Create 5 bins for the histogram
    const range = max - min;
    const binSize = range / 5;
    const bins = [0, 0, 0, 0, 0];

    values.forEach(val => {
      const binIndex = Math.min(4, Math.floor((val - min) / binSize));
      bins[binIndex]++;
    });

    const maxBinValue = Math.max(...bins);

    return (
      <div className="flex items-end h-8 space-x-1 mt-1 cursor-pointer" onClick={() => openChartModal(colName)}>
        {bins.map((bin, idx) => (
          <div
            key={idx}
            className="bg-indigo-500 rounded-sm hover:bg-indigo-600 transition-colors"
            style={{
              height: `${(bin / maxBinValue) * 100}%`,
              width: '4px'
            }}
          />
        ))}
      </div>
    );
  };

  // Open chart modal for a specific column
  const openChartModal = (colName) => {
    setChartColumn(colName);
    setShowChartModal(true);
  };

  // Import functions
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError('');

    // Check file type
    if (importType === 'csv' && !file.name.endsWith('.csv')) {
      setImportError('Please select a CSV file');
      return;
    }

    if (importType === 'json' && !file.name.endsWith('.json')) {
      setImportError('Please select a JSON file');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let parsedData;

        if (importType === 'csv') {
          // Basic CSV parsing
          const text = event.target.result;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());

          parsedData = lines.slice(1)
            .filter(line => line.trim() !== '')
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
              }, {});
            });
        } else if (importType === 'json') {
          parsedData = JSON.parse(event.target.result);

          // Handle array of objects or object with data property
          if (Array.isArray(parsedData)) {
            // It's already an array of objects
          } else if (parsedData.data && Array.isArray(parsedData.data)) {
            parsedData = parsedData.data;
          } else {
            throw new Error('JSON format not recognized. Please use an array of objects.');
          }
        }

        // Show preview of first 5 rows
        setImportPreview(parsedData.slice(0, 5));

        // Update full data
        if (parsedData.length > 0) {
          updateData(parsedData);
          setShowImportModal(false);
        } else {
          setImportError('No data found in file');
        }

      } catch (error) {
        setImportError(`Error parsing file: ${error.message}`);
      }
    };

    reader.onerror = () => {
      setImportError('Error reading file');
    };

    if (importType === 'csv') {
      reader.readAsText(file);
    } else if (importType === 'json') {
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const exportData = () => {
    let exportContent;
    let fileName;
    let contentType;

    if (importType === 'csv') {
      // Generate CSV content
      const headers = Object.keys(generatedData[0]).join(',');
      const rows = generatedData.map(row =>
        Object.values(row).map(val =>
          typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
        ).join(',')
      ).join('\n');

      exportContent = `${headers}\n${rows}`;
      fileName = 'exported-data.csv';
      contentType = 'text/csv';
    } else {
      // Generate JSON content
      exportContent = JSON.stringify(generatedData, null, 2);
      fileName = 'exported-data.json';
      contentType = 'application/json';
    }

    // Create download link
    const blob = new Blob([exportContent], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import Modal Component
  const ImportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800">Import Data</h3>
          <button
            onClick={() => setShowImportModal(false)}
            className="text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 p-1"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setImportType('csv')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-all ${
                importType === 'csv'
                  ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500 shadow-sm'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <FileText size={18} />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setImportType('json')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-all ${
                importType === 'json'
                  ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-500 shadow-sm'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Database size={18} />
              <span>JSON</span>
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer" onClick={triggerFileInput}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept={importType === 'csv' ? '.csv' : '.json'}
              className="hidden"
            />

            <Upload size={36} className="mx-auto text-indigo-500 mb-4" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              {importType === 'csv' ? 'Upload CSV File' : 'Upload JSON File'}
            </h4>
            <p className="text-gray-500 mb-4">
              {importType === 'csv'
                ? 'The first row should contain column headers'
                : 'File should contain an array of objects'
              }
            </p>

            <button
              onClick={(e) => {
                e.stopPropagation();
                triggerFileInput();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Select File
            </button>
          </div>

          {importError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-start">
              <AlertCircle size={18} className="mt-0.5 mr-2 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
                <Info size={16} className="mr-2 text-indigo-500" />
                Preview
              </h4>
              <div className="bg-gray-50 p-2 rounded-md overflow-x-auto border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(importPreview[0]).map((key, i) => (
                        <th key={i} className="px-2 py-2 text-left text-gray-600 font-medium">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-2 py-2 text-gray-700">
                            {String(val).substring(0, 20)}{String(val).length > 20 ? '...' : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Chart Modal Component
  const ChartModal = () => {
    if (!chartColumn || !statistics[chartColumn]) return null;

    const stats = statistics[chartColumn];
    const isNumeric = columnTypes[chartColumn] === 'Number';

    // For numeric columns, create histogram data
    const histogramData = useMemo(() => {
      if (!isNumeric) return [];

      const values = generatedData
        .map(row => row[chartColumn])
        .filter(val => val !== null && val !== undefined)
        .map(Number);

      const min = Math.min(...values);
      const max = Math.max(...values);
      const range = max - min;

      // Create 10 bins for better visualization
      const binCount = 10;
      const binSize = range / binCount;
      const bins = Array(binCount).fill(0);

      values.forEach(val => {
        const binIndex = Math.min(binCount - 1, Math.floor((val - min) / binSize));
        bins[binIndex]++;
      });

      return bins.map((count, i) => ({
        bin: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
        count
      }));
    }, [chartColumn, generatedData, isNumeric]);

    // For categorical columns, use frequency data
    const frequencyData = useMemo(() => {
      return stats.mostCommon.slice(0, 10).map(([value, count]) => ({
        category: String(value).substring(0, 15) + (String(value).length > 15 ? '...' : ''),
        count
      }));
    }, [stats]);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl shadow-xl">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="text-lg font-medium text-gray-800">
              Data Visualization: <span className="text-indigo-600">{chartColumn}</span>
            </h3>
            <div className="flex items-center space-x-2">
              {isNumeric && (
                <div className="flex bg-gray-100 rounded-md p-1">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`px-3 py-1 rounded ${
                      chartType === 'bar'
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <BarChart size={16} />
                  </button>
                  <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-1 rounded ${
                      chartType === 'line'
                        ? 'bg-indigo-500 text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <LineChart size={16} />
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowChartModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="md:col-span-2 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-4">
                  {isNumeric ? 'Value Distribution' : 'Top Categories'}
                </h4>

                {/* This would be a real chart in a production app */}
                <div className="h-64 bg-gray-50 rounded-md border border-gray-200 p-4 flex items-center justify-center">
                  {isNumeric ? (
                    <div className="w-full h-full flex items-end justify-between space-x-1 px-6">
                      {histogramData.map((bin, idx) => (
                        <div key={idx} className="flex flex-col items-center w-full">
                          <div
                            className="bg-indigo-500 rounded-t-sm w-full"
                            style={{
                              height: `${(bin.count / Math.max(...histogramData.map(b => b.count))) * 100}%`,
                              maxWidth: '30px'
                            }}
                          />
                          {idx % 2 === 0 && (
                            <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                              {bin.bin}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-end justify-between space-x-2 px-6">
                      {frequencyData.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center w-full">
                          <div
                            className="bg-indigo-500 rounded-t-sm w-full"
                            style={{
                              height: `${(item.count / Math.max(...frequencyData.map(i => i.count))) * 100}%`,
                              maxWidth: '30px'
                            }}
                          />
                          <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                            {item.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                <h4 className="text-sm font-medium text-gray-500 mb-4">Statistics Summary</h4>

                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="text-xs text-gray-500">Total Values</div>
                    <div className="text-lg font-semibold text-gray-800">{stats.count}</div>
                  </div>

                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="text-xs text-gray-500">Unique Values</div>
                    <div className="text-lg font-semibold text-gray-800">{stats.unique}</div>
                  </div>

                  {isNumeric && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-md p-3">
                          <div className="text-xs text-gray-500">Min Value</div>
                          <div className="text-md font-semibold text-gray-800">{stats.min.toFixed(2)}</div>
                        </div>

                        <div className="bg-gray-50 rounded-md p-3">
                          <div className="text-xs text-gray-500">Max Value</div>
                          <div className="text-md font-semibold text-gray-800">{stats.max.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-md p-3">
                          <div className="text-xs text-gray-500">Average</div>
                          <div className="text-md font-semibold text-gray-800">{stats.avg.toFixed(2)}</div>
                        </div>

                        <div className="bg-gray-50 rounded-md p-3">
                          <div className="text-xs text-gray-500">Median</div>
                          <div className="text-md font-semibold text-gray-800">{stats.median.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-md p-3">
                        <div className="text-xs text-gray-500">Standard Deviation</div>
                        <div className="text-md font-semibold text-gray-800">{stats.stdDev.toFixed(2)}</div>
                      </div>
                    </>
                  )}

                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="text-xs text-gray-500 mb-1">Top Values</div>
                    {stats.mostCommon.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <div className="text-sm text-gray-700 truncate max-w-32">
                          {String(item[0])}
                        </div>
                        <div className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                          {item[1]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Mobile Navigation
  const MobileNavigation = () => (
    <div className="bg-white border-b border-gray-200 mb-4 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <Database size={18} className="mr-2 text-indigo-600" />
          Data Preview
        </h1>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setLocalActiveTab('table')}
            className={`p-2 rounded-md ${activeTab === 'table' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
          >
            <Database size={16} />
          </button>

          <button
            onClick={() => setLocalActiveTab('stats')}
            className={`p-2 rounded-md ${activeTab === 'stats' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
          >
            <BarChart2 size={16} />
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className={`p-2 rounded-md ${activeTab === 'import' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-600'}`}
          >
            <Upload size={16} />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600"
          >
            <Menu size={16} />
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-gray-200 py-2 px-4 bg-gray-50">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Rows per page</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-md text-sm px-2 py-1"
              >
                {[10, 25, 50, 100].map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show stats</span>
              <button
                onClick={() => setShowStats(!showStats)}
                className={`w-10 h-5 rounded-full flex items-center transition-colors ${
                  showStats ? 'bg-indigo-500 justify-end' : 'bg-gray-300 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-sm transform translate-x-0.5"></span>
              </button>
            </div>

            <button
              onClick={() => exportData()}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
            >
              <Download size={16} />
              <span>Export Data</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render main content based on active tab (mobile view)
  const renderMobileContent = () => {
    if (activeTab === 'stats') {
      return (
        <div className="p-4">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Data Statistics</h2>

          {Object.keys(statistics).map((colName) => (
            <div key={colName} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-gray-700">{colName}</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                    {columnTypes[colName]}
                  </span>
                </div>
                {columnTypes[colName] === 'Number' && (
                  <button
                    onClick={() => openChartModal(colName)}
                    className="p-1 text-gray-500 hover:text-indigo-600"
                  >
                    <BarChart size={16} />
                  </button>
                )}
              </div>

              <div className="p-3">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Count</div>
                    <div className="font-medium">{statistics[colName].count}</div>
                  </div>

                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-xs text-gray-500">Unique</div>
                    <div className="font-medium">{statistics[colName].unique}</div>
                  </div>
                </div>

                {columnTypes[colName] === 'Number' && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Min</div>
                      <div className="font-medium">{statistics[colName].min.toFixed(2)}</div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Max</div>
                      <div className="font-medium">{statistics[colName].max.toFixed(2)}</div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Average</div>
                      <div className="font-medium">{statistics[colName].avg.toFixed(2)}</div>
                    </div>

                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-xs text-gray-500">Median</div>
                      <div className="font-medium">{statistics[colName].median.toFixed(2)}</div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 p-2 rounded">
                  <div className="text-xs text-gray-500 mb-1">Top Values</div>
                  {statistics[colName].mostCommon.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                      <span className="truncate max-w-32">{String(item[0])}</span>
                      <span className="text-gray-500 text-xs bg-gray-200 px-1 rounded">{item[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search data..."
              className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {visibleColumns.map((col) => (
                      <th
                        key={col}
                        onClick={() => requestSort(col)}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center space-x-1">
                          <span>{col}</span>
                          {sortConfig.key === col ? (
                            <span>
                              {sortConfig.direction === 'asc' ?
                                <ArrowUp size={12} /> :
                                <ArrowDown size={12} />
                              }
                            </span>
                          ) : (
                            <ChevronsDown size={12} className="text-gray-300" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      {visibleColumns.map((col, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200"
                          onMouseEnter={(e) => showTooltip(row[col], e)}
                          onMouseLeave={() => hideTooltip()}
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate max-w-32">
                              {String(row[col] !== null && row[col] !== undefined ? row[col] : '')}
                            </span>
                            <button
                              onClick={() => copyToClipboard(row[col], rowIndex, colIndex)}
                              className={`ml-2 p-1 rounded-full ${
                                copiedCell === `${rowIndex}-${colIndex}`
                                  ? 'text-green-500'
                                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile pagination */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`p-1 rounded-md ${
                  currentPage === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`p-1 rounded-md ${
                  currentPage === totalPages
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="h-full flex flex-col">
      {/* If showing import/chart modals */}
      {showImportModal && <ImportModal />}
      {showChartModal && <ChartModal />}

      {/* Tooltip */}
      {tooltipInfo.visible && (
        <div
          className="fixed bg-gray-800 text-white p-2 rounded text-xs max-w-xs z-50"
          style={{
            left: `${tooltipInfo.x + 10}px`,
            top: `${tooltipInfo.y + 10}px`
          }}
        >
          {tooltipInfo.content}
        </div>
      )}

      {/* Mobile view */}
      {isMobileView ? (
        <>
          <MobileNavigation />
          {renderMobileContent()}
        </>
      ) : (
        <>
          {/* Desktop view */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                <Database className="mr-2 text-indigo-600" />
                Data Preview
              </h1>
              <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">
                {processedData.length} Records
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center px-3 py-1.5 rounded-md border ${
                  showStats
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BarChart2 size={16} className="mr-2" />
                <span>Statistics</span>
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Upload size={16} className="mr-2" />
                <span>Import</span>
              </button>

              <button
                onClick={() => exportData()}
                className="flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              >
                <Download size={16} className="mr-2" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="mb-4 flex items-center space-x-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search data..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>

              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Rows:</label>
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="border border-gray-300 rounded-md text-sm px-2 py-1.5"
                >
                  {[10, 25, 50, 100, 250].map((value) => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <button
                  className="flex items-center px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                >
                  <Filter size={16} className="mr-2" />
                  <span>Columns</span>
                </button>
                {/* Dropdown for column selection would go here */}
              </div>
            </div>

            <div className="flex-1 flex space-x-6 overflow-hidden">
              <div className={`${showStats ? 'w-3/4' : 'w-full'} overflow-hidden flex flex-col`}>
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex-1">
                  <div className="overflow-auto h-full">
                    <table className="w-full whitespace-nowrap">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {visibleColumns.map((col) => (
                            <th
                              key={col}
                              onClick={() => requestSort(col)}
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                            >
                              <div className="flex items-center space-x-1">
                                <span>{col}</span>
                                {sortConfig.key === col ? (
                                  <span>
                                    {sortConfig.direction === 'asc' ?
                                      <ArrowUp size={12} /> :
                                      <ArrowDown size={12} />
                                    }
                                  </span>
                                ) : (
                                  <ChevronsDown size={12} className="text-gray-300" />
                                )}
                              </div>
                              <div className="text-xs text-gray-400 capitalize mt-0.5 flex items-center">
                                {columnTypes[col]}
                                {dataQuality[col]?.missingCount > 0 && (
                                  <span className={`ml-2 inline-block w-2 h-2 rounded-full ${
                                    dataQuality[col].status === 'poor' ? 'bg-red-500' :
                                    dataQuality[col].status === 'fair' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`} />
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((row, rowIndex) => (
                          <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 0 ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'}
                          >
                            {visibleColumns.map((col, colIndex) => (
                              <td
                                key={colIndex}
                                className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200"
                                onMouseEnter={(e) => showTooltip(row[col], e)}
                                onMouseLeave={hideTooltip}
                              >
                                <div className="flex items-center justify-between group">
                                  <span className="truncate max-w-xs">
                                    {String(row[col] !== null && row[col] !== undefined ? row[col] : '')}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(row[col], rowIndex, colIndex)}
                                    className={`ml-2 p-1 rounded-full opacity-0 group-hover:opacity-100 ${
                                      copiedCell === `${rowIndex}-${colIndex}`
                                        ? 'text-green-500'
                                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                    } transition-opacity`}
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Desktop pagination */}
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Showing {Math.min(processedData.length, (currentPage - 1) * rowsPerPage + 1)} to {Math.min(processedData.length, currentPage * rowsPerPage)} of {processedData.length} results
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronLeft size={16} />
                        <ChevronLeft size={16} className="-ml-4" />
                      </button>

                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded ${
                          currentPage === 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div className="flex items-center space-x-1">
                        {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                          let pageNumber;

                          if (totalPages <= 5) {
                            pageNumber = idx + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = idx + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + idx;
                          } else {
                            pageNumber = currentPage - 2 + idx;
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md ${
                                currentPage === pageNumber
                                  ? 'bg-indigo-500 text-white'
                                  : 'text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronRight size={16} />
                      </button>

                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded ${
                          currentPage === totalPages
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <ChevronRight size={16} />
                        <ChevronRight size={16} className="-ml-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {showStats && (
                <div className="w-1/4 bg-white rounded-lg border border-gray-200 shadow-sm p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-800">Data Statistics</h2>
                    <button
                      onClick={() => setShowStats(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-6">
                    {visibleColumns.map((colName) => (
                      <div key={colName} className="border-b border-gray-200 pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-gray-700 mb-1">{colName}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-indigo-100 text-indigo-700 rounded-full px-2 py-0.5">
                                {columnTypes[colName]}
                              </span>

                              {dataQuality[colName]?.missingCount > 0 && (
                                <span className={`text-xs rounded-full px-2 py-0.5 flex items-center ${
                                  dataQuality[colName].status === 'poor' ? 'bg-red-100 text-red-700' :
                                  dataQuality[colName].status === 'fair' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  <AlertCircle size={12} className="mr-1" />
                                  {dataQuality[colName].missingCount} missing ({dataQuality[colName].missingPercentage.toFixed(1)}%)
                                </span>
                              )}
                            </div>
                          </div>

                          {columnTypes[colName] === 'Number' && (
                            <button
                              onClick={() => openChartModal(colName)}
                              className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
                            >
                              <BarChart size={16} />
                            </button>
                          )}
                        </div>

                        {/* Mini distribution chart for numeric columns */}
                        {renderMiniChart(colName)}

                        <div className="grid grid-cols-2 gap-3 mt-2">
                          <div className="text-xs">
                            <div className="text-gray-500">Count</div>
                            <div className="font-medium text-sm">{statistics[colName].count}</div>
                          </div>

                          <div className="text-xs">
                            <div className="text-gray-500">Unique Values</div>
                            <div className="font-medium text-sm">{statistics[colName].unique}</div>
                          </div>

                          {columnTypes[colName] === 'Number' && (
                            <>
                              <div className="text-xs">
                                <div className="text-gray-500">Range</div>
                                <div className="font-medium text-sm">
                                  {statistics[colName].min.toFixed(1)} to {statistics[colName].max.toFixed(1)}
                                </div>
                              </div>

                              <div className="text-xs">
                                <div className="text-gray-500">Average</div>
                                <div className="font-medium text-sm">{statistics[colName].avg.toFixed(2)}</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1">Top 3 Values</div>
                          {statistics[colName].mostCommon.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                              <span className="truncate max-w-32">{String(item[0])}</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                {item[1]}x
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PreviewTab;
