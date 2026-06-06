import React, { type InputHTMLAttributes } from 'react';
import { Input as ShadcnInput } from './ui/input';
import { Label } from './ui/label';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`grid w-full items-center gap-1.5 mb-5 ${className}`}>
      <Label htmlFor={props.id || props.name} className="text-sm font-medium text-muted-foreground">{label}</Label>
      <ShadcnInput 
        id={props.id || props.name}
        className={error ? 'border-destructive focus-visible:ring-destructive' : ''}
        {...props} 
      />
      {error && <span className="text-xs text-destructive mt-1">{error}</span>}
    </div>
  );
};
