import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import usePresence from '@/hooks/usePresence';
import { useLanguage } from '@/contexts/LanguageContext';

export const RoutePresenceBadge: React.FC = () => {
  const { routeOnline } = usePresence();
  const { t } = useLanguage();

  return (
    <Badge variant="outline" className="hidden md:flex items-center">
      <Users className="h-4 w-4 mr-1" />
      <span className="text-xs">{t('presence.online')}: {routeOnline}</span>
    </Badge>
  );
};

export default RoutePresenceBadge;
