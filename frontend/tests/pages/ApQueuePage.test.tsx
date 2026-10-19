/**
 * Tests for ApQueuePage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ApQueuePage } from '../../src/pages/ApQueuePage';
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
  queueAPI: {
    getQueue: vi.fn().mockResolvedValue({ items: [] }),
  },
  settlementAPI: {
    prepareSettlement: vi.fn().mockResolvedValue({}),
  },
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthProvider>
  );
};

describe('ApQueuePage', () => {
  it('renders page title and subtitle', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/AP queue and settlement preparation/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Prepare settlement for full matches and human-approved exceptions/i
      )
    ).toBeInTheDocument();
  });

  it('displays four KPI cards with correct labels', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getAllByText('ELIGIBLE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('QUEUED').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HELD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FAILED').length).toBeGreaterThan(0);
  });

  it('displays KPI counts', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText('44')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays SoD violation banner when present', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Blocked: segregation of duties/i)).toBeInTheDocument();
    expect(screen.getByText(/Dana Whitfield approved CASE-C-1042/i)).toBeInTheDocument();
  });

  it('displays AP queue failure banner when present', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/AP queue write failed for CASE-C-1031/i)).toBeInTheDocument();
  });

  it('displays eligible settlement table', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Eligible for settlement preparation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/CASE-C-1042/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Heavy Cream 1 pt, Coastal Dairy/i)).toBeInTheDocument();
  });

  it('displays unresolved review items table', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Unresolved review items \(not posted\)/i)).toBeInTheDocument();
    expect(screen.getByText(/CASE-Q-2201/i)).toBeInTheDocument();
  });

  it('displays queue entries table', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Queue entries for this batch/i)).toBeInTheDocument();
    expect(screen.getByText(/APQ-000118/i)).toBeInTheDocument();
    expect(screen.getByText(/SR-000412/i)).toBeInTheDocument();
  });

  it('displays prepare settlement buttons', () => {
    renderWithRouter(<ApQueuePage />);
    const buttons = screen.getAllByRole('button', { name: /Prepare settlement/i });
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('displays retry button for failed entry', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Retry failed entry APQ-000122/i)).toBeInTheDocument();
  });

  it('displays open audit trace button', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/Open audit trace/i)).toBeInTheDocument();
  });

  it('displays SoD-blocked hint for blocked case', () => {
    renderWithRouter(<ApQueuePage />);
    expect(screen.getByText(/You are not the approver/i)).toBeInTheDocument();
  });

  it('displays info banner about settlement record', () => {
    renderWithRouter(<ApQueuePage />);
    expect(
      screen.getByText(
        /Every settlement record keeps the source case, the resolution basis, the approver identity/i
      )
    ).toBeInTheDocument();
  });
});
