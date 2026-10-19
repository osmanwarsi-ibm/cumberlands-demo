/**
 * Tests for BatchResultsPage component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { BatchResultsPage } from '../../src/pages/BatchResultsPage';
import { AuthProvider } from '../../src/state/auth';

describe('BatchResultsPage', () => {
  it('renders batch results page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Three-way match results/i)).toBeInTheDocument();
  });

  it('displays outcome KPI cards with colored borders', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('41')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getAllByText(/FULL MATCH/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/COST EXCEPTION/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/QUANTITY EXCEPTION/i).length).toBeGreaterThan(0);
  });

  it('displays filter controls', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Outcome class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vendor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Routing/i)).toBeInTheDocument();
  });

  it('displays results table with basis of determination', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Basis of determination/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/L-001/i)).toBeInTheDocument();
  });

  it('displays action buttons to queues', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Open cost review queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Open quantity review queue/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to AP queue/i)).toBeInTheDocument();
  });

  it('displays workflow stages', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<BatchResultsPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/1\. Intake and validate/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Three-way match/i)).toBeInTheDocument();
  });
});
