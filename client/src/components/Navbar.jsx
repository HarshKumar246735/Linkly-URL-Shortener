import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    try {
      await logout();
      toast.success('You have been logged out.');
    } catch {
      toast.error('Could not reach the server, but you were logged out locally.');
    }
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand" onClick={close} aria-label="Linkly home"><Logo /></Link>

        <button type="button" className="icon-btn navbar-toggle" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="primary-nav" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav id="primary-nav" className={`navbar-links ${open ? 'is-open' : ''}`} aria-label="Primary">
          <Link to="/#features" onClick={close}>Features</Link>
          <Link to="/#how-it-works" onClick={close}>How it works</Link>
          <div className="navbar-actions">
            {loading ? null : user ? (
              <>
                <NavLink to="/dashboard" className="btn btn-ghost" onClick={close}><LayoutDashboard size={18} /> Dashboard</NavLink>
                <button type="button" className="btn btn-outline" onClick={handleLogout}><LogOut size={18} /> Log out</button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="btn btn-ghost" onClick={close}>Log in</NavLink>
                <NavLink to="/register" className="btn btn-primary" onClick={close}>Get started</NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
