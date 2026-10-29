# CLAUDE.md — 星星小宇宙（starbox）

這份檔案寫給接手的 Claude Code，請先讀完再動手。

## 專案是什麼

這是送女友的 11 月生日禮物：一個在 iPhone 上用的互動網頁 App，部署在 **GitHub Pages**（純靜態，沒有後端），讓她用 Safari「加入主畫面」後當 App 使用。

主要功能：
1. **每日輪盤**：一天轉一次，獎賞由使用者在 `config.js` 自訂（可設權重）。抽到 `points` 型就直接加點，其他獎賞變成兌換券。
2. **小遊戲賺點數**（點數叫「星星」）：撈星星（打地鼠）、星座翻牌（記憶配對）、情侶問答。每個遊戲每天有次數上限。
3. **兌換所**：用星星兌換禮物，兌換後變成兌換券，她按「使用」時會通知男友。
4. **許願瓶**：一天放一次，內容透過 **ntfy**（https://ntfy.sh）推播到男友手機。

視覺風格是**夢幻星空**：深藍紫夜空、星星閃爍、流星、金色點綴，字型使用 LXGW WenKai TC。

使用者（男友）用繁體中文溝通，在台灣，**介面文字一律用繁體中文（台灣用語）**。

## 檔案結構

```
index.html            App 本體：HTML + CSS + JS 全部寫在這一個檔案，沒有 build 步驟
config.js             所有可自訂的內容（window.APP_CONFIG），給非工程師的使用者手動編輯
manifest.webmanifest  PWA manifest
icon-180/192/512.png  主畫面圖示（tools/make_icons.py 產生）
README.md             給使用者看的部署與設定教學（繁中）
tools/make_icons.py   用 Pillow 產生圖示：python3 tools/make_icons.py .
tools/e2e_test.py     Playwright 端對端測試，iPhone 尺寸跑完整流程並截圖
```

GitHub Pages 是直接發佈 repo 根目錄，所以 `index.html` 必須維持在根目錄。

## 架構重點（index.html）

整個 `<script>` 包在一個 IIFE 裡，分成以下幾個區段（有 `/* ===== */` 註解標示）：

- **工具函式**：`$`、`$$`、`esc`（**所有插入 innerHTML 的字串都要經過 esc**）、`dayKey()`（本地日期 `YYYY-MM-DD`，用來判斷每日次數）。
- **狀態 `S`**：存在 `localStorage['starbox_v1']`，`save()` 會寫回。結構如下：
  ```js
  {
    points, history: [{t, icon, text, delta}],
    spins: { 'YYYY-MM-DD': {label, emoji, t, points} },   // 管理模式重置時 key 會被改成 'YYYY-MM-DD#<ts>'
    plays: { 'YYYY-MM-DD': { whack: n, memory: n, quiz: n } },
    wishes: [{id, day, t, text, sent}],                    // 重置時 day 會被改成 '...#reset'
    coupons: [{id, name, emoji, source:'輪盤'|'兌換', t, used, usedAt}],
    redeemCount: { [shopId]: n },
    outbox: [ntfy 訊息],                                     // 送失敗時暫存，之後自動補送
    thief: { 'YYYY-MM-DD': n },                            // 偷星怪客當天出現次數
    welcomed, hideA2hs
  }
  ```
  ⚠️ 她的手機上已經有資料以後，**不要改 `STORE_KEY`，也不要做會破壞舊資料的結構變更**。要新增欄位就在 `fresh()` 加預設值（載入時用 `Object.assign(fresh(), saved)` 合併）。
