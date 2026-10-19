/**
 * Breadcrumb component for navigation context
 */

import React from 'react';
import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" style={{
      fontSize: '13px',
      color: 'var(--ink2)',
      marginBottom: '12px',
    }}>
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span style={{ margin: '0 8px' }}>›</span>}
          {item.path ? (
            <Link
              to={item.path}
              style={{
                color: 'var(--pr)',
                textDecoration: 'none',
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
