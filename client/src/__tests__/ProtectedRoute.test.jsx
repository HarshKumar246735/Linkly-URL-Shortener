import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { GuestRoute, ProtectedRoute } from '../components/ProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/login" element={<GuestRoute><p>Login page</p></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><p>Secret dashboard</p></ProtectedRoute>} />
      </Routes>
    </MemoryRouter>,
  );

describe('route guards', () => {
  it('redirects logged-out visitors to the login page', () => {
    useAuth.mockReturnValue({ user: null, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('shows a loading indicator while the session is being checked', () => {
    useAuth.mockReturnValue({ user: null, loading: true });
    renderAt('/dashboard');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders protected content for logged-in users and bounces them off /login', () => {
    useAuth.mockReturnValue({ user: { id: '1', name: 'Ada' }, loading: false });
    renderAt('/dashboard');
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
    renderAt('/login');
    expect(screen.getAllByText('Secret dashboard').length).toBeGreaterThan(0);
  });
});
