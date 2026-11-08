# CLAUDE.md — 星星小宇宙（starbox）

這份檔案寫給接手的 Claude Code，請先讀完再動手。

## 專案是什麼

這是送女友的 11 月生日禮物：一個在 iPhone 上用的互動網頁 App，部署在 **GitHub Pages**（純靜態，沒有後端），讓她用 Safari「加入主畫面」後當 App 使用。

主要功能：
1. **每日輪盤**：一天轉一次，獎賞由使用者在 `config.js` 自訂（可設權重）。抽到 `points` 型就直接加點，其他獎賞變成兌換券。
2. **小遊戲賺點數**（點數叫「星星」）：撈星星（打地鼠）、星座翻牌（記憶配對）、接流星（canvas，拖動月亮接住掉落的流星）。情侶問答已停用但程式保留。每個遊戲每天有次數上限（目前 1 次）。
3. **兌換所**：用星星兌換禮物，兌換後變成兌換券，她按「使用」時會通知男友。品項可加 `dice`（6 個獎勵，兌換時擲骰子動畫 `rollDice`）或 `scratch`（獎品池，兌換時刮刮卡 `scratchCard`），結果在動畫前就決定並寫進兌換券名稱「品名：結果」。
4. **許願瓶**：一天放一次，內容透過 **ntfy**（https://ntfy.sh）推播到男友手機。
5. **綿綿樹洞**：第 6 個分頁。SVG 大樹＋樹洞，她選心情、寫文字後把葉子放進樹洞（不限次數），ntfy 通知男友；葉子累積到門檻會有 emoji 小動物出現在樹旁。

視覺風格是**夢幻星空**：深藍紫夜空、星星閃爍、流星、金色點綴，字型使用 LXGW WenKai TC。

使用者（男友）用繁體中文溝通，在台灣，**介面文字一律用繁體中文（台灣用語）**。

## 檔案結構

```
index.html            App 本體：HTML + CSS + JS 全部寫在這一個檔案，沒有 build 步驟
config.js             所有可自訂的內容（window.APP_CONFIG），給非工程師的使用者手動編輯
manifest.webmanifest  PWA manifest
icon-180/192/512.png  主畫面圖示（tools/make_icons.py 產生）
README.md             給使用者看的部署與設定教學（繁中）
assets/thief.png      偷星怪客的去背圖（config.thief.image）
assets/animals/*.png  樹洞小動物的 Q 版去背圖（config.tree.animals[].image）；PROMPTS.md 是生圖提示詞；原始 .jpg 已 gitignore
tools/cutout.py       白底圖去背成透明 PNG：python3 tools/cutout.py --animals（處理 assets/animals/*.jpg → 英文檔名 .png）
admin.html            男友的回信後台（獨立頁面，讀 config.js 取 moods/animals，連 Cloudflare Worker）
sw.js                 Service Worker：只收主畫面推播（push / notificationclick），刻意沒有 fetch 事件、不做快取
backend/wrangler.toml Worker 的 wrangler 設定（KV、APP_KEY、VAPID 公鑰、生日 cron）；私鑰類全用 wrangler secret
tools/test_push.mjs   Node 單元測試：驗證 worker.js 的 Web Push 加密能解回原文、VAPID JWT 驗得過（node tools/test_push.mjs）
backend/worker.js     Cloudflare Worker：葉子／回信的小信箱 API（KV 綁定 MAIL、變數 APP_KEY、Secret ADMIN_SECRET）
backend/README.md     給使用者的 Cloudflare 設定教學
tools/dev_backend.mjs 本機用記憶體模擬 Worker（node tools/dev_backend.mjs 8787），e2e 會自動啟動
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
    plays: { 'YYYY-MM-DD': { whack: n, memory: n, catch: n, quiz: n } },
    wishes: [{id, day, t, text, sent}],                    // 重置時 day 會被改成 '...#reset'
    coupons: [{id, name, emoji, source:'輪盤'|'兌換', t, used, usedAt}],
    redeemCount: { [shopId]: n },
    outbox: [ntfy 訊息],                                     // 送失敗時暫存，之後自動補送
    thief: { 'YYYY-MM-DD': n },                            // 偷星怪客當天出現次數
    streak: { count, last: 'YYYY-MM-DD', best },           // 連續簽到
    stats: { thiefWins, thiefLoses, quizCorrect, memoryPerfect, whackBest, catchBest, earned, redeems, birthday },  // 成就用累計
    badges: { [badgeId]: unlockedAt },
    leaves: [{id, t, mood, text, sent, replied}],          // 樹洞葉子（sent 由 markSent 透過 leafId 標記）
    replies: [{id, leafId, animal:{emoji,name}, text, t, delivered}],  // 男友在管理模式寫的回信
    skyComplete: 0,                                        // 星圖全亮彩蛋觸發時間（只送一次）
    bday: { '2026': {t, done} },                           // 生日驚喜每年演一次，拆完禮物才算 done
    push: { asked, endpoint, synced },                     // 主畫面推播：上次詢問時間、已回報後台的訂閱 endpoint 與時間
    welcomed, hideA2hs
  }
  ```
  ⚠️ 她的手機上已經有資料以後，**不要改 `STORE_KEY`，也不要做會破壞舊資料的結構變更**。要新增欄位就在 `fresh()` 加預設值（載入時用 `Object.assign(fresh(), saved)` 合併）。
