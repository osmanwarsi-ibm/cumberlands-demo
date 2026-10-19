/**
 * CostQueuePage tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CostQueuePage } from '../../src/pages/CostQueuePage';
import { AuthProvider } from '../../src/state/auth';
import * as queueAPI from '../../src/api/client';

// Mock the API client
vi.mock('../../src/api/client', () => ({
  queueAPI: {
    getQueue: vi.fn(),
  },
}));

const mockUser = {
  id: 2,
  username: 'Dana Whitfield',
  role: 'PRICE_BOOK_ANALYST',
  is_active: true,
};

const mockQueueResponse = {
  queue_type: 'cost_review',
  total: 2,
  items: [
    {
      case_id: 1042,
      case_type: 'COST_EXCEPTION',
      case_status: 'OPEN',
      vendor_id: 'Coastal Dairy Co.',
      store_id: 'STORE-01',
      item_id: 'Heavy Cream 1 pt',
      delivery_ref: 'DLV-12345',
      delivery_date: '2026-10-15',
      statement_qty: 24,
      received_qty: 24,
      statement_unit_cost: 4.35,
      expected_unit_cost: 3.90,
      cost_variance: 0.45,
      confidence_band: 'AMBER',
      confidence_score: 0.78,
      recommended_action: 'Approve with escalation flag',
      missing_context_count: 0,
      missing_context_list: [],
      current_owner_role: 'PRICE_BOOK_ANALYST',
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      case_id: 1038,
      case_type: 'COST_EXCEPTION',
      case_status: 'OPEN',
      vendor_id: 'Atlantic Beverage Dist.',
      store_id: 'STORE-02',
      item_id: 'Cola 20oz 24pk',
      delivery_ref: 'DLV-12346',
      delivery_date: '2026-10-15',
      statement_qty: 30,
      received_qty: 30,
      statement_unit_cost: 17.85,
      expected_unit_cost: 17.60,
      cost_variance: 0.25,
      confidence_band: 'AMBER',
      confidence_score: 0.84,
      recommended_action: 'Approve (documented price change)',
      missing_context_count: 0,
      missing_context_list: [],
      current_owner_role: 'PRICE_BOOK_ANALYST',
      created_at: '2026-10-15T10:05:00Z',
    },
  ],
};

describe('CostQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders cost queue page with header and title', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Cost review queue').length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Cost exceptions where the statement unit cost differs/)).toBeInTheDocument();
  });

  it('displays queue status tabs with counts', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Open').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('In review')).toBeInTheDocument();
    expect(screen.getByText('Escalated')).toBeInTheDocument();
    expect(screen.getByText('Decided')).toBeInTheDocument();
  });

  it('displays filter controls', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Confidence band')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Vendor')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('displays queue items with confidence chips', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CASE-C-1042')).toBeInTheDocument();
    });

    expect(screen.getByText('AMBER · 78%')).toBeInTheDocument();
    expect(screen.getByText('AMBER · 84%')).toBeInTheDocument();
    expect(screen.getByText('Approve with escalation flag')).toBeInTheDocument();
  });

  it('displays Review buttons for each queue item', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const reviewButtons = screen.getAllByText('Review');
      expect(reviewButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('displays info banner about AMBER approval requirement', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AMBER means a human must approve/)).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading cost review queue...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(queueAPI.queueAPI.getQueue).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <CostQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
