import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Trophy, 
  Users, 
  BookOpen, 
  FileText, 
  Calendar, 
  CheckCircle, 
  Heart,
  Volume2,
  Eye,
  Headphones,
  AlertCircle,
  Target
} from 'lucide-react';
import { TTSButton } from '@/components/accessibility/TTSButton';
import { VisualAlert } from '@/components/accessibility/VisualAlert';
import { Truncate } from '@/components/ui/truncate';

export const DashboardComparison: React.FC = () => {
  const sampleAssignment = {
    id: '1',
    title: 'Math Homework: Algebra Problems Chapter 5',
    subject: { name: 'Mathematics' },
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const sampleGrade = {
    id: '1',
    score: 85,
    assignment: { 
      title: 'History Essay: World War II Impact',
      max_score: 100,
      subject: { name: 'History' }
    },
    graded_at: new Date().toISOString(),
    feedback: 'Great analysis of the economic impacts. Could use more detail on social changes.'
  };

  const sampleClass = {
    id: '1',
    class: {
      name: 'Advanced Biology',
      teacher: { first_name: 'Dr. Sarah', last_name: 'Johnson' },
      description: 'Advanced topics in cellular biology and genetics'
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-primary">Dashboard Comparison</h1>
        <p className="text-muted-foreground">Side-by-side view of regular vs. accessibility-personalized dashboards</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Regular Dashboard */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Regular Dashboard</h2>
            <Badge variant="outline">Standard Interface</Badge>
          </div>

          {/* Regular Welcome */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back, Alex!</CardTitle>
              <CardDescription>Here's your learning progress and upcoming tasks.</CardDescription>
            </CardHeader>
          </Card>

          {/* Regular Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Classes</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Average</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
              </CardContent>
            </Card>
          </div>

          {/* Regular Assignment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{sampleAssignment.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Subject: {sampleAssignment.subject.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Due: {new Date(sampleAssignment.due_date).toLocaleDateString()}</span>
                      <Badge variant="secondary">2 days left</Badge>
                    </div>
                  </div>
                  <Button size="sm">Submit</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Regular Grade Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-lg border">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">{sampleGrade.assignment.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Subject: {sampleGrade.assignment.subject.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      "{sampleGrade.feedback}"
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">85/100</div>
                    <Badge>85%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accessibility-Personalized Dashboard */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Accessibility Dashboard</h2>
            <Badge variant="default" className="bg-primary">Hearing Impairment Support</Badge>
          </div>

          {/* Accessibility Banner */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-primary mb-1">Hearing support enabled</h3>
                  <p className="text-sm text-muted-foreground">
                    Visual alerts, captions emphasis, and TTS controls are highlighted for you.
                  </p>
                </div>
                <TTSButton 
                  text="Hearing support enabled. Visual alerts, captions emphasis, and TTS controls are highlighted for you."
                  variant="ghost"
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Accessibility Toolbar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Your Accessibility Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm">Visual Alerts</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                  <Volume2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">Text-to-Speech</span>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personalized Welcome */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                Welcome back, Alex!
                <Heart className="h-6 w-6 text-primary/70" />
                <TTSButton 
                  text="Welcome back Alex! Your personalized accessible dashboard is ready."
                  variant="ghost"
                  size="sm"
                />
              </CardTitle>
              <CardDescription>Your personalized accessible learning dashboard is ready.</CardDescription>
            </CardHeader>
          </Card>

          {/* Enhanced Stats with TTS */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Classes</CardTitle>
                  <TTSButton 
                    text="5 enrolled classes"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-1"
                  />
                </div>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">5</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Average</CardTitle>
                  <TTSButton 
                    text="87 percent average grade"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-1"
                  />
                </div>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87%</div>
              </CardContent>
            </Card>
          </div>

          {/* Compact Assignment Card with TTS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Upcoming Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                      <Truncate lines={1} className="font-medium text-sm">
                        {sampleAssignment.title}
                      </Truncate>
                      <TTSButton 
                        text={`Assignment: ${sampleAssignment.title}. Due in 2 days.`}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-1"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{sampleAssignment.subject.name}</span>
                      <span>{new Date(sampleAssignment.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">2d</Badge>
                    <Button size="sm" className="h-7 text-xs">Submit</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compact Grade Card with TTS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Recent Grades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 rounded-lg border">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Truncate lines={1} className="font-medium text-sm">
                        {sampleGrade.assignment.title}
                      </Truncate>
                      <TTSButton 
                        text={`Grade: 85 out of 100, 85 percent`}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-1"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {sampleGrade.assignment.subject.name} • {new Date(sampleGrade.graded_at).toLocaleDateString()}
                    </div>
                    <Truncate lines={2} className="text-xs text-muted-foreground mt-1 italic">
                      "{sampleGrade.feedback}"
                    </Truncate>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">85/100</div>
                    <Badge className="text-xs">85%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Alert Demo */}
          <VisualAlert 
            type="info" 
            message="Visual alerts are ON for hearing support." 
            duration={8000} 
          />
        </div>
      </div>

      {/* Key Differences */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Key Accessibility Enhancements</CardTitle>
          <CardDescription>What makes the personalized dashboard different</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Personalization</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Disability-specific welcome message</li>
                <li>• Prominent accessibility banner</li>
                <li>• IEP status display</li>
                <li>• Support tools visibility</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Audio Support</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Text-to-speech buttons on all content</li>
                <li>• Audio announcements</li>
                <li>• Screen reader optimization</li>
                <li>• Keyboard navigation support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Visual Enhancements</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Visual alert system</li>
                <li>• Compact, scannable design</li>
                <li>• Text truncation for focus</li>
                <li>• High contrast elements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardComparison;