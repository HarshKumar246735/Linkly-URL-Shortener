import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../services/api';
import { validateRegisterForm } from '../utils/validators';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
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
    const nextErrors = validateRegisterForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');
    try {
      await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      toast.success('Account created. Welcome to Linkly!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = getErrorMessage(error, 'Could not create your account.');
      const fieldErrors = getFieldErrors(error);
      if (error.response?.status === 409) setErrors({ email: message });
      else if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      else setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo" aria-label="Linkly home"><Logo size={36} /></Link>
        <h1>Create your account</h1>
        <p className="auth-sub">Save, edit and manage all your short links.</p>

        <form onSubmit={handleSubmit} noValidate aria-label="Create account">
          {formError && <p className="form-banner" role="alert">{formError}</p>}
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" type="text" autoComplete="name" className={`input ${errors.name ? 'has-error' : ''}`} value={values.name} onChange={setField('name')} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} />
            {errors.name && <p id="name-error" className="form-error" role="alert">{errors.name}</p>}
          </div>
          <div className="field">
            <label htmlFor="email">Email address</label>
            <input id="email" name="email" type="email" autoComplete="email" className={`input ${errors.email ? 'has-error' : ''}`} value={values.email} onChange={setField('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} />
            {errors.email && <p id="email-error" className="form-error" role="alert">{errors.email}</p>}
          </div>
          <PasswordField id="password" label="Password" value={values.password} onChange={setField('password')} error={errors.password} autoComplete="new-password" hint="At least 8 characters with a letter and a number." />
          <PasswordField id="confirmPassword" label="Confirm password" value={values.confirmPassword} onChange={setField('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" />
          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
            {submitting ? <><span className="spinner spinner-sm spinner-light" aria-hidden="true" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
      </div>
    </div>
  );
}
