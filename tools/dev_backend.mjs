// 本機模擬 Cloudflare Worker：node tools/dev_backend.mjs [port]
// 用記憶體代替 KV，讓 e2e 測試和手動測試不用真的連 Cloudflare。
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const port = +(process.argv[2] || 8787);
const workerPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', 'worker.js');
const { default: worker } = await import(pathToFileURL(workerPath).href);

const store = new Map();
const env = {
  MAIL: { get: async k => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } },
  APP_KEY: process.env.APP_KEY || 'dev-app-key',
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'dev-admin-secret',
};

http.createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const init = { method: req.method, headers: req.headers };
  if (req.method !== 'GET' && req.method !== 'HEAD') init.body = Buffer.concat(chunks);
  const r = await worker.fetch(new Request(`http://localhost:${port}${req.url}`, init), env);
  res.writeHead(r.status, Object.fromEntries(r.headers));
  res.end(Buffer.from(await r.arrayBuffer()));
}).listen(port, () => console.log(`dev backend on http://localhost:${port}  (APP_KEY=${env.APP_KEY}, ADMIN_SECRET=${env.ADMIN_SECRET})`));
