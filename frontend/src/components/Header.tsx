/**
 * Header component for authenticated pages
 */

import React from 'react';
import { useAuth } from '../state/auth';

interface HeaderProps {
  currentPage?: string;
}

export function Header({ currentPage }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--prd)',
      color: '#fff',
      padding: '0 32px',
      height: '64px',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        fontFamily: 'var(--fh)',
        fontSize: '20px',
        fontWeight: 700,
      }}>
        <div>
          DSD Receiving Reconciliation
          <small style={{
            display: 'block',
            fontFamily: 'var(--fb)',
            fontSize: '12px',
            fontWeight: 400,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            Vendor statement matching · Pilot MVP
          </small>
        </div>
      </div>
      <div style={{
        display: 'flex',
        gap: '16px',
        alignItems: 'center',
      }}>
        {currentPage && (
          <span style={{ fontSize: '14px', color: '#ccc' }}>
            {currentPage}
          </span>
        )}
        {user && (
          <>
            <span style={{ fontSize: '14px' }}>
              {user.username} · {user.role.replace(/_/g, ' ')}
            </span>
            <button
              onClick={signOut}
              style={{
                background: 'transparent',
                border: '1px solid #fff',
                color: '#fff',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
