/**
 * Tests for StatementIntakePage component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StatementIntakePage } from '../../src/pages/StatementIntakePage';
import { AuthProvider } from '../../src/state/auth';

// Mock API client
vi.mock('../../src/api/client', () => ({
  intakeAPI: {
    ingestBatch: vi.fn().mockResolvedValue({
      batch_id: 123,
      status: 'COMPLETED',
      total_lines: 62,
      accepted_lines: 59,
      rejected_lines: 3,
      quarantine_reasons: [],
    }),
  },
  reconciliationAPI: {
    runMatch: vi.fn().mockResolvedValue({
      batch_id: 123,
      status: 'MATCHED',
    }),
  },
}));

describe('StatementIntakePage', () => {
  it('renders statement intake page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StatementIntakePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Statement intake/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/1\. Choose statement source/i)).toBeInTheDocument();
  });

  it('renders fixture dropdown with options', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StatementIntakePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const select = screen.getByLabelText(/Approved fixture statement/i);
    expect(select).toBeInTheDocument();
  });

  it('renders workflow stages', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StatementIntakePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/1\. Intake and validate/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Three-way match/i)).toBeInTheDocument();
  });

  it('displays navigation tabs', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <StatementIntakePage />
        </AuthProvider>
      </BrowserRouter>
    );

    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(nav).toBeInTheDocument();
  });
});
