/**
 * QuantityQueuePage tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuantityQueuePage } from '../../src/pages/QuantityQueuePage';
import { AuthProvider } from '../../src/state/auth';
import * as client from '../../src/api/client';

// Mock the API client
vi.mock('../../src/api/client', () => ({
  queueAPI: {
    getQueue: vi.fn(),
  },
}));

const mockUser = {
  id: 3,
  username: 'Marcus Ortiz',
  role: 'INVENTORY_CONTROL_ANALYST',
  is_active: true,
};

const mockQueueResponse = {
  queue_type: 'quantity_review',
  total: 3,
  items: [
    {
      case_id: '2201',
      case_type: 'QUANTITY_EXCEPTION',
      case_status: 'OPEN',
      vendor_id: 'Granite State Bakery',
      store_id: 'STORE-01',
      item_id: 'Hot Dog Rolls 8ct',
      delivery_ref: 'DLV-22345',
      delivery_date: '2026-10-15',
      statement_qty: 80,
      received_qty: 64,
      statement_unit_cost: 2.10,
      expected_unit_cost: 2.10,
      quantity_variance: 16,
      quantity_variance_pct: 0.20,
      confidence_band: 'NONE',
      confidence_score: null,
      recommended_action: null,
      missing_context_count: 3,
      missing_context_list: ['Driver delivery signature', 'Store receiving note', 'Prior credit memo'],
      current_owner_role: 'INVENTORY_CONTROL_ANALYST',
      created_at: '2026-10-15T10:00:00Z',
    },
    {
      case_id: '2198',
      case_type: 'QUANTITY_EXCEPTION',
      case_status: 'OPEN',
      vendor_id: 'Atlantic Beverage Dist.',
      store_id: 'STORE-02',
      item_id: 'Sparkling Water 12pk',
      delivery_ref: 'DLV-22346',
      delivery_date: '2026-10-15',
      statement_qty: 40,
      received_qty: 36,
      statement_unit_cost: 5.95,
      expected_unit_cost: 5.95,
      quantity_variance: 4,
      quantity_variance_pct: 0.10,
      confidence_band: 'AMBER',
      confidence_score: 0.83,
      recommended_action: 'Approve short-ship credit',
      missing_context_count: 0,
      missing_context_list: [],
      current_owner_role: 'INVENTORY_CONTROL_ANALYST',
      created_at: '2026-10-15T10:05:00Z',
    },
    {
      case_id: '2204',
      case_type: 'UNMATCHED_STATEMENT',
      case_status: 'OPEN',
      vendor_id: 'Yankee Snack Brands',
      store_id: 'STORE-03',
      item_id: 'Pretzel Rods 10oz',
      delivery_ref: 'DLV-22347',
      delivery_date: '2026-10-15',
      statement_qty: 50,
      received_qty: null,
      statement_unit_cost: 3.20,
      expected_unit_cost: null,
      confidence_band: 'NONE',
      confidence_score: null,
      recommended_action: null,
      missing_context_count: 4,
      missing_context_list: ['Store receipt', 'Driver delivery signature', 'Purchase order', 'Receiving note'],
      current_owner_role: 'INVENTORY_CONTROL_ANALYST',
      created_at: '2026-10-15T10:10:00Z',
    },
  ],
};

describe('QuantityQueuePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders quantity queue page with header and title', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quantity and unmatched review queue')).toBeInTheDocument();
    });

    expect(screen.getByText(/Quantity exceptions \(more than 2 units and more than 2%\)/)).toBeInTheDocument();
  });

  it('displays queue status tabs with counts', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
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

  it('displays red alert banner for manual-review cases', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/2 cases require manual review/)).toBeInTheDocument();
    });
  });

  it('displays filter controls', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Case type')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Confidence band')).toBeInTheDocument();
    expect(screen.getByLabelText('Sort by')).toBeInTheDocument();
  });

  it('displays queue items with case type chips', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CASE-Q-2201')).toBeInTheDocument();
    });

    expect(screen.getAllByText('QUANTITY EXCEPTION').length).toBeGreaterThan(0);
    expect(screen.getByText('UNMATCHED STATEMENT')).toBeInTheDocument();
  });

  it('displays confidence chips with percentages for AMBER cases', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AMBER · 83%')).toBeInTheDocument();
    });
  });

  it('displays missing context lists for manual-review cases', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CASE-Q-2201')).toBeInTheDocument();
    });

    // Check that missing context items appear in the DOM
    expect(screen.getAllByText(/Driver delivery signature/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Store receiving note/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Prior credit memo/i)).toBeInTheDocument();
  });

  it('displays manual-review icon and message for NONE confidence band', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Manual review required: 3 context elements missing/)).toBeInTheDocument();
    });
  });

  it('displays Review buttons for each queue item', async () => {
    vi.mocked(client.queueAPI.getQueue).mockResolvedValue(mockQueueResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const reviewButtons = screen.getAllByText('Review');
      expect(reviewButtons.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('handles loading state', () => {
    vi.mocked(client.queueAPI.getQueue).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading quantity review queue...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    vi.mocked(client.queueAPI.getQueue).mockRejectedValue(new Error('Network error'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <QuantityQueuePage />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });
  });
});
