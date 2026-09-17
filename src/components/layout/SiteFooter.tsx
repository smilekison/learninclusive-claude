import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Heart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const SiteFooter: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-16 bg-background border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">learninclusive</span>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {t('landing.footer.description')}
            </p>
            <Badge variant="outline" className="mb-4">
              WCAG 2.1 AA Compliant
            </Badge>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('landing.footer.quickLinks')}</h4>
            <div className="space-y-3">
              <div><a href="/#about" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.about')}</a></div>
              <div><a href="/#services" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.services')}</a></div>
              <div><Link to="/accessibility-statement" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.accessibility')}</Link></div>
              <div><a href="/#contact" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.contact')}</a></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('landing.footer.legal')}</h4>
            <div className="space-y-3">
              <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.privacy')}</a></div>
              <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.terms')}</a></div>
              <div><a href="#" className="text-muted-foreground hover:text-primary transition-colors">{t('landing.footer.cookies')}</a></div>
            </div>
          </div>
        </div>

        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm">
            {t('landing.footer.copyright')}
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <span className="text-sm text-muted-foreground">{t('landing.footer.compliance')}</span>
            <Heart className="h-4 w-4 text-red-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
