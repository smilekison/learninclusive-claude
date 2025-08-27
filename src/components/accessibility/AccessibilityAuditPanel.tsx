import React, { useState } from 'react';
import { useRobustAccessibilityAudit } from '@/hooks/useRobustAccessibilityAudit';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  ChevronDown,
  ExternalLink,
  Bug,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const AccessibilityAuditPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { 
    results, 
    isAuditing, 
    error,
    runAudit,
    getCriticalIssuesCount,
    getSeriousIssuesCount,
    getComplianceScore,
    isWCAG21AACompliant,
    hasViolations,
    isHealthy
  } = useRobustAccessibilityAudit();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'serious': return 'bg-warning text-warning-foreground';
      case 'moderate': return 'bg-secondary text-secondary-foreground';
      case 'minor': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const complianceScore = getComplianceScore();
  const criticalCount = getCriticalIssuesCount();
  const seriousCount = getSeriousIssuesCount();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Accessibility Audit</CardTitle>
            {results && (
              <Badge 
                variant={hasViolations ? "destructive" : "default"}
                className={hasViolations ? "" : "bg-success text-success-foreground"}
              >
                {hasViolations ? "Issues Found" : "Compliant"}
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={runAudit}
            disabled={isAuditing}
          >
            {isAuditing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isAuditing ? "Scanning..." : "Run Audit"}
          </Button>
        </div>
        <CardDescription>
          WCAG 2.1 AA compliance check using axe-core
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {results && (
          <>
            {/* Compliance Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Compliance Score</span>
                <span className="font-mono">{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} className="h-2" />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="font-semibold text-success">{results.passes}</span>
                </div>
                <p className="text-xs text-muted-foreground">Passed</p>
              </div>
              
              <div className="text-center p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-destructive">{results.violations.length}</span>
                </div>
                <p className="text-xs text-muted-foreground">Violations</p>
              </div>
            </div>

            {/* Critical and Serious Issues Alert */}
            {(criticalCount > 0 || seriousCount > 0) && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="h-4 w-4 text-destructive" />
                  <span className="font-semibold text-destructive text-sm">
                    High Priority Issues
                  </span>
                </div>
                <div className="text-sm text-destructive space-y-1">
                  {criticalCount > 0 && (
                    <p>• {criticalCount} critical issue{criticalCount !== 1 ? 's' : ''}</p>
                  )}
                  {seriousCount > 0 && (
                    <p>• {seriousCount} serious issue{seriousCount !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Violations */}
            {results.violations.length > 0 && (
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2">
                    <span className="text-sm font-medium">
                      View Violations ({results.violations.length})
                    </span>
                    <ChevronDown className={cn(
                      "h-4 w-4 transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-3 mt-2">
                  {results.violations.map((violation, index) => (
                    <div 
                      key={violation.id} 
                      className="border border-border rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={getImpactColor(violation.impact)}>
                              {violation.impact}
                            </Badge>
                            <span className="text-sm font-medium">{violation.id}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {violation.description}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          asChild
                        >
                          <a 
                            href={violation.helpUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Help
                          </a>
                        </Button>
                      </div>
                      
                      {violation.nodes.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <p className="mb-1">Affected elements: {violation.nodes.length}</p>
                          <div className="bg-muted/30 p-2 rounded text-xs font-mono max-h-20 overflow-y-auto">
                            {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                              <div key={nodeIndex} className="truncate">
                                {node.target.join(' → ')}
                              </div>
                            ))}
                            {violation.nodes.length > 3 && (
                              <div className="text-muted-foreground">
                                ... and {violation.nodes.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* No Violations Message */}
            {results.violations.length === 0 && (
              <div className="flex items-center justify-center p-6 bg-success/10 text-success rounded-lg">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">No accessibility violations found!</span>
              </div>
            )}

            {/* Audit Info */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <div className="flex items-center gap-1 mb-1">
                <Info className="h-3 w-3" />
                <span>Audit completed at {results.timestamp.toLocaleTimeString()}</span>
              </div>
              <p>This audit checks for WCAG 2.1 AA compliance using axe-core rules.</p>
            </div>
          </>
        )}

        {!results && !isAuditing && (
          <div className="text-center py-6 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Click "Run Audit" to check accessibility compliance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};