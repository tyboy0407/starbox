/* =========================================================
 *  ✦ 星星小宇宙 — 設定檔
 *  這個檔案裡的東西都可以自己改，改完存檔、上傳到 GitHub 就會生效。
 *  注意：文字要放在 "引號" 裡，每一項後面要有逗號。
 * ========================================================= */
window.APP_CONFIG = {

  /* ---------- 基本資料 ---------- */
  appTitle: "星星小宇宙",          // App 名稱（顯示在最上面）
  herName: "綿綿",                 // 她的名字／暱稱
  fromName: "寶球",                // 你的署名
  tagline: "今天也要閃閃發光 ✨",     // 首頁打招呼下面那行小字
  birthday: "11-21",               // 她的生日，格式 "11-21"（月-日）；留空就不顯示倒數

  // 第一次打開時的歡迎訊息
  welcomeMessage: "這是我做給你的小宇宙。\n每天來轉轉輪盤、玩玩遊戲、許個願吧！",

  // 首頁「給你的話」卡片（留空 "" 就不顯示）
  homeMessage: "生日快樂！\n希望你每天打開這裡都會笑一下。\n愛你 💜",

  // 生日月限定：整個生日那個月（依 birthday 的月份）首頁「給你的話」會改顯示這段，
  // 其他月份則顯示上面的 homeMessage。留空 "" 就一律顯示 homeMessage。
  // 可以用的自動替換字：
  //   {第幾天}   → 今天是這個月的第幾天（例如 11/3 就是 3）
  //   {生日倒數} → 距離生日還有幾天（生日當天是 0）
  //   {名字}     → herName
  birthMonthMessage: "祝福世界上最可愛的寶寶生日月到了，今天是生日月的第 {第幾天} 天",

  /* ---------- 星星（點數） ---------- */
  pointName: "星星",
  pointEmoji: "⭐",
  startingPoints: 50,              // 第一次打開送的見面禮

  /* ---------- 管理模式 ----------
   * 在首頁連點月亮 🌙 五下，輸入這組密碼就能：
   * 加減星星、重置今天的次數、測試通知、清除資料 */
  adminCode: "040711",

  /* ---------- ntfy 通知 ----------
   * 1. iPhone 下載「ntfy」App
   * 2. 按 + 訂閱一個 topic，名字取一串別人猜不到的（例如 starbox-ab38x9k2）
   * 3. 把同一個名字填進下面的 topic
   * 任何知道 topic 名字的人都能看到訊息，所以名字越亂越好。 */
  ntfy: {
    server: "https://ntfy.sh",
    topic: "peznl",                // ← 填你的 topic 名字
    notifyWish: true,              // 她放許願瓶時通知你（主要功能）
    notifyRedeem: true,            // 她兌換禮物、使用兌換券時通知你
    notifySpin: true,              // 她轉輪盤時通知你抽到什麼
  },

  /* ---------- 偷星怪客 ----------
   * 她打開 App 時有一定機率跳出偷星怪客，要答對一題才能把牠趕走，
   * 答錯的話牠會偷走一些星星。題目預設用下面「情侶問答」的題庫。 */
  thief: {
    enabled: true,
    chance: 0.3,                   // 每次打開 App 出現的機率（0～1，0.3 就是 30%）
    steal: 15,                     // 答錯會被偷走幾顆星星（最多扣到 0，不會變負的）
    maxPerDay: 1,                  // 一天最多出現幾次
    minPoints: 10,                 // 星星少於這個數字就不會出現（沒東西好偷）
    name: "偷星怪客",
    emoji: "👾",
    // 想給怪客專屬題目就填在這裡（格式和情侶問答一樣）；留空 [] 就用情侶問答的題庫
    questions: [],
  },

  /* ---------- 每日輪盤 ----------
   * label：顯示的文字（4 個字以內最好看，最多 8 個字）
   * emoji：圖示
   * points：如果填了，抽中就直接加這麼多星星；沒填就變成一張兌換券
   * weight：機率權重，數字越大越容易抽中（全部填 1 就是平均）
   * 建議 6～10 格 */
  wheel: {
    prizes: [
      { label: "抱抱一分鐘", emoji: "🤗", weight: 3 },
      { label: "+20 星星",   emoji: "⭐", points: 20, weight: 3 },
      { label: "按摩15分鐘", emoji: "💆", weight: 2 },
      { label: "手搖飲一杯", emoji: "🧋", weight: 2 },
      { label: "+50 星星",   emoji: "🌟", points: 50, weight: 1 },
      { label: "親親一下",   emoji: "😘", weight: 3 },
      { label: "甜點一份",   emoji: "🍰", weight: 2 },
      { label: "今天你最大", emoji: "👑", weight: 1 },
    ],
    // 輪盤格子顏色（會依序輪流使用）
    colors: ["#3b2a8c", "#5b2f9e", "#22357f", "#7a3a9c"],
  },

  /* ---------- 兌換所 ----------
   * id：英文代號，每個要不一樣
   * cost：需要幾顆星星
   * limit：最多能兌換幾次（不填就是無限）
   * 兌換後會變成「兌換券」，她拿給你兌現 */
  shop: [
    { id: "drink",   name: "手搖飲一杯",       emoji: "🧋", cost: 60,  desc: "任選一家，我去買" },
    { id: "dessert", name: "甜點任選",         emoji: "🍰", cost: 80,  desc: "蛋糕、冰淇淋都可以" },
    { id: "massage", name: "全身按摩 30 分鐘",  emoji: "💆", cost: 120, desc: "專業級（自稱）" },
    { id: "chores",  name: "家事全包一天",      emoji: "🧹", cost: 150, desc: "你只要負責躺著" },
    { id: "movie",   name: "電影約會",         emoji: "🎬", cost: 200, desc: "電影票、爆米花我請" },
    { id: "dinner",  name: "大餐一頓",         emoji: "🍜", cost: 250, desc: "想吃什麼都帶你去" },
    { id: "mystery", name: "神秘禮物",         emoji: "🎁", cost: 400, desc: "猜猜是什麼？", limit: 1 },
    { id: "wish",    name: "萬能願望券",        emoji: "👑", cost: 500, desc: "任何要求都答應（合理範圍內 😆）", limit: 1 },
  ],

  /* ---------- 小遊戲 ---------- */
  games: {
    maxPlaysPerDay: 3,             // 每個遊戲每天可以玩幾次（個別遊戲可再覆蓋）

    // 撈星星（打地鼠）
    whack: {
      enabled: true,
      seconds: 30,                 // 一局幾秒
      pointsPerHit: 1,             // 每 1 分換幾顆星星
      maxPoints: 40,               // 一局最多拿幾顆星星
    },

    // 星座翻牌（翻牌配對）
    memory: {
      enabled: true,
      // 8 種圖案。目前設定成合照：把 8 張照片放進 photos 資料夾，檔名 1.jpg ～ 8.jpg（正方形最好看）
      // 照片還沒放上去的話，翻牌會先用表情符號代替；想永久改回表情符號就換成下面這行：
      // symbols: ["🌙", "⭐", "🪐", "☄️", "🌸", "💜", "🐰", "🍓"],
      symbols: ["photos/1.jpg", "photos/2.jpg", "photos/3.jpg", "photos/4.jpg", "photos/5.jpg", "photos/6.jpg", "photos/7.jpg", "photos/8.jpg"],
      maxPoints: 40,               // 完美通關（8 步）拿到的星星
      minPoints: 10,               // 最少保底
      penaltyPerExtraMove: 2,      // 每多一步扣幾顆
    },

    // 情侶問答
    quiz: {
      enabled: true,
      questionsPerRound: 5,        // 每局隨機抽幾題
      pointsPerCorrect: 8,         // 答對一題幾顆星星
      perfectBonus: 10,            // 全對額外加碼
      // answer 是正確答案的位置：第一個選項是 0，第二個是 1，以此類推
      // note 是答完後顯示的小補充（可不填）
      // 題目越多，每次玩越不會重複
      questions: [
        { q: "我們在一起的那天去哪裡玩？", options: ["麗寶outlet", "三井outlet", "鰲峰山", "LaLaport"], answer: 0, note: "那天的你超可愛！" },
        // ⚠️ 下面還是範例題目，記得換成你們自己的！
        { q: "我們第一次約會去了哪裡？", options: ["看電影", "吃火鍋", "逛夜市", "去咖啡廳"], answer: 1, note: "那天你吃超多 😆" },
        { q: "我最喜歡你的哪一點？", options: ["笑起來的樣子", "很會撒嬌", "很懂我", "全部都喜歡"], answer: 3, note: "這題沒有其他答案" },
        { q: "我最愛吃的食物是？", options: ["拉麵", "牛排", "滷肉飯", "壽司"], answer: 0 },
        { q: "我們在一起的紀念日是幾月？", options: ["3 月", "6 月", "9 月", "12 月"], answer: 2 },
        { q: "我生氣的時候怎麼哄最有效？", options: ["買好吃的", "抱抱", "講笑話", "讓我靜一靜"], answer: 1 },
        { q: "我最想跟你一起去的地方是？", options: ["日本", "冰島", "澳洲", "韓國"], answer: 1, note: "一起去看極光吧" },
        { q: "我手機裡存最多的照片是？", options: ["食物", "風景", "你", "貓"], answer: 2 },
        { q: "我第一次說喜歡你是在哪裡？", options: ["車上", "電話裡", "公園", "餐廳"], answer: 0 },
      ],
    },
  },
};
