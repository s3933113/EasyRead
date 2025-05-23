
import React, { useState } from 'react';
import { Brain, Loader2, AlertTriangle, CheckCircle, FileText, BookOpen } from 'lucide-react';
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
      const sampleData = data.slice(0, 10);
      const dataStructure = Object.keys(data[0]).join(', ');
      
      const prompt = customPrompt || `
        You are an expert data analyst. Analyze this dataset thoroughly and provide a comprehensive summary that explains what the document/data is about.

        Dataset Information:
        - Total rows: ${data.length}
        - Columns: ${dataStructure}
        - Sample data: ${JSON.stringify(sampleData, null, 2)}

        Please provide a detailed analysis in JSON format with these specific fields:
        {
          "documentDescription": "Clear explanation of what this document/dataset represents and its main purpose",
          "mainTopics": [
            {
              "topic": "Topic name",
              "description": "Detailed explanation of this topic",
              "keyPoints": ["point1", "point2", "point3"]
            }
          ],
          "dataType": "What type of data this is (e.g., financial, educational, sales, etc.)",
          "keyInsights": ["insight1", "insight2", "insight3"],
          "keyMetrics": {"metric1": "value1", "metric2": "value2"},
          "learningObjectives": ["What someone can learn from this data"],
          "potentialQuestions": ["Questions that could be asked about this data for quizzes"]
        }

        Focus on explaining the document's content clearly and organizing information by logical topics.
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
              content: 'You are an expert data analyst who excels at explaining complex data in clear, organized topics. Always respond with valid JSON only, no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      let content = result.choices[0].message.content;
      
      // Clean up any markdown formatting that might be present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const summary = JSON.parse(content);
      
      onSummaryGenerated(summary);
      
      toast({
        title: "Document Analysis Complete!",
        description: "AI has analyzed your document and organized it by topics.",
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Data Available</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Please upload a file first to continue.</p>
        <Button onClick={onBack} variant="outline">
          Go Back to Upload
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">AI Document Analysis</h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Let AI analyze your document, organize it by topics, and explain what it's about
        </p>
      </div>

      {!summaryData ? (
        <div className="space-y-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 dark:text-white">Data Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Total Rows</p>
                <p className="text-2xl font-bold text-blue-600">{data.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Columns</p>
                <p className="text-2xl font-bold text-green-600">{Object.keys(data[0]).length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Data Points</p>
                <p className="text-2xl font-bold text-purple-600">{data.length * Object.keys(data[0]).length}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Custom Analysis Focus (Optional)
            </label>
            <Textarea
              placeholder="Describe what specific aspects of the document you'd like the AI to focus on..."
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
                  Analyzing Document...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Analyze & Organize by Topics
                </>
              )}
            </Button>
          </div>

          {!apiKey && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">API Key Required</p>
                  <p className="text-sm text-amber-600 dark:text-amber-300">
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
            <h3 className="text-lg font-semibold">Document Analysis Complete!</h3>
          </div>

          {/* Document Description */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">What This Document Is About</h4>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{summaryData.documentDescription}</p>
            <div className="mt-3 flex items-center space-x-2">
              <span className="px-3 py-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                Data Type: {summaryData.dataType}
              </span>
            </div>
          </div>

          {/* Main Topics */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="w-6 h-6 text-green-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Main Topics Covered</h4>
            </div>
            <div className="space-y-4">
              {summaryData.mainTopics?.map((topic: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-green-400">
                  <h5 className="font-semibold text-gray-900 dark:text-white mb-2">{topic.topic}</h5>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">{topic.description}</p>
                  <div className="space-y-1">
                    {topic.keyPoints?.map((point: string, pointIndex: number) => (
                      <div key={pointIndex} className="flex items-start space-x-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Key Insights</h4>
              <ul className="space-y-2">
                {summaryData.keyInsights?.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-gray-700 dark:text-gray-300">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Learning Objectives</h4>
              <div className="space-y-2">
                {summaryData.learningObjectives?.map((objective: string, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                  </div>
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
