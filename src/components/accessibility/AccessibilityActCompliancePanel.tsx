import React from 'react';
import { useAccessibilityActCompliance } from '@/hooks/useAccessibilityActCompliance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  CheckCircle2, 
  AlertTriangle, 
  Scale,
  FileText,
  Globe,
  Building,
  RefreshCw
} from 'lucide-react';

export const AccessibilityActCompliancePanel: React.FC = () => {
  const { 
    complianceResults, 
    isTestingCompliance, 
    assessCompliance,
    getHighestPriorityRecommendations
  } = useAccessibilityActCompliance();

  const getComplianceIcon = (standard: string) => {
    switch (standard) {
      case 'Americans with Disabilities Act (ADA)': return <Scale className="h-4 w-4" />;
      case 'Section 508 (Federal)': return <Building className="h-4 w-4" />;
      case 'WCAG 2.1 AA': 
      case 'WCAG 2.2 AA': return <FileText className="h-4 w-4" />;
      case 'European Accessibility Act (EN 301 549)': return <Globe className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const priorityRecommendations = getHighestPriorityRecommendations();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <CardTitle className="text-lg">Accessibility Act Compliance</CardTitle>
            {complianceResults && (
              <Badge 
                variant={complianceResults.overallCompliance ? "default" : "destructive"}
                className={complianceResults.overallCompliance ? "bg-success text-success-foreground" : ""}
              >
                {complianceResults.overallCompliance ? "Compliant" : "Non-Compliant"}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={assessCompliance}
            disabled={isTestingCompliance}
          >
            {isTestingCompliance ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            {isTestingCompliance ? "Assessing..." : "Run Assessment"}
          </Button>
        </div>
        <CardDescription>
          Comprehensive compliance testing for ADA, Section 508, WCAG, and European standards
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {complianceResults && (
          <>
            {/* Overall Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Compliance Score</span>
                <span className={`font-mono font-semibold ${getScoreColor(complianceResults.overallScore)}`}>
                  {complianceResults.overallScore}%
                </span>
              </div>
              <Progress value={complianceResults.overallScore} className="h-3" />
            </div>

            <Separator />

            {/* Individual Standards */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Standards Compliance</h3>
              
              {[
                complianceResults.ada,
                complianceResults.section508,
                complianceResults.wcag21aa,
                complianceResults.wcag22aa,
                complianceResults.enAct
              ].map((standard, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getComplianceIcon(standard.standard)}
                      <span className="text-sm font-medium">{standard.standard}</span>
                      {standard.compliant ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <span className={`text-sm font-mono ${getScoreColor(standard.score)}`}>
                      {standard.score}%
                    </span>
                  </div>
                  
                  <Progress value={standard.score} className="h-2" />
                  
                  {standard.criticalIssues > 0 && (
                    <div className="text-xs text-destructive">
                      {standard.criticalIssues} critical issue{standard.criticalIssues !== 1 ? 's' : ''} found
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Priority Recommendations */}
            {priorityRecommendations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Priority Actions</h3>
                  <div className="space-y-2">
                    {priorityRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                        <span>{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Assessment Info */}
            <Separator />
            <div className="text-xs text-muted-foreground">
              <p>Assessment completed at {complianceResults.timestamp.toLocaleTimeString()}</p>
              <p className="mt-1">
                This assessment evaluates compliance with major accessibility standards including ADA Title II/III, 
                Section 508, WCAG 2.1/2.2 AA, and the European Accessibility Act.
              </p>
            </div>
          </>
        )}

        {!complianceResults && !isTestingCompliance && (
          <div className="text-center py-8 text-muted-foreground">
            <Scale className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click "Run Assessment" to test compliance with accessibility standards</p>
            <p className="text-xs mt-2">
              Tests ADA, Section 508, WCAG 2.1/2.2 AA, and European Accessibility Act compliance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};