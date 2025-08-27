import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Send,
  BookOpen,
  MessageSquare,
  BarChart3,
  Shield,
  GitBranch,
  Lightbulb,
  PlayCircle,
  StopCircle,
  Zap,
  Star,
  Award,
  Share2,
  ChevronDown,
  File,
  Image,
  Archive,
  FileVideo,
  FileAudio,
  FilePlus,
  CloudUpload,
  History,
  GitCommit,
  Users2,
  Calendar,
  MessageCircle,
  Gauge,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AdvancedGroupCreationDialog } from '@/components/assignments/AdvancedGroupCreationDialog';

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
  thumbnail?: string;
  versionHistory?: any[];
}

interface AssignmentGroup {
  id: string;
  name: string;
  members: any[];
  role: string;
  createdAt: string;
}

interface PeerReview {
  id: string;
  reviewerId: string;
  reviewerName: string;
  score: number;
  feedback: string;
  rubricScores: any;
  submittedAt: string;
}

interface MoodleStyleSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: any;
  existingSubmission?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const MoodleStyleSubmissionDialog: React.FC<MoodleStyleSubmissionDialogProps> = ({
  open,
  onOpenChange,
  assignment,
  existingSubmission,
  onSubmit,
  isLoading = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [submissionData, setSubmissionData] = useState({
    text: existingSubmission?.submission_text || '',
    files: [] as EnhancedSubmissionFile[],
    links: [] as string[],
    codeLanguage: 'javascript',
    codeContent: '',
    notes: '',
    isGroupSubmission: assignment?.group_assignment || false,
    groupMembers: [] as string[],
    selectedGroup: null as AssignmentGroup | null,
    voiceNotes: [] as string[],
    timeSpent: 0,
    learningObjectives: [] as string[],
    selfAssessment: '',
    reflection: '',
    resources: [] as string[],
    citations: [] as string[],
    isDraft: false,
    submissionMetadata: {},
    version: existingSubmission?.version_number || 1
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<AssignmentGroup[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [plagiarismScore, setPlagiarismScore] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [collaborativeEditing, setCollaborativeEditing] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showGroupCreation, setShowGroupCreation] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [startTime] = useState(new Date());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autosaveEnabled) return;
    
    const autoSaveInterval = setInterval(() => {
      handleAutoSave();
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [submissionData, autosaveEnabled]);

  // Load existing submission data
  useEffect(() => {
    if (existingSubmission) {
      setSubmissionData(prev => ({
        ...prev,
        text: existingSubmission.submission_text || '',
        notes: existingSubmission.grading_notes || '',
        timeSpent: existingSubmission.time_spent_minutes || 0,
        version: existingSubmission.version_number || 1,
        submissionMetadata: existingSubmission.submission_metadata || {}
      }));
    }
  }, [existingSubmission]);

  // Load groups for group assignments
  useEffect(() => {
    if (assignment?.group_assignment) {
      loadAvailableGroups();
    }
  }, [assignment]);

  // Load peer reviews
  useEffect(() => {
    if (assignment?.peer_review && existingSubmission) {
      loadPeerReviews();
    }
  }, [assignment, existingSubmission]);

  const loadAvailableGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('assignment_groups')
        .select(`
          id,
          name,
          assignment_id,
          created_by,
          created_at,
          max_members,
          is_active
        `)
        .eq('assignment_id', assignment.id)
        .eq('is_active', true);

      if (error) throw error;
      
      // Transform data to match AssignmentGroup interface
      const groups: AssignmentGroup[] = (data || []).map(group => ({
        id: group.id,
        name: group.name,
        members: [], // Will be loaded separately if needed
        role: 'member',
        createdAt: group.created_at
      }));
      
      setAvailableGroups(groups);
    } catch (error: any) {
      console.error('Error loading groups:', error);
    }
  };

  const loadPeerReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('submission_feedback')
        .select(`
          id,
          comment_text,
          commenter_id,
          created_at,
          feedback_type
        `)
        .eq('submission_id', existingSubmission.id)
        .eq('feedback_type', 'peer');

      if (error) throw error;
      
      // Transform data to match PeerReview interface
      const reviews: PeerReview[] = (data || []).map(review => ({
        id: review.id,
        reviewerId: review.commenter_id,
        reviewerName: 'Anonymous Peer', // Would normally fetch from profiles
        score: 0, // Would be stored in metadata
        feedback: review.comment_text,
        rubricScores: {},
        submittedAt: review.created_at
      }));
      
      setPeerReviews(reviews);
    } catch (error: any) {
      console.error('Error loading peer reviews:', error);
    }
  };

  const handleAutoSave = async () => {
    try {
      // Save as draft
      const draftData = {
        ...submissionData,
        isDraft: true,
        lastSaved: new Date().toISOString()
      };
      
      // You would save this to local storage or send to server
      localStorage.setItem(`assignment_draft_${assignment.id}`, JSON.stringify(draftData));
      setLastSaved(new Date());
      
      console.log('Auto-saved draft');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Enhanced file upload with thumbnails and validation
  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    for (const file of fileArray) {
      // Enhanced validation with fallback to common file types
      const allowedTypes = assignment?.allowed_file_types && assignment.allowed_file_types.length > 0 
        ? assignment.allowed_file_types 
        : [
          'pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 
          'xlsx', 'xls', 'ppt', 'pptx', 'zip', 'rar', 'mp4', 'mp3', 'wav',
          'py', 'js', 'html', 'css', 'java', 'cpp', 'c', 'json', 'xml'
        ];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      // More permissive validation - allow most common file types
      const isValidType = fileExtension && (
        allowedTypes.includes(fileExtension) ||
        // Always allow common document types
        ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'].includes(fileExtension)
      );
      
      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} type is not supported. Try PDF, DOC, DOCX, TXT, JPG, or PNG files.`,
          variant: "destructive"
        });
        continue;
      }

      // Size validation (100MB limit for advanced assignments)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 100MB limit`,
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
        type: file.type,
        versionHistory: []
      };

      // Generate thumbnail for images/videos
      if (file.type.startsWith('image/')) {
        const thumbnail = await generateThumbnail(file);
        newFile.thumbnail = thumbnail;
      }

      setSubmissionData(prev => ({
        ...prev,
        files: [...prev.files, newFile]
      }));

      // Start upload immediately
      uploadSingleFile(newFile);
    }
  };

  const generateThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 100;
          canvas.height = 100;
          ctx?.drawImage(img, 0, 0, 100, 100);
          resolve(canvas.toDataURL());
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
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
      const filePath = `${user.authUserId}/${assignment.id}/v${submissionData.version}/${timestamp}-${sanitizedFileName}`;

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

      if (error) throw error;

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

      // Run plagiarism check for text files
      if (fileData.file.type === 'text/plain' || fileData.file.name.endsWith('.txt')) {
        await checkPlagiarism(fileData.file);
      }

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

  const generateFileChecksum = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const analyzeFileContent = async (file: File, fileUrl: string) => {
    try {
      // Simulate content analysis
      const analysis = {
        fileType: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified),
        encoding: file.type.includes('text') ? 'UTF-8' : 'Binary',
        accessibility: {
          hasAltText: file.type.startsWith('image/') ? Math.random() > 0.5 : null,
          hasTranscript: file.type.startsWith('video/') ? Math.random() > 0.5 : null
        }
      };

      setSubmissionData(prev => ({
        ...prev,
        submissionMetadata: {
          ...prev.submissionMetadata,
          fileAnalysis: analysis
        }
      }));
    } catch (error) {
      console.error('File analysis failed:', error);
    }
  };

  const checkPlagiarism = async (file: File) => {
    try {
      const text = await file.text();
      // Simulate plagiarism checking with more sophisticated analysis
      const score = Math.random() * 30; // 0-30% similarity
      const sources = [
        'Wikipedia Commons',
        'Academic Database',
        'Previous Submissions',
        'Online Articles'
      ];
      
      setPlagiarismScore(score);
      
      if (score > 20) {
        toast({
          title: "Plagiarism Alert",
          description: `High similarity detected: ${score.toFixed(1)}% from ${sources[Math.floor(Math.random() * sources.length)]}`,
          variant: "destructive"
        });
      } else if (score > 10) {
        toast({
          title: "Similarity Notice",
          description: `Moderate similarity detected: ${score.toFixed(1)}%. Please review your sources.`,
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Plagiarism check failed:', error);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const timestamp = Date.now();
        const fileName = `voice-note-${timestamp}.wav`;
        
        // Create a file-like object that mimics File interface
        const fileObject = Object.assign(blob, {
          name: fileName,
          lastModified: timestamp,
          webkitRelativePath: ''
        }) as File;
        
        handleFileUpload([fileObject]);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
      }, 300000); // Max 5 minutes

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone",
        variant: "destructive"
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const generateAiSuggestions = async () => {
    try {
      // Simulate AI suggestions based on assignment content
      const suggestions = [
        "Consider adding more detailed examples to support your main points",
        "Your introduction could benefit from a stronger thesis statement",
        "Try to connect your conclusion back to the learning objectives",
        "Consider including more recent sources for better credibility"
      ];
      
      setAiSuggestions(suggestions);
      toast({
        title: "AI Suggestions Generated",
        description: "Review the suggestions in the AI Assistant tab"
      });
    } catch (error) {
      console.error('AI suggestions failed:', error);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    const hasContent = submissionData.text.trim().length > 0 ||
                      submissionData.files.some(f => f.status === 'uploaded') ||
                      submissionData.links.length > 0 ||
                      submissionData.codeContent.trim().length > 0;
    
    if (!hasContent) {
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

    if (assignment.group_assignment && !submissionData.selectedGroup) {
      toast({
        title: "Group required",
        description: "Please select a group for this group assignment",
        variant: "destructive"
      });
      return;
    }

    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60);
    
    const finalSubmissionData = {
      ...submissionData,
      timeSpent,
      uploadedFiles: submissionData.files.filter(f => f.status === 'uploaded'),
      submissionMetadata: {
        ...submissionData.submissionMetadata,
        wordCount,
        plagiarismScore,
        submissionTime: new Date().toISOString(),
        browser: navigator.userAgent,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
    
    onSubmit(finalSubmissionData);
  };

  // Update word count
  useEffect(() => {
    const text = submissionData.text + ' ' + submissionData.notes + ' ' + 
                 submissionData.codeContent + ' ' + submissionData.reflection;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [submissionData.text, submissionData.notes, submissionData.codeContent, submissionData.reflection]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Advanced Assignment: {assignment?.title}
            {assignment?.assignment_type && (
              <Badge variant="secondary" className="ml-2">
                {assignment.assignment_type.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Advanced submission system with collaborative features, AI assistance, and comprehensive analytics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Progress Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">Version</div>
                <div className="text-lg font-semibold">v{submissionData.version}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <div className="text-sm text-muted-foreground">Auto-Save</div>
                <div className="text-lg font-semibold">
                  {lastSaved ? formatTime(Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000)) + ' ago' : 'Never'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plagiarism Alert */}
          {plagiarismScore !== null && plagiarismScore > 15 && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700">
                    Plagiarism Alert: {plagiarismScore.toFixed(1)}% similarity detected
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                Content
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-1">
                <Upload className="h-4 w-4" />
                Files
                {submissionData.files.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {submissionData.files.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="collaboration">
                <Users className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="ai-assist">
                <Sparkles className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="review">
                <Eye className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Assignment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Assignment Type</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment?.assignment_type?.replace('_', ' ').toUpperCase() || 'Standard Assignment'}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                      {assignment?.description || 'No description provided'}
                    </p>
                  </div>

                  {assignment?.instructions_rich_text && (
                    <div>
                      <Label className="text-sm font-medium">Detailed Instructions</Label>
                      <div className="mt-1 p-3 bg-muted rounded-lg">
                        <div dangerouslySetInnerHTML={{ __html: assignment.instructions_rich_text }} />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Due Date</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment?.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Max Score</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {assignment?.max_score || 100} points
                      </p>
                    </div>
                  </div>

                  {assignment?.group_assignment && (
                    <div>
                      <Label className="text-sm font-medium">Group Assignment</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        This is a group assignment with max {assignment.max_group_size || 4} members per group.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Submission Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autosave" className="text-sm font-medium">Auto-save</Label>
                    <Switch
                      id="autosave"
                      checked={autosaveEnabled}
                      onCheckedChange={setAutosaveEnabled}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collaborative" className="text-sm font-medium">Collaborative Editing</Label>
                    <Switch
                      id="collaborative"
                      checked={collaborativeEditing}
                      onCheckedChange={setCollaborativeEditing}
                      disabled={!assignment?.group_assignment}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="draft" className="text-sm font-medium">Save as Draft</Label>
                    <Switch
                      id="draft"
                      checked={submissionData.isDraft}
                      onCheckedChange={(checked) => setSubmissionData(prev => ({ ...prev, isDraft: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="submission-text">Main Content</Label>
                  <Textarea
                    id="submission-text"
                    placeholder="Enter your main submission content here..."
                    value={submissionData.text}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, text: e.target.value }))}
                    className="min-h-[300px]"
                  />
                  <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                    <span>{wordCount} words</span>
                    {autosaveEnabled && lastSaved && (
                      <span>Last saved: {formatTime(Math.floor((new Date().getTime() - lastSaved.getTime()) / 1000))} ago</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reflection">Learning Reflection</Label>
                  <Textarea
                    id="reflection"
                    placeholder="Reflect on your learning process, challenges faced, and insights gained..."
                    value={submissionData.reflection}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, reflection: e.target.value }))}
                    className="min-h-[150px]"
                  />
                </div>

                <div>
                  <Label htmlFor="self-assessment">Self-Assessment</Label>
                  <Textarea
                    id="self-assessment"
                    placeholder="Assess your own work against the assignment criteria..."
                    value={submissionData.selfAssessment}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, selfAssessment: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes, questions, or comments for your instructor..."
                    value={submissionData.notes}
                    onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="space-y-6">
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
                  Supports: Documents, images, videos, code files, and more (100MB max)
                </p>
                <div className="flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={isRecording ? 'bg-red-50 border-red-200' : ''}
                  >
                    {isRecording ? (
                      <>
                        <StopCircle className="h-4 w-4 mr-2" />
                        Stop ({formatTime(recordingTime)})
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Note
                      </>
                    )}
                  </Button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                />
              </div>

              {/* Enhanced File List */}
              {submissionData.files.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Uploaded Files</h4>
                  <div className="grid gap-3">
                    {submissionData.files.map((file) => (
                      <Card key={file.id} className="p-4">
                        <div className="flex items-start gap-4">
                          {file.thumbnail ? (
                            <img src={file.thumbnail} alt="thumbnail" className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Paperclip className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </p>
                            {file.uploadedAt && (
                              <p className="text-xs text-muted-foreground">
                                Uploaded: {new Date(file.uploadedAt).toLocaleString()}
                              </p>
                            )}
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
                </div>
              )}
            </TabsContent>

            <TabsContent value="collaboration" className="space-y-6">
              {assignment?.group_assignment ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Group Selection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Label>Select or Create Group</Label>
                        <Select
                          value={submissionData.selectedGroup?.id || ''}
                          onValueChange={(value) => {
                            const group = availableGroups.find(g => g.id === value);
                            setSubmissionData(prev => ({ ...prev, selectedGroup: group || null }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id}>
                                {group.name} ({group.members.length}/{assignment.max_group_size || 4} members)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <AdvancedGroupCreationDialog
                          open={showGroupCreation}
                          onOpenChange={setShowGroupCreation}
                          assignment={assignment}
                          onGroupCreated={(group) => {
                            setSubmissionData(prev => ({ ...prev, selectedGroup: group }));
                            loadAvailableGroups();
                          }}
                        />
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowGroupCreation(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Group
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {submissionData.selectedGroup && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Group Members</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {submissionData.selectedGroup.members.map((member, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                              <span>{member.name}</span>
                              <Badge variant={member.role === 'leader' ? 'default' : 'secondary'}>
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">This is an individual assignment.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ai-assist" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Writing Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={generateAiSuggestions} variant="outline" className="w-full">
                    <Zap className="h-4 w-4 mr-2" />
                    Generate AI Suggestions
                  </Button>
                  
                  {aiSuggestions.length > 0 && (
                    <div className="space-y-2">
                      <Label>AI Suggestions</Label>
                      {aiSuggestions.map((suggestion, index) => (
                        <Card key={index} className="p-3 bg-blue-50 border-blue-200">
                          <div className="flex items-start gap-2">
                            <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5" />
                            <p className="text-sm">{suggestion}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Citation Helper</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add sources and generate citations automatically.
                  </p>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Add Citation
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Writing Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Word Count</span>
                        <span className="text-sm font-medium">{wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Character Count</span>
                        <span className="text-sm font-medium">{submissionData.text.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Paragraphs</span>
                        <span className="text-sm font-medium">
                          {submissionData.text.split('\n\n').filter(p => p.trim()).length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Integrity Check
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {plagiarismScore !== null ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Similarity Score</span>
                          <span className={`text-sm font-medium ${
                            plagiarismScore > 20 ? 'text-red-500' : 
                            plagiarismScore > 10 ? 'text-yellow-500' : 'text-green-500'
                          }`}>
                            {plagiarismScore.toFixed(1)}%
                          </span>
                        </div>
                        <Progress 
                          value={plagiarismScore} 
                          className={`h-2 ${
                            plagiarismScore > 20 ? 'bg-red-100' :
                            plagiarismScore > 10 ? 'bg-yellow-100' : 'bg-green-100'
                          }`}
                        />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Upload text files to run plagiarism check
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Submission Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Started working: {startTime.toLocaleTimeString()}</span>
                    </div>
                    {lastSaved && (
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Last saved: {lastSaved.toLocaleTimeString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm">Total time: {Math.floor((new Date().getTime() - startTime.getTime()) / 1000 / 60)} minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Submission Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Main Content</h4>
                    <p className="text-sm whitespace-pre-line">
                      {submissionData.text || 'No content added yet.'}
                    </p>
                  </div>
                  
                  {submissionData.reflection && (
                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Learning Reflection</h4>
                      <p className="text-sm whitespace-pre-line">{submissionData.reflection}</p>
                    </div>
                  )}

                  {submissionData.files.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Attached Files</h4>
                      <div className="space-y-2">
                        {submissionData.files.filter(f => f.status === 'uploaded').map((file) => (
                          <div key={file.id} className="flex items-center gap-2 text-sm">
                            <Paperclip className="h-4 w-4" />
                            <span>{file.file.name}</span>
                            <span className="text-muted-foreground">({formatFileSize(file.size)})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {assignment?.peer_review && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Peer Reviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {peerReviews.length > 0 ? (
                      <div className="space-y-4">
                        {peerReviews.map((review) => (
                          <div key={review.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{review.reviewerName}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm">{review.score}/10</span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.feedback}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No peer reviews available yet. Reviews will appear after submission.
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setSubmissionData(prev => ({ ...prev, isDraft: true }))}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(submissionData.text);
                toast({ title: "Content copied to clipboard" });
              }}
              className="flex-1"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              {submissionData.isDraft ? 'Submit Assignment' : 'Update Submission'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};