import React from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';
import { usePrincipalStudentCountDebug } from '@/hooks/usePrincipalStudentCountDebug';

interface LayoutProps {
  children: React.ReactNode;
}

const LayoutContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        {isCollapsed && <TopNavbar />}
        
        <main className="flex-1 overflow-auto">
          {/* Skip link for accessibility */}
          <a 
            href="#main-content" 
            className="skip-link"
            aria-label="Skip to main content"
          >
            Skip to main content
          </a>
          
          <div id="main-content" className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  usePrincipalStudentCountDebug();
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
      
      {/* Live region for dynamic announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="layout-announcements"
      >
        {/* Dynamic announcements will be made here */}
      </div>
    </SidebarProvider>
  );
};