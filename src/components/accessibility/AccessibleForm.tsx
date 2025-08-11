import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AccessibleFormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  description,
  error,
  required = false,
  children
}) => {
  const { settings } = useAccessibility();

  return (
    <div className={cn(
      'space-y-2',
      settings.simplifiedInterface && 'space-y-3'
    )}>
      <Label 
        htmlFor={id}
        className={cn(
          'block',
          settings.largeClickTargets && 'text-lg font-medium',
          settings.highContrast && 'font-bold',
          required && "after:content-['*'] after:ml-1 after:text-destructive"
        )}
      >
        {label}
        {required && (
          <span className="sr-only">required</span>
        )}
      </Label>
      
      {description && (
        <p 
          id={`${id}-description`}
          className={cn(
            'text-sm text-muted-foreground',
            settings.largeClickTargets && 'text-base',
            settings.screenReaderOptimized && 'mb-2'
          )}
        >
          {description}
        </p>
      )}
      
      <div 
        className={cn(
          settings.largeClickTargets && 'text-lg'
        )}
        aria-describedby={cn(
          description && `${id}-description`,
          error && `${id}-error`
        )}
      >
        {children}
      </div>
      
      {error && (
        <p 
          id={`${id}-error`}
          role="alert"
          className={cn(
            'text-sm text-destructive',
            settings.largeClickTargets && 'text-base',
            settings.highContrast && 'font-semibold'
          )}
        >
          {error}
        </p>
      )}
    </div>
  );
};

interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
}

export const AccessibleInput: React.FC<AccessibleInputProps> = ({
  id,
  label,
  description,
  error,
  className,
  ...props
}) => {
  const { settings } = useAccessibility();

  return (
    <AccessibleFormField
      id={id!}
      label={label}
      description={description}
      error={error}
      required={props.required}
    >
      <Input
        {...props}
        id={id}
        className={cn(
          className,
          settings.largeClickTargets && 'min-h-[44px] text-lg px-4',
          settings.highContrast && 'border-2',
          settings.focusAssistance && 'focus:scale-105 transition-transform',
          error && 'border-destructive focus:border-destructive'
        )}
        aria-invalid={error ? 'true' : 'false'}
      />
    </AccessibleFormField>
  );
};

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
}

export const AccessibleTextarea: React.FC<AccessibleTextareaProps> = ({
  id,
  label,
  description,
  error,
  className,
  ...props
}) => {
  const { settings } = useAccessibility();

  return (
    <AccessibleFormField
      id={id!}
      label={label}
      description={description}
      error={error}
      required={props.required}
    >
      <Textarea
        {...props}
        id={id}
        className={cn(
          className,
          settings.largeClickTargets && 'min-h-[88px] text-lg px-4 py-3',
          settings.highContrast && 'border-2',
          settings.focusAssistance && 'focus:scale-105 transition-transform',
          error && 'border-destructive focus:border-destructive'
        )}
        aria-invalid={error ? 'true' : 'false'}
      />
    </AccessibleFormField>
  );
};

interface AccessibleSelectProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}

export const AccessibleSelect: React.FC<AccessibleSelectProps> = ({
  id,
  label,
  description,
  error,
  placeholder,
  value,
  onValueChange,
  children,
  required = false
}) => {
  const { settings } = useAccessibility();

  return (
    <AccessibleFormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger 
          id={id}
          className={cn(
            settings.largeClickTargets && 'min-h-[44px] text-lg',
            settings.highContrast && 'border-2',
            settings.focusAssistance && 'focus:scale-105 transition-transform',
            error && 'border-destructive'
          )}
          aria-invalid={error ? 'true' : 'false'}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </AccessibleFormField>
  );
};