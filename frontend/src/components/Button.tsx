/**
 * Button component matching wireframe design
 */

import React, { ReactNode, CSSProperties } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'small';
  disabled?: boolean;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'normal',
  disabled = false,
  style,
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: size === 'small' ? '5px 11px' : '11px 20px',
    borderRadius: '4px',
    fontSize: size === 'small' ? '13px' : '15px',
    fontWeight: 600,
    fontFamily: 'var(--fb)',
    border: '2px solid var(--pr)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    textDecoration: 'none',
  };

  const variantStyle: CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--pr)',
          color: '#fff',
        }
      : {
          background: 'var(--sf)',
          color: 'var(--prd)',
        };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyle, ...style }}
    >
      {children}
    </button>
  );
}
