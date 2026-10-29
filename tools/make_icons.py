# 產生主畫面圖示：python3 tools/make_icons.py .   （在專案根目錄執行，輸出 icon-180/192/512.png）
from PIL import Image, ImageDraw, ImageFilter
import random, math, sys
out=sys.argv[1]
S=1024
img=Image.new('RGB',(S,S)); d=ImageDraw.Draw(img)
top=(11,10,42); mid=(29,20,80); bot=(70,36,125)
for y in range(S):
    t=y/S
    a,b,u=(top,mid,t/.6) if t<.6 else (mid,bot,(t-.6)/.4)
    d.line([(0,y),(S,y)],fill=tuple(int(a[i]+(b[i]-a[i])*u) for i in range(3)))
glow=Image.new('L',(S,S),0); ImageDraw.Draw(glow).ellipse([250,180,800,730],fill=120)
glow=glow.filter(ImageFilter.GaussianBlur(120))
img=Image.composite(Image.new('RGB',(S,S),(255,210,140)),img,glow.point(lambda v:int(v*.35)))
d=ImageDraw.Draw(img); random.seed(7)
for _ in range(70):
    x,y=random.randint(0,S),random.randint(0,S); r=random.choice([2,3,3,4,5])
    d.ellipse([x-r,y-r,x+r,y+r],fill=(255,255,255))
moon=Image.new('L',(S,S),0); md=ImageDraw.Draw(moon)
md.ellipse([270,210,750,690],fill=255); md.ellipse([400,140,860,600],fill=0)
img.paste((255,217,138),mask=moon)
def star(cx,cy,R,col):
    d.polygon([(cx+math.cos(-math.pi/2+i*math.pi/5)*(R if i%2==0 else R*.42), cy+math.sin(-math.pi/2+i*math.pi/5)*(R if i%2==0 else R*.42)) for i in range(10)],fill=col)
star(700,640,70,(255,244,214)); star(790,330,38,(255,158,207)); star(330,780,30,(180,140,255))
for s in (180,192,512):
    img.resize((s,s),Image.LANCZOS).save(f'{out}/icon-{s}.png')
