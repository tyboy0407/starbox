# ✦ 星星小宇宙 — 部署與設定說明

一個可以加到 iPhone 主畫面的生日禮物網頁 App：每日輪盤、三個小遊戲賺星星、星星兌換禮物、每日許願瓶（用 ntfy 推播到你手機）、連續簽到、偷星怪客、天蠍座成就星圖。

## 檔案

| 檔案 | 用途 |
|---|---|
| `index.html` | App 本體，不用動 |
| `config.js` | **所有內容都在這裡改**：名字、輪盤獎賞、兌換品、題目、ntfy |
| `manifest.webmanifest`、`icon-*.png` | 主畫面圖示 |

---

## 步驟 1：設定 ntfy（收許願瓶通知）

1. 你的手機去 App Store 下載 **ntfy**。
2. 打開 ntfy → 右上 **＋** → 輸入一個 topic 名字（例如 `starbox-k8x2m9qa`，**越亂越好**，因為知道名字的人都能看到訊息）→ 訂閱。
3. 打開 `config.js`，把同一個名字填進：
   ```js
   topic: "starbox-k8x2m9qa",
   ```
4. 記得在 iPhone「設定 → 通知 → ntfy」把通知打開。

會通知你的事情（可在 `config.js` 的 `ntfy` 裡關掉）：
- 💌 她放許願瓶（內容全文）
- 🎁 她兌換禮物、🎟️ 她使用兌換券
- 🎡 她今天轉到什麼

她當下沒網路的話，訊息會先存著，下次打開 App 自動補送。

## 步驟 2：改內容

打開 `config.js` 照註解改。最重要的：
- `herName`、`fromName`、`birthday`（格式 `"11-20"`）
- `wheel.prizes`：輪盤獎賞，`weight` 越大越容易中；填了 `points` 就是直接加星星
- `shop`：兌換品與價格
- `games.quiz.questions`：**範例題目一定要換成你們的**，`answer` 是正確選項的位置（從 0 開始數）
- `checkin.rewards`：連續簽到第 1～7 天各送幾顆星星
- `badges`：成就清單，`type` 和 `goal` 決定怎麼達成（註解有列出可用的種類）
- `adminCode`：管理模式密碼

> 翻牌遊戲刻意只用表情符號、不放合照：這是公開 repo，放上去的照片任何人都看得到。

## 步驟 3：放上 GitHub Pages

1. 到 GitHub 按 **New repository**，名字隨意（例如 `starbox`），選 **Public**，建立。
2. 在 repo 頁面點 **Add file → Upload files**，把這個資料夾裡的檔案全部拖進去 → **Commit changes**。
   （檔案要在 repo 最上層，不要多包一層資料夾。）
3. 進 **Settings → Pages**，Source 選 **Deploy from a branch**，Branch 選 `main`、資料夾 `/ (root)` → **Save**。
4. 等 1～2 分鐘，網址會是 `https://你的帳號.github.io/starbox/`。

> 免費版 GitHub Pages 的 repo 是公開的，有心人看得到 `config.js`（含題目答案和 topic）。一般不會有人去翻，介意的話 topic 取亂一點就好。

## 步驟 4：送給她

1. 用**她的 iPhone、Safari** 打開網址。
2. 點下方「分享」→「**加入主畫面**」。
3. 之後都從主畫面的月亮圖示打開。

⚠️ 資料（星星、兌換券、紀錄）存在她手機裡。**主畫面 App 和 Safari 的資料是分開的**，所以請她固定從主畫面打開。換手機或刪掉主畫面圖示，資料會不見。

## 管理模式

首頁**連點月亮 🌙 五下** → 輸入 `adminCode`：
- 加 / 扣星星（例如偷偷送她 100 顆）
- 重置今天的輪盤、遊戲、許願瓶次數（測試用）
- 測試 ntfy 通知
- 清除全部資料

建議送出前先用你自己的手機跑一遍、按「測試通知」確認收得到。你手機上的測試資料不會影響她的手機。

## 之後想改內容

直接在 GitHub 上點 `config.js` → 鉛筆圖示編輯 → Commit。幾分鐘後她重新打開 App 就會更新，**她的星星和紀錄不會被清掉**。
（如果改了輪盤獎賞的名字，以前抽過的紀錄還在，只是今天的指針位置會從頭開始。）
