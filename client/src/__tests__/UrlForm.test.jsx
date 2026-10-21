import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UrlForm from '../components/UrlForm';
import { shortenUrl } from '../services/urlService';
import { copyText } from '../utils/clipboard';

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('../services/urlService', () => ({ shortenUrl: vi.fn() }));
vi.mock('../utils/clipboard', () => ({ copyText: vi.fn() }));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,AAAA') } }));

const created = {
  id: '1', originalUrl: 'https://example.com/page', shortCode: 'abc1234',
  shortUrl: 'https://linkly.test/abc1234', status: 'active', isActive: true, expiresAt: null,
};

const renderForm = () => render(<MemoryRouter><UrlForm /></MemoryRouter>);
const urlInput = () => screen.getByLabelText(/long url/i);
const submit = () => screen.getByRole('button', { name: /shorten url/i });

describe('UrlForm', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('shows a validation error and does not call the API for empty input', async () => {
    renderForm();
    await userEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(/enter a url/i);
    expect(shortenUrl).not.toHaveBeenCalled();
  });

  it('rejects javascript: URLs on the client', async () => {
    renderForm();
    await userEvent.type(urlInput(), 'javascript:alert(1)');
    await userEvent.click(submit());
    expect(await screen.findByRole('alert')).toHaveTextContent(/http/i);
    expect(shortenUrl).not.toHaveBeenCalled();
  });

  it('shortens a URL, adds https:// and shows the result with a save notice for anonymous users', async () => {
    shortenUrl.mockResolvedValue({ url: created, isAnonymous: true });
    renderForm();
    await userEvent.type(urlInput(), 'example.com/page');
    await userEvent.click(submit());

    expect(shortenUrl).toHaveBeenCalledWith({ originalUrl: 'https://example.com/page', customAlias: undefined, expiresAt: undefined });
    expect(await screen.findByText('linkly.test/abc1234')).toBeInTheDocument();
    expect(screen.getByText(/save this link now/i)).toBeInTheDocument();
  });

  it('shows a loading state and blocks repeated submissions', async () => {
    let resolve;
    shortenUrl.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderForm();
    await userEvent.type(urlInput(), 'https://example.com/page');
    await userEvent.click(submit());

    const busy = await screen.findByRole('button', { name: /shortening/i });
    expect(busy).toBeDisabled();
    await userEvent.click(busy);
    expect(shortenUrl).toHaveBeenCalledTimes(1);
    resolve({ url: created, isAnonymous: true });
    await screen.findByText('linkly.test/abc1234');
  });

  it('displays API errors such as a taken alias', async () => {
    shortenUrl.mockRejectedValue({ response: { status: 409, data: { error: { message: 'That alias is already taken. Please choose another one.' } } } });
    renderForm();
    await userEvent.type(urlInput(), 'https://example.com/page');
    await userEvent.click(submit());
    expect(await screen.findByText(/alias is already taken/i)).toBeInTheDocument();
  });

  it('copies the short URL and gives feedback', async () => {
    shortenUrl.mockResolvedValue({ url: created, isAnonymous: true });
    copyText.mockResolvedValue(true);
    renderForm();
    await userEvent.type(urlInput(), 'https://example.com/page');
    await userEvent.click(submit());
    await userEvent.click(await screen.findByRole('button', { name: /^copy$/i }));
    expect(copyText).toHaveBeenCalledWith('https://linkly.test/abc1234');
    expect(await screen.findByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('opens the QR code dialog for the new link', async () => {
    shortenUrl.mockResolvedValue({ url: created, isAnonymous: true });
    renderForm();
    await userEvent.type(urlInput(), 'https://example.com/page');
    await userEvent.click(submit());
    await userEvent.click(await screen.findByRole('button', { name: /qr code/i }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(dialog.querySelector('img')).toBeTruthy());
  });
});
