import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, FileText, Code, Link2, Mic, Video, Camera, Globe,
  Save, Send, Eye, Clock, Target, Award, Users, Brain,
  ChevronDown, Plus, Trash2, Download, Copy, RefreshCw,
  Sparkles, Accessibility, Volume2, Keyboard, MousePointer,
  Play, Pause, Square, RotateCcw, Zap, Lightbulb,
  MessageSquare, ThumbsUp, Share2, BookOpen, HelpCircle,
  AlertCircle, CheckCircle, Timer, Gauge, TrendingUp,
  PenTool, Type, Image, Music, Film, Layers, Palette,
  Settings, Maximize2, Minimize2, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UltraAdvancedSubmissionInterfaceProps {
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
  path?: string;
  metadata?: any;
}

export const UltraAdvancedSubmissionInterface: React.FC<UltraAdvancedSubmissionInterfaceProps> = ({
  open,
  onOpenChange,
  assignment,
  existingSubmission,
  onSubmit,
  isLoading = false
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('text');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [fullScreenMode, setFullScreenMode] = useState(false);
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [collaborativeMode, setCollaborativeMode] = useState(false);
  const [aiAssistanceActive, setAiAssistanceActive] = useState(false);
  const [voiceInputActive, setVoiceInputActive] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<Date>(new Date());
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [submissionData, setSubmissionData] = useState({
    text: existingSubmission?.submission_text || '',
    files: [] as SubmissionFile[],
    links: [] as string[],
    codeLanguage: 'javascript',
    codeContent: '',
    audioRecordings: [] as Blob[],
    videoRecordings: [] as Blob[],
    drawings: [] as string[],
    notes: '',
    reflections: '',
    citations: [] as any[],
    collaborators: [] as string[],
    version: 1,
    tags: [] as string[],
    metadata: {
      timeSpent: 0,
      wordCount: 0,
      editHistory: [] as any[],
      accessibilityUsed: [] as string[],
      aiAssistanceUsed: false,
      voiceInputUsed: false,
      collaborativeFeatures: false
    }
  });

  // Time tracking
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTimeRef.current.getTime()) / 1000);
      setTimeSpent(elapsed);
      setSubmissionData(prev => ({
        ...prev,
        metadata: { ...prev.metadata, timeSpent: elapsed }
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Word count tracking
  useEffect(() => {
    const text = submissionData.text + ' ' + submissionData.notes + ' ' + submissionData.reflections;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    setWordCount(count);
    setSubmissionData(prev => ({
      ...prev,
      metadata: { ...prev.metadata, wordCount: count }
    }));
  }, [submissionData.text, submissionData.notes, submissionData.reflections]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setSaveStatus('unsaved');
    autoSaveTimerRef.current = setTimeout(async () => {
      await handleAutoSave();
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [submissionData, autoSaveEnabled]);

  const handleAutoSave = async () => {
    if (!assignment?.id) return;
    
    setSaveStatus('saving');
    try {
      localStorage.setItem(`submission_draft_${assignment.id}`, JSON.stringify({
        ...submissionData,
        savedAt: new Date().toISOString()
      }));
      setSaveStatus('saved');
    } catch (error) {
      console.error('Auto-save failed:', error);
      setSaveStatus('unsaved');
    }
  };

  const loadDraft = () => {
    if (!assignment?.id) return;
    
    try {
      const draft = localStorage.getItem(`submission_draft_${assignment.id}`);
      if (draft) {
        const parsedDraft = JSON.parse(draft);
        setSubmissionData(parsedDraft);
        toast.success(`Draft loaded from ${new Date(parsedDraft.savedAt).toLocaleString()}`);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
      toast.error('Failed to load draft');
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setSubmissionData(prev => ({
          ...prev,
          audioRecordings: [...prev.audioRecordings, audioBlob]
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(timer);
      }, 300000); // Max 5 minutes

    } catch (error) {
      console.error('Recording failed:', error);
      toast.error('Failed to start recording');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      toast.success('Recording saved');
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!assignment?.id) return;

    Array.from(files).forEach(async (file) => {
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

      // Start upload
      try {
        setSubmissionData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileId ? { ...f, status: 'uploading' } : f
          )
        }));

        const timestamp = Date.now();
        const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const fileName = `${timestamp}-${sanitizedFileName}`;
        const filePath = `${user?.authUserId}/${assignment.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from('assignment-submissions')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;

        setSubmissionData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: 'uploaded', 
              progress: 100,
              path: data.path,
              metadata: {
                name: file.name,
                size: file.size,
                type: file.type
              }
            } : f
          )
        }));

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Upload failed:', error);
        setSubmissionData(prev => ({
          ...prev,
          files: prev.files.map(f => 
            f.id === fileId ? { ...f, status: 'error' } : f
          )
        }));
        toast.error(`Failed to upload ${file.name}`);
      }
    });
  };

  const enableVoiceInput = async () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error('Voice input not supported in this browser');
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceInputActive(true);
      toast.success('Voice input started');
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      setSubmissionData(prev => ({
        ...prev,
        text: prev.text + ' ' + transcript,
        metadata: { ...prev.metadata, voiceInputUsed: true }
      }));
    };

    recognition.onerror = () => {
      setVoiceInputActive(false);
      toast.error('Voice input error');
    };

    recognition.onend = () => {
      setVoiceInputActive(false);
      toast.info('Voice input stopped');
    };

    recognition.start();
  };

  const getAIAssistance = async (type: string) => {
    setAiAssistanceActive(true);
    try {
      // Simulate AI assistance
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (type === 'improve') {
        toast.success('AI suggestions for improvement added');
      } else if (type === 'grammar') {
        toast.success('Grammar and style improvements suggested');
      } else if (type === 'citations') {
        toast.success('Citation recommendations provided');
      }

      setSubmissionData(prev => ({
        ...prev,
        metadata: { ...prev.metadata, aiAssistanceUsed: true }
      }));
    } catch (error) {
      toast.error('AI assistance failed');
    } finally {
      setAiAssistanceActive(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = () => {
    // Validation
    const hasContent = submissionData.text.trim() || 
                      submissionData.files.length > 0 || 
                      submissionData.codeContent.trim() ||
                      submissionData.audioRecordings.length > 0;

    if (!hasContent) {
      toast.error('Please add some content to your submission');
      return;
    }

    // Prepare submission data
    const submissionPayload = {
      submission_text: submissionData.text,
      file_path: JSON.stringify(submissionData.files.filter(f => f.status === 'uploaded')),
      submission_metadata: JSON.stringify({
        ...submissionData.metadata,
        codeContent: submissionData.codeContent,
        codeLanguage: submissionData.codeLanguage,
        links: submissionData.links,
        notes: submissionData.notes,
        reflections: submissionData.reflections,
        citations: submissionData.citations,
        tags: submissionData.tags,
        audioRecordings: submissionData.audioRecordings.length,
        videoRecordings: submissionData.videoRecordings.length,
        totalTimeSpent: timeSpent,
        finalWordCount: wordCount,
        accessibilityFeaturesUsed: accessibilityMode,
        aiAssistanceUsed: submissionData.metadata.aiAssistanceUsed,
        voiceInputUsed: submissionData.metadata.voiceInputUsed
      }),
      time_spent_minutes: Math.ceil(timeSpent / 60),
      assignment_id: assignment.id,
      student_id: user?.id
    };

    onSubmit(submissionPayload);
  };

  const accessibilityFeatures = [
    { key: 'highContrast', label: 'High Contrast', icon: Eye },
    { key: 'largeText', label: 'Large Text', icon: Type },
    { key: 'keyboardNav', label: 'Keyboard Navigation', icon: Keyboard },
    { key: 'screenReader', label: 'Screen Reader', icon: Volume2 },
    { key: 'voiceInput', label: 'Voice Input', icon: Mic }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "max-w-7xl max-h-[95vh] overflow-hidden flex flex-col transition-all duration-300",
        fullScreenMode && "max-w-full max-h-full w-screen h-screen",
        darkMode && "dark",
        accessibilityMode && "ring-2 ring-blue-500"
      )}>
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Target className="w-6 h-6 text-primary" />
                <Sparkles className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1" />
              </div>
              <span>Submit: {assignment?.title}</span>
              <div className="flex gap-2">
                {assignment?.group_assignment && <Badge variant="secondary">Group</Badge>}
                {assignment?.ai_assistance_config?.enabled && <Badge variant="secondary">AI Assisted</Badge>}
                <Badge variant="outline" className="text-xs">
                  {formatTime(timeSpent)}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAccessibilityMode(!accessibilityMode)}
                className={cn(accessibilityMode && "bg-blue-100 dark:bg-blue-900")}
              >
                <Accessibility className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFullScreenMode(!fullScreenMode)}
              >
                {fullScreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Accessibility Panel */}
        {accessibilityMode && (
          <Card className="mb-4 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Accessibility className="w-4 h-4 text-blue-600" />
                Accessibility Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {accessibilityFeatures.map(({ key, label, icon: Icon }) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (key === 'voiceInput') {
                        enableVoiceInput();
                      } else if (key === 'largeText') {
                        setFontSize(prev => prev === 16 ? 20 : 16);
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </Button>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <Label className="text-xs">Font Size</Label>
                <Slider
                  value={[fontSize]}
                  onValueChange={(value) => setFontSize(value[0])}
                  min={12}
                  max={24}
                  step={2}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="grid grid-cols-7 w-fit">
                <TabsTrigger value="text" className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Text
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-1">
                  <Code className="w-3 h-3" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="media" className="flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  Media
                </TabsTrigger>
                <TabsTrigger value="links" className="flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  Links
                </TabsTrigger>
                <TabsTrigger value="collaborate" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Collaborate
                </TabsTrigger>
                <TabsTrigger value="review" className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Review
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Timer className="w-3 h-3" />
                  {formatTime(timeSpent)}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Type className="w-3 h-3" />
                  {wordCount} words
                </div>
                <Badge variant={saveStatus === 'saved' ? 'secondary' : 'destructive'} className="text-xs">
                  {saveStatus === 'saved' && <CheckCircle className="w-3 h-3 mr-1" />}
                  {saveStatus === 'saving' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                  {saveStatus === 'unsaved' && <AlertCircle className="w-3 h-3 mr-1" />}
                  {saveStatus}
                </Badge>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6" style={{ fontSize: `${fontSize}px` }}>
                {/* Text Tab */}
                <TabsContent value="text" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Text Submission
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getAIAssistance('improve')}
                            disabled={aiAssistanceActive}
                          >
                            <Brain className="w-4 h-4 mr-1" />
                            AI Improve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={enableVoiceInput}
                            className={cn(voiceInputActive && "bg-red-100 dark:bg-red-900")}
                          >
                            <Mic className="w-4 h-4 mr-1" />
                            {voiceInputActive ? 'Stop' : 'Voice'}
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={submissionData.text}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, text: e.target.value }))}
                        placeholder="Start typing your submission..."
                        className="min-h-[400px] resize-none"
                        style={{ fontSize: `${fontSize}px` }}
                      />
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => getAIAssistance('grammar')}
                          >
                            <Zap className="w-4 h-4 mr-1" />
                            Grammar Check
                          </Button>
                          <Button variant="outline" size="sm">
                            <PenTool className="w-4 h-4 mr-1" />
                            Format
                          </Button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {wordCount} words • {Math.ceil(wordCount / 200)} min read
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reflection Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Reflection & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={submissionData.reflections}
                        onChange={(e) => setSubmissionData(prev => ({ ...prev, reflections: e.target.value }))}
                        placeholder="Reflect on your learning process..."
                        className="min-h-[100px]"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Files Tab */}
                <TabsContent value="files" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        File Attachments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div 
                        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files) {
                            handleFileUpload(e.dataTransfer.files);
                          }
                        }}
                      >
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Upload Files</h3>
                        <p className="text-muted-foreground mb-4">
                          Drag and drop files here, or click to browse
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Supported formats: PDF, DOC, DOCX, TXT, images, and more
                        </p>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files) {
                            handleFileUpload(e.target.files);
                          }
                        }}
                      />

                      {submissionData.files.length > 0 && (
                        <div className="mt-6 space-y-3">
                          <h4 className="font-medium">Uploaded Files</h4>
                          {submissionData.files.map((file) => (
                            <div key={file.id} className="flex items-center justify-between p-3 border rounded">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{file.file.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {file.status === 'uploading' && (
                                  <Progress value={file.progress} className="w-20" />
                                )}
                                {file.status === 'uploaded' && (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                )}
                                {file.status === 'error' && (
                                  <AlertCircle className="w-5 h-5 text-red-500" />
                                )}
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value="media" className="space-y-4 mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Audio Recording */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Mic className="w-5 h-5" />
                          Audio Recording
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center">
                          {isRecording ? (
                            <div>
                              <div className="w-20 h-20 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                                <Mic className="w-8 h-8 text-white" />
                              </div>
                              <p className="text-lg font-medium">Recording...</p>
                              <p className="text-2xl font-mono">{formatTime(recordingTime)}</p>
                              <Button
                                onClick={stopAudioRecording}
                                className="mt-4 bg-red-500 hover:bg-red-600"
                              >
                                <Square className="w-4 h-4 mr-2" />
                                Stop Recording
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="w-20 h-20 mx-auto mb-4 bg-primary rounded-full flex items-center justify-center">
                                <Mic className="w-8 h-8 text-white" />
                              </div>
                              <Button onClick={startAudioRecording}>
                                <Play className="w-4 h-4 mr-2" />
                                Start Recording
                              </Button>
                            </div>
                          )}
                        </div>

                        {submissionData.audioRecordings.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium">Recordings ({submissionData.audioRecordings.length})</h4>
                            {submissionData.audioRecordings.map((recording, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <span>Recording {index + 1}</span>
                                <div className="flex gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Play className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Video Recording */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          Video Recording
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-muted-foreground">Video recording coming soon</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review" className="space-y-4 mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5" />
                        Submission Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Summary Statistics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{wordCount}</div>
                          <div className="text-sm text-muted-foreground">Words</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{submissionData.files.filter(f => f.status === 'uploaded').length}</div>
                          <div className="text-sm text-muted-foreground">Files</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">{formatTime(timeSpent)}</div>
                          <div className="text-sm text-muted-foreground">Time Spent</div>
                        </div>
                        <div className="text-center p-3 border rounded">
                          <div className="text-2xl font-bold text-primary">
                            {submissionData.audioRecordings.length + submissionData.videoRecordings.length}
                          </div>
                          <div className="text-sm text-muted-foreground">Media</div>
                        </div>
                      </div>

                      {/* Preview */}
                      <div className="border rounded-lg p-4 bg-muted/30">
                        <h4 className="font-medium mb-3">Content Preview</h4>
                        {submissionData.text && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Text Content:</h5>
                            <div className="bg-background p-3 rounded border text-sm max-h-40 overflow-y-auto">
                              {submissionData.text.substring(0, 500)}
                              {submissionData.text.length > 500 && '...'}
                            </div>
                          </div>
                        )}

                        {submissionData.files.filter(f => f.status === 'uploaded').length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-medium mb-2">Attached Files:</h5>
                            <div className="space-y-1">
                              {submissionData.files.filter(f => f.status === 'uploaded').map(file => (
                                <div key={file.id} className="text-sm flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  {file.file.name}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {submissionData.reflections && (
                          <div>
                            <h5 className="text-sm font-medium mb-2">Reflections:</h5>
                            <div className="bg-background p-3 rounded border text-sm">
                              {submissionData.reflections}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Submission Quality Check */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Submission Quality Check</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Has content</span>
                              {(submissionData.text.trim() || submissionData.files.length > 0) ? 
                                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                <AlertCircle className="w-4 h-4 text-red-500" />
                              }
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Minimum word count (100 words)</span>
                              {wordCount >= 100 ? 
                                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              }
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Has reflection</span>
                              {submissionData.reflections.trim() ? 
                                <CheckCircle className="w-4 h-4 text-green-500" /> : 
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                              }
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="border-t pt-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Auto-save</Label>
              <Switch
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
            </div>
            <Button variant="outline" size="sm" onClick={loadDraft}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Load Draft
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => setIsPreviewMode(!isPreviewMode)}>
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-primary hover:bg-primary/90">
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Submit Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};