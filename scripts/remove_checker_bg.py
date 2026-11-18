"""把 AI 生成图里“画出来的”透明棋盘格背景去掉，输出真正透明的 PNG。

用法：python scripts/remove_checker_bg.py 输入.jpg 输出.png [输出宽度]
需要：pillow numpy scipy（只在本地处理图片时用，网页本身不需要）
"""
import sys

import numpy as np
from PIL import Image
from scipy import ndimage


def checker_model(gray):
    """从左上角估计棋盘格的格子大小、偏移和两种灰度。"""
    patch = gray[:300, :300]
    row = patch[10] - patch[10].mean()
    best, size = -1e9, 0
    for s in range(8, 120):  # 两个格子一个周期，找自相关最大的周期
        c = np.dot(row[:-2 * s], row[2 * s:]) - np.dot(row[:-s], row[s:])
        if c > best:
            best, size = c, s
    # 找格子边界的偏移：亮度跳变的位置
    edges = np.abs(np.diff(patch[10]))
    off = int(np.argmax(edges[: 2 * size])) + 1
    offy = int(np.argmax(np.abs(np.diff(patch[:, 10]))[: 2 * size])) + 1
    return size, off % size, offy % size


def main(src, dst, out_w=None):
    im = Image.open(src).convert("RGB")
    a = np.asarray(im).astype(np.float32)
    h, w, _ = a.shape
    gray = a.mean(axis=2)
    size, ox, oy = checker_model(gray)
    yy, xx = np.mgrid[0:h, 0:w]
    parity = (((xx - ox) // size) + ((yy - oy) // size)) % 2
    # 两种格子的颜色：在边缘区域按奇偶取中位数
    border = np.zeros((h, w), bool)
    border[:60, :] = border[-60:, :] = border[:, :60] = border[:, -60:] = True
    tone = [np.median(a[border & (parity == p)], axis=0) for p in (0, 1)]
    bg = np.where(parity[..., None] == 0, tone[0], tone[1])
    print(f"格子 {size}px，偏移 ({ox},{oy})，两种颜色 {tone[0].round()} / {tone[1].round()}")

    diff = np.abs(a - bg).max(axis=2)
    sat = a.max(axis=2) - a.min(axis=2)
    ratio = (a / np.maximum(bg, 1)).mean(axis=2)
    # 格子交界处 JPEG 有毛边，先不判断
    gx = np.minimum((xx - ox) % size, size - (xx - ox) % size)
    gy = np.minimum((yy - oy) % size, size - (yy - oy) % size)
    gridline = (gx < 3) | (gy < 3)
    # 在“减去棋盘格之后”的图上算纹理，格子本身的边就不会被当成纹理
    grad = ndimage.gaussian_gradient_magnitude(np.where(gridline, 0, gray - bg.mean(axis=2)), 1.5)
    # 1) 和棋盘格明显不同的像素 → 角色（地上的灰影子除外）
    # 影子是柔和的浅灰：变暗不多、周围没有明显纹理（勺子有高光和深色轮廓，不算影子）
    is_shadow_px = (sat < 16) & (ratio < 0.985) & (ratio > 0.62) & (grad < 9) & (yy > h * 0.6)
    # 背景（包括被影子、倒影染色的地面）= 棋盘格整体乘一个缓慢变化的系数；
    # 角色没有棋盘格那种一格亮一格暗的交替，用这个系数还原不出来
    r = a / np.maximum(bg, 1)
    valid = (~gridline).astype(np.float32)
    win = 2 * size + 1
    rs = np.stack([ndimage.uniform_filter(r[..., c] * valid, win) / np.maximum(ndimage.uniform_filter(valid, win), 1e-3) for c in range(3)], axis=2)
    residual = np.abs(a - bg * rs).max(axis=2)
    bg_like = (residual < 12) & (rs.mean(axis=2) > 0.5)
    fg = (diff >= 10) & ~gridline & ~is_shadow_px & ~bg_like
    fg = ndimage.binary_closing(fg, iterations=4)
    # 1b) 底部的“地板”是透视画法的格子，不在网格上。找出从哪一行开始网格对不上了
    # 只看中间那一片的低饱和像素（背景），网格匹配率明显下降的行就是透视地板
    mid = np.zeros((h, w), bool); mid[:, int(w * 0.12): int(w * 0.88)] = True
    probe = mid & (sat < 20) & ~gridline
    hits = ((diff < 22) & probe).sum(axis=1); tot = probe.sum(axis=1)
    rowfit = np.where(tot > 50, hits / np.maximum(tot, 1), 1.0)
    bad = [y for y in range(int(h * 0.8), h) if rowfit[y] < 0.85]
    y0, y1 = (min(bad) - 20, max(bad) + 30) if bad else (h, h)
    if y0 < h:
        print(f"透视地板：第 {y0}–{y1} 行")
        floor = (yy >= y0) & (yy <= y1)
        # 地板区域只认：有颜色的（脚、奶酪）+ 深色的（勺子、盘子的轮廓），再把轮廓里面填满
        # 身体正下方是影子，只认很深的像素；身体左右两边（勺子、盘子）放宽一些
        ref = max(0, y0 - 250)
        cols = np.flatnonzero(sat[ref] > 60)
        bx0, bx1 = (cols.min(), cols.max()) if cols.size else (0, -1)
        under_body = (xx >= bx0 + 20) & (xx <= bx1 - 20)
        print(f"身体横向范围 {bx0}–{bx1}")
        keep_floor = (sat > 30) | np.where(under_body, gray < 105, gray < 150)
        keep_floor = ndimage.binary_closing(keep_floor & floor, iterations=3)
        keep_floor = ndimage.binary_fill_holes(keep_floor | (fg & ~floor))
        fg = np.where(floor, keep_floor, fg)
    # 2) 去掉小噪点，只留大块（角色、奶酪盘子、勺子）
    lab, n = ndimage.label(fg)
    sizes = ndimage.sum(fg, lab, range(1, n + 1))
    fg = np.isin(lab, 1 + np.flatnonzero(sizes > 3000))
    # 3) 白帽子、白领巾里和白格子撞色的地方是“洞”，补上
    fg = ndimage.binary_fill_holes(fg)
    # 4) 帽子轮廓被白格子啃掉的小缺口：上半部分用圆形闭运算抹平
    disk = np.hypot(*np.mgrid[-14:15, -14:15]) <= 14
    top = np.zeros_like(fg); top[: int(h * 0.36)] = True
    fg = np.where(top, ndimage.binary_fill_holes(ndimage.binary_closing(fg, structure=disk)), fg)
    fg = ndimage.binary_opening(fg, iterations=2)

    alpha = np.where(fg, 255.0, 0.0)
    rgb = a.copy()
    # 5) 影子：角色外面、下半部、比格子暗的灰色像素 → 半透明黑
    shadow = ~fg & (is_shadow_px | bg_like)
    shadow = ndimage.binary_opening(shadow, iterations=2)
    sh = np.clip((1 - ratio) * 255 * 1.4, 0, 150)
    sh = ndimage.gaussian_filter(np.where(shadow, sh, 0), 6)
    alpha = np.where(fg, alpha, 0)  # 影子不保留，网页里用 CSS 画一个柔和的椭圆影子
    rgb[~fg] = 0
    # 边缘羽化
    edge = ndimage.gaussian_filter(np.where(fg, 255.0, 0.0), 1.0)
    alpha = np.where(fg, np.minimum(255, edge * 1.15 + 0), np.maximum(alpha, 0))
    alpha = np.where(fg, np.maximum(alpha, 0), alpha)

    out = np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(out, "RGBA")
    box = img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
    if box:
        pad = 12
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(w, box[2] + pad), min(h, box[3] + pad))
        img = img.crop(box)
    if out_w:
        r = int(out_w) / img.width
        img = img.resize((int(out_w), round(img.height * r)), Image.LANCZOS)
    img.save(dst, optimize=True)
    print("已保存", dst, img.size)


if __name__ == "__main__":
    main(*sys.argv[1:])
