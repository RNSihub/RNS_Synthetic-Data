import React, { useState } from 'react';
import Sidebar from '../components/nav';
import MainContent from '../syn/Main';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generator');
  const [generatedData, setGeneratedData] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dataConfig, setDataConfig] = useState({
    rows: 10,
    dataTypes: ['names', 'emails', 'addresses', 'phone'],
    format: 'json'
  });

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
