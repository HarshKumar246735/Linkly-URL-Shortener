export default function Logo({ size = 32 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
        <rect width="64" height="64" rx="16" fill="currentColor" />
        <path d="M26 38l12-12M23 30l-4 4a8 8 0 0 0 11 11l4-4M41 34l4-4A8 8 0 0 0 34 19l-4 4" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="logo-text">Linkly</span>
    </span>
  );
}
