import { ArrowRight, Check, ChevronDown, Copy, QrCode, ExternalLink, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { shortenUrl } from '../services/urlService';
import { copyText } from '../utils/clipboard';
import { displayShortUrl, formatDateTime, localInputToIso } from '../utils/format';
import { normalizeUrlInput, validateAlias, validateExpiry, validateUrlInput } from '../utils/validators';
import QRCodeModal from './QRCodeModal';

const INITIAL = { url: '', alias: '', expiresAt: '' };

export default function UrlForm({ onCreated, variant = 'hero' }) {
  const { user } = useAuth();
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showOptions, setShowOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const inFlight = useRef(false);

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (inFlight.current) return; // blocks accidental double submits

    const nextErrors = {
      url: validateUrlInput(values.url),
      alias: validateAlias(values.alias),
      expiresAt: validateExpiry(values.expiresAt),
    };
    const visible = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message));
    setErrors(visible);
    if (visible.alias || visible.expiresAt) setShowOptions(true);
    if (Object.keys(visible).length > 0) return;

    inFlight.current = true;
    setSubmitting(true);
    try {
      const data = await shortenUrl({
        originalUrl: normalizeUrlInput(values.url),
        customAlias: values.alias.trim() || undefined,
        expiresAt: localInputToIso(values.expiresAt),
      });
      setResult(data.url);
      setCopied(false);
      setValues(INITIAL);
      toast.success('Your short link is ready!');
      onCreated?.(data.url);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      const mapped = { url: fieldErrors.originalUrl, alias: fieldErrors.customAlias, expiresAt: fieldErrors.expiresAt };
      if (error.response?.status === 409) mapped.alias = getErrorMessage(error);
      if (mapped.alias || mapped.expiresAt) setShowOptions(true);
      setErrors(Object.fromEntries(Object.entries(mapped).filter(([, message]) => message)));
      toast.error(getErrorMessage(error, 'Could not shorten that URL.'));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyText(result.shortUrl);
    if (ok) {
      setCopied(true);
      toast.success('Short link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Copy failed. Please select the link and copy it manually.');
    }
  };

  return (
    <div className={`url-form-wrap url-form-${variant}`}>
      <form className="url-form" onSubmit={handleSubmit} noValidate aria-label="Shorten a URL">
        <div className="url-form-row">
          <div className="field field-grow">
            <label htmlFor={`url-${variant}`} className="sr-only">Long URL</label>
            <input id={`url-${variant}`} type="text" inputMode="url" autoComplete="off" spellCheck="false" className={`input input-lg ${errors.url ? 'has-error' : ''}`} placeholder="Paste your long URL, e.g. https://example.com/very/long/link" value={values.url} onChange={setField('url')} aria-invalid={Boolean(errors.url)} aria-describedby={errors.url ? `url-error-${variant}` : undefined} />
          </div>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner spinner-sm spinner-light" aria-hidden="true" /> Shortening…</> : <>Shorten URL <ArrowRight size={18} /></>}
          </button>
        </div>
        {errors.url && <p id={`url-error-${variant}`} className="form-error" role="alert">{errors.url}</p>}

        <button type="button" className="link-toggle" onClick={() => setShowOptions((v) => !v)} aria-expanded={showOptions}>
          <ChevronDown size={16} className={showOptions ? 'rotate' : ''} /> Custom alias &amp; expiration (optional)
        </button>

        {showOptions && (
          <div className="url-form-options">
            <div className="field">
              <label htmlFor={`alias-${variant}`}>Custom alias</label>
              <input id={`alias-${variant}`} type="text" className={`input ${errors.alias ? 'has-error' : ''}`} placeholder="my-brand-link" value={values.alias} onChange={setField('alias')} maxLength={32} autoComplete="off" aria-invalid={Boolean(errors.alias)} />
              {errors.alias ? <p className="form-error" role="alert">{errors.alias}</p> : <p className="hint">3-32 letters, numbers, - or _</p>}
            </div>
            <div className="field">
              <label htmlFor={`expires-${variant}`}>Expires on</label>
              <input id={`expires-${variant}`} type="datetime-local" className={`input ${errors.expiresAt ? 'has-error' : ''}`} value={values.expiresAt} onChange={setField('expiresAt')} aria-invalid={Boolean(errors.expiresAt)} />
              {errors.expiresAt ? <p className="form-error" role="alert">{errors.expiresAt}</p> : <p className="hint">Leave empty for a link that never expires.</p>}
            </div>
          </div>
        )}
      </form>

      {result && (
        <section className="result-card" aria-live="polite" aria-label="Your short link">
          <div className="result-head"><Sparkles size={18} /> Your short link</div>
          <div className="result-row">
            <a className="result-link" href={result.shortUrl} target="_blank" rel="noopener noreferrer">
              {displayShortUrl(result.shortUrl)} <ExternalLink size={14} aria-hidden="true" />
            </a>
            <div className="result-actions">
              <button type="button" className="btn btn-primary" onClick={handleCopy}>{copied ? <><Check size={18} /> Copied</> : <><Copy size={18} /> Copy</>}</button>
              <button type="button" className="btn btn-outline" onClick={() => setQrOpen(true)}><QrCode size={18} /> QR code</button>
            </div>
          </div>
          <p className="result-original" title={result.originalUrl}>→ {result.originalUrl}</p>
          {result.expiresAt && <p className="hint">Expires {formatDateTime(result.expiresAt)}</p>}
          {!user && (
            <p className="notice" role="note">
              <strong>Save this link now.</strong> Anonymous links are not stored in any dashboard, so you won't be able to find, edit or delete it later.{' '}
              <Link to="/register">Create a free account</Link> to manage your links.
            </p>
          )}
        </section>
      )}

      {qrOpen && result && <QRCodeModal shortUrl={result.shortUrl} onClose={() => setQrOpen(false)} />}
    </div>
  );
}
