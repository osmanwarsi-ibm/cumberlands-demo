/**
 * Tests for LoginPage component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../../src/pages/LoginPage';
import { AuthProvider } from '../../src/state/auth';

// Mock the useNavigate hook
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  it('renders login page with all pilot users', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Sign in to the pilot/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Priya Nair/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Dana Whitfield/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Marcus Ortiz/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Helen Brooks/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tom Reyes/i).length).toBeGreaterThan(0);
  });

  it('renders role permission table', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/What each role can do/i)).toBeInTheDocument();
    expect(screen.getAllByText(/AP Specialist/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Price Book Analyst/i).length).toBeGreaterThan(0);
  });

  it('renders workflow steps', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Pilot workflow/i)).toBeInTheDocument();
    expect(screen.getByText(/Statement intake and validation/i)).toBeInTheDocument();
    expect(screen.getByText(/Three-way match/i)).toBeInTheDocument();
  });

  it('defaults to first user selected', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const radioButtons = screen.getAllByRole('radio');
    expect(radioButtons[0]).toBeChecked();
  });

  it('allows user selection', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const radioButtons = screen.getAllByRole('radio');
    fireEvent.click(radioButtons[1]);
    expect(radioButtons[1]).toBeChecked();
  });

  it('displays segregation of duties banner', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/Segregation of duties is enforced/i)).toBeInTheDocument();
  });
});