- **ntfy**：`sendNtfy()` 用 JSON 格式 POST 到 server 根路徑（`{topic, title, message, tags, priority}`），這樣中文標題才不會遇到 header 編碼問題，也不會觸發 CORS preflight。`notify()` 失敗時會把訊息放進 `S.outbox`，App 回到前景或 `online` 事件時由 `flushOutbox()` 補送。
- **頁面**：`render.home / wheel / games / shop / wish / tree`（另有無 tab 的 `badges`），由 `go(page)` 切換。大多是整頁用 innerHTML 重繪。輪盤頁例外：只建一次（`wheelBuilt`），之後只呼叫 `updateWheel()`，這樣 canvas 的旋轉角度才不會被重設。
- **輪盤**：用 canvas 畫，扇形從 12 點鐘方向開始順時針排列；轉動是對 canvas 加 CSS `rotate`。第 `idx` 格停在指針下方的角度是 `360 - (idx+0.5)*seg`。**結果在動畫開始前就先寫入 state**，避免她轉到一半關掉 App 就能重轉。
- **遊戲**：都註冊在 `GAMES`（`name / emoji / desc / start(body, stat) / max()`）。共用的機制是 `openGame / closeGame / finishGame` 和 `game.{playing, cleanup}`。遊戲途中離開不扣次數，也不給點數，**只有在 `finishGame` 才會 `addPlay`**。要新增遊戲就照同樣的介面加進 `GAMES`，並在 `config.games` 加上對應的設定區塊。
- **情侶問答目前停用**（`config.games.quiz.enabled: false`），程式碼保留；`games.quiz.questions` 題庫仍是偷星怪客的題目來源，不能刪。怪客答對也會累計 `stats.quizCorrect`。
- **偷星怪客**：`maybeThief()` 在啟動（非首次）和 `visibilitychange` 回前景時依 `config.thief.chance` 擲骰，受 `maxPerDay`、`minPoints` 限制，遊戲中或已有彈窗時不出現。`thiefAttack(q)` 用 `modal({onOpen})` 顯示一題（有 `thief.image` 時圖示用 `<img>`，答對滑走、答錯彈跳）（題庫預設共用 `games.quiz.questions`，`thief.questions` 可覆蓋），答對只記錄、答錯 `addPoints(-steal)`。
- **連續簽到**：`checkin()` 在啟動和 `visibilitychange` 回前景時呼叫，一天一次，依 `config.checkin.rewards` 送星星（超過陣列長度就用最後一個值），斷一天從第 1 天重來。剛簽到的那次不叫偷星怪客。
- **成就徽章**：`config.badges`（缺少時用 `DEFAULT_BADGES`），每個有 `type/goal`，進度由 `badgeProgress()` 算（部分從 `S.stats` 累計，用 `addStat()/maxStat()` 更新；spins/wishes 直接數現有資料）。`checkBadges()` 在輪盤、遊戲結束、兌換、許願、怪客、簽到後呼叫，新解鎖的排進 `badgeQueue`，`showBadgeQueue()` 只在沒彈窗、沒遊戲時顯示（`modal` 關閉與 `closeGame` 都會再觸發）。`render.badges` 是沒有 tab 的頁面（`#p-badges`），從首頁的入口卡進入，用 SVG 畫天蠍座 15 顆星（`SCORPIO`），第 5 顆是心宿二。
- **綿綿樹洞**：`treeCfg()` 合併 `config.tree`（moods、animals 有預設）；`treeSceneSvg()` 畫場景，小動物依 `animals` 排序後對應 `ANIMAL_SPOTS` 位置（有 `image` 就畫 SVG `<image>`，CSS `animalIdle` 浮動、點一下加 `.jump`；有 `blink` 會定時換圖眨眼；沒有 image 退回 emoji `<text>`）；`animalHtml(a, cls)` 給卡片、回信列表、送信彈窗用（`<img>` 載入失敗 onerror 退回 emoji），`animalOf()` 用 name/emoji 把回信裡的 `{emoji,name}` 對回 config 那隻；`submitLeaf()` 寫入 `S.leaves`、`flyLeaf()` 飛葉動畫、`notify({leafId})` 推播，新出現的小動物用 modal 宣布。樹洞分頁在啟動時依 `tree.enabled/tabName` 調整。
- **樹洞回信**：男友在**她的手機**進管理模式按「回信給樹洞」→ `adminReply()` 三步：選葉子、選小動物、寫信（`modal` 的 `onOpen(bg, close)` 讓列表按鈕可以直接關閉彈窗），存進 `S.replies`。`deliverReplies()` 在啟動與回前景時（簽到之後、怪客之前）把未送達的回信用小動物叼信的彈窗顯示，標記 `delivered`，樹洞列表會在該葉子下方顯示回信。
- **回信後台同步**：`config.backend.url/appKey` 有設時，`syncBackend()` 在啟動、回前景、online、放葉子後執行：POST 未同步葉子（`leaf.synced`）、POST 已送達回報（`reply.acked`）、GET 新回信（標 `remote: true` 存進 `S.replies`）。之後 `deliverReplies()` 照常顯示；遠端回信送達時會 ntfy 通知男友並回報後台。所有請求 8 秒逾時、失敗就下次再試，不影響 App 運作。
- **主畫面推播**：`config.push`（`pushCfg()` 有預設；`publicKey` 是 VAPID 公鑰，和 `backend/wrangler.toml` 的 `VAPID_PUBLIC` 同一把，私鑰只在 Cloudflare Secret `VAPID_PRIVATE`）。啟動時 `registerSw()` 註冊 `sw.js`；`maybeAskPush()` 在 `deliverReplies()` 之後、只在主畫面模式（`standalone`）且權限是 `default` 時跳彈窗問她，按「好啊」的 click handler 內直接呼叫 `Notification.requestPermission()`（iOS 要在手勢當下問），「以後再說」隔 `askAgainDays` 天再問（`S.push.asked`）。同意後 `syncPush()` 用 `pushManager.subscribe` 取得訂閱，POST `/push/subscribe` 到 Worker 存進 KV `subs`（同一 endpoint 一天回報一次，啟動與回前景都會呼叫）。Worker 端 `encryptPush()`（RFC 8291 aes128gcm）＋`vapidAuth()`（ES256 JWT）全用 WebCrypto，`pushAll()` 在 `/admin/reply` 後推「XX帶著信／禮物來找你」（不含內容），404/410 的訂閱自動刪；`/admin/push/test` 給 admin.html 的「送一則測試」；`scheduled()` 依 wrangler.toml 的 cron 在生日早上推 `BIRTHDAY_PUSH`。管理模式會顯示推播狀態。e2e 無法真的訂閱（Playwright 擋 SW），只測端點與詢問彈窗；加密正確性由 `tools/test_push.mjs` 驗。
- **主動送信與帶禮物**：admin.html 不選葉子就是主動送的信（`leafId` 空字串，彈窗標題改成「帶著信來找你」）。信可以附 `gift`：`{type:'points', n}` 送星星、`{type:'coupon', name, emoji}` 自訂兌換券、`{type:'shop', id}` 商店品項（不扣星星，直接給一張券；有 `dice`／`scratch` 的品項會照常擲骰／刮刮卡，結果由共用的 `drawPrize(it)` 決定、`playPrize()` 播動畫）。Worker 的 `giftOf()` 會過濾欄位；`GET /replies` 要帶 `?v=2` 才會回附禮物的信，舊版 App 拿不到、也就不會把禮物標成送達弄丟。App 端 `normGift()` 清洗後存進 `reply.gift`；她按「收下禮物」時 `receiveGift(r)` **先寫 state**（`addPoints` 或 `S.coupons.unshift`，source 用 `tree.giftSource`，預設「小動物」）並設 `r.giftTaken`，再播動畫，最後 ntfy 通知男友「收到禮物了」。
- **星圖全亮彩蛋**：`maybeSkyComplete()` 由 `showBadgeQueue` 在佇列清空時呼叫；全部成就解鎖且 `S.skyComplete` 未設時，送 `config.skyComplete.reward` 兌換券（source `成就`）、顯示信件彈窗（`skySvg()` 加 `.cmap.alive` 動畫）。成就頁全亮時也會套 `alive` 並顯示信件卡。
- **生日驚喜**：`config.birthdayParty`（`bdayCfg()` 有預設）。生日當天（`birthdayDays() === 0`）且 `S.bday[年份].done` 未設時，啟動流程在歡迎畫面之後、簽到之前 `await runBirthday()`；`visibilitychange` 回前景也會檢查（跨午夜）。流程全在一個 `.bparty` 全螢幕 overlay（z-index 95，`bdayActive` 期間怪客與成就彈窗不出現）：`cakeSvg()` 蛋糕、按住 `holdSeconds` 秒逐根吹熄（用 rAF 時間戳計時，放開會暫停）→ `bdayFx()` canvas 粒子（煙火 rocket/burst、彩帶 confetti、星星 stars）＋大字 → 前 6 隻 `treeCfg().animals` 搬禮物盒進場（`.parade`）→ 點盒蓋：**先寫 state**（`S.bday`、兌換券 source `生日`、`addPoints(stars)`、ntfy 通知男友）再播星星噴出與計數 → 兌換券卡片「收下」。管理模式「預演生日」= `runBirthday({preview:true})`，不寫 state 也不通知。
- **首頁訊息模板**：`fillTpl()` 會把 `{第幾天}`、`{生日倒數}`、`{名字}` 換成實際值；生日當月且有 `config.birthMonthMessage` 時，「給你的話」卡片改顯示它。
- **管理模式**：在首頁連點月亮 5 下，輸入 `config.adminCode`。可以加減星星、重置今日次數（含怪客、簽到）、測試通知、召喚偷星怪客、回信給樹洞、清除資料。
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
- **Service Worker 只做推播，不做快取**：`sw.js` 刻意沒有 fetch 事件，所以改 config.js 她重開就會拿到新版。如果要加離線支援，必須做版本化，並對 config.js 採用 network-first。
- 資料只存在她的手機（localStorage），沒有雲端同步，這是刻意的設計（不需要後端）。
- 這是公開 repo：`config.js` 裡的題目答案和 ntfy topic 都是公開的，不要放任何真正的密碼或金鑰。

