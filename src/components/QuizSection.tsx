
import React, { useState } from 'react';
import { HelpCircle, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const generateQuiz = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to generate quiz.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = `
        Based on this data analysis, create a 5-question multiple choice quiz to test understanding:
        
        Overview: ${summaryData.overview}
        Insights: ${summaryData.insights?.join(', ')}
        Learning Topics: ${summaryData.learningTopics?.join(', ')}
        
        Create questions that test:
        1. Understanding of key concepts
        2. Data interpretation skills
        3. Pattern recognition
        4. Critical thinking about the insights
        
        Format as JSON array:
        [
          {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": 0,
            "explanation": "Why this answer is correct"
          }
        ]
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
              content: 'You are an educational expert creating quiz questions. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const quizData = JSON.parse(result.choices[0].message.content);
      
      setQuiz(quizData);
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setScore(0);
      setAnsweredQuestions([]);
      
      toast({
        title: "Quiz Generated!",
        description: `Ready to test your knowledge with ${quizData.length} questions.`,
      });
      
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast({
        title: "Error",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quiz[currentQuestion].correct;
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnsweredQuestions([...answeredQuestions, selectedAnswer]);
    setShowResult(true);

    setTimeout(() => {
      if (currentQuestion < quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        // Quiz completed
        toast({
          title: "Quiz Completed!",
          description: `You scored ${score + (isCorrect ? 1 : 0)} out of ${quiz.length}`,
        });
      }
    }, 2000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnsweredQuestions([]);
  };

  if (!data || !summaryData) {
    return (
      <div className="p-8 text-center">
        <HelpCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Data Available</h2>
        <p className="text-gray-600 mb-6">Please complete the analysis steps first.</p>
        <Button onClick={onBack} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  const isQuizCompleted = currentQuestion >= quiz.length - 1 && showResult;

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Interactive Quiz</h2>
        <p className="text-lg text-gray-600">
          Test your understanding of the data insights
        </p>
      </div>

      {quiz.length === 0 ? (
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-8">
            <HelpCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-4">Ready to Generate Quiz?</h3>
            <p className="text-gray-600 mb-6">
              Create personalized questions based on your data analysis
            </p>
            
            <Button
              onClick={generateQuiz}
              disabled={isGenerating || !apiKey}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Quiz...
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5 mr-2" />
                  Generate Quiz
                </>
              )}
            </Button>
          </div>
          
          <Button onClick={onBack} variant="outline">
            Back to Visual Map
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {quiz.length}</span>
              <span>Score: {score}/{quiz.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {isQuizCompleted ? (
            <Card className="p-8 text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
                <p className="text-lg text-gray-600">
                  You scored {score} out of {quiz.length} questions correctly
                </p>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button onClick={resetQuiz} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake Quiz
                </Button>
                <Button onClick={onBack}>
                  Back to Visual Map
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
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
                        <span>{option}</span>
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
                      ? 'Correct!'
                      : 'Incorrect!'}
                  </p>
                  <p className="text-gray-700">
                    {quiz[currentQuestion]?.explanation}
                  </p>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  onClick={onBack}
                  variant="outline"
                >
                  Exit Quiz
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {currentQuestion < quiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizSection;
