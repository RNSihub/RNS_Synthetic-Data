import { useState, useEffect, useRef } from 'react';
import {
  LineChart, BarChart, PieChart, ScatterChart, AreaChart, RadarChart,
  Line, Bar, Pie, Scatter, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart,
  Cell, Treemap, RadialBarChart, RadialBar
} from 'recharts';
import { 
  Upload, ChevronRight, Download, X, Move, Save, Filter, Search, 
  Settings, BarChart2, PlusCircle, RefreshCw, FileText, Share2, 
  Eye, Sliders, Grid, Info
} from 'lucide-react';
import _ from 'lodash';

// Mock data to use initially
const initialData = [
  { name: 'Jan', value1: 400, value2: 240 },
  { name: 'Feb', value1: 300, value2: 139 },
  { name: 'Mar', value1: 200, value2: 980 },
  { name: 'Apr', value1: 278, value2: 390 },
  { name: 'May', value1: 189, value2: 480 },
  { name: 'Jun', value1: 239, value2: 380 }
];

// Color palette for charts
const COLORS = [
  '#FF7D00', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', 
  '#8884D8', '#F44336', '#3F51B5', '#4CAF50', '#FFC107'
];

export default function DataVisualizer() {
  // App state
  const [currentPage, setCurrentPage] = useState('upload'); // 'upload', 'select', 'dashboard'
  const [data, setData] = useState(initialData);
  const [filteredData, setFilteredData] = useState(initialData);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [columns, setColumns] = useState([]);
  const [charts, setCharts] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [gridLayout, setGridLayout] = useState('2'); // '1', '2', '3' columns
  const [showDataTable, setShowDataTable] = useState(false);
  const [theme, setTheme] = useState('orange'); // 'orange', 'blue', 'green', 'purple'
  const [colorMode, setColorMode] = useState('light'); // 'light', 'dark'
  const [dashboardName, setDashboardName] = useState('My Dashboard');
  const [savedDashboards, setSavedDashboards] = useState([]);
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chart creation state
  const [availableChartTypes, setAvailableChartTypes] = useState([]);
  const [selectedChart, setSelectedChart] = useState('');
  const [selectedXAxis, setSelectedXAxis] = useState('');
  const [selectedYAxis, setSelectedYAxis] = useState([]);
  const [chartTitle, setChartTitle] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [chartColorScheme, setChartColorScheme] = useState('default');
  const [sortData, setSortData] = useState(false);
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [aggregationType, setAggregationType] = useState('none'); // 'none', 'sum', 'avg', 'min', 'max'
  const [aggregationField, setAggregationField] = useState('');
  const [isSlideoverOpen, setIsSlideoverOpen] = useState(false);
  const [editingChartId, setEditingChartId] = useState(null);
  
  // Data analysis state
  const [dataInsights, setDataInsights] = useState({});
  const [dataStatistics, setDataStatistics] = useState({});
  
  const dashboardRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Determine available chart types when data changes
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      const chartTypes = determineChartTypes(data, cols);
      setAvailableChartTypes(chartTypes);
      
      // Generate data insights and statistics
      generateDataInsights(data, cols);
    }
  }, [data]);

  useEffect(() => {
    // Apply filters and search to data
    let result = [...data];
    
    // Apply filters
    activeFilters.forEach(filter => {
      if (filter.column && filter.operator && filter.value !== undefined) {
        result = result.filter(item => {
          const value = item[filter.column];
          switch(filter.operator) {
            case 'equals': return value == filter.value;
            case 'notEquals': return value != filter.value;
            case 'greaterThan': return value > filter.value;
            case 'lessThan': return value < filter.value;
            case 'contains': return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
            default: return true;
          }
        });
      }
    });
    
    // Apply search
    if (searchQuery.trim() !== '') {
      result = result.filter(item => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }
    
    setFilteredData(result);
  }, [data, activeFilters, searchQuery]);

  // Generate data insights and statistics
  const generateDataInsights = (data, columns) => {
    const stats = {};
    const insights = {};
    
    // Calculate statistics for numeric columns
    columns.forEach(col => {
      if (data.some(item => typeof item[col] === 'number')) {
        const values = data.map(item => item[col]).filter(val => typeof val === 'number');
        
        if (values.length > 0) {
          stats[col] = {
            min: Math.min(...values),
            max: Math.max(...values),
            avg: values.reduce((sum, val) => sum + val, 0) / values.length,
            sum: values.reduce((sum, val) => sum + val, 0),
            count: values.length
          };
          
          // Simple trend detection
          const trend = detectTrend(values);
          if (trend) {
            insights[col] = trend;
          }
        }
      }
    });
    
    setDataStatistics(stats);
    setDataInsights(insights);
  };

  // Simple trend detection logic
  const detectTrend = (values) => {
    if (values.length < 3) return null;
    
    const increases = 0;
    const decreases = 0;
    
    
    
    const increasePercentage = increases / (values.length - 1);
    const decreasePercentage = decreases / (values.length - 1);
    
    if (increasePercentage > 0.7) return "Strong upward trend";
    if (decreasePercentage > 0.7) return "Strong downward trend";
    if (increasePercentage > 0.5) return "Upward trend";
    if (decreasePercentage > 0.5) return "Downward trend";
    
    return "No clear trend";
  };

  // Process the uploaded file
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop().toLowerCase();
    setFileType(fileExtension);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        let parsedData = [];

        if (fileExtension === 'json') {
          // Handle JSON files
          parsedData = JSON.parse(event.target.result);
        } else if (fileExtension === 'csv') {
          // Handle CSV files
          const csvText = event.target.result;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const values = lines[i].split(',');
            const row = {};
            
            headers.forEach((header, index) => {
              let value = values[index] ? values[index].trim() : '';
              // Try to convert to number if possible
              const numValue = Number(value);
              row[header] = !isNaN(numValue) ? numValue : value;
            });
            
            parsedData.push(row);
          }
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // For XLSX handling, we'd use the XLSX library
          // This is a simplified version as the real implementation would
          // require the library to be imported
          parsedData = [
            { message: "XLSX parsing would be handled here" },
            ...initialData
          ];
        }
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setData(parsedData);
          setFilteredData(parsedData);
          setCurrentPage('select');
          // Reset filters and search when new data is loaded
          setActiveFilters([]);
          setSearchQuery('');
        } else {
          alert("Invalid data format. Please upload a valid file.");
        }
      } catch (error) {
        alert("Error parsing file: " + error.message);
      }
    };

    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      alert("XLSX support would be implemented with the XLSX library");
      // In a real implementation, we would use:
      // reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Determine which chart types are suitable for the data
  const determineChartTypes = (data, columns) => {
    const types = [];
    const numericColumns = columns.filter(col => 
      data.some(item => typeof item[col] === 'number')
    );
    
    const categoricalColumns = columns.filter(col => 
      data.some(item => typeof item[col] === 'string')
    );
    
    if (numericColumns.length > 0) {
      types.push('bar', 'line', 'area');
      
      if (numericColumns.length >= 2) {
        types.push('scatter', 'composed');
      }
      
      if (categoricalColumns.length > 0) {
        types.push('pie', 'radialBar', 'treemap');
      }
      
      if (numericColumns.length >= 3) {
        types.push('radar');
      }
    }
    
    return types;
  };

  // Add a new chart to the dashboard
  const addChart = () => {
    if (!selectedChart || !selectedXAxis || selectedYAxis.length === 0) {
      alert("Please select chart type, X-axis and at least one Y-axis");
      return;
    }
    
    // Process data according to aggregation settings
    let processedData = [...filteredData];
    
    if (aggregationType !== 'none' && aggregationField) {
      // Group data by the selected aggregation field
      const grouped = _.groupBy(processedData, aggregationField);
      
      processedData = Object.keys(grouped).map(key => {
        const group = grouped[key];
        const result = { [aggregationField]: key };
        
        selectedYAxis.forEach(yAxis => {
          const values = group.map(item => item[yAxis]).filter(val => typeof val === 'number');
          
          if (values.length > 0) {
            switch(aggregationType) {
              case 'sum':
                result[yAxis] = values.reduce((sum, val) => sum + val, 0);
                break;
              case 'avg':
                result[yAxis] = values.reduce((sum, val) => sum + val, 0) / values.length;
                break;
              case 'min':
                result[yAxis] = Math.min(...values);
                break;
              case 'max':
                result[yAxis] = Math.max(...values);
                break;
              default:
                result[yAxis] = null;
            }
          }
        });
        
        return result;
      });
    }
    
    // Apply sorting if enabled
    if (sortData && sortBy) {
      processedData = [...processedData].sort((a, b) => {
        if (sortDirection === 'asc') {
          return a[sortBy] < b[sortBy] ? -1 : 1;
        } else {
          return a[sortBy] > b[sortBy] ? -1 : 1;
        }
      });
    }
    
    const newChart = {
      id: editingChartId || Date.now(),
      type: selectedChart,
      xAxis: selectedXAxis,
      yAxis: selectedYAxis,
      title: chartTitle || `${selectedChart.charAt(0).toUpperCase() + selectedChart.slice(1)} Chart`,
      colorScheme: chartColorScheme,
      aggregationType,
      aggregationField,
      sortData,
      sortBy,
      sortDirection,
      data: processedData
    };
    
    if (editingChartId) {
      // Update existing chart
      setCharts(charts.map(chart => chart.id === editingChartId ? newChart : chart));
      setEditingChartId(null);
    } else {
      // Add new chart
      setCharts([...charts, newChart]);
    }
    
    // Reset form
    resetChartForm();
    setIsSlideoverOpen(false);
  };

  // Reset chart creation form
  const resetChartForm = () => {
    setSelectedChart('');
    setSelectedXAxis('');
    setSelectedYAxis([]);
    setChartTitle('');
    setShowAdvancedOptions(false);
    setChartColorScheme('default');
    setSortData(false);
    setSortBy('');
    setSortDirection('asc');
    setAggregationType('none');
    setAggregationField('');
  };

  // Edit existing chart
  const editChart = (chartId) => {
    const chart = charts.find(c => c.id === chartId);
    if (chart) {
      setSelectedChart(chart.type);
      setSelectedXAxis(chart.xAxis);
      setSelectedYAxis(chart.yAxis);
      setChartTitle(chart.title);
      setChartColorScheme(chart.colorScheme || 'default');
      setSortData(chart.sortData || false);
      setSortBy(chart.sortBy || '');
      setSortDirection(chart.sortDirection || 'asc');
      setAggregationType(chart.aggregationType || 'none');
      setAggregationField(chart.aggregationField || '');
      setEditingChartId(chartId);
      setIsSlideoverOpen(true);
    }
  };

  // Continue to dashboard page
  const goToDashboard = () => {
    if (charts.length === 0) {
      alert("Please add at least one chart to continue");
      return;
    }
    setCurrentPage('dashboard');
  };

  // Remove a chart from the dashboard
  const removeChart = (chartId) => {
    setCharts(charts.filter(chart => chart.id !== chartId));
  };

  // Handle drag start
  const handleDragStart = (e, chartId) => {
    setDraggedItem(chartId);
    e.dataTransfer.effectAllowed = "move";
    // Add some transparency to the dragged element
    const element = e.target.closest('.chart-container');
    if (element) {
      setTimeout(() => {
        element.style.opacity = '0.5';
      }, 0);
    }
  };

  // Handle drag over
  const handleDragOver = (e, chartId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (draggedItem !== null && draggedItem !== chartId) {
      const draggedItemIndex = charts.findIndex(chart => chart.id === draggedItem);
      const targetIndex = charts.findIndex(chart => chart.id === chartId);
      
      if (draggedItemIndex !== -1 && targetIndex !== -1) {
        const newCharts = [...charts];
        const [removed] = newCharts.splice(draggedItemIndex, 1);
        newCharts.splice(targetIndex, 0, removed);
        setCharts(newCharts);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    setDraggedItem(null);
    // Restore opacity
    const element = e.target.closest('.chart-container');
    if (element) {
      element.style.opacity = '1';
    }
  };

  // Export dashboard as image
  const exportDashboard = () => {
    alert("Export functionality would use html2canvas to create an image of the dashboard");
  };

  // Save dashboard configuration
  const saveDashboard = () => {
    const dashboard = {
      id: Date.now(),
      name: dashboardName,
      charts,
      gridLayout,
      theme,
      colorMode,
      date: new Date().toLocaleDateString()
    };
    
    setSavedDashboards([...savedDashboards, dashboard]);
    alert(`Dashboard "${dashboardName}" saved successfully!`);
  };

  // Load a saved dashboard
  const loadDashboard = (dashboard) => {
    setCharts(dashboard.charts);
    setGridLayout(dashboard.gridLayout);
    setTheme(dashboard.theme);
    setColorMode(dashboard.colorMode);
    setDashboardName(dashboard.name);
    setCurrentPage('dashboard');
  };

  // Add a new filter
  const addFilter = () => {
    setActiveFilters([
      ...activeFilters,
      { id: Date.now(), column: '', operator: 'equals', value: '' }
    ]);
  };

  // Update a filter
  const updateFilter = (id, field, value) => {
    setActiveFilters(activeFilters.map(filter => 
      filter.id === id ? { ...filter, [field]: value } : filter
    ));
  };

  // Remove a filter
  const removeFilter = (id) => {
    setActiveFilters(activeFilters.filter(filter => filter.id !== id));
  };

  // Get theme color based on current theme
  const getThemeColor = () => {
    switch(theme) {
      case 'blue': return colorMode === 'dark' ? '#1E40AF' : '#3B82F6';
      case 'green': return colorMode === 'dark' ? '#065F46' : '#10B981';
      case 'purple': return colorMode === 'dark' ? '#5B21B6' : '#8B5CF6';
      default: return colorMode === 'dark' ? '#9A3412' : '#FF7D00';
    }
  };

  // Get theme text color based on current theme
  const getThemeTextColor = () => {
    return colorMode === 'dark' ? 'white' : `${theme}-800`;
  };

  // Get theme background color based on current theme
  const getThemeBgColor = () => {
    return colorMode === 'dark' ? 'gray-800' : `${theme}-50`;
  };

  // Render the appropriate chart based on type
  const renderChart = (chartConfig) => {
    const { 
      type, 
      xAxis, 
      yAxis, 
      colorScheme, 
      data: chartData = filteredData 
    } = chartConfig;
    
    const chartColors = colorScheme === 'default' 
      ? [getThemeColor(), ...COLORS.slice(1)] 
      : COLORS;
    
    const chartProps = {
      data: chartData,
      width: "100%",
      height: 300,
      margin: { top: 5, right: 20, left: 20, bottom: 5 }
    };
    
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxis.map((axis, index) => (
                <Bar 
                  key={axis} 
                  dataKey={axis} 
                  fill={chartColors[index % chartColors.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxis.map((axis, index) => (
                <Line 
                  key={axis}
                  type="monotone" 
                  dataKey={axis} 
                  stroke={chartColors[index % chartColors.length]} 
                  strokeWidth={2} 
                  dot={{ fill: chartColors[index % chartColors.length] }} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              {yAxis.map((axis, index) => (
                <Area 
                  key={axis}
                  type="monotone" 
                  dataKey={axis} 
                  fill={chartColors[index % chartColors.length]} 
                  stroke={chartColors[index % chartColors.length]} 
                  fillOpacity={0.6} 
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} type="number" name={xAxis} />
              <YAxis dataKey={yAxis[0]} type="number" name={yAxis[0]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter 
                name={`${xAxis} vs ${yAxis[0]}`} 
                data={chartData} 
                fill={chartColors[0]} 
              />
              {yAxis.slice(1).map((axis, index) => (
                <Scatter 
                  key={axis}
                  name={`${xAxis} vs ${axis}`} 
                  data={chartData} 
                  fill={chartColors[(index + 1) % chartColors.length]} 
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );
        
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={chartData} 
                dataKey={yAxis[0]} 
                nameKey={xAxis} 
                cx="50%" 
                cy="50%" 
                outerRadius={100} 
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={100} data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xAxis} />
              <PolarRadiusAxis />
              {yAxis.map((axis, index) => (
                <Radar 
                  key={axis}
                  name={axis} 
                  dataKey={axis} 
                  stroke={chartColors[index % chartColors.length]} 
                  fill={chartColors[index % chartColors.length]} 
                  fillOpacity={0.6} 
                />
              ))}
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart {...chartProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yAxis[0]} fill={chartColors[0]} />
              {yAxis.slice(1).map((axis, index) => (
                <Line 
                  key={axis}
                  type="monotone" 
                  dataKey={axis} 
                  stroke={chartColors[(index + 1) % chartColors.length]} 
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );
        
      case 'treemap':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={chartData}
              dataKey={yAxis[0]}
              nameKey={xAxis}
              aspectRatio={4/3}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Treemap>
          </ResponsiveContainer>
        );
        
      case 'radialBar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="10%" 
              outerRadius="80%" 
              data={chartData}
            >
              <RadialBar 
                minAngle={15} 
                background
                dataKey={yAxis[0]} 
                nameKey={xAxis}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </RadialBar>
              <Legend 
                iconSize={10} 
                layout="vertical" 
                verticalAlign="middle" 
                align="right"
              />
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        );
        
      default:
        return <div>Chart type not supported</div>;
    }
  };

  // Render upload page
  const renderUploadPage = () => (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-${getThemeBgColor()} p-6`}>
      <div className={`bg-white ${colorMode === 'dark' ? 'bg-gray-700 text-white' : ''} rounded-lg shadow-lg p-8 max-w-md w-full`}>
        <h2 className={`text-2xl font-bold text-${getThemeTextColor()} mb-6 text-center`}>Upload Your Data</h2>
        
        <div className={`border-2 border-dashed border-${theme}-300 rounded-lg p-8 text-center mb-6`}>
          <Upload size={48} className={`mx-auto mb-4 text-${theme}-500`} />
          <p className={`${colorMode === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
            Drag & drop your file or click to browse
          </p>
          <p className={`text-sm ${colorMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
            Supported formats: CSV, JSON, XLSX
          </p>
          <input 
            ref={fileInputRef}
            type="file" 
            onChange={handleFileUpload} 
            className="hidden"
            accept=".csv,.json,.xlsx,.xls"
          />
          <button 
            onClick={() => fileInputRef.current.click()}
            className={`bg-${theme}-500 text-white px-6 py-3 rounded-md hover:bg-${theme}-600 transition-colors`}
            style={{backgroundColor: getThemeColor()}}
          >
            Select File
          </button>
        </div>
        
        {fileName && (
          <div className={`bg-${theme}-100 ${colorMode === 'dark' ? 'bg-gray-600' : ''} rounded-md p-4 flex justify-between items-center`}>
            <div>
              <p className={`font-medium text-${getThemeTextColor()}`}>{fileName}</p>
              <p className={`text-sm text-${theme}-600 ${colorMode === 'dark' ? 'text-gray-300' : ''}`}>{fileType.toUpperCase()} File</p>
            </div>
            <ChevronRight size={24} className={`text-${theme}-500`} />
          </div>
        )}
        
        {/* Demo Data option */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${colorMode === 'dark' ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
            No data to upload?
          </p>
          <button 
            onClick={() => {
              setData(initialData);
              setFilteredData(initialData);
              setFileName('demo_data.json');
              setFileType('json');
              setCurrentPage('select');
            }}
            className={`text-${theme}-600 hover:text-${theme}-800 underline`}
          >
            Use demo data
          </button>
        </div>
        
        {/* Theme selector */}
        
      </div>
    </div>
  );

  // Render chart selection page
  const renderChartSelectionPage = () => (
    <div className={`min-h-screen bg-${getThemeBgColor()} p-6`}>
      <div className={`bg-white ${colorMode === 'dark' ? 'bg-gray-700 text-white' : ''} rounded-lg shadow-lg p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold text-${getThemeTextColor()}`}>Create Your Dashboard</h2>
          <div className="flex space-x-4">
            <button 
              onClick={() => setCurrentPage('upload')}
              className={`flex items-center px-4 py-2 border border-${theme}-300 rounded-md text-${theme}-600 hover:bg-${theme}-50 ${colorMode === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-600' : ''}`}
            >
              <Upload size={18} className="mr-2" /> Change Data
            </button>
            <button 
              onClick={goToDashboard}
              className={`flex items-center px-4 py-2 bg-${theme}-500 text-white rounded-md hover:bg-${theme}-600`}
              style={{backgroundColor: getThemeColor()}}
              disabled={charts.length === 0}
            >
              <ChevronRight size={18} className="mr-2" /> Continue to Dashboard
            </button>
          </div>
        </div>
        
        {/* Data info */}
        <div className={`bg-${theme}-50 ${colorMode === 'dark' ? 'bg-gray-600' : ''} rounded-md p-4 mb-6`}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className={`font-medium text-${getThemeTextColor()}`}>Data Source: {fileName}</h3>
              <p className={`text-sm text-${theme}-600 ${colorMode === 'dark' ? 'text-gray-300' : ''}`}>
                {filteredData.length} records, {columns.length} columns
              </p>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setShowDataTable(!showDataTable)}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                <Eye size={16} className="mr-1" /> {showDataTable ? 'Hide' : 'View'} Data
              </button>
            </div>
          </div>
          
          {/* Data search and filters */}
          <div className="flex space-x-4 mb-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search in data..."
                className={`pl-10 pr-4 py-2 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md w-full`}
              />
            </div>
            <button 
              onClick={addFilter}
              className={`flex items-center px-3 py-2 bg-${theme}-500 text-white rounded-md hover:bg-${theme}-600`}
              style={{backgroundColor: getThemeColor()}}
            >
              <Filter size={16} className="mr-1" /> Add Filter
            </button>
          </div>
          
          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="mb-4">
              {activeFilters.map(filter => (
                <div key={filter.id} className="flex items-center space-x-2 mb-2">
                  <select 
                    value={filter.column}
                    onChange={(e) => updateFilter(filter.id, 'column', e.target.value)}
                    className={`border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-1 px-2`}
                  >
                    <option value="">Select column</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <select 
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, 'operator', e.target.value)}
                    className={`border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-1 px-2`}
                  >
                    <option value="equals">equals</option>
                    <option value="notEquals">not equals</option>
                    <option value="greaterThan">greater than</option>
                    <option value="lessThan">less than</option>
                    <option value="contains">contains</option>
                  </select>
                  <input 
                    type="text"
                    value={filter.value || ''}
                    onChange={(e) => updateFilter(filter.id, 'value', e.target.value)}
                    placeholder="Value"
                    className={`border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-1 px-2`}
                  />
                  <button 
                    onClick={() => removeFilter(filter.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Data preview table */}
          {showDataTable && (
            <div className={`mt-4 border ${colorMode === 'dark' ? 'border-gray-600' : 'border-gray-200'} rounded-md overflow-x-auto`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={`${colorMode === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <tr>
                    {columns.map(column => (
                      <th 
                        key={column}
                        className={`px-6 py-3 text-left text-xs font-medium ${colorMode === 'dark' ? 'text-gray-200 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`${colorMode === 'dark' ? 'bg-gray-700' : 'bg-white'} divide-y divide-gray-200`}>
                  {filteredData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {columns.map(column => (
                        <td 
                          key={column}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${colorMode === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}
                        >
                          {row[column]?.toString() || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredData.length > 5 && (
                <div className={`px-6 py-3 ${colorMode === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-500'} text-sm`}>
                  Showing 5 of {filteredData.length} records
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Chart Builder */}
        <div className="mb-6">
          <h3 className={`text-xl font-medium text-${getThemeTextColor()} mb-4`}>Chart Builder</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
                Chart Type
              </label>
              <select 
                value={selectedChart}
                onChange={(e) => setSelectedChart(e.target.value)}
                className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
              >
                <option value="">Select chart type</option>
                {availableChartTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
                X-Axis
              </label>
              <select 
                value={selectedXAxis}
                onChange={(e) => setSelectedXAxis(e.target.value)}
                className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
              >
                <option value="">Select X-Axis</option>
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
                Y-Axis (Metrics)
              </label>
              <select 
                multiple
                value={selectedYAxis}
                onChange={(e) => {
                  const options = e.target.options;
                  const values = [];
                  for (let i = 0; i < options.length; i++) {
                    if (options[i].selected) {
                      values.push(options[i].value);
                    }
                  }
                  setSelectedYAxis(values);
                }}
                className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3 h-24`}
              >
                {columns.filter(col => {
                  // Only include numeric columns for Y-axis
                  return data.some(item => typeof item[col] === 'number');
                }).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <p className={`text-xs ${colorMode === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                Hold Ctrl/Cmd to select multiple
              </p>
            </div>
          </div>
          
          <div className="mt-4">
            <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
              Chart Title
            </label>
            <input 
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter chart title"
              className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
            />
          </div>
          
          <div className="mt-4">
            <button 
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className={`flex items-center text-${theme}-600 ${colorMode === 'dark' ? 'text-gray-200' : ''}`}
            >
              <Settings size={16} className="mr-1" /> {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
            </button>
          </div>
          
          {showAdvancedOptions && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
                  Color Scheme
                </label>
                <select 
                  value={chartColorScheme}
                  onChange={(e) => setChartColorScheme(e.target.value)}
                  className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
                >
                  <option value="default">Default (Theme Colors)</option>
                  <option value="colorful">Colorful</option>
                  <option value="monochrome">Monochrome</option>
                </select>
              </div>
              
              <div>
                <label className={`block text-sm font-medium text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mb-1`}>
                  Data Aggregation
                </label>
                <div className="flex space-x-2">
                  <select 
                    value={aggregationType}
                    onChange={(e) => setAggregationType(e.target.value)}
                    className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
                  >
                    <option value="none">None</option>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="min">Minimum</option>
                    <option value="max">Maximum</option>
                  </select>
                  
                  {aggregationType !== 'none' && (
                    <select 
                      value={aggregationField}
                      onChange={(e) => setAggregationField(e.target.value)}
                      className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
                    >
                      <option value="">Group by</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-2">
                  <input 
                    type="checkbox"
                    id="sortData"
                    checked={sortData}
                    onChange={(e) => setSortData(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label 
                    htmlFor="sortData" 
                    className={`ml-2 text-sm text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'}`}
                  >
                    Sort Data
                  </label>
                </div>
                
                {sortData && (
                  <div className="flex space-x-2">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
                    >
                      <option value="">Sort by</option>
                      {columns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                    
                    <select 
                      value={sortDirection}
                      onChange={(e) => setSortDirection(e.target.value)}
                      className={`border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : ''} rounded-md py-2 px-3`}
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={resetChartForm}
              className={`px-4 py-2 border border-${theme}-300 rounded-md text-${theme}-600 hover:bg-${theme}-50 mr-2 ${colorMode === 'dark' ? 'border-gray-600 text-gray-200 hover:bg-gray-600' : ''}`}
            >
              Reset
            </button>
            <button 
              onClick={addChart}
              className={`px-4 py-2 bg-${theme}-500 text-white rounded-md hover:bg-${theme}-600 flex items-center`}
              style={{backgroundColor: getThemeColor()}}
              disabled={!selectedChart || !selectedXAxis || selectedYAxis.length === 0}
            >
              <PlusCircle size={18} className="mr-2" /> {editingChartId ? 'Update Chart' : 'Add Chart'}
            </button>
          </div>
        </div>
        
        {/* Charts Preview */}
        {charts.length > 0 && (
          <div>
            <h3 className={`text-xl font-medium text-${getThemeTextColor()} mb-4`}>Charts Preview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {charts.map(chart => (
                <div 
                  key={chart.id} 
                  className={`chart-container bg-white ${colorMode === 'dark' ? 'bg-gray-800' : ''} rounded-lg shadow-md p-4`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chart.id)}
                  onDragOver={(e) => handleDragOver(e, chart.id)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-medium text-${getThemeTextColor()}`}>{chart.title}</h4>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => editChart(chart.id)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Settings size={16} />
                      </button>
                      <button 
                        onClick={() => removeChart(chart.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                      <button className="text-gray-500 hover:text-gray-700 cursor-move">
                        <Move size={16} />
                      </button>
                    </div>
                  </div>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-center">
              <button 
                onClick={goToDashboard}
                className={`px-6 py-3 bg-${theme}-500 text-white rounded-md hover:bg-${theme}-600 flex items-center`}
                style={{backgroundColor: getThemeColor()}}
              >
                <ChevronRight size={18} className="mr-2" /> Continue to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render dashboard page
  const renderDashboardPage = () => (
    <div className={`min-h-screen bg-${getThemeBgColor()}`}>
      {/* Dashboard Header */}
      <div className={`bg-white ${colorMode === 'dark' ? 'bg-gray-800' : ''} shadow-md`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center">
              <BarChart2 size={24} className={`text-${theme}-500 mr-2`} />
              <input 
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className={`text-xl font-bold text-${getThemeTextColor()} ${colorMode === 'dark' ? 'bg-gray-800' : 'bg-white'} border-b border-transparent focus:border-${theme}-300 focus:outline-none`}
              />
            </div>
            
            <div className="flex flex-wrap space-x-2">
              <button 
                onClick={() => setCurrentPage('select')}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
              >
                <RefreshCw size={14} className="mr-1" /> Edit
              </button>
              <button 
                onClick={() => setIsSlideoverOpen(true)}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
              >
                <PlusCircle size={14} className="mr-1" /> Add Chart
              </button>
              <button 
                onClick={saveDashboard}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
              >
                <Save size={14} className="mr-1" /> Save
              </button>
              <button 
                onClick={exportDashboard}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
              >
                <Download size={14} className="mr-1" /> Export
              </button>
              <button 
                onClick={() => setShowDataTable(!showDataTable)}
                className={`flex items-center px-3 py-1 rounded-md ${showDataTable ? `bg-${theme}-500 text-white` : colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
                style={showDataTable ? {backgroundColor: getThemeColor()} : {}}
              >
                <FileText size={14} className="mr-1" /> Data Table
              </button>
              <button 
                onClick={() => {}}
                className={`flex items-center px-3 py-1 rounded-md ${colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'} text-sm`}
              >
                <Share2 size={14} className="mr-1" /> Share
              </button>
              <div className="ml-2 flex items-center">
                <label className={`text-sm text-${colorMode === 'dark' ? 'gray-200' : 'gray-700'} mr-2`}>
                  Layout:
                </label>
                <div className="flex border border-gray-300 rounded-md overflow-hidden">
                  <button 
                    onClick={() => setGridLayout('1')}
                    className={`flex items-center justify-center w-8 h-8 ${gridLayout === '1' ? `bg-${theme}-500 text-white` : colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                    style={gridLayout === '1' ? {backgroundColor: getThemeColor()} : {}}
                  >
                    <Grid size={14} />
                  </button>
                  <button 
                    onClick={() => setGridLayout('2')}
                    className={`flex items-center justify-center w-8 h-8 ${gridLayout === '2' ? `bg-${theme}-500 text-white` : colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                    style={gridLayout === '2' ? {backgroundColor: getThemeColor()} : {}}
                  >
                    <Grid size={14} />
                  </button>
                  <button 
                    onClick={() => setGridLayout('3')}
                    className={`flex items-center justify-center w-8 h-8 ${gridLayout === '3' ? `bg-${theme}-500 text-white` : colorMode === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`}
                    style={gridLayout === '3' ? {backgroundColor: getThemeColor()} : {}}
                  >
                    <Grid size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      <div className="container mx-auto px-6 py-6">
        {/* Data table */}
        {showDataTable && (
          <div className={`mb-6 bg-white ${colorMode === 'dark' ? 'bg-gray-800' : ''} rounded-lg shadow-md p-4 overflow-x-auto`}>
            <h3 className={`text-lg font-medium text-${getThemeTextColor()} mb-3`}>Data Table</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={`${colorMode === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  {columns.map(column => (
                    <th 
                      key={column}
                      className={`px-6 py-3 text-left text-xs font-medium ${colorMode === 'dark' ? 'text-gray-200 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={`${colorMode === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200`}>
                {filteredData.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {columns.map(column => (
                      <td 
                        key={column}
                        className={`px-6 py-4 whitespace-nowrap text-sm ${colorMode === 'dark' ? 'text-gray-200' : 'text-gray-500'}`}
                      >
                        {row[column]?.toString() || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredData.length > 10 && (
              <div className={`px-6 py-3 ${colorMode === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-500'} text-sm`}>
                Showing 10 of {filteredData.length} records
              </div>
            )}
          </div>
        )}
        
        {/* Charts Grid */}
        <div ref={dashboardRef} className={`grid grid-cols-1 ${gridLayout === '2' ? 'md:grid-cols-2' : gridLayout === '3' ? 'md:grid-cols-3' : ''} gap-6`}>
        {charts.map(chart => (
            <div 
              key={chart.id}
              className={`chart-container ${colorMode === 'dark' ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-md p-4 mb-4`}
              style={{
                gridColumn: gridLayout === '1' ? 'span 3' : gridLayout === '3' ? 'span 1' : 'span 1.5',
              }}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, chart.id)}
              onDragOver={(e) => handleDragOver(e, chart.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="chart-header flex justify-between items-center mb-2">
                <h3 className={`font-semibold ${colorMode === 'dark' ? 'text-white' : 'text-gray-800'}`}>{chart.title}</h3>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => editChart(chart.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Settings size={16} />
                  </button>
                  <button 
                    onClick={() => removeChart(chart.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <div className="chart-content">
                {renderChart(chart)}
              </div>
            </div>
          ))}
        </div>
        </div>

      {/* Chart Creation/Editing Slideover */}
      {isSlideoverOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-40">
          <div 
            className={`absolute right-0 top-0 h-full w-full max-w-lg ${colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} shadow-xl overflow-y-auto`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingChartId ? 'Edit Chart' : 'Add New Chart'}
                </h2>
                <button 
                  onClick={() => setIsSlideoverOpen(false)}
                  className={`p-1 rounded-full ${colorMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-1 font-medium">Chart Type</label>
                  <select
                    value={selectedChart}
                    onChange={(e) => setSelectedChart(e.target.value)}
                    className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                  >
                    <option value="">Select chart type</option>
                    {availableChartTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">X-Axis</label>
                  <select
                    value={selectedXAxis}
                    onChange={(e) => setSelectedXAxis(e.target.value)}
                    className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                  >
                    <option value="">Select X-Axis</option>
                    {columns.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Y-Axis (Metrics)</label>
                  <select
                    multiple
                    value={selectedYAxis}
                    onChange={(e) => {
                      const options = e.target.options;
                      const values = [];
                      for (let i = 0; i < options.length; i++) {
                        if (options[i].selected) {
                          values.push(options[i].value);
                        }
                      }
                      setSelectedYAxis(values);
                    }}
                    className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3 h-24`}
                  >
                    {columns.filter(col => {
                      // Only include numeric columns for Y-axis
                      return data.some(item => typeof item[col] === 'number');
                    }).map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div>
                  <label className="block mb-1 font-medium">Chart Title</label>
                  <input
                    value={chartTitle}
                    onChange={(e) => setChartTitle(e.target.value)}
                    placeholder="Enter chart title"
                    className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                  />
                </div>

                <div>
                  <button
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className={`flex items-center text-${theme}-600 ${colorMode === 'dark' ? 'text-gray-200' : ''}`}
                  >
                    {showAdvancedOptions ? <X size={16} /> : <PlusCircle size={16} />} {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
                  </button>
                </div>

                {showAdvancedOptions && (
                  <div className="space-y-4 p-4 border border-gray-200 rounded-md">
                    <div>
                      <label className="block mb-1 font-medium">Color Scheme</label>
                      <select
                        value={chartColorScheme}
                        onChange={(e) => setChartColorScheme(e.target.value)}
                        className={`w-full border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                      >
                        <option value="default">Default (Theme Colors)</option>
                        <option value="colorful">Colorful</option>
                        <option value="monochrome">Monochrome</option>
                      </select>
                    </div>

                    <div>
                      <label className="block mb-1 font-medium">Data Aggregation</label>
                      <div className="flex space-x-2">
                        <select
                          value={aggregationType}
                          onChange={(e) => setAggregationType(e.target.value)}
                          className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                        >
                          <option value="none">None</option>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="min">Minimum</option>
                          <option value="max">Maximum</option>
                        </select>
                       
                        {aggregationType !== 'none' && (
                          <select
                            value={aggregationField}
                            onChange={(e) => setAggregationField(e.target.value)}
                            className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                          >
                            <option value="">Group by</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={sortData}
                          onChange={(e) => setSortData(e.target.checked)}
                          className="h-4 w-4"
                        />
                        <label className="ml-2">
                          Sort Data
                        </label>
                      </div>
                     
                      {sortData && (
                        <div className="flex space-x-2 mt-2">
                          <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`flex-1 border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                          >
                            <option value="">Sort by</option>
                            {columns.map(col => (
                              <option key={col} value={col}>{col}</option>
                            ))}
                          </select>
                         
                          <select
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value)}
                            className={`border border-gray-300 ${colorMode === 'dark' ? 'bg-gray-700 border-gray-600' : ''} rounded-md py-2 px-3`}
                          >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <button
                    onClick={resetChartForm}
                    className={`px-4 py-2 border border-gray-300 ${colorMode === 'dark' ? 'text-gray-200 border-gray-600' : 'text-gray-700'} rounded-md hover:bg-gray-100`}
                  >
                    Reset
                  </button>
                  <button
                    onClick={addChart}
                    className={`px-4 py-2 bg-${theme}-500 text-white rounded-md hover:bg-${theme}-600`}
                    style={{backgroundColor: getThemeColor()}}
                  >
                    {editingChartId ? 'Update Chart' : 'Add Chart'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Insights Panel */}
      {Object.keys(dataInsights).length > 0 && (
        <div 
          className={`fixed bottom-0 left-0 right-0 ${colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} shadow-lg z-30 transform transition-transform duration-300`}
          style={{ height: '30%', transform: 'translateY(100%)' }}
        >
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-bold flex items-center">
              <Info size={16} className="mr-2" /> Data Insights
            </h3>
            <button className={`p-1 rounded-full ${colorMode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
              <X size={16} />
            </button>
          </div>
          <div className="p-4 overflow-y-auto h-full">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(dataInsights).map(([column, insight]) => (
                <div key={column} className={`p-3 rounded-md ${colorMode === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="font-medium">{column}</h4>
                  <p>{insight}</p>
                  {dataStatistics[column] && (
                    <div className="mt-2 text-sm grid grid-cols-2 gap-2">
                      <div>Min: {dataStatistics[column].min.toFixed(2)}</div>
                      <div>Max: {dataStatistics[column].max.toFixed(2)}</div>
                      <div>Avg: {dataStatistics[column].avg.toFixed(2)}</div>
                      <div>Sum: {dataStatistics[column].sum.toFixed(2)}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
        accept=".csv,.json,.xlsx,.xls"
      />
    </div>
  );

  // Determine which page to render
  const renderPage = () => {
    switch (currentPage) {
      case 'upload':
        return renderUploadPage();
      case 'select':
        return renderChartSelectionPage();
      case 'dashboard':
        return renderDashboardPage();
      default:
        return renderUploadPage();
    }
  };

  return (
    <div 
      className={`min-h-screen ${colorMode === 'dark' ? 'bg-gray-900 text-white' : `bg-${getThemeBgColor()} text-gray-800`}`}
      style={colorMode === 'dark' ? {} : { backgroundColor: `rgb(${theme === 'orange' ? '255,247,237' : theme === 'blue' ? '239,246,255' : theme === 'green' ? '240,253,244' : '250,245,255'})` }}
    >
      {renderPage()}
    </div>
  );
}