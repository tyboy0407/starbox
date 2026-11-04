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

  /* ---------- 綿綿樹洞 ----------
   * 一棵大樹，綿綿可以把心情寫在葉子上放進樹洞（不限次數），你會立刻收到通知。
   * 葉子越多，越多小動物會被吸引來樹洞旁作伴。 */
  tree: {
    enabled: true,                   // 改 false 就不會出現樹洞分頁
    tabName: "樹洞",                 // 下方分頁顯示的字（2 個字最剛好）
    title: "綿綿樹洞",
    intro: "躲進樹洞裡，把心情寫在葉子上放進去，\n球球會在第一時間收到",
    avatar: "🐑",                    // 躲在樹洞裡的小傢伙
    notify: true,                    // 放葉子時通知你（走 ntfy）
    // 心情選項：label 顯示文字、emoji 圖示、color 葉子顏色（通知也會帶上心情）
    moods: [
      { key: "happy", label: "開心", emoji: "😊", color: "#8fd694" },
      { key: "calm",  label: "平靜", emoji: "😌", color: "#ffe08a" },
      { key: "miss",  label: "想你", emoji: "🥺", color: "#ffb3d9" },
      { key: "tired", label: "好累", emoji: "😮‍💨", color: "#c9b8ff" },
      { key: "sad",   label: "難過", emoji: "😢", color: "#8fb8ff" },
      { key: "angry", label: "生氣", emoji: "😤", color: "#ff9b8a" },
    ],
    // 小動物：樹洞裡的葉子累積到 count 片就會出現（最多 10 隻，依順序安排在樹旁不同位置）
    animals: [
      { count: 1,  emoji: "🐦", name: "小鳥" },
      { count: 3,  emoji: "🐿️", name: "松鼠" },
      { count: 6,  emoji: "🐰", name: "小兔" },
      { count: 10, emoji: "🦔", name: "刺蝟" },
      { count: 15, emoji: "🦉", name: "貓頭鷹" },
      { count: 20, emoji: "🦌", name: "小鹿" },
      { count: 30, emoji: "🦊", name: "狐狸" },
      { count: 40, emoji: "🦋", name: "蝴蝶" },
      { count: 55, emoji: "🐻", name: "小熊" },
      { count: 70, emoji: "🐼", name: "貓熊" },
    ],
  },

  /* ---------- 星圖全亮的終極彩蛋 ----------
   * 天蠍座成就星圖 14 顆星全部點亮時，星圖會動起來，並出現這封信和一張兌換券。
   * 可以用 {名字}。 */
  skyComplete: {
    title: "給點亮整片星空的你",
    text: "{名字}：\n\n你把這片星空的每一顆星都點亮了。\n每一顆星，都是你認真生活、認真愛我的一天。\n\n謝謝你每天打開這個小宇宙，\n謝謝你把心情放進樹洞，\n謝謝你讓我的世界有光。\n\n這張萬能願望券送給你，\n不管你許什麼願，我都會努力實現。\n\n永遠愛你的寶球 💜",
    reward: "萬能願望券",            // 會直接放進她的兌換券；留空 "" 就不送
    rewardEmoji: "👑",
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
   *   quizCorrect   問答累積答對題數（情侶問答＋偷星怪客的題目都算）
   *   memoryPerfect 星座翻牌完美通關（8 步）次數
   *   whackBest     撈星星單局最高分
   *   catchBest     接流星單局最高分
   *   wishes        放許願瓶次數
   *   leaves        放進樹洞的葉子數
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
    { id: "quiz20",   name: "最懂寶球",   emoji: "💞", type: "quizCorrect",   goal: 20,   desc: "答對偷星怪客的問題 20 次" },
    { id: "memory3",  name: "過目不忘",   emoji: "🃏", type: "memoryPerfect", goal: 3,    desc: "星座翻牌完美通關 3 次" },
    { id: "whack30",  name: "撈星高手",   emoji: "⭐", type: "whackBest",     goal: 30,   desc: "撈星星單局拿到 30 分" },
    { id: "thief5",   name: "怪客剋星",   emoji: "🛡️", type: "thiefWins",     goal: 5,    desc: "趕走偷星怪客 5 次" },
    { id: "rich",     name: "星星富翁",   emoji: "💰", type: "earned",        goal: 1000, desc: "累積獲得 1000 顆星星" },
    { id: "month",    name: "月亮常客",   emoji: "🌙", type: "streak",        goal: 30,   desc: "連續簽到 30 天" },
    { id: "catch30",  name: "流星獵人",   emoji: "🌠", type: "catchBest",     goal: 30,   desc: "接流星單局接到 30 分" },
    { id: "leaf10",   name: "樹洞知己",   emoji: "🍃", type: "leaves",        goal: 10,   desc: "在樹洞放了 10 片心情葉子" },
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

  /* ---------- 回信後台（Cloudflare Worker） ----------
   * 設好之後你可以在自己手機上回她的樹洞葉子。設定步驟看 backend/README.md。
   * 兩個都留空 "" 就是不用後台（管理模式裡的「回信給樹洞」還是可以用）。 */
  backend: {
    url: "https://starbox-mail.dylanworkersdev.workers.dev",   // Worker 網址
    appKey: "cd39ccba5e3ebd22",      // 要和 Cloudflare 裡設的 APP_KEY 一模一樣（這把鑰匙本來就會公開在網頁裡，後台密碼才是真正的秘密）
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
   * dice：填 6 個獎勵名稱的話，兌換時會擲骰子決定拿到哪一個（例如「命運骰子」）
   * scratch：填一串獎品名稱的話，兌換時會出現刮刮卡，刮開才知道抽到哪一個（例如「刮刮樂」）
   * 兌換後會變成「兌換券」，她拿給你兌現 */
  shop: [
    { id: "box",     name: "神秘小盒子",      emoji: "🎁", cost: 120,   desc: "我準備的小東西，開了才知道" },
    { id: "dice",    name: "命運骰子",        emoji: "🎲", cost: 160,   desc: "擲骰決定今天的驚喜",
      // 兌換後 App 裡會擲骰子，1～6 點各對應下面一個獎勵，兌換券上會寫骰到的結果
      dice: ["抱抱一分鐘", "手搖飲一杯", "按摩 15 分鐘", "寶球做早餐", "神秘小禮物", "今天你說了算"] },
    { id: "task",    name: "寶球的秘密任務",  emoji: "💌", cost: 200,  desc: "兌換後 24 小時內，我會做一件讓你開心的事" },
    { id: "scratch", name: "刮刮樂",          emoji: "🎟️", cost: 150,  desc: "App 裡刮開才知道獎品",
      // 兌換後出現一張刮刮卡，用手指刮開看獎品；獎品從下面隨機抽一個（想提高某個機率就多寫幾次）
      // 寫「再刮一次」的話，刮到它會免費再刮一張（第二張不會再刮到它）
      scratch: ["寶球做一次早餐（菜色驚喜）", "開盲盒（一起拆）", "神秘餐廳（到門口才知道）", "網購免單一次（500 元內）",
                "夜市大冒險（你指路，想吃的全買）", "寶球畫你的畫像（再醜也要掛起來）", "收手機散步一小時（只能聊天）", "再刮一次"] },
    { id: "movie",   name: "電影約會",        emoji: "🎬", cost: 300,  desc: "當然是我請客啦" },
    { id: "photo",   name: "約會攝影日",      emoji: "📸", cost: 350,  desc: "出門拍一整天美照，我當攝影師兼提包" },
    { id: "trip",    name: "一日小旅行",      emoji: "🚗", cost: 800,  desc: "地點你選，行程我排", limit: 1 },
    { id: "mystery", name: "神秘禮物",        emoji: "🎁", cost: 1000, desc: "猜猜是什麼？", limit: 1 },
    { id: "wish",    name: "萬能願望券",      emoji: "👑", cost: 2000, desc: "任何要求都答應（合理範圍內 😆）", limit: 1 },
  ],

  /* ---------- 小遊戲 ---------- */
  games: {
    maxPlaysPerDay: 1,             // 每個遊戲每天可以玩幾次（個別遊戲可再覆蓋）

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

    // 接流星（左右拖動月亮，接住掉下來的流星）
    catch: {
      enabled: true,
      seconds: 30,                 // 一局幾秒
      pointsPerScore: 1,           // 每 1 分換幾顆星星
      maxPoints: 40,               // 一局最多拿幾顆星星
      speed: 1,                    // 流星掉落速度倍率（1 = 正常，0.8 慢一點，1.2 快一點）
    },

    // 情侶問答（目前停用：enabled 設 false 就不會出現在遊戲列表）
    // ⚠️ 下面的 questions 題庫「偷星怪客」還會用到，請不要刪掉
    quiz: {
      enabled: false,
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
