/**
 * Tests for CostCaseDetailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { CostCaseDetailPage } from '../../src/pages/CostCaseDetailPage';
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
    user: { id: 1, username: 'd.whitfield', role: 'PRICE_BOOK_ANALYST', is_active: true },
    signOut: vi.fn(),
  }),
}));

const mockCaseDetail = {
  case_id: 1042,
  outcome_class: 'COST_EXCEPTION',
  case_type: 'COST_EXCEPTION',
  case_status: 'OPEN',
  vendor_id: 'Coastal Dairy Co.',
  store_id: 'STR-001',
  item_id: 'Heavy Cream 1 pt (SKU 40021903)',
  delivery_ref: 'DLV-77391',
  delivery_date: '2026-10-19',
  match_basis: {
    statement_qty: 24,
    received_qty: 24,
    quantity_variance: 0,
    quantity_variance_pct: 0,
    statement_unit_cost: 4.35,
    expected_unit_cost: 3.90,
    cost_variance: 0.45,
    rule_basis: {},
  },
  triage: {
    provider_mode: 'MOCK',
    suggestion: 'Approve at statement cost, with escalation flag',
    confidence_score: 0.78,
    confidence_band: 'AMBER',
    rationale: 'Coastal Dairy Co. cream has been invoiced at $4.35 on two earlier deliveries this quarter.',
    evidence_refs: ['EV-1 Vendor price notice', 'EV-2 Invoice history', 'EV-3 Price Book record'],
    penalty_reasons: ['-12 points: Price Book record is older than 90 days.'],
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
  current_owner_role: 'PRICE_BOOK_ANALYST',
  created_at: '2026-10-19T14:04:37Z',
  updated_at: '2026-10-19T14:04:37Z',
};

describe('CostCaseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/Loading case detail/i)).toBeInTheDocument();
  });

  it('renders case header with chips', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Case CASE-C-1042 · Cost exception/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/COST EXCEPTION/i).length).toBeGreaterThan(0);
  });

  it('renders AMBER banner for human approval', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/AMBER: human approval required/i)).toBeInTheDocument();
    });
  });

  it('renders deterministic evidence table', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Deterministic match evidence/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText(/Unit cost/i)).toBeInTheDocument();
  });

  it('renders AI triage card with amber border', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/AI triage recommendation \(agent AGN4\)/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/AMBER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/78%/).length).toBeGreaterThan(0);
  });

  it('renders confidence meter visualization', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      const meter = screen.getByRole('img', { name: /Confidence 78 percent/i });
      expect(meter).toBeInTheDocument();
    });
  });

  it('renders decision form with radio options', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Record your decision/i)).toBeInTheDocument();
    });
    
    expect(screen.getAllByText(/Approve/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Override/).length).toBeGreaterThan(0);
  });

  it('renders reason code dropdown', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getAllByLabelText(/Reason code/i).length).toBeGreaterThan(0);
    });
  });

  it('renders SoD banner', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Segregation of duties/i)).toBeInTheDocument();
    });
  });

  it('renders audit excerpt with 5 events', async () => {
    vi.mocked(casesAPI.casesAPI.getCaseDetail).mockResolvedValue(mockCaseDetail);
    
    render(
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
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
      <MemoryRouter initialEntries={['/cases/1042']}>
        <Routes>
          <Route path="/cases/:caseId" element={<CostCaseDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/Error:/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to load case/i)).toBeInTheDocument();
    });
  });
});
