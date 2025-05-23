
import React, { useState } from 'react';
import { Upload, Brain, Map, HelpCircle } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import DataSummary from '@/components/DataSummary';
import DataMapping from '@/components/DataMapping';
import QuizSection from '@/components/QuizSection';
import ApiKeyInput from '@/components/ApiKeyInput';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadedData, setUploadedData] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [apiKey, setApiKey] = useState('');

  const steps = [
    { id: 1, title: 'Upload Data', icon: Upload, component: FileUpload },
    { id: 2, title: 'AI Summary', icon: Brain, component: DataSummary },
    { id: 3, title: 'Visual Map', icon: Map, component: DataMapping },
    { id: 4, title: 'Generate Quiz', icon: HelpCircle, component: QuizSection },
  ];

  const renderCurrentStep = () => {
    const StepComponent = steps[currentStep - 1].component;
    const commonProps = {
      data: uploadedData,
      onNext: () => setCurrentStep(prev => Math.min(prev + 1, 4)),
      onBack: () => setCurrentStep(prev => Math.max(prev - 1, 1)),
      apiKey: apiKey,
      currentStep: currentStep
    };

    // Add specific props based on component type
    if (currentStep === 1) {
      return <StepComponent {...commonProps} onDataUpload={setUploadedData} />;
    } else if (currentStep === 2) {
      return <StepComponent {...commonProps} onSummaryGenerated={setSummaryData} />;
    } else if (currentStep === 3) {
      return <StepComponent {...commonProps} summaryData={summaryData} />;
    } else if (currentStep === 4) {
      return <StepComponent {...commonProps} summaryData={summaryData} />;
    }

    return <StepComponent {...commonProps} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DataMind
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Data Analysis & Learning</p>
              </div>
            </div>
            <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : isCompleted
                      ? 'bg-green-600 border-green-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div className="ml-3 mr-8">
                  <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-4 rounded-full transition-all duration-300 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {renderCurrentStep()}
        </div>
      </div>
    </div>
  );
};

export default Index;
