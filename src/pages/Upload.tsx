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
// NEW: Import the Supabase client we just created
import { supabase } from '@/lib/supabaseClient';

const Upload = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [completedUploads, setCompletedUploads] = useState<string[]>([]);
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

  const uploadFile = async (file: File) => {
    // NEW: Get the session from the client
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      toast({ title: 'Authentication Error', description: 'You must be logged in to upload files.', variant: 'destructive' });
      return;
    }

    setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

    try {
      // STEP 1: Get the secure upload URL
      setUploadProgress(prev => ({ ...prev, [file.name]: 10 }));
      const generateUrlResponse = await fetch(import.meta.env.VITE_API_GENERATE_URL, {
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

      if (!generateUrlResponse.ok) throw new Error('Failed to get an upload URL.');

      const { signedUrl } = await generateUrlResponse.json();
      setUploadProgress(prev => ({ ...prev, [file.name]: 30 }));

      // STEP 2: Upload the file directly to Google Cloud Storage
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('File upload failed.');

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold">Upload Learning Materials</h1>
            <p className="text-muted-foreground mt-2">
              Upload PDFs or images to build your personalized knowledge base
            </p>
          </div>

          {/* Upload Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Categorize Your Materials</CardTitle>
              <CardDescription>
                Help organize your content for better learning recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Algebra"
                  />
                </div>
                <div>
                  <Label htmlFor="subtopic">Subtopic</Label>
                  <Input
                    id="subtopic"
                    value={subtopic}
                    onChange={(e) => setSubtopic(e.target.value)}
                    placeholder="e.g., Linear Equations"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Files</CardTitle>
              <CardDescription>
                Drag and drop files or click to select. Supports PDFs and images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                {isDragActive ? (
                  <p className="text-lg">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF documents and image files
                    </p>
                  </div>
                )}
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="font-medium">Selected Files</h3>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {file.type === 'application/pdf' ? (
                          <FileText className="w-5 h-5 text-red-500" />
                        ) : (
                          <Image className="w-5 h-5 text-blue-500" />
                        )}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {completedUploads.includes(file.name) ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : uploadProgress[file.name] !== undefined ? (
                          <div className="w-20">
                            <Progress value={uploadProgress[file.name]} />
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div className="mt-6">
                  <Button
                    onClick={handleUploadAll}
                    disabled={loading || !subject}
                    className="w-full"
                  >
                    {loading ? 'Processing...' : `Upload ${files.length} file(s)`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Upload;
