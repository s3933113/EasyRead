import React, { useState } from 'react';
import { HelpCircle, Loader2, CheckCircle, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';

interface QuizSectionProps {
  data: any[];
  summaryData: any;
  onBack: () => void;
  apiKey: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const QuizSection: React.FC<QuizSectionProps> = ({ data, summaryData, onBack, apiKey }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<number[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, description: string, type: 'success' | 'error'} | null>(null);

  // Toast function replacement
  const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ title, description, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const generateQuiz = async () => {
    if (!apiKey) {
      showToast("API Key Required", "Please enter your OpenAI API key to generate quiz questions.", 'error');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Prepare context from summary data and original data
      const context = {
        documentDescription: summaryData?.documentDescription || 'Data analysis document',
        mainTopics: summaryData?.mainTopics || [],
        keyInsights: summaryData?.keyInsights || [],
        learningObjectives: summaryData?.learningObjectives || [],
        dataType: summaryData?.dataType || 'General data',
        sampleData: data?.slice(0, 5) || [],
        totalRows: data?.length || 0,
        columns: data?.[0] ? Object.keys(data[0]) : []
      };

      const prompt = `
        You are an expert quiz generator. Based on the following data analysis and document content, create exactly 5 multiple-choice questions that test understanding of the key concepts, insights, and learning objectives.

        Document Context:
        - Description: ${context.documentDescription}
        - Data Type: ${context.dataType}
        - Total Data Points: ${context.totalRows}
        - Columns: ${context.columns.join(', ')}

        Main Topics:
        ${context.mainTopics.map((topic: any, index: number) => 
          `${index + 1}. ${topic.topic}: ${topic.description}`
        ).join('\n')}

        Key Insights:
        ${context.keyInsights.map((insight: string, index: number) => 
          `${index + 1}. ${insight}`
        ).join('\n')}

        Learning Objectives:
        ${context.learningObjectives.map((objective: string, index: number) => 
          `${index + 1}. ${objective}`
        ).join('\n')}

        Sample Data Structure:
        ${JSON.stringify(context.sampleData, null, 2)}

        Please generate exactly 5 multiple-choice questions in JSON format with this exact structure:
        {
          "questions": [
            {
              "question": "Clear, specific question about the content",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct": 0,
              "explanation": "Detailed explanation of why this answer is correct"
            }
          ]
        }

        Requirements:
        - Questions should test understanding of the actual content and insights
        - Each question should have exactly 4 options
        - The "correct" field should be the index (0-3) of the correct answer
        - Explanations should be educational and reference the actual data/insights
        - Vary the difficulty from basic comprehension to analysis
        - Make questions specific to the document content, not generic
        - Ensure all questions are answerable based on the provided context

        Return only valid JSON, no markdown formatting.
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
              content: 'You are an expert educational content creator who generates high-quality quiz questions based on data analysis. Always respond with valid JSON only, no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      let content = result.choices[0].message.content;
      
      // Clean up any markdown formatting that might be present
      content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      
      const quizData = JSON.parse(content);
      
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz format received from API');
      }

      // Validate quiz questions
      const validQuestions = quizData.questions.filter((q: any) => 
        q.question && 
        Array.isArray(q.options) && 
        q.options.length === 4 &&
        typeof q.correct === 'number' &&
        q.correct >= 0 && 
        q.correct < 4 &&
        q.explanation
      );

      if (validQuestions.length === 0) {
        throw new Error('No valid questions generated');
      }

      setQuiz(validQuestions);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setAnsweredQuestions([]);
      setQuizCompleted(false);
      
      showToast("Quiz Generated!", `Ready to test your knowledge with ${validQuestions.length} questions.`);
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      let errorMessage = 'Failed to generate quiz. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Invalid API key. Please check your OpenAI API key.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Rate limit exceeded. Please try again in a moment.';
        } else if (error.message.includes('insufficient_quota')) {
          errorMessage = 'API quota exceeded. Please check your OpenAI account.';
        }
      }
      
      showToast("Error", errorMessage, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return; // Prevent selection after answer is revealed
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quiz[currentQuestion].correct;
    
    // Update score immediately if correct
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    // Add to answered questions
    setAnsweredQuestions(prev => [...prev, selectedAnswer]);
    
    // Show result
    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
      // Move to next question
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      showToast("Quiz Completed!", `You scored ${score} out of ${quiz.length} questions correctly!`);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions([]);
    setQuizCompleted(false);
  };

  if (!data || !summaryData) {
    return (
      <div className="p-8 text-center">
        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-600 mb-6">Please complete the analysis steps first.</p>
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
      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
          toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          <h4 className="font-semibold">{toastMessage.title}</h4>
          <p className="text-sm">{toastMessage.description}</p>
        </div>
      )}

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Quiz</h2>
        <p className="text-lg text-gray-600">
          Test your understanding of the data insights with AI-generated questions
        </p>
      </div>

      {quiz.length === 0 ? (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8">
            <HelpCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">Ready to Generate Quiz?</h3>
            <p className="text-gray-600 mb-6">
              Create personalized questions based on your data analysis using AI
            </p>
            
            <button
              onClick={generateQuiz}
              disabled={isGenerating || !apiKey}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Quiz with AI...
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Generate AI Quiz
                </>
              )}
            </button>

            {!apiKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6 text-left">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">API Key Required</p>
                    <p className="text-sm text-amber-600 mt-1">
                      Please enter your OpenAI API key in the header to generate personalized quiz questions based on your data.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Visual Map
          </button>
        </div>
      ) : quizCompleted ? (
        // Quiz Completion Screen
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                score / quiz.length >= 0.8 ? 'bg-gradient-to-r from-green-500 to-blue-500' :
                score / quiz.length >= 0.6 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                'bg-gradient-to-r from-red-500 to-pink-500'
              }`}>
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h3 className="text-3xl font-bold mb-4">🎉 Quiz Completed!</h3>
              
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="text-4xl font-bold mb-2">
                  <span className={`${
                    score / quiz.length >= 0.8 ? 'text-green-600' : 
                    score / quiz.length >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {score}
                  </span>
                  <span className="text-gray-400 text-2xl"> / {quiz.length}</span>
                </div>
                
                <div className={`text-2xl font-semibold mb-2 ${
                  score / quiz.length >= 0.8 ? 'text-green-600' : 
                  score / quiz.length >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round((score / quiz.length) * 100)}%
                </div>
                
                <p className="text-lg text-gray-600">
                  {score / quiz.length >= 0.8 ? 'Excellent work! 🌟' :
                   score / quiz.length >= 0.6 ? 'Good job! 👍' :
                   'Keep learning! 📚'}
                </p>
              </div>

              {/* Performance breakdown */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-green-600 font-semibold">Correct</div>
                  <div className="text-2xl font-bold text-green-700">{score}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <div className="text-red-600 font-semibold">Incorrect</div>
                  <div className="text-2xl font-bold text-red-700">{quiz.length - score}</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-blue-600 font-semibold">Total</div>
                  <div className="text-2xl font-bold text-blue-700">{quiz.length}</div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={resetQuiz}
                className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake Quiz
              </button>
              <button
                onClick={() => {
                  setQuiz([]);
                  resetQuiz();
                }}
                className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Generate New Quiz
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Visual Map
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Quiz Questions Screen
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {quiz.length}</span>
              <span>Score: {score}/{currentQuestion + (showResult ? 1 : 0)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold mb-4">
                {quiz[currentQuestion]?.question}
              </h3>
              
              <div className="space-y-3">
                {quiz[currentQuestion]?.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showResult}
                    className={`w-full p-4 text-left border-2 rounded-lg transition-all duration-200 ${
                      showResult
                        ? index === quiz[currentQuestion].correct
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : index === selectedAnswer && index !== quiz[currentQuestion].correct
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200'
                        : selectedAnswer === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        showResult
                          ? index === quiz[currentQuestion].correct
                            ? 'bg-green-500 text-white'
                            : index === selectedAnswer && index !== quiz[currentQuestion].correct
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700' 
                          : selectedAnswer === index
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && (
                        index === quiz[currentQuestion].correct 
                          ? <CheckCircle className="w-5 h-5 text-green-600 ml-auto" />
                          : index === selectedAnswer && index !== quiz[currentQuestion].correct
                            ? <XCircle className="w-5 h-5 text-red-600 ml-auto" />
                            : null
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {showResult && (
              <div className={`p-4 rounded-lg mb-6 ${
                selectedAnswer === quiz[currentQuestion].correct
                  ? 'bg-green-50 border-l-4 border-green-500'
                  : 'bg-red-50 border-l-4 border-red-500'
              }`}>
                <p className={`font-semibold mb-1 ${
                  selectedAnswer === quiz[currentQuestion].correct
                    ? 'text-green-700'
                    : 'text-red-700'
                }`}>
                  {selectedAnswer === quiz[currentQuestion].correct
                    ? '✅ Correct!'
                    : '❌ Incorrect!'}
                </p>
                <p className="text-gray-700">
                  {quiz[currentQuestion]?.explanation}
                </p>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={onBack}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Exit Quiz
              </button>
              
              {!showResult ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Submit Answer
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {currentQuestion < quiz.length - 1 ? 'Next Question →' : 'View Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizSection;