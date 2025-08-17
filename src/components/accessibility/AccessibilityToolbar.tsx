import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TTSButton } from '@/components/accessibility/TTSButton';
import { 
  Volume2, 
  Eye, 
  MessageCircle, 
  Headphones, 
  Type, 
  Palette,
  Subtitles,
  Keyboard,
  Mouse,
  Languages
} from 'lucide-react';

interface AccessibilityToolbarProps {
  disabilities: string[];
  className?: string;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  disabilities,
  className
}) => {
  const hasVisualImpairment = disabilities?.includes('visual_impairment') || disabilities?.includes('blind_low_vision');
  const hasHearingImpairment = disabilities?.includes('hearing_impairment') || disabilities?.includes('deaf_hard_hearing');
  const hasCognitiveDisability = disabilities?.includes('cognitive_disability') || disabilities?.includes('emotional_behavioral_disorder');
  const hasMotorImpairment = disabilities?.includes('motor_impairment');
  const hasSpeechImpairment = disabilities?.includes('mute_non_verbal');

  const tools = [];

  // Visual impairment tools
  if (hasVisualImpairment) {
    tools.push(
      {
        icon: <Type className="h-4 w-4" />,
        label: "Large Text",
        description: "Increased text size for better readability",
        active: true
      },
      {
        icon: <Palette className="h-4 w-4" />,
        label: "High Contrast",
        description: "Enhanced contrast colors",
        active: true
      },
      {
        icon: <Eye className="h-4 w-4" />,
        label: "Screen Reader",
        description: "Optimized for screen reading software",
        active: true
      }
    );
  }

  // Hearing impairment tools
  if (hasHearingImpairment) {
    tools.push(
      {
        icon: <Subtitles className="h-4 w-4" />,
        label: "Visual Alerts",
        description: "Visual notifications instead of audio",
        active: true
      },
      {
        icon: <Volume2 className="h-4 w-4" />,
        label: "Text-to-Speech",
        description: "Read content aloud with visual feedback",
        active: true
      },
      {
        icon: <Languages className="h-4 w-4" />,
        label: "Sign Language",
        description: "Sign language interpretation available",
        active: false
      }
    );
  }

  // Cognitive disability tools
  if (hasCognitiveDisability) {
    tools.push(
      {
        icon: <MessageCircle className="h-4 w-4" />,
        label: "Simple Layout",
        description: "Reduced clutter and clear navigation",
        active: true
      },
      {
        icon: <Headphones className="h-4 w-4" />,
        label: "Focus Mode",
        description: "Minimized distractions",
        active: true
      }
    );
  }

  // Motor impairment tools
  if (hasMotorImpairment) {
    tools.push(
      {
        icon: <Mouse className="h-4 w-4" />,
        label: "Large Targets",
        description: "Bigger buttons and clickable areas",
        active: true
      },
      {
        icon: <Keyboard className="h-4 w-4" />,
        label: "Keyboard Nav",
        description: "Full keyboard navigation support",
        active: true
      }
    );
  }

  // Speech impairment tools
  if (hasSpeechImpairment) {
    tools.push(
      {
        icon: <MessageCircle className="h-4 w-4" />,
        label: "Text Communication",
        description: "Alternative communication methods",
        active: true
      }
    );
  }

  if (tools.length === 0) return null;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Active Accessibility Tools</h3>
          <TTSButton 
            text={`You have ${tools.length} accessibility tools active to help with your learning.`}
            variant="ghost"
            size="sm"
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {tools.map((tool, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border transition-colors ${
                tool.active 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {tool.icon}
                <span className="text-xs font-medium">{tool.label}</span>
                {tool.active && (
                  <Badge variant="default" className="h-4 text-xs px-1">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                {tool.description}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};