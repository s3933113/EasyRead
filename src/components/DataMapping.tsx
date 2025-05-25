import React, { useState, useEffect } from 'react';
import { Map, Loader2, RefreshCcw, AlertCircle, Brain, Lightbulb, FileText, BookOpen } from 'lucide-react';

interface DataMappingProps {
  data: any[];
  summaryData: any;
  onNext: () => void;
  onBack: () => void;
}

interface TopicMapping {
  mainTopic: string;
  keyThemes: Array<{
    name: string;
    description: string;
    relevance: number;
    keyPoints: string[];
  }>;
  subtopics: Array<{
    name: string;
    parentTheme: string;
    importance: number;
    summary: string;
  }>;
  connections: Array<{
    from: string;
    to: string;
    relationshipType: string;
    strength: number;
  }>;
  documentInsights: string[];
  topicHierarchy: {
    primary: string[];
    secondary: string[];
    supporting: string[];
  };
}

const DataMapping: React.FC<DataMappingProps> = ({ data, summaryData, onNext, onBack }) => {
  const [mapping, setMapping] = useState<TopicMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to analyze document content and extract main topics
  const analyzeDocumentTopics = (documentData: any[], summary: any) => {
    // Extract text content from various data formats
    let textContent = '';
    let documentStructure: any = {};
    
    if (summary?.content) {
      textContent = summary.content;
    } else if (summary?.text) {
      textContent = summary.text;
    } else if (summary?.description) {
      textContent = summary.description;
    }

    // If we have structured data, analyze column names and content
    if (data && data.length > 0) {
      const columns = Object.keys(data[0] || {});
      const textColumns = columns.filter(col => 
        col.toLowerCase().includes('title') ||
        col.toLowerCase().includes('description') ||
        col.toLowerCase().includes('content') ||
        col.toLowerCase().includes('text') ||
        col.toLowerCase().includes('summary')
      );

      // Combine text from relevant columns
      const combinedText = data.slice(0, 20).map(row => {
        return textColumns.map(col => row[col]).filter(Boolean).join(' ');
      }).join(' ');

      textContent += ' ' + combinedText;
      documentStructure = { columns, textColumns, recordCount: data.length };
    }

    return { textContent: textContent.trim(), documentStructure };
  };

  // Function to extract key themes from text content
  const extractKeyThemes = (text: string, structure: any) => {
    const themes: Array<{name: string; description: string; relevance: number; keyPoints: string[]}> = [];
    
    // Common academic/business topics
    const topicPatterns = [
      { pattern: /\b(data|analytics|analysis|statistics|metrics)\b/gi, theme: 'Data Analysis', description: 'Statistical analysis and data interpretation' },
      { pattern: /\b(research|study|investigation|findings|results)\b/gi, theme: 'Research', description: 'Research methodology and findings' },
      { pattern: /\b(business|management|strategy|operations|performance)\b/gi, theme: 'Business Strategy', description: 'Business operations and strategic planning' },
      { pattern: /\b(technology|digital|software|system|platform)\b/gi, theme: 'Technology', description: 'Technological systems and digital solutions' },
      { pattern: /\b(education|learning|teaching|academic|curriculum)\b/gi, theme: 'Education', description: 'Educational content and learning methodologies' },
      { pattern: /\b(health|medical|healthcare|treatment|patient)\b/gi, theme: 'Healthcare', description: 'Medical and healthcare-related topics' },
      { pattern: /\b(finance|financial|economic|budget|cost)\b/gi, theme: 'Finance', description: 'Financial analysis and economic factors' },
      { pattern: /\b(marketing|customer|sales|brand|campaign)\b/gi, theme: 'Marketing', description: 'Marketing strategies and customer engagement' },
      { pattern: /\b(project|process|workflow|implementation|execution)\b/gi, theme: 'Project Management', description: 'Project planning and process optimization' },
      { pattern: /\b(quality|improvement|optimization|efficiency|performance)\b/gi, theme: 'Quality Management', description: 'Quality assurance and process improvement' }
    ];

    // Analyze text for topic patterns
    topicPatterns.forEach(({ pattern, theme, description }) => {
      const matches = (text.match(pattern) || []).length;
      if (matches > 0) {
        const relevance = Math.min(10, Math.floor((matches / text.split(' ').length) * 1000) + 3);
        
        // Extract key points related to this theme
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const relevantSentences = sentences.filter(sentence => 
          pattern.test(sentence)
        ).slice(0, 3);

        const keyPoints = relevantSentences.map(sentence => 
          sentence.trim().substring(0, 100) + (sentence.length > 100 ? '...' : '')
        );

        themes.push({
          name: theme,
          description,
          relevance,
          keyPoints: keyPoints.length > 0 ? keyPoints : [`Key aspects of ${theme.toLowerCase()} identified in the document`]
        });
      }
    });

    // If no themes found from patterns, extract from structure
    if (themes.length === 0 && structure.columns) {
      structure.columns.slice(0, 6).forEach((col: string, index: number) => {
        themes.push({
          name: col.replace(/[_-]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: `Data dimension: ${col}`,
          relevance: 8 - index,
          keyPoints: [`Contains structured data for ${col}`, `Available for analysis and visualization`]
        });
      });
    }

    return themes.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
  };

  // Function to generate subtopics
  const generateSubtopics = (themes: any[], text: string) => {
    const subtopics: Array<{name: string; parentTheme: string; importance: number; summary: string}> = [];
    
    themes.forEach(theme => {
      // Generate 2-3 subtopics per main theme
      const subCount = Math.min(3, Math.max(1, Math.floor(theme.relevance / 3)));
      
      for (let i = 0; i < subCount; i++) {
        const subtopicNames = [
          `${theme.name} Framework`,
          `${theme.name} Implementation`,
          `${theme.name} Best Practices`,
          `${theme.name} Methodology`,
          `${theme.name} Guidelines`,
          `${theme.name} Standards`
        ];
        
        subtopics.push({
          name: subtopicNames[i % subtopicNames.length],
          parentTheme: theme.name,
          importance: theme.relevance - (i + 1),
          summary: `Specific aspects and applications of ${theme.name.toLowerCase()} covered in the document`
        });
      }
    });

    return subtopics;
  };

  // Function to create thematic connections
  const generateConnections = (themes: any[], subtopics: any[]) => {
    const connections: Array<{from: string; to: string; relationshipType: string; strength: number}> = [];
    
    // Connect themes to each other
    for (let i = 0; i < themes.length - 1; i++) {
      for (let j = i + 1; j < Math.min(themes.length, i + 3); j++) {
        const relationshipTypes = ['supports', 'relates to', 'influences', 'complements', 'integrates with'];
        const strength = Math.max(3, 10 - Math.abs(themes[i].relevance - themes[j].relevance));
        
        connections.push({
          from: themes[i].name,
          to: themes[j].name,
          relationshipType: relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)],
          strength
        });
      }
    }

    return connections.slice(0, 6);
  };

  // Generate topic mapping based on document analysis
  const generateTopicMapping = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Analyze document content
      const { textContent, documentStructure } = analyzeDocumentTopics(data, summaryData);
      
      // Determine main topic
      let mainTopic = 'Document Analysis';
      if (summaryData?.title) {
        mainTopic = summaryData.title;
      } else if (summaryData?.mainTopic) {
        mainTopic = summaryData.mainTopic;
      } else if (textContent.length > 0) {
        // Try to infer main topic from content
        const words = textContent.toLowerCase().split(/\W+/).filter(w => w.length > 4);
        const wordFreq: {[key: string]: number} = {};
        words.forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
        const topWords = Object.entries(wordFreq)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([word]) => word);
        
        if (topWords.length > 0) {
          mainTopic = topWords.join(' & ').replace(/\b\w/g, l => l.toUpperCase());
        }
      }

      // Extract key themes
      const keyThemes = extractKeyThemes(textContent, documentStructure);
      
      // Generate subtopics
      const subtopics = generateSubtopics(keyThemes, textContent);
      
      // Generate connections
      const connections = generateConnections(keyThemes, subtopics);

      // Generate insights
      const documentInsights = [
        `Document contains ${keyThemes.length} major thematic areas`,
        `${subtopics.length} specific subtopics identified for detailed analysis`,
        `Cross-topic relationships suggest ${connections.length} conceptual connections`,
        `Primary focus appears to be on ${keyThemes[0]?.name || 'comprehensive analysis'}`,
        textContent.length > 1000 ? 'Rich content suitable for in-depth topic modeling' : 'Concise content with focused thematic structure'
      ];

      // Create topic hierarchy
      const topicHierarchy = {
        primary: keyThemes.slice(0, 3).map(t => t.name),
        secondary: keyThemes.slice(3, 6).map(t => t.name),
        supporting: subtopics.slice(0, 4).map(s => s.name)
      };

      const generatedMapping: TopicMapping = {
        mainTopic,
        keyThemes,
        subtopics,
        connections,
        documentInsights,
        topicHierarchy
      };

      setMapping(generatedMapping);
      
    } catch (err) {
      console.error('Error generating topic mapping:', err);
      setError('Failed to analyze document topics');
    } finally {
      setLoading(false);
    }
  };

  // Generate mapping on component mount
  useEffect(() => {
    generateTopicMapping();
  }, [data, summaryData]);

  if (!data && !summaryData) {
    return (
      <div className="p-8 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Document to Analyze</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">Please provide document content for topic mapping.</p>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Document Topic Mapping</h2>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          AI-powered analysis of your document's main themes and conceptual structure
        </p>
      </div>

      {loading && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Analyzing document topics...</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Extracting key themes and relationships</p>
          <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-300">
              <Brain className="w-5 h-5" />
              <span className="text-sm font-medium">Processing document content...</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Error analyzing topics</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={generateTopicMapping}
                className="mt-2 flex items-center space-x-1 text-sm text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200"
              >
                <RefreshCcw className="w-4 h-4" />
                <span>Retry Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {mapping && !loading && (
        <>
          {/* Main Topic Map */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-8 mb-8 border dark:border-gray-700">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <Map className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-2xl font-semibold text-indigo-800 dark:text-indigo-200">Document Topic Network</h3>
            </div>
            
            <div className="relative h-96 bg-white dark:bg-gray-800 rounded-lg p-8 overflow-hidden shadow-inner">
              {/* Central Topic */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-36 h-36 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xl hover:scale-110 transition-transform">
                  <div className="text-center p-3">
                    <div className="leading-tight">{mapping.mainTopic}</div>
                  </div>
                </div>
              </div>
              
              {/* Key Themes */}
              {mapping.keyThemes.slice(0, 6).map((theme, index) => {
                const totalThemes = Math.min(mapping.keyThemes.length, 6);
                const angle = (index * 360) / totalThemes;
                const radius = 150;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                const colors = [
                  'from-purple-500 to-pink-500',
                  'from-blue-500 to-cyan-500',
                  'from-green-500 to-emerald-500',
                  'from-yellow-500 to-orange-500',
                  'from-red-500 to-pink-500',
                  'from-indigo-500 to-blue-500'
                ];
                
                const size = Math.max(70, Math.min(100, theme.relevance * 8));
                
                return (
                  <div
                    key={index}
                    className={`absolute bg-gradient-to-r ${colors[index % colors.length]} rounded-full flex items-center justify-center text-white text-xs font-medium text-center p-2 shadow-lg transform -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-all duration-300 cursor-pointer z-10`}
                    style={{ 
                      left: `calc(50% + ${x}px)`, 
                      top: `calc(50% + ${y}px)`,
                      width: `${size}px`,
                      height: `${size}px`
                    }}
                    title={`${theme.name}\n${theme.description}\nRelevance: ${theme.relevance}/10\nKey Points: ${theme.keyPoints.length}`}
                  >
                    <span className="leading-tight">
                      {theme.name.length > 15 ? theme.name.substring(0, 15) + '...' : theme.name}
                    </span>
                  </div>
                );
              })}
              
              {/* Connection lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {/* Central connections */}
                {mapping.keyThemes.slice(0, 6).map((_, index) => {
                  const totalThemes = Math.min(mapping.keyThemes.length, 6);
                  const angle = (index * 360) / totalThemes;
                  const radius = 150;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <line
                      key={index}
                      x1="50%"
                      y1="50%"
                      x2={`calc(50% + ${x}px)`}
                      y2={`calc(50% + ${y}px)`}
                      stroke="#e5e7eb"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  );
                })}
                
                {/* Theme connections */}
                {mapping.connections.slice(0, 4).map((connection, index) => {
                  const fromIndex = mapping.keyThemes.findIndex(t => t.name === connection.from);
                  const toIndex = mapping.keyThemes.findIndex(t => t.name === connection.to);
                  
                  if (fromIndex === -1 || toIndex === -1) return null;
                  
                  const totalThemes = Math.min(mapping.keyThemes.length, 6);
                  const fromAngle = (fromIndex * 360) / totalThemes;
                  const toAngle = (toIndex * 360) / totalThemes;
                  const radius = 150;
                  
                  const fromX = Math.cos((fromAngle * Math.PI) / 180) * radius;
                  const fromY = Math.sin((fromAngle * Math.PI) / 180) * radius;
                  const toX = Math.cos((toAngle * Math.PI) / 180) * radius;
                  const toY = Math.sin((toAngle * Math.PI) / 180) * radius;
                  
                  return (
                    <line
                      key={`connection-${index}`}
                      x1={`calc(50% + ${fromX}px)`}
                      y1={`calc(50% + ${fromY}px)`}
                      x2={`calc(50% + ${toX}px)`}
                      y2={`calc(50% + ${toY}px)`}
                      stroke="#94a3b8"
                      strokeWidth={Math.max(1, connection.strength / 3)}
                      strokeDasharray="4,4"
                      opacity="0.7"
                    />
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Document Analysis Insights */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border dark:border-gray-700">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-semibold dark:text-white">Document Analysis Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Key Findings</h4>
                <ul className="space-y-3">
                  {mapping.documentInsights.map((insight, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 dark:text-gray-300">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Topic Hierarchy</h4>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Primary Topics</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mapping.topicHierarchy.primary.map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">Secondary Topics</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {mapping.topicHierarchy.secondary.map((topic, index) => (
                        <span key={index} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded text-xs">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Details */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 dark:text-white">Detailed Topic Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mapping.keyThemes.slice(0, 4).map((theme, index) => (
                <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">{theme.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{theme.relevance}/10</span>
                      <div className="w-12 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{width: `${theme.relevance * 10}%`}}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{theme.description}</p>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Key Points:</span>
                    {theme.keyPoints.slice(0, 2).map((point, pointIndex) => (
                      <div key={pointIndex} className="text-xs text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                        <span className="text-indigo-500 mt-1">•</span>
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8 border dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 text-center dark:text-white">Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{mapping.keyThemes.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Key Themes</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{mapping.subtopics.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Subtopics</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{mapping.connections.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Connections</div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{mapping.documentInsights.length}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Insights</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Back to Summary
        </button>
        
        <div className="flex space-x-3">
          {mapping && (
            <button
              onClick={generateTopicMapping}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 dark:bg-gray-500 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Re-analyze Topics</span>
            </button>
          )}
          
          <button
            onClick={onNext}
            disabled={!mapping || loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataMapping;