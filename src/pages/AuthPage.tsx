import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { InvitationForm } from '@/components/auth/InvitationForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Button } from '@/components/ui/button';
import { GraduationCap, Home } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, setLanguage, language } = useLanguage();
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('invite');
    if (token) {
      setInviteToken(token);
    }
  }, [location]);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/home" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">learninclusive</span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/home" 
                className="text-muted-foreground hover:text-primary transition-colors hidden sm:block"
              >
                About
              </Link>
              <Link 
                to="/videos" 
                className="text-muted-foreground hover:text-primary transition-colors hidden sm:block"
              >
                Videos
              </Link>
              <Link to="/home" title="Back to Home">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Home className="h-4 w-4" />
                </Button>
              </Link>

              {/* Language Switcher */}
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant={language === 'en' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('en')}
                  className="h-8 px-3"
                >
                  EN
                </Button>
                <Button 
                  size="sm" 
                  variant={language === 'fi' ? 'default' : 'outline'} 
                  onClick={() => setLanguage('fi')}
                  className="h-8 px-3"
                >
                  FI
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="flex items-center justify-center p-4 pt-16">
        <div className="w-full max-w-md">
        {/* Skip link for accessibility */}
        <a 
          href="#auth-form" 
          className="skip-link"
          aria-label="Skip to authentication form"
        >
          Skip to main content
        </a>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl font-bold text-white" aria-hidden="true">
                ILS
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">
            {t('app.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Auth Form */}
        <div id="auth-form">
          {inviteToken ? (
            <InvitationForm 
              token={inviteToken} 
              onSuccess={() => setInviteToken(null)}
            />
          ) : mode === 'login' ? (
            <LoginForm 
              onToggleMode={() => setMode('register')} 
              onForgotPassword={() => setMode('forgot')}
            />
          ) : mode === 'register' ? (
            <RegisterForm onToggleMode={() => setMode('login')} />
          ) : (
            <ForgotPasswordForm onBack={() => setMode('login')} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('footer.accessibilityCompliant')}
          </p>
          <p className="mt-2">
            {t('footer.compliance')}
          </p>
        </div>
      </div>

      {/* Live region for screen readers */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="auth-status"
      >
        {/* Dynamic status messages will be announced here */}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;