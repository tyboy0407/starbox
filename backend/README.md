# 回信後台設定教學（Cloudflare Worker）

做完這份教學，你就能在**自己的手機**上回她的樹洞葉子，不用碰她的手機。
全部免費，已有帳號的話大約 15 分鐘。只做一次。

> ✅ **目前狀態：已經用 wrangler 建好了。**
> Worker 網址：`https://starbox-mail.dylanworkersdev.workers.dev`，config.js 也填好了。
> 你只要做「步驟 7」在手機上設定後台就能用。後台密碼（ADMIN_SECRET）在交接時另外告訴你，想改的話：
> `cd backend && npx wrangler secret put ADMIN_SECRET`（輸入新密碼），再到手機後台按 ⚙️ 重填。
> 以後改了 worker.js 要重新部署：`cd backend && npx wrangler deploy`（`backend/wrangler.toml` 只留在這台電腦、不上傳 GitHub）。
> 下面的步驟 1～6 是用網頁手動建的方式，留著當參考。

## 它怎麼運作

```
她的 App ──放葉子──▶ Cloudflare 小信箱 ◀──寫回信── 你的「回信後台」網頁
她的 App ◀──拉回信── Cloudflare 小信箱 ──送達回報──▶ 你的後台看到 ✓
```

- 小信箱是一支跑在 Cloudflare 上的小程式（`backend/worker.js`），資料存在 Cloudflare 的 KV 裡，不公開。
- 你的後台網頁是 `admin.html`，和 App 放在同一個 GitHub Pages，網址是 `https://你的帳號.github.io/starbox/admin.html`，要輸入密碼才能用。

---

## 步驟 1：登入 Cloudflare

1. 到 https://dash.cloudflare.com 登入你原本的帳號（免費方案就夠，不用升級）。
2. 左邊選單點 **Workers & Pages**。
   - 如果這個帳號以前沒用過 Workers，會要你取一個 `workers.dev` 子網域名稱，隨便取（例如 `tyboy`），記住它。
   - 以前用過的話，子網域已經有了，之後 Worker 網址會是 `https://starbox-mail.<你的子網域>.workers.dev`，在 Worker 頁面右上角可以直接複製。

## 步驟 2：建立 KV（存資料的地方）

1. 左邊選單 **Storage & Databases → KV**。
2. **Create a namespace**，名字填 `starbox`，建立。

## 步驟 3：建立 Worker 並貼上程式

1. **Workers & Pages → Create → Create Worker**（或 Start with Hello World）。
2. 名字填 `starbox-mail`，按 **Deploy**。
3. 按 **Edit code**，把編輯器裡原本的內容全部刪掉，貼上 `backend/worker.js` 的全部內容，按右上 **Deploy**。

## 步驟 4：把 KV 和密碼綁到 Worker

回到這個 Worker 的頁面 → **Settings**：

1. **Bindings → Add → KV namespace**
   - Variable name：`MAIL`（一定要這個名字）
   - KV namespace：選 `starbox`
   - Deploy / Save
2. **Variables and Secrets → Add**，加兩個：
   - Type **Text**，名字 `APP_KEY`，值填一串隨機英數字（例如 `mk8s2x9q4vz1`）。這是她的 App 用的鑰匙。
   - Type **Secret**，名字 `ADMIN_SECRET`，值填**你的後台密碼**（自己取，不要太短）。這是只有你知道的密碼。
   - Deploy / Save

## 步驟 5：確認 Worker 活著

用瀏覽器打開 `https://starbox-mail.你的子網域.workers.dev/`（網址在 Worker 頁面右上角可以複製）。
看到像這樣就成功了：

```
{"ok":true,"service":"starbox-mail","kv":true,"appKey":true,"adminSecret":true}
```

三個都要是 `true`。哪個是 `false` 就回步驟 4 檢查那一項。

## 步驟 6：把網址填進 config.js

打開 `config.js`，找到 `backend` 區塊：

```js
  backend: {
    url: "https://starbox-mail.你的子網域.workers.dev",   // 步驟 5 的網址
    appKey: "mk8s2x9q4vz1",                              // 和步驟 4 的 APP_KEY 一模一樣
  },
```

Commit 上傳到 GitHub。幾分鐘後她重開 App，之前寫的葉子會自動同步到小信箱。

## 步驟 7：在你的手機設定後台

1. 用 Safari 打開 `https://你的帳號.github.io/starbox/admin.html`。
2. 填 Worker 網址和後台密碼（`ADMIN_SECRET`），按「儲存並連線」。
3. 分享 → 加入主畫面，以後從主畫面開。

之後：看到她的葉子通知 → 打開後台 → 點那片葉子 → 選小動物 → 寫信 → 派出去。
她下次打開 App，小動物就會叼著信出現；她收下後，後台那封信會變成「已送達」。

---

## 常見問題

- **後台顯示「連線失敗：密碼不對」**：`ADMIN_SECRET` 打錯，或在 Cloudflare 改過但沒 Deploy。
- **後台看不到她的葉子**：config.js 的 `backend.url` 或 `appKey` 沒填對（`appKey` 要和 Cloudflare 的 `APP_KEY` 一樣），或她還沒重開 App。
- **信一直「待送達」**：她還沒打開 App。App 在打開或回到前景時才會去拉信。
- **想換密碼**：Cloudflare 改 `ADMIN_SECRET` → Deploy → 後台按 ⚙️ 設定重填。
- **管理模式裡的「回信給樹洞」還在**：那是在她手機上直接回的備用方式，兩種都能用。
