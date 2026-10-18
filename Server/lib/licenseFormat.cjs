const crypto = require('node:crypto');
const PRODUCT = 'gezira-membership-server';
const cairoFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' });
const expiryCache = new Map();
function cairoDay(now) {
  const parts = cairoFormatter.formatToParts(now);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function nextJune(now) {
  const today = cairoDay(now), year = Number(today.slice(0, 4));
  return `${year + (today >= `${year}-06-01` ? 1 : 0)}-06-01`;
}
function expiryInstant(expiresOn) {
  if (expiryCache.has(expiresOn)) return expiryCache.get(expiresOn);
  let low = Date.parse(`${expiresOn}T00:00:00Z`) - 86400000;
  let high = low + 172800000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (cairoDay(new Date(middle)) >= expiresOn) high = middle; else low = middle;
  }
  if (expiryCache.size >= 8) expiryCache.clear();
  expiryCache.set(expiresOn, high);
  return high;
}
function verifyLicense(envelope, publicKey, fingerprint, now = new Date()) {
  if (typeof envelope !== 'string' || envelope.length > 16000) throw new Error('INVALID_LICENSE');
  let packet, data;
  try {
    packet = JSON.parse(envelope);
    if (typeof packet.payload !== 'string' || typeof packet.signature !== 'string' || !/^[A-Za-z0-9_-]+$/.test(packet.payload) || !/^[A-Za-z0-9_-]+$/.test(packet.signature)) throw new Error();
    const key = crypto.createPublicKey(publicKey);
    if (key.asymmetricKeyType !== 'ed25519' || !crypto.verify(null, Buffer.from(packet.payload, 'base64url'), key, Buffer.from(packet.signature, 'base64url'))) throw new Error();
    data = JSON.parse(Buffer.from(packet.payload, 'base64url').toString('utf8'));
  } catch { throw new Error('INVALID_SIGNATURE'); }
  const issued = new Date(data.issuedAt);
  if (data.version !== 1 || data.product !== PRODUCT || typeof data.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(data.id) || !/^GZR1-[A-F0-9]{64}$/.test(data.fingerprint) || !Number.isFinite(issued.getTime()) || !/^\d{4}-06-01$/.test(data.expiresOn) || data.expiresOn !== nextJune(issued)) throw new Error('INVALID_LICENSE');
  if (data.fingerprint !== fingerprint) throw new Error('WRONG_SERVER');
  if (issued.getTime() > now.getTime() + 300000) throw new Error('CLOCK_INVALID');
  if (cairoDay(now) >= data.expiresOn) throw new Error('EXPIRED');
  return data;
}
module.exports = { PRODUCT, cairoDay, nextJune, expiryInstant, verifyLicense };
