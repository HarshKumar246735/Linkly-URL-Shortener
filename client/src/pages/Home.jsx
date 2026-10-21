import { ArrowDown, ArrowRight, Clock, Link2, QrCode, ShieldCheck, Sparkles, Tags, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UrlForm from '../components/UrlForm';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { icon: Zap, title: 'Instant short links', text: 'Paste a long URL and get a clean, shareable link in a second. No account required.' },
  { icon: Tags, title: 'Custom aliases', text: 'Pick a memorable alias such as /spring-sale instead of a random code.' },
  { icon: Clock, title: 'Link expiration', text: 'Set an expiry date for campaigns and temporary shares. Expired links stop redirecting automatically.' },
  { icon: QrCode, title: 'Downloadable QR codes', text: 'Generate a crisp QR code for any link and download it as a PNG for print or screens.' },
  { icon: ShieldCheck, title: 'Safe by design', text: 'Only http and https destinations, validated on the server, with rate limits against abuse.' },
  { icon: Sparkles, title: 'Simple link management', text: 'Edit, deactivate, reactivate or delete your links from one tidy dashboard.' },
];

const STEPS = [
  { title: 'Paste your link', text: 'Drop any long http or https URL into the box above.' },
  { title: 'Customize (optional)', text: 'Add a custom alias or an expiration date if you need one.' },
  { title: 'Share it', text: 'Copy the short link or download its QR code and share it anywhere.' },
];

export default function Home() {
  const { user } = useAuth();
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return; }
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <p className="eyebrow"><Link2 size={14} aria-hidden="true" /> Free URL shortener</p>
          <h1>Short links that are easy to <span className="gradient-text">share and manage</span></h1>
          <p className="hero-sub">Turn long, messy URLs into clean links with custom aliases, optional expiry dates and downloadable QR codes. Start instantly — no sign-up needed.</p>
          <UrlForm variant="hero" />

          <div className="example" aria-label="Example of a shortened URL">
            <div className="example-card">
              <span className="example-label">Before</span>
              <code>https://example.com/products/electronics/mobile-phones?ref=summer-campaign&amp;utm_source=newsletter</code>
            </div>
            <div className="example-arrow" aria-hidden="true"><ArrowDown className="arrow-down" size={22} /><ArrowRight className="arrow-right" size={22} /></div>
            <div className="example-card example-card-accent">
              <span className="example-label">After</span>
              <code>linkly.example/aB12xYz</code>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <div className="section-head">
            <h2>Everything you need, nothing you don't</h2>
            <p>Linkly focuses on doing one thing really well: creating and managing short links.</p>
          </div>
          <div className="feature-grid">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <article key={title} className="feature-card">
                <span className="feature-icon"><Icon size={22} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section section-alt">
        <div className="container">
          <div className="section-head">
            <h2>How it works</h2>
            <p>Three simple steps from long link to shareable link.</p>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step-number" aria-hidden="true">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="cta">
            <h2>{user ? 'Your links are waiting' : 'Keep all your links in one place'}</h2>
            <p>{user ? 'Jump back into your dashboard to edit, deactivate or download QR codes.' : 'Create a free account to edit, deactivate and organise every link you create.'}</p>
            <div className="cta-actions">
              {user ? (
                <Link to="/dashboard" className="btn btn-light btn-lg">Open dashboard <ArrowRight size={18} /></Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-light btn-lg">Create free account <ArrowRight size={18} /></Link>
                  <Link to="/login" className="btn btn-outline-light btn-lg">Log in</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
