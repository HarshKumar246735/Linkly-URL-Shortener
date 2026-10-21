import { AlertTriangle, Link2, LogOut, RefreshCw, Search } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../components/ConfirmDialog';
import EditUrlModal from '../components/EditUrlModal';
import QRCodeModal from '../components/QRCodeModal';
import UrlCard from '../components/UrlCard';
import UrlForm from '../components/UrlForm';
import { useAuth } from '../context/AuthContext';
import { useDebounce } from '../hooks/useDebounce';
import { getErrorMessage } from '../services/api';
import { deleteUrl, listUrls, updateUrl } from '../services/urlService';

const PAGE_SIZE = 8;
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [urls, setUrls] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qrUrl, setQrUrl] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const debouncedSearch = useDebounce(search);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current; // ignore out-of-order responses
    setLoading(true);
    setError('');
    try {
      const data = await listUrls({ page, limit: PAGE_SIZE, status, search: debouncedSearch.trim() || undefined });
      if (current !== requestId.current) return;
      setUrls(data.urls);
      setPagination(data.pagination);
      if (page > data.pagination.totalPages) setPage(data.pagination.totalPages);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(getErrorMessage(err, 'Could not load your links.'));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [page, status, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const resetToFirstPage = () => setPage(1);

  const handleCreated = () => {
    if (page === 1 && status === 'all' && !debouncedSearch) load();
    else { setStatus('all'); setSearch(''); setPage(1); }
  };

  const handleToggle = async (url) => {
    setTogglingId(url.id);
    try {
      await updateUrl(url.id, { isActive: !url.isActive });
      toast.success(url.isActive ? 'Link deactivated' : 'Link reactivated');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the link.'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await deleteUrl(deleting.id);
      toast.success('Link deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the link.'));
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleLogout = async () => {
    try { await logout(); toast.success('You have been logged out.'); } catch { toast.error('Logout request failed, but you were signed out locally.'); }
    navigate('/');
  };

  const filtersActive = status !== 'all' || debouncedSearch.trim() !== '';
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="container dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {firstName} 👋</h1>
          <p className="muted">Create new short links and manage the ones you already have.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={handleLogout}><LogOut size={18} /> Log out</button>
      </header>

      <section className="panel" aria-labelledby="create-heading">
        <h2 id="create-heading" className="panel-title">Create a short link</h2>
        <UrlForm variant="dashboard" onCreated={handleCreated} />
      </section>

      <section className="panel" aria-labelledby="links-heading">
        <div className="panel-head">
          <h2 id="links-heading" className="panel-title">Your links {!loading && <span className="count">{pagination.total}</span>}</h2>
          <div className="toolbar">
            <div className="search">
              <Search size={18} aria-hidden="true" />
              <label htmlFor="link-search" className="sr-only">Search links</label>
              <input id="link-search" type="search" className="input" placeholder="Search links…" value={search} onChange={(e) => { setSearch(e.target.value); resetToFirstPage(); }} />
            </div>
            <div className="segmented" role="group" aria-label="Filter by status">
              {FILTERS.map((filter) => (
                <button key={filter.value} type="button" className={status === filter.value ? 'is-active' : ''} aria-pressed={status === filter.value} onClick={() => { setStatus(filter.value); resetToFirstPage(); }}>{filter.label}</button>
              ))}
            </div>
          </div>
        </div>

        {loading && (
          <div className="skeleton-list" aria-busy="true" aria-label="Loading your links">
            {[0, 1, 2].map((i) => <div key={i} className="skeleton skeleton-card" />)}
          </div>
        )}

        {!loading && error && (
          <div className="state state-error" role="alert">
            <AlertTriangle size={28} aria-hidden="true" />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={load}><RefreshCw size={18} /> Try again</button>
          </div>
        )}

        {!loading && !error && urls.length === 0 && (
          <div className="state">
            <Link2 size={28} aria-hidden="true" />
            <h3>{filtersActive ? 'No links match your filters' : 'No links yet'}</h3>
            <p>{filtersActive ? 'Try a different search term or status filter.' : 'Paste a long URL above to create your first short link.'}</p>
            {filtersActive && <button type="button" className="btn btn-outline" onClick={() => { setSearch(''); setStatus('all'); setPage(1); }}>Clear filters</button>}
          </div>
        )}

        {!loading && !error && urls.length > 0 && (
          <>
            <div className="url-list">
              {urls.map((url) => (
                <UrlCard key={url.id} url={url} busy={togglingId === url.id} onQr={setQrUrl} onEdit={setEditing} onDelete={setDeleting} onToggle={handleToggle} />
              ))}
            </div>
            {pagination.totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                <span aria-live="polite">Page {pagination.page} of {pagination.totalPages}</span>
                <button type="button" className="btn btn-outline" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </nav>
            )}
          </>
        )}
      </section>

      {qrUrl && <QRCodeModal shortUrl={qrUrl.shortUrl} onClose={() => setQrUrl(null)} />}
      {editing && <EditUrlModal url={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
      {deleting && (
        <ConfirmDialog title="Delete this link?" message={`“${deleting.shortCode}” will stop working immediately and cannot be recovered. Anyone using the short link or its QR code will see a "not found" page.`} busy={deleteBusy} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />
      )}
    </div>
  );
}
