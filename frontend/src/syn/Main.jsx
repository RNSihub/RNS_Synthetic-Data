import React from 'react';
import GeneratorTab from '../syn/GeneratorTab';
import PreviewTab from '../syn/PreviewTab';
import ValidationTab from '../syn/ValidationTab';
import CleaningTab from '../syn/CleaningTab';
import ExportTab from '../syn/ExportTab';
import Visual from '../syn/Visualizer';
import Bot from '../syn/Bot';
import SettingsTab from '../syn/SettingsTab';

const MainContent = ({
  activeTab,
  generatedData,
  dataConfig,
  isGenerating,
  handleGenerate,
  handleClearData,
  handleConfigChange,
  handleExport,
  setActiveTab // <-- Important for Preview, Bot, Validation, etc.
}) => {
  const renderTab = () => {
    switch (activeTab) {
      case 'generator':
        return (
          <GeneratorTab
            generatedData={generatedData}
            dataConfig={dataConfig}
            isGenerating={isGenerating}
            handleGenerate={handleGenerate}
            handleClearData={handleClearData}
            handleConfigChange={handleConfigChange}
          />
        );
      case 'preview':
        return <PreviewTab generatedData={generatedData} setActiveTab={setActiveTab} />;
      case 'validation':
        return <ValidationTab generatedData={generatedData} setActiveTab={setActiveTab} />;
      case 'cleaning':
        return <CleaningTab generatedData={generatedData} setActiveTab={setActiveTab} />;
      case 'export':
        return <ExportTab generatedData={generatedData} handleExport={handleExport} />;
      case 'visualizer':
        return <Visual generatedData={generatedData} />;
      case 'bot':
        return <Bot generatedData={generatedData} />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {renderTab()}
    </main>
  );
};

export default MainContent;
