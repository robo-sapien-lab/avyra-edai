-- Add missing columns to existing tables for the AI tutor backend

-- Add subject, topic, subtopic to uploads table
ALTER TABLE public.uploads 
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS subtopic text;

-- Add subject, topic, subtopic, source_chunks to questions table  
ALTER TABLE public.questions
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS topic text, 
ADD COLUMN IF NOT EXISTS subtopic text,
ADD COLUMN IF NOT EXISTS source_chunks jsonb;

-- Add subject, topic, subtopic to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS subtopic text;

-- Add subject, subtopic to progress table
ALTER TABLE public.progress
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS subtopic text;

-- Update progress table to have mastery_level as mastery_score for clarity
ALTER TABLE public.progress 
RENAME COLUMN mastery_level TO mastery_score;

-- Create embeddings table for text storage (without vector extension for now)
CREATE TABLE public.embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE,
  content text NOT NULL,
  subject text,
  topic text,
  subtopic text,
  embedding_data jsonb, -- Store embedding as JSON array for now
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on embeddings
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- Create policies for embeddings
CREATE POLICY "Users can view their own embeddings" 
ON public.embeddings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own embeddings" 
ON public.embeddings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own embeddings" 
ON public.embeddings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create index for user-based queries
CREATE INDEX embeddings_user_id_idx ON public.embeddings (user_id);
CREATE INDEX embeddings_upload_id_idx ON public.embeddings (upload_id);

-- Update trigger for embeddings
CREATE TRIGGER update_embeddings_updated_at
BEFORE UPDATE ON public.embeddings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();