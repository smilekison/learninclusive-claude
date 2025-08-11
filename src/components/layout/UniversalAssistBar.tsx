import React from 'react';
import { Button } from '@/components/ui/button';
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext';
import { Keyboard } from 'lucide-react';

export const UniversalAssistBar: React.FC = () => {
  const { emit } = useGlobalShortcuts();

  return (
    <>
      {/* Shortcuts Help trigger (floating) */}
      <div className="fixed bottom-40 right-5 z-50">
        <Button
          size="icon"
          variant="outline"
          aria-label="Open keyboard shortcuts (Shift+/)"
          onClick={() => emit('openHelp')}
          className="rounded-full h-12 w-12"
        >
          <Keyboard className="h-6 w-6" />
        </Button>
      </div>
    </>
  );
};

export default UniversalAssistBar;