import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const communities = [
  { name: 'Limuru', leader: 'Eld Kevin Odhiambo' },
  { name: 'Online', meeting: 'Wednesday, 7:15–8:15 pm', leader: 'Anthony Kamau' },
  { name: 'Ginduri', meeting: 'Tuesday, 7:00–9:00 pm', leader: 'Pst. Peter Kamau' },
  { name: 'Kinoo Makutano', meeting: 'Thursday, 7:00–9:00 pm', leader: 'Duncan Kinyua' },
  { name: 'Wambaa', meeting: 'Thursday, 7:00–9:00 pm', leader: 'Fred Mjisha' },
  { name: 'Swahili', meeting: 'Sunday, 1:00–2:00 pm', leader: 'Faith Odhiambo' },
  { name: 'Sunday', meeting: 'Sunday, 1:00–2:00 pm', leader: 'Caleb Mwaniki' },
  { name: '87', meeting: 'Thursday, 7:00–9:00 pm', leader: 'Robert Ndirangu' },
  { name: 'Muhuri Road', meeting: 'Wednesday, 7:00–9:00 pm', leader: 'Pontive Wafula' },
  { name: 'Kinoo', meeting: 'Thursday, 7:00–9:00 pm', leader: 'Duncan Kinyua' },
  { name: 'Muthiga' },
  { name: 'Kihumo' },
  { name: 'Regen' },
];
type CommunityRecord = { title?: { rendered?: string } };

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
  const [communityList, setCommunityList] = useState(communities);
  useEffect(() => {
    fetch(`${apiBase}/pages?slug=home&_fields=title,content,excerpt,acf`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((pages: PageContent[]) => { if (pages[0]) setContent(pages[0]); })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    fetch('https://gpcwaiyakiway.org/wp-json/wp/v2/missional-community?per_page=100&_fields=title')
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((records: CommunityRecord[]) => {
        const names = records.map((record) => clean(record.title?.rendered || '').replace(/\s+MC$/i, '').replace(/\bRd\b/i, 'Road').replace(/^87$/i, '87 Junction')).filter(Boolean);
        if (names.length) setCommunityList(names.map((name) => ({ ...communities.find((item) => item.name.toLowerCase() === name.toLowerCase()), name })));
      })
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
        <a onClick={() => setMenuOpen(false)} href="#contact">Contact</a>
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
      <section className="visit section" id="plan-a-visit"><div className="visit-copy"><p className="eyebrow">Your first Sunday</p><h2>We’d love to meet you.</h2><p>GracePoint Church Waiyaki Way is a gathering of confessing Christians. Join us for our Sunday service; visitors are welcome.</p><div className="visit-details"><div><span className="detail-icon">◷</span><span><strong>Sunday service</strong><small>10:30 am – 12:30 pm</small></span></div><div><span className="detail-icon">⌖</span><span><strong>Find us</strong><small>Muthiga, off Waiyaki Way along Wambaa–Wamakima Road, between Zawadi School and Lofty Creek Christian School</small></span></div></div><a className="button button-dark" href="https://www.google.com/maps/search/?api=1&query=GracePoint+Church+Waiyaki+Way+Muthiga" target="_blank" rel="noreferrer">Get directions <span>↗</span></a></div><div className="visit-card"><div className="card-sun"></div><div className="card-lines"></div><div className="card-label">SUNDAYS TOGETHER</div><div className="card-time">10:30<span>am</span></div><div className="card-bottom">Sunday service <span>✳</span></div></div></section>
      <section className="community section" id="missional-communities"><div className="community-art"><span className="community-flower">✳</span><span className="community-word">together</span><span className="community-caption">Faith grows in community.</span></div><div className="community-copy"><p className="eyebrow">Life beyond Sunday</p><h2>Faith is better<br/>together.</h2><p>A Missional Community is a family of believers at GracePoint Waiyaki Way, intentionally following Christ and making followers of Christ in everyday life. These communities meet weekly, are centred on the Gospel, and encourage discipleship, evangelism, encouragement and prayer.</p><a className="button button-light" href="#community-list">Find a Missional Community <span>↓</span></a></div></section>
      <section className="community-list section" id="community-list"><div className="community-list-heading"><p className="eyebrow">Find a community near you</p><h2>Choose a place to connect.</h2><p>GracePoint lists communities in these areas and online. Meeting details and leaders are shown where published.</p></div><div className="community-grid">{communityList.map((community) => <article className="community-card" key={community.name}><p className="eyebrow">Missional Community</p><h3>{community.name}</h3>{community.meeting && <p><strong>Meets</strong>{community.meeting}</p>}{community.leader && <p><strong>Leader</strong>{community.leader}</p>}</article>)}</div><div className="community-connect"><div><h3>Not sure which community is right for you?</h3><p>Get in touch and ask the church to help you find a Missional Community.</p></div><a className="button button-dark" href="mailto:info@gpcwaiyakiway.org?subject=Help%20me%20find%20a%20Missional%20Community">Ask about connecting <span>↗</span></a></div><p className="source-note">Community information from <a href="https://gpcwaiyakiway.org/missional-communities/" target="_blank" rel="noreferrer">GracePoint Church Waiyaki Way</a>.</p></section>
      <section className="serve section" id="serving"><p className="eyebrow">Make room at the table</p><h2>There’s a place for you<br/>to make a difference.</h2><p className="serve-intro">We believe each of us is called to serve one another. Get in touch to ask how you can get involved in ministry.</p><a className="button button-dark" href="mailto:info@gpcwaiyakiway.org?subject=Serving%20opportunity">Ask about serving <span>↗</span></a></section>
      <section className="contact section" id="contact"><div><p className="eyebrow">We’re here to help</p><h2>Get in touch.</h2><p>Reach out with questions about visiting or getting involved.</p></div><div className="contact-details"><p><strong>Call us</strong><a href="tel:+254741254528">+254 741 254528</a></p><p><strong>Email us</strong><a href="mailto:info@gpcwaiyakiway.org">info@gpcwaiyakiway.org</a></p><p><strong>Postal address</strong><span>P.O. Box 1913, Kikuyu, Kenya 10200</span></p></div></section>
    </main>
    <footer><a className="brand footer-brand" href="#home"><span className="brand-mark">G<span>•</span></span><span>GracePoint Church<small>Waiyaki Way</small></span></a><p>Growing together in the good news of Jesus.</p><a href="#contact">Get in touch ↗</a><small>© GracePoint Church Waiyaki Way</small></footer>
  </>;
}

createRoot(document.getElementById('root')!).render(<App />);
