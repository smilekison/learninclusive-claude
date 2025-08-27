import { useEffect, useState, useCallback } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

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
  score: number;
}

export const useRobustAccessibilityAudit = (enableAudit: boolean = false) => {
  const [results, setResults] = useState<AccessibilityResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAccessibility();

  const runAudit = useCallback(async (): Promise<AccessibilityResults | null> => {
    if (typeof window === 'undefined') return null;
    
    setIsAuditing(true);
    setError(null);

    try {
      // Dynamically import axe-core with error handling
      const axe = await import('axe-core');
      
      // Wait for DOM to be fully ready
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else {
          window.addEventListener('load', () => resolve(true), { once: true });
        }
      });

      // Robust configuration tested to work reliably
      const axeConfig = {
        tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        exclude: [
          // Exclude problematic dynamic elements
          '[data-radix-popper-content-wrapper]',
          '[data-sonner-toaster]', 
          '[data-react-aria-top-layer]',
          '[role="tooltip"]',
          '.sonner-toaster'
        ],
        rules: {
          // Core ARIA rules
          'aria-required-attr': { enabled: true },
          'aria-roles': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-hidden-focus': { enabled: true },
          'aria-required-children': { enabled: true },
          'aria-required-parent': { enabled: true },
          
          // Interactive elements
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'input-button-name': { enabled: true },
          'select-name': { enabled: true },
          'textarea-name': { enabled: true },
          
          // Form controls
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: false }, // Often triggers false positives
          
          // Visual design
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: false }, // AAA level, optional
          
          // Document structure
          'html-has-lang': { enabled: true },
          'html-lang-valid': { enabled: true },
          'document-title': { enabled: true },
          'page-has-heading-one': { enabled: true },
          'heading-order': { enabled: true },
          
          // Images
          'image-alt': { enabled: true },
          'input-image-alt': { enabled: true },
          'object-alt': { enabled: true },
          
          // Navigation
          'landmark-one-main': { enabled: true },
          'landmark-complementary-is-top-level': { enabled: true },
          'landmark-main-is-top-level': { enabled: true },
          'landmark-no-duplicate-main': { enabled: true },
          'landmark-unique': { enabled: false }, // Can be problematic with dynamic content
          
          // Lists
          'list': { enabled: true },
          'listitem': { enabled: true },
          'definition-list': { enabled: true },
          
          // Technical
          'duplicate-id': { enabled: true },
          'duplicate-id-active': { enabled: true },
          'duplicate-id-aria': { enabled: true },
          'meta-viewport': { enabled: true },
          'tabindex': { enabled: true },
          'focus-order-semantics': { enabled: true }
        }
      };

      console.log('🔍 Running robust accessibility audit...');
      
      // Run the audit with timeout protection
      const auditPromise = axe.default.run(document, axeConfig);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Audit timeout')), 10000)
      );
      
      const axeResults = await Promise.race([auditPromise, timeoutPromise]) as any;
      
      // Calculate compliance score
      const totalChecks = axeResults.passes.length + axeResults.violations.length;
      const score = totalChecks > 0 ? Math.round((axeResults.passes.length / totalChecks) * 100) : 100;
      
      const results: AccessibilityResults = {
        violations: axeResults.violations.map((violation: any) => ({
          id: violation.id,
          impact: violation.impact as AccessibilityIssue['impact'],
          description: violation.description,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map((node: any) => ({
            html: node.html,
            target: Array.isArray(node.target) ? node.target : [String(node.target)]
          }))
        })),
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.map((incomplete: any) => ({
          id: incomplete.id,
          impact: incomplete.impact as AccessibilityIssue['impact'],
          description: incomplete.description,
          helpUrl: incomplete.helpUrl,
          nodes: incomplete.nodes.map((node: any) => ({
            html: node.html,
            target: Array.isArray(node.target) ? node.target : [String(node.target)]
          }))
        })),
        url: window.location.href,
        timestamp: new Date(),
        wcag21aa: axeResults.violations.filter((v: any) => 
          v.tags && v.tags.includes('wcag21aa')
        ).length === 0,
        score
      };

      setResults(results);
      
      // Enhanced logging
      if (process.env.NODE_ENV === 'development') {
        console.group('📊 Accessibility Audit Results');
        console.log(`✅ Passes: ${results.passes}`);
        console.log(`❌ Violations: ${results.violations.length}`);
        console.log(`⚠️ Incomplete: ${results.incomplete.length}`);
        console.log(`📈 Score: ${results.score}%`);
        console.log(`🎯 WCAG 2.1 AA: ${results.wcag21aa ? '✅ Compliant' : '❌ Not Compliant'}`);
        
        if (results.violations.length > 0) {
          console.group('🚨 Violations by Impact');
          const byImpact = results.violations.reduce((acc, v) => {
            acc[v.impact] = (acc[v.impact] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          Object.entries(byImpact).forEach(([impact, count]) => {
            console.log(`${impact.toUpperCase()}: ${count}`);
          });
          console.groupEnd();
        }
        console.groupEnd();
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run accessibility audit';
      setError(errorMessage);
      console.error('💥 Accessibility audit failed:', err);
      
      // Return a basic result even on error
      const fallbackResult: AccessibilityResults = {
        violations: [],
        passes: 0,
        incomplete: [],
        url: window.location.href,
        timestamp: new Date(),
        wcag21aa: false,
        score: 0
      };
      
      setResults(fallbackResult);
      return fallbackResult;
    } finally {
      setIsAuditing(false);
    }
  }, []);

  // Auto-run audit when enabled
  useEffect(() => {
    if (enableAudit && !isAuditing) {
      const timeoutId = setTimeout(() => {
        runAudit();
      }, 1500); // Longer delay to ensure DOM stability

      return () => clearTimeout(timeoutId);
    }
  }, [enableAudit, runAudit, isAuditing]);

  const getCriticalIssuesCount = useCallback(() => {
    return results?.violations.filter(v => v.impact === 'critical').length || 0;
  }, [results]);

  const getSeriousIssuesCount = useCallback(() => {
    return results?.violations.filter(v => v.impact === 'serious').length || 0;
  }, [results]);

  const getComplianceScore = useCallback(() => {
    return results?.score || 0;
  }, [results]);

  const isWCAG21AACompliant = useCallback(() => {
    return results?.wcag21aa || false;
  }, [results]);

  const getViolationsByImpact = useCallback(() => {
    if (!results) return { critical: 0, serious: 0, moderate: 0, minor: 0 };
    
    return results.violations.reduce((acc, violation) => {
      acc[violation.impact] = (acc[violation.impact] || 0) + 1;
      return acc;
    }, { critical: 0, serious: 0, moderate: 0, minor: 0 } as Record<string, number>);
  }, [results]);

  return {
    results,
    isAuditing,
    error,
    runAudit,
    getCriticalIssuesCount,
    getSeriousIssuesCount,
    getComplianceScore,
    isWCAG21AACompliant,
    getViolationsByImpact,
    hasViolations: (results?.violations.length || 0) > 0,
    isHealthy: !error && !isAuditing && results !== null
  };
};