- **ntfy**：`sendNtfy()` 用 JSON 格式 POST 到 server 根路徑（`{topic, title, message, tags, priority}`），這樣中文標題才不會遇到 header 編碼問題，也不會觸發 CORS preflight。`notify()` 失敗時會把訊息放進 `S.outbox`，App 回到前景或 `online` 事件時由 `flushOutbox()` 補送。
- **頁面**：`render.home / wheel / games / shop / wish`，由 `go(page)` 切換。大多是整頁用 innerHTML 重繪。輪盤頁例外：只建一次（`wheelBuilt`），之後只呼叫 `updateWheel()`，這樣 canvas 的旋轉角度才不會被重設。
- **輪盤**：用 canvas 畫，扇形從 12 點鐘方向開始順時針排列；轉動是對 canvas 加 CSS `rotate`。第 `idx` 格停在指針下方的角度是 `360 - (idx+0.5)*seg`。**結果在動畫開始前就先寫入 state**，避免她轉到一半關掉 App 就能重轉。
- **遊戲**：都註冊在 `GAMES`（`name / emoji / desc / start(body, stat) / max()`）。共用的機制是 `openGame / closeGame / finishGame` 和 `game.{playing, cleanup}`。遊戲途中離開不扣次數，也不給點數，**只有在 `finishGame` 才會 `addPlay`**。要新增遊戲就照同樣的介面加進 `GAMES`，並在 `config.games` 加上對應的設定區塊。
- **偷星怪客**：`maybeThief()` 在啟動（非首次）和 `visibilitychange` 回前景時依 `config.thief.chance` 擲骰，受 `maxPerDay`、`minPoints` 限制，遊戲中或已有彈窗時不出現。`thiefAttack(q)` 用 `modal({onOpen})` 顯示一題（題庫預設共用 `games.quiz.questions`，`thief.questions` 可覆蓋），答對只記錄、答錯 `addPoints(-steal)`。
- **首頁訊息模板**：`fillTpl()` 會把 `{第幾天}`、`{生日倒數}`、`{名字}` 換成實際值；生日當月且有 `config.birthMonthMessage` 時，「給你的話」卡片改顯示它。
- **管理模式**：在首頁連點月亮 5 下，輸入 `config.adminCode`。可以加減星星、重置今日次數（含怪客）、測試通知、召喚偷星怪客、清除資料。
- **特效**：背景星空用 `#sky` canvas，持續播放，分頁隱藏時暫停；慶祝特效 `sparkle()` 畫在 `#fx` canvas 上。
- `modal({icon,title,html,buttons,dismiss})` 回傳 `Promise<{i, values}>`，其中 `values` 是彈窗裡有 `name` 屬性的 input 的值。

## 慣例與限制

- **不要引入框架或 build 工具**。使用者要能在 GitHub 網頁上直接編輯、上傳，保持單一 HTML 檔加一個 config.js 的結構。
- **使用者可調的內容都放 `config.js`**，並且要附上清楚的繁中註解（他不是前端工程師）。程式碼要對缺少的設定欄位有預設值，config 裡少寫東西不能讓 App 壞掉。
- **iPhone Safari／主畫面模式**的注意事項：
  - 有用到 `env(safe-area-inset-*)`、`100dvh`、`touch-action: manipulation`、`-webkit-backdrop-filter`
  - iOS 不支援 `navigator.vibrate`
  - 主畫面 App 和 Safari 的 localStorage 是分開的
  - 遊戲裡的點擊用 `pointerdown`，反應比較快
- **目前刻意不加 Service Worker**：加了的話，使用者改 config.js 後她會一直看到舊版快取。如果要加離線支援，必須做版本化，並對 config.js 採用 network-first。
- 資料只存在她的手機（localStorage），沒有雲端同步，這是刻意的設計（不需要後端）。
- 這是公開 repo：`config.js` 裡的題目答案和 ntfy topic 都是公開的，不要放任何真正的密碼或金鑰。

## 測試

```bash
pip install playwright && playwright install chromium
python3 tools/e2e_test.py              # 截圖輸出到 tools/screenshots/
```

這個腳本會用 iPhone 14 的尺寸跑完整流程：歡迎畫面 → 首頁 → 轉輪盤（並檢查指針停的位置和抽到的獎賞一致）→ 三個遊戲 → 兌換和使用兌換券 → 許願瓶。它會攔截 ntfy 請求，印出送出的通知內容，以及 console 錯誤。改完程式碼後請跑一次，並看一下截圖。

真機測試：`python3 -m http.server 8000`，再用同一個 Wi-Fi 下的 iPhone 開 `http://<電腦IP>:8000`。

## 部署

使用者會手動上傳到 GitHub repo，然後在 Settings → Pages 選 Deploy from branch（`main`、`/root`）。如果你有 git／gh 權限，也可以協助建立 repo 並 push，但**要先問使用者**。

## 目前狀態

v1 已完成，所有功能都用 e2e 測試驗證過。使用者接下來可能會：
- 把 config.js 裡的範例內容（名字、生日、題目、獎賞）換成真的
- 把翻牌圖案換成合照（放在 `photos/`，`symbols` 改成檔案路徑；程式已經支援圖片）
- 追加新功能或新遊戲

上面這些都是使用者還沒決定的事，請依照他實際的要求來做。
