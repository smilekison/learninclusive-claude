import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { InvitationForm } from '@/components/auth/InvitationForm';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 flex items-center justify-center p-4">
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
  );
};

export default AuthPage;