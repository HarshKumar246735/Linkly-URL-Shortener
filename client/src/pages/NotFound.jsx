import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="auth-card not-found">
        <p className="not-found-code">404</p>
        <h1>Page not found</h1>
        <p className="auth-sub">The page you are looking for does not exist or has moved.</p>
        <Link to="/" className="btn btn-primary btn-lg">Back to home</Link>
      </div>
    </div>
  );
}
