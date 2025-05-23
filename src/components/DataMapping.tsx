
import React from 'react';
import { Map, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataMappingProps {
  data: any[];
  summaryData: any;
  onNext: () => void;
  onBack: () => void;
}

const DataMapping: React.FC<DataMappingProps> = ({ data, summaryData, onNext, onBack }) => {
  if (!data || !summaryData) {
    return (
      <div className="p-8 text-center">
        <Map className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data to Visualize</h2>
        <p className="text-gray-600 mb-6">Please complete the previous steps first.</p>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  // Get numeric columns for visualization
  const numericColumns = Object.keys(data[0]).filter(key => {
    const values = data.slice(0, 10).map(row => row[key]);
    return values.some(val => !isNaN(Number(val)) && val !== '');
  });

  // Create simple visualizations
  const createBarData = () => {
    if (numericColumns.length === 0) return [];
    
    const column = numericColumns[0];
    const values = data.slice(0, 10).map(row => ({
      name: String(row[Object.keys(row)[0]]).substring(0, 10),
      value: Number(row[column]) || 0
    }));
    
    return values;
  };

  const barData = createBarData();

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Visual Data Map</h2>
        <p className="text-lg text-gray-600">
          Interactive visualization of your analyzed data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Concept Map */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Map className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold">Concept Map</h3>
          </div>
          
          <div className="relative h-64 bg-white rounded-lg p-4 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                Main Topic
              </div>
            </div>
            
            {summaryData.learningTopics?.slice(0, 4).map((topic: string, index: number) => {
              const positions = [
                { top: '10%', left: '20%' },
                { top: '10%', right: '20%' },
                { bottom: '10%', left: '20%' },
                { bottom: '10%', right: '20%' }
              ];
              
              return (
                <div
                  key={index}
                  className="absolute w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xs font-medium text-center p-2"
                  style={positions[index]}
                >
                  {topic.substring(0, 15)}
                </div>
              );
            })}
            
            {/* Connection lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <line x1="50%" y1="50%" x2="30%" y2="20%" stroke="#e5e7eb" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="70%" y2="20%" stroke="#e5e7eb" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="30%" y2="80%" stroke="#e5e7eb" strokeWidth="2" />
              <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="#e5e7eb" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Data Visualization */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold">Data Visualization</h3>
          </div>
          
          <div className="bg-white rounded-lg p-4 h-64">
            {barData.length > 0 ? (
              <div className="flex items-end justify-between h-full space-x-2">
                {barData.map((item, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-300 rounded-t"
                      style={{
                        height: `${(item.value / Math.max(...barData.map(d => d.value))) * 80}%`,
                        minHeight: '10px'
                      }}
                    ></div>
                    <span className="text-xs mt-2 text-center">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <PieChart className="w-12 h-12 mx-auto mb-2" />
                  <p>No numeric data found for visualization</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Insights Map */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold">Key Insights</h3>
          </div>
          
          <div className="space-y-3">
            {summaryData.insights?.slice(0, 4).map((insight: string, index: number) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border-l-4 border-purple-400"
              >
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Pathway */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Map className="w-6 h-6 text-amber-600" />
            <h3 className="text-lg font-semibold">Learning Pathway</h3>
          </div>
          
          <div className="space-y-3">
            {summaryData.learningTopics?.map((topic: string, index: number) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div className="flex-1 bg-white rounded-lg p-2">
                  <span className="text-sm font-medium">{topic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          Back to Summary
        </Button>
        <Button onClick={onNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Generate Quiz
        </Button>
      </div>
    </div>
  );
};

export default DataMapping;
