#!/usr/bin/env python3
"""把白底圖片去背成透明 PNG（貼紙風格的白邊會保留）。

用法：
  python3 tools/cutout.py 輸入.jpg 輸出.png            # 單張
  python3 tools/cutout.py --animals                      # 把 assets/animals/*.jpg 全部處理成英文檔名的 PNG

做法：從圖片四邊往內「倒水」（flood fill），把連到邊緣、接近白色的像素變透明，
所以動物身上的白色（肚子、貼紙白邊）不會被挖掉。邊緣會稍微羽化，再裁切到內容、縮到 512px。
需要 Pillow：pip install pillow
"""
import sys, os, glob
from collections import deque
from PIL import Image, ImageFilter

# 中文檔名 → 英文檔名（config.js 的 image 欄位用英文檔名，GitHub Pages 對中文網址比較不友善）
ANIMAL_NAMES = {
    '小鳥': 'bird', '松鼠': 'squirrel', '小兔': 'rabbit', '刺蝟': 'hedgehog', '貓頭鷹': 'owl',
    '小鹿': 'deer', '狐狸': 'fox', '蝴蝶': 'butterfly', '小熊': 'bear', '貓熊': 'panda', '小羊': 'sheep',
}


def cutout(src, dst, tol=38, size=512, pad=8):
    im = Image.open(src).convert('RGB')
    w, h = im.size
    px = im.load()
    bg = px[1, 1]  # 角落當背景色（通常是白）

    def near(p):
        return abs(p[0] - bg[0]) + abs(p[1] - bg[1]) + abs(p[2] - bg[2]) <= tol * 3

    mask = bytearray(w * h)  # 1 = 背景
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if near(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if near(px[x, y]) and not mask[y * w + x]:
                mask[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not mask[i] and near(px[nx, ny]):
                    mask[i] = 1; q.append((nx, ny))

    alpha = Image.frombytes('L', (w, h), bytes(255 - m * 255 for m in mask))
    # 收一點邊再羽化，去掉 JPEG 壓縮在輪廓外留下的淡灰毛邊
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
    out = im.convert('RGBA')
    out.putalpha(alpha)

    box = alpha.getbbox()
    if not box:
        raise SystemExit(f'{src}: 整張都被當成背景了，試試調低 tol')
    out = out.crop(box)
    cw, ch = out.size
    scale = (size - pad * 2) / max(cw, ch)
    out = out.resize((max(1, round(cw * scale)), max(1, round(ch * scale))), Image.LANCZOS)
    canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    # 水平置中、底部對齊（App 的動畫以腳底為支點）
    canvas.paste(out, ((size - out.width) // 2, size - pad - out.height), out)
    # 量化成 256 色（保留透明），檔案會小到原本的 1/3 左右，肉眼看不出差別
    canvas.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG).save(dst, optimize=True)
    return canvas


def main():
    args = sys.argv[1:]
    if args[:1] == ['--animals']:
        root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'animals')
        for src in sorted(glob.glob(os.path.join(root, '*.jp*g')) + glob.glob(os.path.join(root, '*.jpeg'))):
            stem = os.path.splitext(os.path.basename(src))[0]
            name = ANIMAL_NAMES.get(stem.replace('-blink', ''), stem)
            if stem.endswith('-blink'):
                name += '-blink'
            dst = os.path.join(root, name + '.png')
            cutout(src, dst)
            print(f'{os.path.basename(src)} -> {os.path.basename(dst)}  ({os.path.getsize(dst) // 1024} KB)')
        return
    if len(args) != 2:
        print(__doc__); sys.exit(1)
    cutout(args[0], args[1])
    print('ok ->', args[1])


if __name__ == '__main__':
    main()
