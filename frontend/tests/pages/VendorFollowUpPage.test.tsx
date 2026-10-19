/**
 * Tests for VendorFollowUpPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { VendorFollowUpPage } from '../../src/pages/VendorFollowUpPage';
import { AuthProvider } from '../../src/state/auth';

// Mock the auth context
vi.mock('../../src/state/auth', async () => {
  const actual = await vi.importActual('../../src/state/auth');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 4, username: 'h.brooks', role: 'VENDOR_RELATIONS_MANAGER' },
      signOut: vi.fn(),
      isAuthenticated: true,
    }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <AuthProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </AuthProvider>
  );
};

describe('VendorFollowUpPage', () => {
  it('renders page title', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Vendor follow-up evidence/i)).toBeInTheDocument();
  });

  it('displays case information subtitle', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getAllByText(/Case CASE-C-1042/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Coastal Dairy Co./i)).toBeInTheDocument();
  });

  it('displays status chips', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText('APPROVED DISPOSITION')).toBeInTheDocument();
    expect(screen.getByText(/FOLLOW-UP: AWAITING YOUR DISPOSITION/i)).toBeInTheDocument();
  });

  it('displays blue banner about no external communication', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(
      screen.getByText(/No external communication is sent in the pilot/i)
    ).toBeInTheDocument();
  });

  it('displays why follow-up section', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Why follow-up is proposed/i)).toBeInTheDocument();
    expect(screen.getByText(/Approved at statement cost/i)).toBeInTheDocument();
  });

  it('displays supporting evidence table', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Supporting reconciliation evidence/i)).toBeInTheDocument();
    expect(screen.getByText('Unit cost')).toBeInTheDocument();
    expect(screen.getByText('$4.35')).toBeInTheDocument();
    expect(screen.getByText('$3.90')).toBeInTheDocument();
  });

  it('displays evidence references', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getAllByText(/Evidence references/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/EV-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Vendor price notice PN-2026-0412/i)).toBeInTheDocument();
  });

  it('displays decision history', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Decision history summary/i)).toBeInTheDocument();
    expect(screen.getByText(/14:04:37Z/i)).toBeInTheDocument();
    expect(screen.getByText(/AGN2 \(system\)/i)).toBeInTheDocument();
  });

  it('displays disposition form with radio options', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Record follow-up disposition/i)).toBeInTheDocument();
    expect(screen.getByText(/Suitable for chargeback/i)).toBeInTheDocument();
    expect(screen.getByText(/Suitable for credit request/i)).toBeInTheDocument();
    expect(screen.getByText(/Not supported/i)).toBeInTheDocument();
  });

  it('displays note textarea with label', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByLabelText(/Note \(required\)/i)).toBeInTheDocument();
  });

  it('displays save disposition button', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Save disposition/i)).toBeInTheDocument();
  });

  it('displays cancel button', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('displays support document card', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/Support document record/i)).toBeInTheDocument();
    expect(screen.getByText(/Credit-request support \(pilot template\)/i)).toBeInTheDocument();
    expect(screen.getByText('NOT YET GENERATED')).toBeInTheDocument();
  });

  it('displays sent to vendor indicator', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/NO. Not sent in pilot/i)).toBeInTheDocument();
  });

  it('displays amber banner about disposition not changing settlement', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(
      screen.getByText(
        /Recording a disposition does not change the approved review decision/i
      )
    ).toBeInTheDocument();
  });

  it('displays escalation flag chip', () => {
    renderWithRouter(<VendorFollowUpPage />);
    expect(screen.getByText(/>10% over Price Book/i)).toBeInTheDocument();
  });

  it('has credit request option selected by default', () => {
    renderWithRouter(<VendorFollowUpPage />);
    const creditRequestRadio = screen.getByRole('radio', { name: /Suitable for credit request/i });
    expect(creditRequestRadio).toBeChecked();
  });
});
