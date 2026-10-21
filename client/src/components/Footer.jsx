import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Logo size={28} />
          <p>Short, memorable links with custom aliases, expiry dates and QR codes. No tracking, no clutter.</p>
        </div>
        <nav className="footer-col" aria-label="Product">
          <h2>Product</h2>
          <Link to="/#features">Features</Link>
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/dashboard">Dashboard</Link>
        </nav>
        <nav className="footer-col" aria-label="Account">
          <h2>Account</h2>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
        </nav>
      </div>
      <div className="container footer-bottom">© {new Date().getFullYear()} Linkly. Links are redirected, never tracked.</div>
    </footer>
  );
}
