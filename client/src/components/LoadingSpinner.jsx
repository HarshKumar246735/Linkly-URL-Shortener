export default function LoadingSpinner({ label = 'Loading', size = 'md', fullPage = false }) {
  const spinner = <span className={`spinner spinner-${size}`} role="status" aria-label={label} />;
  return fullPage ? <div className="spinner-page">{spinner}</div> : spinner;
}
