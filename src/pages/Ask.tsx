// pages/ask.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, BookOpen, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
// NEW: Import useSession to get the user's authentication token
import { useSession } from '@supabase/auth-helpers-react';
import { toast } from '@/hooks/use-toast'; // Assuming you have this for error notifications

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

  // NEW: Get the user session from Supabase
  const session = useSession();
  // NEW: Standard loading state, replacing the one from the old hook
  const [loading, setLoading] = useState(false);

  // --- THIS IS THE MAIN CHANGED FUNCTION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !session?.access_token) {
      if (!session?.access_token) {
        toast({ title: 'Authentication Error', description: 'You must be logged in to ask a question.', variant: 'destructive' });
      }
      return;
    }

    const currentQuestion = question;
    setQuestion('');
    setLoading(true);

    try {
      // NEW: Standard fetch call to our Google Cloud Function
      const response = await fetch(process.env.VITE_NEXT_PUBLIC_API_ASK_QUESTION_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        // IMPORTANT: The backend expects the key to be 'query'
        body: JSON.stringify({ query: currentQuestion }),
      });

      if (!response.ok) {
        throw new Error('The request to the AI tutor failed.');
      }
      
      const result = await response.json();
      
      const newQuestion: Question = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: result.answer, // Assuming the backend returns an object with an 'answer' key
        timestamp: new Date()
      };

      setQuestions(prev => [newQuestion, ...prev]);
    } catch (error) {
      console.error('Ask question error:', error);
      toast({
        title: 'An error occurred',
        description: 'Could not get an answer from the AI tutor. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestedQuestions = [
    // ... same as before
  ];

  // The rest of the JSX remains the same...
  return (
    <Layout>
      {/* ... The entire JSX part of your component ... */}
    </Layout>
  );
};

export default Ask;
