import React, { useEffect, useMemo } from 'react';
import { useEnhancedStudentProfile } from '@/hooks/useEnhancedStudentProfile';
import { DisabilityAdaptiveInterface } from '@/components/accessibility/DisabilityAdaptiveInterface';
import { AccessibilityToolbar } from '@/components/accessibility/AccessibilityToolbar';
import { VisualAlert } from '@/components/accessibility/VisualAlert';
import { TTSButton } from '@/components/accessibility/TTSButton';
import { cn } from '@/lib/utils';

interface StudentAccessibilityWrapperProps {
  children: React.ReactNode;
  className?: string;
}

// Normalize various labels to our internal keys
const normalizeDisability = (value?: string): string | null => {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v.includes('hear') || v.includes('deaf')) return 'hearing_impairment';
  if (v.includes('blind') || v.includes('vision') || v.includes('visual')) return 'visual_impairment';
  if (v.includes('cogn') || v.includes('adhd') || v.includes('autis') || v.includes('learning')) return 'cognitive_disability';
  if (v.includes('motor') || v.includes('mobility')) return 'motor_impairment';
  if (v.includes('speech') || v.includes('mute') || v.includes('non verbal')) return 'mute_non_verbal';
  return value; // fallback as-is
};

export const StudentAccessibilityWrapper: React.FC<StudentAccessibilityWrapperProps> = ({ children, className }) => {
  const { data: profile } = useEnhancedStudentProfile();

  // Determine primary disability: prefer disability_details.primary, else first of disabilities[]
  const primaryDisability = useMemo(() => {
    const rawPrimary = (profile as any)?.disability_details?.primary || (profile as any)?.disability_details?.primary_disability || (profile?.disabilities?.[0] ?? null);
    return normalizeDisability(rawPrimary || undefined);
  }, [profile]);

  // If no profile or no primary, just render children
  if (!profile || !primaryDisability) {
    return <>{children}</>;
  }

  // Build a clear, prominent banner message per primary disability
  const banner = {
    hearing_impairment: {
      title: 'Hearing support enabled',
      desc: 'Visual alerts, captions emphasis, and TTS controls are highlighted for you.',
    },
    visual_impairment: {
      title: 'Visual support enabled',
      desc: 'Larger text, increased contrast, and enhanced focus indicators are active.',
    },
    cognitive_disability: {
      title: 'Cognitive support enabled',
      desc: 'Simplified layout, clearer spacing, and focus mode elements are emphasized.',
    },
    motor_impairment: {
      title: 'Motor support enabled',
      desc: 'Larger click targets and full keyboard navigation are prioritized.',
    },
    mute_non_verbal: {
      title: 'Communication support enabled',
      desc: 'Text-based and alternative communication tools are highlighted.',
    },
  } as const;

  const b = (banner as any)[primaryDisability] || { title: 'Accessibility support enabled', desc: 'Your dashboard is tailored for your needs.' };

  return (
    <DisabilityAdaptiveInterface disabilities={[primaryDisability]} className={className}>
      {/* Prominent, sticky accessibility banner */}
      <section
        className={cn(
          'sticky top-0 z-40 mb-4 rounded-md border p-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 bg-primary/5 border-primary/20',
          'animate-fade-in'
        )}
        aria-label="Accessibility mode banner"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-primary">{b.title}</h2>
            <p className="text-sm text-muted-foreground">{b.desc}</p>
          </div>
          <TTSButton text={`${b.title}. ${b.desc}`} variant="ghost" size="sm" />
        </div>
      </section>

      {/* Visual cue for hearing support to make change obvious */}
      {primaryDisability === 'hearing_impairment' && (
        <VisualAlert type="info" message="Visual alerts are ON for hearing support." duration={8000} />
      )}

      {/* Focused toolbar for the primary disability only */}
      <AccessibilityToolbar disabilities={[primaryDisability]} className="mb-4" />

      {children}
    </DisabilityAdaptiveInterface>
  );
};

export default StudentAccessibilityWrapper;
