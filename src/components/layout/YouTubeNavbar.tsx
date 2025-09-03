import React from 'react';
import { Search, Menu, User, LogIn, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface YouTubeNavbarProps {
  onSearch: (term: string) => void;
  searchTerm: string;
}

export const YouTubeNavbar: React.FC<YouTubeNavbarProps> = ({ onSearch, searchTerm }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  return (
    <nav className="sticky top-0 z-50 bg-background border-b border-border px-4 py-3">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Left Section: Home button and Language toggle */}
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0" role="group" aria-label="Navigation and language">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/home')}
            className="h-9 w-9" 
            title="Home"
            aria-label="Go to home page"
          >
            <Home className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button size="sm" variant={language === 'en' ? 'default' : 'outline'} className="h-9 px-3" onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>
            EN
          </Button>
          <Button size="sm" variant={language === 'fi' ? 'default' : 'outline'} className="h-9 px-3" onClick={() => setLanguage('fi')} aria-pressed={language === 'fi'}>
            FI
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="flex items-center">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t('videos.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-4 pr-12 py-2 w-full border-r-0 rounded-r-none focus:ring-2 focus:ring-primary"
                aria-label={t('common.search')}
              />
              <Button 
                size="sm" 
                className="absolute right-0 top-0 h-full px-4 rounded-l-none border border-l-0"
                aria-label={t('common.search')}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden md:block">
                {t('nav.welcome')}, {user.firstName || user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('nav.dashboard')}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('auth.signIn')}</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => navigate('/auth')}
                className="hidden sm:flex"
              >
                {t('auth.signUp')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};