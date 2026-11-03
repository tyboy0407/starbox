/* =========================================================
 *  ✦ 星星小宇宙 — 回信後台（Cloudflare Worker）
 *
 *  這支程式跑在 Cloudflare 上，當作她的 App 和你的回信後台之間的小信箱：
 *    她的 App  → POST /leaf        把新葉子存進來（這樣你的後台看得到）
 *    她的 App  → GET  /replies     拉還沒送達的回信
 *    她的 App  → POST /delivered   回報哪些信已經送到她手上
 *    你的後台  → GET  /admin/state 看所有葉子與回信
 *    你的後台  → POST /admin/reply 寫一封回信
 *    你的後台  → POST /admin/reply/delete 收回還沒送達的信
 *
 *  需要的設定（在 Cloudflare 後台 Worker → Settings 設）：
 *    KV 綁定   MAIL         → 一個 KV namespace（存資料用）
 *    變數      APP_KEY      → 一串隨機字，要和 config.js 的 backend.appKey 一樣
 *    Secret    ADMIN_SECRET → 你的後台密碼，只有你知道
 *  詳細步驟看 backend/README.md
 * ========================================================= */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-App-Key',
  'Access-Control-Max-Age': '86400',
};
const MAX_LEAVES = 500, MAX_REPLIES = 500;

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
    const load = async k => { try { return JSON.parse(await env.MAIL.get(k) || '[]'); } catch (e) { return []; } };
    const save = (k, v) => env.MAIL.put(k, JSON.stringify(v));
    const body = async () => { try { return await req.json(); } catch (e) { return {}; } };
    const str = (v, n) => String(v == null ? '' : v).slice(0, n);
    const appOk = !!env.APP_KEY && (req.headers.get('X-App-Key') === env.APP_KEY || url.searchParams.get('key') === env.APP_KEY);
    const adminOk = !!env.ADMIN_SECRET && req.headers.get('Authorization') === 'Bearer ' + env.ADMIN_SECRET;

    try {
      if (path === '/') return json({ ok: true, service: 'starbox-mail', kv: !!env.MAIL, appKey: !!env.APP_KEY, adminSecret: !!env.ADMIN_SECRET });

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
        return json({ replies: replies.filter(r => !r.delivered) });
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
          return json({ leaves: await load('leaves'), replies: await load('replies'), now: Date.now() });
        }
        if (path === '/admin/reply' && req.method === 'POST') {
          const b = await body();
          const text = str(b.text, 2000).trim();
          if (!text) return json({ error: '信的內容是空的' }, 400);
          const reply = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
            leafId: str(b.leafId, 40),
            animal: { emoji: str(b.animal && b.animal.emoji, 16) || '🐿️', name: str(b.animal && b.animal.name, 20) },
            text, t: Date.now(), delivered: false,
          };
          const replies = await load('replies');
          replies.unshift(reply);
          if (replies.length > MAX_REPLIES) replies.length = MAX_REPLIES;
          await save('replies', replies);
          return json({ ok: true, reply });
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
