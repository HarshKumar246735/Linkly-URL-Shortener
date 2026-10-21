import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { updateUrl } from '../services/urlService';
import { localInputToIso, toLocalInputValue } from '../utils/format';
import { normalizeUrlInput, validateAlias, validateExpiry, validateUrlInput } from '../utils/validators';
import Modal from './Modal';

export default function EditUrlModal({ url, onClose, onSaved }) {
  const initialExpiry = toLocalInputValue(url.expiresAt);
  const [values, setValues] = useState({ originalUrl: url.originalUrl, shortCode: url.shortCode, expiresAt: initialExpiry });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const expiryChanged = values.expiresAt !== initialExpiry;
    const nextErrors = {
      originalUrl: validateUrlInput(values.originalUrl),
      shortCode: values.shortCode.trim() ? validateAlias(values.shortCode) : 'Alias is required.',
      expiresAt: expiryChanged ? validateExpiry(values.expiresAt) : '',
    };
    const visible = Object.fromEntries(Object.entries(nextErrors).filter(([, message]) => message));
    setErrors(visible);
    if (Object.keys(visible).length > 0) return;

    // Only send what changed.
    const patch = {};
    const normalizedUrl = normalizeUrlInput(values.originalUrl);
    if (normalizedUrl !== url.originalUrl) patch.originalUrl = normalizedUrl;
    if (values.shortCode.trim() !== url.shortCode) patch.shortCode = values.shortCode.trim();
    if (expiryChanged) patch.expiresAt = values.expiresAt ? localInputToIso(values.expiresAt) : null;
    if (Object.keys(patch).length === 0) { onClose(); return; }

    setSaving(true);
    try {
      const updated = await updateUrl(url.id, patch);
      toast.success('Link updated');
      onSaved(updated);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setErrors({ originalUrl: fieldErrors.originalUrl, shortCode: fieldErrors.shortCode || (error.response?.status === 409 ? getErrorMessage(error) : ''), expiresAt: fieldErrors.expiresAt });
      toast.error(getErrorMessage(error, 'Could not update the link.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit link" onClose={saving ? () => {} : onClose} labelledBy="edit-title">
      <form onSubmit={handleSubmit} noValidate className="modal-form">
        <div className="field">
          <label htmlFor="edit-url">Destination URL</label>
          <input id="edit-url" className={`input ${errors.originalUrl ? 'has-error' : ''}`} value={values.originalUrl} onChange={setField('originalUrl')} />
          {errors.originalUrl && <p className="form-error" role="alert">{errors.originalUrl}</p>}
        </div>
        <div className="field">
          <label htmlFor="edit-alias">Short code / alias</label>
          <input id="edit-alias" className={`input ${errors.shortCode ? 'has-error' : ''}`} value={values.shortCode} onChange={setField('shortCode')} maxLength={32} autoComplete="off" />
          {errors.shortCode ? <p className="form-error" role="alert">{errors.shortCode}</p> : values.shortCode.trim() !== url.shortCode && <p className="hint warn">Changing the alias stops the old short URL from working.</p>}
        </div>
        <div className="field">
          <label htmlFor="edit-expiry">Expires on</label>
          <div className="inline-field">
            <input id="edit-expiry" type="datetime-local" className={`input ${errors.expiresAt ? 'has-error' : ''}`} value={values.expiresAt} onChange={setField('expiresAt')} />
            {values.expiresAt && <button type="button" className="btn btn-ghost" onClick={() => setValues((c) => ({ ...c, expiresAt: '' }))}>Remove</button>}
          </div>
          {errors.expiresAt ? <p className="form-error" role="alert">{errors.expiresAt}</p> : <p className="hint">Empty means the link never expires.</p>}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}
