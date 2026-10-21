import { config } from '../config/env.js';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Minimal, self-contained HTML page for public visitors (expired / missing links, etc.). */
export function renderMessagePage({ title, message }) {
  const home = config.clientOrigins[0] || '/';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${escapeHtml(title)} · Linkly</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:#f5f6fb;color:#0b1020;
      font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
    main{max-width:460px;width:100%;background:#fff;border-radius:20px;padding:40px 32px;text-align:center;
      box-shadow:0 20px 50px rgba(11,16,32,.08)}
    .logo{font-weight:800;font-size:20px;color:#5b4bff;margin-bottom:24px}
    h1{font-size:24px;margin:0 0 12px}
    p{color:#55607a;line-height:1.6;margin:0 0 28px}
    a{display:inline-block;background:#5b4bff;color:#fff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:12px}
    a:focus-visible{outline:3px solid #b9b2ff;outline-offset:2px}
  </style>
</head>
<body>
  <main>
    <div class="logo">Linkly</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <a href="${escapeHtml(home)}">Go to Linkly</a>
  </main>
</body>
</html>`;
}
