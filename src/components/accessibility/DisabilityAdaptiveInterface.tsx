import React from 'react';
import { cn } from '@/lib/utils';
import { Volume2, Eye, MessageCircle, Heart, Zap, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TTSButton } from '@/components/accessibility/TTSButton';

interface DisabilityAdaptiveInterfaceProps {
  disabilities: string[];
  children: React.ReactNode;
  className?: string;
}

export const DisabilityAdaptiveInterface: React.FC<DisabilityAdaptiveInterfaceProps> = ({
  disabilities,
  children,
  className
}) => {
  const hasVisualImpairment = disabilities?.includes('visual_impairment') || disabilities?.includes('blind_low_vision');
  const hasHearingImpairment = disabilities?.includes('hearing_impairment') || disabilities?.includes('deaf_hard_hearing');
  const hasCognitiveDisability = disabilities?.includes('cognitive_disability') || disabilities?.includes('emotional_behavioral_disorder');
  const hasMotorImpairment = disabilities?.includes('motor_impairment');
  const hasSpeechImpairment = disabilities?.includes('mute_non_verbal');

  // Generate adaptive styles
  const adaptiveClasses = cn(
    // Base classes
    'transition-all duration-300',
    
    // Visual impairment adaptations
    hasVisualImpairment && [
      'text-lg', // Larger text
      'leading-relaxed', // Better line spacing
      'contrast-125', // Higher contrast
      'focus-within:ring-4 focus-within:ring-primary/50', // Enhanced focus indicators
    ],
    
    // Cognitive disability adaptations
    hasCognitiveDisability && [
      'space-y-6', // More spacing between elements
      '[&_button]:text-base [&_button]:px-6 [&_button]:py-3', // Larger buttons
      '[&_card]:border-2 [&_card]:border-primary/20', // Clearer boundaries
    ],
    
    // Motor impairment adaptations
    hasMotorImpairment && [
      '[&_button]:min-h-[48px] [&_button]:min-w-[48px]', // Larger click targets
      '[&_input]:min-h-[48px]', // Larger form inputs
      '[&_select]:min-h-[48px]',
      'touch-manipulation', // Better touch handling
    ],
    
    className
  );

  return (
    <div className={adaptiveClasses}>
      {/* Disability-specific accessibility banner */}
      {disabilities && disabilities.length > 0 && (
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                Personalized Accessibility Features
              </CardTitle>
              <TTSButton 
                text="This dashboard is personalized for your accessibility needs. You have adaptive features for visual, hearing, and cognitive support."
                variant="ghost"
                size="sm"
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2 mb-3">
              {hasVisualImpairment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  Visual Support
                </Badge>
              )}
              {hasHearingImpairment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Volume2 className="h-3 w-3" />
                  Audio Support
                </Badge>
              )}
              {hasCognitiveDisability && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" />
                  Cognitive Support
                </Badge>
              )}
              {hasMotorImpairment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Motor Support
                </Badge>
              )}
              {hasSpeechImpairment && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  Communication Support
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {hasVisualImpairment && "Enhanced contrast and larger text for better visibility. "}
              {hasHearingImpairment && "Visual alerts and text-to-speech available. "}
              {hasCognitiveDisability && "Simplified layout with clear navigation. "}
              {hasMotorImpairment && "Larger click targets and keyboard navigation. "}
              {hasSpeechImpairment && "Alternative communication methods enabled. "}
            </p>
          </CardContent>
        </Card>
      )}
      
      {children}
    </div>
  );
};