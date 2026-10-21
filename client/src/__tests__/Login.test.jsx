import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }));

const renderLogin = () => render(<MemoryRouter><Login /></MemoryRouter>);

describe('Login page', () => {
  let login;
  beforeEach(() => {
    login = vi.fn();
    useAuth.mockReturnValue({ login });
  });

  it('validates required fields before calling the API', async () => {
    renderLogin();
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('shows the server error for invalid credentials', async () => {
    login.mockRejectedValue({ response: { status: 401, data: { error: { message: 'Invalid email or password.' } } } });
    renderLogin();
    await userEvent.type(screen.getByLabelText(/email address/i), 'ada@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'WrongPass1');
    await userEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  it('toggles password visibility', async () => {
    renderLogin();
    const input = screen.getByLabelText(/^password$/i);
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
  });
});
