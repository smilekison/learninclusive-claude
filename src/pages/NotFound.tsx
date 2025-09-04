import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-3xl font-bold text-foreground mb-4">{t('notFound.pageNotFound')}</h2>
          <p className="text-muted-foreground mb-8">
            {t('notFound.pageNotFoundDescription')}
          </p>
        </div>
        
        <Button asChild size="lg">
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            {t('notFound.goHome')}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
