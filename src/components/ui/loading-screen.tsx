import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LoadingScreen: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-lg mx-auto mb-4 animate-pulse">
          <span className="text-2xl font-bold text-white">{t("app.shortName")}</span>
        </div>
        <h2 className="text-xl font-semibold text-primary mb-2">{t("common.loading")}</h2>
        <p className="text-muted-foreground">{t("common.preparingEnvironment")}</p>
      </div>
    </div>
  );
};