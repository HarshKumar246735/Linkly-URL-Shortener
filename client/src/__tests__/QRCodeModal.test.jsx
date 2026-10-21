import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QRCode from 'qrcode';
import { describe, expect, it, vi } from 'vitest';
import QRCodeModal from '../components/QRCodeModal';

vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn() } }));

describe('QRCodeModal', () => {
  it('renders a QR code image and a PNG download link with a useful filename', async () => {
    QRCode.toDataURL.mockResolvedValue('data:image/png;base64,AAAA');
    render(<QRCodeModal shortUrl="https://linkly.test/abc1234" onClose={() => {}} />);

    expect(await screen.findByAltText(/qr code for https:\/\/linkly\.test\/abc1234/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /download png/i });
    expect(link).toHaveAttribute('download', 'linkly-qr-abc1234.png');
    expect(link.getAttribute('href')).toMatch(/^data:image\/png/);
    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://linkly.test/abc1234', expect.objectContaining({ width: 512 }));
  });

  it('shows an error if generation fails and closes with Escape', async () => {
    QRCode.toDataURL.mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(<QRCodeModal shortUrl="https://linkly.test/x1" onClose={onClose} />);
    expect(await screen.findByText(/could not generate/i)).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});
