import { Check, Clock, Copy, ExternalLink, Pencil, Power, QrCode, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { copyText } from '../utils/clipboard';
import { displayShortUrl, formatDate, formatDateTime } from '../utils/format';

const STATUS_LABELS = { active: 'Active', inactive: 'Inactive', expired: 'Expired' };

export default function UrlCard({ url, busy = false, onQr, onEdit, onDelete, onToggle }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (await copyText(url.shortUrl)) {
      setCopied(true);
      toast.success('Short link copied');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Copy failed. Please copy the link manually.');
    }
  };

  return (
    <article className="url-card" aria-label={`Link ${url.shortCode}`}>
      <div className="url-card-main">
        <div className="url-card-top">
          <a className="url-card-short" href={url.shortUrl} target="_blank" rel="noopener noreferrer">
            {displayShortUrl(url.shortUrl)} <ExternalLink size={14} aria-hidden="true" />
          </a>
          <span className={`badge badge-${url.status}`}>{STATUS_LABELS[url.status]}</span>
        </div>
        <p className="url-card-original" title={url.originalUrl}>{url.originalUrl}</p>
        <p className="url-card-meta">
          <span>Created {formatDate(url.createdAt)}</span>
          {url.expiresAt && <span><Clock size={13} aria-hidden="true" /> {url.status === 'expired' ? 'Expired' : 'Expires'} {formatDateTime(url.expiresAt)}</span>}
        </p>
      </div>
      <div className="url-card-actions" role="group" aria-label="Link actions">
        <button type="button" className="icon-btn" onClick={handleCopy} aria-label={`Copy ${url.shortCode}`} title="Copy short URL">{copied ? <Check size={18} /> : <Copy size={18} />}</button>
        <button type="button" className="icon-btn" onClick={() => onQr(url)} aria-label={`QR code for ${url.shortCode}`} title="QR code"><QrCode size={18} /></button>
        <button type="button" className="icon-btn" onClick={() => onEdit(url)} aria-label={`Edit ${url.shortCode}`} title="Edit"><Pencil size={18} /></button>
        <button type="button" className="icon-btn" onClick={() => onToggle(url)} disabled={busy} aria-label={url.isActive ? `Deactivate ${url.shortCode}` : `Reactivate ${url.shortCode}`} title={url.isActive ? 'Deactivate' : 'Reactivate'}><Power size={18} /></button>
        <button type="button" className="icon-btn icon-btn-danger" onClick={() => onDelete(url)} aria-label={`Delete ${url.shortCode}`} title="Delete"><Trash2 size={18} /></button>
      </div>
    </article>
  );
}
