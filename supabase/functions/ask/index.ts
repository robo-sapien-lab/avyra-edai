import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
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

    const { question } = await req.json();

    if (!question) {
      throw new Error('No question provided');
    }

    console.log(`Processing question for user ${user.id}: ${question}`);

    // Generate embedding for the question
    const questionEmbedding = await generateEmbedding(question);

    // Retrieve relevant chunks using similarity search
    const relevantChunks = await findRelevantChunks(supabaseClient, user.id, questionEmbedding);

    // Build context from relevant chunks
    const context = relevantChunks.map(chunk => chunk.content).join('\n\n');

    // Generate answer using Claude via OpenRouter
    const answer = await generateAnswer(question, context, relevantChunks);

    // Extract subject/topic from the most relevant chunk
    const primaryChunk = relevantChunks[0];
    const subject = primaryChunk?.subject || null;
    const topic = primaryChunk?.topic || null;
    const subtopic = primaryChunk?.subtopic || null;

    // Save the Q&A to database
    const { data: savedQuestion, error: dbError } = await supabaseClient
      .from('questions')
      .insert({
        user_id: user.id,
        question_text: question,
        answer_text: answer,
        subject: subject,
        topic: topic,
        subtopic: subtopic,
        source_chunks: relevantChunks.map(chunk => ({
          content: chunk.content,
          upload_id: chunk.upload_id,
          subject: chunk.subject,
          topic: chunk.topic,
          subtopic: chunk.subtopic
        }))
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    console.log(`Question answered for user ${user.id}: ${savedQuestion.id}`);

    return new Response(JSON.stringify({
      answer,
      subject,
      topic,
      subtopic,
      sources: relevantChunks.map(chunk => ({
        content: chunk.content.substring(0, 200) + '...',
        upload_id: chunk.upload_id
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ask function:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not found');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  const data = await response.json();

  if (data.data && data.data[0] && data.data[0].embedding) {
    return data.data[0].embedding;
  }

  throw new Error('Failed to generate embedding');
}

async function findRelevantChunks(supabaseClient: any, userId: string, questionEmbedding: number[]) {
  // Get all user embeddings
  const { data: embeddings, error } = await supabaseClient
    .from('embeddings')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  // Calculate cosine similarity for each embedding
  const similarities = embeddings.map((chunk: any) => {
    const similarity = cosineSimilarity(questionEmbedding, chunk.embedding_data);
    return { ...chunk, similarity };
  });

  // Sort by similarity and return top 5
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function generateAnswer(question: string, context: string, sources: any[]): Promise<string> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not found');
  }

  const prompt = `You are an expert tutor helping a K-12 student. Use the provided notes from their classes to answer their question clearly and step-by-step.

Notes from their uploaded materials:
${context}

Student's Question: ${question}

Please provide a clear, educational answer that:
1. Directly addresses their question
2. Uses the information from their notes when relevant
3. Explains concepts in an age-appropriate way
4. Provides examples when helpful
5. Encourages further learning

Answer:`;

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
      max_tokens: 1000,
      temperature: 0.7
    }),
  });

  const data = await response.json();

  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }

  throw new Error('Failed to generate answer');
}
