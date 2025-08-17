import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Paperclip
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  existingSubmission?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

interface SubmissionFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  url?: string;
  uploadedFile?: {
    name: string;
    path: string;
    size: number;
    type: string;
  };
}

export const AdvancedSubmissionDialog: React.FC<AdvancedSubmissionDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  existingSubmission,
  onSubmit,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text');
  const [submissionData, setSubmissionData] = useState({
    text: existingSubmission?.submission_text || '',
    files: [] as SubmissionFile[],
    links: [] as string[],
    codeLanguage: 'javascript',
    codeContent: '',
    notes: '',
    isGroupSubmission: false,
    groupMembers: [] as string[]
  });
  
  const [draftSaved, setDraftSaved] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef<Date>(new Date());

  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.floor((new Date().getTime() - startTime.current.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [submissionData]);

  // Word count calculation
  useEffect(() => {
    const text = submissionData.text + ' ' + submissionData.notes + ' ' + submissionData.codeContent;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [submissionData.text, submissionData.notes, submissionData.codeContent]);

  const saveDraft = async () => {
    if (!assignment?.id) return;
    
    try {
      localStorage.setItem(`assignment_draft_${assignment.id}`, JSON.stringify({
        ...submissionData,
        savedAt: new Date().toISOString(),
        timeSpent
      }));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const loadDraft = () => {
    if (!assignment?.id) return;
    
    try {
      const draft = localStorage.getItem(`assignment_draft_${assignment.id}`);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setSubmissionData(parsedDraft);
        toast({
          title: "Draft loaded",
          description: `Restored work from ${new Date(parsedDraft.savedAt).toLocaleString()}`
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const handleFileUpload = (files: FileList) => {
    if (!assignment) return;
    
    Array.from(files).forEach(file => {
      // Validate file type - if no allowed types specified, allow common types
      const allowedTypes = assignment.allowed_file_types && assignment.allowed_file_types.length > 0 
        ? assignment.allowed_file_types 
        : ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'xlsx', 'xls', 'ppt', 'pptx', 'zip', 'rar'];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension && !allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an allowed file type. Allowed: ${allowedTypes.join(', ')}`,
          variant: "destructive"
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive"
        });
        return;
      }

      const fileId = Math.random().toString(36).substr(2, 9);
      const newFile: SubmissionFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'pending'
      };

      setSubmissionData(prev => ({
        ...prev,
        files: [...prev.files, newFile]
      }));

      // Simulate upload progress
      simulateUpload(fileId);
    });
  };

  const uploadFileToStorage = async (file: File, fileId: string, studentId: string, assignmentId: string) => {
    try {
      // Create file path: studentId/assignmentId/filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${studentId}/${assignmentId}/${fileName}`;

      console.log(`Uploading file to: ${filePath}`);

      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('File uploaded successfully:', data);
      return {
        name: file.name,
        path: data.path,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const simulateUpload = async (fileId: string) => {
    const file = submissionData.files.find(f => f.id === fileId);
    if (!file || !assignment?.id) return;

    setSubmissionData(prev => ({
      ...prev,
      files: prev.files.map(f => 
        f.id === fileId ? { ...f, status: 'uploading' } : f
      )
    }));

    try {
      // Get current user's student profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) {
        throw new Error('User profile not found');
      }

      // Update progress during upload
      const progressInterval = setInterval(() => {
        setSubmissionData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileId && f.progress < 90 
              ? { ...f, progress: f.progress + 10 } 
              : f
          )
        }));
      }, 200);

      // Upload file to Supabase storage
      const uploadedFile = await uploadFileToStorage(file.file, fileId, profile.id, assignment.id);

      clearInterval(progressInterval);

      setSubmissionData(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'uploaded', 
            progress: 100,
            uploadedFile
          } : f
        )
      }));

      toast({
        title: "File uploaded successfully",
        description: `${file.file.name} has been uploaded to the server`
      });

    } catch (error) {
      console.error('Upload failed:', error);
      
      setSubmissionData(prev => ({
        ...prev,
        files: prev.files.map(f => 
          f.id === fileId ? { ...f, status: 'error', progress: 0 } : f
        )
      }));

      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.file.name}. Please try again.`,
        variant: "destructive"
      });
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

  const generateAIAssistance = async () => {
    setAiAssistanceEnabled(true);
    try {
      // This would call an AI service to help improve the submission
      toast({
        title: "AI assistance",
        description: "AI suggestions are being generated..."
      });
      
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "AI suggestions ready",
        description: "Check the AI tab for writing improvements and suggestions"
      });
    } catch (error) {
      toast({
        title: "AI assistance failed",
        description: "Unable to generate AI suggestions at this time",
        variant: "destructive"
      });
    } finally {
      setAiAssistanceEnabled(false);
    }
  };

  const handleSubmit = () => {
    // Validate submission
    if (!submissionData.text.trim() && submissionData.files.length === 0 && submissionData.links.length === 0 && !submissionData.codeContent.trim()) {
      toast({
        title: "Empty submission",
        description: "Please add some content to your submission",
        variant: "destructive"
      });
      return;
    }

    // Check if any files are still uploading
    const uploadingFiles = submissionData.files.filter(f => f.status === 'uploading');
    if (uploadingFiles.length > 0) {
      toast({
        title: "Files still uploading",
        description: "Please wait for all files to finish uploading before submitting",
        variant: "destructive"
      });
      return;
    }

    // Prepare uploaded files data for the backend
    const uploadedFiles = submissionData.files
      .filter(f => f.status === 'uploaded' && f.uploadedFile)
      .map(f => f.uploadedFile!);

    // Prepare submission data
    const finalSubmission = {
      submissionText: submissionData.text,
      files: uploadedFiles,
      links: submissionData.links,
      codeContent: submissionData.codeContent,
      codeLanguage: submissionData.codeLanguage,
      notes: submissionData.notes,
      timeSpent,
      wordCount,
      isGroupSubmission: submissionData.isGroupSubmission,
      groupMembers: submissionData.groupMembers
    };

    console.log('Submitting assignment with data:', finalSubmission);
    onSubmit(finalSubmission);
    
    // Clear draft after successful submission
    if (assignment?.id) {
      localStorage.removeItem(`assignment_draft_${assignment.id}`);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getDueStatus = () => {
    if (!assignment?.due_date) return { status: 'no-deadline', color: 'text-muted-foreground', text: 'No deadline' };
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffHours = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600));
    
    if (diffHours < 0) return { status: 'overdue', color: 'text-destructive', text: 'Overdue!' };
    if (diffHours < 2) return { status: 'urgent', color: 'text-destructive', text: `Due in ${diffHours}h` };
    if (diffHours < 24) return { status: 'soon', color: 'text-warning', text: `Due in ${diffHours}h` };
    
    const diffDays = Math.ceil(diffHours / 24);
    return { status: 'normal', color: 'text-primary', text: `Due in ${diffDays} days` };
  };

  const dueStatus = getDueStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Submit Assignment: {assignment?.title || 'Loading...'}</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {formatTime(timeSpent)}
              </Badge>
              <Badge variant="outline" className={dueStatus.color}>
                <Clock className="w-3 h-3 mr-1" />
                {dueStatus.text}
              </Badge>
              {draftSaved && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Draft saved
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 h-[70vh]">
          {/* Left sidebar - Assignment info */}
          <div className="col-span-1 border-r pr-4">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Assignment Info
                    </CardTitle>
                  </CardHeader>
                   <CardContent className="space-y-3 text-sm">
                     <div>
                       <Label className="text-xs text-muted-foreground">Max Score</Label>
                       <p className="font-medium">{assignment?.max_score || 0} points</p>
                     </div>
                     <div>
                       <Label className="text-xs text-muted-foreground">Max Attempts</Label>
                       <p className="font-medium">{assignment?.max_attempts || 0}</p>
                     </div>
                     <div>
                       <Label className="text-xs text-muted-foreground">Subject</Label>
                       <p className="font-medium">{assignment?.subject?.name || 'Unknown'}</p>
                     </div>
                      {assignment?.allowed_file_types?.length > 0 ? (
                       <div>
                         <Label className="text-xs text-muted-foreground">Allowed Files</Label>
                         <div className="flex flex-wrap gap-1 mt-1">
                           {assignment.allowed_file_types.map((type: string) => (
                             <Badge key={type} variant="outline" className="text-xs">
                               {type}
                             </Badge>
                           ))}
                         </div>
                       </div>
                     ) : (
                       <div>
                         <Label className="text-xs text-muted-foreground">Allowed Files</Label>
                         <p className="text-sm text-muted-foreground">Most common file types accepted</p>
                       </div>
                     )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileCheck className="w-4 h-4" />
                      Submission Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Word count:</span>
                      <span className="font-medium">{wordCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Files:</span>
                      <span className="font-medium">{submissionData.files.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Links:</span>
                      <span className="font-medium">{submissionData.links.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time spent:</span>
                      <span className="font-medium">{formatTime(timeSpent)}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={loadDraft}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Load Draft
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isPreviewMode ? 'Edit Mode' : 'Preview'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateAIAssistance}
                    disabled={aiAssistanceEnabled}
                    className="w-full"
                  >
                    {aiAssistanceEnabled ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    AI Assistance
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Main content area */}
          <div className="col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Files ({submissionData.files.length})
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="links" className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Links ({submissionData.links.length})
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Media
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(100%-3rem)] mt-4">
                <TabsContent value="text" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="submission-text">Your Response</Label>
                      <Textarea
                        id="submission-text"
                        placeholder="Enter your assignment response here..."
                        value={submissionData.text}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, text: e.target.value }))}
                        rows={12}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {wordCount} words • Auto-saved {draftSaved ? 'just now' : 'automatically'}
                      </p>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes or comments for your teacher..."
                        value={submissionData.notes}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={4}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="mt-0">
                  <div className="space-y-4">
                    <div
                      className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={(e) => {
                        e.preventDefault();
                        handleFileUpload(e.dataTransfer.files);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop files here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max 10MB per file • Allowed: {
                          assignment.allowed_file_types && assignment.allowed_file_types.length > 0 
                            ? assignment.allowed_file_types.join(', ') 
                            : 'pdf, doc, docx, txt, jpg, jpeg, png, gif, xlsx, xls, ppt, pptx, zip, rar'
                        }
                      </p>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />

                    {submissionData.files.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Files</Label>
                        {submissionData.files.map((file) => (
                          <Card key={file.id}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Paperclip className="w-4 h-4 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{file.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {file.status === 'uploading' && (
                                    <Progress value={file.progress} className="w-20" />
                                  )}
                                  {file.status === 'uploaded' && (
                                    <CheckCircle className="w-4 h-4 text-success" />
                                  )}
                                  {file.status === 'error' && (
                                    <AlertCircle className="w-4 h-4 text-destructive" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code-language">Programming Language</Label>
                      <select
                        id="code-language"
                        value={submissionData.codeLanguage}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, codeLanguage: e.target.value }))}
                        className="mt-2 w-full p-2 border rounded"
                      >
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="csharp">C#</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="sql">SQL</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="code-content">Code Submission</Label>
                      <Textarea
                        id="code-content"
                        placeholder="Paste your code here..."
                        value={submissionData.codeContent}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, codeContent: e.target.value }))}
                        rows={15}
                        className="mt-2 font-mono text-sm"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="links" className="mt-0">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>External Links</Label>
                      <Button variant="outline" size="sm" onClick={addLink}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Link
                      </Button>
                    </div>

                    {submissionData.links.length === 0 ? (
                      <div className="text-center p-8 text-muted-foreground">
                        <Link className="w-8 h-8 mx-auto mb-2" />
                        <p>No links added yet</p>
                        <p className="text-xs">Add external resources, documentation, or reference materials</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {submissionData.links.map((link, index) => (
                          <Card key={index}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Link className="w-4 h-4 text-muted-foreground" />
                                  <a 
                                    href={link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-primary hover:underline"
                                  >
                                    {link}
                                  </a>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLink(index)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="media" className="mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4 text-center cursor-pointer hover:bg-muted/50">
                        <Mic className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Record Audio</p>
                        <p className="text-xs text-muted-foreground">Voice explanation or presentation</p>
                      </Card>
                      <Card className="p-4 text-center cursor-pointer hover:bg-muted/50">
                        <Video className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Record Video</p>
                        <p className="text-xs text-muted-foreground">Screen recording or presentation</p>
                      </Card>
                    </div>
                    
                    <div className="text-center p-8 text-muted-foreground">
                      <p className="text-sm">Media recording features coming soon!</p>
                      <p className="text-xs">Record audio explanations, video presentations, or screen captures</p>
                    </div>
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Last saved: {draftSaved ? 'Just now' : 'Auto-saving...'}</span>
            <span>Words: {wordCount}</span>
            <span>Time: {formatTime(timeSpent)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading}
              className="hover-scale"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Submit Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};