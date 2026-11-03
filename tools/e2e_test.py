"""星星小宇宙 e2e 測試：iPhone 尺寸跑完整流程、攔截 ntfy、截圖到 tools/screenshots/
用法：pip install playwright && playwright install chromium && python3 tools/e2e_test.py
測試時會把 config 的 ntfy topic 設成 test-topic、撈星星改成 6 秒、生日設成 11-20（不改到實際檔案）。
"""
import asyncio, json, re, subprocess, sys, time, urllib.request
from playwright.async_api import async_playwright
import os, pathlib
APP=str(pathlib.Path(__file__).resolve().parent.parent)
OUT=str(pathlib.Path(APP)/'tools'/'screenshots'); os.makedirs(OUT, exist_ok=True)
cfg=open(APP+'/config.js',encoding='utf8').read()
cfg=cfg.replace('seconds: 30,','seconds: 6,')
cfg=re.sub(r'topic: "[^"]*",','topic: "test-topic",',cfg,count=1)
cfg=re.sub(r'chance: [\d.]+,','chance: 0,',cfg,count=1)   # 一般流程不讓偷星怪客隨機跳出，後面另外測
BACKEND='http://127.0.0.1:8787'          # 本機模擬的 Worker
BACKEND_URL='http://localhost/api'        # 頁面看到的後台網址（同源，由 Playwright 轉送到 BACKEND，避開 Chrome 的本機網路權限）
cfg=re.sub(r'url: "",(\s*// Worker 網址)',f'url: "{BACKEND_URL}",\\1',cfg,count=1)
cfg=re.sub(r'appKey: "",','appKey: "dev-app-key",',cfg,count=1)
async def main():
  backend=subprocess.Popen([ 'node', str(pathlib.Path(APP)/'tools'/'dev_backend.mjs'), '8787'])
  for _ in range(40):
    try: urllib.request.urlopen(BACKEND+'/'); break
    except Exception: time.sleep(.25)
  try:
    await run()
  finally:
    backend.terminate()
