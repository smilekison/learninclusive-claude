import { useEffect, useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: any; // Using any to handle axe-core's complex selector types
  }>;
}

interface AccessibilityResults {
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: AccessibilityIssue[];
  url: string;
  timestamp: Date;
}

export const useAccessibilityAudit = (enableAudit: boolean = false) => {
  const [results, setResults] = useState<AccessibilityResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAccessibility();

  const runAudit = async (): Promise<AccessibilityResults | null> => {
    if (typeof window === 'undefined') return null;
    
    setIsAuditing(true);
    setError(null);

    try {
      // Dynamically import axe-core to avoid bundling issues
      const axe = await import('axe-core');
      
      // Enhanced configuration for WCAG 2.1 AA compliance  
      const axeConfig = {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
        rules: {
          // Core accessibility rules
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: settings.highContrast },
          'focus-order-semantics': { enabled: settings.focusAssistance },
          'focusable-content': { enabled: settings.keyboardNavigation },
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
          'skip-link': { enabled: settings.skipLinks },
          'link-name': { enabled: true },
          'button-name': { enabled: true },
          'image-alt': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
          'label': { enabled: true },
          'input-image-alt': { enabled: true },
          'video-caption': { enabled: settings.captionsEnabled },
          'audio-caption': { enabled: settings.captionsEnabled },
          'meta-refresh': { enabled: true },
          'meta-viewport-large': { enabled: true },
          'meta-viewport': { enabled: true }
        }
      };

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
        timestamp: new Date()
      };

      setResults(results);
      
      // Log results to console in development
      if (process.env.NODE_ENV === 'development') {
        if (results.violations.length > 0) {
          console.group('🚨 Accessibility Violations Found');
          results.violations.forEach(violation => {
            console.error(`${violation.impact.toUpperCase()}: ${violation.description}`);
            console.log('Help:', violation.helpUrl);
            console.log('Affected elements:', violation.nodes);
          });
          console.groupEnd();
        } else {
          console.log('✅ No accessibility violations found!');
        }
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run accessibility audit';
      setError(errorMessage);
      console.error('Accessibility audit failed:', err);
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

  return {
    results,
    isAuditing,
    error,
    runAudit,
    getCriticalIssuesCount,
    getSeriousIssuesCount,
    getComplianceScore,
    hasViolations: (results?.violations.length || 0) > 0
  };
};