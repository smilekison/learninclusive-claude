import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useAssignments, useSupabaseMutation } from '@/hooks/useSupabaseQuery';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Upload,
  BarChart3,
  Search,
  Filter,
  GraduationCap,
  Target,
  TrendingUp,
  BookOpen,
  Star,
  Timer,
  Download,
  Eye,
  Edit,
  Archive,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { AdvancedSubmissionDialog } from '@/components/assignments/AdvancedSubmissionDialog';

export const StudentAssignmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentAssignments, setStudentAssignments] = useState<any[]>([]);
  const [submissionDialog, setSubmissionDialog] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  
  // New state for filtering and search
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('due_date');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  React.useEffect(() => {
    const fetchStudentAssignments = async () => {
      console.log('🔍 StudentAssignmentsPage: Starting fetchStudentAssignments');
      console.log('🔍 StudentAssignmentsPage: User:', user);
      
      if (!user) {
        console.log('❌ StudentAssignmentsPage: No user found');
        return;
      }
      
      try {
        // We already have the profile ID from the auth context
        const profile = { id: user.id };
        console.log('✅ StudentAssignmentsPage: Using profile from auth context:', profile);
        console.log('🔍 StudentAssignmentsPage: Fetching enrollments for student_id:', profile.id);

        // First, get the student's class enrollments
        const { data: enrollments, error: enrollmentError } = await supabase
          .from('student_enrollments')
          .select(`
            class_id,
            classes!inner(
              id,
              name,
              subjects(
                id,
                name,
                assignments(
                  *
                )
              )
            )
          `)
          .eq('student_id', profile.id)
          .eq('status', 'active');

        console.log('🔍 StudentAssignmentsPage: Enrollments query result:', { enrollments, error: enrollmentError });

        if (enrollmentError) {
          console.error('❌ StudentAssignmentsPage: Error fetching enrollments:', enrollmentError);
          setStudentAssignments([]);
          return;
        }

        if (!enrollments || enrollments.length === 0) {
          console.log('⚠️ StudentAssignmentsPage: No enrollments found for student. Student needs to be enrolled in classes.');
          setStudentAssignments([]);
          return;
        }

        console.log('✅ StudentAssignmentsPage: Found enrollments:', enrollments?.length || 0);

        // Extract all assignments from enrolled classes
        const allAssignments: any[] = [];
        enrollments?.forEach((enrollment, enrollmentIndex) => {
          console.log(`🔍 StudentAssignmentsPage: Processing enrollment ${enrollmentIndex}:`, enrollment);
          
          enrollment.classes?.subjects?.forEach((subject: any, subjectIndex: number) => {
            console.log(`🔍 StudentAssignmentsPage: Processing subject ${subjectIndex}:`, subject);
            
            subject.assignments?.forEach((assignment: any, assignmentIndex: number) => {
              console.log(`🔍 StudentAssignmentsPage: Processing assignment ${assignmentIndex}:`, assignment);
              
              if (assignment.is_active) {
                allAssignments.push({
                  ...assignment,
                  subject: {
                    id: subject.id,
                    name: subject.name,
                    class: {
                      id: enrollment.classes?.id,
                      name: enrollment.classes?.name
                    }
                  }
                });
              } else {
                console.log('⚠️ StudentAssignmentsPage: Skipping inactive assignment:', assignment.id);
              }
            });
          });
        });

        console.log('✅ StudentAssignmentsPage: Final assignments array:', allAssignments);
        console.log('📊 StudentAssignmentsPage: Total assignments found:', allAssignments.length);
        
        if (allAssignments.length === 0) {
          console.log('⚠️ StudentAssignmentsPage: No assignments found. Either no enrollments or no assignments in enrolled classes.');
          setStudentAssignments([]);
          return;
        }
        
        // Now get submissions for these assignments if any assignments exist
        if (allAssignments.length > 0) {
          console.log('🔍 StudentAssignmentsPage: Fetching submissions for assignments');
          const assignmentIds = allAssignments.map(a => a.id);
          
          const { data: submissionData, error: submissionError } = await supabase
            .from('assignment_submissions')
            .select('*')
            .in('assignment_id', assignmentIds)
            .eq('student_id', profile.id);

          console.log('🔍 StudentAssignmentsPage: Submissions query result:', { submissionData, error: submissionError });

          if (submissionError) {
            console.error('❌ StudentAssignmentsPage: Error fetching submissions:', submissionError);
          } else {
            console.log('✅ StudentAssignmentsPage: Found submissions:', submissionData?.length || 0);
            
            // Combine assignments with their submissions
            const processedAssignments = allAssignments.map(assignment => ({
              ...assignment,
              submissions: submissionData?.filter(sub => sub.assignment_id === assignment.id) || []
            }));

            // Sort by due date and creation date
            processedAssignments.sort((a, b) => {
              if (a.due_date && b.due_date) {
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              }
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });

            console.log('✅ StudentAssignmentsPage: Final processed assignments:', processedAssignments);
            setStudentAssignments(processedAssignments);
          }
        }
      } catch (error) {
        console.error('Error fetching student assignments:', error);
        setStudentAssignments([]);
      }
    };

    fetchStudentAssignments();
  }, [user]);

  // Filtering and sorting logic
  const filteredAssignments = useMemo(() => {
    let filtered = [...studentAssignments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(assignment => 
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.subject?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.subject?.id === subjectFilter);
    }

    // Tab filter
    switch (activeTab) {
      case 'pending':
        filtered = filtered.filter(assignment => 
          !assignment.submissions?.length || assignment.submissions.length === 0
        );
        break;
      case 'submitted':
        filtered = filtered.filter(assignment => 
          assignment.submissions?.length > 0 && assignment.submissions[0]?.score === null
        );
        break;
      case 'graded':
        filtered = filtered.filter(assignment => 
          assignment.submissions?.length > 0 && assignment.submissions[0]?.score !== null
        );
        break;
      case 'overdue':
        filtered = filtered.filter(assignment => {
          if (!assignment.due_date) return false;
          const hasSubmission = assignment.submissions?.length > 0;
          if (hasSubmission) return false;
          return new Date(assignment.due_date) < new Date();
        });
        break;
      case 'due-soon':
        filtered = filtered.filter(assignment => {
          if (!assignment.due_date) return false;
          const hasSubmission = assignment.submissions?.length > 0;
          if (hasSubmission) return false;
          const due = new Date(assignment.due_date);
          const now = new Date();
          const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
          return diffDays >= 0 && diffDays <= 7;
        });
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject?.name.localeCompare(b.subject?.name) || 0;
        default:
          return 0;
      }
    });

    return filtered;
  }, [studentAssignments, searchQuery, subjectFilter, activeTab, sortBy]);

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = studentAssignments.map(a => a.subject).filter(Boolean);
    return subjects.filter((subject, index, self) => 
      self.findIndex(s => s.id === subject.id) === index
    );
  }, [studentAssignments]);

  // Toggle card expansion
  const toggleCardExpansion = (assignmentId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(assignmentId)) {
      newExpanded.delete(assignmentId);
    } else {
      newExpanded.add(assignmentId);
    }
    setExpandedCards(newExpanded);
  };

  // Get assignment statistics for each tab
  const getTabStats = () => {
    const total = studentAssignments.length;
    const pending = studentAssignments.filter(a => !a.submissions?.length || a.submissions.length === 0).length;
    const submitted = studentAssignments.filter(a => a.submissions?.length > 0 && a.submissions[0]?.score === null).length;
    const graded = studentAssignments.filter(a => a.submissions?.length > 0 && a.submissions[0]?.score !== null).length;
    const overdue = studentAssignments.filter(a => {
      if (!a.due_date) return false;
      const hasSubmission = a.submissions?.length > 0;
      if (hasSubmission) return false;
      return new Date(a.due_date) < new Date();
    }).length;
    const dueSoon = studentAssignments.filter(a => {
      if (!a.due_date) return false;
      const hasSubmission = a.submissions?.length > 0;
      if (hasSubmission) return false;
      const due = new Date(a.due_date);
      const now = new Date();
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length;

    return { total, pending, submitted, graded, overdue, dueSoon };
  };

  const tabStats = getTabStats();

  const submitAssignmentMutation = useSupabaseMutation(
    async (data: any) => {
      if (!user?.id) throw new Error('User not found');

      // Get the student's profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Use the edge function for submission
      const { data: result, error } = await supabase.functions.invoke('submit-assignment', {
        body: {
          assignmentId: data.assignmentId,
          studentId: profile.id,
          submissionText: data.submissionText,
          filePath: data.files?.[0]?.file?.name || null
        }
      });

      if (error) throw error;
      return result;
    },
    {
      successMessage: "Assignment submitted successfully!",
      onSuccess: () => {
        setSubmissionDialog(false);
        setSubmissionText('');
        setSubmissionFile(null);
        setSelectedAssignment(null);
        window.location.reload();
      }
    }
  );

  const handleAdvancedSubmission = (submissionData: any) => {
    if (!selectedAssignment) return;
    
    const mutationData = {
      assignmentId: selectedAssignment.id,
      submissionText: submissionData.submissionText,
      files: submissionData.files,
      links: submissionData.links,
      codeContent: submissionData.codeContent,
      codeLanguage: submissionData.codeLanguage,
      notes: submissionData.notes,
      timeSpent: submissionData.timeSpent,
      wordCount: submissionData.wordCount
    };

    submitAssignmentMutation.mutate(mutationData);
  };

  const getStatusBadge = (assignment: any) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    
    if (hasSubmission) {
      const submission = assignment.submissions[0];
      if (submission.score !== null) {
        return <Badge variant="default">Graded</Badge>;
      }
      return <Badge variant="secondary">Submitted</Badge>;
    }

    if (!assignment.due_date) {
      return <Badge variant="outline">No due date</Badge>;
    }

    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return <Badge variant="destructive">Overdue</Badge>;
    if (diffDays <= 1) return <Badge variant="destructive">Due soon</Badge>;
    if (diffDays <= 7) return <Badge variant="default">Due this week</Badge>;
    return <Badge variant="secondary">Upcoming</Badge>;
  };

  const getUrgencyIcon = (assignment: any) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
    if (hasSubmission) return <CheckCircle className="h-4 w-4 text-success" />;
    
    if (!assignment.due_date) return <FileText className="h-4 w-4 text-muted-foreground" />;
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays <= 1) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (diffDays <= 3) return <Clock className="h-4 w-4 text-warning" />;
    return <Calendar className="h-4 w-4 text-primary" />;
  };

  const getPriorityLevel = (assignment: any) => {
    if (!assignment.due_date) return 'low';
    const hasSubmission = assignment.submissions?.length > 0;
    if (hasSubmission) return 'completed';
    
    const due = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'high';
    if (diffDays <= 7) return 'medium';
    return 'low';
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-foreground">My Assignments</h1>
          <p className="text-muted-foreground mt-2">
            View and submit your assignments
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-6 card-elevated border-l-4 border-l-primary">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
            <CardTitle className="flex items-center gap-2 text-primary">
              <BarChart3 className="w-5 h-5" />
              Assignment Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <div className="text-3xl font-bold text-primary">{studentAssignments.length}</div>
                <div className="text-sm font-medium text-primary/80 mt-1">Total</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20">
                <div className="text-3xl font-bold text-success">
                  {studentAssignments.filter(a => a.submissions?.length > 0).length}
                </div>
                <div className="text-sm font-medium text-success/80 mt-1">Submitted</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                <div className="text-3xl font-bold text-warning">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score === null
                  ).length}
                </div>
                <div className="text-sm font-medium text-warning/80 mt-1">Pending</div>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                <div className="text-3xl font-bold text-accent">
                  {studentAssignments.filter(a => 
                    a.submissions?.length > 0 && a.submissions[0]?.score !== null
                  ).length}
                </div>
                <div className="text-sm font-medium text-accent/80 mt-1">Graded</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Search and Filters */}
        <Card className="animate-fade-in">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search assignments, subjects, or descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {uniqueSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="created_at">Date Added</SelectItem>
                  <SelectItem value="title">Title A-Z</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Assignment View */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="animate-fade-in">
          <TabsList className="grid w-full grid-cols-6 bg-muted/30">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              All ({tabStats.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Pending ({tabStats.pending})
            </TabsTrigger>
            <TabsTrigger value="due-soon" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Due Soon ({tabStats.dueSoon})
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Overdue ({tabStats.overdue})
            </TabsTrigger>
            <TabsTrigger value="submitted" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Submitted ({tabStats.submitted})
            </TabsTrigger>
            <TabsTrigger value="graded" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Graded ({tabStats.graded})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAssignments.map((assignment: any) => {
                const hasSubmission = assignment.submissions && assignment.submissions.length > 0;
                const submission = hasSubmission ? assignment.submissions[0] : null;
                const priorityLevel = getPriorityLevel(assignment);
                const isExpanded = expandedCards.has(assignment.id);

                const getBorderColor = () => {
                  if (hasSubmission) {
                    return submission?.score !== null ? 'border-l-success' : 'border-l-primary';
                  }
                  if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
                    return 'border-l-destructive';
                  }
                  return 'border-l-muted-foreground';
                };

                const getCardGradient = () => {
                  if (hasSubmission) {
                    return submission?.score !== null 
                      ? 'bg-gradient-to-br from-success/5 to-success/2' 
                      : 'bg-gradient-to-br from-primary/5 to-primary/2';
                  }
                  if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
                    return 'bg-gradient-to-br from-destructive/5 to-destructive/2';
                  }
                  return 'bg-gradient-to-br from-muted/5 to-background';
                };

                const getPriorityColor = () => {
                  switch (priorityLevel) {
                    case 'urgent': return 'text-destructive';
                    case 'high': return 'text-warning';
                    case 'medium': return 'text-primary';
                    case 'overdue': return 'text-destructive';
                    case 'completed': return 'text-success';
                    default: return 'text-muted-foreground';
                  }
                };

                return (
                  <Card 
                    key={assignment.id} 
                    className={`card-elevated hover:shadow-medium transition-all duration-300 border-l-4 ${getBorderColor()} ${getCardGradient()} animate-scale-in`}
                  >
                    <Collapsible open={isExpanded} onOpenChange={() => toggleCardExpansion(assignment.id)}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getUrgencyIcon(assignment)}
                              <CardTitle className="text-lg line-clamp-2">{assignment.title}</CardTitle>
                              <Badge className={getPriorityColor()}>{priorityLevel.toUpperCase()}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {assignment.subject?.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                {assignment.subject?.class?.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(assignment)}
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover-scale">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          {assignment.due_date && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>{assignment.max_score} points</span>
                          </div>
                        </div>

                        {hasSubmission && submission && (
                          <div className="mt-3 p-3 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-success flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Submitted {new Date(submission.submitted_at).toLocaleDateString()}
                              </p>
                              {submission.score !== null && submission.score !== undefined && assignment?.max_score && (
                                <div className="text-right">
                                  <p className="text-lg font-bold text-success">
                                    {submission.score}/{assignment.max_score}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {Math.round((submission.score / assignment.max_score) * 100)}%
                                  </p>
                                </div>
                              )}
                            </div>
                            {submission.score !== null && submission.score !== undefined && assignment?.max_score && (
                              <Progress 
                                value={(submission.score / assignment.max_score) * 100} 
                                className="mt-2 h-2"
                              />
                            )}
                          </div>
                        )}
                      </CardHeader>

                      <CollapsibleContent className="animate-accordion-down">
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2 text-foreground">Description</h4>
                              <p className="text-sm text-muted-foreground">
                                {assignment.description || 'No description provided'}
                              </p>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2 text-foreground">Assignment Details</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <TrendingUp className="w-4 h-4" />
                                  <span>Max Attempts: {assignment.max_attempts}</span>
                                </div>
                              </div>
                            </div>

                            {/* Comprehensive Graded Assignment Details */}
                            {submission && submission.score !== null && submission.score !== undefined && (
                              <div className="space-y-6">
                                {/* Grade Overview */}
                                <div>
                                  <h4 className="font-bold mb-3 text-success flex items-center gap-2">
                                    <Star className="w-5 h-5" />
                                    Grade Overview
                                  </h4>
                                  <div className="p-4 bg-gradient-to-r from-success/10 to-primary/10 rounded-lg border border-success/20">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-success">
                                          {submission.score}/{assignment.max_score}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Final Score</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-3xl font-bold text-primary">
                                          {Math.round((submission.score / assignment.max_score) * 100)}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Percentage</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-semibold text-accent capitalize">
                                          {submission.submission_quality || 'Good'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Quality Rating</div>
                                      </div>
                                    </div>
                                    <Progress 
                                      value={(submission.score / assignment.max_score) * 100} 
                                      className="mt-4 h-3"
                                    />
                                  </div>
                                </div>

                                {/* Rubric Breakdown */}
                                {submission.rubric_scores && Array.isArray(submission.rubric_scores) && submission.rubric_scores.length > 0 && (
                                  <div>
                                    <h4 className="font-bold mb-3 text-primary flex items-center gap-2">
                                      <BarChart3 className="w-5 h-5" />
                                      Rubric Breakdown
                                    </h4>
                                    <div className="space-y-3">
                                      {submission.rubric_scores.map((rubric: any, index: number) => (
                                        <div key={index} className="p-3 bg-card rounded-lg border border-muted">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-foreground">{rubric.criteria}</span>
                                            <span className="font-bold text-primary">{rubric.score}/20</span>
                                          </div>
                                          <Progress 
                                            value={(rubric.score / 20) * 100} 
                                            className="h-2"
                                          />
                                          <div className="text-xs text-muted-foreground mt-1">
                                            {Math.round((rubric.score / 20) * 100)}% - {rubric.score >= 18 ? 'Excellent' : rubric.score >= 15 ? 'Good' : rubric.score >= 12 ? 'Satisfactory' : 'Needs Improvement'}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Teacher Feedback */}
                                {submission.feedback && (
                                  <div>
                                    <h4 className="font-bold mb-3 text-accent flex items-center gap-2">
                                      <Eye className="w-5 h-5" />
                                      Teacher Feedback
                                    </h4>
                                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                                      <p className="text-foreground leading-relaxed">{submission.feedback}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Grading Notes */}
                                {submission.grading_notes && (
                                  <div>
                                    <h4 className="font-bold mb-3 text-warning flex items-center gap-2">
                                      <FileText className="w-5 h-5" />
                                      Additional Notes
                                    </h4>
                                    <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
                                      <p className="text-foreground leading-relaxed">{submission.grading_notes}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Grading Information */}
                                <div>
                                  <h4 className="font-bold mb-3 text-muted-foreground flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Grading Information
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 bg-muted/20 rounded-lg border border-muted">
                                      <div className="text-sm text-muted-foreground">Graded On</div>
                                      <div className="font-medium text-foreground">
                                        {submission.graded_at ? new Date(submission.graded_at).toLocaleString() : 'Not available'}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-muted">
                                      <div className="text-sm text-muted-foreground">Time Spent</div>
                                      <div className="font-medium text-foreground">
                                        {submission.time_spent_minutes ? `${submission.time_spent_minutes} minutes` : 'Not tracked'}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-muted">
                                      <div className="text-sm text-muted-foreground">Attempt Number</div>
                                      <div className="font-medium text-foreground">
                                        {submission.attempt_number || 1} of {assignment.max_attempts}
                                      </div>
                                    </div>
                                    <div className="p-3 bg-muted/20 rounded-lg border border-muted">
                                      <div className="text-sm text-muted-foreground">Late Submission</div>
                                      <div className="font-medium text-foreground">
                                        {submission.late_submission ? (
                                          <span className="text-destructive">Yes</span>
                                        ) : (
                                          <span className="text-success">No</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {submission && submission.submission_text && (
                              <div>
                                <h4 className="font-medium mb-2 text-muted-foreground">Your Submission</h4>
                                <div className="p-3 bg-card rounded-lg border border-muted">
                                  <p className="text-sm text-foreground">{submission.submission_text}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </CollapsibleContent>

                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          {!hasSubmission ? (
                            <Button 
                              className="flex-1 hover-scale" 
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                setSubmissionDialog(true);
                              }}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Submit Assignment
                            </Button>
                          ) : (
                            <div className="flex gap-2 w-full">
                              <Button 
                                variant="outline" 
                                className="flex-1 hover-scale"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setSubmissionText(submission?.submission_text || '');
                                  setSubmissionDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              {submission?.score === null && (
                                <Button 
                                  variant="secondary" 
                                  className="flex-1 hover-scale"
                                  onClick={() => {
                                    setSelectedAssignment(assignment);
                                    setSubmissionText('');
                                    setSubmissionDialog(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Resubmit
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Collapsible>
                  </Card>
                );
              })}
              
              {filteredAssignments.length === 0 && (
                <div className="col-span-full text-center py-12 animate-fade-in">
                  <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {activeTab === 'all' 
                      ? "You don't have any assignments yet. Enroll in a class to see assignments."
                      : `No assignments match the current filter: ${activeTab.replace('-', ' ')}`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Button onClick={() => window.location.href = '/join-subject'} className="hover-scale">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Join a Subject
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Submission Dialog */}
        {selectedAssignment && (
          <AdvancedSubmissionDialog
            open={submissionDialog}
            onOpenChange={setSubmissionDialog}
            assignment={selectedAssignment}
            existingSubmission={selectedAssignment?.submissions?.[0]}
            onSubmit={handleAdvancedSubmission}
            isLoading={submitAssignmentMutation.isPending}
          />
        )}
      </main>
    </div>
  );
};