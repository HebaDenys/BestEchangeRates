import {SPONSORSHIP} from './sponsorship-config.js?v=20261030-1';

// Static text only; no cookies, pixels, remote assets, network calls or ranking imports.
export function eligibleCampaign(config, {origin, now = Date.now()} = {}) {
  if (config?.enabled !== true || !Array.isArray(config.approvedOrigins) || !config.approvedOrigins.includes(origin)) return null;
  let host;
  try {
    const site = new URL(origin);
    if (site.protocol !== 'https:' || site.origin !== origin) return null;
    host = site.hostname;
  } catch { return null; }
  // This deployment remains informational. Monetization requires an approved host.
  if (host === 'github.io' || host.endsWith('.github.io')) return null;
  const campaign = config.campaign;
  if (!campaign || !Number.isFinite(now)) return null;
  for (const key of ['advertiser', 'message', 'linkLabel']) {
    if (typeof campaign[key] !== 'string' || !campaign[key].trim() || campaign[key].length > (key === 'message' ? 300 : 100)) return null;
  }
  // Explicit UTC instants avoid ambiguous local dates and expired promotions.
  const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
  if (!utc.test(campaign.startsAt) || !utc.test(campaign.endsAt)) return null;
  const start = Date.parse(campaign.startsAt), end = Date.parse(campaign.endsAt);
  for (const [instant, text] of [[start, campaign.startsAt], [end, campaign.endsAt]]) {
    if (!Number.isFinite(instant) || new Date(instant).toISOString() !== text.replace('Z', '.000Z')) return null;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || now < start || now >= end) return null;
  try {
    const url = new URL(campaign.url);
    // No query/fragment tracking or embedded credentials, even in approved content.
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    return {...campaign, url: url.href};
  } catch { return null; }
}

export function renderSponsorship(container, config = SPONSORSHIP, context = {}) {
  if (!container) return false;
  container.hidden = true;
  container.replaceChildren();
  const campaign = eligibleCampaign(config, context);
  if (!campaign) return false;
  const doc = container.ownerDocument;
  const label = doc.createElement('p');
  label.className = 'eyebrow';
  label.textContent = `Publicidad · ${campaign.advertiser}`;
  const message = doc.createElement('p');
  message.textContent = campaign.message;
  const link = doc.createElement('a');
  link.textContent = campaign.linkLabel;
  link.href = campaign.url;
  link.rel = 'sponsored noopener noreferrer';
  link.referrerPolicy = 'no-referrer';
  const independence = doc.createElement('p');
  independence.className = 'hint';
  independence.textContent = 'El patrocinio no cambia las fuentes, el orden ni el mejor resultado del comparador.';
  container.append(label, message, link, independence);
  container.hidden = false;
  return true;
}

if (typeof document !== 'undefined') {
  renderSponsorship(document.getElementById('sponsorship'), SPONSORSHIP, {origin: document.location.origin});
}
