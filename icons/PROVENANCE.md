# 图片来源

| 文件 | 来源 |
| --- | --- |
| `naiwa-chef.png` | 奶娃大厨形象：项目所有者提供参考图，用 Google Gemini 生成（提示词见 README 里“奶娃大厨”一节的对话记录），原图 `assets/naiwa-chef-original.jpg`；用 `scripts/remove_checker_bg.py` 去掉画进图里的假透明棋盘格背景并缩到 320px 宽。 |
| `naiwa-c1.webp` … `naiwa-r5.webp`, `food-*.webp` | 五个食堂各自的 3D 奶娃（汉堡、拉面、披萨、松饼、沙拉）和飘着的食物：以原来的奶娃为参考，用 Codex 的图片生成工具生成透明背景 PNG，裁边、缩小后转成 WebP。 |
| `icon.svg`, `icon-*.png` | 手绘 SVG 应用图标（碗 + W），PNG 由 Playwright 从 SVG 渲染。 |
