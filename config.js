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

  /* ---------- 連續簽到 ----------
   * 每天第一次打開 App 會自動簽到送星星，連續天數越多送越多；
   * 中斷一天就從第 1 天重來。rewards 是第 1～7 天各送幾顆，第 8 天以後都送最後一個數字。 */
  checkin: {
    enabled: true,
    rewards: [5, 8, 10, 12, 15, 20, 30],
  },

  /* ---------- 成就徽章（天蠍座星圖） ----------
   * 每個成就是星圖上的一顆星，達成就會亮起來（最多 15 個，天蠍座有 15 顆星）。
   * 第 5 個成就會放在天蠍座的心臟「心宿二」，是最大的那顆星。
   * type 可以填的種類（goal 是目標數字）：
   *   streak        連續簽到天數
   *   spins         轉輪盤次數
   *   thiefWins     趕走偷星怪客次數
   *   quizCorrect   情侶問答累積答對題數
   *   memoryPerfect 星座翻牌完美通關（8 步）次數
   *   whackBest     撈星星單局最高分
   *   wishes        放許願瓶次數
   *   redeems       兌換禮物次數
   *   earned        累積獲得的星星總數（只算加的，不算扣的）
   *   birthday      生日當天打開 App（goal 填 1） */
  badges: [
    { id: "first",    name: "初次見面",   emoji: "🌱", type: "streak",        goal: 1,    desc: "第一次簽到" },
    { id: "wheel7",   name: "幸運之輪",   emoji: "🎡", type: "spins",         goal: 7,    desc: "轉了 7 次輪盤" },
    { id: "redeem1",  name: "第一份禮物", emoji: "🎁", type: "redeems",       goal: 1,    desc: "第一次用星星兌換禮物" },
    { id: "wish10",   name: "許願常客",   emoji: "💌", type: "wishes",        goal: 10,   desc: "放出 10 個許願瓶" },
    { id: "bday",     name: "生日快樂",   emoji: "🎂", type: "birthday",      goal: 1,    desc: "生日當天打開小宇宙" },
    { id: "week",     name: "七日星光",   emoji: "🌟", type: "streak",        goal: 7,    desc: "連續簽到 7 天" },
    { id: "quiz20",   name: "最懂寶球",   emoji: "💞", type: "quizCorrect",   goal: 20,   desc: "情侶問答累積答對 20 題" },
    { id: "memory3",  name: "過目不忘",   emoji: "🃏", type: "memoryPerfect", goal: 3,    desc: "星座翻牌完美通關 3 次" },
    { id: "whack30",  name: "撈星高手",   emoji: "⭐", type: "whackBest",     goal: 30,   desc: "撈星星單局拿到 30 分" },
    { id: "thief5",   name: "怪客剋星",   emoji: "🛡️", type: "thiefWins",     goal: 5,    desc: "趕走偷星怪客 5 次" },
    { id: "rich",     name: "星星富翁",   emoji: "💰", type: "earned",        goal: 1000, desc: "累積獲得 1000 顆星星" },
    { id: "month",    name: "月亮常客",   emoji: "🌙", type: "streak",        goal: 30,   desc: "連續簽到 30 天" },
  ],

  /* ---------- 偷星怪客 ----------
   * 她打開 App 時有一定機率跳出偷星怪客，要答對一題才能把牠趕走，
   * 答錯的話牠會偷走一些星星。題目預設用下面「情侶問答」的題庫。 */
  thief: {
    enabled: true,
    chance: 0.4,                   // 每次打開 App 出現的機率（0～1，0.4 就是 40%）
    steal: 15,                     // 答錯會被偷走幾顆星星（最多扣到 0，不會變負的）
    maxPerDay: 1,                  // 一天最多出現幾次
    minPoints: 10,                 // 星星少於這個數字就不會出現（沒東西好偷）
    name: "偷星怪客",
    image: "assets/thief.png",     // 怪客的圖片（去背 PNG，放在 assets 資料夾）；留空 "" 就改用下面的 emoji
    emoji: "👾",                   // 紀錄列表用的小圖示；沒有 image 時彈窗也用它
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
      { label: "+20 星星",         emoji: "⭐", points: 20, weight: 3 },
      { label: "+10 星星",         emoji: "✨", points: 10, weight: 3 },
      { label: "可以許願吃小點心", emoji: "🍪", weight: 3 },
      { label: "手搖飲一杯",       emoji: "🧋", weight: 2 },
      { label: "按摩15分鐘",       emoji: "💆", weight: 2 },
      { label: "甜點一份",         emoji: "🍰", weight: 2 },
      { label: "神秘小禮物",       emoji: "🎁", weight: 1 },
      { label: "今天你最大",       emoji: "👑", weight: 1 },
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
    { id: "drink",   name: "手搖飲一杯",      emoji: "🧋", cost: 60,   desc: "任選一家，我去買" },
    { id: "snack",   name: "零食補給包",      emoji: "🍪", cost: 50,   desc: "便利商店隨便抓三樣" },
    { id: "dessert", name: "甜點任選",        emoji: "🍰", cost: 120,  desc: "蛋糕、冰淇淋、鬆餅都可以" },
    { id: "massage", name: "全身按摩 30 分鐘", emoji: "💆", cost: 150,  desc: "專業級" },
    { id: "movie",   name: "電影約會",        emoji: "🎬", cost: 300,  desc: "當然是我請客啦" },
    { id: "photo",   name: "約會攝影日",      emoji: "📸", cost: 350,  desc: "出門拍一整天美照，我當攝影師兼提包" },
    { id: "trip",    name: "一日小旅行",      emoji: "🚗", cost: 800,  desc: "地點你選，行程我排", limit: 1 },
    { id: "mystery", name: "神秘禮物",        emoji: "🎁", cost: 1000, desc: "猜猜是什麼？", limit: 1 },
    { id: "wish",    name: "萬能願望券",      emoji: "👑", cost: 2000, desc: "任何要求都答應（合理範圍內 😆）", limit: 1 },
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
      // 8 種圖案（表情符號），可以換成你們喜歡的
      symbols: ["🌙", "⭐", "🪐", "☄️", "🌸", "💜", "🐰", "🍓"],
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
        { q: "寶球跟綿綿第一次一起買的情侶鞋是哪個牌子？", options: ["New Balance", "Adidas", "Nike", "Converse"], answer: 1, note: "我喜歡跟你一起買的 Adidas Samba！" },
        { q: "寶球跟綿綿第一次一起出去的縣市是？", options: ["台北", "高雄", "台南", "新竹"], answer: 2, note: "喜歡跟你一起去海邊踏踏浪的感覺 ❤️" },
        { q: "寶球【目前】最想養的寵物是？", options: ["鼠鼠", "守宮", "貓咪", "狗狗"], answer: 1, note: "守宮摸起來滑滑冰冰的！" },
        { q: "寶球跟綿綿總共一起去過幾個縣市玩（不含台中）？", options: ["5 個", "7 個", "9 個", "11 個"], answer: 3, note: "之後要再蒐集更多地方的回憶！" },
        { q: "寶球跟綿綿今年在一起是第幾年？", options: ["2 年", "3 年", "4 年", "5 年"], answer: 1, note: "以後也請多多指教！" },
      ],
    },
  },
};
