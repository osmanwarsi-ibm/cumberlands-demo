/**
 * Tests for AuditTracePage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuditTracePage } from '../../src/pages/AuditTracePage';
import { AuthProvider } from '../../src/state/auth';

// Mock the auth context
vi.mock('../../src/state/auth', async () => {
  const actual = await vi.importActual('../../src/state/auth');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 1, username: 'p.nair', role: 'AP_SPECIALIST' },
      signOut: vi.fn(),
      isAuthenticated: true,
    }),
  };
});

// Mock API client
vi.mock('../../src/api/client', () => ({
  auditAPI: {
    getAuditTrace: vi.fn().mockResolvedValue({ events: [] }),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthProvider>
  );
};

describe('AuditTracePage', () => {
  it('renders page title with case ID', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/Audit trace · Case CASE-C-1042/i)).toBeInTheDocument();
  });

  it('displays page subtitle', () => {
    renderWithRouter(<AuditTracePage />);
    expect(
      screen.getByText(
        /Chronological, actor-attributed history from ingestion through posting preparation/i
      )
    ).toBeInTheDocument();
  });

  it('displays case timeline section', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/Case timeline/i)).toBeInTheDocument();
  });

  it('displays event type filter dropdown', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByLabelText(/Event type/i)).toBeInTheDocument();
  });

  it('displays timeline table headers', () => {
    renderWithRouter(<AuditTracePage />);
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts).toContain('Time');
    expect(headerTexts).toContain('Actor');
    expect(headerTexts).toContain('Event');
    expect(headerTexts).toContain('Details');
  });

  it('displays audit events with timestamps', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/14:02:11/)).toBeInTheDocument();
    expect(screen.getByText(/14:04:37/)).toBeInTheDocument();
  });

  it('displays actor information', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getAllByText(/AP-SYSTEM/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dana Whitfield/).length).toBeGreaterThan(0);
  });

  it('displays event type chips', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText('INGESTION')).toBeInTheDocument();
    expect(screen.getByText('MATCH')).toBeInTheDocument();
    expect(screen.getByText('AI TRIAGE')).toBeInTheDocument();
  });

  it('displays SoD violation event', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/BLOCKED · SoD/i)).toBeInTheDocument();
  });

  it('displays case summary card', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/Case summary/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CASE-C-1042/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/COST EXCEPTION/i).length).toBeGreaterThan(0);
  });

  it('displays distinct actors section', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/Distinct actors \(segregation of duties\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Reviewer \/ approver:/i)).toBeInTheDocument();
    expect(screen.getByText(/Posting preparer:/i)).toBeInTheDocument();
  });

  it('displays AI inference record', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/AI inference record/i)).toBeInTheDocument();
    expect(screen.getByText(/AGN4 exception triage/i)).toBeInTheDocument();
  });

  it('displays return to case button', () => {
    renderWithRouter(<AuditTracePage />);
    expect(screen.getByText(/Return to case/i)).toBeInTheDocument();
  });

  it('displays SoD banner with lock icon', () => {
    renderWithRouter(<AuditTracePage />);
    expect(
      screen.getByText(/Approver and preparer are different people/i)
    ).toBeInTheDocument();
  });
});
