import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onToggleMode: () => void;
  onForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode, onForgotPassword }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('LOGIN FORM: Starting login attempt');
    console.log('LOGIN FORM: Email:', email);

    if (!email || !password) {
      console.log('LOGIN FORM: Missing email or password');
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('LOGIN FORM: Calling login function');
      await login(email, password);
      console.log('LOGIN FORM: Login function completed successfully');
    } catch (err) {
      console.error('LOGIN FORM: Login failed with error:', err);
      setError('Invalid email or password');
    }
  };

  return (
    <Card className="w-full max-w-md card-elevated" role="main">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-semibold text-primary">
          {t('auth.welcomeBack')}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {t('auth.signInDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              {t('auth.emailAddress')}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.enterEmail')}
              className="w-full"
              aria-describedby={error ? "email-error" : undefined}
              aria-invalid={error ? "true" : "false"}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              {t('auth.password')}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.enterPassword')}
                className="w-full pr-10"
                aria-describedby={error ? "password-error" : undefined}
                aria-invalid={error ? "true" : "false"}
                autoComplete="current-password"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription id="email-error password-error">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full btn-primary"
            disabled={loading}
            aria-describedby="login-status"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('auth.signingIn')}
              </>
            ) : (
              t('auth.signIn')
            )}
          </Button>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              onClick={onForgotPassword}
              className="text-sm text-muted-foreground hover:text-primary"
            >
              {t('auth.forgotPassword')}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={onToggleMode}
              className="text-sm text-primary hover:text-primary-dark"
            >
              {t('auth.noAccount')}
            </Button>
          </div>
        </form>

        {/* Demo credentials for testing */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">{t('auth.demoCredentials')}</h4>
          <div className="text-xs space-y-1 text-muted-foreground">
            <button
              type="button"
              className="block w-full text-left hover:text-primary hover:bg-background/50 p-1 rounded transition-colors"
              onClick={() => {
                setEmail('principal@riverside.edu');
                setPassword('demo123');
              }}
            >
              <strong>{t('auth.principal')}:</strong> principal@riverside.edu
            </button>
            <button
              type="button"
              className="block w-full text-left hover:text-primary hover:bg-background/50 p-1 rounded transition-colors"
              onClick={() => {
                setEmail('teacher1@riverside.edu');
                setPassword('demo123');
              }}
            >
              <strong>{t('auth.teacher')}:</strong> teacher1@riverside.edu
            </button>
            <button
              type="button"
              className="block w-full text-left hover:text-primary hover:bg-background/50 p-1 rounded transition-colors"
              onClick={() => {
                setEmail('student1@riverside.edu');
                setPassword('demo123');
              }}
            >
              <strong>{t('auth.student')}:</strong> student1@riverside.edu
            </button>
            <button
              type="button"
              className="block w-full text-left hover:text-primary hover:bg-background/50 p-1 rounded transition-colors"
              onClick={() => {
                setEmail('parent@riverside.edu');
                setPassword('demo123');
              }}
            >
              <strong>{t('auth.parent')}:</strong> parent@riverside.edu
            </button>
            <p className="pt-1"><strong>{t('auth.passwordLabel')}:</strong> demo123</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};