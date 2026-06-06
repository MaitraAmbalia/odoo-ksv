import React, { type ButtonHTMLAttributes } from 'react';
import { Button as ShadcnButton } from './ui/button';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  return (
    <ShadcnButton 
      variant={variant === 'primary' ? 'default' : 'secondary'}
      className={className}
      disabled={isLoading || props.disabled}
      {...(props as any)}
    >
      {isLoading ? 'Loading...' : children}
    </ShadcnButton>
  );
};
