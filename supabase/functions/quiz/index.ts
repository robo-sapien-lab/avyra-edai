import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
}

interface QuizSubmission {
  quiz_id: string;
  answers: number[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Check if this is a quiz generation request or submission
      if (body.generate) {
        return await generateQuiz(supabaseClient, user.id);
      } else if (body.quiz_id && body.answers) {
        return await submitQuiz(supabaseClient, user.id, body as QuizSubmission);
      } else {
        throw new Error('Invalid request body');
      }
    }

    throw new Error('Method not allowed');

  } catch (error) {
    console.error('Error in quiz function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateQuiz(supabaseClient: any, userId: string) {
  console.log(`Generating quiz for user ${userId}`);

  // Find topics where user has low mastery scores
  const { data: progress, error: progressError } = await supabaseClient
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .order('mastery_score', { ascending: true })
    .limit(3);

  if (progressError) {
    throw progressError;
  }

  // Get user's uploaded content for weak topics
  let relevantContent = '';
  if (progress && progress.length > 0) {
    const topics = progress.map(p => p.topic).filter(Boolean);
    
    const { data: embeddings, error: embeddingsError } = await supabaseClient
      .from('embeddings')
      .select('content, subject, topic, subtopic')
      .eq('user_id', userId)
      .in('topic', topics)
      .limit(10);

    if (!embeddingsError && embeddings) {
      relevantContent = embeddings.map(e => e.content).join('\n\n');
    }
  }

  // If no progress data or content, get random content from user uploads
  if (!relevantContent) {
    const { data: embeddings, error: embeddingsError } = await supabaseClient
      .from('embeddings')
      .select('content, subject, topic, subtopic')
      .eq('user_id', userId)
      .limit(5);

    if (!embeddingsError && embeddings) {
      relevantContent = embeddings.map(e => e.content).join('\n\n');
    }
  }

  if (!relevantContent) {
    throw new Error('No content available to generate quiz');
  }

  // Generate quiz questions using Claude
  const quizQuestions = await generateQuizQuestions(relevantContent);

  // Save quiz to database
  const { data: quiz, error: quizError } = await supabaseClient
    .from('quizzes')
    .insert({
      user_id: userId,
      title: 'Adaptive Practice Quiz',
      total_questions: quizQuestions.length,
      quiz_data: quizQuestions,
      subject: quizQuestions[0]?.subject || null,
      topic: quizQuestions[0]?.topic || null,
      subtopic: quizQuestions[0]?.subtopic || null
    })
    .select()
    .single();

  if (quizError) {
    throw quizError;
  }

  console.log(`Quiz generated for user ${userId}: ${quiz.id}`);

  return new Response(JSON.stringify({
    quiz_id: quiz.id,
    title: quiz.title,
    questions: quizQuestions.map((q, index) => ({
      id: index,
      question: q.question,
      options: q.options
    }))
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function submitQuiz(supabaseClient: any, userId: string, submission: QuizSubmission) {
  console.log(`Submitting quiz for user ${userId}: ${submission.quiz_id}`);

  // Get the quiz data
  const { data: quiz, error: quizError } = await supabaseClient
    .from('quizzes')
    .select('*')
    .eq('id', submission.quiz_id)
    .eq('user_id', userId)
    .single();

  if (quizError || !quiz) {
    throw new Error('Quiz not found');
  }

  const questions = quiz.quiz_data as QuizQuestion[];
  
  // Calculate score
  let correctAnswers = 0;
  submission.answers.forEach((answer, index) => {
    if (questions[index] && answer === questions[index].correct_answer) {
      correctAnswers++;
    }
  });

  const score = Math.round((correctAnswers / questions.length) * 100);

  // Update quiz with submission
  const { error: updateError } = await supabaseClient
    .from('quizzes')
    .update({
      user_answers: submission.answers,
      score: score,
      completed_at: new Date().toISOString()
    })
    .eq('id', submission.quiz_id);

  if (updateError) {
    throw updateError;
  }

  // Update user progress
  await updateUserProgress(supabaseClient, userId, quiz.subject, quiz.topic, quiz.subtopic, score);

  // Prepare results with explanations
  const results = questions.map((question, index) => ({
    question: question.question,
    user_answer: submission.answers[index],
    correct_answer: question.correct_answer,
    is_correct: submission.answers[index] === question.correct_answer,
    explanation: question.explanation,
    options: question.options
  }));

  console.log(`Quiz completed for user ${userId}: ${score}% (${correctAnswers}/${questions.length})`);

  return new Response(JSON.stringify({
    score,
    correct_answers: correctAnswers,
    total_questions: questions.length,
    results
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function generateQuizQuestions(content: string): Promise<QuizQuestion[]> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not found');
  }

  const prompt = `Based on the following educational content, generate 5 multiple choice questions for a K-12 student. Each question should have 4 options with only one correct answer.

Content:
${content}

Please format your response as a JSON array of objects with this structure:
{
  "question": "The question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_answer": 0,
  "explanation": "Brief explanation of why this answer is correct"
}

Make sure the questions are:
1. Age-appropriate for K-12 students
2. Directly related to the content provided
3. Clear and unambiguous
4. Educational and helpful for learning

JSON Response:`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    }),
  });

  const data = await response.json();
  
  if (data.choices && data.choices[0] && data.choices[0].message) {
    try {
      const jsonText = data.choices[0].message.content;
      const cleanedJson = jsonText.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error('Error parsing quiz JSON:', parseError);
      // Fallback questions
      return [{
        question: "Based on the uploaded content, which concept is most important?",
        options: ["Concept A", "Concept B", "Concept C", "All of the above"],
        correct_answer: 3,
        explanation: "All concepts in the material are interconnected and important for understanding."
      }];
    }
  }
  
  throw new Error('Failed to generate quiz questions');
}

async function updateUserProgress(
  supabaseClient: any,
  userId: string,
  subject?: string,
  topic?: string,
  subtopic?: string,
  score?: number
) {
  if (!topic) return;

  // Check if progress record exists
  const { data: existingProgress } = await supabaseClient
    .from('progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic', topic)
    .maybeSingle();

  const questionsAttempted = (existingProgress?.questions_attempted || 0) + 1;
  const questionsCorrect = (existingProgress?.questions_correct || 0) + (score && score >= 70 ? 1 : 0);
  const newMasteryScore = Math.round((questionsCorrect / questionsAttempted) * 100);

  if (existingProgress) {
    // Update existing progress
    await supabaseClient
      .from('progress')
      .update({
        mastery_score: newMasteryScore,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect,
        subject: subject || existingProgress.subject,
        subtopic: subtopic || existingProgress.subtopic
      })
      .eq('id', existingProgress.id);
  } else {
    // Create new progress record
    await supabaseClient
      .from('progress')
      .insert({
        user_id: userId,
        topic: topic,
        subject: subject || null,
        subtopic: subtopic || null,
        mastery_score: newMasteryScore,
        questions_attempted: questionsAttempted,
        questions_correct: questionsCorrect
      });
  }
}