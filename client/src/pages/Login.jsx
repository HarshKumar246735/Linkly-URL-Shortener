import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/api';
import { validateLoginForm } from '../utils/validators';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setFormError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateLoginForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');
    try {
      await login({ email: values.email.trim(), password: values.password });
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, 'Could not log in. Please try again.');
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="Linkly home"><Logo size={36} /></Link>
        <h1>Welcome back</h1>
        <p className="auth-sub">Log in to manage your short links.</p>

        <form onSubmit={handleSubmit} noValidate aria-label="Log in">
          {formError && <p className="form-banner" role="alert">{formError}</p>}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" className={`input ${errors.email ? 'has-error' : ''}`} value={values.email} onChange={setField('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <p id="email-error" className="form-error" role="alert">{errors.email}</p>}
          </div>
          <PasswordField id="password" label="Password" value={values.password} onChange={setField('password')} error={errors.password} autoComplete="current-password" />
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner spinner-sm spinner-light" aria-hidden="true" /> Logging in…</> : 'Log in'}
          </button>
        </form>

        <p className="auth-switch">New to Linkly? <Link to="/register">Create an account</Link></p>
      </div>
    </div>
  );
}
