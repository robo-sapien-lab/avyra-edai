import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

interface AskResponse {
  answer: string;
  sources?: string[];
  subject?: string;
  topic?: string;
  subtopic?: string;
}

export const ExampleUsage: React.FC = () => {
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a question',
        variant: 'destructive',
      });
      return;
    }

    if (!isAuthenticated || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to ask questions',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setAnswer(null);

    try {
      // Safe API call using apiFetch with automatic JWT inclusion
      const result: AskResponse = await apiFetch('/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: question.trim(),
          studentId: user.id
        })
      });

      setAnswer(result.answer);
      toast({
        title: 'Success!',
        description: 'Your question has been answered',
      });
    } catch (error) {
      console.error('Error asking question:', error);
      
      let errorMessage = 'Failed to get answer. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Authentication required')) {
          errorMessage = 'Please log in to continue.';
        } else if (error.message.includes('Authentication expired')) {
          errorMessage = 'Your session has expired. Please log in again.';
        } else if (error.message.includes('Endpoint not found')) {
          errorMessage = 'Service temporarily unavailable.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to use this feature.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
        <div className="text-sm text-muted-foreground">
          Welcome, {user?.email}! Ask any question and get an AI-powered response.
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question here..."
            disabled={isLoading}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
          />
          <Button 
            onClick={handleAskQuestion} 
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? 'Asking...' : 'Ask'}
          </Button>
        </div>

        {answer && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Answer:</h4>
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        )}

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={signOut}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
