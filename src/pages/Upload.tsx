// pages/upload.tsx
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload as UploadIcon, FileText, Image, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import Layout from '@/components/Layout';
// NEW: Import useSession to get the user's authentication token
import { useSession } from '@supabase/auth-helpers-react';

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);
  
  // NEW: Get the user session from Supabase
  const session = useSession();
  // NEW: Standard loading state, replacing the one from the old hook
  const [loading, setLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      setFiles(prev => [...prev, ...acceptedFiles]);
    }
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // --- THIS IS THE MAIN CHANGED FUNCTION ---
  const uploadFile = async (file: File) => {
    // Check for an active session and token
    if (!session?.access_token) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to upload files.', variant: 'destructive' });
      return;
    }
    
    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    
    try {
      // STEP 1: Get the secure upload URL from our Google Cloud Function
      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));
      const generateUrlResponse = await fetch(process.env.NEXT_PUBLIC_API_GENERATE_URL!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type,
        }),
      });

      if (!generateUrlResponse.ok) {
        throw new Error('Failed to get an upload URL.');
      }

      const { signedUrl } = await generateUrlResponse.json();
      setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));
      
      // STEP 2: Upload the file directly to Google Cloud Storage using the signed URL
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('File upload failed.');
      }

      // If both steps succeed, mark as complete
      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      setCompletedUploads(prev => [...prev, file.name]);
      toast({
        title: 'Upload successful',
        description: `${file.name} is now being processed.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      toast({
        title: 'Upload failed',
        description: `There was a problem uploading ${file.name}.`,
        variant: 'destructive',
      });
    }
  };

  const handleUploadAll = async () => {
    if (!subject || files.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please add at least a subject and select files to upload.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    for (const file of files) {
      if (!completedUploads.includes(file.name)) {
        await uploadFile(file);
      }
    }
    setLoading(false);
  };

  // The rest of the JSX remains the same...
  return (
    <Layout>
        {/* ... The entire JSX part of your component ... */}
    </Layout>
  );
};

export default Upload;
