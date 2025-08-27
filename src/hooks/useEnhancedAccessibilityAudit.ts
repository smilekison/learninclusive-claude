import { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: any;
  }>;
}

interface AccessibilityResults {
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: AccessibilityIssue[];
  url: string;
  timestamp: Date;
  wcag21aa: boolean;
  wcag22aa: boolean;
}

export const useEnhancedAccessibilityAudit = (enableAudit: boolean = false) => {
  const [results, setResults] = useState<AccessibilityResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAccessibility();
  const { user } = useAuth();

  const runAudit = async (): Promise<AccessibilityResults | null> => {
    if (typeof window === 'undefined') return null;
    
    setIsAuditing(true);
    setError(null);

    try {
      // Dynamically import axe-core to avoid bundling issues
      const axe = await import('axe-core');
      
      // Enhanced configuration for WCAG 2.1 AA compliance
      const axeConfig = {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          // Core accessibility rules - only using well-supported rules
          'color-contrast': { enabled: true },
          'keyboard-traps': { enabled: true },
          'tabindex': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          'landmark-unique': { enabled: true },
          'landmark-one-main': { enabled: true },
          'heading-order': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'link-name': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'input-image-alt': { enabled: true },
          'meta-refresh': { enabled: true },
          'meta-viewport': { enabled: true }
        }
      };

      console.log('🔍 ACCESSIBILITY AUDIT: Running enhanced audit with config:', axeConfig);
      const axeResults = await axe.default.run(document, axeConfig);
      
      const results: AccessibilityResults = {
        violations: axeResults.violations.map(violation => ({
          id: violation.id,
          impact: violation.impact as AccessibilityIssue['impact'],
          description: violation.description,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map(node => ({
            html: node.html,
            target: Array.isArray(node.target) ? node.target : [String(node.target)]
          }))
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.map(incomplete => ({
          id: incomplete.id,
          impact: incomplete.impact as AccessibilityIssue['impact'],
          description: incomplete.description,
          helpUrl: incomplete.helpUrl,
          nodes: incomplete.nodes.map(node => ({
            html: node.html,
            target: Array.isArray(node.target) ? node.target : [String(node.target)]
          }))
        })),
        url: window.location.href,
        timestamp: new Date(),
        wcag21aa: axeResults.violations.filter(v => v.tags.includes('wcag21aa')).length === 0,
        wcag22aa: axeResults.violations.filter(v => v.tags.includes('wcag22aa')).length === 0
      };

      setResults(results);
      
      // Save audit results to localStorage for now
      if (user?.authUserId) {
        try {
          const auditData = {
            user_id: user.authUserId,
            page_url: results.url,
            audit_results: {
              violations: results.violations,
              passes: results.passes,
              incomplete: results.incomplete,
              wcag21aa: results.wcag21aa,
              wcag22aa: results.wcag22aa
            },
            compliance_score: getComplianceScore(),
            violations_count: results.violations.length,
            critical_issues: results.violations.filter(v => v.impact === 'critical').length,
            serious_issues: results.violations.filter(v => v.impact === 'serious').length,
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem(`accessibility_audit_${Date.now()}`, JSON.stringify(auditData));
          console.log('✅ ACCESSIBILITY AUDIT: Results saved to localStorage');
        } catch (storageError) {
          console.warn('⚠️ ACCESSIBILITY AUDIT: Failed to save to localStorage:', storageError);
        }
      }
      
      // Enhanced logging for development
      if (process.env.NODE_ENV === 'development') {
        if (results.violations.length > 0) {
          console.group('🚨 Accessibility Violations Found');
          results.violations.forEach(violation => {
            console.error(`${violation.impact.toUpperCase()}: ${violation.description}`);
            console.log('Help:', violation.helpUrl);
            console.log('Affected elements:', violation.nodes);
          });
          console.groupEnd();
          
          console.log('📊 WCAG 2.1 AA Compliant:', results.wcag21aa);
          console.log('📊 WCAG 2.2 AA Compliant:', results.wcag22aa);
        } else {
          console.log('✅ No accessibility violations found! WCAG 2.1 AA compliant.');
        }
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run accessibility audit';
      setError(errorMessage);
      console.error('💥 ACCESSIBILITY AUDIT: Failed:', err);
      return null;
    } finally {
      setIsAuditing(false);
    }
  };

  // Auto-run audit when enabled or settings change
  useEffect(() => {
    if (enableAudit && !isAuditing) {
      const timeoutId = setTimeout(() => {
        runAudit();
      }, 1000); // Delay to allow DOM to settle

      return () => clearTimeout(timeoutId);
    }
  }, [enableAudit, settings]);

  const getCriticalIssuesCount = () => {
    return results?.violations.filter(v => v.impact === 'critical').length || 0;
  };

  const getSeriousIssuesCount = () => {
    return results?.violations.filter(v => v.impact === 'serious').length || 0;
  };

  const getComplianceScore = () => {
    if (!results) return 0;
    const totalChecks = results.passes + results.violations.length;
    return totalChecks > 0 ? Math.round((results.passes / totalChecks) * 100) : 0;
  };

  const isWCAG21AACompliant = () => {
    return results?.wcag21aa || false;
  };

  const isWCAG22AACompliant = () => {
    return results?.wcag22aa || false;
  };

  return {
    results,
    isAuditing,
    error,
    runAudit,
    getCriticalIssuesCount,
    getSeriousIssuesCount,
    getComplianceScore,
    isWCAG21AACompliant,
    isWCAG22AACompliant,
    hasViolations: (results?.violations.length || 0) > 0
  };
};