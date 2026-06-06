import React, { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      <label className="input-label">{label}</label>
      <input 
        className={`input-field ${error ? 'border-red-500' : ''}`}
        {...props} 
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
};
