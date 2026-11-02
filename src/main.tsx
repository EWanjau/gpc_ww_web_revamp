import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

type WordPressPublication = { id: number; date?: string; slug: string; title?: { rendered?: string }; content?: { rendered?: string }; author?: number; _embedded?: { author?: Array<{ name?: string }> } };
type Article = WordPressPublication & { excerpt?: { rendered?: string } };
type Newsletter = WordPressPublication;
type CommunityRecord = { title?: { rendered?: string }; content?: { rendered?: string }; acf?: Record<string, unknown> };
type Community = { name: string; meeting?: string; leader?: string };

type PageContent = { title?: { rendered?: string }; content?: { rendered?: string }; excerpt?: { rendered?: string }; acf?: Record<string, unknown> };
type Sermon = { title: string; href: string; thumbnail: string };
const apiBase = (import.meta.env.VITE_WORDPRESS_API_URL || 'https://gpcwaiyakiway.org/wp-json/wp/v2').replace(/\/$/, '');
const fallback: PageContent = {
  title: { rendered: 'A place to belong, grow and serve' },
  excerpt: { rendered: 'We are a church family seeking to make much of Jesus and live out the good works God has prepared for us.' },
  acf: {
    homeHtml: '<h3>Our Services</h3><p>We meet every Sunday: 10:30 am - 12:30 pm</p><h3>Visit Us</h3><p>We are located along Wambaa Road, near Lofty Creek Christian School.</p><h3>Call Us</h3><p>P.O BOX 1913, 10200 Kikuyu Kenya +254741254528 info@gpcwaiyakiway.org</p>',
    contactHtml: '<h2>Locate Us</h2><p>At Muthiga, off Waiyakiway, between Zawadi School and Lofty Creek Christian School</p><p>+254 741 254528</p><p>info@gpcwaiyakiway.org</p>',
    communitiesHtml: '',
  },
};

