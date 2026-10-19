/**
 * Mockbar component for pilot environment warning
 */

import React from 'react';

interface MockbarProps {
  message?: string;
}

export function Mockbar({ message }: MockbarProps) {
  const defaultMessage = 'Pilot environment: fixture data only. No live BOS/PDI, Oracle AP, email or EDI connections.';
  
  return (
    <div style={{
      display: 'flex',
      gap: '10px',
      alignItems: 'center',
      background: 'var(--amb)',
      color: 'var(--am)',
      padding: '7px 32px',
      fontSize: '13px',
      borderBottom: '1px solid #E2C48A',
      fontWeight: 600,
    }}>
      <svg
        style={{
          width: '18px',
          height: '18px',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: '2',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          flexShrink: 0,
        }}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
      {message || defaultMessage}
    </div>
  );
}
