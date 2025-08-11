import React, { useState } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Accessibility, 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Monitor,
  Volume2,
  Settings,
  RefreshCw,
  Keyboard,
  MousePointer,
  Contrast,
  Type,
  Palette
} from 'lucide-react';

export const AccessibilityPanel: React.FC = () => {
  const { settings, updateSetting, resetSettings } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-5 right-24 z-50 bg-primary text-primary-foreground rounded-full h-16 w-16 shadow-lg"
          aria-label="Open accessibility settings"
          title="Accessibility Settings"
        >
          <Accessibility className="h-7 w-7" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5" />
            Accessibility Settings
          </SheetTitle>
          <SheetDescription>
            Customize your experience for better accessibility. Settings are saved automatically.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Tabs defaultValue="visual" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visual" className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Visual
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-1">
                <Ear className="h-3 w-3" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="motor" className="flex items-center gap-1">
                <Hand className="h-3 w-3" />
                Motor
              </TabsTrigger>
              <TabsTrigger value="cognitive" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                Cognitive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visual Accessibility
                  </CardTitle>
                  <CardDescription>
                    Settings for users who are blind, have low vision, or color blindness
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="high-contrast" className="flex items-center gap-2">
                      <Contrast className="h-4 w-4" />
                      High Contrast Mode
                    </Label>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => updateSetting('highContrast', checked)}
                      aria-describedby="high-contrast-description"
                    />
                  </div>
                  <p id="high-contrast-description" className="text-sm text-muted-foreground">
                    Increases contrast between text and background for better readability
                  </p>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="font-size" className="flex items-center gap-2">
                      <Type className="h-4 w-4" />
                      Font Size: {settings.fontSize}%
                    </Label>
                    <Slider
                      id="font-size"
                      value={[settings.fontSize]}
                      onValueChange={(value) => updateSetting('fontSize', value[0])}
                      min={100}
                      max={200}
                      step={10}
                      className="w-full"
                      aria-describedby="font-size-description"
                    />
                    <p id="font-size-description" className="text-sm text-muted-foreground">
                      Adjust text size from 100% to 200% for better readability
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark-mode" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Dark Mode
                    </Label>
                    <Switch
                      id="dark-mode"
                      checked={settings.darkMode}
                      onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="colorblind-friendly" className="flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Color Blind Friendly
                    </Label>
                    <Switch
                      id="colorblind-friendly"
                      checked={settings.colorBlindFriendly}
                      onCheckedChange={(checked) => updateSetting('colorBlindFriendly', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reduced-motion">Reduce Motion</Label>
                    <Switch
                      id="reduced-motion"
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-reader">Screen Reader Optimized</Label>
                    <Switch
                      id="screen-reader"
                      checked={settings.screenReaderOptimized}
                      onCheckedChange={(checked) => updateSetting('screenReaderOptimized', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ear className="h-4 w-4" />
                    Audio Accessibility
                  </CardTitle>
                  <CardDescription>
                    Settings for users who are deaf or hard of hearing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="visual-alerts" className="flex items-center gap-2">
                      <Volume2 className="h-4 w-4" />
                      Visual Alerts
                    </Label>
                    <Switch
                      id="visual-alerts"
                      checked={settings.visualAlerts}
                      onCheckedChange={(checked) => updateSetting('visualAlerts', checked)}
                      aria-describedby="visual-alerts-description"
                    />
                  </div>
                  <p id="visual-alerts-description" className="text-sm text-muted-foreground">
                    Replace sound notifications with visual indicators like flashing or color changes
                  </p>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="captions">Enable Captions</Label>
                    <Switch
                      id="captions"
                      checked={settings.captionsEnabled}
                      onCheckedChange={(checked) => updateSetting('captionsEnabled', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="motor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hand className="h-4 w-4" />
                    Motor Accessibility
                  </CardTitle>
                  <CardDescription>
                    Settings for users with motor impairments or mobility challenges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="large-targets" className="flex items-center gap-2">
                      <MousePointer className="h-4 w-4" />
                      Large Click Targets
                    </Label>
                    <Switch
                      id="large-targets"
                      checked={settings.largeClickTargets}
                      onCheckedChange={(checked) => updateSetting('largeClickTargets', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="keyboard-nav" className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4" />
                      Enhanced Keyboard Navigation
                    </Label>
                    <Switch
                      id="keyboard-nav"
                      checked={settings.keyboardNavigation}
                      onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="voice-input">Voice Input Support</Label>
                    <Switch
                      id="voice-input"
                      checked={settings.voiceInput}
                      onCheckedChange={(checked) => updateSetting('voiceInput', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cognitive" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Cognitive Accessibility
                  </CardTitle>
                  <CardDescription>
                    Settings for users with cognitive disabilities or learning differences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="simplified">Simplified Interface</Label>
                    <Switch
                      id="simplified"
                      checked={settings.simplifiedInterface}
                      onCheckedChange={(checked) => updateSetting('simplifiedInterface', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="reading-assistance">Reading Assistance</Label>
                    <Switch
                      id="reading-assistance"
                      checked={settings.readingAssistance}
                      onCheckedChange={(checked) => updateSetting('readingAssistance', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoplay-disabled">Disable Autoplay</Label>
                    <Switch
                      id="autoplay-disabled"
                      checked={settings.autoplayDisabled}
                      onCheckedChange={(checked) => updateSetting('autoplayDisabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="focus-assistance">Focus Assistance</Label>
                    <Switch
                      id="focus-assistance"
                      checked={settings.focusAssistance}
                      onCheckedChange={(checked) => updateSetting('focusAssistance', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={resetSettings}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};