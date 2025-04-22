import { useState, useEffect } from 'react';
import { FileCheck, Download, AlertCircle, CheckCircle, Info, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

export default function DataValidator() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const validateData = async (fileData) => {
    setLoading(true);

    try {
      const parsedData = await parseFileData(fileData);

      if (!parsedData || parsedData.length === 0) {
        throw new Error("Could not parse file or file is empty");
      }

      const validationReport = {
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(2) + " KB",
        fileType: file.type,
        timestamp: new Date().toLocaleString(),
        recordCount: parsedData.length,
        checks: [
          checkCompleteness(parsedData),
          checkConsistency(parsedData),
          checkAccuracy(parsedData),
          checkUniqueness(parsedData),
          checkValidity(parsedData)
        ],
        data: parsedData.slice(0, 10),
        summary: getSummaryStats(parsedData)
      };

      validationReport.overallScore = calculateOverallScore(validationReport.checks);

      setReport(validationReport);
    } catch (error) {
      setErrorMsg(error.message || "Failed to validate data");
    } finally {
      setLoading(false);
    }
  };

  const parseFileData = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target.result;

          if (file.type === "application/json") {
            resolve(JSON.parse(content));
          } else if (file.type === "text/csv" || file.name.endsWith('.csv')) {
            const lines = content.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            const data = lines.slice(1)
              .filter(line => line.trim() !== '')
              .map(line => {
                const values = line.split(',').map(v => v.trim());
                return headers.reduce((obj, header, i) => {
                  obj[header] = values[i];
                  return obj;
                }, {});
              });

            resolve(data);
          } else {
            reject(new Error("Unsupported file format. Please upload JSON or CSV."));
          }
        } catch (error) {
          reject(new Error("Error parsing file: " + error.message));
        }
      };

      reader.onerror = () => reject(new Error("Could not read file"));

      if (file.type === "application/json" || file.type === "text/csv" || file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reject(new Error("Unsupported file format. Please upload JSON or CSV."));
      }
    });
  };

  const checkCompleteness = (data) => {
    let missingCount = 0;
    let totalFields = 0;

    const fields = Object.keys(data[0] || {});

    data.forEach(record => {
      fields.forEach(field => {
        totalFields++;
        if (record[field] === undefined || record[field] === null || record[field] === '') {
          missingCount++;
        }
      });
    });

    const completenessRate = totalFields > 0 ? ((totalFields - missingCount) / totalFields) * 100 : 0;

    return {
      name: "Completeness",
      description: "Checks for missing or empty values",
      score: completenessRate,
      passed: completenessRate >= 90,
      details: `${missingCount} missing values out of ${totalFields} total fields (${completenessRate.toFixed(2)}% complete)`
    };
  };

  const checkConsistency = (data) => {
    const fields = Object.keys(data[0] || {});
    const typeMap = {};
    const inconsistencies = {};

    fields.forEach(field => {
      typeMap[field] = [];
      inconsistencies[field] = 0;
    });

    data.forEach(record => {
      fields.forEach(field => {
        const value = record[field];
        const type = typeof value;

        if (!typeMap[field].includes(type) && value !== null && value !== undefined && value !== '') {
          typeMap[field].push(type);
        }
      });
    });

    let inconsistentFields = 0;

    fields.forEach(field => {
      if (typeMap[field].length > 1) {
        inconsistentFields++;
      }
    });

    const consistencyRate = fields.length > 0 ? ((fields.length - inconsistentFields) / fields.length) * 100 : 100;

    return {
      name: "Consistency",
      description: "Checks for consistent data types across records",
      score: consistencyRate,
      passed: consistencyRate >= 95,
      details: `${inconsistentFields} inconsistent fields out of ${fields.length} total fields (${consistencyRate.toFixed(2)}% consistent)`
    };
  };

  const checkAccuracy = (data) => {
    const fields = Object.keys(data[0] || {});
    let invalidValues = 0;
    let totalChecks = 0;

    data.forEach(record => {
      fields.forEach(field => {
        const value = record[field];
        totalChecks++;

        if (field.toLowerCase().includes('email')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (value && !emailRegex.test(value)) invalidValues++;
        }
        else if (field.toLowerCase().includes('phone')) {
          const phoneRegex = /^\d{10,15}$/;
          if (value && !phoneRegex.test(value.replace(/\D/g, ''))) invalidValues++;
        }
        else if (field.toLowerCase().includes('date')) {
          const date = new Date(value);
          if (value && date.toString() === 'Invalid Date') invalidValues++;
        }
      });
    });

    const accuracyRate = totalChecks > 0 ? ((totalChecks - invalidValues) / totalChecks) * 100 : 100;

    return {
      name: "Accuracy",
      description: "Checks for data that conforms to expected formats",
      score: accuracyRate,
      passed: accuracyRate >= 95,
      details: `${invalidValues} potentially inaccurate values detected out of ${totalChecks} checks (${accuracyRate.toFixed(2)}% accurate)`
    };
  };

  const checkUniqueness = (data) => {
    const fields = Object.keys(data[0] || {});
    const uniqueKeys = new Set();
    let duplicates = 0;

    data.forEach((record, index) => {
      const key = JSON.stringify(record);

      if (uniqueKeys.has(key)) {
        duplicates++;
      } else {
        uniqueKeys.add(key);
      }
    });

    const uniquenessRate = data.length > 0 ? ((data.length - duplicates) / data.length) * 100 : 100;

    return {
      name: "Uniqueness",
      description: "Checks for duplicate records",
      score: uniquenessRate,
      passed: uniquenessRate >= 95,
      details: `${duplicates} duplicate records found out of ${data.length} total records (${uniquenessRate.toFixed(2)}% unique)`
    };
  };

  const checkValidity = (data) => {
    const fields = Object.keys(data[0] || {});
    let invalidValues = 0;
    let totalChecks = 0;

    data.forEach(record => {
      fields.forEach(field => {
        const value = record[field];
        totalChecks++;

        if (field.toLowerCase().includes('age')) {
          const age = parseInt(value);
          if (!isNaN(age) && (age < 0 || age > 120)) invalidValues++;
        }
        else if (field.toLowerCase().includes('percent') || field.toLowerCase().includes('percentage')) {
          const percent = parseFloat(value);
          if (!isNaN(percent) && (percent < 0 || percent > 100)) invalidValues++;
        }
        else if (field.toLowerCase().includes('year')) {
          const year = parseInt(value);
          const currentYear = new Date().getFullYear();
          if (!isNaN(year) && (year < 1900 || year > currentYear + 10)) invalidValues++;
        }
      });
    });

    const validityRate = totalChecks > 0 ? ((totalChecks - invalidValues) / totalChecks) * 100 : 100;

    return {
      name: "Validity",
      description: "Checks for values within expected ranges",
      score: validityRate,
      passed: validityRate >= 95,
      details: `${invalidValues} values outside expected ranges out of ${totalChecks} checks (${validityRate.toFixed(2)}% valid)`
    };
  };

  const getSummaryStats = (data) => {
    const fields = Object.keys(data[0] || {});
    const summary = {};

    fields.forEach(field => {
      const values = data.map(record => record[field]).filter(val => val !== null && val !== undefined && val !== '');

      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));

      if (numericValues.length > 0) {
        summary[field] = {
          type: 'numeric',
          min: Math.min(...numericValues),
          max: Math.max(...numericValues),
          avg: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
          count: values.length,
          missingCount: data.length - values.length
        };
      } else {
        const uniqueValues = new Set(values);
        summary[field] = {
          type: 'categorical',
          uniqueValues: uniqueValues.size,
          count: values.length,
          missingCount: data.length - values.length
        };
      }
    });

    return summary;
  };

  const calculateOverallScore = (checks) => {
    if (!checks || checks.length === 0) return 0;

    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return (totalScore / checks.length).toFixed(1);
  };

  const handleFileChange = (e) => {
    setErrorMsg('');
    setReport(null);

    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a file first");
      return;
    }

    validateData(file);
  };

  const downloadReport = (format) => {
    if (!report) return;

    if (format === 'json') {
      const reportJson = JSON.stringify(report, null, 2);
      const blob = new Blob([reportJson], { type: 'application/json' });
      saveAs(blob, `data-quality-report-${new Date().toISOString().slice(0, 10)}.json`);
    } else if (format === 'csv') {
      let csvContent = "Data Quality Report\n";
      csvContent += `File Name: ${report.fileName}\n`;
      csvContent += `File Size: ${report.fileSize}\n`;
      csvContent += `File Type: ${report.fileType}\n`;
      csvContent += `Generated: ${report.timestamp}\n`;
      csvContent += `Record Count: ${report.recordCount}\n`;
      csvContent += `Overall Score: ${report.overallScore}/100\n\n`;

      csvContent += "Validation Checks:\n";
      report.checks.forEach(check => {
        csvContent += `${check.name}, ${check.score.toFixed(2)}%, ${check.passed ? "PASSED" : "FAILED"}, ${check.details}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      saveAs(blob, `data-quality-report-${new Date().toISOString().slice(0, 10)}.csv`);
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.json_to_sheet(report);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data Quality Report');
      XLSX.writeFile(wb, `data-quality-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-orange-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <FileCheck size={32} className="mr-2" />
            <h1 className="text-2xl font-bold">Data Quality Validator</h1>
          </div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm">Ensure your data is clean and reliable</p>
          </motion.div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="mb-8 bg-white rounded-lg shadow-md p-6">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-semibold mb-4 text-gray-800"
          >
            Upload Data File
          </motion.h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50 text-center"
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileChange}
                accept=".csv,.json"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center justify-center"
              >
                <FileCheck size={48} className="text-orange-500 mb-2" />
                <p className="text-gray-600 mb-2">
                  {file ? file.name : "Drag & drop your file here or click to browse"}
                </p>
                <p className="text-sm text-gray-500">
                  {file ? `${(file.size / 1024).toFixed(2)} KB - ${file.type || "unknown type"}` : "Supports CSV and JSON formats"}
                </p>
              </label>
            </motion.div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center"
              >
                <AlertCircle size={20} className="mr-2" />
                <span>{errorMsg}</span>
                <button
                  onClick={() => setErrorMsg('')}
                  className="ml-auto"
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={!file || loading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`w-full py-3 rounded-md font-medium transition-colors ${
                !file || loading
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2" />
                  Validating...
                </div>
              ) : (
                "Validate Data"
              )}
            </motion.button>
          </form>
        </div>

        {report && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Data Quality Report</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => downloadReport('json')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  <Download size={18} className="mr-1" />
                  JSON
                </button>
                <button
                  onClick={() => downloadReport('csv')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  <Download size={18} className="mr-1" />
                  CSV
                </button>
                <button
                  onClick={() => downloadReport('xlsx')}
                  className="flex items-center px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                >
                  <Download size={18} className="mr-1" />
                  XLSX
                </button>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">Overall Data Quality Score</h3>
                  <p className="text-sm text-gray-600">Based on completeness, consistency, accuracy, uniqueness and validity</p>
                </div>
                <div className="flex items-center justify-center h-24 w-24 rounded-full bg-white border-4 border-orange-300">
                  <span className="text-2xl font-bold text-orange-600">{report.overallScore}/100</span>
                </div>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">File Name</h4>
                <p className="text-gray-900">{report.fileName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">File Size</h4>
                <p className="text-gray-900">{report.fileSize}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500">Record Count</h4>
                <p className="text-gray-900">{report.recordCount}</p>
              </div>
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Validation Checks</h3>
            <div className="space-y-4 mb-6">
              {report.checks.map((check, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {check.passed ? (
                        <CheckCircle size={20} className="text-green-500 mr-2" />
                      ) : (
                        <AlertCircle size={20} className="text-red-500 mr-2" />
                      )}
                      <h4 className="font-medium text-gray-800">{check.name}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      check.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {check.score.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{check.description}</p>
                  <p className="text-sm mt-2 text-gray-700">{check.details}</p>
                </motion.div>
              ))}
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Data Preview</h3>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {report.data.length > 0 && Object.keys(report.data[0]).map((header, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {report.data.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {cell !== null && cell !== undefined ? String(cell) : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="font-semibold text-gray-800 mb-3">Field Statistics</h3>
            <div className="space-y-4">
              {Object.entries(report.summary).map(([field, stats], index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center mb-2">
                    <Info size={18} className="text-orange-500 mr-2" />
                    <h4 className="font-medium text-gray-800">{field}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Type</p>
                      <p className="text-sm font-medium">{stats.type === 'numeric' ? 'Numeric' : 'Categorical'}</p>
                    </div>

                    {stats.type === 'numeric' ? (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Range</p>
                          <p className="text-sm font-medium">{stats.min.toFixed(2)} - {stats.max.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Average</p>
                          <p className="text-sm font-medium">{stats.avg.toFixed(2)}</p>
                        </div>
                      </>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Unique Values</p>
                        <p className="text-sm font-medium">{stats.uniqueValues}</p>
                      </div>
                    )}

                    <div>
                      <p className="text-sm text-gray-500">Missing</p>
                      <p className="text-sm font-medium">{stats.missingCount} ({((stats.missingCount / (stats.count + stats.missingCount)) * 100).toFixed(1)}%)</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>

      <footer className="bg-gray-100 text-gray-600 py-4">
        <div className="container mx-auto text-center text-sm">
          Data Quality Validator &copy; {new Date().getFullYear()} | The validation analysis is performed entirely in your browser
        </div>
      </footer>
    </div>
  );
}
