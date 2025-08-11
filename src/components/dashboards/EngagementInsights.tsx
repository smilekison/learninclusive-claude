import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Truncate } from '@/components/ui/truncate';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  BookOpen,
  GraduationCap,
  BarChart3
} from 'lucide-react';

interface EngagementData {
  id: string;
  name: string;
  type: 'teacher' | 'class' | 'subject';
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
}

interface EngagementInsightsProps {
  title: string;
  data: EngagementData[];
  userRole: 'principal' | 'teacher';
}

const mockData: EngagementData[] = [
  {
    id: '1',
    name: 'Michael Chen',
    type: 'teacher',
    engagementScore: 92,
    riskLevel: 'low',
    metrics: {
      attendanceRate: 98,
      assignmentCompletion: 89,
      participationScore: 94,
      lastActivity: '2 hours ago'
    },
    trends: {
      engagement: 'up',
      performance: 'up'
    }
  },
  {
    id: '2',
    name: 'Grade 10 Mathematics',
    type: 'class',
    engagementScore: 76,
    riskLevel: 'medium',
    metrics: {
      attendanceRate: 82,
      assignmentCompletion: 71,
      participationScore: 78,
      lastActivity: '1 day ago'
    },
    trends: {
      engagement: 'down',
      performance: 'stable'
    }
  },
  {
    id: '3',
    name: 'Physics',
    type: 'subject',
    engagementScore: 65,
    riskLevel: 'high',
    metrics: {
      attendanceRate: 75,
      assignmentCompletion: 58,
      participationScore: 62,
      lastActivity: '3 days ago'
    },
    trends: {
      engagement: 'down',
      performance: 'down'
    }
  }
];

export const EngagementInsights: React.FC<EngagementInsightsProps> = ({ 
  title, 
  data = mockData, 
  userRole 
}) => {
  const totalSubjects = data.length;
  const avgEngagement = data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.engagementScore, 0) / data.length) : 0;
  const lowRiskCount = data.filter(item => item.riskLevel === 'low').length;
  const mediumRiskCount = data.filter(item => item.riskLevel === 'medium').length;
  const highRiskCount = data.filter(item => item.riskLevel === 'high').length;
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
      default: return <Users className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>
          Real-time engagement monitoring and risk assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                {getTypeIcon(item.type)}
                <Truncate lines={1} className="font-medium flex-1">{item.name}</Truncate>
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
            <div className="grid grid-cols-2 gap-3 text-sm">
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Active:</span>
                <span className="font-medium">{item.metrics.lastActivity}</span>
              </div>
            </div>

            {/* Risk Assessment */}
            {item.riskLevel === 'high' && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 rounded border border-destructive/20">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive font-medium">
                  Requires immediate attention
                </span>
              </div>
            )}

            {item.riskLevel === 'medium' && (
              <div className="flex items-center gap-2 p-2 bg-warning/10 rounded border border-warning/20">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm text-warning font-medium">
                  Monitor closely
                </span>
              </div>
            )}

            {item.riskLevel === 'low' && (
              <div className="flex items-center gap-2 p-2 bg-success/10 rounded border border-success/20">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Performing well
                </span>
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div className="pt-4 border-t space-y-4">
          {/* Statistics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {totalSubjects}
              </div>
              <div className="text-xs text-muted-foreground">Total Subjects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {avgEngagement}%
              </div>
              <div className="text-xs text-muted-foreground">Avg Engagement</div>
            </div>
          </div>
          
          {/* Risk Assessment Row */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-success">
                {lowRiskCount}
              </div>
              <div className="text-xs text-muted-foreground">Low Risk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">
                {mediumRiskCount}
              </div>
              <div className="text-xs text-muted-foreground">Medium Risk</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-destructive">
                {highRiskCount}
              </div>
              <div className="text-xs text-muted-foreground">High Risk</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};