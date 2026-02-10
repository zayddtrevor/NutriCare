import React from 'react';
import './Button.css';

/**
 * Standardized Button Component
 * @param {string} variant - primary, secondary, destructive, outline
 * @param {string} size - sm, md, lg
 * @param {boolean} isLoading - Shows loading state
 * @param {boolean} disabled - Disabled state
 * @param {React.ReactNode} icon - Optional icon
 * @param {string} className - Additional classes
 * @param {Function} onClick - Click handler
 * @param {React.ReactNode} children - Button text/content
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  className = '',
  onClick,
  children,
  ...props
}) => {
  return (
    <button
      className={`btn-common btn-${variant} btn-${size} ${className} ${isLoading ? 'btn-loading' : ''}`}
      onClick={onClick}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="spinner"></span>
      ) : (
        <>
          {icon && <span className="btn-icon">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
