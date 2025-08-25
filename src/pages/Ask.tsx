import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import { apiFetch } from '@/lib/api';

interface Question {
  id: string;
  question: string;
  answer: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  sources?: string[];
  timestamp: Date;
}

const Ask = () => {
  const [question, setQuestion] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !isAuthenticated || !user) return;

    const currentQuestion = question;
    setQuestion('');
    setLoading(true);

    try {
      // API call to Google Cloud backend with Vertex AI LLM-powered response
      const result = await apiFetch('/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: currentQuestion,
          studentId: user.id
        })
      });
      
      const newQuestion: Question = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: result.answer,
        subject: result.subject,
        topic: result.topic,
        subtopic: result.subtopic,
        sources: result.sources,
        timestamp: new Date()
      };

      setQuestions(prev => [newQuestion, ...prev]);
      
      toast({
        title: 'Question answered!',
        description: 'Your AI tutor has provided a response.',
      });
    } catch (error) {
      console.error('Error asking question:', error);
      toast({
        title: 'Error',
        description: 'Failed to get answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    "Can you explain this concept from my notes?",
    "What are the key points I should remember?",
    "Can you give me practice problems for this topic?",
    "How does this connect to other topics I've studied?",
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Ask Your AI Tutor</h1>
            <p className="text-muted-foreground mt-2">
              Get personalized answers based on your uploaded materials
            </p>
          </div>

          {/* Question Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Ask a Question
              </CardTitle>
              <CardDescription>
                Ask anything about your uploaded materials and get AI-powered explanations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="min-h-[100px]"
                />
                <Button type="submit" disabled={loading || !question.trim()}>
                  {loading ? (
                    'Thinking...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask Question
                    </>
                  )}
                </Button>
              </form>

              {/* Suggested Questions */}
              {questions.length === 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-3">Suggested questions:</h3>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((suggested, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setQuestion(suggested)}
                        className="text-xs"
                      >
                        {suggested}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Q&A History */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Recent Questions</h2>
              {questions.map((qa) => (
                <motion.div
                  key={qa.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-yellow-500" />
                            Question
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {qa.timestamp.toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {qa.subject && <Badge variant="secondary">{qa.subject}</Badge>}
                          {qa.topic && <Badge variant="outline">{qa.topic}</Badge>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="font-medium text-sm text-muted-foreground mb-2">You asked:</p>
                        <p>{qa.question}</p>
                      </div>
                      
                      <div className="p-4 bg-primary/5 rounded-lg">
                        <p className="font-medium text-sm text-primary mb-2 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          AI Tutor answered:
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <p className="whitespace-pre-wrap">{qa.answer}</p>
                        </div>
                      </div>

                      {qa.sources && qa.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <p className="font-medium mb-1">Sources:</p>
                          <div className="flex flex-wrap gap-1">
                            {qa.sources.map((source, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}

          {questions.length === 0 && (
            <Card className="text-center py-12">
              <CardContent>
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                <p className="text-muted-foreground">
                  Start by asking a question about your uploaded materials
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default Ask;
