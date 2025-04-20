import React, { useState, useEffect, useMemo } from 'react';
import { Database, ChevronsDown, ArrowUp, ArrowDown, Search, Copy, Info, AlertCircle, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

const PreviewTab = ({ generatedData, setActiveTab }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(50);
  const [copiedCell, setCopiedCell] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [tooltipInfo, setTooltipInfo] = useState({ visible: false, content: '', x: 0, y: 0 });

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
      else if (!isNaN(Date.parse(value)) && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}|.*T.*Z$/)) {
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
    const columns = Object.keys(generatedData[0]);
    
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
    const columns = Object.keys(generatedData[0]);
    
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
        mostCommon: sortedFreq.slice(0, 3),
      };
      
      // Add number-specific stats
      if (columnTypes[col] === 'Number') {
        const numericValues = values.map(v => Number(v));
        stats[col].min = Math.min(...numericValues);
        stats[col].max = Math.max(...numericValues);
        stats[col].avg = numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
      }
    });
    
    return stats;
  }, [generatedData, columnTypes]);

  // Sort and filter data
  const processedData = useMemo(() => {
    if (!generatedData || !generatedData.length) return [];
    
    let filteredData = [...generatedData];
    
    // Apply search filter
    if (searchTerm) {
      filteredData = filteredData.filter(row => 
        Object.values(row).some(value => 
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
  }, [generatedData, sortConfig, searchTerm]);

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
      <div className="flex items-end h-6 space-x-1 mt-1">
        {bins.map((bin, idx) => (
          <div 
            key={idx}
            className="bg-orange-500 rounded-sm"
            style={{ 
              height: `${(bin / maxBinValue) * 100}%`, 
              width: '4px'
            }}
          />
        ))}
      </div>
    );
  };

  if (!generatedData || generatedData.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Data Preview</h1>
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Database size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Data Generated Yet</h3>
          <p className="text-gray-500 mb-4">Go to the Data Generator tab to create some synthetic data.</p>
          <button
            onClick={() => setActiveTab('generator')}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
          >
            Generate Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Data Preview</h1>
      
      {/* Data Stats and Controls Bar */}
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex items-center space-x-4 mb-2">
          <div className="bg-gray-100 px-3 py-1 rounded-md flex items-center">
            <Database size={16} className="text-gray-500 mr-2" />
            <span className="text-sm font-medium">{processedData.length} rows</span>
          </div>
          <button 
            onClick={() => setShowStats(!showStats)}
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 px-3 py-1 rounded-md flex items-center transition-colors"
          >
            <BarChart2 size={16} className="mr-2" />
            <span className="text-sm font-medium">{showStats ? 'Hide Stats' : 'Show Stats'}</span>
          </button>
        </div>
        
        <div className="relative mb-2">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>
      
      {/* Statistics Panel */}
      {showStats && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Data Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(statistics).slice(0, 3).map(col => (
              <div key={col} className="bg-white p-3 rounded-md shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  {col}
                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {columnTypes[col]}
                  </span>
                </h4>
                <div className="text-xs text-gray-600">
                  <div className="flex justify-between mb-1">
                    <span>Total values:</span>
                    <span className="font-medium">{statistics[col].count}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span>Unique values:</span>
                    <span className="font-medium">{statistics[col].unique}</span>
                  </div>
                  {columnTypes[col] === 'Number' && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>Min:</span>
                        <span className="font-medium">{statistics[col].min.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Max:</span>
                        <span className="font-medium">{statistics[col].max.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Average:</span>
                        <span className="font-medium">{statistics[col].avg.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="mt-2">
                    <span className="block mb-1">Most common:</span>
                    {statistics[col].mostCommon.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                        <span className="truncate max-w-24">{String(item[0])}</span>
                        <span>{item[1]} times</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main Data Table */}
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden mb-4">
        <div className="overflow-auto max-h-[540px] border-t">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {Object.keys(generatedData[0]).map((key) => (
                  <th
                    key={key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors"
                    onClick={() => requestSort(key)}
                  >
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="flex items-center">
                          {key}
                          {sortConfig.key === key && (
                            <span className="ml-1">
                              {sortConfig.direction === 'asc' ? 
                                <ArrowUp size={14} className="text-orange-600" /> : 
                                <ArrowDown size={14} className="text-orange-600" />
                              }
                            </span>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className="text-xxs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                            {columnTypes[key]}
                          </span>
                          {dataQuality[key].status !== 'good' && (
                            <span className="ml-1">
                              <AlertCircle 
                                size={12} 
                                className={`${
                                  dataQuality[key].status === 'poor' ? 'text-red-500' : 'text-orange-400'
                                }`} 
                              />
                            </span>
                          )}
                        </div>
                      </div>
                      {columnTypes[key] === 'Number' && renderMiniChart(key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-orange-50 transition-colors'}>
                  {Object.entries(row).map(([key, value], j) => {
                    const isMissing = value === null || value === undefined || value === '';
                    const cellId = `${i}-${j}`;
                    
                    return (
                      <td 
                        key={j} 
                        className={`px-6 py-4 whitespace-nowrap text-sm relative ${
                          isMissing ? 'bg-red-50' : ''
                        }`}
                        onMouseEnter={(e) => showTooltip(value, e)}
                        onMouseLeave={hideTooltip}
                        onClick={() => copyToClipboard(value, i, j)}
                      >
                        <div className={`${isMissing ? 'text-red-400 italic' : 'text-gray-700'} max-w-xs truncate`}>
                          {isMissing ? 'NULL' : String(value)}
                        </div>
                        
                        {copiedCell === cellId && (
                          <div className="absolute top-0 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                            Copied!
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Tooltip */}
        {tooltipInfo.visible && (
          <div 
            className="fixed z-50 bg-gray-800 text-white p-2 rounded shadow-lg text-sm max-w-xs"
            style={{
              left: `${tooltipInfo.x + 10}px`,
              top: `${tooltipInfo.y + 10}px`,
            }}
          >
            {tooltipInfo.content}
          </div>
        )}
        
        {/* Scroll Indicator */}
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 flex flex-col items-center bg-gray-50 rounded-lg shadow-md p-2">
          <ChevronsDown className="text-orange-500 animate-bounce" size={15} />
          <span className="text-xs text-gray-400">Scroll down</span>
        </div>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">{Math.min(processedData.length, (currentPage - 1) * rowsPerPage + 1)}</span> to{" "}
          <span className="font-medium">{Math.min(currentPage * rowsPerPage, processedData.length)}</span> of{" "}
          <span className="font-medium">{processedData.length}</span> results
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={`p-2 rounded-md ${
              currentPage === 1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
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
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-md ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewTab;