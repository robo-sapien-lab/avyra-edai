import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, XCircle, RotateCcw, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useSupabaseFunction } from '@/hooks/useSupabaseFunction';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
  subject?: string;
  topic?: string;
  subtopic?: string;
}

interface QuizResult {
  score: number;
  total: number;
  correctAnswers: boolean[];
  explanations: string[];
}

const Quiz = () => {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const { invoke, loading } = useSupabaseFunction();

  const generateQuiz = async () => {
    setIsGenerating(true);
    try {
      const result = await invoke('quiz', { action: 'generate' });
      setCurrentQuiz(result.quiz);
      setCurrentQuestion(0);
      setSelectedAnswers([]);
      setSelectedAnswer(null);
      setShowResults(false);
      setQuizResult(null);
    } catch (error) {
      toast({
        title: 'Error generating quiz',
        description: 'Please make sure you have uploaded some materials first.',
        variant: 'destructive',
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

    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = selectedAnswer;
    setSelectedAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < (currentQuiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (answers: number[]) => {
    if (!currentQuiz) return;

    try {
      const result = await invoke('quiz', {
        action: 'submit',
        quiz_id: currentQuiz.id,
        answers
      });

      setQuizResult(result);
      setShowResults(true);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setSelectedAnswer(null);
    setShowResults(false);
    setQuizResult(null);
  };

  const progress = currentQuiz ? ((currentQuestion + 1) / currentQuiz.questions.length) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Adaptive Quiz</h1>
            <p className="text-muted-foreground mt-2">
              Test your knowledge with AI-generated questions based on your materials
            </p>
          </div>

          {!currentQuiz && !showResults && (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-semibold mb-2">Ready for a Quiz?</h3>
                <p className="text-muted-foreground mb-6">
                  We'll generate personalized questions based on your uploaded materials and learning progress
                </p>
                <Button onClick={generateQuiz} disabled={isGenerating} size="lg">
                  {isGenerating ? 'Generating Quiz...' : 'Generate New Quiz'}
                </Button>
              </CardContent>
            </Card>
          )}

          {currentQuiz && !showResults && (
            <div className="space-y-6">
              {/* Quiz Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{currentQuiz.title}</CardTitle>
                      <CardDescription>
                        Question {currentQuestion + 1} of {currentQuiz.questions.length}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {currentQuiz.subject && <Badge>{currentQuiz.subject}</Badge>}
                      {currentQuiz.topic && <Badge variant="outline">{currentQuiz.topic}</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={progress} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {Math.round(progress)}% complete
                  </p>
                </CardContent>
              </Card>

              {/* Current Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {currentQuiz.questions[currentQuestion].question}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentQuiz.questions[currentQuestion].options.map((option, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto p-4"
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="mr-3 font-mono">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </Button>
                  ))}

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="ghost"
                      onClick={resetQuiz}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Start Over
                    </Button>
                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                    >
                      {currentQuestion < currentQuiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {showResults && quizResult && currentQuiz && (
            <div className="space-y-6">
              {/* Results Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Quiz Results
                  </CardTitle>
                  <CardDescription>{currentQuiz.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold mb-2">
                      {Math.round((quizResult.score / quizResult.total) * 100)}%
                    </div>
                    <p className="text-muted-foreground">
                      {quizResult.score} out of {quizResult.total} correct
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                      <p className="font-semibold text-green-600">{quizResult.score} Correct</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                      <p className="font-semibold text-red-600">
                        {quizResult.total - quizResult.score} Incorrect
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Question Review */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Question Review</h3>
                {currentQuiz.questions.map((question, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {index + 1}. {question.question}
                        </CardTitle>
                        {quizResult.correctAnswers[index] ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`p-2 rounded ${
                              optionIndex === question.correct_answer
                                ? 'bg-green-100 text-green-800'
                                : optionIndex === selectedAnswers[index]
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="font-mono mr-2">
                              {String.fromCharCode(65 + optionIndex)}.
                            </span>
                            {option}
                            {optionIndex === question.correct_answer && (
                              <Badge className="ml-2" variant="secondary">Correct</Badge>
                            )}
                            {optionIndex === selectedAnswers[index] && 
                             optionIndex !== question.correct_answer && (
                              <Badge className="ml-2" variant="destructive">Your Answer</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800 mb-1">Explanation:</p>
                        <p className="text-sm text-blue-700">{quizResult.explanations[index]}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={resetQuiz} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Take Another Quiz
                </Button>
                <Button onClick={generateQuiz} disabled={isGenerating}>
                  Generate New Quiz
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Quiz;