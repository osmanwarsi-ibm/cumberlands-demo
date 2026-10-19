/**
 * Card component matching wireframe design
 */

import React, { ReactNode, CSSProperties } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  style?: CSSProperties;
  borderColor?: string;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLElement>) => void;
}

export function Card({ children, title, style, borderColor, onClick, onMouseEnter, onMouseLeave }: CardProps) {
  const cardStyle: CSSProperties = {
    background: 'var(--sf)',
    border: `1px solid ${borderColor || 'var(--line)'}`,
    borderRadius: '6px',
    padding: '22px',
    ...style,
  };

  return (
    <section 
      style={cardStyle} 
      aria-labelledby={title ? 'card-title' : undefined}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {title && (
        <h2
          id="card-title"
          style={{
            fontFamily: 'var(--fh)',
            fontSize: '20px',
            margin: '0 0 12px',
          }}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
