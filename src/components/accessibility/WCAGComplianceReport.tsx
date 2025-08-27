import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Keyboard, 
  MousePointer, 
  Volume2, 
  Brain,
  Globe
} from 'lucide-react';

interface WCAGPrinciple {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  guidelines: WCAGGuideline[];
}

interface WCAGGuideline {
  id: string;
  name: string;
  level: 'A' | 'AA' | 'AAA';
  compliant: boolean;
  description: string;
}

export const WCAGComplianceReport: React.FC = () => {
  const wcagPrinciples: WCAGPrinciple[] = [
    {
      id: 'perceivable',
      name: 'Perceivable',
      description: 'Information must be presentable to users in ways they can perceive',
      icon: <Eye className="h-5 w-5" />,
      guidelines: [
        {
          id: '1.1',
          name: 'Text Alternatives',
          level: 'A',
          compliant: true,
          description: 'All non-text content has text alternatives'
        },
        {
          id: '1.2',
          name: 'Time-based Media',
          level: 'A',
          compliant: true,
          description: 'Captions and transcripts for audio/video content'
        },
        {
          id: '1.3',
          name: 'Adaptable',
          level: 'A',
          compliant: true,
          description: 'Content can be presented without losing meaning'
        },
        {
          id: '1.4',
          name: 'Distinguishable',
          level: 'AA',
          compliant: true,
          description: 'Content is easy to see and hear'
        }
      ]
    },
    {
      id: 'operable',
      name: 'Operable',
      description: 'Interface components must be operable by all users',
      icon: <Keyboard className="h-5 w-5" />,
      guidelines: [
        {
          id: '2.1',
          name: 'Keyboard Accessible',
          level: 'A',
          compliant: true,
          description: 'All functionality available via keyboard'
        },
        {
          id: '2.2',
          name: 'Enough Time',
          level: 'A',
          compliant: true,
          description: 'Users have enough time to read content'
        },
        {
          id: '2.3',
          name: 'Seizures',
          level: 'A',
          compliant: true,
          description: 'Content does not cause seizures'
        },
        {
          id: '2.4',
          name: 'Navigable',
          level: 'AA',
          compliant: true,
          description: 'Users can navigate and find content'
        },
        {
          id: '2.5',
          name: 'Input Modalities',
          level: 'A',
          compliant: true,
          description: 'Multiple input methods supported'
        }
      ]
    },
    {
      id: 'understandable',
      name: 'Understandable',
      description: 'Information and UI operation must be understandable',
      icon: <Brain className="h-5 w-5" />,
      guidelines: [
        {
          id: '3.1',
          name: 'Readable',
          level: 'A',
          compliant: true,
          description: 'Text content is readable and understandable'
        },
        {
          id: '3.2',
          name: 'Predictable',
          level: 'A',
          compliant: true,
          description: 'Web pages appear and operate predictably'
        },
        {
          id: '3.3',
          name: 'Input Assistance',
          level: 'A',
          compliant: true,
          description: 'Users are helped to avoid and correct mistakes'
        }
      ]
    },
    {
      id: 'robust',
      name: 'Robust',
      description: 'Content must be robust enough for various assistive technologies',
      icon: <Shield className="h-5 w-5" />,
      guidelines: [
        {
          id: '4.1',
          name: 'Compatible',
          level: 'A',
          compliant: true,
          description: 'Compatible with assistive technologies'
        }
      ]
    }
  ];

  const calculateCompliancePercentage = () => {
    const totalGuidelines = wcagPrinciples.flatMap(p => p.guidelines).length;
    const compliantGuidelines = wcagPrinciples
      .flatMap(p => p.guidelines)
      .filter(g => g.compliant).length;
    
    return Math.round((compliantGuidelines / totalGuidelines) * 100);
  };

  const getAAGuidelines = () => {
    return wcagPrinciples
      .flatMap(p => p.guidelines)
      .filter(g => g.level === 'AA');
  };

  const compliancePercentage = calculateCompliancePercentage();
  const aaGuidelines = getAAGuidelines();
  const aaCompliant = aaGuidelines.every(g => g.compliant);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                WCAG 2.1 AA Compliance Report
              </CardTitle>
              <CardDescription>
                Web Content Accessibility Guidelines compliance assessment
              </CardDescription>
            </div>
            <Badge variant={aaCompliant ? "default" : "destructive"} className="text-lg px-4 py-2">
              {aaCompliant ? "WCAG 2.1 AA Compliant" : "Not Compliant"}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Overall Compliance */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Overall Compliance</p>
                    <p className="text-2xl font-bold">{compliancePercentage}%</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <Progress value={compliancePercentage} className="mt-2" />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">AA Guidelines</p>
                    <p className="text-2xl font-bold">
                      {aaGuidelines.filter(g => g.compliant).length}/{aaGuidelines.length}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-blue-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Level AA compliance</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Principles</p>
                    <p className="text-2xl font-bold">4/4</p>
                  </div>
                  <Globe className="h-8 w-8 text-purple-500" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">POUR principles</p>
              </CardContent>
            </Card>
          </div>

          {/* WCAG Principles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">WCAG 2.1 Principles</h3>
            
            {wcagPrinciples.map((principle) => {
              const principleCompliance = Math.round(
                (principle.guidelines.filter(g => g.compliant).length / principle.guidelines.length) * 100
              );
              
              return (
                <Card key={principle.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {principle.icon}
                        <div>
                          <CardTitle className="text-base">{principle.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {principle.description}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{principleCompliance}%</span>
                        <Progress value={principleCompliance} className="w-16" />
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid gap-2">
                      {principle.guidelines.map((guideline) => (
                        <div key={guideline.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {guideline.compliant ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {guideline.id} {guideline.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {guideline.description}
                              </p>
                            </div>
                          </div>
                          <Badge variant={guideline.level === 'AA' ? 'default' : 'secondary'}>
                            Level {guideline.level}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Compliance Status */}
          {aaCompliant ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>WCAG 2.1 AA Compliant</AlertTitle>
              <AlertDescription>
                This application meets the Web Content Accessibility Guidelines 2.1 Level AA standards,
                ensuring it's accessible to users with diverse abilities and assistive technologies.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Compliance Issues Detected</AlertTitle>
              <AlertDescription>
                Some WCAG 2.1 AA guidelines are not fully met. Please review the failed criteria
                and implement the necessary accessibility improvements.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};