import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type PageContent = { title?: string; content?: { rendered?: string }; excerpt?: { rendered?: string }; acf?: Record<string, unknown> };
const apiBase = (import.meta.env.VITE_WORDPRESS_API_URL || 'https://gpcwaiyakiway.org/wp-json/wp/v2').replace(/\/$/, '');
const fallback: PageContent = {
  title: 'A place to belong, grow and serve',
  excerpt: { rendered: 'We are a church family seeking to make much of Jesus and live out the good works God has prepared for us.' },
};

function clean(html = '') { const el = document.createElement('div'); el.innerHTML = html; return el.textContent?.trim() || ''; }
function fieldText(value: unknown): string { return typeof value === 'string' ? clean(value) : ''; }
function App() {
  const [content, setContent] = useState<PageContent>(fallback);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    fetch(`${apiBase}/pages?slug=home&_fields=title,content,excerpt,acf`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((pages: PageContent[]) => { if (pages[0]) setContent(pages[0]); })
      .catch(() => undefined);
  }, []);
  const title = fieldText(content.title) || fallback.title!;
  const intro = fieldText(content.excerpt?.rendered || content.content?.rendered) || clean(fallback.excerpt?.rendered);
  return <>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="GracePoint Church Waiyaki Way home"><span className="brand-mark">G<span>•</span></span><span>GracePoint Church<small>Waiyaki Way</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span></span><span></span></button>
      <nav className={menuOpen ? 'navigation open' : 'navigation'} aria-label="Main navigation">
        <a onClick={() => setMenuOpen(false)} href="#plan-a-visit">Plan a visit</a>
        <a onClick={() => setMenuOpen(false)} href="#missional-communities">Missional Communities</a>
        <a onClick={() => setMenuOpen(false)} href="#about">About</a>
        <a onClick={() => setMenuOpen(false)} href="#serving">Serving</a>
        <a className="nav-cta" onClick={() => setMenuOpen(false)} href="#plan-a-visit">Join us Sunday <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
    <main id="home">
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><span></span> GracePoint Church · Waiyaki Way</p><h1>{title}</h1><p className="hero-intro">{intro}</p><div className="hero-actions"><a className="button button-dark" href="#plan-a-visit">Plan a visit <span>↗</span></a><a className="text-link" href="#missional-communities">Find your community <span>↗</span></a></div><div className="hero-note"><div className="avatar-stack" aria-hidden="true"><i>G</i><i>P</i><i>W</i></div><span>A church family, learning to follow Jesus together.</span></div></div>
        <div className="hero-art" aria-label="Warm, welcoming gathering illustration" role="img"><div className="sun"></div><div className="arch arch-back"></div><div className="arch arch-front"><div className="window"><span></span><span></span><span></span><span></span></div></div><div className="plant plant-left">✳</div><div className="plant plant-right">✳</div><div className="caption">A seat at the table<br/><small>There’s room for you.</small></div></div>
      </section>
      <section className="quick-links" aria-label="Explore GracePoint"><a href="#plan-a-visit"><span className="quick-number">01</span><span><strong>Plan your visit</strong><small>What to expect when you join us</small></span><b aria-hidden="true">↗</b></a><a href="#missional-communities"><span className="quick-number">02</span><span><strong>Find a community</strong><small>Grow in faith, life and friendship</small></span><b aria-hidden="true">↗</b></a><a href="#about"><span className="quick-number">03</span><span><strong>Get to know us</strong><small>Our heart and what we believe</small></span><b aria-hidden="true">↗</b></a></section>
      <section className="welcome section" id="about"><p className="eyebrow">Rooted in the Gospel</p><h2>Created for good works.</h2><p>We believe the good news of Jesus changes how we live, love our neighbours and serve our community. Wherever you are on your journey, you are welcome here.</p><a className="text-link" href="#serving">Discover our story <span>↗</span></a></section>
      <section className="visit section" id="plan-a-visit"><div className="visit-copy"><p className="eyebrow">Your first Sunday</p><h2>We’d love to meet you.</h2><p>Come as you are. There’s space for you here, and friendly people ready to help you feel at home.</p><div className="visit-details"><div><span className="detail-icon">◷</span><span><strong>Sunday gathering</strong><small>10:30 am – 12:30 pm</small></span></div><div><span className="detail-icon">⌖</span><span><strong>Find us</strong><small>Muthiga, along Wambaa–Wamakima Road</small></span></div></div><a className="button button-dark" href="https://maps.google.com/?q=GracePoint+Church+Waiyaki+Way" target="_blank" rel="noreferrer">Get directions <span>↗</span></a></div><div className="visit-card"><div className="card-sun"></div><div className="card-lines"></div><div className="card-label">SUNDAYS TOGETHER</div><div className="card-time">10:30<span>am</span></div><div className="card-bottom">Come find your place <span>✳</span></div></div></section>
      <section className="community section" id="missional-communities"><div className="community-art"><span className="community-flower">✳</span><span className="community-word">together</span><span className="community-caption">Faith grows in community.</span></div><div className="community-copy"><p className="eyebrow">Life beyond Sunday</p><h2>Faith is better<br/>together.</h2><p>Missional Communities are local families of believers who meet regularly for discipleship, evangelism, encouragement and prayer. Find a community to walk with you through the week.</p><a className="button button-light" href="mailto:info@gpcwaiyakiway.org?subject=Missional%20Community">Explore Missional Communities <span>↗</span></a></div></section>
      <section className="serve section" id="serving"><p className="eyebrow">Make room at the table</p><h2>There’s a place for you<br/>to make a difference.</h2><a className="text-link" href="mailto:info@gpcwaiyakiway.org?subject=Serving%20opportunity">Explore serving opportunities <span>↗</span></a></section>
    </main>
    <footer><a className="brand footer-brand" href="#home"><span className="brand-mark">G<span>•</span></span><span>GracePoint Church<small>Waiyaki Way</small></span></a><p>Growing together in the good news of Jesus.</p><a href="mailto:info@gpcwaiyakiway.org">Get in touch ↗</a><small>© GracePoint Church Waiyaki Way</small></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
