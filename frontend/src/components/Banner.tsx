/**
 * Banner component for alerts and messages matching wireframe design
 */

import React, { ReactNode, CSSProperties } from 'react';

export type BannerColor = 'blue' | 'amber' | 'red' | 'green';

interface BannerProps {
  color: BannerColor;
  children: ReactNode;
  style?: CSSProperties;
}

const colorMap: Record<BannerColor, { background: string; color: string; borderColor: string }> = {
  blue: {
    background: 'var(--blb)',
    color: '#14355F',
    borderColor: '#9DB8DD',
  },
  amber: {
    background: 'var(--amb)',
    color: 'var(--am)',
    borderColor: '#E2C48A',
  },
  red: {
    background: 'var(--rdb)',
    color: 'var(--rd)',
    borderColor: '#E8B0AD',
  },
  green: {
    background: 'var(--gnb)',
    color: 'var(--gn)',
    borderColor: '#B3D9C2',
  },
};

export function Banner({ color, children, style }: BannerProps) {
  const colors = colorMap[color];
  
  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '4px',
        border: `1px solid ${colors.borderColor}`,
        marginBottom: '16px',
        alignItems: 'flex-start',
        background: colors.background,
        color: colors.color,
        ...style,
      }}
    >
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
          marginTop: '2px',
        }}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4M12 8h.01"/>
      </svg>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