## 測試

```bash
pip install playwright && playwright install chromium
python3 tools/e2e_test.py              # 截圖輸出到 tools/screenshots/
```

這個腳本會用 iPhone 14 的尺寸跑完整流程：歡迎畫面 → 首頁 → 轉輪盤（並檢查指針停的位置和抽到的獎賞一致）→ 三個遊戲 → 兌換和使用兌換券 → 許願瓶。它會攔截 ntfy 請求，印出送出的通知內容，以及 console 錯誤。改完程式碼後請跑一次，並看一下截圖。

e2e 會自動用 `node tools/dev_backend.mjs 8787` 跑一個記憶體版的 Worker，頁面以 `http://localhost/` 為假來源（Playwright route 攔截），後台請求走 `http://localhost/api/**` 再由 Playwright 轉送到 8787——因為新版 Chromium 會擋「網頁直接打本機網路位址」（Local Network Access），正式環境（GitHub Pages → workers.dev）不受影響。

真機測試：`python3 -m http.server 8000`，再用同一個 Wi-Fi 下的 iPhone 開 `http://<電腦IP>:8000`。

## 部署

使用者會手動上傳到 GitHub repo，然後在 Settings → Pages 選 Deploy from branch（`main`、`/root`）。如果你有 git／gh 權限，也可以協助建立 repo 並 push，但**要先問使用者**。

## 目前狀態

v1 已完成，所有功能都用 e2e 測試驗證過。使用者接下來可能會：
- 把 config.js 裡的範例內容（名字、生日、題目、獎賞）換成真的
- （已決定**不做**翻牌合照：使用者擔心公開 repo 外洩，圖片支援的程式碼已移除。若未來要做，照片必須只存在她手機或加密後上傳，不能直接放 repo）
- 追加新功能或新遊戲

上面這些都是使用者還沒決定的事，請依照他實際的要求來做。
