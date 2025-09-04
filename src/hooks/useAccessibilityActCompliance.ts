import { useCallback, useState } from 'react';
import { useRobustAccessibilityAudit } from './useRobustAccessibilityAudit';

interface ComplianceResult {
  standard: string;
  compliant: boolean;
  score: number;
  criticalIssues: number;
  recommendations: string[];
}

interface AccessibilityActResults {
  ada: ComplianceResult;
  section508: ComplianceResult;
  wcag21aa: ComplianceResult;
  wcag22aa: ComplianceResult;
  enAct: ComplianceResult; // European Accessibility Act
  overallCompliance: boolean;
  overallScore: number;
  timestamp: Date;
}

export const useAccessibilityActCompliance = () => {
  const [complianceResults, setComplianceResults] = useState<AccessibilityActResults | null>(null);
  const [isTestingCompliance, setIsTestingCompliance] = useState(false);
  const { results: auditResults, runAudit, isAuditing } = useRobustAccessibilityAudit();

  const assessCompliance = useCallback(async (): Promise<AccessibilityActResults | null> => {
    setIsTestingCompliance(true);

    try {
      // First run the technical audit
      const auditData = await runAudit();
      if (!auditData) {
        throw new Error('Failed to run accessibility audit');
      }

      const criticalViolations = auditData.violations.filter(v => v.impact === 'critical');
      const seriousViolations = auditData.violations.filter(v => v.impact === 'serious');
      const totalViolations = auditData.violations.length;
      const baseScore = auditData.score;

      // ADA Title II & III Compliance Assessment
      const adaCompliance: ComplianceResult = {
        standard: 'Americans with Disabilities Act (ADA)',
        compliant: criticalViolations.length === 0 && seriousViolations.length <= 1 && baseScore >= 85,
        score: Math.max(0, baseScore - (criticalViolations.length * 25) - (seriousViolations.length * 15)),
        criticalIssues: criticalViolations.length + seriousViolations.length,
        recommendations: [
          criticalViolations.length > 0 ? 'Fix critical accessibility violations immediately - these block users with disabilities' : '',
          seriousViolations.length > 1 ? 'Address serious accessibility issues that prevent equal access' : '',
          baseScore < 85 ? 'Achieve minimum 85% accessibility score for ADA compliance' : '',
          'Ensure all interactive elements have proper labels and keyboard access',
          'Verify sufficient color contrast (4.5:1 minimum for normal text)',
          'Test with screen readers and keyboard-only navigation'
        ].filter(Boolean)
      };

      // Section 508 Compliance Assessment
      const section508Compliance: ComplianceResult = {
        standard: 'Section 508 (Federal)',
        compliant: criticalViolations.length === 0 && baseScore >= 85,
        score: Math.max(0, baseScore - (criticalViolations.length * 25) - (seriousViolations.length * 5)),
        criticalIssues: criticalViolations.length,
        recommendations: [
          criticalViolations.length > 0 ? 'Resolve critical accessibility barriers' : '',
          baseScore < 85 ? 'Improve overall accessibility score to meet federal standards' : '',
          'Ensure all forms are accessible with proper labeling',
          'Verify all multimedia content has appropriate alternatives',
          'Test with government-approved assistive technologies'
        ].filter(Boolean)
      };

      // WCAG 2.1 AA Compliance
      const wcag21aaCompliance: ComplianceResult = {
        standard: 'WCAG 2.1 AA',
        compliant: auditData.wcag21aa && criticalViolations.length === 0,
        score: auditData.wcag21aa ? baseScore : Math.max(0, baseScore - 15),
        criticalIssues: criticalViolations.length,
        recommendations: [
          !auditData.wcag21aa ? 'Address WCAG 2.1 AA specific violations' : '',
          'Ensure minimum color contrast ratios are met (4.5:1 for normal text)',
          'Verify all interactive elements are keyboard accessible',
          'Check that focus indicators are clearly visible'
        ].filter(Boolean)
      };

      // WCAG 2.2 AA Compliance (Enhanced)
      const wcag22aaCompliance: ComplianceResult = {
        standard: 'WCAG 2.2 AA',
        compliant: auditData.wcag21aa && criticalViolations.length === 0 && baseScore >= 92,
        score: auditData.wcag21aa && baseScore >= 92 ? baseScore : Math.max(0, baseScore - 10),
        criticalIssues: criticalViolations.length,
        recommendations: [
          baseScore < 92 ? 'Meet enhanced WCAG 2.2 requirements' : '',
          'Implement focus not obscured guidelines',
          'Ensure dragging movements have alternatives',
          'Verify consistent help placement across pages'
        ].filter(Boolean)
      };

      // European Accessibility Act Compliance
      const enActCompliance: ComplianceResult = {
        standard: 'European Accessibility Act (EN 301 549)',
        compliant: auditData.wcag21aa && criticalViolations.length === 0 && baseScore >= 88,
        score: auditData.wcag21aa && baseScore >= 88 ? baseScore : Math.max(0, baseScore - 12),
        criticalIssues: criticalViolations.length + seriousViolations.length,
        recommendations: [
          !auditData.wcag21aa ? 'Achieve WCAG 2.1 AA compliance as baseline' : '',
          'Ensure accessibility statement is available and up-to-date',
          'Implement feedback mechanism for accessibility issues',
          'Verify compliance with EN 301 549 technical standards'
        ].filter(Boolean)
      };

      // Calculate overall compliance - stricter requirements
      const allStandards = [adaCompliance, section508Compliance, wcag21aaCompliance, wcag22aaCompliance, enActCompliance];
      const compliantStandards = allStandards.filter(s => s.compliant).length;
      const averageScore = allStandards.reduce((sum, s) => sum + s.score, 0) / allStandards.length;

      const results: AccessibilityActResults = {
        ada: adaCompliance,
        section508: section508Compliance,
        wcag21aa: wcag21aaCompliance,
        wcag22aa: wcag22aaCompliance,
        enAct: enActCompliance,
        overallCompliance: adaCompliance.compliant && wcag21aaCompliance.compliant && compliantStandards >= 3,
        overallScore: Math.round(averageScore),
        timestamp: new Date()
      };

      setComplianceResults(results);

      // Enhanced logging
      if (process.env.NODE_ENV === 'development') {
        console.group('🏛️ Accessibility Act Compliance Report');
        console.log(`📊 Overall Score: ${results.overallScore}%`);
        console.log(`✅ Standards Met: ${compliantStandards}/5`);
        console.log(`🎯 Overall Compliant: ${results.overallCompliance ? 'YES' : 'NO'}`);
        
        allStandards.forEach(standard => {
          console.log(`${standard.compliant ? '✅' : '❌'} ${standard.standard}: ${standard.score}%`);
        });
        
        console.groupEnd();
      }

      return results;
    } catch (error) {
      console.error('💥 Accessibility Act compliance assessment failed:', error);
      return null;
    } finally {
      setIsTestingCompliance(false);
    }
  }, [runAudit]);

  const getHighestPriorityRecommendations = useCallback(() => {
    if (!complianceResults) return [];
    
    const allRecommendations = [
      ...complianceResults.ada.recommendations,
      ...complianceResults.section508.recommendations,
      ...complianceResults.wcag21aa.recommendations
    ];
    
    // Prioritize critical and serious issues
    const prioritized = Array.from(new Set(allRecommendations))
      .sort((a, b) => {
        const aWeight = (a.includes('critical') || a.includes('Fix')) ? 3 : 
                       a.includes('serious') ? 2 : 1;
        const bWeight = (b.includes('critical') || b.includes('Fix')) ? 3 : 
                       b.includes('serious') ? 2 : 1;
        return bWeight - aWeight;
      });
    
    return prioritized.slice(0, 5);
  }, [complianceResults]);

  const getComplianceStatus = useCallback((standard: keyof Omit<AccessibilityActResults, 'overallCompliance' | 'overallScore' | 'timestamp'>) => {
    return complianceResults?.[standard] || null;
  }, [complianceResults]);

  return {
    complianceResults,
    isTestingCompliance: isTestingCompliance || isAuditing,
    assessCompliance,
    getHighestPriorityRecommendations,
    getComplianceStatus,
    isHealthy: complianceResults !== null && !isTestingCompliance
  };
};