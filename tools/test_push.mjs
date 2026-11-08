// 檢查 Worker 的 Web Push 加密與 VAPID 簽章是否正確：node tools/test_push.mjs
// 這裡扮演「她的手機」：產生一組訂閱金鑰，請 worker.js 加密，再照 RFC 8291 解回來，應該要得到原文。
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

const workerPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend', 'worker.js');
const { encryptPush, vapidAuth, sendPush } = await import(pathToFileURL(workerPath).href);
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = buf => Buffer.from(buf).toString('base64url');
const concat = (...parts) => Buffer.concat(parts.map(p => Buffer.from(p)));
async function hkdf(salt, ikm, info, bytes) {
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, key, bytes * 8));
}

// 1. 「她的手機」的訂閱：ECDH 金鑰對 + 16 bytes auth
const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const uaPub = new Uint8Array(await crypto.subtle.exportKey('raw', ua.publicKey));
const auth = crypto.getRandomValues(new Uint8Array(16));
const sub = { endpoint: 'https://web.push.apple.com/fake', keys: { p256dh: b64u(uaPub), auth: b64u(auth) } };

// 2. Worker 加密
const msg = JSON.stringify({ title: '🐦 小鳥帶著信來找你', body: '打開看看寫了什麼 💌' });
const body = await encryptPush(sub, msg);

// 3. 照 RFC 8188/8291 解密
const salt = body.slice(0, 16), rs = new DataView(body.buffer, body.byteOffset + 16, 4).getUint32(0), idlen = body[20];
assert.equal(rs, 4096); assert.equal(idlen, 65);
const asPub = body.slice(21, 21 + idlen), cipher = body.slice(21 + idlen);
const asKey = await crypto.subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, ua.privateKey, 256));
const ikm = await hkdf(auth, shared, concat(enc.encode('WebPush: info\0'), uaPub, asPub), 32);
const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
const aes = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
const plain = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce }, aes, cipher));
assert.equal(plain[plain.length - 1], 2, '結尾要是 0x02');
assert.equal(dec.decode(plain.slice(0, -1)), msg);
console.log('encrypt/decrypt ok:', msg);

// 4. VAPID：JWT 要能用公鑰驗簽，aud 要是 endpoint 的 origin
const env = { VAPID_PUBLIC: 'BJrf-gYqSzIw1rF_Cf-CVeO4SCeFqOlBio9g-by5S8q1tn8E33exDdvxHE3BfvSg31osrGwADA2ZBjbuf-IG_s0', VAPID_PRIVATE: 'rdpcUbcer6pNkHy0UygBQdJiH0ZGzQ-SPk0JhKB8oS4', VAPID_SUBJECT: 'http://localhost/' };
const header = await vapidAuth(env, sub.endpoint);
const m = header.match(/^vapid t=([^,]+), k=(.+)$/); assert.ok(m, 'Authorization 格式');
const [h, p, sig] = m[1].split('.');
const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
assert.equal(payload.aud, 'https://web.push.apple.com'); assert.equal(payload.sub, env.VAPID_SUBJECT); assert.ok(payload.exp > Date.now() / 1000);
const pub = Buffer.from(env.VAPID_PUBLIC, 'base64url');
const verifyKey = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33, 65)) }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
const ok = await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, verifyKey, Buffer.from(sig, 'base64url'), enc.encode(`${h}.${p}`));
assert.equal(ok, true, 'JWT 簽章要驗得過'); assert.equal(m[2], env.VAPID_PUBLIC);
console.log('vapid ok:', payload);

// 5. sendPush 遇到 404/410 要回 gone（假的 fetch）
const realFetch = globalThis.fetch;
globalThis.fetch = async () => new Response('', { status: 410 });
assert.equal(await sendPush(env, sub, { title: 'x' }), 'gone');
globalThis.fetch = async () => new Response('', { status: 201 });
assert.equal(await sendPush(env, sub, { title: 'x' }), 'ok');
globalThis.fetch = realFetch;
console.log('sendPush ok');
console.log('ALL PUSH TESTS PASSED');