async def run():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=2,is_mobile=True,has_touch=True,
      user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')
    pg=await ctx.new_page()
    errs=[]; sent=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    async def ntfy(route):
      sent.append(json.loads(route.request.post_data)); await route.fulfill(status=200,body='{}',headers={'access-control-allow-origin':'*'})
    await pg.route('https://ntfy.sh/**',ntfy); await pg.route('https://ntfy.sh',ntfy)
    async def files(route):
      path=route.request.url.split('localhost/')[1].split('?')[0] or 'index.html'
      if path=='config.js': return await route.fulfill(body=cfg,content_type='application/javascript')
      if path=='admin.html': return await route.fulfill(body=open(f'{APP}/admin.html','rb').read(),content_type='text/html')
      ct={'html':'text/html','png':'image/png','jpg':'image/jpeg','webmanifest':'application/manifest+json'}.get(path.rsplit('.',1)[-1],'text/plain')
      if not os.path.isfile(f'{APP}/{path}'): return await route.fulfill(status=404,body='')   # 缺檔回 404 而不是當掉
      await route.fulfill(body=open(f'{APP}/{path}','rb').read(),content_type=ct)
    await pg.route('http://localhost/**',files)
    async def api(route):
      resp=await route.fetch(url=BACKEND+route.request.url.split('localhost/api')[1])
      await route.fulfill(response=resp)
    await pg.route('http://localhost/api/**',api)
    await pg.route(re.compile(r'https://fonts\..*'),lambda r: r.fulfill(body='',content_type='text/css'))
    async def clear_modals():
      # 把所有還開著的彈窗（簽到、成就…）按掉，按最後一顆（主要）按鈕
      for _ in range(6):
        m=await pg.query_selector('.modal-bg:not(.out)')
        if not m: break
        btns=await m.query_selector_all('.m-btns .btn')
        if not btns: break
        await btns[-1].click(); await pg.wait_for_timeout(350)
    await pg.goto('http://localhost/'); await pg.wait_for_timeout(800)
    await pg.screenshot(path=f'{OUT}/1-welcome.png')
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/1b-checkin.png')
    await clear_modals()
    await pg.screenshot(path=f'{OUT}/2-home.png',full_page=True)
    # wheel
    await pg.click('.tab[data-page=wheel]'); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/3-wheel.png')
    await pg.click('#spinBtn'); await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f'{OUT}/4-spinning.png')
    await pg.wait_for_timeout(3600)
    await pg.screenshot(path=f'{OUT}/5-spin-result.png')
    # check pointer lands on prize
    res=await pg.evaluate('''()=>{const s=JSON.parse(localStorage.starbox_v1);const k=Object.keys(s.spins)[0];
      const m=getComputedStyle(document.getElementById('wheel')).transform.match(/matrix\\(([^)]+)\\)/)[1].split(',').map(Number);
      let ang=Math.atan2(m[1],m[0])*180/Math.PI; ang=((ang%360)+360)%360; const prizes=APP_CONFIG.wheel.prizes; const seg=360/prizes.length;
      const atTop=((360-ang)%360); return {won:s.spins[k].label, pointerOn:prizes[Math.floor(atTop/seg)].label}}''')
    print('wheel',res)
    await clear_modals()
    # games list
    await pg.click('.tab[data-page=games]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'{OUT}/6-games.png')
    # whack
    await pg.click('[data-game=whack]'); await pg.wait_for_timeout(300)
    await pg.click('#wGo'); await pg.wait_for_timeout(2300)
    for _ in range(40):
      hs=await pg.query_selector_all('.hole.up:not(.hit)')
      for h in hs:
        t=await h.inner_text()
        if '⭐' in t or '💖' in t: await h.dispatch_event('pointerdown')
      await pg.wait_for_timeout(120)
    await pg.screenshot(path=f'{OUT}/7-whack.png')
    await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f'{OUT}/8-whack-end.png')
    await clear_modals()
    # memory: solve perfectly
    await pg.click('[data-game=memory]'); await pg.wait_for_timeout(300)
    syms=await pg.eval_on_selector_all('.mcard .front','els=>els.map(e=>e.textContent)')
    pairs={}
    for i,s in enumerate(syms): pairs.setdefault(s,[]).append(i)
    first=True
    for s,(a,c) in pairs.items():
      await pg.click(f'.mcard[data-i="{a}"]'); await pg.click(f'.mcard[data-i="{c}"]'); await pg.wait_for_timeout(120)
      if first:
        await pg.wait_for_timeout(400); await pg.screenshot(path=f'{OUT}/9-memory.png'); first=False
    await pg.wait_for_timeout(1200)
    await pg.screenshot(path=f'{OUT}/10-memory-end.png')
    await clear_modals()
    # catch：點畫面各處讓月亮移動，接到多少算多少
    await pg.click('[data-game=catch]'); await pg.wait_for_timeout(300)
    await pg.click('#cGo'); await pg.wait_for_timeout(2300)
    box=await pg.eval_on_selector('#cCv','e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}')
    for i in range(45):
      x=box[0]+box[2]*(0.12+0.76*((i*7)%10)/10); y=box[1]+box[3]*0.9
      await pg.mouse.move(x,y); await pg.mouse.down(); await pg.mouse.up()
      if i==12: await pg.screenshot(path=f'{OUT}/10b-catch.png')
      await pg.wait_for_timeout(100)
    await pg.wait_for_timeout(2500)
    await pg.screenshot(path=f'{OUT}/10c-catch-end.png')
    await clear_modals()
    # quiz（config 停用時會跳過）
    if await pg.query_selector('[data-game=quiz]'):
      await pg.click('[data-game=quiz]'); await pg.wait_for_timeout(300)
      for qi in range(5):
        await pg.click('.opt >> nth=0'); await pg.wait_for_timeout(200)
        if qi==0: await pg.screenshot(path=f'{OUT}/11-quiz.png')
        await pg.click('#qNext'); await pg.wait_for_timeout(250)
      await pg.wait_for_timeout(500)
      await pg.screenshot(path=f'{OUT}/12-quiz-end.png')
      await clear_modals()
    else:
      print('quiz disabled, skipped')
    # thief: 強制跳出偷星怪客，故意答錯，確認星星被扣
    before=await pg.evaluate('JSON.parse(localStorage.starbox_v1).points')
    await pg.evaluate("APP_CONFIG.thief.chance=1; document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(600)
    await pg.screenshot(path=f'{OUT}/12b-thief.png')
    await pg.evaluate('''()=>{const bg=document.querySelector('.modal-bg');const q=bg.querySelector('.qtext').textContent;
      const Q=(APP_CONFIG.thief.questions.length?APP_CONFIG.thief.questions:APP_CONFIG.games.quiz.questions).find(x=>x.q===q);
      [...bg.querySelectorAll('.opt')].find(b=>b.textContent!==Q.options[Q.answer]).click()}''')
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/12c-thief-wrong.png')
    after=await pg.evaluate('JSON.parse(localStorage.starbox_v1).points')
    print('thief points',before,'->',after)
    await clear_modals()
    # shop
    await pg.click('.tab[data-page=shop]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'{OUT}/13-shop.png',full_page=True)
    btn=await pg.query_selector('[data-redeem]:not([disabled])')
    if btn:
      await btn.click(); await pg.wait_for_timeout(400); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(600)
      await pg.screenshot(path=f'{OUT}/13b-badge-unlock.png')
      await clear_modals()
      await pg.click('[data-use]'); await pg.wait_for_timeout(300); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(500)
    # 用管理模式加 1000 顆，測命運骰子和刮刮樂
    await pg.click('.tab[data-page=home]'); await pg.wait_for_timeout(300)
    for _ in range(5): await pg.click('#moon')
    await pg.wait_for_timeout(400); await pg.fill('.modal-bg input[name=code]',re.search(r'adminCode:\s*"([^"]+)"',cfg).group(1)); await pg.click('.modal-bg [data-i="1"]'); await pg.wait_for_timeout(400)
    await pg.fill('.modal-bg input[name=pts]','1000'); await pg.click('.modal-bg [data-i="0"]'); await pg.wait_for_timeout(400)
    await clear_modals()
    await pg.click('.tab[data-page=shop]'); await pg.wait_for_timeout(300)
    # 命運骰子
    dice=await pg.query_selector('[data-redeem=dice]:not([disabled])')
    if dice:
      await dice.click(); await pg.wait_for_timeout(400); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(900)
      await pg.screenshot(path=f'{OUT}/13c-dice-rolling.png')
      await pg.wait_for_timeout(1500)
      await pg.screenshot(path=f'{OUT}/13d-dice-result.png')
      print('dice',await pg.inner_text('#diceMsg'))
      await clear_modals()
    # 刮刮樂：用滑鼠把塗層刮掉
    sc=await pg.query_selector('[data-redeem=scratch]:not([disabled])')
    if sc:
      await sc.click(); await pg.wait_for_timeout(400); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(500)
      box=await pg.eval_on_selector('#sCv','e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height]}')
      await pg.mouse.move(box[0]+10,box[1]+10); await pg.mouse.down()
      for row in range(6):
        y=box[1]+12+row*(box[3]-24)/5
        xs=range(0,12) if row%2==0 else range(11,-1,-1)
        for c in xs: await pg.mouse.move(box[0]+10+c*(box[2]-20)/11,y)
        if row==2: await pg.screenshot(path=f'{OUT}/13e-scratch-half.png')
      await pg.mouse.up(); await pg.wait_for_timeout(800)
      await pg.screenshot(path=f'{OUT}/13f-scratch-done.png')
      print('scratch',await pg.inner_text('#sMsg'))
      await clear_modals()
    await pg.screenshot(path=f'{OUT}/14-shop-after.png',full_page=True)
    # wish
    await pg.click('.tab[data-page=wish]'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/15-wish.png')
    await pg.fill('#wishText','希望生日那天可以一起去看海 🌊\n然後吃好多好吃的！')
    await pg.click('#wishGo'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/16-wish-confirm.png')
    await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f'{OUT}/17-wish-sending.png')
    await pg.wait_for_timeout(2600)
    await pg.screenshot(path=f'{OUT}/18-wish-done.png',full_page=True)
    await clear_modals()
    # tree：選心情、寫一片葉子放進樹洞
    await pg.click('.tab[data-page=tree]'); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/18b-tree.png',full_page=True)
    await pg.click('.mood >> nth=2'); await pg.fill('#leafText','今天上班好累，但想到你就開心 🥺')
    await pg.click('#leafGo'); await pg.wait_for_timeout(2200)
    await pg.screenshot(path=f'{OUT}/18c-tree-after.png',full_page=True)
    await clear_modals()
    # 管理模式回信：選第一片葉子、第一隻動物、寫信；再模擬她回到前景收信
    await pg.click('.tab[data-page=home]'); await pg.wait_for_timeout(300)
    for _ in range(5): await pg.click('#moon')
    await pg.wait_for_timeout(400); await pg.fill('.modal-bg input[name=code]',re.search(r'adminCode:\s*"([^"]+)"',cfg).group(1)); await pg.click('.modal-bg [data-i="1"]'); await pg.wait_for_timeout(400)
    await pg.click('.modal-bg [data-i="4"]'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/18d-reply-pick.png')
    await pg.click('.modal-bg:not(.out) .pick >> nth=0'); await pg.wait_for_timeout(400)
    await pg.click('.modal-bg:not(.out) .pick >> nth=1'); await pg.wait_for_timeout(400)
    await pg.fill('.modal-bg:not(.out) textarea[name=text]','看到你累我也心疼，明天帶你去吃好吃的 🧡')
    await pg.click('.modal-bg:not(.out) [data-i="1"]'); await pg.wait_for_timeout(500)
    await clear_modals()
    await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(800)
    await pg.screenshot(path=f'{OUT}/18e-reply-delivered.png')
    print('reply modal',(await pg.inner_text('.modal-bg:not(.out)')).replace(chr(10),' / ')[:120])
    await clear_modals()
    await pg.click('.tab[data-page=tree]'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/18f-tree-reply.png',full_page=True)
    # 回信後台：葉子已同步到本機後台 → 在 admin.html 寫信 → App 回前景收到
    synced=json.loads(urllib.request.urlopen(urllib.request.Request(BACKEND+'/admin/state',headers={'Authorization':'Bearer dev-admin-secret'})).read())
    print('backend leaves',[l['text'][:12] for l in synced['leaves']])
    ad=await ctx.new_page()
    await ad.route('http://localhost/**',files); await ad.route('http://localhost/api/**',api)
    await ad.goto('http://localhost/admin.html'); await ad.wait_for_timeout(500)
    await ad.fill('#url',BACKEND_URL); await ad.fill('#secret','dev-admin-secret'); await ad.click('#saveSetup'); await ad.wait_for_timeout(800)
    await ad.click('.leaf >> nth=0'); await ad.click('.ani >> nth=2'); await ad.fill('#text','小兔幫我帶句話：你今天也很棒 🐰')
    await ad.click('#send'); await ad.wait_for_timeout(800)
    await ad.screenshot(path=f'{OUT}/18g-admin.png',full_page=True)
    print('admin pending',await ad.inner_text('#pending'))
    await pg.evaluate("document.dispatchEvent(new Event('visibilitychange'))"); await pg.wait_for_timeout(1500)
    print('remote reply modal',(await pg.inner_text('.modal-bg:not(.out)')).replace(chr(10),' / ')[:100])
    await pg.screenshot(path=f'{OUT}/18h-remote-reply.png')
    await clear_modals(); await pg.wait_for_timeout(800)
    await ad.click('#refresh'); await ad.wait_for_timeout(800)
    print('admin after',await ad.inner_text('#pending'))
    await ad.close()
    await pg.click('.tab[data-page=home]'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/19-home-after.png',full_page=True)
    # badges page
    await pg.click('[data-go=badges]'); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/20-badges.png',full_page=True)
    await pg.click('#bBack'); await pg.wait_for_timeout(300)
    st=await pg.evaluate('JSON.parse(localStorage.starbox_v1)')
    print('points',st['points'],'plays',st['plays'],'coupons',[(c['name'],c['used']) for c in st['coupons']],'outbox',len(st['outbox']),'wish sent',[w['sent'] for w in st['wishes']])
    print('streak',st['streak'],'stats',st['stats'],'badges',list(st['badges'].keys()))
    print('leaves',[(l['mood'],l['sent'],l.get('synced')) for l in st['leaves']],'replies',[(r['animal']['name'],r['delivered'],r.get('remote',False),r.get('acked')) for r in st['replies']])
    # 星圖全亮彩蛋：把所有成就設成已解鎖後重新載入
    await pg.evaluate("(()=>{const s=JSON.parse(localStorage.starbox_v1);s.badges={};APP_CONFIG.badges.forEach(b=>s.badges[b.id]=Date.now());localStorage.starbox_v1=JSON.stringify(s)})()")
    await pg.reload(); await pg.wait_for_timeout(1500)
    await pg.screenshot(path=f'{OUT}/21-sky-complete.png')
    print('sky modal',(await pg.inner_text('.modal-bg:not(.out)')).replace(chr(10),' / ')[:80])
    await clear_modals()
    await pg.click('[data-go=badges]'); await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/22-sky-alive.png',full_page=True)
    st=await pg.evaluate('JSON.parse(localStorage.starbox_v1)')
    print('skyComplete',bool(st['skyComplete']),'coupons',[c['name'] for c in st['coupons']][:2])
    print('ntfy',json.dumps(sent,ensure_ascii=False))
    print('errors',errs)
    await b.close()
asyncio.run(main())
