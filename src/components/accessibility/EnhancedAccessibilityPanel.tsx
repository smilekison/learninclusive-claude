import React, { useState } from 'react';
import { useEnhancedAccessibilityAudit } from '@/hooks/useEnhancedAccessibilityAudit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ExternalLink,
  PlayCircle,
  Eye,
  Keyboard,
  Monitor,
  Volume2,
  MousePointer,
  Brain,
  Users,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const EnhancedAccessibilityPanel: React.FC = () => {
  const { 
    results, 
    isAuditing, 
    runAudit, 
    getCriticalIssuesCount, 
    getSeriousIssuesCount, 
    getComplianceScore,
    isWCAG21AACompliant,
    isWCAG22AACompliant,
    hasViolations 
  } = useEnhancedAccessibilityAudit();
  
  const [isExpanded, setIsExpanded] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'destructive';
      case 'serious': return 'destructive';
      case 'moderate': return 'secondary';
      case 'minor': return 'outline';
      default: return 'outline';
    }
  };

  const complianceScore = getComplianceScore();
  const criticalIssues = getCriticalIssuesCount();
  const seriousIssues = getSeriousIssuesCount();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Enhanced Accessibility Audit (WCAG 2.1 AA)</CardTitle>
          </div>
          <div className="flex gap-2">
            {results && (
              <>
                <Badge variant={isWCAG21AACompliant() ? 'default' : 'destructive'}>
                  WCAG 2.1 AA: {isWCAG21AACompliant() ? 'Compliant' : 'Non-Compliant'}
                </Badge>
                <Badge variant={isWCAG22AACompliant() ? 'default' : 'secondary'}>
                  WCAG 2.2 AA: {isWCAG22AACompliant() ? 'Compliant' : 'In Progress'}
                </Badge>
              </>
            )}
          </div>
        </div>
        <CardDescription>
          Comprehensive accessibility audit ensuring compliance with Web Content Accessibility Guidelines
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {results && (
          <>
            {/* Compliance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Compliance Score</p>
                      <p className="text-2xl font-bold">{complianceScore}%</p>
                    </div>
                    <CheckCircle className={cn(
                      "h-8 w-8",
                      complianceScore >= 90 ? "text-green-500" : 
                      complianceScore >= 70 ? "text-yellow-500" : "text-red-500"
                    )} />
                  </div>
                  <Progress value={complianceScore} className="mt-2" />
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Tests Passed</p>
                      <p className="text-2xl font-bold text-green-600">{results.passes}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Violations</p>
                      <p className="text-2xl font-bold text-red-600">{results.violations.length}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Critical and Serious Issues Alert */}
            {(criticalIssues > 0 || seriousIssues > 0) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Urgent Accessibility Issues Found</AlertTitle>
                <AlertDescription>
                  {criticalIssues > 0 && `${criticalIssues} critical issue(s) `}
                  {criticalIssues > 0 && seriousIssues > 0 && 'and '}
                  {seriousIssues > 0 && `${seriousIssues} serious issue(s) `}
                  found. These must be addressed for WCAG 2.1 AA compliance.
                </AlertDescription>
              </Alert>
            )}

            {/* Accessibility Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 p-2 border rounded">
                <Eye className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Visual</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <Volume2 className="h-4 w-4 text-green-500" />
                <span className="text-sm">Auditory</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <MousePointer className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Motor</span>
              </div>
              <div className="flex items-center gap-2 p-2 border rounded">
                <Brain className="h-4 w-4 text-orange-500" />
                <span className="text-sm">Cognitive</span>
              </div>
            </div>

            {/* Detailed Violations */}
            {hasViolations && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <span className="flex items-center gap-2">
                      <ChevronDown className={cn(
                        "h-4 w-4 transition-transform",
                        isExpanded && "transform rotate-180"
                      )} />
                      View Detailed Violations ({results.violations.length})
                    </span>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-4 mt-4">
                  {results.violations.map((violation, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={getImpactColor(violation.impact)}>
                              {violation.impact.toUpperCase()}
                            </Badge>
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {violation.id}
                            </code>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a 
                              href={violation.helpUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Learn More
                            </a>
                          </Button>
                        </div>
                        
                        <p className="text-sm mb-3">{violation.description}</p>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Affected Elements ({violation.nodes.length}):
                          </p>
                          {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                            <div key={nodeIndex} className="bg-muted p-2 rounded text-xs">
                              <code>{node.html}</code>
                            </div>
                          ))}
                          {violation.nodes.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              ... and {violation.nodes.length - 3} more elements
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Success Message */}
            {!hasViolations && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Excellent Accessibility!</AlertTitle>
                <AlertDescription>
                  No accessibility violations found. Your application meets WCAG 2.1 AA standards.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Run Audit Button */}
        <div className="flex justify-center">
          <Button 
            onClick={runAudit} 
            disabled={isAuditing}
            size="lg"
            className="min-w-[200px]"
          >
            {isAuditing ? (
              <>
                <Monitor className="mr-2 h-4 w-4 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 h-4 w-4" />
                {results ? 'Re-run Audit' : 'Start Accessibility Audit'}
              </>
            )}
          </Button>
        </div>

        {!results && !isAuditing && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Ready to Audit</AlertTitle>
            <AlertDescription>
              Click the button above to perform a comprehensive accessibility audit of this page.
              This will check for WCAG 2.1 AA compliance including color contrast, keyboard navigation,
              screen reader compatibility, and more.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};