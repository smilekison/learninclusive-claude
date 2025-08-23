import React, { useId } from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { announceToScreenReader, generateAriaLabel } from '@/utils/accessibilityHelpers';

interface EnhancedFormFieldProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  helpText?: string;
}

export const EnhancedFormField: React.FC<EnhancedFormFieldProps> = ({
  id: providedId,
  label,
  description,
  error,
  required = false,
  children,
  helpText
}) => {
  const { settings } = useAccessibility();
  const generatedId = useId();
  const id = providedId || generatedId;
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  // Announce errors to screen reader
  React.useEffect(() => {
    if (error && settings.ariaLive) {
      announceToScreenReader(`Error in ${label}: ${error}`, 'assertive');
    }
  }, [error, label, settings.ariaLive]);

  const ariaDescribedBy = [
    description ? descriptionId : null,
    error ? errorId : null,
    helpText ? helpId : null
  ].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn(
      'space-y-2',
      settings.simplifiedInterface && 'space-y-3',
      error && 'accessibility-form-error'
    )}>
      <Label 
        htmlFor={id}
        className={cn(
          'block text-sm font-medium',
          settings.largeClickTargets && 'text-lg font-semibold',
          settings.highContrast && 'font-bold text-foreground',
          required && "after:content-['*'] after:ml-1 after:text-destructive after:font-bold"
        )}
      >
        {label}
        {required && (
          <span className="sr-only"> (required)</span>
        )}
      </Label>
      
      {description && (
        <p 
          id={descriptionId}
          className={cn(
            'text-sm text-muted-foreground',
            settings.largeClickTargets && 'text-base',
            settings.screenReaderOptimized && 'mb-2'
          )}
        >
          {description}
        </p>
      )}

      {helpText && (
        <p 
          id={helpId}
          className={cn(
            'text-xs text-muted-foreground italic',
            settings.largeClickTargets && 'text-sm'
          )}
        >
          {helpText}
        </p>
      )}
      
      <div 
        className={cn(
          settings.largeClickTargets && 'text-lg'
        )}
      >
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-describedby': ariaDescribedBy,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : undefined
        })}
      </div>
      
      {error && (
        <div 
          id={errorId}
          role="alert"
          aria-live="polite"
          className={cn(
            'text-sm text-destructive font-medium',
            settings.largeClickTargets && 'text-base',
            settings.highContrast && 'font-bold',
            'flex items-center gap-1'
          )}
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </div>
      )}
    </div>
  );
};

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  description?: string;
  error?: string;
  helpText?: string;
}

export const EnhancedInput: React.FC<EnhancedInputProps> = ({
  id,
  label,
  description,
  error,
  helpText,
  className,
  ...props
}) => {
  const { settings } = useAccessibility();

  return (
    <EnhancedFormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={props.required}
      helpText={helpText}
    >
      <Input
        {...props}
        className={cn(
          className,
          settings.largeClickTargets && 'min-h-[44px] text-lg px-4',
          settings.highContrast && 'border-2 border-border',
          settings.focusAssistance && 'focus:scale-[1.02] transition-transform focus:shadow-lg',
          error && 'border-destructive focus:border-destructive focus:ring-destructive'
        )}
      />
    </EnhancedFormField>
  );
};

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  description?: string;
  error?: string;
  helpText?: string;
}

export const EnhancedTextarea: React.FC<EnhancedTextareaProps> = ({
  id,
  label,
  description,
  error,
  helpText,
  className,
  ...props
}) => {
  const { settings } = useAccessibility();

  return (
    <EnhancedFormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={props.required}
      helpText={helpText}
    >
      <Textarea
        {...props}
        className={cn(
          className,
          settings.largeClickTargets && 'min-h-[88px] text-lg px-4 py-3',
          settings.highContrast && 'border-2 border-border',
          settings.focusAssistance && 'focus:scale-[1.02] transition-transform focus:shadow-lg',
          error && 'border-destructive focus:border-destructive focus:ring-destructive'
        )}
      />
    </EnhancedFormField>
  );
};

interface EnhancedSelectProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  helpText?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  required?: boolean;
}

export const EnhancedSelect: React.FC<EnhancedSelectProps> = ({
  id,
  label,
  description,
  error,
  helpText,
  placeholder,
  value,
  onValueChange,
  children,
  required = false
}) => {
  const { settings } = useAccessibility();

  return (
    <EnhancedFormField
      id={id}
      label={label}
      description={description}
      error={error}
      required={required}
      helpText={helpText}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger 
          className={cn(
            settings.largeClickTargets && 'min-h-[44px] text-lg',
            settings.highContrast && 'border-2 border-border',
            settings.focusAssistance && 'focus:scale-[1.02] transition-transform focus:shadow-lg',
            error && 'border-destructive focus:ring-destructive'
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className={cn(
          settings.highContrast && 'border-2',
          'bg-background border-border shadow-lg z-50'
        )}>
          {children}
        </SelectContent>
      </Select>
    </EnhancedFormField>
  );
};

interface EnhancedCheckboxProps {
  id?: string;
  label: string;
  description?: string;
  error?: string;
  helpText?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  required?: boolean;
}

export const EnhancedCheckbox: React.FC<EnhancedCheckboxProps> = ({
  id,
  label,
  description,
  error,
  helpText,
  checked,
  onCheckedChange,
  required = false
}) => {
  const { settings } = useAccessibility();
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <EnhancedFormField
      id={fieldId}
      label=""
      description={description}
      error={error}
      required={required}
      helpText={helpText}
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          id={fieldId}
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={cn(
            settings.largeClickTargets && 'h-5 w-5',
            settings.highContrast && 'border-2',
            settings.focusAssistance && 'focus:scale-110 transition-transform',
            error && 'border-destructive'
          )}
        />
        <div className="flex-1">
          <Label 
            htmlFor={fieldId}
            className={cn(
              'text-sm font-medium cursor-pointer',
              settings.largeClickTargets && 'text-lg',
              settings.highContrast && 'font-semibold',
              required && "after:content-['*'] after:ml-1 after:text-destructive"
            )}
          >
            {label}
            {required && (
              <span className="sr-only"> (required)</span>
            )}
          </Label>
        </div>
      </div>
    </EnhancedFormField>
  );
};