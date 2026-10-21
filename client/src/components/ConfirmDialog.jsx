import Modal from './Modal';

export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', busy = false, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onCancel} labelledBy="confirm-title" size="sm">
      <p className="modal-text">{message}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="button" className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
      </div>
    </Modal>
  );
}
