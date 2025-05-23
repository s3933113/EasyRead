
import React, { useState } from 'react';
import { Brain, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface DataSummaryProps {
  data: any[];
  summaryData: any;
  onSummaryGenerated: (summary: any) => void;
  onNext: () => void;
  onBack: () => void;
  apiKey: string;
}

const DataSummary: React.FC<DataSummaryProps> = ({
  data,
  summaryData,
  onSummaryGenerated,
  onNext,
  onBack,
  apiKey
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const { toast } = useToast();

  const generateSummary = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Prepare data for analysis
      const sampleData = data.slice(0, 10); // Send first 10 rows for analysis
      const dataStructure = Object.keys(data[0]).join(', ');
      
      const prompt = customPrompt || `
        Analyze this dataset and provide a comprehensive summary. The data has ${data.length} rows with columns: ${dataStructure}.
        
        Sample data: ${JSON.stringify(sampleData, null, 2)}
        
        Please provide:
        1. A brief overview of what this data represents
        2. Key insights and patterns
        3. Important statistics or trends
        4. Potential areas of interest for learning/quizzing
        
        Format your response as JSON with these fields:
        {
          "overview": "Brief description",
          "insights": ["insight1", "insight2", ...],
          "keyMetrics": {"metric1": "value1", "metric2": "value2"},
          "learningTopics": ["topic1", "topic2", ...]
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a data analyst expert. Analyze data and provide insights in the specified JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const summary = JSON.parse(result.choices[0].message.content);
      
      onSummaryGenerated(summary);
      
      toast({
        title: "Summary Generated!",
        description: "AI analysis complete. Ready for visualization.",
      });
      
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-600 mb-6">Please upload a file first to continue.</p>
        <Button onClick={onBack} variant="outline">
          Go Back to Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Data Analysis</h2>
        <p className="text-lg text-gray-600">
          Let AI analyze your data and extract key insights for learning
        </p>
      </div>

      {!summaryData ? (
        <div className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Data Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Rows</p>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Columns</p>
                <p className="text-2xl font-bold text-green-600">{Object.keys(data[0]).length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <p className="text-sm text-gray-600">Data Points</p>
                <p className="text-2xl font-bold text-purple-600">{data.length * Object.keys(data[0]).length}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Analysis Prompt (Optional)
            </label>
            <Textarea
              placeholder="Describe what specific insights you'd like the AI to focus on..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-center">
            <Button
              onClick={generateSummary}
              disabled={isGenerating || !apiKey}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Data...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate AI Summary
                </>
              )}
            </Button>
          </div>

          {!apiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">API Key Required</p>
                  <p className="text-sm text-amber-600">
                    Please enter your OpenAI API key in the header to use AI analysis features.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 text-green-600">
            <CheckCircle className="w-6 h-6" />
            <h3 className="text-lg font-semibold">Analysis Complete!</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Overview</h4>
              <p className="text-gray-700">{summaryData.overview}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Key Metrics</h4>
              <div className="space-y-2">
                {Object.entries(summaryData.keyMetrics || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {summaryData.insights?.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-3">Learning Topics</h4>
              <div className="flex flex-wrap gap-2">
                {summaryData.learningTopics?.map((topic: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-amber-200 text-amber-800 rounded-full text-sm font-medium"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={onBack} variant="outline">
              Back to Upload
            </Button>
            <Button onClick={onNext} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Continue to Visual Map
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSummary;
