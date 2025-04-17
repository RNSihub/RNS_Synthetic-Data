import React, { useState } from "react";
import { Upload, FileText, Check, X, AlertCircle, Download } from "lucide-react";
import Papa from "papaparse";

const CSVIntegrator = () => {
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorDetails, setErrorDetails] = useState(null);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
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

    // Parse and preview the CSV files
    csvFiles.forEach(file => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        preview: 5,
        complete: (results) => {
          setPreviews(prevPreviews => [
            ...prevPreviews,
            { filename: file.name, data: results.data }
          ]);
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

  const removeFile = (index) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    setPreviews(prevPreviews => prevPreviews.filter((_, i) => i !== index));
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

    try {
      const response = await fetch('http://127.0.0.1:8000/api/merge-csv/', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: "CSV files successfully merged!"
        });
        setResult(data);
        setErrorDetails(null);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to merge CSV files."
        });
        setErrorDetails(data.details || null);
        setResult(null);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: "An error occurred while processing your request."
      });
      console.error("Error:", error);
      setResult(null);
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = () => {
    if (!result?.download_url) return;
    window.location.href = result.download_url;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-800">CSV Integrator</h1>
          <p className="mt-2 text-gray-600">
            Merge multiple CSV files with identical structure into one clean file
          </p>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
                <label className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-12 h-12 text-blue-500 mb-2" />
                  <span className="text-lg font-medium text-gray-700">Upload CSV Files</span>
                  <span className="text-sm text-gray-500 mt-1">
                    Drop your CSV files here or click to browse
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".csv,text/csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                    >
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">
                          {file.name}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {previews.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  File Previews
                </h3>
                <div className="space-y-4">
                  {previews.map((preview, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md shadow-sm">
                      <h4 className="text-md font-medium text-gray-700 mb-2">
                        {preview.filename}
                      </h4>
                      <table className="min-w-full bg-white">
                        <thead>
                          <tr>
                            {preview.data.length > 0 && Object.keys(preview.data[0]).map((key, i) => (
                              <th key={i} className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.data.map((row, rowIndex) => (
                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="py-2 px-4 border-b text-sm text-gray-900">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {message && (
              <div
                className={`p-4 mb-6 rounded-md ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : message.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
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

            {files.length >= 2 && (
              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-6 py-2 rounded-md text-white font-medium flex items-center ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {processing ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    "Merge CSV Files"
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {result && (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">
              Merge Results
            </h3>
            <div className="mb-4">
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                <div>
                  <p className="font-medium">Merged File</p>
                  <p className="text-sm text-gray-500">
                    {result.rows_processed} rows processed • {result.duplicates_removed} duplicates removed
                  </p>
                </div>
                <button
                  onClick={downloadFile}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </button>
              </div>
            </div>
            {result.cleaned_data && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Data Cleaning Summary:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 pl-4">
                  <li>{result.cleaned_data.missing_values} missing values handled</li>
                  <li>
                    {result.cleaned_data.cleaned_columns.length > 0
                      ? `Cleaned columns: ${result.cleaned_data.cleaned_columns.join(", ")}`
                      : "No columns needed cleaning"}
                  </li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVIntegrator;
