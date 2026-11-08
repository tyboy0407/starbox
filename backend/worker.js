/* =========================================================
 *  ✦ 星星小宇宙 — 回信後台（Cloudflare Worker）
 *
 *  這支程式跑在 Cloudflare 上，當作她的 App 和你的回信後台之間的小信箱：
 *    她的 App  → POST /leaf        把新葉子存進來（這樣你的後台看得到）
 *    她的 App  → GET  /replies     拉還沒送達的回信（新版 App 會帶 ?v=2，才拿得到附禮物的信）
 *    她的 App  → POST /delivered   回報哪些信已經送到她手上
 *    你的後台  → GET  /admin/state 看所有葉子與回信
 *    你的後台  → POST /admin/reply 寫一封信（可以指定葉子回信，也可以不指定主動送；可附 gift 禮物）
 *    你的後台  → POST /admin/reply/delete 收回還沒送達的信
 *    她的 App  → POST /push/subscribe  存下她手機的推播訂閱（主畫面 App 開通知後）
 *    你的後台  → POST /admin/push/test  推一則測試通知到她手機
 *    排程      → 生日當天早上推一則 BIRTHDAY_PUSH（wrangler.toml 的 [triggers]）
 *
 *  需要的設定（在 Cloudflare 後台 Worker → Settings 設）：
 *    KV 綁定   MAIL         → 一個 KV namespace（存資料用）
 *    變數      APP_KEY      → 一串隨機字，要和 config.js 的 backend.appKey 一樣
 *    Secret    ADMIN_SECRET → 你的後台密碼，只有你知道
 *    變數      VAPID_PUBLIC / VAPID_SUBJECT、Secret VAPID_PRIVATE → 主畫面推播用的金鑰（沒設就不推播，其他照常）
 *  詳細步驟看 backend/README.md
 * ========================================================= */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-App-Key',
  'Access-Control-Max-Age': '86400',
};
const MAX_LEAVES = 500, MAX_REPLIES = 500, MAX_SUBS = 10;

