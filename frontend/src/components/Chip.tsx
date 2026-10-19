/**
 * Chip component for status badges matching wireframe design
 */

import React, { ReactNode, CSSProperties } from 'react';

export type ChipColor = 'green' | 'amber' | 'red' | 'blue' | 'gray';

interface ChipProps {
  color: ChipColor;
  children: ReactNode;
  style?: CSSProperties;
}

const colorMap: Record<ChipColor, { color: string; background: string }> = {
  green: { color: 'var(--gn)', background: 'var(--gnb)' },
  amber: { color: 'var(--am)', background: 'var(--amb)' },
  red: { color: 'var(--rd)', background: 'var(--rdb)' },
  blue: { color: 'var(--bl)', background: 'var(--blb)' },
  gray: { color: 'var(--gy)', background: 'var(--gyb)' },
};

export function Chip({ color, children, style }: ChipProps) {
  const colors = colorMap[color];
  
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '2px 9px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        border: `1px solid ${colors.color}`,
        color: colors.color,
        background: colors.background,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
