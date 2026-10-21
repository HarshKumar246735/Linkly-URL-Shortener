import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

/** Accessible modal: Escape and backdrop close it, focus moves inside, scrolling is locked, focus is restored. */
export default function Modal({ title, onClose, children, labelledBy = 'modal-title', size = 'md' }) {
  const panelRef = useRef(null);
  // Keep the latest onClose without re-running the focus/scroll-lock effect on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const enabled = [...focusable].filter((el) => !el.disabled);
      if (enabled.length === 0) return;
      const first = enabled[0];
      const last = enabled[enabled.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={panelRef} className={`modal modal-${size}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy} tabIndex={-1}>
        <div className="modal-header">
          <h2 id={labelledBy}>{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
