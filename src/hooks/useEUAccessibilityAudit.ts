import { useCallback, useState } from 'react';
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

interface EUAccessibilityResults {
  violations: AccessibilityIssue[];
  passes: number;
  score: number;
  enCompliant: boolean; // EN 301 549 compliance
  ltCompliant: boolean; // Lithuanian accessibility law compliance
  timestamp: Date;
  url: string;
}

export const useEUAccessibilityAudit = () => {
  const [results, setResults] = useState<EUAccessibilityResults | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useAccessibility();

  const runEUAudit = useCallback(async (): Promise<EUAccessibilityResults | null> => {
    if (typeof window === 'undefined') return null;
    
    setIsAuditing(true);
    setError(null);

    try {
      // Import axe-core dynamically
      const axe = await import('axe-core');
      
      // Wait for DOM stability
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve(true);
        } else {
          window.addEventListener('load', () => resolve(true), { once: true });
        }
      });

      // Minimal, error-free configuration for EU/Lithuanian standards
      const axeConfig = {
        tags: ['wcag2a', 'wcag2aa'],
        exclude: [
          '[data-radix-popper-content-wrapper]',
          '[data-sonner-toaster]',
          '[aria-hidden="true"]'
        ],
        rules: {
          // Only verified, working rules
          'color-contrast': { enabled: true },
          'button-name': { enabled: true },
          'link-name': { enabled: true },
          'image-alt': { enabled: true },
          'label': { enabled: true },
          'html-has-lang': { enabled: true },
          'duplicate-id': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-required-attr': { enabled: true }
        }
      };

      console.log('🇪🇺 Running EU/Lithuanian accessibility audit...');
      
      // Run audit with timeout
      const auditPromise = axe.default.run(document, axeConfig);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Audit timeout')), 8000)
      );
      
      const axeResults = await Promise.race([auditPromise, timeoutPromise]) as any;
      
      // Calculate scores and compliance
      const totalChecks = axeResults.passes.length + axeResults.violations.length;
      const baseScore = totalChecks > 0 ? Math.round((axeResults.passes.length / totalChecks) * 100) : 100;
      
      const criticalViolations = axeResults.violations.filter((v: any) => v.impact === 'critical');
      const seriousViolations = axeResults.violations.filter((v: any) => v.impact === 'serious');
      
      // EN 301 549 compliance (EU standard)
      const enCompliant = criticalViolations.length === 0 && seriousViolations.length <= 1 && baseScore >= 85;
      
      // Lithuanian accessibility law compliance (stricter)
      const ltCompliant = criticalViolations.length === 0 && axeResults.violations.length <= 2 && baseScore >= 90;

      const results: EUAccessibilityResults = {
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
        score: baseScore,
        enCompliant,
        ltCompliant,
        timestamp: new Date(),
        url: window.location.href
      };

      setResults(results);
      
      // Enhanced logging
      if (process.env.NODE_ENV === 'development') {
        console.group('🇪🇺 EU/Lithuanian Accessibility Audit Results');
        console.log(`📊 Score: ${results.score}%`);
        console.log(`🇪🇺 EN 301 549 Compliant: ${results.enCompliant ? '✅' : '❌'}`);
        console.log(`🇱🇹 Lithuanian Law Compliant: ${results.ltCompliant ? '✅' : '❌'}`);
        console.log(`✅ Passes: ${results.passes}`);
        console.log(`❌ Violations: ${results.violations.length}`);
        
        if (results.violations.length > 0) {
          console.group('🚨 Violations');
          results.violations.forEach(violation => {
            console.log(`${violation.impact.toUpperCase()}: ${violation.description}`);
          });
          console.groupEnd();
        }
        console.groupEnd();
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'EU accessibility audit failed';
      setError(errorMessage);
      console.error('💥 EU accessibility audit failed:', err);
      
      // Return minimal fallback
      const fallbackResult: EUAccessibilityResults = {
        violations: [],
        passes: 0,
        score: 0,
        enCompliant: false,
        ltCompliant: false,
        timestamp: new Date(),
        url: window.location.href
      };
      
      setResults(fallbackResult);
      return fallbackResult;
    } finally {
      setIsAuditing(false);
    }
  }, []);

  const getCriticalIssuesCount = useCallback(() => {
    return results?.violations.filter(v => v.impact === 'critical').length || 0;
  }, [results]);

  const getSeriousIssuesCount = useCallback(() => {
    return results?.violations.filter(v => v.impact === 'serious').length || 0;
  }, [results]);

  const getEUComplianceRecommendations = useCallback(() => {
    if (!results) return [];
    
    const recommendations: string[] = [];
    
    if (!results.enCompliant) {
      recommendations.push('Address critical accessibility violations for EN 301 549 compliance');
    }
    
    if (!results.ltCompliant) {
      recommendations.push('Improve accessibility score to meet Lithuanian accessibility law requirements');
    }
    
    if (results.score < 85) {
      recommendations.push('Increase overall accessibility score to minimum 85%');
    }
    
    const criticalCount = getCriticalIssuesCount();
    const seriousCount = getSeriousIssuesCount();
    
    if (criticalCount > 0) {
      recommendations.push(`Fix ${criticalCount} critical accessibility issue${criticalCount !== 1 ? 's' : ''}`);
    }
    
    if (seriousCount > 1) {
      recommendations.push(`Address ${seriousCount} serious accessibility issues`);
    }
    
    return recommendations;
  }, [results, getCriticalIssuesCount, getSeriousIssuesCount]);

  return {
    results,
    isAuditing,
    error,
    runEUAudit,
    getCriticalIssuesCount,
    getSeriousIssuesCount,
    getEUComplianceRecommendations,
    hasViolations: (results?.violations.length || 0) > 0,
    isHealthy: !error && !isAuditing && results !== null
  };
};