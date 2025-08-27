import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  FileText, 
  Code, 
  Link, 
  Mic, 
  Video, 
  Save, 
  Eye, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Trash2,
  Download,
  Copy,
  Sparkles,
  Users,
  Target,
  Timer,
  FileCheck,
  Loader2,
  X,
  Plus,
  Paperclip,
  Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface EnhancedSubmissionFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  path?: string;
  uploadedAt?: string;
  size: number;
  type: string;
}

interface EnhancedSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  existingSubmission?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const EnhancedSubmissionDialog: React.FC<EnhancedSubmissionDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  existingSubmission,
  onSubmit,
  isLoading = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const [submissionData, setSubmissionData] = useState({
    text: existingSubmission?.submission_text || '',
    files: [] as EnhancedSubmissionFile[],
    links: [] as string[],
    codeLanguage: 'javascript',
    codeContent: '',
    notes: '',
    isGroupSubmission: false,
    groupMembers: [] as string[],
    voiceNotes: [] as string[],
    timeSpent: 0
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [startTime] = useState(new Date());

  // Enhanced file upload with better validation and feedback
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Enhanced validation
      const allowedTypes = assignment.allowed_file_types || [
        'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 
        'xlsx', 'xls', 'ppt', 'pptx', 'zip', 'rar', 'mp4', 'mp3'
      ];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && !allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not allowed. Supported: ${allowedTypes.join(', ')}`,
          variant: "destructive"
        });
        continue;
      }

      // Size validation (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit`,
          variant: "destructive"
        });
        continue;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const newFile: EnhancedSubmissionFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'pending',
        size: file.size,
        type: file.type
      };

      setSubmissionData(prev => ({
        ...prev,
        files: [...prev.files, newFile]
      }));

      // Start upload immediately
      uploadSingleFile(newFile);
    }
  };

  const uploadSingleFile = async (fileData: EnhancedSubmissionFile) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      )
    }));

    try {
      if (!user?.authUserId) {
        throw new Error('User not authenticated');
      }

      const timestamp = Date.now();
      const sanitizedFileName = fileData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${user.authUserId}/${assignment.id}/${timestamp}-${sanitizedFileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setSubmissionData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileData.id && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          )
        }));
      }, 200);

      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, fileData.file, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileData.file.type
        });

      clearInterval(progressInterval);

      if (error) {
        throw error;
      }

      setSubmissionData(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileData.id ? { 
            ...f, 
            status: 'uploaded', 
            progress: 100,
            path: data.path,
            uploadedAt: new Date().toISOString()
          } : f
        )
      }));

      toast({
        title: "File uploaded successfully",
        description: `${fileData.file.name} has been uploaded`
      });

    } catch (error: any) {
      setSubmissionData(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileData.id ? { ...f, status: 'error', progress: 0 } : f
        )
      }));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${fileData.file.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const removeFile = (fileId: string) => {
    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.filter(f => f.id !== fileId)
    }));
  };

  const addLink = () => {
    const link = prompt('Enter URL:');
    if (link && link.trim()) {
      setSubmissionData(prev => ({
        ...prev,
        links: [...prev.links, link.trim()]
      }));
    }
  };

  const removeLink = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    const hasText = submissionData.text.trim().length > 0;
    const hasFiles = submissionData.files.some(f => f.status === 'uploaded');
    const hasLinks = submissionData.links.length > 0;
    const hasCode = submissionData.codeContent.trim().length > 0;
    
    if (!hasText && !hasFiles && !hasLinks && !hasCode) {
      toast({
        title: "Empty submission",
        description: "Please add some content to your submission",
        variant: "destructive"
      });
      return;
    }

    const uploadingFiles = submissionData.files.filter(f => f.status === 'uploading');
    if (uploadingFiles.length > 0) {
      toast({
        title: "Files still uploading",
        description: "Please wait for all files to finish uploading",
        variant: "destructive"
      });
      return;
    }

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
    
    onSubmit({
      ...submissionData,
      timeSpent,
      uploadedFiles: submissionData.files.filter(f => f.status === 'uploaded')
    });
  };

  // Update word count
  React.useEffect(() => {
    const text = submissionData.text + ' ' + submissionData.notes + ' ' + submissionData.codeContent;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [submissionData.text, submissionData.notes, submissionData.codeContent]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Submit Assignment: {assignment?.title}
          </DialogTitle>
          <DialogDescription>
            Enhanced submission with multiple formats, real-time collaboration, and progress tracking
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">Word Count</div>
                <div className="text-lg font-semibold">{wordCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">Files</div>
                <div className="text-lg font-semibold">
                  {submissionData.files.filter(f => f.status === 'uploaded').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">Time Spent</div>
                <div className="text-lg font-semibold">
                  {Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)}min
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Files
                {submissionData.files.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {submissionData.files.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="links" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Links
                {submissionData.links.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {submissionData.links.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="media" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="submission-text">Submission Text</Label>
                <Textarea
                  id="submission-text"
                  placeholder="Enter your submission text here..."
                  value={submissionData.text}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, text: e.target.value }))}
                  className="min-h-[200px]"
                />
              </div>
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes or reflections..."
                  value={submissionData.notes}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Drop files here or click to upload</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports: PDF, DOC, images, videos, and more (50MB max)
                </p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>

              {/* File List */}
              {submissionData.files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Uploaded Files</h4>
                  {submissionData.files.map((file) => (
                    <Card key={file.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <Progress value={file.progress} className="w-20" />
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          )}
                          {file.status === 'uploaded' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {file.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code-language">Programming Language</Label>
                  <select
                    id="code-language"
                    value={submissionData.codeLanguage}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, codeLanguage: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="html">HTML</option>
                    <option value="css">CSS</option>
                    <option value="sql">SQL</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="code-content">Code Submission</Label>
                <Textarea
                  id="code-content"
                  placeholder="Paste your code here..."
                  value={submissionData.codeContent}
                  onChange={(e) => setSubmissionData(prev => ({ ...prev, codeContent: e.target.value }))}
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="links" className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={addLink} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Link
                </Button>
              </div>
              
              {submissionData.links.length > 0 && (
                <div className="space-y-2">
                  {submissionData.links.map((link, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {link}
                          </a>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLink(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="media" className="space-y-4">
              <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Media Submission</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Record video/audio responses or upload media files
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Video className="h-4 w-4 mr-2" />
                    Record Video
                  </Button>
                  <Button variant="outline">
                    <Mic className="h-4 w-4 mr-2" />
                    Record Audio
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};