/* ---------- Web Push（RFC 8291 aes128gcm 加密 + RFC 8292 VAPID 簽章），只用 WebCrypto ---------- */
const enc = new TextEncoder();
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = str => { const b = atob(String(str).replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(str.length / 4) * 4, '=')); return Uint8Array.from(b, c => c.charCodeAt(0)); };
const concat = (...parts) => { const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0)); let o = 0; for (const p of parts) { out.set(new Uint8Array(p), o); o += p.byteLength; } return out; };
async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}
// 把 payload 加密成推播服務看得懂的格式（訂閱者的 p256dh / auth 來自她的 App）
export async function encryptPush(sub, payload) {
  const uaPub = unb64u(sub.keys.p256dh), auth = unb64u(sub.keys.auth);
  const asKey = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPub = new Uint8Array(await crypto.subtle.exportKey('raw', asKey.publicKey));
  const uaKey = await crypto.subtle.importKey('raw', uaPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKey.privateKey, 256));
  const ikm = await hkdf(auth, shared, concat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const plain = concat(enc.encode(payload), new Uint8Array([2]));   // 結尾加 0x02 代表最後一段
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aes, plain));
  const header = concat(salt, new Uint8Array([0, 0, 16, 0]), new Uint8Array([asPub.length]), asPub);   // salt | rs=4096 | idlen | as_public
  return concat(header, cipher);
}
// VAPID：用私鑰簽一張給推播服務看的 JWT
export async function vapidAuth(env, endpoint) {
  const pub = unb64u(env.VAPID_PUBLIC);
  const jwk = { kty: 'EC', crv: 'P-256', x: b64u(pub.slice(1, 33)), y: b64u(pub.slice(33, 65)), d: env.VAPID_PRIVATE };
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  const head = b64u(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT || 'https://example.com' })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${head}.${body}`));
  return `vapid t=${head}.${body}.${b64u(sig)}, k=${env.VAPID_PUBLIC}`;
}
const pushReady = env => !!(env.VAPID_PUBLIC && env.VAPID_PRIVATE);
// 推給一個訂閱；回傳 'ok'、'gone'（訂閱失效，要刪掉）或 'fail'
export async function sendPush(env, sub, data) {
  try {
    const body = await encryptPush(sub, JSON.stringify(data));
    const res = await fetch(sub.endpoint, { method: 'POST', body, headers: { 'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream', 'TTL': '86400', 'Urgency': 'high', 'Authorization': await vapidAuth(env, sub.endpoint) } });
    if (res.status === 404 || res.status === 410) return 'gone';
    return res.ok ? 'ok' : 'fail';
  } catch (e) { return 'fail'; }
}
// 推給她所有的訂閱（通常只有一支手機），失效的順便清掉
async function pushAll(env, data) {
  if (!pushReady(env)) return { sent: 0, subs: 0 };
  let subs = []; try { subs = JSON.parse(await env.MAIL.get('subs') || '[]'); } catch (e) {}
  if (!subs.length) return { sent: 0, subs: 0 };
  const results = await Promise.all(subs.map(s => sendPush(env, s, data)));
  const keep = subs.filter((s, i) => results[i] !== 'gone');
  if (keep.length !== subs.length) await env.MAIL.put('subs', JSON.stringify(keep));
  return { sent: results.filter(r => r === 'ok').length, subs: subs.length };
}

export default {
  // 生日當天早上的排程（wrangler.toml [triggers]）：推一則 BIRTHDAY_PUSH
  async scheduled(event, env, ctx) {
    if (env.BIRTHDAY_PUSH) ctx.waitUntil(pushAll(env, { title: '星星小宇宙', body: env.BIRTHDAY_PUSH, tag: 'birthday' }));
  },
  async fetch(req, env, ctx) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    const load = async k => { try { return JSON.parse(await env.MAIL.get(k) || '[]'); } catch (e) { return []; } };
    const save = (k, v) => env.MAIL.put(k, JSON.stringify(v));
    const body = async () => { try { return await req.json(); } catch (e) { return {}; } };
    const str = (v, n) => String(v == null ? '' : v).slice(0, n);
    // 小動物帶的禮物：points（送星星）、coupon（自訂兌換券）、shop（config.js 商店裡的品項，用 id 指定）
    const giftOf = g => {
      if (!g || typeof g !== 'object') return null;
      if (g.type === 'points') { const n = Math.round(+g.n || 0); return n > 0 ? { type: 'points', n: Math.min(n, 9999) } : null; }
      if (g.type === 'coupon') { const name = str(g.name, 40).trim(); return name ? { type: 'coupon', name, emoji: str(g.emoji, 16) || '🎁' } : null; }
      if (g.type === 'shop') { const id = str(g.id, 40).trim(); return id ? { type: 'shop', id, name: str(g.name, 40), emoji: str(g.emoji, 16) || '🎁' } : null; }
      return null;
    };
    const appOk = !!env.APP_KEY && (req.headers.get('X-App-Key') === env.APP_KEY || url.searchParams.get('key') === env.APP_KEY);
    const adminOk = !!env.ADMIN_SECRET && req.headers.get('Authorization') === 'Bearer ' + env.ADMIN_SECRET;

    try {
      if (path === '/') return json({ ok: true, service: 'starbox-mail', kv: !!env.MAIL, appKey: !!env.APP_KEY, adminSecret: !!env.ADMIN_SECRET, push: pushReady(env) });
      // 她的 App 開通知後把訂閱存進來（同一支手機重複送會覆蓋）
      if (path === '/push/subscribe' && req.method === 'POST') {
        if (!appOk) return json({ error: 'app key 不對' }, 401);
        const b = await body(), sub = b.subscription || b;
        if (!sub || typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint) || !sub.keys || !sub.keys.p256dh || !sub.keys.auth) return json({ error: '訂閱格式不對' }, 400);
        const subs = await load('subs');
        const item = { endpoint: str(sub.endpoint, 1000), keys: { p256dh: str(sub.keys.p256dh, 200), auth: str(sub.keys.auth, 100) }, t: Date.now(), ua: str(b.ua, 200) };
        const rest = subs.filter(x => x.endpoint !== item.endpoint);
        rest.unshift(item);
        if (rest.length > MAX_SUBS) rest.length = MAX_SUBS;
        await save('subs', rest);
        return json({ ok: true, push: pushReady(env) });
      }
      if (path === '/push/unsubscribe' && req.method === 'POST') {
        if (!appOk) return json({ error: 'app key 不對' }, 401);
        const b = await body(), subs = await load('subs');
        await save('subs', subs.filter(x => x.endpoint !== String(b.endpoint || '')));
        return json({ ok: true });
      }

      /* ---------- 她的 App ---------- */
      if (path === '/leaf' && req.method === 'POST') {
        if (!appOk) return json({ error: 'app key 不對' }, 401);
        const b = await body();
        if (!b.id || !b.text) return json({ error: '缺少 id 或 text' }, 400);
        const leaves = await load('leaves');
        if (!leaves.some(l => l.id === String(b.id))) {
          leaves.unshift({ id: str(b.id, 40), t: +b.t || Date.now(), mood: str(b.mood, 20), text: str(b.text, 1000) });
          leaves.sort((a, c) => c.t - a.t);
          if (leaves.length > MAX_LEAVES) leaves.length = MAX_LEAVES;
          await save('leaves', leaves);
        }
        return json({ ok: true });
      }
      if (path === '/replies' && req.method === 'GET') {
        if (!appOk) return json({ error: 'app key 不對' }, 401);
        const replies = await load('replies');
        const v = +url.searchParams.get('v') || 1;   // 舊版 App 看不懂禮物，先不給它附禮物的信，等她更新再送
        return json({ replies: replies.filter(r => !r.delivered && (v >= 2 || !r.gift)) });
      }
      if (path === '/delivered' && req.method === 'POST') {
        if (!appOk) return json({ error: 'app key 不對' }, 401);
        const b = await body(), ids = (Array.isArray(b.ids) ? b.ids : []).map(String);
        const replies = await load('replies');
        let n = 0;
        replies.forEach(r => { if (ids.includes(r.id) && !r.delivered) { r.delivered = true; r.deliveredAt = Date.now(); n++; } });
        if (n) await save('replies', replies);
        return json({ ok: true, marked: n });
      }

      /* ---------- 你的回信後台 ---------- */
      if (path.startsWith('/admin')) {
        if (!adminOk) return json({ error: '密碼不對' }, 401);
        if (path === '/admin/state' && req.method === 'GET') {
          const subs = await load('subs');
          return json({ leaves: await load('leaves'), replies: await load('replies'), now: Date.now(), push: { ready: pushReady(env), subs: subs.length, last: subs[0] ? subs[0].t : 0 } });
        }
        if (path === '/admin/push/test' && req.method === 'POST') {
          if (!pushReady(env)) return json({ error: 'Cloudflare 還沒設 VAPID_PUBLIC / VAPID_PRIVATE' }, 400);
          const b = await body();
          const r = await pushAll(env, { title: str(b.title, 60) || '星星小宇宙', body: str(b.body, 200) || '這是一則測試通知 🔔', tag: 'test' });
          return json(Object.assign({ ok: true }, r));
        }
        if (path === '/admin/reply' && req.method === 'POST') {
          const b = await body();
          const text = str(b.text, 2000).trim(), gift = giftOf(b.gift);
          if (!text && !gift) return json({ error: '信的內容是空的' }, 400);
          const reply = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            leafId: str(b.leafId, 40),
            animal: { emoji: str(b.animal && b.animal.emoji, 16) || '🐿️', name: str(b.animal && b.animal.name, 20) },
            text, t: Date.now(), delivered: false,
          };
          if (gift) reply.gift = gift;
          const replies = await load('replies');
          replies.unshift(reply);
          if (replies.length > MAX_REPLIES) replies.length = MAX_REPLIES;
          await save('replies', replies);
          // 推播到她手機：只說是誰來了，內容留給她打開 App 看
          const who = reply.animal.name || '小動物';
          const pushed = pushAll(env, { title: `${reply.animal.emoji} ${who}${gift ? '帶著禮物' : reply.leafId ? '叼著一封信' : '帶著信'}來找你`, body: gift ? '打開看看是什麼 🎁' : '打開看看寫了什麼 💌', tag: 'reply' });
          if (ctx && ctx.waitUntil) ctx.waitUntil(pushed);
          return json({ ok: true, reply, push: ctx && ctx.waitUntil ? undefined : await pushed });
        }
        if (path === '/admin/reply/delete' && req.method === 'POST') {
          const b = await body(), id = str(b.id, 40);
          const replies = await load('replies');
          const i = replies.findIndex(r => r.id === id);
          if (i < 0) return json({ error: '找不到這封信' }, 404);
          if (replies[i].delivered) return json({ error: '已經送達的信不能收回' }, 400);
          replies.splice(i, 1);
          await save('replies', replies);
          return json({ ok: true });
        }
      }
      return json({ error: 'not found' }, 404);
    } catch (e) {
      return json({ error: String(e && e.message || e) }, 500);
    }
  },
};
