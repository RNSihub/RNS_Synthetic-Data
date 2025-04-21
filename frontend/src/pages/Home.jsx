import React, { useState, useEffect } from 'react';
import Sidebar from '../components/nav';
import MainContent from '../syn/Main';
import Loading from '../components/loading'; // Import the Loading component

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generator');
  const [generatedData, setGeneratedData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataConfig, setDataConfig] = useState({
    rows: 10,
    dataTypes: ['names', 'emails', 'addresses', 'phone'],
    format: 'json'
  });
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state

  useEffect(() => {
    // Simulate a loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 6500);

    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const mockData = Array(dataConfig.rows).fill().map((_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@example.com`,
        address: `${100 + i} Main St, City`,
        phone: `555-${String(1000 + i).slice(1)}`
      }));
      setGeneratedData(mockData);
      setIsGenerating(false);
    }, 1500);
  };

  const handleClearData = () => {
    setGeneratedData([]);
  };

  const handleConfigChange = (key, value) => {
    setDataConfig({
      ...dataConfig,
      [key]: value
    });
  };

  const handleExport = (format) => {
    alert(`Exporting data in ${format} format...`);
  };

  if (isLoading) {
    return <Loading />; // Render the Loading component if isLoading is true
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <MainContent
        activeTab={activeTab}
        generatedData={generatedData}
        dataConfig={dataConfig}
        isGenerating={isGenerating}
        handleGenerate={handleGenerate}
        handleClearData={handleClearData}
        handleConfigChange={handleConfigChange}
        handleExport={handleExport}
      />
    </div>
  );
}
