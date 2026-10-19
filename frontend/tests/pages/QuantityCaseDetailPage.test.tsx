/**
 * Tests for QuantityCaseDetailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QuantityCaseDetailPage } from '../../src/pages/QuantityCaseDetailPage';
import * as casesAPI from '../../src/api/client';

// Mock the API client
vi.mock('../../src/api/client', () => ({
  casesAPI: {
    getCaseDetail: vi.fn(),
    submitReviewDecision: vi.fn(),
  },
}));

// Mock auth context
vi.mock('../../src/state/auth', () => ({
  useAuth: () => ({
    user: { id: 3, username: 'm.ortiz', role: 'INVENTORY_CONTROL_ANALYST', is_active: true },
    signOut: vi.fn(),
  }),
}));

const mockCaseDetail = {
  case_id: 2201,
  outcome_class: 'QUANTITY_EXCEPTION',
  case_type: 'QUANTITY_EXCEPTION',
  case_status: 'OPEN',
  vendor_id: 'Granite State Bakery',
  store_id: 'STR-002',
  item_id: 'Hot Dog Rolls 8ct (SKU 40033120)',
  delivery_ref: 'DLV-77405',
  delivery_date: '2026-10-19',
  match_basis: {
    statement_qty: 80,
    received_qty: 64,
    quantity_variance: 16,
    quantity_variance_pct: 20.0,
    statement_unit_cost: 2.10,
    expected_unit_cost: 2.10,
    cost_variance: 0,
    rule_basis: {},
  },
  triage: {
    provider_mode: 'MOCK',
    suggestion: 'None. Routed to manual review',
    confidence_score: undefined,
    confidence_band: 'NONE',
    rationale: 'Insufficient context for recommendation',
    evidence_refs: [],
    penalty_reasons: [
      '-15 points: delivery signature missing',
      '-15 points: store receiving note missing',
      '-10 points: prior credit history unavailable',
    ],
  },
  review_state: {
    decision_type: undefined,
    reviewer_user_id: undefined,
    reviewer_username: undefined,
    reason_code: undefined,
    rationale_note: undefined,
    decided_at: undefined,
  },
  settlement_eligibility: {
    eligible: false,
    prepared_by_user_id: undefined,
    prepared_by_username: undefined,
    eligibility_status: undefined,
    prepared_at: undefined,
  },
  current_owner_role: 'INVENTORY_CONTROL_ANALYST',
  created_at: '2026-10-19T14:04:37Z',
  updated_at: '2026-10-19T14:04:37Z',
};

describe('QuantityCaseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Loading case detail/i)).toBeInTheDocument();
  });

  it('renders case header with manual review chips', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Case CASE-Q-2201 · Quantity exception/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/QUANTITY EXCEPTION/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MANUAL REVIEW REQUIRED/i).length).toBeGreaterThan(0);
  });

  it('renders red alert banner for manual review', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/No automated recommendation. Manual review required/i)).toBeInTheDocument();
    });
  });

  it('renders deterministic evidence table with quantity focus', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Deterministic match evidence/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/Quantity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/16 units/).length).toBeGreaterThan(0);
  });

  it('renders AI triage card with red border', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/AI triage result \(agent AGN4\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/None. Routed to manual review/i)).toBeInTheDocument();
    expect(screen.getByText(/NONE/)).toBeInTheDocument();
    expect(screen.getByText(/MANUAL ROUTING/i)).toBeInTheDocument();
  });

  it('renders missing context elements list', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Missing context elements \(3\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/Driver delivery signature/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Store receiving note/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Prior credit memo/i)).toBeInTheDocument();
  });

  it('does not render confidence meter for NONE band', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/AI triage result/i)).toBeInTheDocument();
    });
    
    // Should not have confidence meter for NONE band
    const meters = screen.queryAllByRole('img', { name: /Confidence.*percent/i });
    expect(meters).toHaveLength(0);
  });

  it('renders decision form with quantity-specific options', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Record your decision/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Approve/)).toBeInTheDocument();
    expect(screen.getByText(/Override/)).toBeInTheDocument();
  });

  it('renders settlement status section', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Settlement status/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/NOT ELIGIBLE/i).length).toBeGreaterThan(0);
  });

  it('renders audit excerpt', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Audit excerpt \(latest 5 events\)/i)).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockRejectedValue(new Error('Failed to load case'));
    
    render(
      <MemoryRouter initialEntries={['/cases/2201']}>
        <Routes>
          <Route path="/cases/:caseId" element={<QuantityCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load case/i)).toBeInTheDocument();
    });
  });
});
