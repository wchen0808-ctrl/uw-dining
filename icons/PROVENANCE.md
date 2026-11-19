# 图片来源

| 文件 | 来源 |
| --- | --- |
| `naiwa-chef.png` | 奶娃大厨形象：项目所有者提供参考图，用 Google Gemini 生成（提示词见 README 里“奶娃大厨”一节的对话记录），原图 `assets/naiwa-chef-original.jpg`；用 `scripts/remove_checker_bg.py` 去掉画进图里的假透明棋盘格背景并缩到 320px 宽。 |
| `naiwa-kick.webp`, `naiwa-serve.webp` | 开场动画里的功夫奶娃（飞踢、扎马步举餐盘）：以 `naiwa-chef.png` 为参考，用 Codex 的图片生成工具生成透明背景 PNG，原图在 `assets/naiwa-kick-original.png`、`assets/naiwa-serve-original.png`；裁边、缩小后转成 WebP。 |
| `icon.svg`, `icon-*.png` | 手绘 SVG 应用图标（碗 + W），PNG 由 Playwright 从 SVG 渲染。 |
