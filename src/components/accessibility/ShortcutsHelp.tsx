import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGlobalShortcuts } from '@/contexts/GlobalShortcutsContext';

export const ShortcutsHelp: React.FC = () => {
  const { on } = useGlobalShortcuts();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    return on('openHelp', () => setOpen(true));
  }, [on]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent aria-label="Keyboard shortcuts help">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>Boost your productivity with quick commands.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <span className="font-medium">Open search</span>: Cmd/Ctrl + K
            </li>
            <li>
              <span className="font-medium">Show this help</span>: Shift + /
            </li>
            <li>
              <span className="font-medium">Accessibility panel</span>: Alt + /
            </li>
            <li>
              <span className="font-medium">Go to Dashboard</span>: g then d
            </li>
            <li>
              <span className="font-medium">Close overlays</span>: Escape
            </li>
            <li>
              <span className="font-medium">Lists</span>: Use Arrow keys, Enter/Space to activate, Home/End to jump
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};
