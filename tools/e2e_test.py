"""星星小宇宙 e2e 測試：iPhone 尺寸跑完整流程、攔截 ntfy、截圖到 tools/screenshots/
用法：pip install playwright && playwright install chromium && python3 tools/e2e_test.py
測試時會把 config 的 ntfy topic 設成 test-topic、撈星星改成 6 秒、生日設成 11-20（不改到實際檔案）。
"""
import asyncio, json, re
from playwright.async_api import async_playwright
import os, pathlib
APP=str(pathlib.Path(__file__).resolve().parent.parent)
OUT=str(pathlib.Path(APP)/'tools'/'screenshots'); os.makedirs(OUT, exist_ok=True)
cfg=open(APP+'/config.js',encoding='utf8').read()
cfg=cfg.replace('seconds: 30,','seconds: 6,')
cfg=re.sub(r'topic: "[^"]*",','topic: "test-topic",',cfg,count=1)
cfg=re.sub(r'chance: [\d.]+,','chance: 0,',cfg,count=1)   # 一般流程不讓偷星怪客隨機跳出，後面另外測
async def main():
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
      path=route.request.url.split('localtest/')[1].split('?')[0] or 'index.html'
      if path=='config.js': return await route.fulfill(body=cfg,content_type='application/javascript')
      ct={'html':'text/html','png':'image/png','jpg':'image/jpeg','webmanifest':'application/manifest+json'}.get(path.rsplit('.',1)[-1],'text/plain')
      if not os.path.isfile(f'{APP}/{path}'): return await route.fulfill(status=404,body='')   # 缺檔回 404 而不是當掉
      await route.fulfill(body=open(f'{APP}/{path}','rb').read(),content_type=ct)
    await pg.route('http://localtest/**',files)
    await pg.route(re.compile(r'https://fonts\..*'),lambda r: r.fulfill(body='',content_type='text/css'))
    await pg.goto('http://localtest/'); await pg.wait_for_timeout(800)
    await pg.screenshot(path=f'{OUT}/1-welcome.png')
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(400)
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
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(300)
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
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(400)
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
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(400)
    # quiz
    await pg.click('[data-game=quiz]'); await pg.wait_for_timeout(300)
    for qi in range(5):
      await pg.click('.opt >> nth=0'); await pg.wait_for_timeout(200)
      if qi==0: await pg.screenshot(path=f'{OUT}/11-quiz.png')
      await pg.click('#qNext'); await pg.wait_for_timeout(250)
    await pg.wait_for_timeout(500)
    await pg.screenshot(path=f'{OUT}/12-quiz-end.png')
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(400)
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
    await pg.click('.modal-bg .btn'); await pg.wait_for_timeout(400)
    # shop
    await pg.click('.tab[data-page=shop]'); await pg.wait_for_timeout(300)
    await pg.screenshot(path=f'{OUT}/13-shop.png',full_page=True)
    btn=await pg.query_selector('[data-redeem]:not([disabled])')
    if btn:
      await btn.click(); await pg.wait_for_timeout(400); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(600)
      await pg.click('[data-use]'); await pg.wait_for_timeout(300); await pg.click('.modal-bg .btn >> nth=1'); await pg.wait_for_timeout(500)
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
    await pg.click('.tab[data-page=home]'); await pg.wait_for_timeout(400)
    await pg.screenshot(path=f'{OUT}/19-home-after.png',full_page=True)
    st=await pg.evaluate('JSON.parse(localStorage.starbox_v1)')
    print('points',st['points'],'plays',st['plays'],'coupons',[(c['name'],c['used']) for c in st['coupons']],'outbox',len(st['outbox']),'wish sent',[w['sent'] for w in st['wishes']])
    print('ntfy',json.dumps(sent,ensure_ascii=False))
    print('errors',errs)
    await b.close()
asyncio.run(main())
