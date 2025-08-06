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

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const subject = formData.get('subject') as string;
    const topic = formData.get('topic') as string;
    const subtopic = formData.get('subtopic') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`Processing upload for user ${user.id}: ${file.name}, ${file.type}`);

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('uploads')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    const fileUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/uploads/${uploadData.path}`;

    // Extract text from file
    let extractedText = '';
    
    if (file.type === 'application/pdf') {
      // For PDFs, we'll use a simple text extraction
      // In production, you'd want to use a proper PDF parsing library
      const arrayBuffer = await file.arrayBuffer();
      const text = new TextDecoder().decode(arrayBuffer);
      // This is a simplified extraction - in reality you'd use PyMuPDF or similar
      extractedText = text.replace(/[^\x20-\x7E]/g, ' ').substring(0, 10000);
    } else if (file.type.startsWith('image/')) {
      // For images, we'll simulate OCR
      // In production, you'd use Tesseract or similar
      extractedText = `[Image content from ${file.name}] - OCR text would be extracted here`;
    } else {
      // For text files
      extractedText = await file.text();
    }

    // Save upload metadata to database
    const { data: upload, error: dbError } = await supabaseClient
      .from('uploads')
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_url: fileUrl,
        file_type: file.type,
        subject: subject || null,
        topic: topic || null,
        subtopic: subtopic || null,
        extracted_text: extractedText,
        processing_status: 'completed'
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    // Generate embeddings for text chunks
    if (extractedText && extractedText.length > 0) {
      await generateAndStoreEmbeddings(supabaseClient, user.id, upload.id, extractedText, subject, topic, subtopic);
    }

    console.log(`Upload completed for user ${user.id}: ${upload.id}`);

    return new Response(JSON.stringify({ 
      success: true, 
      upload: upload 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in upload function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAndStoreEmbeddings(
  supabaseClient: any,
  userId: string,
  uploadId: string,
  text: string,
  subject?: string,
  topic?: string,
  subtopic?: string
) {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    console.error('OpenRouter API key not found');
    return;
  }

  // Chunk text into smaller pieces (approximately 512 tokens)
  const chunks = chunkText(text, 2000); // ~512 tokens per chunk

  for (const chunk of chunks) {
    try {
      // Generate embedding using OpenRouter
      const embeddingResponse = await fetch('https://openrouter.ai/api/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      const embeddingData = await embeddingResponse.json();
      
      if (embeddingData.data && embeddingData.data[0] && embeddingData.data[0].embedding) {
        // Store embedding in database
        await supabaseClient
          .from('embeddings')
          .insert({
            user_id: userId,
            upload_id: uploadId,
            content: chunk,
            subject: subject || null,
            topic: topic || null,
            subtopic: subtopic || null,
            embedding_data: embeddingData.data[0].embedding
          });
      }
    } catch (error) {
      console.error('Error generating embedding for chunk:', error);
    }
  }
}

function chunkText(text: string, chunkSize: number): string[] {
  const chunks = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 <= chunkSize) {
      currentChunk += (currentChunk ? ' ' : '') + word;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}