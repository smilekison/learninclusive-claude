import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherInsights } from '@/hooks/useSupabaseQuery';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Filter,
  Search
} from 'lucide-react';

interface EngagementData {
  id: string;
  name: string;
  type: 'teacher' | 'class' | 'subject' | 'student';
  engagementScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  metrics: {
    attendanceRate: number;
    assignmentCompletion: number;
    participationScore: number;
    lastActivity: string;
  };
  trends: {
    engagement: 'up' | 'down' | 'stable';
    performance: 'up' | 'down' | 'stable';
  };
  additionalInfo?: {
    className?: string;
    subjectName?: string;
    teacherName?: string;
    grade?: string;
  };
}

// Remove mock data since we're using real data now

export const InsightsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Use teacher-specific insights
  const { data: teacherInsights = [] } = useTeacherInsights();

  // Handle URL parameters for filtering
  useEffect(() => {
    const classId = searchParams.get('classId');
    const teacherId = searchParams.get('teacherId');
    const subjectId = searchParams.get('subjectId');
    
    if (classId) {
      setClassFilter(classId);
      setFilterType('class');
    } else if (teacherId) {
      setClassFilter('all');
      setFilterType('teacher');
    } else if (subjectId) {
      setClassFilter('all');
      setFilterType('subject');
    }
  }, [searchParams]);

  const isPrincipal = user?.role === 'principal';
  
  // Filter data based on user role and filters
  const getFilteredData = () => {
    let data = teacherInsights;
    
    // For teachers, data is already filtered to their classes/subjects/students
    // For principals, they would see all data (but not implemented yet)
    
    // Apply search filter
    if (searchTerm) {
      data = data.filter((item: any) => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.additionalInfo?.teacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.additionalInfo?.className?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      data = data.filter((item: any) => item.type === filterType);
    }

    // Apply risk filter
    if (riskFilter !== 'all') {
      data = data.filter((item: any) => item.riskLevel === riskFilter);
    }

    // Apply grade filter
    if (gradeFilter !== 'all') {
      data = data.filter((item: any) => 
        item.additionalInfo?.grade === gradeFilter ||
        item.name.includes(gradeFilter)
      );
    }

    // Apply class filter (for class-specific insights)
    if (classFilter !== 'all') {
      const classId = searchParams.get('classId');
      if (classId) {
        // Filter by specific class ID from URL parameter
        data = data.filter((item: any) => {
          if (item.type === 'class') {
            return item.id === classId;
          } else if (item.type === 'subject') {
            return item.additionalInfo?.classId === classId;
          } else if (item.type === 'student') {
            return item.additionalInfo?.classId === classId;
          }
          return false;
        });
      } else {
        // Regular class filter
        data = data.filter((item: any) => 
          item.id === classFilter || 
          item.additionalInfo?.className?.includes(classFilter) ||
          (item.type === 'class' && item.id === classFilter)
        );
      }
    }

    return data;
  };

  const filteredData = getFilteredData();

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-success';
      case 'medium': return 'text-warning';
      case 'high': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getRiskBadgeVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'low': return 'secondary';
      case 'medium': return 'outline';
      case 'high': return 'destructive';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-success" />;
      case 'down': return <TrendingDown className="h-3 w-3 text-destructive" />;
      default: return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'teacher': return <Users className="h-4 w-4" />;
      case 'class': return <GraduationCap className="h-4 w-4" />;
      case 'subject': return <BookOpen className="h-4 w-4" />;
      case 'student': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getAvailableTypes = () => {
    if (isPrincipal) {
      return [
        { value: 'all', label: 'All Types' },
        { value: 'teacher', label: 'Teachers' },
        { value: 'class', label: 'Classes' },
        { value: 'subject', label: 'Subjects' }
      ];
    } else {
      return [
        { value: 'all', label: 'All Types' },
        { value: 'student', label: 'Students' },
        { value: 'class', label: 'Classes' },
        { value: 'subject', label: 'Subjects' }
      ];
    }
  };

  const getSummaryStats = () => {
    const total = filteredData.length;
    const lowRisk = filteredData.filter((item: any) => item.riskLevel === 'low').length;
    const mediumRisk = filteredData.filter((item: any) => item.riskLevel === 'medium').length;
    const highRisk = filteredData.filter((item: any) => item.riskLevel === 'high').length;
    const avgEngagement = total > 0 ? Math.round(filteredData.reduce((sum: number, item: any) => sum + item.engagementScore, 0) / total) : 0;

    return { total, lowRisk, mediumRisk, highRisk, avgEngagement };
  };

  const stats = getSummaryStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Engagement & Risk Insights
        </h1>
        <p className="text-muted-foreground">
          Monitor engagement levels and identify at-risk {isPrincipal ? 'teachers, classes, and subjects' : 'students, classes, and subjects'} across your {isPrincipal ? 'school' : 'classes'}.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Risk</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.lowRisk}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Risk</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.mediumRisk}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTypes().map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Risk Level</label>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Grade</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  <SelectItem value="Grade 9">Grade 9</SelectItem>
                  <SelectItem value="Grade 10">Grade 10</SelectItem>
                  <SelectItem value="Grade 11">Grade 11</SelectItem>
                  <SelectItem value="Grade 12">Grade 12</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Class Filter</label>
              <Select 
                value={classFilter || 'all'} 
                onValueChange={(value) => setClassFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="Grade 9">Grade 9 Classes</SelectItem>
                  <SelectItem value="Grade 10">Grade 10 Classes</SelectItem>
                  <SelectItem value="Grade 11">Grade 11 Classes</SelectItem>
                  <SelectItem value="Grade 12">Grade 12 Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setRiskFilter('all');
                  setGradeFilter('all');
                  setClassFilter('all');
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Insights Overview ({filteredData.length} items)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No insights found</p>
              <p>Try adjusting your filters or search terms</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(item.type)}
                    <h4 className="font-medium">{item.name}</h4>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.type}
                    </Badge>
                    <Badge variant={getRiskBadgeVariant(item.riskLevel)} className="text-xs">
                      {item.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(item.trends.engagement)}
                    <span className="text-sm text-muted-foreground">
                      {item.engagementScore}%
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                {item.additionalInfo && (
                  <div className="text-sm text-muted-foreground">
                    {item.additionalInfo.teacherName && `Teacher: ${item.additionalInfo.teacherName} • `}
                    {item.additionalInfo.className && `Class: ${item.additionalInfo.className} • `}
                    {item.additionalInfo.grade && `Grade: ${item.additionalInfo.grade} • `}
                    {item.additionalInfo.subjectName && `Subject: ${item.additionalInfo.subjectName} • `}
                    Last Active: {item.metrics.lastActivity}
                  </div>
                )}

                {/* Engagement Score Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Engagement Score</span>
                    <span className="font-medium">{item.engagementScore}%</span>
                  </div>
                  <Progress 
                    value={item.engagementScore} 
                    className="h-2"
                  />
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attendance:</span>
                    <span className="font-medium">{item.metrics.attendanceRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignments:</span>
                    <span className="font-medium">{item.metrics.assignmentCompletion}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Participation:</span>
                    <span className="font-medium">{item.metrics.participationScore}%</span>
                  </div>
                </div>

                {/* Risk Assessment */}
                {item.riskLevel === 'high' && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      Requires immediate attention - Consider intervention strategies
                    </span>
                  </div>
                )}

                {item.riskLevel === 'medium' && (
                  <div className="flex items-center gap-2 p-2 bg-warning/10 rounded border border-warning/20">
                    <Clock className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning font-medium">
                      Monitor closely - Early intervention recommended
                    </span>
                  </div>
                )}

                {item.riskLevel === 'low' && (
                  <div className="flex items-center gap-2 p-2 bg-success/10 rounded border border-success/20">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-success font-medium">
                      Performing well - Continue current strategies
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};