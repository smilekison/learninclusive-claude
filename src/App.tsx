import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { TTSProvider } from "@/contexts/TTSContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "next-themes";
import { SkipNavigation, AccessibilityAnnouncements } from "@/components/accessibility/SkipNavigation";
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { GlobalShortcutsProvider } from "@/contexts/GlobalShortcutsContext";
import { ShortcutsHelp } from "@/components/accessibility/ShortcutsHelp";
import { ChatbotDrawer } from "@/components/chatbot/ChatbotDrawer";
import UniversalAssistBar from "@/components/layout/UniversalAssistBar";
import { LiveAnnouncer } from "@/components/accessibility/LiveAnnouncer";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AuthPage } from "./pages/AuthPage";
import { Dashboard } from "./pages/Dashboard";
import { InsightsPage } from "./pages/InsightsPage";
import { VideoHomepage } from "./pages/VideoHomepage";
import { YouTubeHomepage } from "./pages/YouTubeHomepage";
import { VideoDetailsPage } from "./pages/VideoDetailsPage";
import { SubjectsPage } from "./pages/SubjectsPage";
import { AssignmentsPage } from "./pages/AssignmentsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { TeachersPage } from "./pages/TeachersPage";
import { TeacherProfilePage } from "./pages/TeacherProfilePage";
import { ClassesPage } from "./pages/ClassesPage";
import { BinPage } from "./pages/BinPage";
import { StudentSubjectsPage } from "./pages/StudentSubjectsPage";
import { StudentAssignmentsPage } from "./pages/StudentAssignmentsPage";
import { SubmissionsPage } from "./pages/SubmissionsPage";
import { JoinSubjectPage } from "./pages/JoinSubjectPage";

import NotFound from "./pages/NotFound";
import { Layout } from "./components/layout/Layout";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={<YouTubeHomepage />} 
      />
      <Route 
        path="/auth" 
        element={<AuthPage />} 
      />
      <Route 
        path="/videos" 
        element={<VideoHomepage />} 
      />
      <Route 
        path="/video/:id" 
        element={<VideoDetailsPage />} 
      />
      
      {/* Protected routes with Layout */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/insights" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><InsightsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teachers" 
        element={
          <ProtectedRoute requiredRole="principal">
            <Layout><TeachersPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/teacher/:teacherId" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><TeacherProfilePage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/classes" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><ClassesPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/subjects" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><SubjectsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/assignments" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><AssignmentsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/students" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><StudentsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/classes" 
        element={
          <ProtectedRoute requiredRole="student">
            <Layout><ClassesPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/subjects" 
        element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentSubjectsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/student/assignments" 
        element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentAssignmentsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/bin" 
        element={
          <ProtectedRoute requiredRole="principal">
            <Layout><BinPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/submissions" 
        element={
          <ProtectedRoute allowedRoles={['principal', 'teacher']}>
            <Layout><SubmissionsPage /></Layout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/join-subject" 
        element={
          <ProtectedRoute requiredRole="student">
            <Layout><JoinSubjectPage /></Layout>
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="ils-theme" disableTransitionOnChange={false}>
      <LanguageProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <TTSProvider>
              <TooltipProvider>
                <GlobalShortcutsProvider>
                  <SkipNavigation />
                  <AccessibilityAnnouncements />
                  <AccessibilityPanel />
                  <ShortcutsHelp />
                  {/* Chatbot is global, lightweight, and opt-in */}
                  <ChatbotDrawer />
                  <UniversalAssistBar />
                  
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <LiveAnnouncer />
                    <AppContent />
                  </BrowserRouter>
                </GlobalShortcutsProvider>
              </TooltipProvider>
            </TTSProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