function clean(html = '') { const el = document.createElement('div'); el.innerHTML = html; return el.textContent?.trim() || ''; }
function fieldText(value: unknown): string { return typeof value === 'string' ? clean(value) : ''; }
function pageHtml(page?: PageContent) { return page?.content?.rendered || ''; }
function pagePlainText(page?: PageContent) { return clean(pageHtml(page)); }
function afterHeading(html: string, matcher: RegExp): string[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  const blocks = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,p'));
  const start = blocks.findIndex((block) => matcher.test(block.textContent || ''));
  if (start < 0) return [];
  const result: string[] = [];
  for (const block of blocks.slice(start + 1)) {
    if (/^H[1-4]$/.test(block.tagName)) break;
    if (block.tagName === 'P') {
      const text = block.textContent?.trim();
      if (text) result.push(text);
    }
  }
  return result;
}
function headingText(html: string, matcher: RegExp) {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.body.querySelectorAll('h1,h2,h3,h4')).find((heading) => matcher.test(heading.textContent || ''))?.textContent?.trim() || '';
}
function firstMatch(text: string, pattern: RegExp) { return text.match(pattern)?.[0]?.trim() || ''; }
function displayPhone(value: string) { return /^\+254\d{9}$/.test(value) ? `+254 ${value.slice(4, 7)} ${value.slice(7)}` : value; }
function publishedEmail(...html: string[]) {
  for (const source of html) {
    const document = new DOMParser().parseFromString(source, 'text/html');
    for (const anchor of Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]'))) {
      const address = (anchor.getAttribute('href') || '').slice(7).split(/[?;]/, 1)[0];
      if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(address)) return address;
    }
    const text = Array.from(document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), (node) => node.textContent || '').join(' ');
    const email = firstMatch(text, /[A-Za-z][\w.+-]*@[\w.-]+\.[A-Za-z]{2,}/);
    if (email) return email;
  }
  return '';
}
function publishedLocation(...html: string[]) {
  for (const source of html) {
    const document = new DOMParser().parseFromString(source, 'text/html');
    const match = Array.from(document.body.querySelectorAll('h1,h2,h3,h4,p')).find((node) => /^\s*(?:At|We are located)\b/i.test(node.textContent || ''));
    if (match) return (match.textContent || '').replace(/\s*\+?\d[\d ()-]{7,}\d.*$/, '').trim();
  }
  return '';
}
function communityValue(record: CommunityRecord, keys: string[]) {
  const values = record.acf || {};
  for (const key of keys) {
    const value = values[key];
    const text = typeof value === 'string' ? clean(value) : '';
    if (text) return text;
  }
  return '';
}
function parseCommunity(record: CommunityRecord): Community | null {
  const name = clean(record.title?.rendered || '').replace(/\s+MC$/i, '').trim();
  if (!name) return null;
  return {
    name: name.replace(/\bRd\b/i, 'Road').replace(/^87$/i, '87 Junction'),
    meeting: communityValue(record, ['meeting_day', 'meeting_time', 'meeting', 'schedule', 'meeting_schedule']),
    leader: communityValue(record, ['leader', 'leader_name', 'community_leader']),
  };
}
function parseCommunityPage(html: string): Community[] {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(document.querySelectorAll<HTMLElement>('[data-elementor-type="loop-item"]')).flatMap((item) => {
    const name = clean(item.querySelector('h1,h2,h3')?.textContent || '').replace(/\s+MC$/i, '').trim();
    if (!name) return [];
    const fields: Record<string, string> = {};
    for (const widget of Array.from(item.querySelectorAll<HTMLElement>('.elementor-widget-dyncontel-acf'))) {
      let key = '';
      try { key = JSON.parse(widget.getAttribute('data-settings') || '{}').acf_field_list || ''; } catch { /* Ignore malformed CMS widget settings. */ }
      const value = clean(widget.querySelector('.dynamic-content-for-elementor-acf')?.textContent || '');
      if (key && value) fields[key] = value;
    }
    return [{ name: name.replace(/\bRd\b/i, 'Road').replace(/^87$/i, '87 Junction'), meeting: fields.meeting_day || '', leader: fields.leader || '' }];
  });
}
const articleElements = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'STRONG', 'EM', 'B', 'I', 'BR', 'A', 'CODE', 'PRE', 'HR']);
function safeArticleHtml(html = '') {
  const source = new DOMParser().parseFromString(html, 'text/html');
  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (!(node instanceof HTMLElement)) return '';
    const children = Array.from(node.childNodes).map(cleanNode).join('');
    if (!articleElements.has(node.tagName)) return children;
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#|\/)/i.test(href) && !href.startsWith('//')) return `<a href="${href.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"${/^https?:/i.test(href) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${children}</a>`;
      return children;
    }
    return `<${node.tagName.toLowerCase()}>${children}</${node.tagName.toLowerCase()}>`;
  };
  return Array.from(source.body.childNodes).map(cleanNode).join('');
}
function articleTitle(article: Article) { return clean(article.title?.rendered || 'Untitled article'); }
function articleDate(article: Article) { if (!article.date) return ''; const date = new Date(article.date); return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long', day: 'numeric' }).format(date); }
function sourcePdf(newsletter: Newsletter) {
  const parsed = new DOMParser().parseFromString(newsletter.content?.rendered || '', 'text/html');
  for (const anchor of Array.from(parsed.querySelectorAll('a[href]'))) {
    const href = anchor.getAttribute('href') || '';
    try { const url = new URL(href, 'https://gpcwaiyakiway.org'); if (/\.pdf$/i.test(url.pathname) && /^https?:$/.test(url.protocol)) return url.href; } catch { /* Ignore malformed published links. */ }
  }
  return '';
}
function parseSermons(html = ''): Sermon[] {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const sermons: Sermon[] = [];
  for (const item of Array.from(parsed.querySelectorAll<HTMLElement>('[data-video-title]'))) {
    const title = (item.getAttribute('data-video-title') || '').trim();
    const anchor = item.querySelector<HTMLAnchorElement>('a[href]');
    const image = anchor?.querySelector<HTMLImageElement>('img[src]');
    if (!title || !anchor || !image) continue;
    try {
      const video = new URL(anchor.getAttribute('href') || '');
      const id = video.searchParams.get('v') || '';
      const thumbnail = new URL(image.getAttribute('src') || '');
      if (video.protocol !== 'https:' || video.hostname !== 'www.youtube.com' || video.pathname !== '/watch' || !/^[\w-]{11}$/.test(id)) continue;
      if (thumbnail.protocol !== 'https:' || !/^i\d*\.ytimg\.com$/.test(thumbnail.hostname) || !thumbnail.pathname.startsWith(`/vi/${id}/`)) continue;
      sermons.push({ title, href: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, thumbnail: thumbnail.href });
    } catch { /* Ignore malformed cached gallery entries. */ }
  }
  return sermons;
}
function App() {
  const [content, setContent] = useState<PageContent>(fallback);
  const [menuOpen, setMenuOpen] = useState(false);
  const [communityRecords, setCommunityRecords] = useState<CommunityRecord[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [newslettersLoading, setNewslettersLoading] = useState(false);
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [sermonsLoading, setSermonsLoading] = useState(false);
  const [locationHash, setLocationHash] = useState(() => window.location.hash);
  useEffect(() => { const updateHash = () => setLocationHash(window.location.hash); window.addEventListener('hashchange', updateHash); return () => window.removeEventListener('hashchange', updateHash); }, []);
  useEffect(() => {
    setSermonsLoading(true);
    fetch(`${apiBase}/pages?slug=sermons&_fields=content`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((pages: PageContent[]) => setSermons(parseSermons(pages[0]?.content?.rendered || '')))
      .catch(() => setSermons([]))
      .finally(() => setSermonsLoading(false));
  }, []);
  useEffect(() => {
    setNewslettersLoading(true);
    fetch(`${apiBase}/newsletter?per_page=50&_embed=1`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((records: Newsletter[]) => setNewsletters(records))
      .catch(() => setNewsletters([]))
      .finally(() => setNewslettersLoading(false));
  }, []);
  useEffect(() => {
    setArticlesLoading(true);
    fetch(`${apiBase}/posts?per_page=50&_embed=1`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((records: Article[]) => setArticles(records))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false));
  }, []);
  useEffect(() => {
    Promise.all(['home', 'contact-us', 'missional-communities'].map((slug) => fetch(`${apiBase}/pages?slug=${slug}&_fields=title,content,excerpt,acf`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((pages: PageContent[]) => pages[0] || null)
      .catch(() => null)))
      .then(([home, contact, communitiesPage]) => setContent({
        title: home?.title || fallback.title,
        content: home?.content,
        excerpt: home?.excerpt || fallback.excerpt,
        acf: {
          homeHtml: home ? pageHtml(home) : String(fallback.acf?.homeHtml || ''),
          contactHtml: contact ? pageHtml(contact) : String(fallback.acf?.contactHtml || ''),
          communitiesHtml: communitiesPage ? pageHtml(communitiesPage) : String(fallback.acf?.communitiesHtml || ''),
        },
      }));
  }, []);
  useEffect(() => {
    fetch(`${apiBase}/missional-community?per_page=100&_fields=title,content,acf`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((records: CommunityRecord[]) => {
        setCommunityRecords(records);
      })
      .catch(() => undefined);
  }, []);
  const pageTitle = fieldText(content.title?.rendered);
  const title = pageTitle && pageTitle !== 'Home' ? pageTitle : fallback.title?.rendered || 'A place to belong, grow and serve';
  const homeHtml = typeof content.acf?.homeHtml === 'string' ? content.acf.homeHtml : '';
  const contactHtml = typeof content.acf?.contactHtml === 'string' ? content.acf.contactHtml : '';
  const communitiesHtml = typeof content.acf?.communitiesHtml === 'string' ? content.acf.communitiesHtml : '';
  const intro = fieldText(content.excerpt?.rendered) || afterHeading(homeHtml, /About Us/i)[0] || clean(fallback.excerpt?.rendered);
  const serviceText = afterHeading(homeHtml, /Our Services/i).join(' ') || pagePlainText(content);
  const serviceTime = firstMatch(serviceText, /\b(?:Sunday|Saturday|Monday|Tuesday|Wednesday|Thursday|Friday)[^.!?]*?\b\d{1,2}:\d{2}\s*(?:am|pm)\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm)\b/i);
  const visitText = publishedLocation(contactHtml, homeHtml) || afterHeading(contactHtml, /Locate Us/i).join(' ') || afterHeading(homeHtml, /Visit Us/i).join(' ');
  const location = visitText.replace(/^We are located\s*/i, '').trim();
  const allContactText = `${pagePlainText(content)} ${pagePlainText({ content: { rendered: contactHtml } })}`;
  const phone = displayPhone(firstMatch(allContactText, /\+?\d[\d ()-]{7,}\d/));
  const email = publishedEmail(homeHtml, contactHtml) || firstMatch(allContactText, /[A-Za-z][\w.+-]*@[\w.-]+\.[A-Za-z]{2,}/);
  const postal = firstMatch(pagePlainText(content), /P\.?\s*O\.?\s*BOX\s*[^.]+/i).replace(/\s*\+?\d[\d ()-]{7,}\d.*$/, '').trim();
  const serving = afterHeading(homeHtml, /How to Plug in/i).join(' ') || afterHeading(homeHtml, /Join Us In Ministry/i).join(' ') || 'Get in touch to ask about serving.';
  const aboutHeading = headingText(homeHtml, /About Us/i) || 'About GracePoint';
  const aboutCopy = afterHeading(homeHtml, /About Us/i).join(' ') || 'We aim to proclaim Christ and Him crucified, and to live out the good news together.';
  const communityIntro = afterHeading(communitiesHtml, /Missional Communities/i)[0] || 'Connect with a Missional Community at GracePoint Church Waiyaki Way.';
  const communityMap = new Map<string, Community>();
  for (const community of parseCommunityPage(communitiesHtml)) communityMap.set(community.name.toLowerCase(), community);
  for (const record of communityRecords) {
    const community = parseCommunity(record);
    if (community) {
      const existing = communityMap.get(community.name.toLowerCase());
      communityMap.set(community.name.toLowerCase(), {
        ...existing,
        ...community,
        meeting: community.meeting || existing?.meeting,
        leader: community.leader || existing?.leader,
      });
    }
  }
  const communityList = Array.from(communityMap.values());
  return <>
    <header className="site-header">
      <a className="brand" href="#home"><span className="brand-mark" aria-hidden="true">G<span>•</span></span><span>GracePoint Church<small>Waiyaki Way</small></span></a>
      <button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span></span><span></span></button>
      <nav className={menuOpen ? 'navigation open' : 'navigation'} aria-label="Main navigation">
        <a onClick={() => setMenuOpen(false)} href="#plan-a-visit">Plan a visit</a>
        <a onClick={() => setMenuOpen(false)} href="#missional-communities">Missional Communities</a>
        <a onClick={() => setMenuOpen(false)} href="#about">About</a>
        <a onClick={() => setMenuOpen(false)} href="#articles">Articles</a>
        <a onClick={() => setMenuOpen(false)} href="#newsletters">Newsletters</a>
        <a onClick={() => setMenuOpen(false)} href="#sermons">Sermons</a>
        <a onClick={() => setMenuOpen(false)} href="#serving">Serving</a>
        <a onClick={() => setMenuOpen(false)} href="#contact">Contact</a>
        <a className="nav-cta" onClick={() => setMenuOpen(false)} href="#plan-a-visit">Join us Sunday <span aria-hidden="true">↗</span></a>
      </nav>
    </header>
    <main id="home">
      {locationHash === '#sermons' ? <section className="articles-page section" aria-label="Sermons">
        <p className="eyebrow">Messages from GracePoint Church</p><h1>Sermons</h1><p className="articles-intro">Browse recent messages. Each thumbnail opens its video on YouTube.</p>
        {sermonsLoading ? <p>Loading sermons…</p> : sermons.length ? <div className="sermon-grid">{sermons.map((sermon) => <article className="sermon-card" key={sermon.href}><a href={sermon.href} target="_blank" rel="noopener noreferrer" aria-label={sermon.title}><img src={sermon.thumbnail} alt={sermon.title} loading="lazy" /><span className="sermon-play" aria-hidden="true">▶</span></a><h2>{sermon.title}</h2></article>)}</div> : <p>There are no sermons to show right now.</p>}
      </section> : locationHash === '#newsletters' || locationHash.startsWith('#newsletter/') ? <section className="articles-page section" aria-label="Newsletters">
        {locationHash.startsWith('#newsletter/') ? (() => {
          const slug = decodeURIComponent(locationHash.slice('#newsletter/'.length));
          const newsletter = newsletters.find((item) => item.slug === slug);
          const pdf = newsletter && sourcePdf(newsletter);
          return <div className="article-detail"><a className="text-link" href="#newsletters">← Back to newsletters</a>{newsletter ? <><p className="eyebrow">GracePoint Church · Newsletter</p><h1>{clean(newsletter.title?.rendered || 'Untitled newsletter')}</h1><ArticleMeta article={newsletter} />{pdf ? <div className="newsletter-reader"><iframe title={`${clean(newsletter.title?.rendered || 'Newsletter')} PDF`} src={pdf} loading="lazy" /><a className="button button-dark" href={pdf} target="_blank" rel="noopener noreferrer" aria-label="Open or download the newsletter PDF">Open or download the PDF <span>↗</span></a></div> : <p className="newsletter-unavailable">No PDF file is available for this newsletter.</p>}<div className="article-body" dangerouslySetInnerHTML={{ __html: safeArticleHtml(newsletter.content?.rendered || '') }} /></> : <p>{newslettersLoading ? 'Loading newsletter…' : 'This newsletter could not be found.'}</p>}</div>;
        })() : <><p className="eyebrow">News and updates from our church family</p><h1>Newsletters</h1><p className="articles-intro">Read updates from GracePoint Church Waiyaki Way, with PDF editions available where published.</p>{newslettersLoading ? <p>Loading newsletters…</p> : newsletters.length ? <div className="article-grid">{newsletters.map((newsletter) => <article className="article-card" key={newsletter.id}><p className="article-date">{articleDate(newsletter)}</p><h2>{clean(newsletter.title?.rendered || 'Untitled newsletter')}</h2><div className="article-excerpt" dangerouslySetInnerHTML={{ __html: safeArticleHtml(newsletter.content?.rendered || '') }} /><a className="text-link" aria-label={`Read newsletter: ${clean(newsletter.title?.rendered || 'Untitled newsletter')}`} href={`#newsletter/${encodeURIComponent(newsletter.slug)}`}>Read newsletter <span>↗</span></a></article>)}</div> : <p>There are no newsletters to show right now.</p>}</>}
      </section> : locationHash === '#articles' || locationHash.startsWith('#article/') ? <section className="articles-page section" aria-label="Articles">
        {locationHash.startsWith('#article/') ? (() => {
          const slug = decodeURIComponent(locationHash.slice('#article/'.length));
          const article = articles.find((item) => item.slug === slug);
          return <div className="article-detail"><a className="text-link" href="#articles">← Back to articles</a>{article ? <><p className="eyebrow">GracePoint Church · Article</p><h1>{articleTitle(article)}</h1><ArticleMeta article={article} /><div className="article-body" dangerouslySetInnerHTML={{ __html: safeArticleHtml(article.content?.rendered || '') }} /></> : <p>{articlesLoading ? 'Loading article…' : 'This article could not be found.'}</p>}</div>;
        })() : <><p className="eyebrow">Stories, reflections and teaching</p><h1>Articles</h1><p className="articles-intro">Read reflections and updates from the GracePoint Church Waiyaki Way community.</p>{articlesLoading ? <p>Loading articles…</p> : articles.length ? <div className="article-grid">{articles.map((article) => <article className="article-card" key={article.id}><p className="article-date">{articleDate(article)}</p><h2>{articleTitle(article)}</h2><div className="article-excerpt" dangerouslySetInnerHTML={{ __html: safeArticleHtml(article.excerpt?.rendered || '') }} /><a className="text-link" aria-label={`Read article: ${articleTitle(article)}`} href={`#article/${encodeURIComponent(article.slug)}`}>Read article <span>↗</span></a></article>)}</div> : <p>There are no articles to show right now.</p>}</>}
      </section> : <>
      <section className="hero">
        <div className="hero-copy"><p className="eyebrow"><span></span> GracePoint Church · Waiyaki Way</p><h1>{title}</h1><p className="hero-intro">{intro}</p><div className="hero-actions"><a className="button button-dark" href="#plan-a-visit">Plan a visit <span>↗</span></a><a className="text-link" href="#missional-communities">Find your community <span>↗</span></a></div><div className="hero-note"><div className="avatar-stack" aria-hidden="true"><i>G</i><i>P</i><i>W</i></div><span>A church family, learning to follow Jesus together.</span></div></div>
        <div className="hero-art" aria-label="Warm, welcoming gathering illustration" role="img"><div className="sun"></div><div className="arch arch-back"></div><div className="arch arch-front"><div className="window"><span></span><span></span><span></span><span></span></div></div><div className="plant plant-left">✳</div><div className="plant plant-right">✳</div><div className="caption">A seat at the table<br/><small>There’s room for you.</small></div></div>
      </section>
      <section className="quick-links" aria-label="Explore GracePoint"><a href="#plan-a-visit"><span className="quick-number">01</span><span><strong>Plan your visit</strong><small>What to expect when you join us</small></span><b aria-hidden="true">↗</b></a><a href="#missional-communities"><span className="quick-number">02</span><span><strong>Find a community</strong><small>Grow in faith, life and friendship</small></span><b aria-hidden="true">↗</b></a><a href="#about"><span className="quick-number">03</span><span><strong>Get to know us</strong><small>Our heart and what we believe</small></span><b aria-hidden="true">↗</b></a><a href="#articles"><span className="quick-number">04</span><span><strong>Read articles</strong><small>Reflections and updates</small></span><b aria-hidden="true">↗</b></a><a href="#newsletters"><span className="quick-number">05</span><span><strong>Read newsletters</strong><small>Church news and updates</small></span><b aria-hidden="true">↗</b></a><a href="#sermons"><span className="quick-number">06</span><span><strong>Browse sermons</strong><small>Watch messages on YouTube</small></span><b aria-hidden="true">↗</b></a></section>
      <section className="welcome section" id="about"><p className="eyebrow">Rooted in the Gospel</p><h2>{aboutHeading}</h2><p>{aboutCopy}</p><a className="text-link" href="#serving">Discover our story <span>↗</span></a></section>
      <section className="visit section" id="plan-a-visit"><div className="visit-copy"><p className="eyebrow">Your first Sunday</p><h2>We’d love to meet you.</h2><p>{visitText ? `GracePoint Church Waiyaki Way: ${location || visitText}` : 'Service and location details will appear here when published by the church.'}</p><div className="visit-details">{serviceTime && <div><span className="detail-icon">◷</span><span><strong>Sunday service</strong><small>{serviceTime}</small></span></div>}{location && <div><span className="detail-icon">⌖</span><span><strong>Find us</strong><small>{location}</small></span></div>}</div>{location && <a className="button button-dark" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`} target="_blank" rel="noreferrer">Get directions <span>↗</span></a>}</div><div className="visit-card"><div className="card-sun"></div><div className="card-lines"></div><div className="card-label">SUNDAYS TOGETHER</div><div className="card-time">{serviceTime || 'Visit us'}</div><div className="card-bottom">{location || 'GracePoint Church Waiyaki Way'} <span>✳</span></div></div></section>
      <section className="community section" id="missional-communities"><div className="community-art"><span className="community-flower">✳</span><span className="community-word">together</span><span className="community-caption">Faith grows in community.</span></div><div className="community-copy"><p className="eyebrow">Life beyond Sunday</p><h2>Faith is better<br/>together.</h2><p>{communityIntro}</p><a className="button button-light" href="#community-list">Find a Missional Community <span>↓</span></a></div></section>
      <section className="community-list section" id="community-list"><div className="community-list-heading"><p className="eyebrow">Find a community near you</p><h2>Choose a place to connect.</h2><p>{communityList.length ? 'Meeting details and leaders appear when published by the church.' : 'Community details will appear here when published by the church.'}</p></div><div className="community-grid">{communityList.map((community) => <article className="community-card" key={community.name}><p className="eyebrow">Missional Community</p><h3>{community.name}</h3>{community.meeting && <p><strong>Meets</strong>{community.meeting}</p>}{community.leader && <p><strong>Leader</strong>{community.leader}</p>}</article>)}</div><div className="community-connect"><div><h3>Not sure which community is right for you?</h3><p>Get in touch and ask the church to help you find a Missional Community.</p></div>{email && <a className="button button-dark" href={`mailto:${email}?subject=Help%20me%20find%20a%20Missional%20Community`}>Ask about connecting <span>↗</span></a>}</div><p className="source-note">Community information from <a href="https://gpcwaiyakiway.org/missional-communities/" target="_blank" rel="noreferrer">GracePoint Church Waiyaki Way</a>.</p></section>
      <section className="serve section" id="serving"><p className="eyebrow">Make room at the table</p><h2>Get involved in ministry.</h2><p className="serve-intro">{serving}</p>{email && <a className="button button-dark" href={`mailto:${email}?subject=Serving%20opportunity`}>Ask about serving <span>↗</span></a>}</section>
      <section className="contact section" id="contact"><div><p className="eyebrow">We’re here to help</p><h2>Get in touch.</h2><p>Reach out with questions about visiting or getting involved.</p></div><div className="contact-details">{phone && <p><strong>Call us</strong><a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a></p>}{email && <p><strong>Email us</strong><a href={`mailto:${email}`}>{email}</a></p>}{postal && <p><strong>Postal address</strong><span>{postal}</span></p>}</div></section>
      </>}
    </main>
    <footer><a className="brand footer-brand" href="#home"><span className="brand-mark">G<span>•</span></span><span>GracePoint Church<small>Waiyaki Way</small></span></a><p>Growing together in the good news of Jesus.</p><a href="#contact">Get in touch ↗</a><small>© GracePoint Church Waiyaki Way</small></footer>
  </>;
}

function ArticleMeta({ article }: { article: Article }) {
  const date = articleDate(article);
  const author = clean(article._embedded?.author?.[0]?.name || '');
  return <p className="article-meta">{date && <time dateTime={article.date}>{date}</time>}{date && author && <span aria-hidden="true"> · </span>}{author && <span>By {author}</span>}</p>;
}

createRoot(document.getElementById('root')!).render(<App />);
