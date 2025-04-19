import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Check, X, AlertCircle, Settings, Download,
         Filter, Table, Trash2, BarChart, ChevronDown, ChevronRight } from "lucide-react";
import Papa from "papaparse";

const CSVIntegrator = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [activeTab, setActiveTab] = useState("upload");
  const [settings, setSettings] = useState({
    mergeType: "inner",
    columnMatch: "auto",
    matchColumn: "",
    removeEmptyRows: true,
    trimWhitespace: true,
    caseInsensitiveMatch: true
  });
  const [matchColumns, setMatchColumns] = useState([]);
  const [expandedPreviews, setExpandedPreviews] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [mergedData, setMergedData] = useState(null);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  // Determine common columns across files for potential matching
  useEffect(() => {
    if (previews.length >= 2) {
      const columnsPerFile = previews.map(preview =>
        preview.data.length > 0 ? Object.keys(preview.data[0]) : []
      );

      const commonColumns = columnsPerFile.reduce((acc, columns) => {
        if (acc.length === 0) return columns;
        return acc.filter(col => columns.includes(col));
      }, []);

      setMatchColumns(commonColumns);

      // Automatically set the first common column as the match column
      if (commonColumns.length > 0 && settings.columnMatch === "auto") {
        setSettings(prev => ({...prev, matchColumn: commonColumns[0]}));
      }

      // Generate statistics for files
      const newStats = {};
      previews.forEach((preview, index) => {
        const file = files[index];
        if (!file) return;

        newStats[file.name] = {
          rowCount: preview.data.length,
          columnCount: preview.data.length > 0 ? Object.keys(preview.data[0]).length : 0,
          size: (file.size / 1024).toFixed(2) + " KB",
          columns: preview.data.length > 0 ? Object.keys(preview.data[0]) : []
        };
      });
      setStatistics(newStats);
    }
  }, [previews, files]);

  // Handle drag and drop functionality
  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  };

  const handleFiles = (selectedFiles) => {
    const csvFiles = selectedFiles.filter(
      file => file.type === "text/csv" || file.name.endsWith(".csv")
    );

    if (csvFiles.length !== selectedFiles.length) {
      setMessage({
        type: "error",
        text: "Only CSV files are allowed. Some files were not added."
      });
    }

    const newFiles = [...files, ...csvFiles];
    setFiles(newFiles);

    // Reset previews for new files
    csvFiles.forEach(file => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        preview: 5,
        complete: (results) => {
          setPreviews(prevPreviews => [
            ...prevPreviews,
            {
              filename: file.name,
              data: results.data,
              headers: results.meta.fields || []
            }
          ]);
          setExpandedPreviews(prev => [...prev, false]);
        },
        error: (error) => {
          setMessage({
            type: "error",
            text: `Error parsing file ${file.name}: ${error.message}`
          });
        }
      });
    });
  };

  const handleFileChange = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
    setExpandedPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const togglePreviewExpansion = (index) => {
    setExpandedPreviews(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    setPreviews([]);
    setExpandedPreviews([]);
    setMessage(null);
    setErrorDetails(null);
    setMergedData(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length < 2) {
      setMessage({
        type: "error",
        text: "Please upload at least 2 CSV files to merge."
      });
      return;
    }

    setProcessing(true);
    setMessage({
      type: "info",
      text: "Processing your CSV files. This might take a moment..."
    });

    const formData = new FormData();
    files.forEach(file => {
      formData.append('csv_files', file);
    });

    // Add settings to the request
    Object.entries(settings).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch('http://127.0.0.1:8000/api/merge-csv/', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage({
          type: "success",
          text: "CSV files successfully merged!"
        });
        setErrorDetails(null);

        // Parse the merged CSV data
        const text = await response.text();
        const parsedData = Papa.parse(text, { header: true, dynamicTyping: true });
        setMergedData(parsedData.data);

        // Switch to the preview tab
        setActiveTab("mergePreview");
      } else {
        const data = await response.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to merge CSV files."
        });
        setErrorDetails(data.details || null);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while processing your request."
      });
      console.error("Error:", error);
    } finally {
      setProcessing(false);
    }
  };

  // Function to download sample CSV file
  const downloadSampleCSV = () => {
    const sampleData = [
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
      { id: 3, name: "Bob Johnson", email: "bob@example.com" }
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-r from-black to-blue-900 text-white transition-colors duration-300"
         onDragEnter={handleDragIn}
         onDragLeave={handleDragOut}
         onDragOver={handleDrag}
         onDrop={handleDrop}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">CSV Integrator Pro</h1>
            <p className="mt-2 text-gray-400">
              Advanced tool to merge, analyze and transform multiple CSV files
            </p>
          </div>
        </div>

        <div className="rounded-lg overflow-hidden mb-6 bg-gray-800 shadow-lg border border-gray-700">
          <div className="border-b border-gray-700">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("upload")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "upload"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <div className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </div>
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "preview"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                disabled={previews.length === 0}
              >
                <div className="flex items-center">
                  <Table className="w-4 h-4 mr-2" />
                  Data Preview
                </div>
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "stats"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                disabled={previews.length === 0}
              >
                <div className="flex items-center">
                  <BarChart className="w-4 h-4 mr-2" />
                  Statistics
                </div>
              </button>
              <button
                onClick={() => setActiveTab("mergePreview")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "mergePreview"
                    ? "border-b-2 border-blue-500 text-blue-400"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                disabled={!mergedData}
              >
                <div className="flex items-center">
                  <Table className="w-4 h-4 mr-2" />
                  Merge Preview
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "upload" && (
              <div>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-gray-600 hover:border-blue-500"
                  }`}
                  onClick={() => fileInputRef.current.click()}
                >
                  <label className="flex flex-col items-center cursor-pointer">
                    <Upload className={`w-16 h-16 mb-4 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                    <span className="text-xl font-medium">Upload CSV Files</span>
                    <span className="text-sm text-gray-400 mt-2 max-w-md">
                      Drag and drop your CSV files here or click to browse. Files should have a consistent structure for best results.
                    </span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".csv,text/csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <button
                    onClick={downloadSampleCSV}
                    className="flex items-center text-sm text-blue-400 hover:underline"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download Sample CSV
                  </button>

                  {files.length > 0 && (
                    <button
                      onClick={clearAllFiles}
                      className="flex items-center text-sm text-red-400 hover:underline"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Clear All Files
                    </button>
                  )}
                </div>

                {files.length > 0 && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">
                        Selected Files ({files.length})
                      </h3>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto rounded-lg border border-gray-600">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 ${
                            index % 2 === 0
                              ? 'bg-gray-700'
                              : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center flex-grow">
                            <FileText className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0" />
                            <div className="flex-grow">
                              <div className="font-medium truncate max-w-xl">
                                {file.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Size: {(file.size / 1024).toFixed(2)} KB |
                                {previews[index] && ` Columns: ${previews[index].headers?.length || 0} | `}
                                {previews[index] && ` Rows: ~${previews[index].data?.length || 0}+`}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="ml-4 text-red-400 hover:text-red-200 p-1 rounded-full hover:bg-red-900/20"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "preview" && (
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Data Previews
                </h3>

                {previews.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No files uploaded yet. Please upload CSV files to see previews.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {previews.map((preview, index) => (
                      <div key={index} className="bg-gray-800 shadow-lg border border-gray-700 rounded-lg overflow-hidden">
                        <div
                          className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-700/50"
                          onClick={() => togglePreviewExpansion(index)}
                        >
                          <div className="flex items-center">
                            {expandedPreviews[index] ? (
                              <ChevronDown className="w-5 h-5 mr-2 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 mr-2 text-gray-400" />
                            )}
                            <h4 className="font-medium">{preview.filename}</h4>
                          </div>
                          <div className="text-xs text-gray-400">
                            {preview.data.length}+ rows | {preview.headers?.length || 0} columns
                          </div>
                        </div>

                        {expandedPreviews[index] && (
                          <div className="overflow-x-auto">
                            <table className="min-w-full bg-gray-800">
                              <thead>
                                <tr className="bg-gray-700">
                                  {preview.data.length > 0 && Object.keys(preview.data[0]).map((key, i) => (
                                    <th key={i} className="py-2 px-4 border-b text-left text-xs font-medium uppercase tracking-wider">
                                      {key}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.data.map((row, rowIndex) => (
                                  <tr key={rowIndex} className={rowIndex % 2 === 0
                                    ? "bg-gray-800"
                                    : "bg-gray-700/50"
                                  }>
                                    {Object.values(row).map((value, colIndex) => (
                                      <td key={colIndex} className="py-2 px-4 border-b text-sm">
                                        {value === null || value === undefined ?
                                          <span className="text-gray-400 italic">NULL</span> :
                                          String(value)}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "stats" && (
              <div>
                <h3 className="text-lg font-medium mb-6">
                  File Statistics
                </h3>

                {Object.keys(statistics).length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No file statistics available. Upload CSV files to view statistics.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(statistics).map(([filename, stats], index) => (
                      <div key={index} className="bg-gray-800 shadow-lg border border-gray-700 rounded-lg p-5">
                        <h4 className="font-medium mb-4 text-blue-400">{filename}</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-300">Rows:</span>
                            <span className="text-sm font-medium">{stats.rowCount}+</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-300">Columns:</span>
                            <span className="text-sm font-medium">{stats.columnCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-300">Size:</span>
                            <span className="text-sm font-medium">{stats.size}</span>
                          </div>
                          <div className="mt-4">
                            <span className="text-sm text-gray-300">Columns:</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {stats.columns.map((col, i) => (
                                <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                                  matchColumns.includes(col)
                                    ? "bg-green-900/30 text-green-300"
                                    : "bg-gray-700 text-gray-300"
                                }`}>
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "mergePreview" && (
              <div>
                <h3 className="text-lg font-medium mb-4">Merged Data Preview</h3>
                {mergedData ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-gray-800">
                      <thead>
                        <tr className="bg-gray-700">
                          {mergedData.length > 0 && Object.keys(mergedData[0]).map((key, i) => (
                            <th key={i} className="py-2 px-4 border-b text-left text-xs font-medium uppercase tracking-wider">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {mergedData.map((row, rowIndex) => (
                          <tr key={rowIndex} className={rowIndex % 2 === 0
                            ? "bg-gray-800"
                            : "bg-gray-700/50"
                          }>
                            {Object.values(row).map((value, colIndex) => (
                              <td key={colIndex} className="py-2 px-4 border-b text-sm">
                                {value === null || value === undefined ?
                                  <span className="text-gray-400 italic">NULL</span> :
                                  String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No merged data available. Merge CSV files to see the preview.</p>
                  </div>
                )}
                {mergedData && (
                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => {
                        const csv = Papa.unparse(mergedData);
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.setAttribute('href', url);
                        link.setAttribute('download', 'merged_csv.csv');
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-6 py-2 rounded-md bg-green-600 text-white hover:bg-green-700"
                    >
                      Download Merged CSV
                    </button>
                  </div>
                )}
              </div>
            )}

            {message && (
              <div
                className={`p-4 mt-6 rounded-md ${
                  message.type === "success"
                    ? "bg-green-900/20 text-green-300"
                    : message.type === "error"
                    ? "bg-red-900/20 text-red-300"
                    : "bg-blue-900/20 text-blue-300"
                }`}
              >
                <div className="flex items-center">
                  {message.type === "success" ? (
                    <Check className="w-5 h-5 mr-2" />
                  ) : message.type === "error" ? (
                    <X className="w-5 h-5 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 mr-2" />
                  )}
                  <p>{message.text}</p>
                </div>
                {errorDetails && (
                  <div className="mt-2 text-sm">
                    <p className="font-semibold">Details:</p>
                    <p>{errorDetails}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {files.length === 0 ?
                "Upload at least 2 CSV files to merge them." :
                `${files.length} file${files.length !== 1 ? 's' : ''} selected for merging.`
              }
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={files.length < 2 || processing}
              className={`px-6 py-2 rounded-md text-white font-medium ${
                files.length < 2 || processing
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {processing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                "Merge Files"
              )}
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-400 mt-6">
          <p>CSV Integrator Pro v1.0.0 | An advanced tool for CSV operations</p>
        </div>
      </div>
    </div>
  );
};

export default CSVIntegrator;
