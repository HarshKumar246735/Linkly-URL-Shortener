import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export default function PasswordField({ id, label, value, onChange, error, autoComplete, hint }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-button">
        <input id={id} name={id} type={visible ? 'text' : 'password'} className={`input ${error ? 'has-error' : ''}`} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} />
        <button type="button" className="icon-btn input-btn" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error ? <p id={`${id}-error`} className="form-error" role="alert">{error}</p> : hint && <p className="hint">{hint}</p>}
    </div>
  );
}
